const redisClient = require('../database/redis');
const logger = require('../utils/logger');

/**
 * Middleware Cache-Aside Pattern.
 * Chặn trước route GET để kiểm tra Redis trước khi xuống DB.
 * @param {number} ttlSeconds - Thời gian sống của cache (giây). Mặc định 1800s = 30 phút.
 */
const cache = (ttlSeconds = 1800) => {
  return async (req, res, next) => {
    // Chỉ cache cho các yêu cầu GET
    if (req.method !== 'GET') {
      return next();
    }

    // Tạo khóa duy nhất dựa trên URL + query params + tiền tệ (X-Currency)
    const currency = (req.header('X-Currency') || 'VND').trim().toUpperCase();
    const key = `cache:${req.originalUrl}:curr:${currency}`;

    try {
      const cachedData = await redisClient.get(key);

      if (cachedData) {
        // CACHE HIT - Trả về từ RAM, không cần chạm MSSQL
        logger.debug(`Cache HIT: ${key}`);
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(JSON.parse(cachedData));
      }

      // CACHE MISS - Đi qua Controller xuống MSSQL
      logger.debug(`Cache MISS: ${key}`);

      // Override res.json để bắt kết quả và lưu vào Redis
      const originalJson = res.json.bind(res);

      res.json = (body) => {
        // Chỉ lưu cache khi response thành công (2xx)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisClient
            .setex(key, ttlSeconds, JSON.stringify(body))
            .catch((err) => {
              logger.error(`Failed to set cache key ${key}:`, err.message);
            });
        }

        res.setHeader('X-Cache', 'MISS');
        return originalJson(body);
      };

      next();
    } catch (error) {
      // Nếu Redis gặp trục trặc, bỏ qua cache và cho request đi thẳng xuống DB
      logger.error('Redis cache middleware error:', error.message);
      next();
    }
  };
};

/**
 * Xóa bộ nhớ đệm theo mẫu tiền tố khóa (Cache Invalidation).
 * Gọi hàm này khi có thao tác thêm/sửa/xóa dữ liệu.
 * @param {string} pattern - Mẫu khóa cần xóa (VD: 'cache:/v1/courses*')
 */
const clearCache = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
      logger.info(`\u{1F9F9} Cache invalidated: ${pattern} (${keys.length} keys cleared)`);
    }
  } catch (error) {
    logger.error('Error clearing cache:', error.message);
  }
};

module.exports = { cache, clearCache };
