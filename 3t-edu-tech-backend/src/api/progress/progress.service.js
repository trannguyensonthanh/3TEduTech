const httpStatus = require('http-status').status;
const progressRepository = require('./progress.repository');
const lessonRepository = require('../lessons/lessons.repository');
const enrollmentService = require('../enrollments/enrollments.service');
const enrollmentRepository = require('../enrollments/enrollments.repository');
const ApiError = require('../../core/errors/ApiError');
const logger = require('../../utils/logger');
const Roles = require('../../core/enums/Roles');

/**
 * Đánh dấu bài học là hoàn thành/chưa hoàn thành.
 * 🛡️ PROGRESS PROTECTION: Khi hoàn thành bài cuối cùng, tự động khóa cứng enrollment.
 * @param {object} user - User object { id, role }
 * @param {number} lessonId
 * @param {boolean} isCompleted
 * @returns {Promise<object>} - Bản ghi progress đã cập nhật.
 */
const markLessonCompletion = async (user, lessonId, isCompleted) => {
  const accountId = user.id;
  const isAdmin = user.role === Roles.ADMIN || user.role === Roles.SUPERADMIN;
  const lesson = await lessonRepository.findLessonById(lessonId);
  if (!lesson) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Bài học không tồn tại.');
  }
  const enrolled = await enrollmentService.isUserEnrolled(
    accountId,
    lesson.CourseID
  );
  if (!enrolled) {
    if (isAdmin) {
      return {
        LessonID: lessonId,
        IsCompleted: isCompleted,
        message: 'Admin preview mode (completion not saved)'
      };
    }
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Bạn cần đăng ký khóa học để cập nhật tiến độ.'
    );
  }
  const progress = await progressRepository.findOrCreateProgress(
    accountId,
    lessonId
  );
  const updateData = { IsCompleted: isCompleted };
  const updatedProgress = await progressRepository.updateProgressById(
    progress.ProgressID,
    updateData
  );
  if (!updatedProgress) {
    const currentProgress = await progressRepository.findOrCreateProgress(
      accountId,
      lessonId
    );
    logger.info(
      `Lesson ${lessonId} completion status for user ${accountId} set to ${isCompleted} (no change or only LastWatchedAt updated).`
    );
    return currentProgress;
  }
  logger.info(
    `Lesson ${lessonId} completion status for user ${accountId} updated to ${isCompleted}.`
  );

  // ============================================================
  // 🛡️ PROGRESS PROTECTION: Auto-Lock khi hoàn thành 100%
  // Khi đánh dấu hoàn thành một bài, kiểm tra ngay:
  // Nếu tổng bài đã hoàn thành = tổng bài trong khóa học
  // → Tự động khóa cứng IsCompleted = true trên Enrollment!
  // ============================================================
  if (isCompleted) {
    try {
      const totalLessons = await progressRepository.countTotalLessonsInCourse(
        lesson.CourseID
      );
      const completedLessons =
        await progressRepository.countCompletedLessonsInCourse(
          accountId,
          lesson.CourseID
        );
      if (completedLessons >= totalLessons && totalLessons > 0) {
        const locked = await enrollmentRepository.markEnrollmentCompleted(
          accountId,
          lesson.CourseID
        );
        if (locked) {
          logger.info(
            `🎓 Course ${lesson.CourseID} COMPLETED & LOCKED for user ${accountId}! (${completedLessons}/${totalLessons} lessons)`
          );
        }
      }
    } catch (lockError) {
      // Không throw lỗi để không ảnh hưởng trải nghiệm người dùng
      logger.error(
        `Error checking/locking course completion for user ${accountId}, course ${lesson.CourseID}:`,
        lockError
      );
    }
  }

  return updatedProgress;
};

/**
 * Cập nhật vị trí xem cuối cùng của video.
 * @param {object} user
 * @param {number} lessonId
 * @param {number} positionSeconds - Vị trí (giây).
 * @returns {Promise<object>} - Bản ghi progress đã cập nhật.
 */
