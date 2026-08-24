// File: src/api/courses/courses.controller.js

const httpStatus = require('http-status').status;
const crypto = require('crypto');
const _ = require('lodash');
const courseRepository = require('./courses.repository');
const categoryRepository = require('../categories/categories.repository');
const levelRepository = require('../levels/levels.repository');
const ApiError = require('../../core/errors/ApiError');
const { generateSlug } = require('../../utils/slugify');
const CourseStatus = require('../../core/enums/CourseStatus');
const ApprovalStatus = require('../../core/enums/ApprovalStatus');
const ApprovalRequestType = require('../../core/enums/ApprovalRequestType');
const Roles = require('../../core/enums/Roles');
const logger = require('../../utils/logger');
const sectionRepository = require('../sections/sections.repository');
const lessonRepository = require('../lessons/lessons.repository');
const cloudinaryUtil = require('../../utils/cloudinary.util');
const enrollmentService = require('../enrollments/enrollments.service');
const notificationService = require('../notifications/notifications.service');
const progressService = require('../progress/progress.service');
const lessonAttachmentRepository = require('../lessons/lessonAttachment.repository');
const { getConnection, sql } = require('../../database/connection');
const authRepository = require('../auth/auth.repository');
const languageRepository = require('../languages/languages.repository');
const {
  toCamelCaseObject,
  toPascalCaseObject,
} = require('../../utils/caseConverter');
const userRepository = require('../users/users.repository');
const pricingUtil = require('../../utils/pricing.util');
const quizRepository = require('../quizzes/quizzes.repository');
const subtitleRepository = require('../lessons/subtitle.repository');
const LessonType = require('../../core/enums/LessonType');
const aiSyncService = require('../../services/aiSync.service');
const aiClient = require('../../services/aiClient');

/**
 * Tạo khóa học mới với payload tối giản (bởi Instructor).
 */
