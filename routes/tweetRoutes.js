const express = require('express');
const authController = require('../controllers/authController');
const tweetController = require('../controllers/tweetController');
const userController = require('../controllers/userController');
const multerConfig = require('../utils/multerConfig');
const router = express.Router();

router.use(authController.protect);

router.post('/postTweet' ,multerConfig.uploadMultiImgs(), tweetController.createTweet);
router.get('/getTweet/:id' , tweetController.getTweet);
router.get('/getTweets/' , tweetController.getAllTweets);
router.delete('/deleteTweet/:id' , tweetController.deleteTweet);
router.patch('/likeTweet/:id' , tweetController.likeTweet);
router.patch('/commentOnTweet/:id' , tweetController.commentOnTweet);

router.patch('/retweet/:id' , tweetController.retweet);
router.patch('/untweet/:id' , tweetController.untweet);
router.get('/getLikes/:id' , tweetController.getLikes);
router.get('/getComments/:id' , tweetController.getComments);
router.get('/getRetweets/:id' , tweetController.getRetweets);
router.get('/searchContent', tweetController.searchByContent);

module.exports = router;