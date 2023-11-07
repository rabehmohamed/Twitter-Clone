const redisClient = require('../utils/redis');

exports.invalidateTweetCache = (tweetId) => {
  const cacheKey = `tweet:${tweetId}`;
  redisClient.del(cacheKey, (err, reply) => {
    if (err) {
      console.error('Error deleting cache:', err);
    } else {
      console.log('Cache deleted successfully:', reply);
    }
  });
  }


  exports.invalidateUserCache = (userId) => {
    const cacheKey = `user:${userId}`;
    redisClient.del(cacheKey, (err, reply) => {
      if (err) {
        console.error('Error deleting cache:', err);
      } else {
        console.log('Cache deleted successfully:', reply);
      }
    });
    }
  