const createCourse = async (courseData, instructorId) => {
  const { courseName, categoryId, language, levelId } = courseData;
  const [category, instructorProfile, defaultLevel] = await Promise.all([
    categoryRepository.findCategoryById(categoryId),
    userRepository.findUserProfileById(instructorId),
    levelRepository.findLevelById(levelId || 1),
  ]);
  if (!category) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Danh mục không hợp lệ.');
  }
  if (!instructorProfile) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Không tìm thấy thông tin giảng viên.'
    );
  }
  if (!defaultLevel) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Cấp độ không hợp lệ.`);
  }
  const baseSlug = generateSlug(courseName);
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  const uniqueSlug = `${baseSlug}-${randomSuffix}`;
  const fullCourseData = {
    CourseName: courseName,
    Slug: uniqueSlug,
    ShortDescription: `Một khóa học mới của ${instructorProfile.FullName}. Chi tiết sẽ được cập nhật sớm.`,
    FullDescription:
      '<p>Nội dung khóa học đang được giảng viên soạn thảo...</p>',
    Requirements: null,
    LearningOutcomes: null,
    ThumbnailUrl: null,
    IntroVideoUrl: null,
    OriginalPrice: 0,
    DiscountedPrice: null,
    InstructorID: instructorId,
    CategoryID: categoryId,
    LevelID: defaultLevel.LevelID,
    Language: language,
    StatusID: CourseStatus.DRAFT,
    PublishedAt: null,
    IsFeatured: false,
    ReviewCount: 0,
    AverageRating: null,
  };
  const createdCourse = await courseRepository.createCourse(fullCourseData);
  logger.info(
    `Draft course "${createdCourse.CourseName}" (ID: ${createdCourse.CourseID}) created by instructor ${instructorId}.`
  );
  return toCamelCaseObject(createdCourse);
};

/**
 * Lấy danh sách khóa học (có thể lọc theo nhiều tiêu chí).
 */
const getCourses = async (
  filters,
  options,
  user,
  targetCurrency
) => {
  filters = filters || {};
  options = options || {};
  user = user || null;
  const effectiveFilters = { ...filters };
  if (user) {
    if (user.role === Roles.INSTRUCTOR && effectiveFilters.userPage === false) {
      if (
        effectiveFilters.instructorId &&
        effectiveFilters.instructorId !== user.id
      ) {
        logger.warn(
          `Instructor ${user.id} trying to filter courses by another instructor ${effectiveFilters.instructorId}. Returning only published courses.`
        );
        effectiveFilters.instructorId = null;
        effectiveFilters.statusId = CourseStatus.PUBLISHED;
      } else {
        effectiveFilters.instructorId = user.id;
        effectiveFilters.statusId = filters.statusId || 'ALL';
      }
    } else if (
      (user.role === Roles.ADMIN || user.role === Roles.SUPERADMIN) &&
      effectiveFilters.userPage === false
    ) {
      effectiveFilters.statusId = filters.statusId || 'ALL';
    } else if (
      user.role === Roles.STUDENT ||
      effectiveFilters.userPage === true
    ) {
      effectiveFilters.statusId = CourseStatus.PUBLISHED;
    }
  } else {
    effectiveFilters.statusId = CourseStatus.PUBLISHED;
  }
  const { page = 1, limit = 10 } = options;
  const result = await courseRepository.findAllCourses(
    effectiveFilters,
    options
  );
  const coursesWithPricing = await Promise.all(
    result.courses.map(async (course) => {
      const pricing = await pricingUtil.createPricingObject(
        course,
        targetCurrency
      );
      delete course.OriginalPrice;
      delete course.DiscountedPrice;
      return { ...toCamelCaseObject(course), pricing };
    })
  );
  return {
    courses: coursesWithPricing,
    total: result.total,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalPages: limit > 0 ? Math.ceil(result.total / limit) : 1,
  };
};

/**
 *  Lấy danh sách khóa học dựa trên bộ lọc và tùy chọn được cung cấp.
 * Hàm này không tự ý thêm filter, nó chỉ thực thi những gì được truyền vào.
 */
const queryCourses = async (
  filters,
  options,
  targetCurrency = 'VND'
) => {
  filters = filters || {};
  options = options || {};
  const { page = 1, limit = 10 } = options;

  // Gọi thẳng repository với filter đã được chuẩn bị sẵn từ service cha
  const result = await courseRepository.findAllCourses(filters, options);

  const coursesWithPricing = await Promise.all(
    result.courses.map(async (course) => {
      const pricing = await pricingUtil.createPricingObject(
        course,
        targetCurrency
      );
      // Giữ lại toCamelCaseObject để đảm bảo casing nhất quán
      const camelCaseCourse = toCamelCaseObject(course);
      delete camelCaseCourse.originalPrice;
      delete camelCaseCourse.discountedPrice;
      return { ...camelCaseCourse, pricing };
    })
  );

  return {
    courses: coursesWithPricing,
    total: result.total,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalPages: limit > 0 ? Math.ceil(result.total / limit) : 1,
  };
};

/**
 * Lấy chi tiết một khóa học bằng slug, bao gồm TOÀN BỘ curriculum.
 */
const getCourseBySlug = async (slug, user, targetCurrency) => {
  user = user || null;
  const isAdmin =
    user && (user.role === Roles.ADMIN || user.role === Roles.SUPERADMIN);
  const isPotentiallyInstructor = user && user.role === Roles.INSTRUCTOR;
  const includeNonPublished = isAdmin || isPotentiallyInstructor;
  /* [SỬA 17/08/2026 — Course Versioning] Truyền thêm accountId để repository
     cho phép học viên ĐÃ GHI DANH xem khóa học kể cả khi nó đã chuyển sang
     SUPERSEDED (bị thay bởi phiên bản mới) hoặc ARCHIVED. */
  const course = await courseRepository.findCourseWithFullDetailsBySlug(
    slug,
    includeNonPublished,
    user?.id || null
  );
  if (!course) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Course not found or not accessible.'
    );
  }
  const isPublished = course.StatusID === CourseStatus.PUBLISHED;
  const isOwnerInstructor =
    isPotentiallyInstructor && course.InstructorID === user.id;

  /* [SỬA] Học viên đã mua vẫn được vào khóa SUPERSEDED / ARCHIVED.
     Không có ngoại lệ này thì lời hứa "mua v1 thì học v1 mãi mãi" bị phá vỡ:
     ngay khi v2 được duyệt, toàn bộ học viên v1 sẽ nhận 403/404. */
  let viewerHasEnrollment = false;
  if (!isPublished && user && !isAdmin && !isOwnerInstructor) {
    viewerHasEnrollment = await courseRepository.hasEnrollment(
      user.id,
      course.CourseID
    );
  }

  if (!isPublished && !isAdmin && !isOwnerInstructor && !viewerHasEnrollment) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'You do not have permission to view this course.'
    );
  }
  let isEnrolled = false;
  if (user && !isAdmin && !isOwnerInstructor) {
    try {
      isEnrolled = await enrollmentService.isUserEnrolled(
        user.id,
        course.CourseID
      );
    } catch (enrollmentError) {
      logger.error(
        `Error checking enrollment for user ${user.id} course ${course.CourseID}:`,
        enrollmentError
      );
    }
  }
  const canViewFullContent = isAdmin || isOwnerInstructor || isEnrolled;
  if (course.sections) {
    course.sections.forEach((section) => {
      if (section.lessons) {
        section.lessons.forEach((lesson) => {
          if (!lesson.IsFreePreview && !canViewFullContent) {
            lesson.TextContent =
              '*** Content available for enrolled students only ***';
          }
          if (lesson.VideoSourceType === 'CLOUDINARY') {
            lesson.ExternalVideoID = lesson.ExternalVideoID ? 'uploaded' : null;
          }
          if (!isAdmin && !isOwnerInstructor && lesson.questions) {
            lesson.questions.forEach((q) => {
              q.options?.forEach((o) => delete o.IsCorrectAnswer);
            });
          }
        });
      }
    });
  }
  course.isEnrolled = canViewFullContent;
  if (user && course.isEnrolled) {
    try {
      const progressData = await progressService.getCourseProgress(
        user,
        course.CourseID
      );
      logger.debug(`Course progress data for user ${user.id}:`, progressData);
      course.userProgress = progressData.progressDetails.reduce((acc, p) => {
        acc[p.LessonID] = {
          isCompleted: p.IsCompleted,
          lastWatchedPosition: p.LastWatchedPosition,
        };
        return acc;
      }, {});
      logger.info(`DEBUG: totalCompletedLessons: ${course.totalCompletedLessons}`);
      logger.info(`DEBUG: userProgress keys with isCompleted=true: ${Object.values(course.userProgress).filter(p => p.isCompleted).length}`);
    } catch (progressError) {
      if (
        !(
          progressError instanceof ApiError &&
          progressError.statusCode === httpStatus.FORBIDDEN
        )
      ) {
        logger.error(
          `Error fetching progress for user ${user.id}, course ${course.CourseID}:`,
          progressError
        );
      }
      course.userProgress = {};
    }
  } else {
    course.userProgress = {};
  }
  course.pricing = await pricingUtil.createPricingObject(
    course,
    targetCurrency
  );
  delete course.OriginalPrice;
  delete course.DiscountedPrice;
  return toCamelCaseObject(course);
};

/**
 * Cập nhật khóa học (bởi Instructor hoặc Admin).
 */
const updateCourse = async (courseId, updateBody, user) => {
  const course = await courseRepository.findCourseById(courseId, true);
  if (!course) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy khóa học.');
  }
  const isAdmin = user.role === Roles.ADMIN || user.role === Roles.SUPERADMIN;
  const isOwnerInstructor =
    user.role === Roles.INSTRUCTOR && course.InstructorID === user.id;
  if (!isAdmin && !isOwnerInstructor) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Bạn không có quyền cập nhật khóa học này.'
    );
  }
  if (
    isOwnerInstructor &&
    ![CourseStatus.DRAFT, CourseStatus.REJECTED].includes(course.StatusID)
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Bạn chỉ có thể cập nhật khóa học khi ở trạng thái ${CourseStatus.DRAFT} hoặc ${CourseStatus.REJECTED}.`
    );
  }
  if (isAdmin && updateBody.instructorId !== undefined) {
    delete updateBody.instructorId;
    logger.warn(
      `Admin attempt to change instructorId for course ${courseId} was blocked.`
    );
  }
  if (isAdmin && updateBody.statusId !== undefined) {
    delete updateBody.statusId;
    logger.warn(
      `Admin attempt to change statusId directly for course ${courseId} was blocked. Use approve/reject API.`
    );
  }
  if (isOwnerInstructor) {
    delete updateBody.statusId;
  }
  const dataToUpdate = { ...updateBody };
  const pool = await getConnection();
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    if (updateBody.courseName && updateBody.courseName !== course.CourseName) {
      let newSlug = generateSlug(updateBody.courseName);
      const existingSlug = await courseRepository.findCourseIdBySlug(newSlug);
      if (existingSlug && existingSlug.CourseID !== courseId) {
        newSlug = `${newSlug}-${Math.random().toString(36).substring(2, 7)}`;
      }
      dataToUpdate.Slug = newSlug;
    }
    if (updateBody.categoryId && updateBody.categoryId !== course.CategoryID) {
      const category = await categoryRepository.findCategoryById(
        updateBody.categoryId
      );
      if (!category)
        throw new ApiError(httpStatus.BAD_REQUEST, 'Danh mục không hợp lệ.');
    }
    if (updateBody.levelId && updateBody.levelId !== course.LevelID) {
      const level = await levelRepository.findLevelById(updateBody.levelId);
      if (!level)
        throw new ApiError(httpStatus.BAD_REQUEST, 'Cấp độ không hợp lệ.');
    }
    if (updateBody.language !== undefined) {
      const langExists = await languageRepository.findLanguageByCode(
        updateBody.language
      );
      if (!langExists || !langExists.IsActive) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Ngôn ngữ '${updateBody.language}' không hợp lệ hoặc không được kích hoạt.`
        );
      }
      dataToUpdate.Language = updateBody.language;
    }

    const updatedCourse = await courseRepository.updateCourseById(
      courseId,
      dataToUpdate,
      transaction
    );
    if (!updatedCourse) {
      logger.warn(
        `Update course ${courseId} returned null. Body: ${JSON.stringify(
          updateBody
        )}`
      );
      const currentCourse = await courseRepository.findCourseById(
        courseId,
        true
      );
      await transaction.commit();
      return currentCourse;
    }
    await transaction.commit();
    return toCamelCaseObject(updatedCourse);
  } catch (error) {
    logger.error(`Error updating course ${courseId}:`, error);
    if (transaction && transaction.active) {
      try {
        await transaction.rollback();
        logger.debug(`Transaction rolled back for course ${courseId}.`);
      } catch (rollbackError) {
        logger.error(
          `Failed to rollback transaction for course ${courseId}:`,
          rollbackError
        );
      }
    }
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Cập nhật khóa học thất bại.'
    );
  }
};

/**
 * Xóa khóa học (bởi Instructor hoặc Admin).
 */
const deleteCourse = async (courseId, user) => {
  const course = await courseRepository.findCourseById(courseId, true);
  if (!course) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy khóa học.');
  }
  const isAdmin = user.role === Roles.ADMIN || user.role === Roles.SUPERADMIN;
  const isOwnerInstructor =
    user.role === Roles.INSTRUCTOR && course.InstructorID === user.id;
  if (!isAdmin && !isOwnerInstructor) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Bạn không có quyền xóa khóa học này.'
    );
  }
  /* ======================================================================
     [SỬA 17/08/2026] BỎ BACKDOOR CHO ADMIN

     TRƯỚC ĐÂY guard nằm trong `if (isOwnerInstructor && ...)`, nghĩa là chỉ
     giảng viên bị chặn. Admin xóa được khóa học PUBLISHED đang có học viên,
     kéo theo CASCADE xóa sạch Enrollments và LessonProgress của toàn bộ
     học viên — không log, không backup, không khôi phục được.

     Nay áp dụng cho MỌI vai trò: đã có người mua thì không ai được xóa vĩnh
     viễn, kể cả Quản trị viên. Muốn gỡ khỏi hệ thống thì dùng luồng
     ARCHIVE_SUBMISSION (giữ nguyên quyền truy cập của học viên đã mua).
     ====================================================================== */
  const isEditableDraft = [
    CourseStatus.DRAFT,
    CourseStatus.REJECTED,
  ].includes(course.StatusID);

  if (!isEditableDraft && course.studentCount > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Khóa học đã có học viên tham gia, không thể xóa vĩnh viễn nhằm bảo vệ quyền lợi học viên. ' +
        'Vui lòng gửi yêu cầu Tạm Ngừng Xuất Bản (Archive) thay vì xóa.'
    );
  }

  /* ======================================================================
     [THÊM 17/08/2026 — BẢO TOÀN LỊCH SỬ PHIÊN BẢN]

     Guard studentCount ở trên vẫn còn một khe hở: một phiên bản SUPERSEDED
     tình cờ chưa có học viên nào sẽ lọt qua và bị xóa vĩnh viễn. Hậu quả:
       - Cột PreviousVersionID của phiên bản kế tiếp trỏ vào một dòng không còn
         tồn tại → khóa ngoại chặn lệnh xóa (lỗi 500 khó hiểu), hoặc nếu khóa
         ngoại có ON DELETE SET NULL thì chuỗi phiên bản bị đứt đoạn.
       - Màn hình "Lịch sử phiên bản" mất hẳn một mắt xích, đúng thứ mà đề tài
         này sinh ra để chứng minh.

     Nguyên tắc: LỊCH SỬ LÀ BẤT BIẾN. Đã từng phát hành thì không xóa, dù
     không bán được bản nào. Chỉ bản nháp (DRAFT/REJECTED) mới được xóa.

     LƯU Ý: guard này CHỈ áp cho khóa đã phát hành. Bản nháp cập nhật cũng mang
     VersionNumber = 2, nhưng nó chưa từng lên sóng nên vẫn phải xóa được —
     nếu không, giảng viên mở nhầm phiên cập nhật sẽ không có đường lùi.
     ====================================================================== */
  if (!isEditableDraft) {
    if (
      course.StatusID === CourseStatus.SUPERSEDED ||
      (course.VersionNumber || 1) > 1
    ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Đây là một phiên bản đã phát hành trong lịch sử khóa học nên không thể xóa vĩnh viễn. ' +
          'Lịch sử phiên bản phải được bảo toàn để đối chiếu với học viên đã mua các phiên bản trước.'
      );
    }

    // Là gốc của một dòng đã có phiên bản kế thừa? Xóa sẽ làm đứt cả chuỗi.
    const familyVersions = await courseRepository.findVersionsByRootId(
      course.RootCourseID || course.CourseID
    );
    if (familyVersions.length > 1) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Khóa học này đã có các phiên bản kế thừa nên không thể xóa vĩnh viễn. ' +
          'Vui lòng dùng Tạm Ngừng Xuất Bản (Archive).'
      );
    }
  }

  /* Là bản nháp cập nhật của một khóa đang chạy hay không?
     Nếu đúng, nó DÙNG CHUNG file Cloudinary với khóa gốc (cloneCourseRecord
     sao chép nguyên ThumbnailPublicId / IntroVideoPublicId), nên tuyệt đối
     không được dọn tài nguyên đám mây — sẽ làm mất ảnh bìa của khóa đang bán. */
  const isUpdateDraft = Boolean(course.LiveCourseID);

  if (isUpdateDraft) {
    logger.info(
      `[Versioning] Khóa ${courseId} là bản nháp cập nhật của ${course.LiveCourseID}; ` +
        `bỏ qua bước dọn Cloudinary vì tài nguyên dùng chung với bản gốc.`
    );
  } else {
    // 1. Xóa riêng Thumbnail khóa học (nếu nằm ngoài folder mặc định của khóa học)
    if (course.ThumbnailPublicId) {
      try {
        await cloudinaryUtil.deleteAsset(course.ThumbnailPublicId, {
          resource_type: 'image',
        });
        logger.info(
          `Course thumbnail deleted from Cloudinary: ${course.ThumbnailPublicId}`
        );
      } catch (error) {
        logger.error(
          `Failed to delete course thumbnail ${course.ThumbnailPublicId}:`,
          error
        );
      }
    }

    // 2. Dọn rác Khóa học bằng 1 lệnh Bulk Delete duy nhất cho toàn bộ folder
    await cloudinaryUtil.deleteResourcesByPrefix(`courses/${courseId}/`);
    logger.info(
      `Bulk deleted all Cloudinary resources under folder courses/${courseId}/`
    );
  }

  await courseRepository.deleteCourseById(courseId);
  logger.info(`Course ${courseId} deleted by user ${user.id}`);
  await aiSyncService.removeCourseFromAi(course.CourseName);
};

/**
 * Cập nhật thumbnail cho khóa học.
 */
const updateCourseThumbnail = async (courseId, file, user) => {
  const course = await courseRepository.findCourseById(courseId, true);
  if (!course) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy khóa học.');
  }
  const isAdmin = user.role === Roles.ADMIN || user.role === Roles.SUPERADMIN;
  const isOwnerInstructor =
    user.role === Roles.INSTRUCTOR && course.InstructorID === user.id;
  if (!isAdmin && !isOwnerInstructor) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Bạn không có quyền cập nhật khóa học này.'
    );
  }
  if (
    isOwnerInstructor &&
    ![CourseStatus.DRAFT, CourseStatus.REJECTED].includes(course.StatusID)
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Bạn chỉ có thể cập nhật khóa học khi ở trạng thái ${CourseStatus.DRAFT} hoặc ${CourseStatus.REJECTED}.`
    );
  }
  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Vui lòng chọn file thumbnail.');
  }
  if (course.ThumbnailPublicId) {
    try {
      await cloudinaryUtil.deleteAsset(course.ThumbnailPublicId, {
        resource_type: 'image',
      });
      logger.info(
        `Old thumbnail deleted from Cloudinary: ${course.ThumbnailPublicId}`
      );
    } catch (deleteError) {
      logger.error(
        `Failed to delete old thumbnail ${course.ThumbnailPublicId}:`,
        deleteError
      );
    }
  }
  let uploadResult;
  try {
    const options = {
      folder: `courses/${courseId}/thumbnails`,
      resource_type: 'image',
    };
    uploadResult = await cloudinaryUtil.uploadStream(file.buffer, options);
  } catch (uploadError) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Upload thumbnail thất bại.'
    );
  }
  const updateData = {
    ThumbnailUrl: uploadResult.secure_url,
    ThumbnailPublicId: uploadResult.public_id,
  };
  let updatedCourse;
  try {
    updatedCourse = await courseRepository.updateCourseById(
      courseId,
      updateData
    );
    if (!updatedCourse) {
      throw new Error('Failed to update course in DB.');
    }
  } catch (dbError) {
    logger.error(
      `Failed to update course ${courseId} in DB after thumbnail upload. Uploaded public_id: ${uploadResult.public_id}`
    );
    try {
      await cloudinaryUtil.deleteAsset(uploadResult.public_id, {
        resource_type: 'image',
      });
      logger.info(
        `Rolled back thumbnail upload: Deleted ${uploadResult.public_id}`
      );
    } catch (rollbackError) {
      logger.error(
        `Failed to rollback thumbnail upload for ${uploadResult.public_id}:`,
        rollbackError
      );
    }
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Cập nhật thông tin khóa học sau khi upload thất bại.'
    );
  }
  return toCamelCaseObject(updatedCourse);
};

