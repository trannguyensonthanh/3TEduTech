const config = require('./index');

module.exports = {
  secret: config.jwt.secret,
  accessExpirationMinutes: config.jwt.accessExpirationMinutes,
  refreshExpirationDays: config.jwt.refreshExpirationDays,
  /* [SỬA] Trước đây để rỗng, tức jwt.verify chấp nhận mọi thuật toán HMAC mà
     khóa bí mật này ký được. Ghim HS256 — đúng thuật toán mà generateToken
     dùng — để thẻ ký bằng thuật toán khác bị từ chối ngay.
     Cố ý KHÔNG thêm issuer/audience: chúng không tăng thêm bảo đảm nào cho một
     ứng dụng dùng chung một khóa, nhưng sẽ làm mọi phiên đăng nhập hiện có mất
     hiệu lực ngay khi triển khai. */
  verifyOptions: { algorithms: ['HS256'] },
  emailVerificationTokenExpiresMinutes: 60 * 24,
  passwordResetTokenExpiresMinutes: 60,
};
