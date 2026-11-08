const express = require('express');
const validate = require('../../middlewares/validation.middleware');
const instructorValidation = require('./instructors.validation');
const instructorController = require('./instructors.controller');
const courseService = require('../courses/courses.service'); // <<< CẦN IMPORT courseService
const courseValidation = require('../courses/courses.validation');

const payoutMethodRoutes = require('./payoutMethod.routes');
const {
  authenticate,
  authorize,
} = require('../../middlewares/auth.middleware');
const Roles = require('../../core/enums/Roles');

const router = express.Router();
const reviewValidation = require('../reviews/reviews.validation');
const reviewController = require('../reviews/reviews.controller');

/* ============================================================================
   [SỬA] `/me/profile` PHẢI đứng trước `/:instructorId/profile`.

   Express so khớp theo THỨ TỰ khai báo. Trước đây khối này nằm mãi phía dưới,
   nên `GET /v1/instructors/me/profile` — đường dẫn mà GIAO DIỆN THẬT đang gọi —
   rơi vào route công khai với instructorId = "me", tức chạy nhầm
   getInstructorPublicProfile thay vì getMyProfile. Controller không hề xử lý
   chuỗi "me".

   Lỗi này không lộ ra vì tầng kiểm tra đầu vào chưa bao giờ chạy (xem
   utils/pick.js): schema đòi instructorId là số, nhưng schema đó không được áp
   dụng, nên yêu cầu đi thẳng xuống handler sai và vẫn trả về 200. Bộ test chỉ
   kiểm tra mã trạng thái nên cũng không phát hiện.

   Cùng một lỗi với khối chú thích đã có trong faqs.routes.js.

   Vì khối này nằm trên `router.use(authenticate, ...)` nên phải tự gắn
   middleware xác thực/phân quyền.
   ========================================================================== */
router
  .route('/me/profile')
  .get(
    authenticate,
    authorize([Roles.INSTRUCTOR, Roles.SUPERADMIN]),
    instructorController.getMyProfile
  )
  .patch(
    authenticate,
    authorize([Roles.INSTRUCTOR, Roles.SUPERADMIN]),
    validate(instructorValidation.updateMyProfile),
    instructorController.updateMyProfile
  );

// --- Public Route ---
router.get(
  '/:instructorId/profile',
  validate(instructorValidation.getInstructorPublicProfile),
  instructorController.getInstructorPublicProfile
);

router.get(
  '/my-courses',
  authenticate,
  authorize([Roles.INSTRUCTOR, Roles.ADMIN, Roles.SUPERADMIN]),
  validate(courseValidation.getCourses), // Tái sử dụng schema validation của getCourses
  instructorController.getMyCourses
);

router.get(
  '/',
  validate(instructorValidation.getInstructors),
  instructorController.getInstructors
);

// --- Lấy tất cả reviews cho các khóa học của một giảng viên ---
router.get(
  '/:instructorId/course-reviews',
  validate(reviewValidation.getReviewsByInstructor),
  reviewController.getCourseReviewsByInstructor
);

// --- Routes require Instructor Role ---
router.use(authenticate, authorize([Roles.INSTRUCTOR, Roles.SUPERADMIN]));

// --- Student Management for Instructor ---
router.get(
  '/me/students',
  validate(instructorValidation.getInstructorStudents),
  instructorController.getMyStudents
);

// --- Skills Management ---
router.post(
  '/me/skills',
  validate(instructorValidation.addSkill),
  instructorController.addMySkill
);
router.delete(
  '/me/skills/:skillId',
  validate(instructorValidation.removeSkill),
  instructorController.removeMySkill
);

// --- Social Links Management ---
router.put(
  '/me/social-links',
  validate(instructorValidation.addOrUpdateSocialLink),
  instructorController.addOrUpdateMySocialLink
);
router.delete(
  '/me/social-links/:platform',
  validate(instructorValidation.removeSocialLink),
  instructorController.removeMySocialLink
);

// *** Mount Payout Method Routes ***
router.use('/me/payout-methods', payoutMethodRoutes);

// --- Instructor Dashboard Data / Financial Overview ---
router.get(
  '/me/financial-overview',
  instructorController.getMyFinancialOverview
);

router.get(
  '/me/dashboard-overview',
  // Không cần validation đặc biệt vì không có params/body
  instructorController.getMyDashboardOverview
);

// --- Instructor Analytics ---
const adminController = require('../admin/admin.controller');

router.get(
  '/me/analytics',
  adminController.getInstructorAnalytics
);

module.exports = router;