/**
 * Cập nhật video giới thiệu cho khóa học (upload lên Cloudinary dạng public).
 */
const updateCourseIntroVideo = async (courseId, file, user) => {
  const course = await courseRepository.findCourseById(courseId, true);
  if (!course) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy khóa học.');
  }
  const isAdmin = user.role === Roles.ADMIN || user.role === Roles.SUPERADMIN;
  const isOwnerInstructor =
    user.role === Roles.INSTRUCTOR && course.InstructorID === user.id;
  if (!isAdmin && !isOwnerInstructor) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Bạn không có quyền cập nhật khóa học này.'
    );
  }
  if (
    isOwnerInstructor &&
    ![CourseStatus.DRAFT, CourseStatus.REJECTED].includes(course.StatusID)
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Bạn chỉ có thể cập nhật khóa học khi ở trạng thái ${CourseStatus.DRAFT} hoặc ${CourseStatus.REJECTED}.`
    );
  }
  if (!file) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Vui lòng chọn file video giới thiệu.'
    );
  }
  if (course.IntroVideoPublicId) {
    try {
      await cloudinaryUtil.deleteAsset(course.IntroVideoPublicId, {
        resource_type: 'video',
        type: 'upload',
      });
      logger.info(
        `Old intro video deleted from Cloudinary: ${course.IntroVideoPublicId}`
      );
    } catch (deleteError) {
      logger.error(
        `Failed to delete old intro video ${course.IntroVideoPublicId}:`,
        deleteError
      );
    }
  }
  let uploadResult;
  try {
    const options = {
      folder: `courses/${courseId}/intro_videos`,
      resource_type: 'video',
      type: 'upload',
    };
    uploadResult = await cloudinaryUtil.uploadStream(file.buffer, options);
  } catch (uploadError) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Upload video giới thiệu thất bại.'
    );
  }
  const updateData = {
    IntroVideoUrl: uploadResult.secure_url,
    IntroVideoPublicId: uploadResult.public_id,
  };
  const updatedCourse = await courseRepository.updateCourseById(
    courseId,
    updateData
  );
  if (!updatedCourse) {
    logger.error(
      `Failed to update course ${courseId} in DB after intro video upload. Uploaded public_id: ${uploadResult.public_id}`
    );
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Cập nhật thông tin khóa học sau khi upload thất bại.'
    );
  }
  return toCamelCaseObject(updatedCourse);
};

/**
 * Giảng viên gửi yêu cầu duyệt khóa học.
 */
const submitCourseForApproval = async (courseId, user, notes = null) => {
  const course = await courseRepository.findCourseById(courseId, true);
  if (!course) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy khóa học.');
  }
  if (course.InstructorID !== user.id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Bạn không phải là giảng viên của khóa học này.'
    );
  }
  if (![CourseStatus.DRAFT, CourseStatus.REJECTED].includes(course.StatusID)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Chỉ có thể gửi duyệt khóa học nháp hoặc bị từ chối.'
    );
  }
  const existingRequest =
    await courseRepository.findPendingApprovalRequestByCourseId(courseId);
  if (existingRequest) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Khóa học này đã được gửi duyệt và đang chờ xử lý.'
    );
  }
  const sections = await sectionRepository.findSectionsByCourseId(courseId);
  if (!sections || sections.length === 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Khóa học phải có ít nhất một phần (section) trước khi gửi duyệt.'
    );
  }
  const lessons = [];
  for (const section of sections) {
    const sectionLessons = await lessonRepository.findLessonsBySectionId(
      section.SectionID
    );
    lessons.push(...sectionLessons);
  }
  if (!lessons || lessons.length === 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Khóa học phải có ít nhất một bài học (lesson) trước khi gửi duyệt.'
    );
  }
  const hasValidLessons = lessons.some(
    (lesson) => lesson.LessonName?.trim() && lesson.LessonType
  );
  if (!hasValidLessons) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Tất cả các bài học (lesson) trong khóa học phải có tên và loại hợp lệ.'
    );
  }
  await courseRepository.updateCourseById(courseId, {
    StatusID: CourseStatus.PENDING,
  });
  let requestType;
  if (course.LiveCourseID) {
    requestType = ApprovalRequestType.UPDATE_SUBMISSION;
  } else if (course.StatusID === CourseStatus.REJECTED) {
    requestType = ApprovalRequestType.RE_SUBMISSION;
  } else {
    requestType = ApprovalRequestType.INITIAL_SUBMISSION;
  }
  logger.info(`Submitting course ${courseId} with RequestType: ${requestType}`);
  const approvalRequest = await courseRepository.createCourseApprovalRequest({
    courseId,
    instructorId: user.id,
    requestType,
    instructorNotes: notes,
  });
  try {
    const course = await courseRepository.findCourseById(courseId, true);
    const message = `Giảng viên ${
      user.fullName || user.email
    } vừa gửi yêu cầu duyệt cho khóa học "${course?.CourseName || 'mới'}".`;
    const adminIds = await authRepository.findAccountIdsByRoles([
      Roles.ADMIN,
      Roles.SUPERADMIN,
    ]);
    for (const adminIdObj of adminIds) {
      const adminId =
        typeof adminIdObj === 'object' && adminIdObj.AccountID
          ? adminIdObj.AccountID
          : adminIdObj;
      await notificationService.createNotification(
        adminId,
        'COURSE_SUBMITTED',
        message,
        { type: 'CourseApprovalRequest', id: approvalRequest.RequestID }
      );
    }
  } catch (notifyError) {
    logger.error(
      `Failed to send notification for course submission ${courseId}:`,
      notifyError
    );
  }
  return toCamelCaseObject(approvalRequest);
};

/**
 * Lấy yêu cầu duyệt khóa học đang chờ xử lý (PENDING) theo CourseID.
 */
const getPendingApprovalRequestByCourseId = async (courseId) => {
  const request =
    await courseRepository.findPendingApprovalRequestByCourseId(courseId);
  return request ? toCamelCaseObject(request) : null;
};

// ============================================================================
// [VÔ HIỆU HÓA 17/08/2026 — CHUYỂN SANG MÔ HÌNH COURSE VERSIONING]
// ----------------------------------------------------------------------------
// Toàn bộ khối "Diff-and-Patch" bên dưới (cloneLessonSubComponents,
// cloneFullLesson, syncQuizForLesson, syncLessonsForSection và
// syncLiveCourseFromUpdate) KHÔNG CÒN ĐƯỢC SỬ DỤNG.
//
// CƠ CHẾ CŨ: khi Admin duyệt bản cập nhật, hệ thống so sánh bản nháp với bản
// đang chạy rồi VÁ TỪNG BÀI HỌC vào chính khóa học đang chạy — nghĩa là học
// viên đã mua bị đổi nội dung ngay dưới chân mình.
//
// CƠ CHẾ MỚI (promoteCourseVersion): bản nháp TRỞ THÀNH phiên bản mới, bản cũ
// chuyển sang trạng thái SUPERSEDED và giữ nguyên vẹn 100%. Không một câu lệnh
// nào chạm vào Sections / Lessons / LessonProgress của phiên bản cũ.
//
// TIỆN THỂ SỬA LUÔN MỘT LỖI NGHIÊM TRỌNG: dòng
//     await cloneFullLesson(updateSection, liveCourseId, transaction);
// ở cuối syncLiveCourseFromUpdate truyền một object Section vào tham số
// `lessonToClone`, và truyền `liveCourseId` vào vị trí `newSectionId`. Hệ quả:
// mỗi khi giảng viên THÊM MỘT CHƯƠNG MỚI rồi gửi duyệt, job đồng bộ ném lỗi
// INSERT (LessonName NOT NULL) -> rollback -> yêu cầu duyệt kẹt vĩnh viễn ở
// trạng thái APPROVED nhưng nội dung không bao giờ được áp dụng.
// Lỗi này biến mất cùng việc bỏ cả khối, không cần vá.
//
// Giữ lại dạng comment để đối chiếu khi bảo vệ đồ án (thể hiện quá trình tiến
// hóa kiến trúc). Có thể xóa hẳn sau khi nghiệm thu xong Level 1.
//
// LƯU Ý KỸ THUẬT: dùng comment hai gạch chéo từng dòng thay vì bọc khối, vì
// đoạn bên dưới có sẵn các JSDoc kết thúc bằng dấu đóng comment — JavaScript
// không hỗ trợ comment khối lồng nhau.
// ============================================================================
// /**
//  * [HELPER 1] Clone CÁC THÀNH PHẦN CON của một lesson sang một lesson khác.
//  */
// async function cloneLessonSubComponents(
//   fromLesson,
//   toLessonId,
//   transaction,
//   skipQuiz = false
// ) {
//   if (
//     !skipQuiz &&
//     fromLesson.lessonType === LessonType.QUIZ &&
//     fromLesson.questions?.length > 0
//   ) {
//     for (const question of fromLesson.questions) {
//       const newQuestion = await quizRepository.createQuestion(
//         toPascalCaseObject({
//           lessonId: toLessonId,
//           ...question,
//         }),
//         transaction
//       );
//       if (question.options?.length > 0) {
//         const optionsData = question.options.map((opt) =>
//           toCamelCaseObject(opt)
//         );
//         await quizRepository.createOptionsForQuestion(
//           newQuestion.QuestionID,
//           optionsData,
//           transaction
//         );
//       }
//     }
//   }
//   if (fromLesson.attachments?.length > 0) {
//     for (const attachment of fromLesson.attachments) {
//       await lessonAttachmentRepository.createAttachment(
//         toPascalCaseObject({ lessonId: toLessonId, ...attachment }),
//         transaction
//       );
//     }
//   }
//   if (fromLesson.subtitles?.length > 0) {
//     for (const subtitle of fromLesson.subtitles) {
//       await subtitleRepository.addSubtitle(
//         toPascalCaseObject({ lessonId: toLessonId, ...subtitle }),
//         transaction
//       );
//     }
//   }
// }
//
// /**
//  * [HELPER 2] Clone MỘT LESSON ĐẦY ĐỦ.
//  */
// async function cloneFullLesson(lessonToClone, newSectionId, transaction) {
//   const newLessonData = {
//     ...lessonToClone,
//     sectionId: newSectionId,
//     originalId: null,
//   };
//   const newLesson = await lessonRepository.createLesson(
//     toPascalCaseObject(newLessonData),
//     transaction
//   );
//   await cloneLessonSubComponents(
//     lessonToClone,
//     newLesson.LessonID,
//     transaction
//   );
// }
//
// /**
//  * [HELPER 3] Đồng bộ hóa Quiz cho một lesson bằng "Archive và Tạo lại".
//  */
// async function syncQuizForLesson(updateQuestions, liveLessonId, transaction) {
//   await quizRepository.archiveQuestionsByLessonId(liveLessonId, transaction);
//   if (updateQuestions?.length > 0) {
//     for (const uQuestion of updateQuestions) {
//       const newQuestion = await quizRepository.createQuestion(
//         {
//           LessonID: liveLessonId,
//           QuestionText: uQuestion.questionText,
//           Explanation: uQuestion.explanation,
//           QuestionOrder: uQuestion.questionOrder,
//         },
//         transaction
//       );
//       if (uQuestion.options?.length > 0) {
//         const optionsData = uQuestion.options.map((opt) => ({
//           optionText: opt.optionText,
//           isCorrectAnswer: opt.isCorrectAnswer,
//           optionOrder: opt.optionOrder,
//         }));
//         await quizRepository.createOptionsForQuestion(
//           newQuestion.QuestionID,
//           optionsData,
//           transaction
//         );
//       }
//     }
//   }
// }
//
// /**
//  * [HELPER 5] Đồng bộ hóa các lessons cho một section.
//  */
// async function syncLessonsForSection(
//   updateLessons,
//   liveSectionId,
//   transaction
// ) {
//   const cloudFilesToDelete = [];
//   const liveLessonsRaw =
//     await lessonRepository.findAllLessonsWithDetailsBySectionIds(
//       [liveSectionId],
//       transaction
//     );
//   const liveLessons = toCamelCaseObject(
//     liveLessonsRaw.filter((l) => !l.isArchived)
//   );
//   const updateLessonsMap = new Map(
//     (updateLessons || []).map((l) => [l.originalId, l])
//   );
//   const liveLessonsMapById = new Map(liveLessons.map((l) => [l.lessonId, l]));
//   const lessonsToArchiveIds = [];
//   for (const [liveLessonId] of liveLessonsMapById.entries()) {
//     if (!updateLessonsMap.has(liveLessonId)) {
//       lessonsToArchiveIds.push(liveLessonId);
//     }
//   }
//   if (lessonsToArchiveIds.length > 0) {
//     await lessonRepository.archiveLessonsByIds(
//       lessonsToArchiveIds,
//       transaction
//     );
//   }
//   for (const updateLesson of updateLessons || []) {
//     const originalLessonId = updateLesson.originalId;
//     logger.debug(
//       `[syncLessonsForSection] Processing lesson: ${updateLesson.lessonName} (ID: ${originalLessonId})`,
//       { updateLesson }
//     );
//     if (originalLessonId && liveLessonsMapById.has(originalLessonId)) {
//       const liveLesson = liveLessonsMapById.get(originalLessonId);
//       const oldVideoId = liveLesson.externalVideoId;
//       const newVideoId = updateLesson.externalVideoId;
//       if (
//         liveLesson.lessonType === 'VIDEO' &&
//         oldVideoId &&
//         newVideoId !== oldVideoId &&
//         liveLesson.videoSourceType === 'CLOUDINARY'
//       ) {
//         cloudFilesToDelete.push({
//           publicId: oldVideoId,
//           resourceType: 'video',
//         });
//       }
//       await lessonRepository.updateLessonById(
//         originalLessonId,
//         toPascalCaseObject(updateLesson),
//         transaction
//       );
//       await syncQuizForLesson(
//         updateLesson.questions || [],
//         originalLessonId,
//         transaction
//       );
//       const attachmentsResult =
//         await lessonAttachmentRepository.deleteAttachmentsByLessonId(
//           originalLessonId,
//           transaction
//         );
//       cloudFilesToDelete.push(...attachmentsResult.filesToDelete);
//       if (updateLesson.attachments?.length > 0) {
//         for (const attachment of updateLesson.attachments) {
//           const newAttachmentData = {
//             LessonID: originalLessonId,
//             FileName: attachment.fileName,
//             FileURL: attachment.fileUrl,
//             FileType: attachment.fileType,
//             FileSize: attachment.fileSize,
//             CloudStorageID: attachment.cloudStorageId,
//           };
//           await lessonAttachmentRepository.createAttachment(
//             newAttachmentData,
//             transaction
//           );
//         }
//       }
//       await subtitleRepository.deleteSubtitlesByLessonId(
//         originalLessonId,
//         transaction
//       );
//       if (updateLesson.subtitles?.length > 0) {
//         for (const subtitle of updateLesson.subtitles) {
//           const newSubtitleData = {
//             LessonID: originalLessonId,
//             LanguageCode: subtitle.languageCode,
//             SubtitleUrl: subtitle.subtitleUrl,
//             IsDefault: subtitle.isDefault,
//           };
//           await subtitleRepository.addSubtitle(newSubtitleData, transaction);
//         }
//       }
//     } else {
//       await cloneFullLesson(updateLesson, liveSectionId, transaction);
//     }
//   }
//   return cloudFilesToDelete;
// }
//
// /**
//  * [HÀM CHÍNH - FINAL] Thực hiện logic "Smart Sync" từ bản sao sang bản gốc.
//  */
// async function syncLiveCourseFromUpdate(
//   updateCourseId,
//   liveCourseId,
//   transaction
// ) {
//   logger.info(
//     `Starting Diff-and-Patch Sync from course ${updateCourseId} to ${liveCourseId}`
//   );
//   const allCloudFilesToDelete = [];
//   const updateCurriculumRaw =
//     await sectionRepository.findAllSectionsWithDetails(
//       updateCourseId,
//       transaction
//     );
//   const liveCurriculumRaw = await sectionRepository.findAllSectionsWithDetails(
//     liveCourseId,
//     transaction
//   );
//   const updateCurriculum = toCamelCaseObject(updateCurriculumRaw);
//   const liveCurriculum = toCamelCaseObject(
//     liveCurriculumRaw.filter((s) => !s.isArchived)
//   );
//   const updateSectionsMap = new Map(
//     updateCurriculum.map((s) => [s.originalId, s])
//   );
//   const liveSectionsMapById = new Map(
//     liveCurriculum.map((s) => [s.sectionId, s])
//   );
//   const sectionsToArchiveIds = [];
//   for (const [liveSectionId] of liveSectionsMapById.entries()) {
//     if (!updateSectionsMap.has(liveSectionId)) {
//       sectionsToArchiveIds.push(liveSectionId);
//     }
//   }
//   if (sectionsToArchiveIds.length > 0) {
//     await sectionRepository.archiveSectionsByIds(
//       sectionsToArchiveIds,
//       transaction
//     );
//   }
//   for (const updateSection of updateCurriculum) {
//     const originalSectionId = updateSection.originalId;
//     if (originalSectionId && liveSectionsMapById.has(originalSectionId)) {
//       await sectionRepository.updateSectionById(
//         originalSectionId,
//         toPascalCaseObject(updateSection),
//         transaction
//       );
//       const filesFromLessons = await syncLessonsForSection(
//         updateSection.lessons || [],
//         originalSectionId,
//         transaction
//       );
//       allCloudFilesToDelete.push(...filesFromLessons);
//     } else {
//       await cloneFullLesson(updateSection, liveCourseId, transaction);
//     }
//   }
//   const updateCourseDataRaw = await courseRepository.findCourseById(
//     updateCourseId,
//     true,
//     transaction
//   );
//   const updateCourseData = toCamelCaseObject(updateCourseDataRaw);
//   await courseRepository.updateCourseById(
//     liveCourseId,
//     toPascalCaseObject({
//       courseName: updateCourseData.courseName,
//       shortDescription: updateCourseData.shortDescription,
//       fullDescription: updateCourseData.fullDescription,
//       requirements: updateCourseData.requirements,
//       learningOutcomes: updateCourseData.learningOutcomes,
//       originalPrice: updateCourseData.originalPrice,
//       discountedPrice: updateCourseData.discountedPrice,
//       categoryId: updateCourseData.categoryId,
//       levelId: updateCourseData.levelId,
//       language: updateCourseData.language,
//     }),
//     transaction
//   );
//   logger.info(`Synced course-level details to live course ${liveCourseId}`);
//   return allCloudFilesToDelete;
// }

/**
 * Admin phê duyệt hoặc từ chối khóa học.
 */
const reviewCourseApproval = async (
  requestId,
  decision,
  user,
  adminNotes = null
) => {
  // ==========================================================================
  // [THÊM 17/08/2026] Lớp bảo vệ thứ hai (defense in depth)
  // --------------------------------------------------------------------------
  // Trước đây hàm này KHÔNG kiểm tra role. Kết hợp với việc router
  // approvalRequests.routes.js cho phép cả INSTRUCTOR đi qua, giảng viên có
  // thể tự duyệt khóa học của mình.
  // Router đã được siết lại, nhưng vẫn kiểm tra ở đây vì hàm này còn được
  // gọi từ một route thứ hai: PATCH /v1/courses/reviews/:requestId
  // (courses.routes.js). Kiểm tra ở service đảm bảo mọi lối vào đều an toàn.
  // ==========================================================================
  if (![Roles.ADMIN, Roles.SUPERADMIN].includes(user?.role)) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Chỉ Quản trị viên mới có quyền duyệt yêu cầu khóa học.'
    );
  }

  let updatedRequest;
  const approvalRequest =
    await courseRepository.findCourseApprovalRequestById(requestId);
  if (!approvalRequest) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Không tìm thấy yêu cầu duyệt hoặc yêu cầu đã được xử lý.'
    );
  }
  if (approvalRequest.Status !== ApprovalStatus.PENDING) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Yêu cầu này đã được xử lý.');
  }
  const courseId = approvalRequest.CourseID;
  let newCourseStatus;
  const publishedAt = null;
  let courseData;
  // Thông tin phiên bản vừa thăng cấp, dùng để gửi thông báo SAU khi commit
  let promotionResult = null;
  const pool = await getConnection();
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    if (
      decision === ApprovalStatus.APPROVED &&
      approvalRequest.RequestType === ApprovalRequestType.UPDATE_SUBMISSION
    ) {
      /* ==================================================================
         [VIẾT LẠI 17/08/2026 — COURSE VERSIONING]

         TRƯỚC ĐÂY: chỉ đánh dấu APPROVED rồi đẩy một job BullMQ để Worker
         chạy nền `syncLiveCourseFromUpdate` — vá từng bài học vào khóa đang
         chạy. Cách đó có ba vấn đề nghiêm trọng:
           1. Học viên đã mua bị thay đổi nội dung ngay dưới chân.
           2. Job chạy SAU khi transaction đã commit trạng thái APPROVED. Nếu
              job lỗi (và nó luôn lỗi khi giảng viên thêm chương mới — xem
              phần comment về bug cloneFullLesson ở trên), yêu cầu duyệt kẹt
              vĩnh viễn: đã APPROVED nhưng nội dung không bao giờ được áp dụng,
              và KHÔNG có cơ chế nào đưa nó về lại PENDING.
           3. Admin thấy API trả 200 và tin rằng đã duyệt xong.

         BÂY GIỜ: thăng cấp phiên bản diễn ra ĐỒNG BỘ, ngay trong cùng
         transaction với việc đổi trạng thái yêu cầu duyệt. Hoặc cả hai cùng
         thành công, hoặc cả hai cùng rollback — không còn trạng thái nửa vời.
         Thao tác cũng nhẹ hơn hẳn: chỉ là 2 câu UPDATE trên bảng Courses,
         không đụng tới Sections/Lessons nên không cần chạy nền.
         ================================================================== */
      const draftCourseId = approvalRequest.CourseID;
      const draftCourse = await courseRepository.findCourseById(
        draftCourseId,
        true,
        transaction
      );
      const liveCourseId = draftCourse?.LiveCourseID;
      if (!liveCourseId) {
        throw new ApiError(
          httpStatus.INTERNAL_SERVER_ERROR,
          'Không tìm thấy khóa học gốc để áp dụng phiên bản mới.'
        );
      }

      // Ghi nhận quyết định duyệt
      updatedRequest = await courseRepository.updateApprovalRequestStatus(
        requestId,
        { status: decision, adminId: user.id, adminNotes },
        transaction
      );

      // Thăng cấp: bản nháp -> phiên bản chính thức, bản cũ -> SUPERSEDED
      const promotion = await courseRepository.promoteDraftToLiveVersion(
        draftCourseId,
        liveCourseId,
        transaction
      );

      /* ⚠️ KHÔNG gọi findCourseById(draftCourseId) ở đây nếu KHÔNG truyền
         transaction. Câu UPDATE ngay phía trên đang giữ khóa ghi độc quyền
         (exclusive lock) trên đúng dòng Courses đó. Một kết nối KHÁC lấy từ
         pool sẽ nằm chờ khóa được nhả, trong khi transaction lại đang chờ câu
         đọc đó xong mới commit — hai bên chờ nhau, request treo tới khi hết
         lock timeout. Đây là kiểu tự khóa chính mình (self-deadlock) rất khó
         tái hiện lúc dev vì chỉ lộ ra khi có tải thật.
         Bản nháp đã được đọc ở trên (draftCourse) và việc thăng cấp không đổi
         CourseName, nên dùng lại luôn — vừa đúng vừa tiết kiệm một truy vấn. */
      courseData = draftCourse;
      promotionResult = {
        newCourseId: draftCourseId,
        retiredCourseId: liveCourseId,
        courseName: courseData?.CourseName,
        instructorId: approvalRequest.InstructorID,
        ...promotion,
      };

      logger.info(
        `[Versioning] Khóa học ${draftCourseId} đã trở thành phiên bản v${promotion.versionNumber} ` +
          `(slug: ${promotion.newSlug}). Phiên bản cũ ${liveCourseId} chuyển sang SUPERSEDED ` +
          `với slug ${promotion.retiredSlug}. Dữ liệu học viên phiên bản cũ được giữ nguyên.`
      );
    } else {
      if (decision === ApprovalStatus.REJECTED) {
        newCourseStatus = CourseStatus.REJECTED;
      } else if (decision === ApprovalStatus.NEEDS_REVISION) {
        newCourseStatus = CourseStatus.REJECTED;
      } else if (
        decision === ApprovalStatus.APPROVED &&
        approvalRequest.RequestType === ApprovalRequestType.INITIAL_SUBMISSION
      ) {
        newCourseStatus = CourseStatus.PUBLISHED;
      } else if (
        decision === ApprovalStatus.APPROVED &&
        approvalRequest.RequestType === ApprovalRequestType.RE_SUBMISSION
      ) {
        newCourseStatus = CourseStatus.PUBLISHED;
      } else if (
        decision === ApprovalStatus.APPROVED &&
        approvalRequest.RequestType === ApprovalRequestType.ARCHIVE_SUBMISSION
      ) {
        newCourseStatus = CourseStatus.ARCHIVED;
      } else {
        console.log(
          `Decision: ${decision}, RequestType: ${approvalRequest.RequestType}`
        );
        throw new ApiError(httpStatus.BAD_REQUEST, 'Quyết định không hợp lệ.');
      }
      courseData = await courseRepository.findCourseById(courseId);
      updatedRequest = await courseRepository.updateApprovalRequestStatus(
        requestId,
        {
          status: decision,
          adminId: user.id,
          adminNotes,
        },
        transaction
      );
      const courseUpdateData = { StatusID: newCourseStatus };
      if (publishedAt) {
        courseUpdateData.PublishedAt = publishedAt;
      }
      await courseRepository.updateCourseById(
        courseId,
        courseUpdateData,
        transaction
      );
    }
    await transaction.commit();

    /* ============================================================
       [THAY THẾ 17/08/2026] Trước đây chỗ này đẩy job BullMQ để Worker chạy
       nền `syncLiveCourseFromUpdate`. Việc thăng cấp phiên bản nay đã hoàn tất
       ĐỒNG BỘ bên trong transaction ở trên, nên không còn job nào để đẩy.

       Phần còn lại sau commit chỉ là gửi thông báo — thao tác phụ, thất bại
       cũng không được phép ảnh hưởng tới kết quả nghiệp vụ đã commit.
       ============================================================ */
    if (promotionResult) {
      try {
        // 1. Báo giảng viên: phiên bản mới đã lên sóng
        await notificationService.createNotification(
          promotionResult.instructorId,
          'COURSE_APPROVED',
          `Phiên bản v${promotionResult.versionNumber} của khóa học "${promotionResult.courseName}" đã được phê duyệt và xuất bản! ` +
            `Học viên mua từ nay sẽ học phiên bản này. Học viên đã mua các phiên bản trước vẫn giữ nguyên nội dung cũ.`,
          { type: 'Course', id: promotionResult.newCourseId }
        );

        // 2. Báo học viên của PHIÊN BẢN CŨ: đã có phiên bản mới.
        //    Họ KHÔNG bị chuyển sang phiên bản mới — chỉ được thông báo.
        //    Dùng repository trực tiếp (đã có sẵn hàm này) thay vì gọi qua
        //    enrollments.service để tránh phụ thuộc vòng giữa hai service.
        const enrollmentRepository = require('../enrollments/enrollments.repository');
        const retiredStudents =
          await enrollmentRepository.findEnrolledStudentsByCourseId(
            promotionResult.retiredCourseId
          );
        for (const student of retiredStudents) {
          await notificationService.createNotification(
            student.AccountID,
            'SYSTEM',
            `Khóa học "${promotionResult.courseName}" vừa có phiên bản mới (v${promotionResult.versionNumber}). ` +
              `Bạn vẫn tiếp tục học phiên bản đã mua, toàn bộ tiến độ được giữ nguyên.`,
            { type: 'Course', id: promotionResult.retiredCourseId }
          );
        }
        logger.info(
          `[Versioning] Đã thông báo cho ${retiredStudents.length} học viên của phiên bản cũ ${promotionResult.retiredCourseId}.`
        );
      } catch (notifyError) {
        logger.error(
          `[Versioning] Thăng cấp phiên bản THÀNH CÔNG nhưng gửi thông báo thất bại (không ảnh hưởng dữ liệu):`,
          notifyError
        );
      }
    }

    // Gửi thông báo cho instructor (cho các trường hợp không phải UPDATE_SUBMISSION)
    if (!promotionResult) {
      try {
        const instructorId = approvalRequest.InstructorID;
        let notifyMessage = '';
        let notifyType = '';
        if (decision === ApprovalStatus.APPROVED) {
          notifyMessage = `Khóa học "${
            courseData?.CourseName || 'của bạn'
          }" đã được phê duyệt và xuất bản!`;
          notifyType = 'COURSE_APPROVED';
        } else if (decision === ApprovalStatus.REJECTED) {
          notifyMessage = `Khóa học "${
            courseData?.CourseName || 'của bạn'
          }" đã bị từ chối.${adminNotes ? ` Lý do: ${adminNotes}` : ''}`;
          notifyType = 'COURSE_REJECTED';
        }
        if (notifyType) {
          await notificationService.createNotification(
            instructorId,
            notifyType,
            notifyMessage,
            { type: 'Course', id: courseId }
          );
        }
      } catch (notifyError) {
        logger.error(
          `Failed to send notification for course review ${requestId}:`,
          notifyError
        );
      }
    }

    return toCamelCaseObject(updatedRequest);
  } catch (error) {
    logger.error(`Error reviewing approval request ${requestId}:`, error);
    await transaction.rollback();
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Xử lý yêu cầu duyệt thất bại.'
    );
  }
};

