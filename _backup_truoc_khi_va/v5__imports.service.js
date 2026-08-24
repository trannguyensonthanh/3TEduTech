/* ============================================================================
 * imports.service.js
 * [THÊM 18/08/2026 — COURSE IMPORT, Giai đoạn A]
 *
 * Nghiệp vụ nhập khóa học: nhận tệp → theo dõi → chấp nhận/hủy.
 *
 * ----------------------------------------------------------------------------
 * ★ NGUYÊN TẮC XUYÊN SUỐT: KHÔNG CÓ GÌ TỰ ĐỘNG VÀO CƠ SỞ DỮ LIỆU
 *
 * Pipeline chỉ sinh ra một bản nháp nằm trên Redis. Chỉ khi giảng viên bấm
 * "Chấp nhận" thì `acceptProposal()` mới ghi vào Courses/Sections/Lessons —
 * và ghi dưới dạng DRAFT, phải qua luồng duyệt như mọi khóa học khác.
 * ========================================================================== */

const httpStatus = require('http-status').status;
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const importStore = require('../../services/import/importStore');
const { addImportJob } = require('../../queues/import.queue');
// [THÊM 18/08/2026 — COURSE IMPORT, Giai đoạn B] Điểm DUY NHẤT được gọi AI Service.
const aiClient = require('../../services/aiClient');
// [THÊM 18/08/2026 — COURSE IMPORT, Giai đoạn C] Tải video lên sau khi chấp nhận.
const { addMediaUploadJob } = require('../../queues/mediaUpload.queue');
const { cleanupJobDir, jobDir } = require('../../services/import/importPipeline');
const courseRepository = require('../courses/courses.repository');
const sectionRepository = require('../sections/sections.repository');
const lessonRepository = require('../lessons/lessons.repository');
// [THÊM 18/08/2026 — COURSE IMPORT, Giai đoạn D] Tạo câu hỏi trắc nghiệm.
const quizRepository = require('../quizzes/quizzes.repository');
const categoryRepository = require('../categories/categories.repository');
const levelRepository = require('../levels/levels.repository');
const userRepository = require('../users/users.repository');
const { getConnection, sql } = require('../../database/connection');
const { generateSlug } = require('../../utils/slugify');
const { truncate } = require('../../services/import/treeAnalyzer');
const CourseStatus = require('../../core/enums/CourseStatus');
const LessonType = require('../../core/enums/LessonType');
const ApiError = require('../../core/errors/ApiError');
const logger = require('../../utils/logger');
const config = require('../../config');

/**
 * Kiểm tra dung lượng đĩa trống trước khi nhận tệp.
 *
 * `fs.statfs` có từ Node 18. Ổ đĩa đầy giữa chừng gây lỗi rất khó hiểu (ghi
 * file thất bại ở một chỗ ngẫu nhiên trong pipeline), nên chặn từ đầu bằng một
 * thông báo rõ ràng vẫn tốt hơn nhiều.
 */
const assertDiskSpace = async () => {
  try {
    const stats = await fs.statfs(config.import.tempDir);
    const freeBytes = stats.bavail * stats.bsize;
    if (freeBytes < config.import.minFreeDiskBytes) {
      throw new ApiError(
        httpStatus.SERVICE_UNAVAILABLE,
        'Máy chủ tạm hết dung lượng lưu trữ. Vui lòng thử lại sau ít phút.'
      );
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // statfs không dùng được (hệ tệp lạ) → chỉ ghi log, không chặn người dùng.
    logger.debug(`[Import] Không kiểm tra được dung lượng đĩa: ${error.message}`);
  }
};

/**
 * Tạo job mới từ tệp đã tải lên.
 *
 * @param {object} user
 * @param {object} file - req.file của multer (diskStorage)
 */
const createImportJob = async (user, file) => {
  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Vui lòng chọn tệp .zip để tải lên.');
  }

  await fs.mkdir(config.import.tempDir, { recursive: true });
  await assertDiskSpace();

  /* Chặn một giảng viên mở nhiều job cùng lúc.
     Mỗi job chiếm dung lượng đĩa đáng kể; và vì worker chạy tuần tự
     (concurrency = 1) nên nhiều job chỉ làm mọi người phải chờ lâu hơn. */
  const active = await importStore.countActiveByAccount(user.id);
  if (active >= config.import.maxConcurrentPerUser) {
    await fs.rm(file.path, { force: true }).catch(() => {});
    throw new ApiError(
      httpStatus.CONFLICT,
      'Bạn đang có một lần nhập khóa học đang xử lý. Vui lòng đợi hoàn tất rồi thử lại.'
    );
  }

  const jobId = crypto.randomBytes(8).toString('hex');

  /* Chuẩn hóa NFC cho tên tệp gốc — cùng lý do như tên entry trong ZIP.
     Trình duyệt trên macOS gửi lên tên dạng NFD. */
  const originalName = String(file.originalname || 'khoa-hoc.zip').normalize('NFC');

  const job = {
    jobId,
    accountId: user.id,
    sourceName: originalName,
    sizeBytes: file.size,
    status: importStore.ImportStatus.PENDING,
    progress: 0,
    statusMessage: 'Đang chờ xử lý...',
    proposed: null,
    createdAt: new Date().toISOString(),
  };

  await importStore.create(job);

  /* ⚠️ Từ đây trở đi PHẢI dọn dẹp nếu có lỗi.
     Bản ghi Redis đã tồn tại với trạng thái PENDING. Nếu `rename` hoặc
     `addImportJob` hỏng mà ta để nguyên, job đó nằm lại PENDING cho tới khi
     hết TTL (12–48 giờ) — và vì `countActiveByAccount` đếm cả PENDING, giảng
     viên sẽ bị CHẶN không tạo được lần nhập nào khác suốt thời gian đó. Một
     lỗi thoáng qua biến thành một tính năng chết cả ngày. */
  const targetZip = path.join(jobDir(jobId), 'source.zip');
  try {
    /* Chuyển tệp vào thư mục riêng của job.
       `fs.rename` trong CÙNG một volume là thao tác tức thì (chỉ đổi inode),
       nên kể cả tệp 200MB cũng không tốn thời gian hay dung lượng. */
    await fs.mkdir(path.dirname(targetZip), { recursive: true });
    await fs.rename(file.path, targetZip);

    await addImportJob({
      jobId,
      accountId: user.id,
      zipPath: targetZip,
      zipFileName: originalName,
    });
  } catch (error) {
    logger.error(`[Import] Không khởi tạo được job ${jobId}:`, error);
    await importStore.remove(jobId, user.id).catch(() => {});
    await cleanupJobDir(jobId).catch(() => {});
    await fs.rm(file.path, { force: true }).catch(() => {});
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Không khởi tạo được phiên nhập khóa học. Vui lòng thử lại.'
    );
  }

  logger.info(
    `[Import] Giảng viên ${user.id} tạo job ${jobId} — "${originalName}" (${Math.round(file.size / 1024)}KB).`
  );

  return importStore.toSummary(job);
};

