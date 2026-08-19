const express = require('express');
const validate = require('../../middlewares/validation.middleware');
const courseValidation = require('../courses/courses.validation');
const courseController = require('../courses/courses.controller');
const {
  authenticate,
  authorize,
} = require('../../middlewares/auth.middleware');
const Roles = require('../../core/enums/Roles');

const router = express.Router();

// Mọi route dưới đây đều yêu cầu đăng nhập
router.use(authenticate);

/*
 * ============================================================================
 * [SỬA 17/08/2026 — LỖI PHÂN QUYỀN NGHIÊM TRỌNG]
 * ----------------------------------------------------------------------------
 * TRƯỚC ĐÂY toàn bộ router dùng chung một middleware:
 *     router.use(authenticate, authorize([ADMIN, SUPERADMIN, INSTRUCTOR]));
 *
 * Vì route PATCH /:requestId/review nằm trong nhóm này, mà hàm
 * reviewCourseApproval() trong courses.service.js lại KHÔNG kiểm tra role,
 * nên bất kỳ GIẢNG VIÊN nào cũng gọi được:
 *     PATCH /v1/approval-requests/:requestId/review   { "decision": "APPROVED" }
 * → tự duyệt và xuất bản khóa học của chính mình, vô hiệu hóa hoàn toàn
 *   khâu kiểm duyệt của Quản trị viên.
 *
 * CÁCH SỬA: tách quyền theo từng route
 *   - Xem danh sách / chi tiết: Giảng viên vẫn được (theo dõi yêu cầu của mình)
 *   - Duyệt / từ chối: CHỈ Admin & Superadmin
 * Kèm theo lớp kiểm tra thứ hai ngay trong service (defense in depth).
 * ============================================================================
 */

// --- Xem: Admin, Superadmin và Giảng viên ---
router.get(
  '/',
  authorize([Roles.ADMIN, Roles.SUPERADMIN, Roles.INSTRUCTOR]),
  validate(courseValidation.getApprovalRequests),
  courseController.getApprovalRequests
);

router.get(
  '/:requestId',
  authorize([Roles.ADMIN, Roles.SUPERADMIN, Roles.INSTRUCTOR]),
  validate(courseValidation.getApprovalRequest),
  courseController.getApprovalRequestDetails
);

// --- Duyệt / Từ chối: CHỈ Admin & Superadmin ---
router.patch(
  '/:requestId/review',
  authorize([Roles.ADMIN, Roles.SUPERADMIN]),
  validate(courseValidation.reviewCourse),
  courseController.reviewCourseApproval
);

module.exports = router;