/**
 * Admin đánh dấu/bỏ đánh dấu khóa học nổi bật.
 */
const toggleCourseFeature = async (courseId, isFeatured, user) => {
  const course = await courseRepository.findCourseById(courseId, true);
  if (!course) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy khóa học.');
  }
  if (isFeatured && course.StatusID !== CourseStatus.PUBLISHED) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Chỉ có thể đánh dấu nổi bật cho khóa học đã xuất bản.'
    );
  }
  const updatedCourse = await courseRepository.updateCourseById(courseId, {
    IsFeatured: isFeatured,
  });
  if (!updatedCourse) {
    logger.warn(
      `Toggle feature for course ${courseId} to ${isFeatured} returned null.`
    );
    return course;
  }
  logger.info(
    `Admin ${user.id} set IsFeatured=${isFeatured} for course ${courseId}`
  );
  return updatedCourse;
};

/**
 * Admin: Lấy danh sách các yêu cầu phê duyệt khóa học.
 */
const getApprovalRequests = async (filters = {}, options = {}) => {
  const { page = 1, limit = 10, sortBy } = options;
  const result = await courseRepository.findCourseApprovalRequests(filters, {
    page,
    limit,
    sortBy,
  });
  return {
    requests: toCamelCaseObject(result.requests),
    total: result.total,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalPages: Math.ceil(result.total / limit),
  };
};

