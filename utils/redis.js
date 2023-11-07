const redisClient = require('redis').createClient(process.env.REDIS_PORT, process.env.HOST);

redisClient.connect();
redisClient.on('connect', () => {
    console.log('redis connected'); 
});

module.exports = redisClient;