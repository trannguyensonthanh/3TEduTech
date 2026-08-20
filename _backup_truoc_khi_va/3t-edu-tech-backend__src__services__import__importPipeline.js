/* ============================================================================
 * importPipeline.js
 * [THÊM 18/08/2026 — COURSE IMPORT, Giai đoạn A]
 *
 * Điều phối toàn bộ quá trình xử lý một tệp ZIP.
 *
 * ----------------------------------------------------------------------------
 * VÌ SAO BACKEND ĐIỀU PHỐI CHỨ KHÔNG PHẢI AI SERVICE
 *
 * AI Service nằm trên GPU EC2 #2 và VỀ MẶT VẬT LÝ không kết nối được tới RDS
 * (Security Group `sg-rds` chỉ mở cổng 1433 cho `sg-cpu-ec2`). Đó là thiết kế
 * đúng, không nên nới ra. Vì vậy Backend giữ TOÀN BỘ trạng thái, còn AI Service
 * chỉ là các endpoint stateless nhận-vào-trả-ra.
 *
 * ----------------------------------------------------------------------------
 * GIAI ĐOẠN A — KHÔNG GỌI LLM
 *
 * Đường ống này chạy trọn vẹn mà không cần một token nào:
 *   giải nén → phân loại → đọc thời lượng → bóc text → suy cấu trúc
 * Bước bóc text có gọi sang AI Service, nhưng đó là thư viện đọc tài liệu
 * (PyMuPDF/python-docx), KHÔNG phải mô hình ngôn ngữ.
 *
 * Giai đoạn B sẽ chèn thêm bước "làm giàu bằng LLM" vào SAU bước suy cấu trúc.
 * ========================================================================== */

const fs = require('fs/promises');
const path = require('path');

const { safeExtract, ImportRejectedError } = require('./safeExtract');
const { classifyAll, FileKind } = require('./fileClassifier');
const { analyzeTree } = require('./treeAnalyzer');
const { extractForProposal, readPlainText, sanitizeText } = require('./textExtractor');
const {
  getVideoDurationSeconds,
  estimateDurationFromSize,
  VIDEO_EXTENSIONS,
} = require('../../utils/mediaProbe');
const importStore = require('./importStore');
const config = require('../../config');
const logger = require('../../utils/logger');

/**
 * Trọng số tiến độ của từng bước (tổng = 100).
 *
 * Đặt theo THỜI GIAN THỰC TẾ chứ không chia đều: bóc text là bước lâu nhất
 * (mỗi PDF là một lượt gọi mạng), nên nó chiếm phần lớn thanh tiến độ. Chia
 * đều sẽ khiến thanh nhảy tới 80% trong 2 giây rồi đứng im 3 phút — trải
 * nghiệm tệ hơn hẳn so với việc bò đều.
 */
const STEP_WEIGHTS = {
  extract: 20,
  classify: 5,
  probe: 10,
  text: 55,
  analyze: 10,
};

/** Thư mục làm việc của một job. */
const jobDir = (jobId) => path.join(config.import.tempDir, String(jobId));

/**
 * Dọn sạch thư mục tạm của một job.
 * Luôn bọc try/catch: dọn dẹp thất bại KHÔNG được che mất lỗi nghiệp vụ gốc.
 */
const cleanupJobDir = async (jobId) => {
  try {
    await fs.rm(jobDir(jobId), { recursive: true, force: true });
    logger.info(`[Import] Đã dọn thư mục tạm của job ${jobId}.`);
  } catch (error) {
    logger.warn(`[Import] Không dọn được thư mục job ${jobId}: ${error.message}`);
  }
};

/**
 * Đọc siêu dữ liệu do giảng viên cung cấp (_khoa-hoc.md, _chuong.md).
 *
 * Đây là nội dung do CON NGƯỜI viết nên được ưu tiên hơn mọi thứ AI sinh ra
 * ở Giai đoạn B — giảng viên đã bỏ công viết thì không có lý do gì để AI ghi đè.
 */
const readMetadataFiles = async (proposal, files) => {
  const byPath = new Map(files.map((f) => [f.relativePath, f]));

  if (proposal.courseMetaPath) {
    const meta = byPath.get(proposal.courseMetaPath);
    if (meta) {
      const raw = await readPlainText(meta.absolutePath).catch(() => '');
      proposal.courseDescription = sanitizeText(raw, 8000) || null;
      proposal.courseDescriptionSource = 'file';
    }
  }

  for (const section of proposal.sections) {
    if (!section.description?.fromFile) continue;
    const meta = byPath.get(section.description.fromFile);
    if (!meta) {
      section.description = null;
      continue;
    }
    const raw = await readPlainText(meta.absolutePath).catch(() => '');
    section.description = sanitizeText(raw, 4000) || null;
    section.descriptionSource = 'file';
  }
};