/**
 * Admin: Lấy chi tiết một yêu cầu phê duyệt.
 */
const getApprovalRequestDetails = async (requestId) => {
  const requestDetails =
    await courseRepository.findCourseApprovalRequestById(requestId);
  if (!requestDetails) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Không tìm thấy yêu cầu phê duyệt.'
    );
  }
  return toCamelCaseObject(requestDetails);
};

/**
 * Lấy tất cả trạng thái khóa học.
 */
const getCourseStatuses = async () => {
  const statuses = await courseRepository.getAllCourseStatuses();
  return toCamelCaseObject(statuses);
};

/**
 * Query for courses by category slug with pagination and filtering.
 */
const queryCoursesByCategorySlug = async (
  categorySlug,
  filterOptions,
  paginationOptions,
  targetCurrency = 'USD'
) => {
  const category = await categoryRepository.findCategoryBySlug(categorySlug);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }
  const combinedFilterOptions = {
    ...filterOptions,
    categoryId: category.CategoryID,
    statusId: CourseStatus.PUBLISHED,
  };
  const courses = await courseRepository.findAllCourses(
    combinedFilterOptions,
    paginationOptions
  );
  for (const course of courses.courses) {
    course.pricing = await pricingUtil.createPricingObject(
      course,
      targetCurrency
    );
  }
  return toCamelCaseObject(courses);
};

