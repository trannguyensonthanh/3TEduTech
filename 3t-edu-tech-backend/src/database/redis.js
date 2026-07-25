const Redis = require('ioredis');
const logger = require('../utils/logger');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient;

try {
  redisClient = new Redis(REDIS_URL, {
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    lazyConnect: false,
  });

  redisClient.on('connect', () => {
    logger.info('\u{1F680} Redis In-Memory Cache connected successfully!');
  });

  redisClient.on('error', (err) => {
    logger.error('\u{274C} Redis connection error:', err.message);
  });

  redisClient.on('close', () => {
    logger.warn('Redis connection closed.');
  });
} catch (error) {
  logger.error('Failed to initialize Redis client:', error.message);
  // Create a dummy client that always returns null (graceful degradation)
  redisClient = {
    get: async () => null,
    setex: async () => {},
    del: async () => {},
    keys: async () => [],
    quit: async () => {},
  };
}

module.exports = redisClient;
