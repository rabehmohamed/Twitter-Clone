const express = require('express');
const authController = require('../controllers/authController');
const tweetController = require('../controllers/tweetController');
const userController = require('../controllers/userController');
const multerConfig = require('../utils/multerConfig');

const router = express.Router();

router.post('/signup' , authController.signup);
router.post('/login' , authController.login);
//router.post('/forgotPassword' , authController.forgotPassword);
router.patch('/resetPassword/:token' , authController.resetPassword);

router.use(authController.protect);

router.patch('/updatePassword'  , authController.updatePassword);

router.patch('/follow/:id' , userController.follow);
router.patch('/unFollow/:id' , userController.unFollow);

router.get('/profile'  ,userController.getProfile);
router.post('/profilePhoto' , multerConfig.uploadSingleImg() ,userController.addProfilePhoto);
router.get('/profilePhoto' ,userController.getProfilePhoto);
router.delete('/profilePhoto',userController.deleteProfilePhoto);
router.get('/following' , userController.followingList);
router.get('/followers' , userController.followersList);

router.get('/find',userController.searchByName);
router.get('/auth/google',authController.getOAuth);
router.get('/auth/google/callback',authController.OUathCallback);


module.exports = router;