/** Lấy job và kiểm tra quyền sở hữu cùng lúc. */
const getOwnedJob = async (user, jobId) => {
  const job = await importStore.get(jobId);
  /* Trả 404 cho cả trường hợp không phải chủ sở hữu.
     Trả 403 sẽ vô tình xác nhận job đó CÓ TỒN TẠI, cho phép dò tuần tự để biết
     ai đang nhập khóa học gì. Cùng nguyên tắc đã áp cho phiên chat ở Level 3. */
  if (!job || String(job.accountId) !== String(user.id)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy phiên nhập khóa học.');
  }
  return job;
};

const getJobStatus = async (user, jobId) => {
  const job = await getOwnedJob(user, jobId);
  return importStore.toSummary(job);
};

/**
 * Dọn bản nháp trước khi gửi ra trình duyệt.
 *
 * Hai việc, mỗi việc chống một lỗi cụ thể:
 *
 * 1. BỎ `absolutePath` / `subtitleAbsolutePath`.
 *    Chúng là đường dẫn thật trên máy chủ (/var/lib/3tedu/imports/...). Giao
 *    diện không dùng tới, mà gửi ra thì lộ cấu trúc thư mục máy chủ cho bất kỳ
 *    ai mở DevTools. Đối chiếu bài học vẫn dùng `sourcePath` (đường dẫn TƯƠNG
 *    ĐỐI bên trong ZIP) nên không mất chức năng gì.
 *
 * 2. ÉP `description` về chuỗi.
 *    treeAnalyzer tạm đặt `description = { fromFile: '...' }` rồi
 *    importPipeline.readMetadataFiles mới thay bằng nội dung thật. Nếu bước đó
 *    lỡ không chạy hết, một OBJECT sẽ trôi tới `sql.NVarChar` và vào CSDL
 *    thành chuỗi "[object Object]" — sai âm thầm, không có lỗi nào báo.
 *
 * `job.proposed` vừa được JSON.parse từ Redis nên đây đã là bản sao riêng —
 * sửa trực tiếp không ảnh hưởng gì tới dữ liệu gốc.
 */
const sanitizeProposalForClient = (proposal) => {
  if (!proposal) return proposal;
  const asText = (value) => (typeof value === 'string' ? value : null);

  return {
    ...proposal,
    sections: (proposal.sections || []).map((section) => ({
      ...section,
      description: asText(section.description),
      lessons: (section.lessons || []).map(
        ({ absolutePath, subtitleAbsolutePath, ...lesson }) => ({
          ...lesson,
          description: asText(lesson.description),
          // Giao diện chỉ cần biết CÓ phụ đề hay không, không cần đường dẫn.
          hasSubtitle: Boolean(lesson.subtitlePath),
        })
      ),
    })),
  };
};

/** Bản nháp đầy đủ — chỉ trả khi đã READY. */
const getProposal = async (user, jobId) => {
  const job = await getOwnedJob(user, jobId);
  if (job.status !== importStore.ImportStatus.READY) {
    throw new ApiError(
      httpStatus.CONFLICT,
      `Bản nháp chưa sẵn sàng (trạng thái hiện tại: ${job.status}).`
    );
  }
  return sanitizeProposalForClient(job.proposed);
};

const listMyJobs = async (user) => {
  const jobs = await importStore.listByAccount(user.id);
  return jobs.map(importStore.toSummary);
};

/** Hủy: xóa bản ghi Redis + thư mục tạm. Cloudinary hoàn toàn sạch. */
const cancelJob = async (user, jobId) => {
  const job = await getOwnedJob(user, jobId);
  await cleanupJobDir(jobId);
  await importStore.remove(jobId, job.accountId);
  logger.info(`[Import] Giảng viên ${user.id} đã hủy job ${jobId}.`);
  return { cancelled: true };
};

/* ==========================================================================
 * [GIAI ĐOẠN B] NHỜ AI VIẾT MÔ TẢ
 *
 * ★ CHẠY THEO YÊU CẦU, KHÔNG TỰ ĐỘNG TRONG PIPELINE
 *
 * Bản kế hoạch ban đầu định gọi LLM ngay trong worker phân tích ZIP. Đặt ở đây
 * tốt hơn hẳn vì bốn lý do:
 *
 *   1. Pipeline phân tích KHÔNG BAO GIỜ chết vì AI. Gemini hết hạn mức hay
 *      GPU EC2 đang tắt cũng không ảnh hưởng — bản nháp vẫn ra bình thường.
 *   2. Giảng viên chủ động chi token. Với hạn mức miễn phí, mỗi lượt gọi đều
 *      đáng cân nhắc; bắt trả tiền cho một khóa học có thể sẽ bị hủy là lãng phí.
 *   3. Thấy kết quả ngay để nhận hay bỏ, thay vì phải chờ hết cả pipeline.
 *   4. Bấm lại được nếu kết quả chưa ưng.
 *
 * ⚠️ Kết quả KHÔNG ghi thẳng vào CSDL. Nó chỉ được lưu vào bản nháp trên Redis
 * và đổ vào ô nhập liệu cho giảng viên sửa. Đúng nguyên tắc xuyên suốt dự án:
 * "AI đề xuất, mã nguồn quyết định, con người phê duyệt".
 * ========================================================================== */

