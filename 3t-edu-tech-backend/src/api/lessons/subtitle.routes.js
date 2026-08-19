const express = require('express');
const validate = require('../../middlewares/validation.middleware');
const subtitleValidation = require('./subtitle.validation');
const subtitleController = require('./subtitle.controller');
const {
  authenticate,
  authorize,
} = require('../../middlewares/auth.middleware');
const Roles = require('../../core/enums/Roles');

const router = express.Router({ mergeParams: true });

router.get(
  '/',
  validate(subtitleValidation.getSubtitles),
  subtitleController.getSubtitles
);

// Webhook tự động từ AI Service gửi phụ đề .srt
router.post(
  '/auto-webhook',
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
  (req, res, next) => {
    console.log('Request Body:', req.body);
    console.log('Request Params:', req.params);
    console.log('Request Query:', req.query);
    next();
  },
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