/**
 * Hủy một phiên cập nhật và khôi phục trạng thái của khóa học gốc.
 */
const cancelUpdate = async (updateCourseId, user) => {
  const draftCourse = await courseRepository.findCourseById(
    updateCourseId,
    true
  );
  if (!draftCourse || !draftCourse.LiveCourseID) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Không tìm thấy phiên bản cập nhật hợp lệ.'
    );
  }
  const liveCourseId = draftCourse.LiveCourseID;
  const originalCourse = await courseRepository.findCourseById(
    liveCourseId,
    true
  );
  if (!originalCourse || originalCourse.InstructorID !== user.id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Bạn không có quyền thực hiện hành động này.'
    );
  }
  const pool = await getConnection();
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    /* [SỬA 17/08/2026 — Course Versioning]
       BỎ câu lệnh `updateCourseById(liveCourseId, { StatusID: PUBLISHED })`.
       Trong mô hình mới, khóa học đang chạy KHÔNG hề bị đổi trạng thái khi
       giảng viên mở phiên cập nhật — nó vẫn PUBLISHED và vẫn bán bình thường
       suốt thời gian bản nháp được soạn. Vì vậy lúc hủy nháp cũng không có gì
       cần khôi phục. Câu lệnh cũ là tàn dư của ý tưởng "trạng thái UPDATING"
       vốn chưa bao giờ được triển khai (xem CourseStatuses trong DB).

       Chỉ xóa bản nháp. An toàn tuyệt đối vì bản nháp không có học viên nào.
       Xóa khóa nháp sẽ CASCADE xuống Sections/Lessons của chính nó — đây là
       lý do V8__protect_student_data.sql cố ý GIỮ CASCADE cho hai quan hệ đó. */
    await courseRepository.deleteCourseById(updateCourseId, transaction);
    await transaction.commit();

    /* ⚠️ KHÔNG dọn tài nguyên Cloudinary ở đây.
       cloneCourseRecord sao chép nguyên ThumbnailPublicId và IntroVideoPublicId
       từ khóa gốc sang bản nháp — hai bản ghi DÙNG CHUNG cùng một file trên
       Cloudinary. Nếu xóa file theo bản nháp, ảnh bìa và video giới thiệu của
       khóa học ĐANG BÁN sẽ biến mất. */
    logger.info(
      `[Versioning] Đã hủy bản nháp ${updateCourseId}. Không đụng tới khóa đang chạy ${liveCourseId} ` +
        `và không xóa tài nguyên Cloudinary (dùng chung với bản gốc).`
    );
    return { originalCourseSlug: originalCourse.Slug };
  } catch (error) {
    await transaction.rollback();
    logger.error(
      `Error cancelling update session for draft course ${updateCourseId}:`,
      error
    );
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Hủy phiên cập nhật thất bại.'
    );
  }
};

