const express = require('express');
const validate = require('../../middlewares/validation.middleware');
const subtitleValidation = require('./subtitle.validation');
const subtitleController = require('./subtitle.controller');
const {
  authenticate,
  authorize,
} = require('../../middlewares/auth.middleware');
const Roles = require('../../core/enums/Roles');
const authenticateInternal = require('../../middlewares/internalAuth.middleware');

const router = express.Router({ mergeParams: true });

router.get(
  '/',
  validate(subtitleValidation.getSubtitles),
  subtitleController.getSubtitles
);

// Webhook tự động từ AI Service gửi phụ đề .srt.
// [SỬA] Route này nằm TRƯỚC router.use(authenticate, ...) bên dưới nên trước
// đây hoàn toàn không có xác thực, và controller cũng không kiểm chữ ký — ai
// cũng chèn được phụ đề vào bất kỳ bài học nào. Nay bắt buộc khóa nội bộ.
router.post(
  '/auto-webhook',
  authenticateInternal,
  subtitleController.handleAiSubtitleWebhook
);

// Các thao tác quản lý cần authenticate và quyền Instructor/Admin
router.use(
  authenticate,
  authorize([Roles.INSTRUCTOR, Roles.ADMIN, Roles.SUPERADMIN])
);

// Thêm phụ đề mới
router.post(
  '/',
  validate(subtitleValidation.addSubtitle),
  subtitleController.addSubtitle
);

// Giảng viên chủ động kích hoạt tạo phụ đề AI theo yêu cầu (On-Demand)
router.post(
  '/generate-ai',
  subtitleController.triggerAiSubtitleOnDemand
);

// Cập nhật phụ đề
router.patch(
  '/:subtitleId/set-primary',
  validate(subtitleValidation.setPrimary),
  subtitleController.setPrimarySubtitle
);

// Xóa phụ đề
router.delete(
  '/:subtitleId',
  validate(subtitleValidation.deleteSubtitle),
  subtitleController.deleteSubtitle
);

module.exports = router;
