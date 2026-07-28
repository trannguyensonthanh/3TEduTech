const { Queue, Worker } = require('bullmq');
const { createBullMQConnection, defaultJobOptions } = require('./queue.config');
const logger = require('../utils/logger');

// ============================================================
// QUEUE: Nơi đăng ký công việc đồng bộ khóa học cần xử lý
// ============================================================
const connection = createBullMQConnection();

const courseSyncQueue = new Queue('course-sync', {
  connection,
  defaultJobOptions,
});

/**
 * Thêm một job đồng bộ khóa học vào hàng đợi.
 * @param {object} data - { updateCourseId, liveCourseId, requestId, adminId, courseName, instructorId }
 * @returns {Promise<object>} - BullMQ Job object
 */
const addCourseSyncJob = async (data) => {
  const job = await courseSyncQueue.add('sync-live-course', data, {
    jobId: `course-sync-${data.updateCourseId}-${Date.now()}`,
  });
  logger.info(
    `📮 Course sync job enqueued: ${job.id} | Draft #${data.updateCourseId} → Live #${data.liveCourseId}`
  );
  return job;
};

// ============================================================
// WORKER: Công nhân ngầm lắng nghe và xử lý công việc đồng bộ
// ============================================================
let worker = null;

const startCourseSyncWorker = () => {
  const workerConnection = createBullMQConnection();

  worker = new Worker(
    'course-sync',
    async (job) => {
      const {
        updateCourseId,
        liveCourseId,
        requestId,
        adminId,
        courseName,
        instructorId,
      } = job.data;

      logger.info(
        `🔧 [Worker] Processing course sync job ${job.id}: Draft #${updateCourseId} → Live #${liveCourseId}`
      );

      // Lazy require để tránh circular dependency (courses.service.js cũng require file này)
      const { getConnection, sql } = require('../database/connection');
      const courseService = require('../api/courses/courses.service');
      const courseRepository = require('../api/courses/courses.repository');
      const enrollmentRepository = require('../api/enrollments/enrollments.repository');
      const notificationService = require('../api/notifications/notifications.service');
      const cloudinaryUtil = require('../utils/cloudinary.util');
      const progressRepository = require('../api/progress/progress.repository');

      const pool = await getConnection();
      const transaction = new sql.Transaction(pool);

      try {
        await transaction.begin();

        // ========================================
        // BƯỚC 1: Đếm số bài học TRƯỚC khi Sync
        // ========================================
        const totalLessonsBefore =
          await progressRepository.countTotalLessonsInCourse(liveCourseId);

        // ========================================
        // BƯỚC 2: Thực hiện Diff-and-Patch Sync
        // ========================================
        const cloudFilesToDelete =
          await courseService.syncLiveCourseFromUpdate(
            updateCourseId,
            liveCourseId,
            transaction
          );

        // ========================================
        // BƯỚC 3: Xóa bản Draft sau khi Sync xong
        // ========================================
        await courseRepository.deleteCourseById(updateCourseId, transaction);
        logger.info(
          `[Worker] Draft course #${updateCourseId} deleted successfully.`
        );

        await transaction.commit();
        logger.info(
          `[Worker] Transaction committed for sync job ${job.id}.`
        );

        // ========================================
        // BƯỚC 4: Đếm bài học SAU khi Sync (ngoài transaction)
        // ========================================
        const totalLessonsAfter =
          await progressRepository.countTotalLessonsInCourse(liveCourseId);
        const newLessonsCount = Math.max(
          0,
          totalLessonsAfter - totalLessonsBefore
        );

        // ========================================
        // BƯỚC 5: Thông báo cho Giảng viên
        // ========================================
        try {
          await notificationService.createNotification(
            instructorId,
            'COURSE_APPROVED',
            `Khóa học "${courseName || ''}" đã được phê duyệt và cập nhật thành công lên hệ thống!`,
            { type: 'Course', id: liveCourseId }
          );
        } catch (notifyError) {
          logger.error(
            `[Worker] Failed to notify instructor ${instructorId}:`,
            notifyError
          );
        }

        // ========================================
        // BƯỚC 6: Thông báo cho Học viên đã enrolled (nếu có bài mới)
        // ========================================
        if (newLessonsCount > 0) {
          try {
            const enrolledStudents =
              await enrollmentRepository.findEnrolledStudentsByCourseId(
                liveCourseId
              );
            for (const student of enrolledStudents) {
              await notificationService.createNotification(
                student.AccountID,
                'COURSE_UPDATED',
                `Khóa học "${courseName || ''}" vừa được cập nhật với ${newLessonsCount} bài giảng mới! Hãy khám phá ngay! 🎉`,
                { type: 'Course', id: liveCourseId }
              );
            }
            logger.info(
              `[Worker] Notified ${enrolledStudents.length} students about ${newLessonsCount} new lessons in course #${liveCourseId}.`
            );
          } catch (notifyError) {
            logger.error(
              `[Worker] Failed to notify enrolled students:`,
              notifyError
            );
          }
        }

        // ========================================
        // BƯỚC 7: Dọn dẹp Cloudinary orphan files
        // ========================================
        for (const file of cloudFilesToDelete) {
          try {
            await cloudinaryUtil.deleteAsset(file.publicId, {
              resource_type: file.resourceType || 'raw',
            });
            logger.info(
              `[Worker] Deleted cloud file ${file.publicId} (${file.resourceType})`
            );
          } catch (deleteError) {
            logger.error(
              `[Worker] Failed to delete cloud file ${file.publicId}:`,
              deleteError
            );
          }
        }

        logger.info(
          `✅ [Worker] Course sync job ${job.id} completed successfully!`
        );
        return { success: true, liveCourseId, newLessonsCount };
      } catch (error) {
        logger.error(`❌ [Worker] Course sync job ${job.id} failed:`, error);
        try {
          await transaction.rollback();
        } catch (rollbackError) {
          logger.error(
            `[Worker] Failed to rollback transaction:`,
            rollbackError
          );
        }
        throw error; // BullMQ sẽ tự động retry theo cấu hình
      }
    },
    {
      connection: workerConnection,
      concurrency: 1, // Xử lý 1 job tại một thời điểm để tránh xung đột DB
    }
  );

  // Event listeners cho Worker
  worker.on('completed', (job, result) => {
    logger.info(
      `🎉 [Worker] Job ${job.id} completed: Live course #${result.liveCourseId} synced, ${result.newLessonsCount} new lessons.`
    );
  });

  worker.on('failed', (job, error) => {
    logger.error(
      `💀 [Worker] Job ${job?.id} failed after ${job?.attemptsMade} attempts: ${error.message}`
    );
  });

  worker.on('error', (error) => {
    logger.error(`[Worker] Worker error:`, error);
  });

  logger.info('🔧 Course Sync BullMQ Worker started and listening for jobs.');
  return worker;
};

/**
 * Graceful shutdown cho Worker và Queue.
 */
const closeCourseSyncQueue = async () => {
  if (worker) {
    await worker.close();
    logger.info('Course Sync Worker closed.');
  }
  await courseSyncQueue.close();
  await connection.quit();
  logger.info('Course Sync Queue closed.');
};

module.exports = {
  addCourseSyncJob,
  startCourseSyncWorker,
  closeCourseSyncQueue,
  courseSyncQueue,
};
