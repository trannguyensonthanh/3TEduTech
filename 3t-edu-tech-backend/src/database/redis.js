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
    /* [THÊM 17/08/2026 — LEVEL 3] rateLimit.middleware dùng incr/expire.
       Thiếu hai hàm này thì client giả ném TypeError ở MỌI request có giới hạn
       tần suất — middleware có bắt lỗi và cho qua, nhưng log sẽ ngập cảnh báo
       giả và che mất sự cố thật. Trả 0 nghĩa là "chưa từng gọi", tức là luôn
       cho qua — đúng với chủ trương fail-open khi Redis không dùng được. */
    incr: async () => 0,
    expire: async () => {},
    /* [THÊM 18/08/2026 — COURSE IMPORT] importStore dùng set/sadd/smembers/srem.
       Thiếu chúng thì client giả ném TypeError ("redisClient.sadd is not a
       function") — một lỗi TRÔNG NHƯ lỗi lập trình chứ không phải như "Redis
       đang hỏng", khiến người đi sửa lần theo sai hướng ngay từ đầu.

       ⚠️ KHÁC với incr/expire ở trên: tính năng nhập khóa học KHÔNG thể chạy
       khi không có Redis (toàn bộ trạng thái job nằm ở đó). Nên các hàm này
       trả về giá trị "rỗng" để lỗi hiện ra đúng bản chất — không tìm thấy job,
       không lấy được khóa — chứ KHÔNG giả vờ thành công rồi mất dữ liệu. Đây
       là fail-safe, ngược với chủ trương fail-open của phần giới hạn tần suất. */
    set: async () => null, // SET ... NX luôn thất bại → không ai lấy được khóa
    sadd: async () => 0,
    smembers: async () => [],
    srem: async () => 0,
  };
}

module.exports = redisClient;
