/* ============================================================================
 * rateLimit.middleware.js
 * [THÊM 17/08/2026 — LEVEL 3]
 *
 * Giới hạn tần suất gọi, thuật toán cửa sổ trượt cố định (fixed window),
 * lưu đếm trên Redis.
 *
 * ----------------------------------------------------------------------------
 * VÌ SAO TỰ VIẾT THAY VÌ DÙNG `express-rate-limit`
 *
 * Dự án chưa có gói đó, và bản mặc định của nó đếm trong BỘ NHỚ TIẾN TRÌNH.
 * Khi chạy nhiều container backend sau Nginx (đúng kiến trúc đang triển khai),
 * mỗi container giữ một bộ đếm riêng — người dùng gọi được N × số-container
 * request, tức là hạn mức thực tế lớn gấp mấy lần con số đã cấu hình mà không
 * ai nhận ra. Dự án đã có sẵn ioredis nên đếm tập trung trên Redis là lựa chọn
 * vừa đúng vừa không thêm phụ thuộc.
 *
 * ----------------------------------------------------------------------------
 * REDIS HỎNG THÌ SAO? → CHO QUA (fail-open)
 *
 * Đây là quyết định có cân nhắc. Nếu chặn hết khi Redis chết (fail-closed) thì
 * một sự cố cache biến thành mất toàn bộ tính năng AI. Giới hạn tần suất ở đây
 * để chống lạm dụng token, không phải để bảo vệ dữ liệu — mất tạm thời thì
 * thiệt hại là tiền token trong vài phút, còn chặn nhầm thì hỏng trải nghiệm
 * của mọi người dùng thật. Sự cố được ghi log ở mức error để còn biết mà xử lý.
 * ========================================================================== */

const httpStatus = require('http-status').status;
const redisClient = require('../database/redis');
const ApiError = require('../core/errors/ApiError');
const logger = require('../utils/logger');

/**
 * Tạo middleware giới hạn tần suất.
 *
 * @param {object} options
 * @param {number} options.windowSeconds - Độ dài cửa sổ (giây).
 * @param {number} options.max - Số request tối đa trong một cửa sổ.
 * @param {string} options.keyPrefix - Tiền tố khóa Redis, để các giới hạn khác nhau không đếm chung.
 * @param {string} [options.message] - Thông điệp trả về khi vượt hạn mức.
 * @returns {import('express').RequestHandler}
 */
const createRateLimiter = ({
  windowSeconds,
  max,
  keyPrefix,
  message = 'Bạn thao tác quá nhanh. Vui lòng chờ một lát rồi thử lại.',
}) => {
  return async (req, res, next) => {
    /* Định danh theo AccountID khi đã đăng nhập, chỉ dùng IP khi ẩn danh.
       Ưu tiên AccountID vì IP không đáng tin: cả một trường học hay công ty đi
       chung một IP công cộng — chặn theo IP là chặn nhầm hàng trăm học viên
       chỉ vì một người gọi nhiều. */
    const identity = req.user?.id
      ? `u:${req.user.id}`
      : `ip:${req.ip || req.connection?.remoteAddress || 'unknown'}`;

    /* Mốc cửa sổ tính từ thời gian: mọi request trong cùng một khoảng
       windowSeconds rơi vào cùng một khóa, và khóa tự hết hạn nên không cần
       dọn dẹp thủ công. */
    const windowIndex = Math.floor(Date.now() / 1000 / windowSeconds);
    const key = `ratelimit:${keyPrefix}:${identity}:${windowIndex}`;

    try {
      // incr trả về giá trị SAU khi tăng; lần đầu tiên trả về 1.
      const current = await redisClient.incr(key);

      // Chỉ đặt hạn dùng ở lần đầu. Đặt lại mỗi lần sẽ khiến cửa sổ trượt mãi
      // về phía trước và người gọi liên tục không bao giờ được reset.
      if (current === 1) {
        await redisClient.expire(key, windowSeconds);
      }

      // Header chuẩn để giao diện biết còn bao nhiêu lượt.
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - current));

      if (current > max) {
        const retryAfter = windowSeconds - (Math.floor(Date.now() / 1000) % windowSeconds);
        res.setHeader('Retry-After', retryAfter);
        logger.warn(
          `[RateLimit] ${identity} vượt hạn mức '${keyPrefix}' (${current}/${max}).`
        );
        return next(new ApiError(httpStatus.TOO_MANY_REQUESTS, message));
      }

      return next();
    } catch (error) {
      // Fail-open — xem phần giải thích ở đầu file.
      logger.error(
        `[RateLimit] Redis lỗi, tạm bỏ qua giới hạn tần suất: ${error.message}`
      );
      return next();
    }
  };
};

/* --------------------------------------------------------------------------
 * Các bộ giới hạn dùng sẵn
 * ------------------------------------------------------------------------ */

/**
 * Hội thoại AI — tốn kém nhất, cần siết chặt nhất.
 *
 * 20 tin nhắn / 5 phút: rộng rãi với người dùng thật (gõ và đọc câu trả lời
 * mất ít nhất 15 giây mỗi lượt), nhưng chặn đứng script gọi vòng lặp.
 */
const aiChatLimiter = createRateLimiter({
  windowSeconds: 300,
  max: Number(process.env.RATE_LIMIT_AI_CHAT_MAX) || 20,
  keyPrefix: 'ai-chat',
  message:
    'Bạn đã gửi khá nhiều câu hỏi trong thời gian ngắn. Vui lòng chờ vài phút rồi tiếp tục nhé.',
});

/** Tìm kiếm bằng AI — nhẹ hơn hội thoại nên nới rộng hơn. */
const aiSearchLimiter = createRateLimiter({
  windowSeconds: 60,
  max: Number(process.env.RATE_LIMIT_AI_SEARCH_MAX) || 10,
  keyPrefix: 'ai-search',
  message: 'Bạn tìm kiếm quá nhanh. Vui lòng chờ một chút.',
});

/** Tạo phiên / thao tác nhẹ. Chủ yếu để chặn vòng lặp tạo phiên vô hạn. */
const aiSessionLimiter = createRateLimiter({
  windowSeconds: 60,
  max: Number(process.env.RATE_LIMIT_AI_SESSION_MAX) || 30,
  keyPrefix: 'ai-session',
});

/**
 * Xác minh chứng chỉ — endpoint CÔNG KHAI, không cần đăng nhập.
 *
 * Chính vì công khai nên nó là mục tiêu dễ nhất để quét mã hàng loạt. 30 lượt/
 * phút đủ cho người thật (kể cả bộ phận nhân sự kiểm tra nhiều hồ sơ liên tiếp)
 * nhưng khiến việc dò 2^40 tổ hợp mã trở nên vô nghĩa về mặt thời gian.
 */
const publicVerifyLimiter = createRateLimiter({
  windowSeconds: 60,
  max: Number(process.env.RATE_LIMIT_VERIFY_MAX) || 30,
  keyPrefix: 'verify',
  message: 'Bạn tra cứu quá nhiều lần. Vui lòng chờ một phút rồi thử lại.',
});

module.exports = {
  createRateLimiter,
  aiChatLimiter,
  aiSearchLimiter,
  aiSessionLimiter,
  publicVerifyLimiter,
};