/**
 * Đọc thời lượng cho mọi bài học video.
 *
 * Dùng bộ phân tích MP4 tự viết (utils/mediaProbe) — không cần ffmpeg, giữ ảnh
 * Docker gọn. Định dạng không đọc được (.mkv/.webm/.avi) sẽ để `null` và chỉ
 * có `estimatedDurationSeconds` để ước tính thời gian tạo phụ đề.
 */
const probeVideos = async (proposal, onProgress) => {
  const videos = [];
  for (const section of proposal.sections) {
    for (const lesson of section.lessons) {
      if (lesson.fileKind === FileKind.VIDEO) videos.push(lesson);
    }
  }

  let done = 0;
  let exact = 0;

  for (const lesson of videos) {
    /* [THÊM 18/08/2026] Video không còn nằm trên đĩa nên không đọc được thời
       lượng thật. Ước tính theo kích thước tệp CHỈ để hiển thị — cùng cách xử
       lý với .mkv/.webm vốn đã không đọc được từ trước.

       Thời lượng CHÍNH XÁC sẽ có sau: Cloudinary trả về `duration` khi giảng
       viên tải video lên ở bước 4 (xem `confirmLessonVideoUpload`), và YouTube
       thì tự quản lý. Nên `VideoDurationSeconds` trong CSDL vẫn được điền đúng,
       chỉ là muộn hơn một bước. */
    if (!lesson.absolutePath) {
      lesson.estimatedDurationSeconds = estimateDurationFromSize(lesson.sizeBytes);
      lesson.durationSource = 'estimated';
      lesson.needsVideo = true;
      done += 1;
      if (onProgress) onProgress(done, videos.length);
      continue;
    }

    const seconds = await getVideoDurationSeconds(lesson.absolutePath);
    if (seconds !== null) {
      lesson.durationSeconds = seconds;
      lesson.durationSource = 'container';
      exact += 1;
    } else {
      // Ước tính CHỈ để hiển thị thời gian tạo phụ đề.
      // Cố ý KHÔNG ghi vào `durationSeconds` — thà để cột VideoDurationSeconds
      // trống còn hơn ghi một con số sai vào cơ sở dữ liệu.
      lesson.estimatedDurationSeconds = estimateDurationFromSize(lesson.sizeBytes);
      lesson.durationSource = 'estimated';
    }
    done += 1;
    if (onProgress) onProgress(done, videos.length);
  }

  return { total: videos.length, exact };
};

/** Ảnh bìa: ảnh đầu tiên tìm thấy ở thư mục gốc (nếu có). */
const pickCoverImage = (files) => {
  const images = files.filter((f) => f.kind === FileKind.IMAGE);
  if (images.length === 0) return null;

  // Ưu tiên ảnh có tên gợi ý là ảnh bìa.
  const preferred = images.find((f) =>
    /(cover|thumb|bia|banner|poster)/i.test(f.baseName)
  );
  const chosen = preferred || images[0];
  return { relativePath: chosen.relativePath, absolutePath: chosen.absolutePath };
};

/**
 * ★ HÀM CHÍNH — chạy toàn bộ đường ống.
 *
 * @param {object} params
 * @param {string} params.jobId
 * @param {string} params.zipPath - đường dẫn tệp .zip đã tải lên
 * @param {string} params.zipFileName - tên gốc do người dùng đặt
 * @param {function} params.onProgress - (percent, message)
 * @returns {Promise<object>} bản nháp đề xuất
 */
