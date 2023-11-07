const mongoose = require('mongoose');
const crypto = require('crypto');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name :
    {
        type : String , 
        required : [true , 'user must have a name'],
    },
    email : 
    {
        type : String ,
        required : [true , 'user must have an email'],
        unique : true , 
        lowercase : true,
        validate : [validator.isEmail ,'please provide a valid email'],
    },
    password : 
    {
        type : String,
        required : [true , 'user must have a password'],
        minlength : 8,
        select : false
    },
    passwordConfirm : 
    {
        type : String,
        required : [true , 'please confirm your password'],
        // validate works on save() , create() - doesn't work on findByIdAndUpdate
        validate : 
        {
            validator : function (el) {
                return el === this.password;
            },
            message : 'passwords match match'
        }
    },
    tweets : [{
        type : mongoose.Schema.ObjectId,
        ref : 'Tweet'
    }] ,
    profilePhoto : 
    {
        type : String,
        //default : 'default.jpg'
    } , 
    coverPhoto : 
    {
        type : String,
        //default : 'default.jpg'
    } , 
    bio : 
    {
        type : String,
        
    },
    followers : [{
        type : mongoose.Schema.ObjectId,
        ref : 'User'
    }],
    following : 
    [{
        type : mongoose.Schema.ObjectId,
        ref : 'User'
    }],
    passwordResetToken : 
    {
       type : String,
       select : false
    },
    passwordResetExpires :
    {
        type : Date,
        select : false
     },
    passwordChangedAt : Date,
    active : 
    {
        type : Boolean,
        default : true,
        select : false
    }
});

userSchema.pre('save', async function(next) {
    //only run if password field modified
    if(!this.isModified('password')) return next();
    //12 : no of rounds used for hashing
    this.password = await bcrypt.hash(this.password , 12);
    this.passwordConfirm = undefined;

    next();
});

userSchema.pre(/^find/ , function(next) {
    this.find({ active : {$ne : false} });
    next();
});

userSchema.virtual('userTweets', {
    ref : 'Tweet',
    localField : '_id',
    foreignField : 'postedBy'
})


userSchema.methods.correctPassword = async function (enteredPassword , userPassword){
    return await bcrypt.compare(enteredPassword , userPassword);
}


userSchema.methods.createPassResetToken = function(user){
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 *1000;

    return resetToken; 
}


userSchema.virtual('tweetsCount').get(function(){
    return this.tweets.length;
});

userSchema.virtual('followingCount').get(function(){
    return this.following.length;
});

userSchema.virtual('followersCount').get(function(){
    return this.followers.length;
});


const User = mongoose.model('User' , userSchema);

module.exports = User;