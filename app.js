const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');

const userRouter = require('./routes/userRoutes');
const tweetRouter = require('./routes/tweetRoutes');
const appError = require('./utils/appError');
const errorHandler = require('./controllers/errorController');

const app = express();
app.use(cors());
//app.use(express.static('public'));
if(process.env.NODE_ENV === "development"){
    app.use(morgan('dev'));
}
// Set Security HTTP Headers
app.use(helmet({
    contentSecurityPolicy: false
}));
const limiter = rateLimit({
    // max -> 100 requests from same ip , windowMs -> one hour
    max : 1000,
    windowMs : 60*60*1000, // 1 hour
    message : 'Too many requests from this IP , please try again in an hour!'
});
//Limit requests from same API
app.use('/',limiter);
// Body parser , reading data from body into req.body
app.use(express.json({ limit : '10kb' }));
app.use(express.urlencoded({ extended : true , limit :'10kb'}));
app.use(express.json());
// Data sanitization : against noSql query injection 
app.use(mongoSanitize());
// Data sanitization : (cross-stie scripting)
app.use(xss());
// Prevent parameter pollution
app.use(hpp({
    whitelist : ['duration' , 'ratingsAverage' , 'ratingsQuantity' , 'maxGroupSize' , 'difficulty' , 'price']
}));
// reduce size of http responses 
app.use(compression());

app.use('/users' , userRouter);
app.use('/tweets' ,tweetRouter);

app.all('*',(req, res, next)=>{
    next(new appError(`Can't find ${req.originalUrl} on this server`));
});

app.use(errorHandler , (err)=>{
    console.err(err.stack);
});

module.exports = app;