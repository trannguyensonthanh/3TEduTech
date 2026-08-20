const { getConnection, sql } = require('../database/connection');
// [THÊM 18/08/2026] FAQ nay là hằng số trong mã nguồn, không còn bảng CSDL.
const faqData = require('../api/faqs/faqs.data');
const logger = require('../utils/logger');
const config = require('../config');
/* [SỬA 17/08/2026 — LEVEL 3] Thay axios trần bằng aiClient.
   Từ Level 3, AI Service từ chối mọi request không kèm header khóa nội bộ.
   aiClient là nơi DUY NHẤT gắn header đó — gọi axios thẳng ở đây sẽ nhận 401
   và toàn bộ tri thức RAG không bao giờ được đồng bộ. */
const aiClient = require('./aiClient');
const crypto = require('crypto');
// [THÊM 18/08/2026] Dùng để nhớ "lần trước đã nạp nội dung FAQ nào".
// Khi Redis không dùng được, module này trả về một client giả với `get` luôn
// trả null — nghĩa là "chưa từng nạp" — nên hệ thống tự động quay lại hành vi
// cũ (nạp lại mọi lần khởi động). Fail-safe đúng chiều: thà nạp thừa còn hơn
// chatbot thiếu tri thức.
const redisClient = require('../database/redis');

/** Khóa Redis lưu vân tay nội dung FAQ đã nạp thành công lần gần nhất. */
const FAQ_HASH_KEY = 'ai-sync:faq-content-hash';

const getAiServiceUrl = () => {
  return config.aiServiceUrl;
};

/** Vân tay nội dung FAQ. Đổi một dấu phẩy trong faqs.data.js là đổi vân tay. */
const hashFaqs = (faqs) =>
  crypto
    .createHash('sha256')
    .update(
      JSON.stringify(
        faqs.map((f) => [f.faqId, f.question, f.answer, f.category])
      )
    )
    .digest('hex');

/**
 * Đồng bộ toàn bộ Danh sách Khóa học (Courses, Lessons) và FAQs sang AI Service (ChromaDB Vector Store)
 * Giúp Chatbot luôn có dữ liệu phong phú để phản hồi chính xác và hiển thị Widget Carousel cho học viên.
 */
