// File: src/api/imports/imports.controller.js
// [THÊM 18/08/2026 — COURSE IMPORT, Giai đoạn A]

/* Cần CẢ HAI biến thể: `fs.createReadStream` chỉ có ở API đồng bộ, còn
   `stat` thì dùng bản promise cho gọn với async/await. */
const fs = require('fs');
const fsp = require('fs/promises');
const httpStatus = require('http-status').status;
const importService = require('./imports.service');
const { catchAsync } = require('../../utils/catchAsync');
const config = require('../../config');
/* ⚠️ Require Ở ĐÂY chứ KHÔNG phải trong src/config/index.js.
   Tôi đã thử đặt trong config và nó tạo ra một VÒNG PHỤ THUỘC thật:

       config → utils/mediaProbe → utils/logger → config

   Node trả về đối tượng exports còn đang dựng dở khi gặp vòng, nên `logger`
   đọc `config.env` ra `undefined` ngay lúc khởi tạo — và nó im lặng ghi log
   sai định dạng ở production. Node có cảnh báo ("Accessing non-existent
   property 'env' of module exports inside circular dependency") nhưng lẫn
   giữa hàng trăm dòng log khởi động thì không ai thấy.

   Controller không nằm trong vòng nào cả, nên đặt ở đây là an toàn. */
const { VIDEO_EXTENSIONS } = require('../../utils/mediaProbe');

/* ============================================================================
 * GET /v1/imports/limits
 * [THÊM 18/08/2026]
 *
 * ★ VÌ SAO CẦN ENDPOINT NÀY
 *
 * Trước đây giao diện KHÔNG biết giới hạn nào cả: giảng viên chọn tệp 1.62GB,
 * trình duyệt lặng lẽ bắt đầu tải, và chỉ sau vài phút mới nhận về "Tệp quá
 * lớn, tối đa 120MB". Vài phút chờ đợi đó hoàn toàn vô ích.
 *
 * Ghi cứng con số ở phía giao diện cũng không xong: giới hạn khác nhau giữa dev
 * và production, và được đặt trong docker-compose. Ghi cứng là chắc chắn có
 * ngày lệch mà không ai nhận ra.
 *
 * ⚠️ Endpoint này chỉ trả về hằng số cấu hình, không đọc dữ liệu của ai. Vẫn
 *    đặt sau `authenticate` để không lộ cấu hình hạ tầng ra ngoài Internet.
 * ========================================================================== */
const getLimits = catchAsync(async (req, res) => {
  res.status(httpStatus.OK).send({
    maxZipMb: Math.round(config.import.maxZipBytes / 1024 / 1024),
    maxTotalMb: Math.round(config.import.maxTotalBytes / 1024 / 1024),
    maxFileMb: Math.round(config.import.maxFileBytes / 1024 / 1024),
    maxFiles: config.import.maxFiles,
    /* Trần của Cloudinary gói miễn phí cho MỘT tệp video. Đây là giới hạn của
       bên thứ ba chứ không phải của hệ thống ta — nhưng giảng viên cần biết
       TRƯỚC khi chọn tệp, nên để chung với các giới hạn khác. */
    maxVideoUploadMb: config.import.maxVideoUploadMb,
    /* Phần mở rộng video mà hệ thống nhận ra. Giao diện dùng để lọc tệp ở bước
       4 — đọc từ máy chủ để hai bên không bao giờ hiểu khác nhau về "thế nào
       là một tệp video". */
    /* `Set` không JSON hóa được (JSON.stringify(new Set()) ra `{}`) — phải
       trải thành mảng. */
    videoExtensions: [...VIDEO_EXTENSIONS],
  });
});

/** POST /v1/imports — tải tệp .zip lên, tạo job xử lý nền. */
const createImport = catchAsync(async (req, res) => {
  const job = await importService.createImportJob(req.user, req.file);
  res.status(httpStatus.ACCEPTED).send(job);
});

/** GET /v1/imports — danh sách các lần nhập của tôi. */
const listImports = catchAsync(async (req, res) => {
  const jobs = await importService.listMyJobs(req.user);
  res.status(httpStatus.OK).send({ jobs, total: jobs.length });
});

/**
 * GET /v1/imports/:jobId — trạng thái + tiến độ.
 *
 * Đây là đường DỰ PHÒNG cho SSE: nếu kênh SSE bị chặn (proxy công ty, tiện ích
 * trình duyệt), giao diện vẫn hỏi trạng thái theo chu kỳ được.
 */
const getImportStatus = catchAsync(async (req, res) => {
  const job = await importService.getJobStatus(req.user, req.params.jobId);
  res.status(httpStatus.OK).send(job);
});

/** GET /v1/imports/:jobId/proposal — bản nháp đầy đủ để hiển thị màn hình duyệt. */
const getProposal = catchAsync(async (req, res) => {
  const proposal = await importService.getProposal(req.user, req.params.jobId);
  res.status(httpStatus.OK).send(proposal);
});

/**
 * POST /v1/imports/:jobId/enrich — nhờ AI viết mô tả cho bản nháp.
 *
 * KHÔNG ghi gì vào CSDL. Chỉ điền mô tả vào bản nháp trên Redis rồi trả về để
 * giảng viên xem, sửa, hoặc bỏ qua.
 */
