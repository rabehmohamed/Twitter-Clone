const mongoose = require('mongoose');
const User = require('./userModel');

const tweetSchema = new mongoose.Schema({
    content : 
    {
      type : String,
      required : true,
      maxlength: 250,
    },
    postedBy : 
    {
        type : mongoose.Schema.ObjectId,
        ref : 'User',
        required : true,
    },
    retweetedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    photos : 
    {
        type : [String],
        validate: [
            {
              validator: function (photos) {
                return photos.length <= 4;
              },
              message: 'A maximum of 4 photos is allowed.',
            },
          ],
    },
    comments : [{
        text : String,
        postedBy : 
        {
            type : mongoose.Schema.ObjectId,
            ref : 'User',
            required : true,
        },
        postedAt :
        {
            type: Date,
            default: Date.now,
        },
    }],
    likes : [{
        type : mongoose.Schema.ObjectId,
        ref : 'User'
    }],
    postedAt : 
    {
        type : Date,
        default : Date.now()
    },
    deleted : 
    {
        type : Boolean,
        default : false,
        select : false
    }
},
{
    toJSON : { virtuals : true},
    toObject  : { virtuals : true}
}
);
tweetSchema.index({ content: 'text' });

tweetSchema.pre(/^find/ , function(next){
    this.populate({
        path : 'postedBy',
        select :'name'
    }).populate({
        path : 'comments.postedBy',
        select : 'name'
    });
    next();
})


const Tweet = mongoose.model('Tweet' , tweetSchema);

module.exports = Tweet;