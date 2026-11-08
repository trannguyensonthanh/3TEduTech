const crypto = require('crypto');
const httpStatus = require('http-status').status;
const config = require('../config');
const ApiError = require('../core/errors/ApiError');
const logger = require('../utils/logger');

let warnedNoKey = false;

/**
 * Xác thực các lời gọi nội bộ giữa AI Service và backend bằng khóa chia sẻ
 * `AI_SERVICE_INTERNAL_KEY` (phải trùng `INTERNAL_API_KEY` phía ai-service).
 *
 * Vì sao cần: webhook phụ đề `POST /v1/lessons/:lessonId/subtitles/auto-webhook`
 * được đăng ký TRƯỚC `router.use(authenticate, ...)` nên nằm ngoài mọi lớp xác
 * thực, và controller cũng không kiểm tra chữ ký. Bất kỳ ai cũng chèn được phụ
 * đề vào bất kỳ bài học nào.
 *
 * Khi khóa chưa được cấu hình, middleware ghi cảnh báo MỘT lần rồi cho qua —
 * đúng theo quy ước sẵn có của dự án (ai-service cũng chạy mở khi để trống),
 * để bản demo dựng lên là chạy được ngay mà không phải cấu hình thêm.
 */
const authenticateInternal = (req, res, next) => {
  const expected = config.aiService.internalKey;

  if (!expected) {
    if (!warnedNoKey) {
      warnedNoKey = true;
      logger.warn(
        '[InternalAuth] AI_SERVICE_INTERNAL_KEY chưa được đặt — các endpoint nội bộ đang chạy KHÔNG xác thực. ' +
          'Hãy đặt khóa này (và INTERNAL_API_KEY tương ứng ở ai-service) trước khi mở ra mạng ngoài.'
      );
    }
    return next();
  }

  const provided = req.get('X-Internal-Key') || '';
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);

  // timingSafeEqual ném lỗi nếu hai buffer khác độ dài, nên phải so độ dài trước.
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return next(
      new ApiError(httpStatus.UNAUTHORIZED, 'Khóa nội bộ không hợp lệ.')
    );
  }

  return next();
};

module.exports = authenticateInternal;
