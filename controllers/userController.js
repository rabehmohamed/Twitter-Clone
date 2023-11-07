const User = require('../models/userModel');
const Tweet = require('../models/tweetModel');
const catchAsync = require('../utils/catchAsync');
const s3 = require('../utils/s3');
const redisClient = require('../utils/redis');
const invalidate = require('./invalidateController');
const axios = require('axios');

exports.getProfile = catchAsync(async (req,res,next) => {
    const userId = req.user.id; 
    const cacheKey = `user:${userId}`;

    const retrievedUser = await redisClient.get(cacheKey);
    if(retrievedUser != null){
        const cachedUser = JSON.parse(retrievedUser);
        const tweetPromises = cachedUser.tweets.map(async (tweetId) => {
            const tweetKey = `tweet:${tweetId}`;
            const tweetData = await redisClient.get(tweetKey);
            return JSON.parse(tweetData);
          });
      
        const cachedTweets = await Promise.all(tweetPromises);
        cachedUser.tweets = cachedTweets;
        res.status(200).json({
            status: 'success',
            message : 'from cache',
            data: cachedUser,
            });
    }
    else 
    {

        const user = await User.findById(userId);
        await redisClient.set(cacheKey, JSON.stringify(user), 'EX', 2000);
        for (const tweetId of user.tweets) {
            const tweetKey = `tweet:${tweetId}`;
            const tweet = await Tweet.findById(tweetId);
            await redisClient.set(tweetKey, JSON.stringify(tweet), 'EX', 2000);
          }
        const userRes = await User.findById(userId).populate('tweets')
        res.status(200).json({
            status: 'success',
            message : 'from db',
            data: userRes ,
        });
    }
}); 

exports.followingList = catchAsync(async(req,res,next) => {
    const userId = req.user.id;
    const cacheKey = `user:${userId}`

    const cachedUser = await redisClient.get(cacheKey);

    if(cachedUser != null){
        const user = JSON.parse(cachedUser);
        const followingList = user.following;
        res.status(200).json({
            status: 'success',
            message : 'from cache',
            data: followingList,
            });
    }
    else 
    {
        const user = await User.findById(userId).populate({path : 'following' , model : 'User' , select : 'name'});
        await redisClient.set(cacheKey, JSON.stringify(user), 'EX', 2000);

        res.status(200).json({
            status: 'success', 
            message : 'from db',
            data: user.following,
        });
    }
});

exports.followersList = catchAsync(async(req,res,next) => {
    const userId = req.user.id;
    const cacheKey = `user:${userId}`

    const cachedUser = await redisClient.get(cacheKey);

    if(cachedUser != null){
        const user = JSON.parse(cachedUser);
        const followersList = user.followers;
        res.status(200).json({
            status: 'success',
            message : 'from cache',
            data: followersList,
            });
    }
    else 
    {
        const user = await User.findById(userId).populate({path : 'followers' , model : 'User' , select : 'name'});
        await redisClient.set(cacheKey, JSON.stringify(user), 'EX', 2000);

        res.status(200).json({
            status: 'success', 
            message : 'from db',
            data: user.followers,
        });
    }
});

exports.follow = catchAsync(async (req,res,next) =>{
    const userId = req.user.id ;
    const followedUser = req.params.id;

    const user = await User.findById(userId);
    if (user.following.includes(followedUser)) {
        return res.status(400).json({
          status: 'error',
          message: 'You are already following this user.',
        });
    }

    const updateUser = await User.findByIdAndUpdate(userId,{ $push : {following : followedUser}} , {new : true});
    await User.findByIdAndUpdate(followedUser, {$push : {followers :userId }} );

    await redisClient.set(`user:${userId}`,JSON.stringify(updateUser),'EX' , 2000);
    
    res.status(201).json({
        status: 'success',
        data: updateUser,
      });
});

exports.unFollow = catchAsync(async (req,res,next) => {
    const userId = req.user.id ;
    const followedUser = req.params.id;

    const user = await User.findById(userId);
    if (!user.following.includes(followedUser)) {
        return res.status(400).json({
          status: 'error',
          message: 'You are not following this user.',
        });
    }

    const updateUser = await User.findByIdAndUpdate(userId,{ $pull : {following : followedUser}} , {new : true});
    await User.findByIdAndUpdate(followedUser, {$pull : {followers :userId }} );
    await redisClient.set(`user:${userId}`,JSON.stringify(updateUser),'EX' , 2000);

    res.status(200).json({
        status: 'you have unfollowed this user',
        data: updateUser,
      });
});

exports.addProfilePhoto = catchAsync(async (req,res,next)=>{
    const file = req.file;
    const result = await s3.uploadFile(file);
    const user = await User.findByIdAndUpdate(req.user.id , {profilePhoto : result.key} , {new : true});
    await redisClient.set(`user:${req.user.id}`,JSON.stringify(user),'EX' , 2000);

    res.status(201).json({
        status: 'success',
        data: user,
      });
})

exports.getProfilePhoto = catchAsync(async (req,res,next) => {
    const user = await User.findById(req.user.id);
     /*AWS S3
      const key = user.profilePhoto;    
      const readStream = await s3.getFile(key);
      readStream.pipe(res); */

     // CLOUDFRONT CDN
     const imageUrl = 'https://dr00nzbbkm6m6.cloudfront.net/' + user.profilePhoto;

     axios.get(imageUrl, { responseType: 'arraybuffer' })
     .then(response => {
         res.setHeader('Content-Type', 'image/jpeg'); 
         res.send(Buffer.from(response.data, 'binary'));
     })
     .catch(error => {
         res.status(500).json({
             status: 'error',
             message: 'Error fetching the image',
         });
     });
    
});

exports.deleteProfilePhoto = catchAsync(async(req,res,next)=> {
    const userId = req.user.id;
    const user = await User.findById(req.user.id);
    const key = user.profilePhoto; 

    if(key){
        await s3.deleteFile(key);
        user.profilePhoto = null;
        const updateUser = await User.findByIdAndUpdate(req.user.id , {profilePhoto : null});
        await redisClient.set(`user:${userId}`,JSON.stringify(user),'EX' , 2000);
        
        res.status(204).json({
            status: 'success',
            message: 'Profile photo deleted successfully',
        });
    }

});

exports.deletMe = catchAsync( async (req, res, next) => {
    await invalidate.invalidateUserCache(req.user.id);
    await User.findByIdAndUpdate(req.user.id , {active : false});

    res.status(204).json({
        status : 'success',
        data : null
    });
});

exports.updateMe = catchAsync( async(req, res, next) => {
    
    if(req.body.password || req.body.passwordConfirm){
        return next(new appError('This route is not for password update') , 400);
    }

    const filteredBody = filterObj(req.body , 'name' , 'email');
    if(req.file) filteredBody.photo = req.file.filename;

    const updatedUser = await User.findByIdAndUpdate(req.user.id , filteredBody , {
        new : true, 
        runValidators : true
    });
    await redisClient.set(`user:${req.user.id}` , JSON.stringify(updatedUser));
    res.status(200).json({
        status : 'success',
        message : 'Info Updated',
        updatedUser
    });

});