/** Số ký tự nội dung trích cho mỗi bài khi gửi sang AI. */
const AI_EXCERPT_CHARS = 400;

/**
 * Nhờ AI viết mô tả cho bản nháp.
 *
 * Trả về đúng bản nháp đã được điền mô tả (dạng đã lọc cho client), để giao
 * diện chỉ việc thay thế trạng thái hiện có.
 */
const enrichProposal = async (user, jobId) => {
  const job = await getOwnedJob(user, jobId);

  if (job.status !== importStore.ImportStatus.READY) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'Bản nháp chưa sẵn sàng để nhờ AI viết mô tả.'
    );
  }

  const proposal = job.proposed;
  if (!proposal || !Array.isArray(proposal.sections) || proposal.sections.length === 0) {
    throw new ApiError(httpStatus.CONFLICT, 'Bản nháp không có nội dung nào.');
  }

  /* Đặt khóa TẠM cho mỗi phần tử rồi mới gửi đi.
     ★ CỐ Ý không gửi `sourcePath` sang AI Service. Hai lý do: mô hình không
     cần biết cấu trúc thư mục, và một chuỗi "l12" rẻ hơn nhiều so với
     "Khóa học Python/01. Nhập môn/02. Cài đặt.pdf" khi nhân với 80 bài. */
  const sectionByKey = new Map();
  const lessonByKey = new Map();

  const payloadSections = proposal.sections.map((section, sIndex) => {
    const sectionKey = `s${sIndex}`;
    sectionByKey.set(sectionKey, section);

    return {
      key: sectionKey,
      name: section.sectionName || 'Chương',
      lessons: (section.lessons || []).map((lesson, lIndex) => {
        const lessonKey = `s${sIndex}l${lIndex}`;
        lessonByKey.set(lessonKey, lesson);
        return {
          key: lessonKey,
          name: lesson.lessonName || 'Bài học',
          kind: lesson.lessonType === 'VIDEO' ? 'VIDEO' : 'TEXT',
          // Video chưa có phụ đề nên không có text — mô hình chỉ dựa vào tên bài.
          excerpt: String(lesson.textContent || '').slice(0, AI_EXCERPT_CHARS),
        };
      }),
    };
  });

  let response;
  try {
    response = await aiClient.post(
      '/api/generate/course-content',
      {
        course_name: proposal.courseName || 'Khóa học',
        sections: payloadSections,
        existing_description: proposal.courseDescription || '',
        language: 'vi',
      },
      /* 180 giây: một khóa học 80 bài là prompt khá dài, và Qwen chạy trên GPU
         T4 không nhanh. Đặt ngắn hơn thì lượt gọi bị cắt giữa chừng — token đã
         tiêu mà không thu được gì, trường hợp lãng phí nhất. */
      180000
    );
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;

    if (status === 503) {
      throw new ApiError(
        httpStatus.SERVICE_UNAVAILABLE,
        detail ||
          'AI hiện không hoạt động. Bạn vẫn có thể tự viết mô tả và tạo khóa học bình thường.'
      );
    }
    logger.error(`[Import] Nhờ AI viết mô tả thất bại cho job ${jobId}:`, error.message);
    throw new ApiError(
      httpStatus.BAD_GATEWAY,
      detail || 'Không gọi được dịch vụ AI. Vui lòng thử lại sau ít phút.'
    );
  }

  const data = response.data || {};

  /* Đổ mô tả vào ĐÚNG bản nháp phía máy chủ.
     Đối chiếu bằng khóa tạm ở trên — AI Service đã loại mọi khóa lạ, nhưng ở
     đây vẫn tra qua Map nên khóa không khớp đơn giản là bị bỏ qua. Phòng thủ
     hai lớp cho cùng một rủi ro. */
  let sectionCount;
  let lessonCount;

  /* ⚠️ Kiểm tra `item` có phải object không TRƯỚC KHI đọc `item.key`.
     AI Service đã lọc rồi, nhưng ở đây KHÔNG được phép tin điều đó: một
     `null` lọt vào mảng là đủ ném TypeError, và lỗi đó xảy ra SAU khi token
     đã tiêu — giảng viên trả tiền cho một lượt gọi rồi nhận về lỗi 500.
     Ranh giới giữa hai dịch vụ phải tự bảo vệ mình. */
  const applyDescriptions = (items, lookup, sourceLabel) => {
    let count = 0;
    if (!Array.isArray(items)) return count;

    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      const target = lookup.get(item.key);
      if (!target) continue;
      if (typeof item.description !== 'string') continue;

      const description = item.description.trim();
      if (!description) continue;

      target.description = description;
      target.descriptionSource = sourceLabel;
      count += 1;
    }
    return count;
  };

  sectionCount = applyDescriptions(data.sections, sectionByKey, 'ai');
  lessonCount = applyDescriptions(data.lessons, lessonByKey, 'ai');

  const shortDescription =
    typeof data.short_description === 'string' ? data.short_description.trim() : '';
  const fullDescription =
    typeof data.full_description === 'string' ? data.full_description.trim() : '';

  if (fullDescription) {
    proposal.courseDescription = fullDescription;
    proposal.courseDescriptionSource = 'ai';
  }
  proposal.courseShortDescription = shortDescription || null;

  /* Lưu lại vào Redis. Nếu không lưu, giảng viên tải lại trang là mất sạch và
     phải tiêu token lần nữa — điều đáng tiếc nhất với hạn mức miễn phí. */
  await importStore.patch(jobId, { proposed: proposal });

  logger.info(
    `[Import] AI đã viết mô tả cho job ${jobId}: ` +
      `${sectionCount} chương, ${lessonCount} bài (provider: ${data.provider || '?'}).`
  );

  return {
    proposal: sanitizeProposalForClient(proposal),
    shortDescription: shortDescription || null,
    sectionsWritten: sectionCount,
    lessonsWritten: lessonCount,
    provider: data.provider || null,
    warnings: Array.isArray(data.warnings) ? data.warnings : [],
  };
};

