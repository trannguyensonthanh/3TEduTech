const Redis = require('ioredis');
const redisClient = new Redis('redis://localhost:16379');
redisClient.flushall().then(() => {
  console.log('Cache cleared successfully!');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