const syncInitialDataToAi = async ({ force = false } = {}) => {
  try {
    logger.info('🤖 [AI Sync] Bắt đầu kiểm tra và đồng bộ tri thức RAG sang AI Service...');
    const pool = await getConnection();
    const baseUrl = getAiServiceUrl();

    // 1. Kiểm tra AI Service có sẵn sàng không
    let health;
    try {
      health = await aiClient.checkHealth(3000);
    } catch (err) {
      logger.warn(`🤖 [AI Sync] AI Service tại ${baseUrl} chưa phản hồi, bỏ qua lần đồng bộ này.`);
      return;
    }

    /* ======================================================================
       [THÊM 18/08/2026] CHỈ NẠP LẠI KHI THỰC SỰ CẦN

       ★ Vấn đề của bản cũ: hàm này chạy ở MỖI lần backend khởi động và nạp lại
         TOÀN BỘ khóa học + FAQ, bất kể dữ liệu đã nằm sẵn trong ChromaDB.

         Mỗi lần nạp là một loạt lời gọi API embedding của Gemini — TỐN TIỀN và
         đếm vào hạn mức. Nghiêm trọng hơn: vòng lặp khóa học có `sleep(500ms)`
         giữa các lần gọi, nên với 40 khóa học thì mỗi lần khởi động lại mất
         thêm ~20 giây. Ở môi trường dev với hot-reload, backend khởi động lại
         vài chục lần mỗi ngày.

       ★ Hai điều kiện dừng KHÁC NHAU, cố ý:

         KHÓA HỌC → chỉ cần collection còn vector là bỏ qua. Việc xuất bản hay
           sửa khóa học đã có đường đồng bộ riêng (removeCourseFromAi và các
           hook lúc publish), nên vòng lặp lúc khởi động này chỉ là mồi ban đầu.

         FAQ → so theo VÂN TAY NỘI DUNG chứ không chỉ theo "có vector chưa".
           Lý do: FAQ nằm trong mã nguồn (faqs.data.js), sửa xong deploy lại là
           phải nạp lại NGAY. Nếu chỉ kiểm tra "collection còn vector không"
           thì một chính sách vừa được sửa sẽ không bao giờ tới được chatbot,
           và người sửa không hề nhận được tín hiệu nào — chatbot cứ tiếp tục
           trả lời bằng chính sách cũ. Đó là kiểu lỗi im lặng tệ nhất trong cả
           luồng này.

       ★ Ép nạp lại bằng tay:  syncInitialDataToAi({ force: true })
       ====================================================================== */
    const collections = health?.data?.collections || {};
    const courseVectors = Number(collections.courses?.count ?? 0);
    const masterVectors = Number(collections.master?.count ?? 0);

    /* ======================================================================
       [SỬA 17/08/2026 — COURSE VERSIONING]  ĐIỂM RẤT DỄ BỎ SÓT

       VẤN ĐỀ: trước đây câu truy vấn lấy MỌI khóa PUBLISHED và ingest theo
       `course_name`. Sau khi có phiên bản, v1 và v2 thường TRÙNG TÊN khóa học.
       Hệ quả kép:
         1. Tri thức của v2 ghi đè lên v1 trong ChromaDB → chatbot trả lời học
            viên v1 bằng nội dung v2. Đây đúng là điều mà versioning sinh ra để
            ngăn chặn.
         2. Chatbot tư vấn bán hàng có thể giới thiệu một phiên bản đã ngừng bán.

       CÁCH SỬA:
         - Chỉ lấy phiên bản ĐANG BÁN (IsLatestVersion = 1) cho kho tri thức
           dùng tư vấn/bán hàng. Loại luôn bản nháp (LiveCourseID IS NULL).
         - Gửi kèm `course_id` và `version_number` để AI Service ghi vào
           metadata của ChromaDB, phục vụ lọc chính xác theo phiên bản khi trợ
           lý AI phục vụ học viên bên trong khóa học.
       ====================================================================== */
    let successCourses = 0;
    let courses = [];

    if (!force && courseVectors > 0) {
      logger.info(
        `🤖 [AI Sync] Bỏ qua nạp khóa học: ChromaDB đã có ${courseVectors} vector ` +
          `trong collection "courses". Ép nạp lại: syncInitialDataToAi({ force: true }).`
      );
    } else {
      const coursesRes = await pool.request().query(
        `SELECT CourseID, CourseName, Slug, ShortDescription, FullDescription,
                OriginalPrice, DiscountedPrice,
                ISNULL(VersionNumber, 1) AS VersionNumber
         FROM Courses
         WHERE StatusID = 'PUBLISHED'
           AND LiveCourseID IS NULL
           AND ISNULL(IsLatestVersion, 1) = 1`
      );
      // Gán vào biến đã khai báo ở NGOÀI khối `if` — KHÔNG dùng `const courses`
      // ở đây. Khai báo lại sẽ tạo một biến mới chỉ sống trong khối này, và
      // dòng tổng kết cuối hàm (`${courses.length}`) sẽ luôn đọc mảng rỗng.
      courses = coursesRes.recordset || [];

      for (const c of courses) {
        try {
          // Lấy bài học của từng khóa (loại bài/chương đã lưu trữ)
          const lessonsRes = await pool.request()
            .input('CourseID', sql.BigInt, c.CourseID)
            .query(
              `SELECT l.LessonName, l.Description, l.TextContent
               FROM Lessons l
               JOIN Sections s ON l.SectionID = s.SectionID
               WHERE s.CourseID = @CourseID
                 AND l.IsArchived = 0 AND s.IsArchived = 0`
            );
          const lessons = lessonsRes.recordset || [];

          // Clean HTML tags nhã nhặn từ description nếu có
          const cleanText = (str) => (str || '').replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();

          const courseDesc = `Khóa học: ${c.CourseName}\nMô tả ngắn: ${cleanText(c.ShortDescription)}\nNội dung chi tiết: ${cleanText(c.FullDescription)}\nGiá ưu đãi: ${c.DiscountedPrice || c.OriginalPrice || 0} VNĐ`;

          const formattedLessons = lessons.map(l => ({
            name: l.LessonName || 'Bài học',
            content: `${l.LessonName}\n${cleanText(l.Description)}\n${cleanText(l.TextContent)}`
          }));

          await aiClient.postIngest('/api/ingest/course', {
            course_name: c.CourseName,
            course_description: courseDesc,
            lessons: formattedLessons,
            // Định danh bền vững theo phiên bản — AI Service lưu vào metadata
            // ChromaDB để lọc đúng phiên bản khi trả lời học viên.
            course_id: c.CourseID,
            version_number: c.VersionNumber,
            /* [THÊM 20/08/2026] Thêm slug và giá.
               Thẻ khóa học trong khung chat đọc `slug` để mở thẳng trang khóa
               học (thiếu thì nút "Xem chi tiết" chỉ đổ tên xuống ô tìm kiếm) và
               đọc `price` để hiện giá (thiếu thì luôn rơi về nhãn chung chung).
               Giá ở đây là ảnh chụp tại thời điểm nạp tri thức, dùng để HIỂN
               THỊ GỢI Ý; mọi lệnh tạo đơn vẫn lấy giá từ CSDL. */
            slug: c.Slug,
            price: Number(c.DiscountedPrice ?? c.OriginalPrice ?? 0),
          }, 60000);

          successCourses++;
          await new Promise(r => setTimeout(r, 500)); // Nhờn chút để tránh rate limit của Embedding API
        } catch (err) {
          logger.error(`🤖 [AI Sync] Lỗi đồng bộ khóa học #${c.CourseID}: ${err.response ? JSON.stringify(err.response.data) : err.message}`);
        }
      }
    }

    /* ========================================================================
       3. Đồng bộ FAQ

       [SỬA 18/08/2026] Đọc từ MÃ NGUỒN, không phải từ CSDL.

       Bản cũ truy vấn bảng `FAQs` — bảng KHÔNG tồn tại trong bất kỳ migration
       nào, nên khối `OBJECT_ID` luôn trả null và toàn bộ FAQ chưa bao giờ được
       nạp vào RAG. Chatbot Master không hề biết một chữ nào về chính sách hệ
       thống, mà cũng không có lỗi nào báo ra vì khối này im lặng bỏ qua.

       Nay nội dung nằm ở `api/faqs/faqs.data.js`. Bỏ luôn được cả bảng lẫn
       phép kiểm tra OBJECT_ID.
       ====================================================================== */
    let successFaqs = 0;
    const faqs = faqData.getAll();
    const faqsCount = faqs.length;

    /* ----------------------------------------------------------------------
       [THÊM 18/08/2026] So vân tay nội dung trước khi nạp.

       Điều kiện bỏ qua gồm HAI vế, phải đúng cả hai:
         (a) collection "master" còn vector — nếu ChromaDB vừa bị xóa sạch thì
             dù vân tay khớp vẫn PHẢI nạp lại;
         (b) vân tay nội dung khớp lần nạp thành công gần nhất.

       Thiếu vế (a) thì xóa volume ChromaDB xong chatbot sẽ mất hết tri thức FAQ
       vĩnh viễn, vì vân tay trong Redis vẫn còn nguyên và bảo "đã nạp rồi".
       Đây đúng là kiểu bộ nhớ đệm nói dối mà cơ chế này phải tránh.
       -------------------------------------------------------------------- */
    const faqHash = hashFaqs(faqs);
    let storedFaqHash = null;
    try {
      storedFaqHash = await redisClient.get(FAQ_HASH_KEY);
    } catch (err) {
      // Redis hỏng → coi như chưa từng nạp → nạp lại. Không để lỗi phụ trợ
      // làm hỏng cả quá trình đồng bộ.
      logger.warn(`🤖 [AI Sync] Không đọc được vân tay FAQ từ Redis: ${err.message}`);
    }

    if (!force && masterVectors > 0 && storedFaqHash === faqHash) {
      logger.info(
        `🤖 [AI Sync] Bỏ qua nạp FAQ: nội dung không đổi kể từ lần nạp trước ` +
          `(${faqsCount} mục, collection "master" đang có ${masterVectors} vector).`
      );
      successFaqs = faqsCount;
    } else {
      for (const faq of faqs) {
        try {
          await aiClient.postIngest('/api/ingest/text', {
            text: `Q: ${faq.question}\nA: ${faq.answer}`,
            /* `source_name` là KHÓA ĐỊNH DANH trong ChromaDB. Nạp lại cùng một
               source_name sẽ ghi đè bản cũ thay vì sinh bản trùng — và đây cũng
               chính là khóa dùng để xóa:
                   DELETE /api/ingest/collection/master_knowledge/source/FAQ-3
               Vì vậy `faqId` trong faqs.data.js phải ỔN ĐỊNH, đừng đánh số lại. */
            source_name: `FAQ-${faq.faqId}`,
            collection: 'master_knowledge',
            metadata: { type: 'faq', FaqID: faq.faqId, category: faq.category },
          }, 5000);
          successFaqs++;
        } catch (err) {
          logger.error(`🤖 [AI Sync] Lỗi đồng bộ FAQ #${faq.faqId}: ${err.message}`);
        }
      }

      /* Chỉ ghi vân tay khi TẤT CẢ đều thành công.
         Nếu 10/12 mục vào được mà vẫn ghi vân tay, hai mục lỗi sẽ không bao giờ
         được thử lại — chatbot thiếu đúng hai chính sách đó mãi mãi, và không
         có dấu hiệu nào ngoài hai dòng log đã trôi qua từ lâu. */
      if (successFaqs === faqsCount) {
        try {
          await redisClient.set(FAQ_HASH_KEY, faqHash);
        } catch (err) {
          // Ghi hỏng chỉ có nghĩa là lần khởi động sau nạp lại — vô hại.
          logger.warn(`🤖 [AI Sync] Không lưu được vân tay FAQ vào Redis: ${err.message}`);
        }
      }
    }

    /* ======================================================================
       4. Nạp lại TÀI LIỆU CHÍNH SÁCH (PDF quản trị viên đã tải lên)

       [THÊM 18/08/2026]

       CHỈ chạy khi collection "master" ĐANG RỖNG — tức là ChromaDB vừa được
       dựng mới hoặc volume vừa bị xóa. Ở trạng thái bình thường, tài liệu đã
       được nạp ngay lúc tải lên (xem faqDocuments.service.js), nạp lại mỗi lần
       khởi động chỉ tốn thêm lượt gọi API embedding mà không đổi được gì.

       ⚠️ Điều kiện ở đây là `masterVectors === 0`, KHÁC với điều kiện của FAQ
          phía trên (so vân tay). Cố ý: nội dung FAQ nằm trong mã nguồn nên có
          thể đổi sau mỗi lần deploy, còn tài liệu PDF thì bất biến sau khi tải
          lên — sửa nội dung nghĩa là xóa đi và tải bản mới.
       ====================================================================== */
    if (force || masterVectors === 0) {
      try {
        // require ở TRONG hàm, không ở đầu tệp: faqDocuments.service kéo theo
        // cấu hình Cloudinary và tầng lưu trữ. Nạp chúng ở cấp module sẽ khiến
        // aiSync.service không thể require được trong kiểm thử nếu thiếu biến
        // môi trường Cloudinary — mà việc đồng bộ RAG không liên quan gì tới đó.
        const faqDocuments = require('../api/faqs/faqDocuments.service');
        await faqDocuments.reingestAll();
      } catch (err) {
        logger.error(`🤖 [AI Sync] Nạp lại tài liệu chính sách thất bại: ${err.message}`);
      }
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
    await aiClient.deleteIngest(`/api/ingest/course/${encodeURIComponent(courseName)}`, 5000);
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
    await aiClient.deleteIngest(`/api/ingest/lesson/${encodeURIComponent(lessonName)}`, 5000);
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
