const Redis = require('ioredis');
const logger = require('../utils/logger');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * BullMQ yêu cầu một kết nối Redis riêng biệt (không dùng chung với cache).
 * Cấu hình đặc biệt: maxRetriesPerRequest = null (bắt buộc cho BullMQ Worker).
 */
const createBullMQConnection = () => {
  return new Redis(REDIS_URL, {
    maxRetriesPerRequest: null, // BẮT BUỘC: BullMQ Worker sẽ lỗi nếu không có dòng này
    enableReadyCheck: false,
    retryStrategy(times) {
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
  });
};

/**
 * Cấu hình mặc định cho các Job trong hàng đợi.
 * - attempts: Số lần thử lại khi job thất bại
 * - backoff: Thời gian chờ giữa các lần retry (tăng dần theo cấp số nhân)
 * - removeOnComplete: Tự động dọn dẹp job đã hoàn thành sau 24 giờ
 * - removeOnFail: Giữ lại job lỗi trong 7 ngày để debug
 */
const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000, // Lần retry đầu: 5s, lần 2: 10s, lần 3: 20s
  },
  removeOnComplete: {
    age: 86400, // Xóa job thành công sau 24 giờ
    count: 100, // Giữ tối đa 100 job gần nhất
  },
  removeOnFail: {
    age: 604800, // Giữ job lỗi 7 ngày
  },
};

module.exports = { createBullMQConnection, defaultJobOptions, REDIS_URL };
