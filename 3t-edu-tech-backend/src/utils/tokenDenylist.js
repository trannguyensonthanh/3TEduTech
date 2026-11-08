const redisClient = require('../database/redis');
const jwtConfig = require('../config/jwt');
const logger = require('./logger');

const KEY_PREFIX = 'auth:revoked-refresh:';

/**
 * Danh sách thẻ làm mới đã bị thu hồi.
 *
 * Vì sao cần: refresh token là JWT không trạng thái, trước đây đăng xuất chỉ
 * xóa cookie phía trình duyệt. Một thẻ đã bị sao chép vẫn dùng được cho tới khi
 * hết hạn (mặc định vài ngày) dù người dùng đã bấm đăng xuất.
 *
 * Chỉ lưu `jti` chứ không lưu cả thẻ, và đặt TTL đúng bằng thời gian còn lại
 * của thẻ — hết hạn thì bản ghi tự biến mất, danh sách không phình to.
 *
 * ⚠️ Khi Redis không dùng được, redis.js trả về một client giả với get() => null,
 * nghĩa là mọi thẻ đều được coi là chưa thu hồi (fail-open). Đây là đánh đổi có
 * chủ ý, đồng nhất với phần còn lại của dự án: Redis hỏng thì hệ thống vẫn đăng
 * nhập được thay vì chết hẳn.
 */

/**
 * Thu hồi một thẻ làm mới dựa trên payload đã giải mã.
 * @param {object} payload - Payload JWT đã verify (cần có jti và exp).
 * @returns {Promise<boolean>} - true nếu đã ghi nhận thu hồi.
 */
const revokeRefreshToken = async (payload) => {
  // Thẻ cấp trước bản này không có jti nên không thu hồi được; chúng sẽ tự hết
  // hạn. Không ném lỗi để việc đăng xuất vẫn thành công.
  if (!payload || !payload.jti) {
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const ttlSeconds = payload.exp
    ? Math.max(payload.exp - nowSeconds, 1)
    : jwtConfig.refreshExpirationDays * 24 * 60 * 60;

  try {
    await redisClient.setex(`${KEY_PREFIX}${payload.jti}`, ttlSeconds, '1');
    return true;
  } catch (error) {
    logger.error('Không ghi được thẻ làm mới vào danh sách thu hồi:', error);
    return false;
  }
};

/**
 * Kiểm tra một thẻ làm mới đã bị thu hồi chưa.
 * @param {string} jti
 * @returns {Promise<boolean>}
 */
const isRefreshTokenRevoked = async (jti) => {
  if (!jti) {
    return false;
  }
  try {
    const value = await redisClient.get(`${KEY_PREFIX}${jti}`);
    return value !== null && value !== undefined;
  } catch (error) {
    logger.error('Không đọc được danh sách thu hồi thẻ làm mới:', error);
    return false;
  }
};

module.exports = { revokeRefreshToken, isRefreshTokenRevoked };
