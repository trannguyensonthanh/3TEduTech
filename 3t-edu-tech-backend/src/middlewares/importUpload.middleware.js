/* ============================================================================
 * importUpload.middleware.js
 * [THÊM 18/08/2026 — COURSE IMPORT, Giai đoạn A]
 *
 * ⚠️ VÌ SAO KHÔNG DÙNG LẠI upload.middleware.js CÓ SẴN
 *
 * File đó dùng `multer.memoryStorage()` — nạp TRỌN tệp vào RAM. Hợp lý với ảnh
 * 5MB, nhưng với tệp ZIP 200MB thì:
 *
 *   • Container backend có `mem_limit` thấp → OOM kill NGAY. Và OOM thì tiến
 *     trình bị hạ tức thì, KHÔNG kịp ghi một dòng log nào — nhìn từ ngoài chỉ
 *     thấy container tự khởi động lại mà không rõ lý do.
 *   • Hai người tải lên cùng lúc là gấp đôi.
 *
 * Ở đây dùng `diskStorage`: multer ghi thẳng ra đĩa theo luồng, bộ nhớ dùng
 * luôn ở mức vài chục KB bất kể tệp lớn cỡ nào.
 * ========================================================================== */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const httpStatus = require('http-status').status;

const ApiError = require('../core/errors/ApiError');
const config = require('../config');
const logger = require('../utils/logger');

/** Thư mục nhận tệp tải lên, trước khi giải nén. */
const uploadDir = () => path.join(config.import.tempDir, '_uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = uploadDir();
    fs.mkdir(dir, { recursive: true }, (err) => cb(err, dir));
  },
  filename: (req, file, cb) => {
    /* KHÔNG dùng tên gốc do người dùng đặt làm tên tệp trên đĩa.
       Tên đó có thể chứa '../', ký tự null, hoặc đơn giản là trùng với tệp của
       người khác. Sinh tên ngẫu nhiên; tên gốc vẫn được giữ riêng trong
       `req.body`/job data để hiển thị lại cho giảng viên. */
    const id = crypto.randomBytes(12).toString('hex');
    cb(null, `${id}.zip`);
  },
});

/** MIME type mà trình duyệt/hệ điều hành gán cho tệp .zip — không nhất quán. */
const ZIP_MIME_TYPES = new Set([
  'application/zip',
  'application/x-zip-compressed',
  'application/x-zip',
  'multipart/x-zip',
  'application/octet-stream', // Windows hay gửi cái này
]);

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();

  /* Kiểm tra CẢ phần mở rộng LẪN MIME type, và chấp nhận
     `application/octet-stream` — vì Windows thường gửi MIME đó cho .zip.
     Chỉ dựa vào MIME sẽ chặn oan rất nhiều người dùng thật.
     Đây mới là lớp lọc SƠ BỘ; lớp kiểm tra thật là chữ ký ZIP trong
     zipReader.readCentralDirectory(). */
  if (ext !== '.zip') {
    return cb(
      new ApiError(httpStatus.BAD_REQUEST, 'Chỉ chấp nhận tệp .zip.'),
      false
    );
  }
  if (file.mimetype && !ZIP_MIME_TYPES.has(file.mimetype)) {
    logger.debug(
      `[ImportUpload] MIME lạ cho tệp .zip: ${file.mimetype} — vẫn cho qua, sẽ kiểm tra chữ ký sau.`
    );
  }
  return cb(null, true);
};

const uploadZip = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.import.maxZipBytes,
    files: 1,
  },
});

/** Dọn tệp tải lên khi request lỗi giữa chừng — tránh rác tích tụ trên đĩa. */
const cleanupUploadedFile = (req) => {
  if (req.file?.path) {
    fs.rm(req.file.path, { force: true }, () => {});
  }
};

const handleImportUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    cleanupUploadedFile(req);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(
        new ApiError(
          httpStatus.BAD_REQUEST,
          `Tệp quá lớn. Kích thước tối đa là ${Math.round(config.import.maxZipBytes / 1024 / 1024)}MB.`
        )
      );
    }
    return next(new ApiError(httpStatus.BAD_REQUEST, 'Lỗi khi tải tệp lên.'));
  }
  if (err) {
    cleanupUploadedFile(req);
    return next(err);
  }
  return next();
};

module.exports = {
  uploadZip,
  handleImportUploadError,
  cleanupUploadedFile,
  uploadDir,
};
