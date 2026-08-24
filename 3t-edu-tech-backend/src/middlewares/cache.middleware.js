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

    /* Tạo khóa duy nhất dựa trên URL + query params + tiền tệ + DANH TÍNH.

       [SỬA 19/08/2026] Bổ sung chiều danh tính vào khóa. Trước đây khóa chỉ
       gồm URL và tiền tệ, trong khi các tuyến được gắn cache lại trả dữ liệu
       phụ thuộc người gọi: nội dung bài học đầy đủ hay bị che, cờ đã ghi danh,
       tiến độ học, và với giảng viên là cả khóa học chưa xuất bản. Hệ quả:
       phản hồi của một học viên đã mua bị phục vụ lại cho khách vãng lai
       trong suốt thời gian còn hiệu lực của bộ đệm. */
    const currency = (req.header('X-Currency') || 'VND').trim().toUpperCase();
    const identity = req.user
      ? `u${req.user.id}:${req.user.role}`
      : 'anon';
    const key = `cache:${identity}:${req.originalUrl}:curr:${currency}`;

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
    // Tương thích ngược: Bổ sung wildcard cho identity nếu pattern cũ được sử dụng
    if (pattern.startsWith('cache:/v1/')) {
      pattern = pattern.replace('cache:/v1/', 'cache:*:/v1/');
    }

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