const updateLastWatchedPosition = async (
  user,
  lessonId,
  positionSeconds
) => {
  const accountId = user.id;
  const lesson = await lessonRepository.findLessonById(lessonId);
  if (!lesson) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Bài học không tồn tại.');
  }
  
  const enrolled = await enrollmentService.isUserEnrolled(
    accountId,
    lesson.CourseID
  );
  
  const isAdmin = user.role === Roles.ADMIN || user.role === Roles.SUPERADMIN || user.role === 'SA';
  
  // Nếu chưa đăng ký khóa học
  if (!enrolled) {
    // Nếu là Admin, trả về một object giả lập để Frontend không báo lỗi (không ghi vào Database để tránh nhiễu thống kê)
    if (isAdmin) {
      return { 
        LessonID: lessonId, 
        LastWatchedPosition: positionSeconds, 
        message: 'Admin preview mode (progress not saved)' 
      };
    }
    // Nếu là User thường, báo lỗi 403
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Bạn cần đăng ký khóa học để cập nhật tiến độ.'
    );
  }
  const progress = await progressRepository.findOrCreateProgress(
    accountId,
    lessonId
  );
  const updateData = { LastWatchedPosition: positionSeconds };
  const updatedProgress = await progressRepository.updateProgressById(
    progress.ProgressID,
    updateData
  );
  if (!updatedProgress) {
    const currentProgress = await progressRepository.findOrCreateProgress(
      accountId,
      lessonId
    );
    logger.info(
      `Last watched position for lesson ${lessonId}, user ${accountId} set to ${positionSeconds} (only LastWatchedAt updated?).`
    );
    return currentProgress;
  }
  logger.info(
    `Last watched position for lesson ${lessonId}, user ${accountId} updated to ${positionSeconds}.`
  );
  return updatedProgress;
};

/**
 * Lấy tiến độ tổng quan của người dùng cho một khóa học.
 * 🛡️ PROGRESS PROTECTION: Nếu đã hoàn thành → luôn trả về 100%, kèm thông tin bài bổ sung mới.
 * @param {object} user
 * @param {number} courseId
 * @returns {Promise<object>}
 */
const getCourseProgress = async (user, courseId) => {
  const accountId = user.id;
  const isAdmin = user.role === Roles.ADMIN || user.role === Roles.SUPERADMIN;
  const isInstructor = user.role === Roles.INSTRUCTOR;
  logger.info(
    `Getting course progress for user ${accountId}, course ${courseId}.`
  );

  // Lấy bản ghi enrollment đầy đủ (bao gồm IsCompleted, CompletedAt)
  const enrollment =
    await enrollmentRepository.findEnrollmentByUserAndCourse(accountId, courseId);

  if (!enrollment && !isAdmin && !isInstructor) {
    logger.error(
      `User ${accountId} attempted to access progress for course ${courseId} without enrollment.`
    );
    throw new ApiError(httpStatus.FORBIDDEN, 'Bạn chưa đăng ký khóa học này.');
  }

  const totalLessons =
    await progressRepository.countTotalLessonsInCourse(courseId);
  if (totalLessons === 0) {
    return {
      totalLessons: 0,
      completedLessons: 0,
      percentage: 0,
      progressDetails: [],
      isCompleted: false,
      bonusContent: null,
    };
  }

  const completedLessons =
    await progressRepository.countCompletedLessonsInCourse(accountId, courseId);
  const progressDetails = await progressRepository.findAllProgressInCourse(
    accountId,
    courseId
  );

  // ============================================================
  // 🛡️ PROGRESS PROTECTION: Khóa cứng tiến độ 100% cho học viên đã tốt nghiệp
  // Khi enrollment.IsCompleted = true:
  // - Phần trăm luôn = 100% (bảo vệ danh dự & chứng chỉ)
  // - Thông tin bài bổ sung mới được tách riêng qua bonusContent
  // ============================================================
  if (enrollment && enrollment.IsCompleted) {
    const uncompletedNewLessons = totalLessons - completedLessons;
    return {
      totalLessons,
      completedLessons,
      percentage: 100, // 🛡️ KHÓA CỨNG VĨNH VIỄN!
      progressDetails,
      isCompleted: true,
      completedAt: enrollment.CompletedAt,
      bonusContent:
        uncompletedNewLessons > 0
          ? {
              hasNewContent: true,
              uncompletedCount: uncompletedNewLessons,
              message: `🎉 Bạn đã tốt nghiệp! Khóa học có ${uncompletedNewLessons} bài giảng mới hoặc được cập nhật, hãy khám phá ngay!`,
            }
          : {
              hasNewContent: false,
              uncompletedCount: 0,
              message:
                '🌟 Bạn đã hoàn thành 100% toàn bộ nội dung mới nhất!',
            },
    };
  }

  // Trường hợp bình thường: Tính tiến độ theo công thức chuẩn
  const percentage = Math.round((completedLessons / totalLessons) * 100);

  // Kiểm tra xem có vừa đạt 100% nhưng chưa được lock không (race condition protection)
  if (percentage === 100 && enrollment) {
    try {
      const locked = await enrollmentRepository.markEnrollmentCompleted(
        accountId,
        courseId
      );
      if (locked) {
        logger.info(
          `🎓 Course ${courseId} auto-locked as COMPLETED for user ${accountId} during progress query.`
        );
      }
    } catch (lockError) {
      logger.error(
        `Error auto-locking completion during getCourseProgress:`,
        lockError
      );
    }
  }

  return {
    totalLessons,
    completedLessons,
    percentage,
    progressDetails,
    isCompleted: percentage === 100,
    bonusContent: null,
  };
};

module.exports = {
  markLessonCompletion,
  updateLastWatchedPosition,
  getCourseProgress,
};