const runPipeline = async ({ jobId, zipPath, zipFileName, onProgress }) => {
  const dest = path.join(jobDir(jobId), 'extracted');
  const report = (percent, message) => onProgress && onProgress(percent, message);

  let base = 0;

  // ---------- 1. Giải nén an toàn ----------
  report(1, 'Đang giải nén tệp...');
  const extraction = await safeExtract(
    zipPath,
    dest,
    {
      maxFiles: config.import.maxFiles,
      maxTotalBytes: config.import.maxTotalBytes,
      maxFileBytes: config.import.maxFileBytes,
      /* [THÊM 18/08/2026] Video chỉ được đọc TÊN và KÍCH THƯỚC từ thư mục
         trung tâm của ZIP, không ghi nội dung ra đĩa.

         Lấy danh sách phần mở rộng từ `mediaProbe` — cùng một nguồn mà
         `fileClassifier` dùng để quyết định "đây có phải video không". Hai nơi
         đọc chung một hằng số thì không thể lệch nhau; chép lại danh sách ở
         đây là tạo ra một bản sao chắc chắn sẽ trôi dạt theo thời gian. */
      skipContentExtensions: VIDEO_EXTENSIONS,
    },
    (done, total) =>
      report(
        base + (STEP_WEIGHTS.extract * done) / total,
        `Đang giải nén ${done}/${total} tệp...`
      )
  );
  base += STEP_WEIGHTS.extract;

  /* Xóa tệp .zip gốc NGAY sau khi giải nén xong.
     Với ổ đĩa đang chật, giữ cả bản nén lẫn bản giải nén là lãng phí gấp đôi —
     và bản nén không còn tác dụng gì nữa. */
  await fs.rm(zipPath, { force: true }).catch(() => {});

  // ---------- 2. Phân loại ----------
  report(base, 'Đang nhận diện loại tệp...');
  const classified = await classifyAll(extraction.files);
  base += STEP_WEIGHTS.classify;

  // ---------- 3. Suy cấu trúc (Tier 0 — 0 token) ----------
  report(base, 'Đang phân tích cấu trúc khóa học...');
  const proposal = analyzeTree(classified, { zipFileName });

  if (proposal.stats.totalLessons === 0) {
    throw new ImportRejectedError(
      'Không tìm thấy tài liệu nào có thể dùng làm bài học trong tệp ZIP. ' +
        'Hệ thống hỗ trợ: PDF, DOCX, PPTX, MP4, MD, TXT và tệp mã nguồn.',
      'NO_LESSONS'
    );
  }
  base += STEP_WEIGHTS.analyze;

  // ---------- 4. Đọc thời lượng video ----------
  report(base, 'Đang đọc thông tin video...');
  const videoStats = await probeVideos(proposal, (done, total) =>
    report(
      base + (STEP_WEIGHTS.probe * done) / total,
      `Đang đọc video ${done}/${total}...`
    )
  );
  base += STEP_WEIGHTS.probe;

  // ---------- 5. Bóc text (bước lâu nhất) ----------
  report(base, 'Đang đọc nội dung tài liệu...');
  const textStats = await extractForProposal(proposal, classified, (done, total) =>
    report(
      base + (STEP_WEIGHTS.text * done) / total,
      `Đang đọc nội dung ${done}/${total} tệp...`
    )
  );
  base += STEP_WEIGHTS.text;

  // ---------- 6. Siêu dữ liệu + ảnh bìa ----------
  await readMetadataFiles(proposal, classified);
  proposal.coverImage = pickCoverImage(classified);

  // ---------- 7. Tổng hợp ----------
  proposal.aiEnriched = false; // Giai đoạn B sẽ bật cờ này
  proposal.warnings = [];

  if (extraction.encodingWarnings > 0) {
    proposal.warnings.push({
      code: 'ENCODING',
      message:
        `${extraction.encodingWarnings} tệp có tên không đọc được chính xác (bảng mã cũ). ` +
        'Bạn nên kiểm tra và sửa lại tên các bài học bên dưới.',
    });
  }
  if (proposal.needsAiGrouping) {
    proposal.warnings.push({
      code: 'LOW_CONFIDENCE',
      message:
        `Cấu trúc thư mục chưa rõ ràng (độ tin cậy ${proposal.confidence}). ` +
        'Bạn nên kiểm tra kỹ thứ tự chương/bài bên dưới.',
    });
  }
  if (textStats.failures > 0) {
    proposal.warnings.push({
      code: 'EXTRACT_FAILED',
      message: `${textStats.failures} tệp không đọc được nội dung. Bài học vẫn được tạo nhưng chưa có mô tả.`,
    });
  }

  proposal.processStats = {
    filesExtracted: extraction.files.length,
    filesSkipped: extraction.skipped.length,
    totalBytes: extraction.totalBytes,
    videosTotal: videoStats.total,
    videosWithExactDuration: videoStats.exact,
    documentsParsed: textStats.total,
    aiServiceCalls: textStats.aiCalls,
    // ★ Số lời gọi LLM — Giai đoạn A luôn bằng 0. Đây là dữ liệu cho "đồng hồ
    // tiết kiệm token" ở Giai đoạn C.
    llmCalls: 0,
    tokensUsed: 0,
  };
  proposal.skippedFiles = extraction.skipped.slice(0, 50);

  report(100, 'Hoàn tất');
  logger.info(
    `[Import] Job ${jobId}: ${proposal.stats.totalSections} chương, ` +
      `${proposal.stats.totalLessons} bài, tin cậy ${proposal.confidence}, ` +
      `phụ đề khớp ${proposal.stats.subtitleMatched}/${videoStats.total}.`
  );

  return proposal;
};

module.exports = {
  runPipeline,
  cleanupJobDir,
  jobDir,
  STEP_WEIGHTS,
};
