const axios = require('axios');
const { getConnection, sql } = require('../database/connection');
const logger = require('../utils/logger');

const getAiServiceUrl = () => {
  return process.env.AI_SERVICE_URL || `http://127.0.0.1:${process.env.AI_SERVICE_PORT || 2111}`;
};

/**
 * Đồng bộ toàn bộ Danh sách Khóa học (Courses, Lessons) và FAQs sang AI Service (ChromaDB Vector Store)
 * Giúp Chatbot luôn có dữ liệu phong phú để phản hồi chính xác và hiển thị Widget Carousel cho học viên.
 */
const syncInitialDataToAi = async () => {
  try {
    logger.info('🤖 [AI Sync] Bắt đầu kiểm tra và đồng bộ tri thức RAG sang AI Service...');
    const pool = await getConnection();
    const baseUrl = getAiServiceUrl();

    // 1. Kiểm tra AI Service có sẵn sàng không
    try {
      await axios.get(`${baseUrl}/health`, { timeout: 3000 });
    } catch (err) {
      logger.warn(`🤖 [AI Sync] AI Service tại ${baseUrl} chưa phản hồi, bỏ qua lần đồng bộ này.`);
      return;
    }

    // 2. Đồng bộ danh sách Khóa học đã xuất bản
    const coursesRes = await pool.request().query(
      `SELECT CourseID, CourseName, ShortDescription, FullDescription, OriginalPrice, DiscountedPrice 
       FROM Courses 
       WHERE StatusID = 'PUBLISHED' OR StatusID IS NULL`
    );
    const courses = coursesRes.recordset || [];

    let successCourses = 0;
    for (const c of courses) {
      try {
        // Lấy bài học của từng khóa
        const lessonsRes = await pool.request()
          .input('CourseID', sql.BigInt, c.CourseID)
          .query(
            `SELECT l.LessonName, l.Description, l.TextContent 
             FROM Lessons l 
             JOIN Sections s ON l.SectionID = s.SectionID 
             WHERE s.CourseID = @CourseID AND l.IsArchived = 0`
          );
        const lessons = lessonsRes.recordset || [];

        // Clean HTML tags nhã nhặn từ description nếu có
        const cleanText = (str) => (str || '').replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();

        const courseDesc = `Khóa học: ${c.CourseName}\nMô tả ngắn: ${cleanText(c.ShortDescription)}\nNội dung chi tiết: ${cleanText(c.FullDescription)}\nGiá ưu đãi: ${c.DiscountedPrice || c.OriginalPrice || 0} VNĐ`;
        
        const formattedLessons = lessons.map(l => ({
          name: l.LessonName || 'Bài học',
          content: `${l.LessonName}\n${cleanText(l.Description)}\n${cleanText(l.TextContent)}`
        }));

        await axios.post(`${baseUrl}/api/ingest/course`, {
          course_name: c.CourseName,
          course_description: courseDesc,
          lessons: formattedLessons
        }, { timeout: 60000 });

        successCourses++;
        await new Promise(r => setTimeout(r, 500)); // Nhờn chút để tránh rate limit của Embedding API
      } catch (err) {
        logger.error(`🤖 [AI Sync] Lỗi đồng bộ khóa học #${c.CourseID}: ${err.response ? JSON.stringify(err.response.data) : err.message}`);
      }
    }

    // 3. Đồng bộ danh sách FAQs (nếu bảng FAQs tồn tại)
    let successFaqs = 0;
    let faqsCount = 0;
    try {
      const tableCheck = await pool.request().query(
        `SELECT OBJECT_ID('FAQs') as TableId`
      );
      if (tableCheck.recordset[0]?.TableId) {
        const faqsRes = await pool.request().query(
          `SELECT FaqID, Question, Answer FROM FAQs WHERE IsActive = 1`
        );
        const faqs = faqsRes.recordset || [];
        faqsCount = faqs.length;
        for (const faq of faqs) {
          try {
            await axios.post(`${baseUrl}/api/ingest/text`, {
              text: `Q: ${faq.Question}\nA: ${faq.Answer}`,
              source_name: `FAQ-${faq.FaqID}`,
              collection: 'master_knowledge',
              metadata: { type: 'faq', FaqID: faq.FaqID }
            }, { timeout: 5000 });
            successFaqs++;
          } catch (err) {
            logger.error(`🤖 [AI Sync] Lỗi đồng bộ FAQ #${faq.FaqID}: ${err.message}`);
          }
        }
      }
    } catch (err) {
      logger.warn(`🤖 [AI Sync] Bỏ qua đồng bộ FAQ: ${err.message}`);
    }

    logger.info(`✅ [AI Sync] Đồng bộ tri thức RAG hoàn tất! ${successCourses}/${courses.length} khóa học & ${successFaqs}/${faqsCount} FAQs đã được nén vào ChromaDB Vector Store.`);
  } catch (error) {
    logger.error(`🤖 [AI Sync] Lỗi quá trình đồng bộ RAG: ${error.message}`);
  }
};

/**
 * Xóa tức thời toàn bộ tri thức RAG của một khóa học.
 */
const removeCourseFromAi = async (courseName) => {
  if (!courseName) return;
  try {
    const baseUrl = getAiServiceUrl();
    await axios.delete(`${baseUrl}/api/ingest/course/${encodeURIComponent(courseName)}`, { timeout: 5000 });
    logger.info(`🤖 [AI Sync] Đã rút toàn bộ tri thức RAG của khóa học: ${courseName}`);
  } catch (error) {
    logger.error(`🤖 [AI Sync] Lỗi xóa RAG của khóa học '${courseName}': ${error.message}`);
  }
};

/**
 * Xóa tức thời toàn bộ tri thức RAG của một bài học.
 */
const removeLessonFromAi = async (lessonName) => {
  if (!lessonName) return;
  try {
    const baseUrl = getAiServiceUrl();
    await axios.delete(`${baseUrl}/api/ingest/lesson/${encodeURIComponent(lessonName)}`, { timeout: 5000 });
    logger.info(`🤖 [AI Sync] Đã rút tri thức RAG của bài học: ${lessonName}`);
  } catch (error) {
    logger.error(`🤖 [AI Sync] Lỗi xóa RAG của bài học '${lessonName}': ${error.message}`);
  }
};

module.exports = {
  syncInitialDataToAi,
  getAiServiceUrl,
  removeCourseFromAi,
  removeLessonFromAi
};