const enrichImport = catchAsync(async (req, res) => {
  const result = await importService.enrichProposal(req.user, req.params.jobId);
  res.status(httpStatus.OK).send(result);
});

/**
 * POST /v1/imports/:jobId/quiz — nhờ AI soạn câu hỏi trắc nghiệm.
 *
 * KHÔNG ghi gì vào CSDL. Câu hỏi nằm trong bản nháp trên Redis cho tới khi
 * giảng viên tạo khóa học với tùy chọn `includeQuiz`.
 */
const generateQuiz = catchAsync(async (req, res) => {
  const result = await importService.generateQuiz(
    req.user,
    req.params.jobId,
    req.body?.questionsPerLesson,
    req.body?.difficulty
  );
  res.status(httpStatus.OK).send(result);
});

/**
 * PUT /v1/imports/:jobId/quiz — lưu câu hỏi giảng viên đã sửa.
 *
 * [THÊM 20/08/2026] Trước đây câu hỏi do AI soạn là chỉ đọc: sai một chữ cũng
 * phải soạn lại toàn bộ đề (đốt thêm một lượt gọi mô hình và mất cả những câu
 * đang tốt) hoặc bỏ hết rồi gõ lại trong trang Sửa khóa học.
 */
const saveQuiz = catchAsync(async (req, res) => {
  const result = await importService.saveQuizEdits(
    req.user,
    req.params.jobId,
    req.body
  );
  res.status(httpStatus.OK).send(result);
});

/**
 * GET /v1/imports/:jobId/preview?path=... — phát một tệp trong bản nháp.
 *
 * [THÊM 20/08/2026] Để giảng viên XEM video (và ảnh bìa) trước khi bấm tạo
 * khóa học. Tệp đã nằm trên đĩa máy chủ sau khi giải nén nhưng chưa lên
 * Cloudinary, nên không có URL công khai nào trỏ tới nó.
 *
 * ── VÌ SAO PHẢI HỖ TRỢ HTTP RANGE ────────────────────────────────────────
 * Không có nó, thẻ <video> phải tải TRỌN tệp trước khi phát được khung hình
 * đầu tiên, và thanh tua kéo đi đâu cũng không nhảy được. Với video bài giảng
 * hàng trăm MB thì đó là không dùng được. Trình duyệt gửi `Range: bytes=0-` cho
 * yêu cầu đầu tiên và chỉ chấp nhận tua khi máy chủ đáp `Accept-Ranges: bytes`.
 *
 * Ba hàng rào an toàn nằm ở tầng service (`resolvePreviewFile`): kiểm quyền sở
 * hữu, tra đường dẫn tuyệt đối TỪ BẢN NHÁP chứ không từ tham số client, và
 * kiểm tra đường dẫn nằm trong thư mục của job.
 */
const previewFile = catchAsync(async (req, res) => {
  const { absolutePath, mimeType, fileName } =
    await importService.resolvePreviewFile(
      req.user,
      req.params.jobId,
      req.query.path
    );

  const stat = await fsp.stat(absolutePath);
  const total = stat.size;

  /* `Content-Disposition: inline` + tên tệp đã mã hóa: trình duyệt hiển thị
     tại chỗ với các kiểu nó hiểu, và tải xuống với kiểu octet-stream. */
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader(
    'Content-Disposition',
    `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`
  );
  /* Nội dung riêng tư của một bản nháp — không cho proxy hay CDN nào giữ lại. */
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const range = req.headers.range;
  if (!range) {
    res.setHeader('Content-Length', total);
    fs.createReadStream(absolutePath).pipe(res);
    return;
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match) {
    res.status(416).setHeader('Content-Range', `bytes */${total}`).end();
    return;
  }

  let start = match[1] ? parseInt(match[1], 10) : 0;
  let end = match[2] ? parseInt(match[2], 10) : total - 1;

  if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= total) {
    res.status(416).setHeader('Content-Range', `bytes */${total}`).end();
    return;
  }
  if (end >= total) end = total - 1;

  res.status(206);
  res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
  res.setHeader('Content-Length', end - start + 1);
  fs.createReadStream(absolutePath, { start, end }).pipe(res);
});

/** POST /v1/imports/:jobId/accept — tạo khóa học DRAFT từ bản nháp. */
const acceptImport = catchAsync(async (req, res) => {
  const result = await importService.acceptProposal(
    req.user,
    req.params.jobId,
    req.body
  );
  res.status(httpStatus.CREATED).send(result);
});

/** DELETE /v1/imports/:jobId — hủy, xóa sạch thư mục tạm. */
const cancelImport = catchAsync(async (req, res) => {
  const result = await importService.cancelJob(req.user, req.params.jobId);
  res.status(httpStatus.OK).send(result);
});

module.exports = {
  getLimits,
  createImport,
  listImports,
  getImportStatus,
  getProposal,
  enrichImport,
  generateQuiz,
  saveQuiz,
  previewFile,
  acceptImport,
  cancelImport,
};
