// File: src/api/courses/courses.controller.js

const httpStatus = require('http-status').status;
const courseService = require('./courses.service');
const { catchAsync } = require('../../utils/catchAsync');
const { pick } = require('../../utils/pick');
const ApiError = require('../../core/errors/ApiError');
const { toCamelCaseObject } = require('../../utils/caseConverter');
const { clearCache } = require('../../middlewares/cache.middleware');

/**
 * Tạo mới một khóa học
 */
const createCourse = catchAsync(async (req, res) => {
  const course = await courseService.createCourse(req.body, req.user.id);
  await clearCache('cache:/v1/courses*');
  await clearCache('cache:/v1/instructors*');
  res.status(httpStatus.CREATED).send(course);
});

/**
 * Cập nhật thông tin khóa học
 */
const updateCourse = catchAsync(async (req, res) => {
  const course = await courseService.updateCourse(
    req.params.courseId,
    req.body,
    req.user
  );
  await clearCache('cache:/v1/courses*');
  await clearCache('cache:/v1/instructors*');
  res.status(httpStatus.OK).send(course);
});

/**
 * Xóa một khóa học
 */
const deleteCourse = catchAsync(async (req, res) => {
  await courseService.deleteCourse(req.params.courseId, req.user);
  await clearCache('cache:/v1/courses*');
  await clearCache('cache:/v1/instructors*');
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Ngừng xuất bản (Archive) hoặc gửi yêu cầu ngừng xuất bản khóa học
 */
const archiveCourse = catchAsync(async (req, res) => {
  const { notes } = req.body || {};
  const result = await courseService.archiveCourse(req.params.courseId, req.user, notes);
  await clearCache('cache:/v1/courses*');
  await clearCache('cache:/v1/instructors*');
  res.status(httpStatus.OK).send(result);
});

/**
 * Gửi yêu cầu duyệt khóa học
 */
const submitCourseForApproval = catchAsync(async (req, res) => {
  const { notes } = req.body;
  const approvalRequest = await courseService.submitCourseForApproval(
    req.params.courseId,
    req.user,
    notes
  );
  // [SỬA 19/08/2026] danh sách khóa của giảng viên đổi trạng thái — xem giải thích ở reviewCourseApproval.
  await clearCache('cache:/v1/courses*');
  await clearCache('cache:/v1/instructors*');
  res.status(httpStatus.OK).send({
    message: 'Yêu cầu duyệt khóa học đã được gửi.',
    request: approvalRequest,
  });
});

/**
 * Lấy danh sách yêu cầu duyệt khóa học
 */
const getApprovalRequests = catchAsync(async (req, res) => {
  const filters = pick(req.query, [
    'status',
    'instructorId',
    'courseId',
    'searchTerm',
  ]);
  const options = pick(req.query, ['limit', 'page', 'sortBy']);
  const result = await courseService.getApprovalRequests(filters, options);
  res.status(httpStatus.OK).send(result);
});

/**
 * Lấy chi tiết một yêu cầu duyệt khóa học
 */
const getApprovalRequestDetails = catchAsync(async (req, res) => {
  const requestDetails = await courseService.getApprovalRequestDetails(
    req.params.requestId
  );
  res.status(httpStatus.OK).send(requestDetails);
});

/**
 * Admin: Xử lý yêu cầu duyệt khóa học
 */
const reviewCourseApproval = catchAsync(async (req, res) => {
  const { decision, adminNotes } = req.body;
  const updatedRequest = await courseService.reviewCourseApproval(
    req.params.requestId,
    decision,
    req.user,
    adminNotes
  );
  /* [SỬA 19/08/2026] Xóa bộ nhớ đệm khi khả năng HIỂN THỊ CÔNG KHAI thay đổi.

     GET /courses và GET /courses/:slug được đệm 1800 giây (30 phút, xem
     courses.routes.js). createCourse/updateCourse/deleteCourse/archiveCourse
     đều đã xóa đệm, nhưng những chỗ dưới đây thì KHÔNG — dù chúng mới chính là
     lúc khóa học đổi từ "không ai thấy" sang "cả thiên hạ thấy".

     Hậu quả cụ thể: admin bấm DUYỆT, khóa học sang PUBLISHED trong CSDL, nhưng
     trang danh sách vẫn phục vụ bản đệm cũ — tới 30 phút sau mới hiện. Người
     duyệt tưởng mình bấm hỏng, giảng viên tưởng bị từ chối.

     Bộ test 14-course-lifecycle bắt được lỗi này ở phép thử
     "Sau khi duyệt, khóa học HIỆN ở danh sách công khai". */
  await clearCache('cache:/v1/courses*');
  await clearCache('cache:/v1/instructors*');
  res.status(httpStatus.OK).send({
    message: 'Đã xử lý yêu cầu duyệt.',
    request: toCamelCaseObject(updatedRequest),
  });
});

/**
 * Admin: Bật/tắt nổi bật cho khóa học
 */
const toggleCourseFeature = catchAsync(async (req, res) => {
  const { isFeatured } = req.body;
  const course = await courseService.toggleCourseFeature(
    req.params.courseId,
    isFeatured,
    req.user
  );
  // [SỬA 19/08/2026] khóa nổi bật hiện ngay trang chủ — xem giải thích ở reviewCourseApproval.
  await clearCache('cache:/v1/courses*');
  await clearCache('cache:/v1/instructors*');
  res.status(httpStatus.OK).send(course);
});

/**
 * Lấy danh sách khóa học (public/user)
 */
const getCourses = catchAsync(async (req, res) => {
  const filters = pick(req.query, [
    'searchTerm',
    'categoryId',
    'levelId',
    'instructorId',
    'statusId',
    'isFeatured',
    'language',
    'userPage',
  ]);
  const options = pick(req.query, ['limit', 'page', 'sortBy']);

  if (filters.userPage === undefined) {
    filters.userPage = false;
  }

  const result = await courseService.getCourses(
    filters,
    options,
    req.user,
    req.targetCurrency
  );

  res.status(httpStatus.OK).send(result);
});

/**
 * Lấy thông tin chi tiết một khóa học theo slug
 */
const getCourse = catchAsync(async (req, res) => {
  const course = await courseService.getCourseBySlug(
    req.params.slug,
    req.user,
    req.targetCurrency
  );
  res.status(httpStatus.OK).send(course);
});

/**
 * Cập nhật thumbnail cho khóa học
 */
const updateCourseThumbnail = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Vui lòng cung cấp file thumbnail.'
    );
  }
  const course = await courseService.updateCourseThumbnail(
    req.params.courseId,
    req.file,
    req.user
  );
  // [SỬA 19/08/2026] ảnh bìa đổi phải thấy ngay — xem giải thích ở reviewCourseApproval.
  await clearCache('cache:/v1/courses*');
  await clearCache('cache:/v1/instructors*');
  res.status(httpStatus.OK).send(course);
});

