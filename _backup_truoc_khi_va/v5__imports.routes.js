// File: src/api/imports/imports.routes.js
// [THÊM 18/08/2026 — COURSE IMPORT, Giai đoạn A]
//
// Chỉ GIẢNG VIÊN và ADMIN được dùng tính năng này. Học viên không có lý do gì
// để tạo khóa học, và việc tải tệp ZIP lên là thao tác tốn tài nguyên nhất
// trong toàn hệ thống — không nên mở cho mọi tài khoản.

const express = require('express');

const validate = require('../../middlewares/validation.middleware');
const importValidation = require('./imports.validation');
const importController = require('./imports.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const {
  uploadZip,
  handleImportUploadError,
} = require('../../middlewares/importUpload.middleware');
const { createRateLimiter } = require('../../middlewares/rateLimit.middleware');
const Roles = require('../../core/enums/Roles');

const router = express.Router();

const instructorOnly = authorize([Roles.INSTRUCTOR, Roles.ADMIN, Roles.SUPERADMIN]);

/**
 * Giới hạn tần suất tải tệp.
 *
 * 5 lần / giờ là rộng rãi với người dùng thật (nhập khóa học không phải việc
 * làm liên tục), nhưng chặn được kịch bản tải lên hàng loạt làm đầy ổ đĩa —
 * mối lo lớn nhất với dung lượng máy chủ hiện tại.
 */
const uploadLimiter = createRateLimiter({
  windowSeconds: 3600,
  max: Number(process.env.RATE_LIMIT_IMPORT_MAX) || 5,
  keyPrefix: 'import-upload',
  message:
    'Bạn đã tải lên khá nhiều tệp trong một giờ qua. Vui lòng thử lại sau.',
});

/* Thứ tự middleware ở đây quan trọng:
   authenticate → authorize → rate limit → multer → xử lý lỗi multer
   Đặt multer TRƯỚC khâu xác thực sẽ khiến máy chủ nhận trọn tệp 200MB của một
   request không hợp lệ rồi mới từ chối. */
router.post(
  '/',
  authenticate,
  instructorOnly,
  uploadLimiter,
  uploadZip.single('file'),
  handleImportUploadError,
  importController.createImport
);

router.get('/', authenticate, instructorOnly, importController.listImports);

/* [THÊM 18/08/2026] Giới hạn tải lên — giao diện đọc từ đây thay vì ghi cứng.
   ⚠️ PHẢI khai báo TRƯỚC '/:jobId' bên dưới. Express so khớp theo thứ tự, nên
   nếu để sau, đường dẫn '/limits' sẽ rơi vào mẫu tham số với jobId="limits" và
   trả về 404 "không tìm thấy job" — một thông báo chẳng liên quan gì tới thứ
   giao diện vừa hỏi. */
router.get('/limits', authenticate, instructorOnly, importController.getLimits);

// Khai báo '/:jobId/proposal' TRƯỚC '/:jobId' — nếu ngược lại, mẫu tham số
// một đoạn sẽ nuốt mất đoạn cố định phía sau.
router.get(
  '/:jobId/proposal',
  authenticate,
  instructorOnly,
  validate(importValidation.jobIdParam),
  importController.getProposal
);

/* [THÊM 18/08/2026 — Giai đoạn B] Nhờ AI viết mô tả.
   Giới hạn riêng và CHẶT hơn nhiều so với các endpoint khác: mỗi lượt gọi ở
   đây tiêu token thật của hạn mức Gemini miễn phí. Bấm nhầm liên tục 20 lần là
   hết hạn mức cả ngày cho toàn hệ thống, không riêng người bấm. */
const enrichLimiter = createRateLimiter({
  windowSeconds: 3600,
  max: Number(process.env.RATE_LIMIT_IMPORT_ENRICH_MAX) || 10,
  keyPrefix: 'import-enrich',
  message:
    'Bạn đã nhờ AI viết mô tả khá nhiều lần trong một giờ qua. Vui lòng thử lại sau.',
});

router.post(
  '/:jobId/enrich',
  authenticate,
  instructorOnly,
  enrichLimiter,
  validate(importValidation.jobIdParam),
  importController.enrichImport
);

/* [Giai đoạn D] Sinh câu hỏi trắc nghiệm — dùng CHUNG giới hạn với enrich,
   vì cùng đốt một hạn mức token. Dùng chung `keyPrefix` để hai nút cộng dồn
   vào cùng một quota, tránh việc bấm xen kẽ hai nút để lách giới hạn. */
router.post(
  '/:jobId/quiz',
  authenticate,
  instructorOnly,
  enrichLimiter,
  validate(importValidation.generateQuiz),
  importController.generateQuiz
);

router.post(
  '/:jobId/accept',
  authenticate,
  instructorOnly,
  validate(importValidation.acceptImport),
  importController.acceptImport
);

router.get(
  '/:jobId',
  authenticate,
  instructorOnly,
  validate(importValidation.jobIdParam),
  importController.getImportStatus
);

router.delete(
  '/:jobId',
  authenticate,
  instructorOnly,
  validate(importValidation.jobIdParam),
  importController.cancelImport
);

module.exports = router;
