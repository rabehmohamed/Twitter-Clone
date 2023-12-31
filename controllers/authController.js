const dotenv = require('dotenv');
dotenv.config({path : './config.env'});
const User = require('../models/userModel');
const { promisify } = require('util');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const appError = require('./../utils/appError');
const axios = require('axios');

const signToken = id => {
    return jwt.sign({ id : id } , process.env.JWT_SECRET , {
        expiresIn : process.env.JWT_EXPIRES_IN
    });
}

const createSendToken = (user , statusCode , res) => {
    const token = signToken(user._id);

    const cookieOptions =  {
        expires : new Date( Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly : true
    };
    if(process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    res.cookie('jwt', token , cookieOptions); 
    
    res.status(statusCode).json({
        status : 'success', 
        token      
    })
}

exports.signup = catchAsync ( async (req, res, next) => {
    const newUser = await User.create(req.body);
    
    createSendToken(newUser , 201 , res);
});

exports.login = catchAsync ( async (req, res, next) =>{
    const {email , password} = req.body; 
    if(!email || !password){
        return next(new appError('please provide email and password') , 400);
    }
    
    const user = await User.findOne({email : email}).select('+password');

    if(!user || !await user.correctPassword(password , user.password)){
        return next(new appError('Incorrect Email or password') , 401);
    }
    createSendToken(user , 200 , res);

});

exports.protect = catchAsync( async (req,res,next) => {
    let token;
    if(req.headers.authorizations || req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
    }
    else if (req.cookies.jwt){
        token = req.cookies.jwt;
    }
    if(!token){
        return next(new appError(`You are not logged in , Please login to access `) , 401);
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const freshUser = await User.findById(decoded.id);

    if(!freshUser){
        return next(new appError('The user does not exist'));
    }
   
    req.user = freshUser ; 
    next();
})

exports.restrictTo = (...roles) => {
    return (req,res,next) => {
        if(!roles.includes(req.user.role)){
            return next(new appError('You do not have permission ') , 403);
        }
        next();
    }
}

exports.forgetPassword = catchAsync(async (req,res,next) => {
    const user = await User.findOne({email : req.body.email});
    if(!user){
        return next(new appError ('This user does not exist'), 404 );
    }

    const resetToken = user.createPassResetToken();
    await user.save({validateBeforeSave : false});

    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}` ; 
    const message = `Forgot you password ? Submit with your new password to : ${resetURL}`;

    try {

        await sendEmail({
            email : user.email,
            subject : 'Your password reset {valid for 10 minutes}',
            message
        });
        res.status(200).json({
            status : 'success',
            message : 'Token sent to email!'
        });
    }
    catch(err){
       // user.passwordResetToken = undefined ;
       // user.passwordResetExpires = undefined ;
        await user.save({validateBeforeSave : false});

        return next(new appError('There was an error sending the email , Try again Later'), 500);
    } 
})

exports.resetPassword = catchAsync(async (req,res,next) => {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
        passwordResetToken : hashedToken
    });
    if(!user || (Date.now() > user.passwordResetExpires)){
        return next(new appError('Token is invalid or has expired'), 400);
    }

    user.password = req.body.password ;
    user.passwordConfirm = req.body.passwordConfirm ;
    user.passwordChangedAt = Date.now() - 1000;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    createSendToken(user , 200 , res);

});

exports.updatePassword = catchAsync ( async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');

    if(!( await user.correctPassword(req.body.currentPassword , user.password) )){
        return next(new appError('You entered wrong password'), 401);
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    createSendToken(user , 200 , res);
});

//1st part : GET AUTH CODE REQUEST
exports.getOAuth = catchAsync(async (req,res,next)=>{
    const googleAuthUrl = 'https://accounts.google.com/o/oauth2/auth';
    const queryParams = new URLSearchParams({
        client_id: process.env.OAUTH_CLIENT_ID,
        redirect_uri: 'http://localhost:5000/auth/google/callback',
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
    });

    const authUrl = `${googleAuthUrl}?${queryParams}`;
    res.redirect(authUrl);
})
//2nd part : EXCHANGE AUTH CODE , GET ACCESS TOKEN , GET USER INFO
exports.OUathCallback = catchAsync(async (req,res,next) => {
    const { code } = req.query;
    const googleTokenUrl = 'https://oauth2.googleapis.com/token';

    const tokenResponse = await axios.post(googleTokenUrl, null, {
        params: {
          code,
          client_id: process.env.OAUTH_CLIENT_ID ,
          client_secret: process.env.OUATH_CLIENT_SECRET,
          redirect_uri: 'http://localhost:5000/auth/google/callback',
          grant_type: 'authorization_code',
        },
      });

      const googleTokenData = tokenResponse.data;
      const googleUserInfoUrl = 'https://www.googleapis.com/oauth2/v3/userinfo';

      const userInfoResponse = await axios.get(googleUserInfoUrl, {
        headers: {
          Authorization: `Bearer ${googleTokenData.access_token}`,
        },
      });

      const userData = userInfoResponse.data;
      const existingUser = await User.findOne({ email: userData.email });

    if (existingUser) {
        res.status(200).json({
            message: 'success',
            data: existingUser,
        });
    } 
    else {
        const newUser = new User({
            email: userData.email,
            name: userData.name,
        });
        const savedUser = await newUser.save();
        res.status(200).json({
            message : 'sucess',
            data : savedUser,
      });
    }
})