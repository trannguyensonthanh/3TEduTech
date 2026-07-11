const cron = require('node-cron');
const axios = require('axios');
const { getConnection } = require('../database/connection');
const logger = require('../utils/logger');
const notificationService = require('../api/notifications/notifications.service');

const triggerAIProgressReminders = async () => {
  logger.info('[CRON_JOB] Starting AI Progress Reminder Job...');
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        e.AccountID, e.CourseID, e.EnrolledAt, c.CourseName, a.FullName, a.Email,
        (SELECT COUNT(*) FROM Lessons l JOIN Sections s ON l.SectionID = s.SectionID WHERE s.CourseID = e.CourseID) as TotalLessons,
        (SELECT COUNT(*) FROM LessonProgress lp JOIN Lessons l ON lp.LessonID = l.LessonID JOIN Sections s ON l.SectionID = s.SectionID WHERE lp.AccountID = e.AccountID AND s.CourseID = e.CourseID AND lp.IsCompleted = 1) as CompletedLessons,
        (SELECT MAX(ISNULL(lp.LastWatchedAt, lp.CompletedAt)) FROM LessonProgress lp JOIN Lessons l ON lp.LessonID = l.LessonID JOIN Sections s ON l.SectionID = s.SectionID WHERE lp.AccountID = e.AccountID AND s.CourseID = e.CourseID) as LastActivity
      FROM Enrollments e
      JOIN Courses c ON e.CourseID = c.CourseID
      JOIN Accounts a ON e.AccountID = a.AccountID
      WHERE c.StatusID = 'PUBLISHED'
    `);
    
    const now = new Date();
    const studentsToRemind = result.recordset.filter(row => {
      // Bỏ qua nếu chưa có bài học hoặc đã hoàn thành
      if (row.TotalLessons === 0 || row.CompletedLessons >= row.TotalLessons) return false;
      const lastActiveDate = row.LastActivity ? new Date(row.LastActivity) : new Date(row.EnrolledAt);
      const daysSinceActive = (now - lastActiveDate) / (1000 * 60 * 60 * 24);
      return daysSinceActive >= 3; // Nhắc nhở nếu không học trong 3 ngày
    });

    logger.info(`[CRON_JOB] Found ${studentsToRemind.length} students to remind.`);

    for (const student of studentsToRemind) {
      try {
        const prompt = `You are a friendly and encouraging AI learning assistant for an online education platform. 
        Write a short, motivating reminder message (in Vietnamese) for a student named "${student.FullName}". 
        They are enrolled in the course "${student.CourseName}" but haven't made any progress in the last 3 days.
        They have completed ${student.CompletedLessons} out of ${student.TotalLessons} lessons.
        Encourage them to continue learning! Keep it under 50 words, use emojis, and be very positive. Do not use Markdown formatting.`;

        // Gọi đến AI service (đang chạy ở cổng 2111)
        const aiResponse = await axios.post(`http://127.0.0.1:${process.env.AI_SERVICE_PORT || 2111}/api/chat/query`, {
          query: prompt,
          chat_history: [],
          top_k: 1
        });
        
        const message = aiResponse.data.answer;

        // Tạo thông báo
        await notificationService.createNotification(
          student.AccountID,
          'SYSTEM',
          message,
          { type: 'Course', id: student.CourseID }
        );
        logger.info(`[CRON_JOB] Sent AI reminder to user ${student.AccountID} for course ${student.CourseID}`);
      } catch (err) {
        logger.error(`[CRON_JOB] Failed to send reminder to user ${student.AccountID}:`, err.message);
      }
    }
  } catch (error) {
    logger.error('[CRON_JOB] Error running AI Progress Reminder Job:', error);
  }
};

const scheduleProgressReminders = () => {
  // Chạy mỗi ngày lúc 9:00 AM (hoặc tuỳ chỉnh qua env)
  const cronSchedule = process.env.PROGRESS_REMINDER_CRON || '0 9 * * *';
  if (cron.validate(cronSchedule)) {
    cron.schedule(cronSchedule, () => {
      logger.info(`[CRON_JOB] Triggering progress reminder job with schedule: ${cronSchedule}`);
      triggerAIProgressReminders();
    });
    logger.info(`[CRON_JOB] Scheduled AI progress reminder job with schedule: ${cronSchedule}`);
  } else {
    logger.error(`[CRON_JOB] Invalid cron schedule: ${cronSchedule}. Job not scheduled.`);
  }
};

module.exports = {
  scheduleProgressReminders,
  triggerAIProgressReminders
};