/* ==========================================================================
 * [GIAI ĐOẠN D] SINH CÂU HỎI TRẮC NGHIỆM
 *
 * Cùng khuôn mẫu với `enrichProposal`: chạy theo yêu cầu, kết quả nằm trong
 * bản nháp trên Redis, giảng viên xem rồi mới quyết định.
 *
 * ★ CHỈ RA ĐỀ CHO BÀI CÓ NỘI DUNG VĂN BẢN THẬT
 *
 * Bài video chưa có phụ đề thì không có gì để ra đề. Gửi mỗi cái tên bài cho
 * mô hình sẽ nhận về những câu vô nghĩa kiểu "Bài 3 nói về gì?" — tệ hơn là
 * không có, vì giảng viên phải mất công đi xóa từng câu.
 * ========================================================================== */

/** Số ký tự nội dung gửi cho mỗi bài khi ra đề. Dài hơn lúc viết mô tả, vì ra
 *  đề đòi hỏi đọc kỹ chứ không phải tóm tắt. */
const QUIZ_EXCERPT_CHARS = 1200;

/** Số bài tối đa ra đề trong một lượt (khớp với trần bên AI Service). */
const QUIZ_MAX_LESSONS = 30;

/** Nội dung ngắn hơn mức này thì không đủ để ra đề tử tế. */
const QUIZ_MIN_CONTENT_CHARS = 200;

/**
 * Nhờ AI soạn câu hỏi trắc nghiệm cho các bài học có nội dung.
 *
 * Kết quả lưu vào `lesson.quizQuestions` trong bản nháp. KHÔNG ghi vào CSDL —
 * chỉ khi bấm "Tạo khóa học" với tùy chọn `includeQuiz` thì mới thành dữ liệu
 * thật.
 */
const generateQuiz = async (user, jobId, questionsPerLesson = 3) => {
  const job = await getOwnedJob(user, jobId);

  if (job.status !== importStore.ImportStatus.READY) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'Bản nháp chưa sẵn sàng để tạo câu hỏi.'
    );
  }

  const proposal = job.proposed;
  if (!proposal || !Array.isArray(proposal.sections)) {
    throw new ApiError(httpStatus.CONFLICT, 'Bản nháp không có nội dung nào.');
  }

  /* Lọc TRƯỚC KHI gọi AI. Gửi bài không có nội dung đi rồi nhận về câu hỏi rỗng
     là tiêu token cho đúng một việc: chứng minh điều đã biết trước. */
  const lessonByKey = new Map();
  const payloadLessons = [];

  proposal.sections.forEach((section, sIndex) => {
    (section.lessons || []).forEach((lesson, lIndex) => {
      if (payloadLessons.length >= QUIZ_MAX_LESSONS) return;

      const content = String(lesson.textContent || '').trim();
      if (content.length < QUIZ_MIN_CONTENT_CHARS) return;
      if (lesson.selected === false) return;

      const key = `s${sIndex}l${lIndex}`;
      lessonByKey.set(key, lesson);
      payloadLessons.push({
        key,
        name: lesson.lessonName || 'Bài học',
        excerpt: content.slice(0, QUIZ_EXCERPT_CHARS),
      });
    });
  });

  if (payloadLessons.length === 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Không có bài học nào đủ nội dung để ra đề. Trắc nghiệm chỉ tạo được cho ' +
        'bài có tài liệu văn bản (PDF, DOCX, TXT...). Bài video cần có phụ đề trước.'
    );
  }

  let response;
  try {
    response = await aiClient.post(
      '/api/generate/quiz',
      {
        course_name: proposal.courseName || 'Khóa học',
        lessons: payloadLessons,
        questions_per_lesson: Math.max(1, Math.min(5, questionsPerLesson)),
      },
      180000
    );
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;

    // 400/422 là lỗi DỮ LIỆU (nội dung không đủ để ra đề) — thông điệp đã viết
    // cho người dùng đọc, chuyển thẳng lên. Khác hẳn với lỗi hạ tầng.
    if (status === 400 || status === 422) {
      throw new ApiError(httpStatus.BAD_REQUEST, detail || 'Không tạo được câu hỏi.');
    }
    if (status === 503) {
      throw new ApiError(
        httpStatus.SERVICE_UNAVAILABLE,
        detail || 'AI hiện không hoạt động. Bạn vẫn có thể tạo khóa học bình thường.'
      );
    }
    logger.error(`[Import] Sinh câu hỏi thất bại cho job ${jobId}:`, error.message);
    throw new ApiError(
      httpStatus.BAD_GATEWAY,
      detail || 'Không gọi được dịch vụ AI. Vui lòng thử lại sau ít phút.'
    );
  }

  const data = response.data || {};

  /* Xóa sạch câu hỏi cũ trước khi gán câu mới.
     Không xóa thì bấm "Tạo lại" sẽ cho ra bản nháp có cả câu cũ lẫn câu mới —
     giảng viên tưởng AI ra 6 câu trong khi thực tế là 3 câu bị nhân đôi. */
  for (const section of proposal.sections) {
    for (const lesson of section.lessons || []) {
      delete lesson.quizQuestions;
    }
  }

  let totalQuestions = 0;
  let lessonsWithQuiz = 0;

  for (const item of data.lessons || []) {
    if (!item || typeof item !== 'object') continue;
    const lesson = lessonByKey.get(item.key);
    if (!lesson || !Array.isArray(item.questions) || item.questions.length === 0) {
      continue;
    }

    /* AI Service đã kiểm tra gắt rồi, nhưng đây là ranh giới giữa hai dịch vụ
       nên vẫn kiểm lại những bất biến QUAN TRỌNG NHẤT: phải có đáp án đúng, và
       chỉ số đáp án phải nằm trong phạm vi. Một câu sai hai điều đó mà lọt vào
       CSDL thì học viên KHÔNG BAO GIỜ qua được bài. */
    const questions = item.questions.filter(
      (q) =>
        q &&
        typeof q.question === 'string' &&
        q.question.trim() &&
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        Number.isInteger(q.correctIndex ?? q.correct_index) &&
        (q.correctIndex ?? q.correct_index) >= 0 &&
        (q.correctIndex ?? q.correct_index) < q.options.length
    );
    if (questions.length === 0) continue;

    lesson.quizQuestions = questions.map((q) => ({
      question: String(q.question).trim(),
      options: q.options.map((o) => String(o)),
      correctIndex: q.correctIndex ?? q.correct_index,
      explanation: typeof q.explanation === 'string' ? q.explanation.trim() : '',
    }));

    totalQuestions += questions.length;
    lessonsWithQuiz += 1;
  }

  if (totalQuestions === 0) {
    throw new ApiError(
      httpStatus.UNPROCESSABLE_ENTITY,
      'AI không soạn được câu hỏi nào đạt yêu cầu. Vui lòng thử lại.'
    );
  }

  await importStore.patch(jobId, { proposed: proposal });

  logger.info(
    `[Import] AI soạn ${totalQuestions} câu hỏi cho ${lessonsWithQuiz} bài (job ${jobId}).`
  );

  return {
    proposal: sanitizeProposalForClient(proposal),
    totalQuestions,
    lessonsWithQuiz,
    provider: data.provider || null,
    warnings: Array.isArray(data.warnings) ? data.warnings : [],
  };
};