/**
 * Tạo một phiên cập nhật (bản sao) cho một khóa học đã xuất bản.
 */
const createUpdateSession = async (courseId, user) => {
  const originalCourse = await courseRepository.findCourseById(courseId, true);
  if (!originalCourse) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy khóa học gốc.');
  }
  if (originalCourse.InstructorID !== user.id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Bạn không phải là giảng viên của khóa học này.'
    );
  }
  if (originalCourse.StatusID !== CourseStatus.PUBLISHED) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Chỉ có thể tạo phiên cập nhật cho khóa học đã xuất bản.'
    );
  }
  const existingDraft =
    await courseRepository.findExistingUpdateDraft(courseId);
  if (existingDraft) {
    logger.warn(
      `Found an existing update draft (ID: ${existingDraft.CourseID}) for live course ${courseId}. Automatically cancelling it.`
    );
    try {
      await cancelUpdate(existingDraft.CourseID, user);
    } catch (cancelError) {
      logger.error(
        `Failed to automatically cancel old update session ${existingDraft.CourseID}. Please try again.`,
        cancelError
      );
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Không thể dọn dẹp phiên cập nhật cũ. Vui lòng thử lại.'
      );
    }
  }
  const pool = await getConnection();
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    /* [SỬA 17/08/2026 — Course Versioning]
       Bản nháp nay mang sẵn thông tin phiên bản ngay từ lúc được clone:
         - VersionNumber   : số phiên bản nó SẼ trở thành nếu được duyệt
         - RootCourseID    : gốc của cả dòng khóa học (không đổi qua các đời)
         - PreviousVersionID: phiên bản nó sẽ thay thế
         - IsLatestVersion : 0 — chưa phải bản đang bán, chỉ là nháp
       Nhờ vậy khi Admin duyệt, promoteDraftToLiveVersion chỉ việc lật cờ
       trạng thái + hoán đổi slug, không phải suy luận lại quan hệ phiên bản. */
    const currentVersion = originalCourse.VersionNumber || 1;
    const rootCourseId = originalCourse.RootCourseID || originalCourse.CourseID;

    const newDraftCourse = await courseRepository.cloneCourseRecord(
      courseId,
      {
        StatusID: CourseStatus.DRAFT,
        LiveCourseID: courseId,
        VersionNumber: currentVersion + 1,
        RootCourseID: rootCourseId,
        PreviousVersionID: courseId,
        IsLatestVersion: 0,
      },
      transaction
    );
    await courseRepository.cloneCurriculum(
      courseId,
      newDraftCourse.CourseID,
      transaction
    );
    await transaction.commit();
    const fullNewDraft = await courseRepository.findCourseWithFullDetailsById(
      newDraftCourse.CourseID,
      true
    );
    return toCamelCaseObject(fullNewDraft);
  } catch (error) {
    await transaction.rollback();
    logger.error(
      `Error creating update session for course ${courseId}:`,
      error
    );
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Tạo phiên cập nhật thất bại.'
    );
  }
};

// Lấy danh sách khóa học của chính giảng viên đang đăng nhập.
const getMyCourses = async (instructorId, filters, options, targetCurrency) => {
  const effectiveFilters = {
    ...filters,
    instructorId,
  };
  if (!effectiveFilters.statusId) {
    effectiveFilters.statusId = 'ALL';
  }
  return queryCourses(effectiveFilters, options, targetCurrency);
};

// Lấy danh sách các khóa học đã xuất bản (cho trang public). => ch đc xài
const getPublicCourses = async (filters, options, targetCurrency) => {
  const effectiveFilters = {
    ...filters,
    statusId: CourseStatus.PUBLISHED,
  };
  return queryCourses(effectiveFilters, options, targetCurrency);
};

