const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({path : './config.env'});
const app = require('./app');


const port = process.env.PORT || 5000;

const DB = process.env.DATABASE.replace(
    '<password>' ,
    process.env.DATABASE_PASSWORD
    );

mongoose.connect(DB)
    .then(() => {
        console.log('DB connection Successful');
});


  

const server = app.listen(port, ()=>{
    console.log(`App running on port ${port}....`);
});


/* const io = require('socket.io')(server);
io.on('connection', ()=>{
    console.log('socket working');
}) */