/* --------------------------------------------------------------------------
 * Chấp nhận bản nháp → tạo khóa học DRAFT
 * ------------------------------------------------------------------------ */

/**
 * Đối chiếu ID do client gửi lên với danh sách THẬT trong CSDL.
 *
 * ★ Bắt buộc, vì `CategoryID`/`LevelID` là KHÓA NGOẠI. Một ID không tồn tại sẽ
 * làm câu INSERT đổ và mất cả lần nhập. Trả về null để tầng trên báo lỗi rõ
 * ràng thay vì để CSDL ném lỗi khó hiểu.
 */
const resolveCategoryAndLevel = async (categoryId, levelId) => {
  const [category, level] = await Promise.all([
    categoryRepository.findCategoryById(categoryId),
    levelRepository.findLevelById(levelId),
  ]);
  if (!category) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Danh mục không hợp lệ.');
  }
  if (!level) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cấp độ không hợp lệ.');
  }
  return { category, level };
};

/**
 * Xây dữ liệu khóa học, PHỦ ĐẦY ĐỦ mọi trường của bảng Courses.
 *
 * Bảng nguồn giá trị (xem kế hoạch v4 §4):
 *   🔧 HỆ THỐNG  — backend tự đặt, người dùng và AI không đụng được
 *   📁 TIER 0    — suy từ cấu trúc ZIP
 *   👤 GIẢNG VIÊN — nhập ở màn hình duyệt
 */
const buildCourseData = ({ proposal, body, instructorId, level, categoryId }) => {
  const courseName = truncate(body.courseName || proposal.courseName, 500);
  const baseSlug = generateSlug(courseName);
  // Hậu tố ngẫu nhiên: hai giảng viên đặt trùng tên khóa học là chuyện bình
  // thường, mà `UQ_Courses_Slug` là ràng buộc DUY NHẤT toàn hệ thống.
  const uniqueSlug = `${baseSlug}-${crypto.randomBytes(4).toString('hex')}`;

  return {
    // --- 📁 / 👤 ---
    CourseName: courseName,
    ShortDescription: truncate(
      body.shortDescription ||
        `Khóa học ${courseName} — nội dung đang được giảng viên hoàn thiện.`,
      500
    ),
    FullDescription:
      body.fullDescription ||
      proposal.courseDescription ||
      '<p>Nội dung khóa học đang được giảng viên soạn thảo...</p>',
    Requirements: body.requirements || null,
    LearningOutcomes: body.learningOutcomes || null,
    Language: body.language || 'vi',
    CategoryID: categoryId,
    LevelID: level.LevelID,
    // Giá do giảng viên tự nhập (đã bỏ phần AI gợi ý giá).
    OriginalPrice: body.originalPrice ?? 0,
    DiscountedPrice: body.discountedPrice ?? null,

    // --- 🔧 HỆ THỐNG — không nhận từ đâu khác ---
    Slug: uniqueSlug,
    InstructorID: instructorId,
    StatusID: CourseStatus.DRAFT, // LUÔN LUÔN là DRAFT
    PublishedAt: null,
    IsFeatured: 0,
    ThumbnailUrl: null, // Cloudinary điền sau khi upload
    IntroVideoUrl: null,
  };
};

/**
 * ★ Chấp nhận bản nháp — ghi vào cơ sở dữ liệu.
 *
 * Toàn bộ nằm trong MỘT transaction: hoặc có đủ khóa học + chương + bài, hoặc
 * không có gì. Không chấp nhận trạng thái nửa vời (khóa học rỗng không chương).
 */
