const Tweet = require('../models/tweetModel');
const factory = require('../controllers/handleFactory');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const redisClient = require('../utils/redis');
const invalidate = require('./invalidateController');
const s3 = require('../utils/s3');

exports.createTweet = catchAsync(async(req,res,next)=>{
    const userId = req.user.id;
    const data = {
        ...req.body , 
        postedBy : userId
    };

    const tweet = await Tweet.create(data);
    if(req.files && req.files.images && req.files.images.length > 0){
        const images = req.files.images;
        const uploadResults = await Promise.all(
            images.map(async (image) => {
              const result = await s3.uploadFile(image);
              return result.key;
            })
          ); 
          tweet.photos = uploadResults;
          await tweet.save();
    }
    const updatedUser = await User.findByIdAndUpdate(userId , { $push : { tweets : tweet._id }} , {new : true});
    await redisClient.set(`user:${userId}`, JSON.stringify(updatedUser), 'EX', 2000);
    await redisClient.set(`tweet:${tweet._id}`, JSON.stringify(tweet), 'EX', 2000);

    /* const followers = req.user.followers;
    followers.forEach((followerId) => {
        io.to(followerId).emit('newTweet', tweet);
    });
    io.to(userId).emit('newTweet', tweet); */

    res.status(201).json({
        status: 'success',
        data: tweet,
      });
});

exports.getTweet = catchAsync (async (req,res,next) => {
    const tweetId = req.params.id;
    const cacheKey = `tweet:${tweetId}`;
    const Cachedtweet = await redisClient.get(cacheKey);
    
    if(Cachedtweet != null){
        const tweet = JSON.parse(Cachedtweet);
        await getTweetPhotos(tweet);
        res.status(200).json({
            status: 'success',
            message : 'from cache',
            data: tweet,
          });
    }
    else {
        const tweet = await Tweet.findById(tweetId);
        await getTweetPhotos(tweet); 
        await redisClient.set(cacheKey, JSON.stringify(tweet), 'EX', 2000);

        res.status(200).json({
            status: 'success',
            message : 'from db',
            data: tweet,
            imgs : tweet.urls
        });
    }
});

exports.likeTweet = catchAsync(async (req,res,next) => {
    const tweet = await Tweet.findByIdAndUpdate(req.params.id , { $push: { likes: req.user.id } },
        { new: true });
    
    res.status(201).json({
        status: 'success',
        data: tweet,
      });
})

exports.deleteTweet = catchAsync (async (req,res,next) => {
  const tweetId = req.params.id
  console.log('1');
  invalidate.invalidateTweetCache(tweetId);
  const tweet = await Tweet.findByIdAndDelete(tweetId);
  res.status(200).json({
    status : 'success',
    data : tweet
});
})

exports.commentOnTweet = catchAsync(async (req,res,next) => {
    const user = req.user.id;
    const text = req.body.text;
    const tweet = await Tweet.findByIdAndUpdate(req.params.id , { $push : {comments :{postedBy:user , text:text}} },
        { new: true });
    
    res.status(201).json({
        status: 'success',
        data: tweet,
      });
})

exports.retweet = catchAsync(async (req,res,next) => {
    await User.findByIdAndUpdate(req.user.id , { $push : { tweets : req.params.id }} , {new : true});
    const tweet = await Tweet.findByIdAndUpdate(req.params.id , { $push : {retweetedBy : req.user.id }} , {new : true});
    res.status(201).json({
        status: 'success',
        data: tweet,
      });
})

exports.untweet = catchAsync(async (req,res,next)=> {
    const tweetId = req.params.id;
    const userId = req.user.id;
    const user = await User.findById(userId);

    if(!user.tweets.includes(tweetId)){
        return res.status(400).json({
            status: 'error',
            message: `It's not in your tweets`,
          });
    }

    await User.findByIdAndUpdate(userId , { $pull : {tweets : tweetId}} , {new : true});
    res.status(201).json({
        status: 'success',
        data: user.tweets,
      });
})

exports.getLikes = catchAsync(async (req,res,next) => {
    const tweet = await Tweet.findById(req.params.id , 'likes').populate('likes', 'name');
    const likes = tweet.likes;
    res.status(201).json({
        status: 'success',
        data: likes,
      });
})

exports.getComments = catchAsync(async (req,res,next) => {
    
    const tweet = await Tweet.findById(req.params.id , 'comments')
            .populate({path: 'postedBy' , select : 'name'});
    const comments = tweet.comments;
    res.status(201).json({
        status: 'success',
        data: comments,
      });
})

exports.getRetweets = catchAsync(async (req,res,next) => {
    const usersRetweeted = await Tweet.findById(req.params.id, 'retweetedBy').populate({path : 'retweetedBy', select : 'name'});
    res.status(201).json({
        status: 'success',
        data: usersRetweeted,
      });
})

exports.getAllTweets = factory.getAll(Tweet);

exports.updateTweet = factory.updateOne(Tweet);

 
async function getTweetPhotos(tweet) {
    if (tweet.photos.length > 0) {
      const imgs = await Promise.all(
        tweet.photos.map((imgKey) => {
          return 'https://dr00nzbbkm6m6.cloudfront.net/' + imgKey;
        }));
      tweet.urls = imgs;
    }
}