const archiveCourse = async (courseId, user, notes) => {
  const course = await courseRepository.findCourseById(courseId, true);
  if (!course) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy khóa học.');
  }
  const isAdmin = user.role === Roles.ADMIN || user.role === Roles.SUPERADMIN;
  const isOwnerInstructor =
    user.role === Roles.INSTRUCTOR && course.InstructorID === user.id;
  if (!isAdmin && !isOwnerInstructor) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Bạn không có quyền thực hiện thao tác này trên khóa học.'
    );
  }
  if (course.StatusID !== CourseStatus.PUBLISHED) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Chỉ có thể tạm ngừng xuất bản (Archive) đối với khóa học đang ở trạng thái PUBLISHED.'
    );
  }

  const studentCount = course.studentCount || 0;

  if (studentCount === 0) {
    // Chưa có học viên -> Ngừng xuất bản lập tức
    await courseRepository.updateCourseById(courseId, {
      StatusID: CourseStatus.ARCHIVED,
    });
    await aiSyncService.removeCourseFromAi(course.CourseName);
    logger.info(`Course ${courseId} directly archived by user ${user.id} (studentCount: ${studentCount})`);
    return {
      status: CourseStatus.ARCHIVED,
      requiresApproval: false,
      message: 'Khóa học đã được ngừng xuất bản thành công do chưa có học viên đăng ký.',
    };
  } else {
    // Đã có học viên (studentCount > 0) -> Luôn gửi yêu cầu duyệt cho Ban Quản Trị (đảm bảo quy trình chuẩn, kể cả khi admin tự tạo khóa học)
    const pendingReq = await courseRepository.findCourseApprovalRequests(
      { courseId, status: ApprovalStatus.PENDING },
      {}
    );
    if (pendingReq && pendingReq.length > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Khóa học này đang có một yêu cầu chờ duyệt. Vui lòng đợi xử lý trước khi gửi yêu cầu mới.'
      );
    }
    await courseRepository.createCourseApprovalRequest({
      courseId,
      instructorId: user.id,
      requestType: ApprovalRequestType.ARCHIVE_SUBMISSION,
      instructorNotes: notes || 'Giảng viên yêu cầu tạm ngừng xuất bản khóa học.',
    });
    try {
      const adminIds = await authRepository.findAccountIdsByRoles([
        Roles.ADMIN,
        Roles.SUPERADMIN,
      ]);
      const message = `Giảng viên ${user.fullName || user.email} gửi yêu cầu Ngừng Xuất Bản khóa học "${course.CourseName}" (đang có ${studentCount} học viên).`;
      for (const adminIdObj of adminIds) {
        const adminId =
          typeof adminIdObj === 'object' && adminIdObj.AccountID
            ? adminIdObj.AccountID
            : adminIdObj;
        await notificationService.createNotification(
          adminId,
          user.id,
          'COURSE_APPROVAL_SUBMITTED',
          message,
          `/admin/courses/${course.Slug}`
        );
      }
    } catch (err) {
      logger.error('Failed to notify admins for ARCHIVE_SUBMISSION:', err);
    }
    logger.info(`Course ${courseId} submitted ARCHIVE_SUBMISSION request by instructor ${user.id}`);
    return {
      status: CourseStatus.PUBLISHED,
      requiresApproval: true,
      message: `Khóa học đang có ${studentCount} học viên tham gia. Yêu cầu Ngừng Xuất Bản đã được gởi tới Ban Quản Trị để kiểm tra rủi ro Marketing và quyền lợi học viên.`,
    };
  }
};

/**
 * [THÊM 17/08/2026 — Course Versioning]
 * Lấy lịch sử toàn bộ phiên bản của một dòng khóa học.
 *
 * Dùng cho hai màn hình:
 *   - Giảng viên / Admin: xem đã phát hành bao nhiêu phiên bản, mỗi phiên bản
 *     còn bao nhiêu học viên đang theo học.
 *   - Học viên: biết mình đang học phiên bản nào và đã có bản mới hơn chưa.
 *
 * @param {number} courseId - ID của BẤT KỲ phiên bản nào trong dòng.
 * @param {object} user
 */
const getCourseVersionHistory = async (courseId, user) => {
  const course = await courseRepository.findCourseById(courseId, true);
  if (!course) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy khóa học.');
  }

  const isAdmin =
    user && (user.role === Roles.ADMIN || user.role === Roles.SUPERADMIN);
  const isOwnerInstructor =
    user && user.role === Roles.INSTRUCTOR && course.InstructorID === user.id;

  const rootId = course.RootCourseID || course.CourseID;

  /* Xét quyền theo CẢ DÒNG khóa học, không theo một phiên bản.
     Học viên mua v1; khi hệ thống đã lên v2, họ mở lịch sử từ trang công khai
     thì ID gửi lên là v2 — phiên bản họ chưa mua. Nếu so khớp đúng một CourseID
     thì chính chủ sở hữu v1 lại bị chặn xem lịch sử dòng khóa học của mình. */
  const hasEnrolled =
    user && !isAdmin && !isOwnerInstructor
      ? await courseRepository.hasEnrollmentInCourseFamily(user.id, rootId)
      : false;

  if (!isAdmin && !isOwnerInstructor && !hasEnrolled) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Bạn không có quyền xem lịch sử phiên bản của khóa học này.'
    );
  }

  const versions = await courseRepository.findVersionsByRootId(rootId);

  return {
    rootCourseId: rootId,
    currentVersionId: courseId,
    currentVersionNumber: course.VersionNumber || 1,
    // Học viên chỉ cần thấy số phiên bản và nội dung thay đổi; số lượng học
    // viên từng phiên bản là thông tin kinh doanh, chỉ giảng viên/admin xem.
    versions: versions.map((v) => {
      const base = toCamelCaseObject(v);
      if (!isAdmin && !isOwnerInstructor) delete base.studentCount;
      return base;
    }),
  };
};

/**
 * Sinh mô tả khóa học bằng AI cho tính năng Tạo/Sửa khóa học thủ công
 */
const generateCourseDescription = async (courseId, user, hints) => {
  const course = await courseRepository.findCourseById(courseId, true);
  if (!course) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy khóa học.');
  }
  
  const isAdmin = user.role === Roles.ADMIN || user.role === Roles.SUPERADMIN;
  const isOwnerInstructor = user.role === Roles.INSTRUCTOR && course.InstructorID === user.id;
  
  if (!isAdmin && !isOwnerInstructor) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Bạn không có quyền thực hiện thao tác này.');
  }

  const sections = await sectionRepository.findSectionsByCourseId(courseId) || [];
  
  const payloadSections = [];
  for (const section of sections) {
    const lessons = await lessonRepository.findLessonsBySectionId(section.SectionID) || [];
    
    payloadSections.push({
      key: `s${section.SectionID}`,
      name: section.SectionName || 'Chương',
      lessons: lessons.map((lesson) => {
        return {
          key: `l${lesson.LessonID}`,
          name: lesson.LessonName || 'Bài học',
          kind: lesson.LessonType === 'VIDEO' ? 'VIDEO' : 'TEXT',
          excerpt: String(lesson.TextContent || '').slice(0, 350), // 350 chars max
        };
      })
    });
  }

  let response;
  try {
    response = await aiClient.post(
      '/api/generate/course-content',
      {
        course_name: course.CourseName || 'Khóa học',
        sections: payloadSections,
        existing_description: course.ShortDescription || '',
        hints: hints || '',
        language: 'vi',
      },
      180000 // Timeout 3 phút
    );
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;

    if (status === 503) {
      throw new ApiError(
        httpStatus.SERVICE_UNAVAILABLE,
        detail || 'AI hiện không hoạt động. Bạn vẫn có thể tự viết mô tả và tạo khóa học bình thường.'
      );
    }
    if (status === 502) {
      throw new ApiError(httpStatus.BAD_GATEWAY, detail || 'AI trả về kết quả không đọc được.');
    }
    logger.error('Lỗi khi gọi ai-service generateCourseDescription:', error.message);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể sinh mô tả khóa học lúc này.');
  }

  return response;
};

module.exports = {
  createCourse,
  getCourses,
  getCourseBySlug,
  updateCourse,
  deleteCourse,
  archiveCourse,
  updateCourseThumbnail,
  updateCourseIntroVideo,
  submitCourseForApproval,
  reviewCourseApproval,
  getApprovalRequests,
  getApprovalRequestDetails,
  toggleCourseFeature,
  getPendingApprovalRequestByCourseId,
  getCourseStatuses,
  queryCoursesByCategorySlug,

  createUpdateSession,
  cancelUpdate,
  getMyCourses,
  getPublicCourses,

  // --- Course Versioning (thêm 17/08/2026) ---
  getCourseVersionHistory,
  generateCourseDescription,

  /* [GỠ 17/08/2026] Trước đây export `syncLiveCourseFromUpdate` cho BullMQ
     Worker. Hàm đã bị vô hiệu hóa cùng cả khối Diff-and-Patch, nên nếu giữ
     dòng export này Node sẽ ném ReferenceError ngay lúc nạp module —
     `node --check` KHÔNG bắt được lỗi loại này vì nó chỉ kiểm tra cú pháp.
     Worker trong queues/courseSync.queue.js cũng đã được vô hiệu hóa tương ứng. */
};