const acceptProposal = async (user, jobId, body) => {
  const job = await getOwnedJob(user, jobId);

  if (job.status !== importStore.ImportStatus.READY) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'Bản nháp chưa sẵn sàng hoặc đã được sử dụng.'
    );
  }

  /* ★ Chốt cửa TRƯỚC khi làm bất cứ việc gì tốn thời gian.
     Kiểm tra trạng thái ở trên KHÔNG đủ: giữa lúc đọc trạng thái và lúc ghi
     ACCEPTED có cả một transaction dài, nên hai cú nhấp chuột liên tiếp đều
     lọt qua và tạo ra hai khóa học trùng nhau. Xem importStore.acquireAcceptLock. */
  const locked = await importStore.acquireAcceptLock(jobId);
  if (!locked) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'Bản nháp này đang được xử lý. Vui lòng đợi trong giây lát.'
    );
  }

  try {
    return await acceptProposalLocked(user, jobId, body, job);
  } finally {
    /* Mở khóa dù thành công hay thất bại. Nếu thất bại, giảng viên phải thử
       lại được NGAY chứ không phải chờ hết 2 phút. Trường hợp thành công thì
       trạng thái đã là ACCEPTED nên lần bấm sau vẫn bị chặn đúng cách. */
    await importStore.releaseAcceptLock(jobId);
  }
};

