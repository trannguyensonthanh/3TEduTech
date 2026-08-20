const cron = require('node-cron');
const { getConnection } = require('../database/connection');
const logger = require('../utils/logger');
const notificationService = require('../api/notifications/notifications.service');
// [SỬA 17/08/2026 — LEVEL 3] Gọi AI Service qua aiClient để có khóa nội bộ.
// Gọi axios trần sẽ bị AI Service trả 401 và job lại chết âm thầm.
const aiClient = require('../services/aiClient');
const config = require('../config');
const emailSender = require('../utils/emailSender');

/* ============================================================================
   [SỬA LỚN 17/08/2026 — LEVEL 2, mục 2.4]

   ★ LỖI NGHIÊM TRỌNG ĐÃ TỒN TẠI TỪ ĐẦU: JOB NÀY CHƯA BAO GIỜ CHẠY ĐƯỢC

   Câu truy vấn cũ viết `SELECT ... a.FullName, a.Email FROM Accounts a`.
   Nhưng bảng Accounts KHÔNG HỀ có cột FullName — cột đó nằm ở UserProfiles
   (xem V1__init.sql). SQL Server trả về:
       Invalid column name 'FullName'.

   Lỗi bị khối try/catch ngoài cùng nuốt gọn, chỉ để lại một dòng error trong
   log vào 9 giờ sáng mỗi ngày. Kết quả: tính năng "nhắc nhở học viên" mà đề
   cương yêu cầu thực chất chưa từng gửi đi một lời nhắc nào.
   → ĐÃ SỬA: JOIN sang UserProfiles.

   ★ BỔ SUNG THEO MỤC 2.4 — GỬI EMAIL SONG SONG VỚI THÔNG BÁO TRONG ỨNG DỤNG
   Thông báo in-app chỉ tới được người ĐANG mở website — mà học viên bỏ học 3
   ngày thì gần như chắc chắn không mở. Email mới là kênh chạm tới được họ.

   ★ CHỐNG LÀM PHIỀN
   Bản cũ nhắc LẠI MỖI NGÀY chừng nào học viên còn chưa quay lại. Một người
   nghỉ hai tuần sẽ nhận 14 email — đủ để bấm nút "báo cáo spam", và khi đó cả
   tên miền gửi thư của hệ thống bị ảnh hưởng. Nay mỗi (học viên × khóa học)
   chỉ được nhắc lại sau REMIND_COOLDOWN_DAYS ngày.

   ★ CHỐNG TREO
   Lời gọi tới AI Service trước đây KHÔNG có timeout. AI Service nằm trên một
   EC2 khác; nếu nó treo, `await axios.post` treo theo vô hạn — job giữ mãi một
   kết nối trong pool CSDL và không bao giờ kết thúc. Nay có timeout, và có câu
   nhắc dự phòng để AI hỏng thì học viên vẫn nhận được lời nhắc.
============================================================================ */

/** Số ngày không hoạt động thì bắt đầu nhắc. */
const INACTIVE_DAYS_THRESHOLD = 3;

/** Khoảng cách tối thiểu giữa hai lần nhắc cho cùng một (học viên, khóa học). */
const REMIND_COOLDOWN_DAYS = 7;

/** Thời gian chờ tối đa khi gọi AI Service sinh lời nhắc. */
const AI_TIMEOUT_MS = 20000;

/**
 * Câu nhắc dự phòng khi AI Service không phản hồi.
 * Không có nó thì mỗi lần AI trục trặc là toàn bộ đợt nhắc hôm đó mất trắng —
 * lời nhắc mộc mạc vẫn tốt hơn nhiều so với im lặng.
 */
const buildFallbackMessage = (student) => {
  const percent = Math.round(
    (student.CompletedLessons / student.TotalLessons) * 100
  );
  return (
    `👋 Chào ${student.FullName}, bạn đang ở ${percent}% khóa học "${student.CourseName}" ` +
    `(${student.CompletedLessons}/${student.TotalLessons} bài). ` +
    `Chỉ cần một bài học hôm nay là bạn lại có đà rồi. Cùng quay lại nhé! 🚀`
  );
};

