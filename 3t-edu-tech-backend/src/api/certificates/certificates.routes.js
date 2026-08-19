// File: src/api/certificates/certificates.routes.js
// [THÊM 17/08/2026 — LEVEL 2, mục 2.1]

const express = require('express');
const validate = require('../../middlewares/validation.middleware');
const certificateValidation = require('./certificates.validation');
const certificateController = require('./certificates.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const Roles = require('../../core/enums/Roles');
// [THÊM 17/08/2026 — LEVEL 3] Giới hạn tần suất cho endpoint xác minh công khai.
const { publicVerifyLimiter } = require('../../middlewares/rateLimit.middleware');

const router = express.Router();

/* ============================================================================
 * ⚠️ THỨ TỰ KHAI BÁO ROUTE RẤT QUAN TRỌNG
 *
 * Express so khớp route theo thứ tự khai báo. `/:code` là một mẫu bắt-tất-cả
 * cho mọi đường dẫn một đoạn, nên nếu đặt nó lên trước thì `/me` sẽ bị nuốt:
 * request GET /v1/certificates/me sẽ rơi vào getCertificateDetail với
 * code = "me", trượt validation và trả về lỗi định dạng mã khó hiểu.
 *
 * Quy tắc: mọi route có đoạn cố định (/me, /verify/..., /issue/...) phải khai
 * báo TRƯỚC route có tham số động ở cùng vị trí.
 * ========================================================================== */

/**
 * XÁC MINH CÔNG KHAI — cố ý KHÔNG có `authenticate`.
 * Đây là địa chỉ mà mã QR trên tờ chứng chỉ trỏ tới.
 */
/* [THÊM 17/08/2026 — LEVEL 3] publicVerifyLimiter đứng TRƯỚC validate.
   Chính vì endpoint này công khai nên nó là mục tiêu dễ nhất để quét mã hàng
   loạt. Đặt bộ đếm trước khâu kiểm tra định dạng để ngay cả request rác cũng
   bị tính vào hạn mức — nếu đặt sau, kẻ tấn công chỉ cần gửi mã sai định dạng
   là né được bộ đếm mà vẫn ngốn tài nguyên máy chủ. */
router.get(
  '/verify/:code',
  publicVerifyLimiter,
  validate(certificateValidation.verifyCertificate),
  certificateController.verifyCertificate
);

/** Danh sách chứng chỉ của tôi */
router.get('/me', authenticate, certificateController.getMyCertificates);

/** Kiểm tra đủ điều kiện nhận chứng chỉ của một khóa học */
router.get(
  '/eligibility/:courseId',
  authenticate,
  validate(certificateValidation.getEligibility),
  certificateController.getEligibility
);

/** Học viên tự bấm nhận chứng chỉ (đường dự phòng của luồng cấp tự động) */
router.post(
  '/issue/:courseId',
  authenticate,
  validate(certificateValidation.issueCertificate),
  certificateController.issueCertificate
);

/** Thu hồi — chỉ Admin. Khai báo trước `/:code` vì có đoạn cố định phía sau. */
router.patch(
  '/:code/revoke',
  authenticate,
  authorize([Roles.ADMIN, Roles.SUPERADMIN]),
  validate(certificateValidation.revokeCertificate),
  certificateController.revokeCertificate
);

/** Chi tiết đầy đủ để dựng PDF — chủ sở hữu hoặc Admin */
router.get(
  '/:code',
  authenticate,
  validate(certificateValidation.getCertificateDetail),
  certificateController.getCertificateDetail
);

module.exports = router;