/** Phần thân của `acceptProposal`, chạy khi đã giữ được khóa. */
const acceptProposalLocked = async (user, jobId, body, job) => {
  const proposal = job.proposed;
  if (!proposal || !Array.isArray(proposal.sections)) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'Bản nháp không còn hợp lệ. Vui lòng nhập lại tệp ZIP.'
    );
  }
  const { level } = await resolveCategoryAndLevel(body.categoryId, body.levelId);

  const instructorProfile = await userRepository.findUserProfileById(user.id);
  if (!instructorProfile) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Không tìm thấy hồ sơ giảng viên.'
    );
  }

  /* Áp các chỉnh sửa của giảng viên lên bản nháp.
     Client gửi lên danh sách chương/bài đã sửa; ta chỉ lấy những trường được
     phép sửa (tên, mô tả, thứ tự, chọn/bỏ chọn) và BỎ QUA mọi trường khác —
     đường dẫn tệp, loại bài học... đều lấy từ bản nháp phía máy chủ.
     Tin client ở những trường đó sẽ cho phép họ trỏ bài học tới một tệp bất kỳ. */
  const edits = new Map(
    (body.sections || []).map((s) => [String(s.sourceDir ?? ''), s])
  );

  const pool = await getConnection();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  let courseId;
  let createdSections = 0;
  let createdLessons = 0;
  let createdQuestions = 0;
  /* Có tạo kèm trắc nghiệm không — do giảng viên tick ở màn hình duyệt.
     Mặc định KHÔNG: câu hỏi do AI soạn phải được chọn một cách chủ động, chứ
     không phải cứ bấm tạo khóa học là tự có. */
  const includeQuiz = body.includeQuiz === true;
  /** Video cần tải lên Cloudinary — gom trong transaction, xử lý SAU commit. */
  const pendingMedia = [];

  /* [THÊM 18/08/2026] Bài học VIDEO đang chờ giảng viên gắn nguồn.
     Nội dung video không còn được giải nén ra máy chủ (xem safeExtract.js), nên
     máy chủ không có gì để tải lên. Danh sách này được trả về cho giao diện để
     dựng bước 4 "Gắn video", nơi giảng viên chọn tệp (tải thẳng lên Cloudinary
     từ trình duyệt) hoặc dán link YouTube. */
  const lessonsNeedingVideo = [];

  try {
    const courseData = buildCourseData({
      proposal,
      body,
      instructorId: user.id,
      level,
      categoryId: body.categoryId,
    });
    const course = await courseRepository.createCourse(courseData, transaction);
    courseId = course.CourseID;

    /* ★ KHÔNG đặt `RootCourseID = courseId` ở đây.
       (Bản nháp đầu tiên của mã này có làm vậy — và nó SAI theo hai cách.)

       1. Nó là lệnh RỖNG. `updateCourseById` chỉ gán kiểu SQL cho một danh
          sách cột định sẵn, và `RootCourseID` không nằm trong đó → cột bị bỏ
          qua, `setClauses` chỉ còn mỗi UpdatedAt, hàm `return null`. Không có
          lỗi nào được ném ra: một lệnh không làm gì cả nhưng trông như đã chạy.

       2. Kể cả sửa được thì vẫn KHÔNG NÊN. Toàn dự án quy ước
          `RootCourseID IS NULL` nghĩa là "chính khóa học này là gốc" — xem
          courses.repository dùng `ISNULL(c.RootCourseID, c.CourseID)` và
          courses.service dùng `course.RootCourseID || course.CourseID`.
          `RootCourseID` chỉ được điền khi CLONE ra phiên bản 2 trở đi
          (cloneCourseRecord). Tự trỏ vào chính mình sẽ tạo ra cách biểu diễn
          THỨ HAI cho cùng một ý nghĩa — kiểu mâu thuẫn âm thầm mà về sau sẽ
          làm sai kết quả đếm phiên bản.

       Khóa học nhập từ ZIP là phiên bản 1, nên để nguyên NULL mới đúng. */

    let sectionOrder = 0;
    for (const section of proposal.sections) {
      const edit = edits.get(String(section.sourceDir ?? ''));
      if (edit && edit.selected === false) continue;

      const selectedLessons = section.lessons.filter((lesson) => {
        const lessonEdit = edit?.lessons?.find(
          (l) => l.sourcePath === lesson.sourcePath
        );
        return lessonEdit ? lessonEdit.selected !== false : lesson.selected !== false;
      });
      if (selectedLessons.length === 0) continue;

      const newSection = await sectionRepository.createSection(
        {
          CourseID: courseId,
          SectionName: truncate(
            edit?.sectionName || section.sectionName || 'Chương chưa đặt tên',
            255
          ),
          // ⚠️ SectionOrder bắt đầu từ 0 và phải LIÊN TỤC — ràng buộc này được
          // sections.service.updateSectionsOrder kiểm tra. Dùng biến đếm riêng
          // thay vì chỉ số mảng, vì có chương bị bỏ chọn.
          SectionOrder: sectionOrder,
          /* Chỉ nhận chuỗi. `section.description` có giai đoạn trung gian là
             object `{ fromFile }` (xem sanitizeProposalForClient) — để lọt vào
             sql.NVarChar sẽ thành "[object Object]" trong CSDL. */
          Description:
            typeof (edit?.description ?? section.description) === 'string'
              ? (edit?.description ?? section.description)
              : null,
        },
        transaction
      );
      sectionOrder += 1;
      createdSections += 1;

      let lessonOrder = 0;
      for (const lesson of selectedLessons) {
        const lessonEdit = edit?.lessons?.find(
          (l) => l.sourcePath === lesson.sourcePath
        );

        const newLesson = await lessonRepository.createLesson(
          {
            SectionID: newSection.SectionID,
            LessonName: truncate(
              lessonEdit?.lessonName || lesson.lessonName || 'Bài học',
              255
            ),
            Description:
              typeof (lessonEdit?.description ?? lesson.description) === 'string'
                ? (lessonEdit?.description ?? lesson.description)
                : null,
            LessonOrder: lessonOrder,
            LessonType:
              lesson.lessonType === 'VIDEO' ? LessonType.VIDEO : LessonType.TEXT,
            // Video CHƯA được upload — ExternalVideoID để trống, hàng đợi
            // media-upload sẽ điền sau (xem kế hoạch v3 §1.1).
            VideoSourceType: lesson.lessonType === 'VIDEO' ? 'CLOUDINARY' : null,
            ExternalVideoID: null,
            VideoDurationSeconds: lesson.durationSeconds ?? null,
            TextContent: lesson.textContent || null,
            IsFreePreview: 0,
          },
          transaction
        );

        /* [GIAI ĐOẠN D] Tạo câu hỏi trắc nghiệm ngay trong CÙNG transaction.
           Nếu tách ra làm sau commit, một lần lỗi sẽ để lại khóa học có bài
           thì có đề, bài thì không — trạng thái nửa vời rất khó lần ra sau này.
           Số lượt ghi tuy nhiều nhưng mỗi lệnh đều nhỏ. */
        if (
          includeQuiz &&
          Array.isArray(lesson.quizQuestions) &&
          lesson.quizQuestions.length > 0
        ) {
          let questionOrder = 0;
          for (const q of lesson.quizQuestions) {
            const created = await quizRepository.createQuestion(
              {
                LessonID: newLesson.LessonID,
                QuestionText: truncate(q.question, 1000),
                Explanation: q.explanation ? truncate(q.explanation, 1000) : null,
                QuestionOrder: questionOrder,
              },
              transaction
            );

            await quizRepository.createOptionsForQuestion(
              created.QuestionID,
              q.options.map((text, index) => ({
                OptionText: truncate(text, 500),
                // Đúng MỘT đáp án đúng. `correctIndex` đã được kiểm tra nằm
                // trong phạm vi ở cả AI Service lẫn generateQuiz.
                IsCorrectAnswer: index === q.correctIndex ? 1 : 0,
                OptionOrder: index,
              })),
              transaction
            );

            questionOrder += 1;
            createdQuestions += 1;
          }
        }

        /* Ghi nhận video cần tải lên Cloudinary SAU khi transaction commit.
           Không tải ở đây vì hai lý do: transaction đang mở (giữ khóa CSDL suốt
           thời gian tải hàng trăm MB là không chấp nhận được), và request HTTP
           của giảng viên sẽ treo hàng chục phút.

           `absolutePath` lấy từ bản nháp PHÍA MÁY CHỦ (`job.proposed`), KHÔNG
           phải từ dữ liệu client gửi lên — client không hề có trường này (xem
           sanitizeProposalForClient). Đây là ranh giới quan trọng: nếu tin
           client thì họ trỏ được bài học tới tệp bất kỳ trên máy chủ. */
        if (lesson.lessonType === 'VIDEO' && lesson.absolutePath) {
          pendingMedia.push({
            lessonId: newLesson.LessonID,
            lessonName: newLesson.LessonName,
            videoPath: lesson.absolutePath,
            subtitlePath: lesson.subtitleAbsolutePath || null,
            durationSeconds: lesson.durationSeconds ?? null,
          });
        } else if (lesson.lessonType === 'VIDEO') {
          /* [THÊM 18/08/2026] Đường đi MẶC ĐỊNH từ nay: video không nằm trên
             máy chủ, giảng viên sẽ gắn ở bước 4.

             Nhánh `if` phía trên chỉ còn dùng cho dữ liệu cũ — bản nháp được
             tạo TRƯỚC khi đổi cách giải nén và vẫn còn video trên đĩa. Giữ lại
             để những job đang dở dang không bị hỏng giữa chừng. */
          lessonsNeedingVideo.push({
            lessonId: newLesson.LessonID,
            lessonName: newLesson.LessonName,
            sourcePath: lesson.sourcePath,
            /* Tên tệp video gốc — giao diện dùng để KHỚP TỰ ĐỘNG khi giảng viên
               chọn một lượt nhiều tệp. Trình duyệt chỉ cho biết `file.name`
               nên phải so bằng tên tệp, không so bằng đường dẫn. */
            videoFileName: lesson.videoFileName || null,
            sizeBytes: lesson.sizeBytes ?? null,
            estimatedDurationSeconds: lesson.estimatedDurationSeconds ?? null,
            hasSubtitle: Boolean(lesson.subtitleAbsolutePath),
          });

          /* Phụ đề VẪN nằm trên máy chủ (tệp .srt chỉ vài KB nên được giải nén
             bình thường) và không phụ thuộc vào video. Đưa vào hàng đợi ngay
             với `videoPath: null` để nó được tải lên mà không phải chờ giảng
             viên gắn video — có thể họ chọn YouTube và không bao giờ tải video
             lên Cloudinary cả. */
          if (lesson.subtitleAbsolutePath) {
            pendingMedia.push({
              lessonId: newLesson.LessonID,
              lessonName: newLesson.LessonName,
              videoPath: null,
              subtitlePath: lesson.subtitleAbsolutePath,
              durationSeconds: null,
            });
          }
        }

        lessonOrder += 1;
        createdLessons += 1;
      }
    }

    if (createdSections === 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Bạn chưa chọn bài học nào để tạo khóa học.'
      );
    }

    await transaction.commit();
  } catch (error) {
    /* `rollback()` CÓ THỂ tự ném lỗi — SQL Server tự hủy transaction ở một số
       loại lỗi, và khi đó lệnh rollback báo "No transaction is active". Nếu
       không bọc lại, lỗi thứ hai này sẽ thay thế lỗi GỐC, và log chỉ còn một
       thông báo vô nghĩa trong khi nguyên nhân thật đã bị nuốt mất. */
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      logger.error(
        `[Import] Rollback thất bại cho job ${jobId}: ${rollbackError.message}`
      );
    }
    if (error instanceof ApiError) throw error;
    logger.error(`[Import] Lỗi khi tạo khóa học từ job ${jobId}:`, error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Không tạo được khóa học từ bản nháp. Vui lòng thử lại.'
    );
  }

  await importStore.patch(jobId, {
    status: importStore.ImportStatus.ACCEPTED,
    resultCourseId: courseId,
    statusMessage: 'Đã tạo khóa học nháp',
    mediaTotal: pendingMedia.length,
    mediaDone: 0,
    mediaStatus: pendingMedia.length > 0 ? 'QUEUED' : 'DONE',
    /* [SỬA 18/08/2026] Thông báo phải nói đúng thứ hàng đợi đang làm.
       Từ nay hàng đợi phần lớn chỉ tải PHỤ ĐỀ — video do trình duyệt gửi thẳng
       lên Cloudinary ở bước 4. Nói "đang tải video" khi thực ra chỉ tải vài tệp
       .srt sẽ khiến giảng viên ngồi đợi một việc đã xong từ lâu. */
    mediaMessage: (() => {
      if (pendingMedia.length === 0) {
        return lessonsNeedingVideo.length > 0
          ? `Đã tạo khóa học. Còn ${lessonsNeedingVideo.length} bài chờ bạn gắn video.`
          : 'Khóa học không có tệp media nào cần tải lên.';
      }
      const coVideo = pendingMedia.some((m) => m.videoPath);
      return coVideo ? 'Đang chờ tải video lên...' : 'Đang tải phụ đề lên...';
    })(),
  });

  logger.info(
    `[Import] Job ${jobId} → khóa học DRAFT #${courseId} ` +
      `(${createdSections} chương, ${createdLessons} bài, ${createdQuestions} câu hỏi) ` +
      `cho giảng viên ${user.id}.`
  );

  /* ★ Đưa video vào hàng đợi — CHỈ SAU KHI commit thành công.
     Nếu đưa vào trước, một lần rollback sẽ để lại job tải video cho những
     LessonID không bao giờ tồn tại.

     KHÔNG `await` việc xử lý, chỉ `await` việc XẾP HÀNG: tải vài chục video
     mất hàng chục phút, còn request của giảng viên phải trả lời ngay.

     Xếp hàng thất bại KHÔNG được làm hỏng cả lần nhập — khóa học đã tạo xong
     và hoàn toàn dùng được, chỉ là video phải tải thủ công. */
  if (pendingMedia.length > 0) {
    try {
      await addMediaUploadJob({
        jobId,
        courseId,
        accountId: user.id,
        items: pendingMedia,
      });
    } catch (error) {
      logger.error(`[Import] Không xếp được hàng đợi tải video cho job ${jobId}:`, error);
      await importStore
        .patch(jobId, {
          mediaStatus: 'FAILED',
          mediaMessage:
            'Không khởi động được việc tải video. Khóa học vẫn đã được tạo — ' +
            'bạn có thể tải video thủ công ở trang Sửa khóa học.',
        })
        .catch(() => {});
    }
  } else {
    /* Không có video nào → thư mục tạm hết giá trị, dọn ngay để trả lại đĩa.
       (Khi CÓ video thì worker tải xong mới dọn — xem mediaUpload.queue.js.) */
    await cleanupJobDir(jobId).catch(() => {});
  }

  return {
    courseId,
    totalSections: createdSections,
    totalLessons: createdLessons,
    totalQuestions: createdQuestions,
    /* Số video THỰC SỰ được xếp hàng, không phải tổng số video trong tệp ZIP.
       Trước đây trả `proposal.stats.videoCount` — sai khi giảng viên bỏ tick
       bớt: giao diện báo "đang tải 12 video" trong khi chỉ có 3 cái được chọn,
       và thanh tiến độ không bao giờ chạy hết. */
    videosPendingUpload: pendingMedia.filter((m) => m.videoPath).length,
    /* [THÊM 18/08/2026] Danh sách bài chờ gắn video — đầu vào cho bước 4 của
       giao diện. Rỗng nghĩa là khóa học không có bài video nào, hoặc video đã
       nằm sẵn trên máy chủ (bản nháp cũ). */
    lessonsNeedingVideo,
  };
};

module.exports = {
  createImportJob,
  getJobStatus,
  getProposal,
  listMyJobs,
  cancelJob,
  enrichProposal,
  generateQuiz,
  acceptProposal,
};