/**
 * Cập nhật video giới thiệu cho khóa học
 */
const updateCourseIntroVideo = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Vui lòng cung cấp file video giới thiệu.'
    );
  }
  const course = await courseService.updateCourseIntroVideo(
    req.params.courseId,
    req.file,
    req.user
  );
  // [SỬA 19/08/2026] video giới thiệu đổi phải thấy ngay — xem giải thích ở reviewCourseApproval.
  await clearCache('cache:/v1/courses*');
  await clearCache('cache:/v1/instructors*');
  res.status(httpStatus.OK).send(course);
});

/**
 * Lấy danh sách trạng thái khóa học
 */
const getCourseStatuses = catchAsync(async (req, res) => {
  const statuses = await courseService.getCourseStatuses();
  res.status(httpStatus.OK).send(statuses);
});

/**
 * Lấy danh sách khóa học theo category slug
 */
const getCoursesByCategorySlug = catchAsync(async (req, res) => {
  const { categorySlug } = req.params;
  const filterOptions = pick(req.query, [
    'levelId',
    'language',
    'minPrice',
    'maxPrice',
    'searchTerm',
  ]);
  const paginationOptions = pick(req.query, ['page', 'limit', 'sortBy']);

  const result = await courseService.queryCoursesByCategorySlug(
    categorySlug,
    filterOptions,
    paginationOptions,
    req.targetCurrency
  );
  res.status(httpStatus.OK).send(result);
});

/**
 * Lấy yêu cầu duyệt khóa học đang chờ xử lý (PENDING) theo CourseID
 */
const getPendingApprovalRequestByCourseId = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const request =
    await courseService.getPendingApprovalRequestByCourseId(courseId);
  if (!request) {
    return res
      .status(httpStatus.NOT_FOUND)
      .send({ message: 'Không tìm thấy yêu cầu duyệt đang chờ xử lý.' });
  }
  res.status(httpStatus.OK).send(request);
});

const createUpdateSession = catchAsync(async (req, res) => {
  const updatedCourse = await courseService.createUpdateSession(
    req.params.courseId,
    req.user
  );
  // [SỬA 19/08/2026] sinh thêm một bản ghi khóa học — xem giải thích ở reviewCourseApproval.
  await clearCache('cache:/v1/courses*');
  await clearCache('cache:/v1/instructors*');
  res.status(httpStatus.CREATED).send({
    message: 'Update session created. You are now editing a new version.',
    updateCourse: updatedCourse,
  });
});

const cancelUpdate = catchAsync(async (req, res) => {
  // Lưu ý: param ở đây là ID của khóa học BẢN SAO, không phải bản gốc
  const result = await courseService.cancelUpdate(
    req.params.updateCourseId,
    req.user
  );
  // [SỬA 19/08/2026] xóa bản ghi khóa học bản sao — xem giải thích ở reviewCourseApproval.
  await clearCache('cache:/v1/courses*');
  await clearCache('cache:/v1/instructors*');
  res.status(httpStatus.OK).send({
    message: 'Update session cancelled. The original course is now active.',
    originalCourseSlug: result.originalCourseSlug,
  });
});

/**
 * [THÊM 17/08/2026 — Course Versioning]
 * Lấy lịch sử toàn bộ phiên bản của một dòng khóa học.
 * Truyền vào ID của BẤT KỲ phiên bản nào cũng trả về đủ cả dòng.
 */
const getCourseVersionHistory = catchAsync(async (req, res) => {
  const history = await courseService.getCourseVersionHistory(
    req.params.courseId,
    req.user
  );
  res.status(httpStatus.OK).send(history);
});

module.exports = {
  createCourse,
  updateCourse,
  deleteCourse,
  submitCourseForApproval,
  getApprovalRequests,
  getApprovalRequestDetails,

  reviewCourseApproval,
  toggleCourseFeature,
  getPendingApprovalRequestByCourseId,
  getCourses,
  getCourse,
  updateCourseThumbnail,
  updateCourseIntroVideo,
  getCourseStatuses,
  getCoursesByCategorySlug,
  createUpdateSession,
  cancelUpdate,
  archiveCourse,
  getCourseVersionHistory,
};