const triggerAIProgressReminders = async () => {
  logger.info('[CRON_JOB] Starting AI Progress Reminder Job...');
  try {
    const pool = await getConnection();

    /* [SỬA 17/08/2026]
       1) JOIN UserProfiles để lấy FullName — sửa lỗi cột không tồn tại đã nêu
          ở đầu file.
       2) Bổ sung lọc IsArchived cho các subquery đếm bài học; nếu không, học
          viên đã học hết mọi bài nhìn thấy được vẫn bị coi là "chưa xong".
       3) Bỏ qua ghi danh đã hoàn thành ngay từ truy vấn.
       4) Chỉ lấy PHIÊN BẢN học viên thực sự đang học — không lọc theo
          IsLatestVersion. Học viên mua v1 (nay là SUPERSEDED) vẫn phải được
          nhắc; lọc theo trạng thái PUBLISHED sẽ bỏ sót đúng nhóm này.
       5) LastRemindedAt: lần gần nhất hệ thống đã nhắc, dùng cho thời gian chờ. */
    const result = await pool.request().query(`
      SELECT
        e.AccountID, e.CourseID, e.EnrolledAt, c.CourseName,
        ISNULL(up.FullName, N'bạn') AS FullName,
        a.Email,
        (SELECT COUNT(*) FROM Lessons l JOIN Sections s ON l.SectionID = s.SectionID
          WHERE s.CourseID = e.CourseID AND l.IsArchived = 0 AND s.IsArchived = 0) as TotalLessons,
        (SELECT COUNT(*) FROM LessonProgress lp JOIN Lessons l ON lp.LessonID = l.LessonID JOIN Sections s ON l.SectionID = s.SectionID
          WHERE lp.AccountID = e.AccountID AND s.CourseID = e.CourseID AND lp.IsCompleted = 1
            AND l.IsArchived = 0 AND s.IsArchived = 0) as CompletedLessons,
        (SELECT MAX(ISNULL(lp.LastWatchedAt, lp.CompletedAt)) FROM LessonProgress lp JOIN Lessons l ON lp.LessonID = l.LessonID JOIN Sections s ON l.SectionID = s.SectionID
          WHERE lp.AccountID = e.AccountID AND s.CourseID = e.CourseID) as LastActivity,
        /* ⚠️ Notifications.RelatedEntityID là VARCHAR(255) chứ không phải BIGINT.
           Nếu viết thẳng "n.RelatedEntityID = e.CourseID", SQL Server sẽ ép
           KIỂU CỦA CỘT sang BIGINT cho mọi dòng — chỉ cần MỘT bản ghi nào đó
           lưu giá trị không phải số (thông báo gắn với thực thể khác) là cả
           câu truy vấn đổ với lỗi chuyển kiểu, và job lại chết âm thầm y như
           lỗi FullName ở trên. CAST phía hằng số nên so sánh là chuỗi-với-chuỗi. */
        (SELECT MAX(n.CreatedAt) FROM Notifications n
          WHERE n.RecipientAccountID = e.AccountID
            AND n.Type = 'SYSTEM'
            AND n.RelatedEntityType = 'Course'
            AND n.RelatedEntityID = CAST(e.CourseID AS VARCHAR(255))) as LastRemindedAt
      FROM Enrollments e
      JOIN Courses c        ON e.CourseID = c.CourseID
      JOIN Accounts a       ON e.AccountID = a.AccountID
      LEFT JOIN UserProfiles up ON e.AccountID = up.AccountID
      WHERE c.StatusID IN ('PUBLISHED', 'SUPERSEDED')
        AND e.IsCompleted = 0
    `);

    const now = new Date();
    const daysBetween = (later, earlier) =>
      (later - earlier) / (1000 * 60 * 60 * 24);

    const studentsToRemind = result.recordset.filter((row) => {
      // Khóa chưa có bài học, hoặc thực chất đã học xong → không nhắc.
      if (row.TotalLessons === 0 || row.CompletedLessons >= row.TotalLessons) {
        return false;
      }

      const lastActiveDate = row.LastActivity
        ? new Date(row.LastActivity)
        : new Date(row.EnrolledAt);
      if (daysBetween(now, lastActiveDate) < INACTIVE_DAYS_THRESHOLD) {
        return false;
      }

      // Đang trong thời gian chờ giữa hai lần nhắc → bỏ qua.
      if (row.LastRemindedAt) {
        const sinceLastRemind = daysBetween(now, new Date(row.LastRemindedAt));
        if (sinceLastRemind < REMIND_COOLDOWN_DAYS) return false;
      }

      return true;
    });

    logger.info(
      `[CRON_JOB] Found ${studentsToRemind.length} students to remind (đã lọc theo thời gian chờ ${REMIND_COOLDOWN_DAYS} ngày).`
    );

    for (const student of studentsToRemind) {
      try {
        let message;
        try {
          const prompt = `You are a friendly and encouraging AI learning assistant for an online education platform.
        Write a short, motivating reminder message (in Vietnamese) for a student named "${student.FullName}".
        They are enrolled in the course "${student.CourseName}" but haven't made any progress in the last ${INACTIVE_DAYS_THRESHOLD} days.
        They have completed ${student.CompletedLessons} out of ${student.TotalLessons} lessons.
        Encourage them to continue learning! Keep it under 50 words, use emojis, and be very positive. Do not use Markdown formatting.`;

          const aiResponse = await aiClient.post(
            '/api/chat/query',
            { query: prompt, chat_history: [], top_k: 1 },
            AI_TIMEOUT_MS
          );
          message = aiResponse.data?.answer?.trim();
        } catch (aiError) {
          logger.warn(
            `[CRON_JOB] AI Service không phản hồi (${aiError.message}); dùng câu nhắc dự phòng.`
          );
        }
        if (!message) message = buildFallbackMessage(student);

        // 1. Thông báo trong ứng dụng (đồng thời đẩy real-time qua SSE).
        await notificationService.createNotification(
          student.AccountID,
          'SYSTEM',
          message,
          { type: 'Course', id: student.CourseID }
        );

        // 2. [MỤC 2.4] Email song song — kênh duy nhất chạm được tới học viên
        //    đang không mở website. Lỗi gửi mail KHÔNG được làm hỏng vòng lặp:
        //    một địa chỉ email hỏng không thể chặn lời nhắc của những người sau.
        if (student.Email) {
          try {
            const progressPercent = Math.round(
              (student.CompletedLessons / student.TotalLessons) * 100
            );
            await emailSender.sendEmailWithTemplate(
              student.Email,
              `📚 Tiếp tục khóa học "${student.CourseName}" nhé!`,
              'progressReminder',
              {
                fullNameOrDefault: student.FullName,
                courseName: student.CourseName,
                aiMessage: message,
                completedLessons: student.CompletedLessons,
                totalLessons: student.TotalLessons,
                progressPercent,
                continueUrl: `${config.frontendUrl}/my-courses`,
              }
            );
          } catch (mailError) {
            logger.error(
              `[CRON_JOB] Không gửi được email nhắc tới ${student.Email}: ${mailError.message}`
            );
          }
        }

        logger.info(
          `[CRON_JOB] Sent reminder to user ${student.AccountID} for course ${student.CourseID}`
        );
      } catch (err) {
        logger.error(
          `[CRON_JOB] Failed to send reminder to user ${student.AccountID}:`,
          err.message
        );
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
      logger.info(
        `[CRON_JOB] Triggering progress reminder job with schedule: ${cronSchedule}`
      );
      triggerAIProgressReminders();
    });
    logger.info(
      `[CRON_JOB] Scheduled AI progress reminder job with schedule: ${cronSchedule}`
    );
  } else {
    logger.error(
      `[CRON_JOB] Invalid cron schedule: ${cronSchedule}. Job not scheduled.`
    );
  }
};

module.exports = {
  scheduleProgressReminders,
  triggerAIProgressReminders,
};
