/* ============================================================================
 * importCleanupJob.js
 * [THÊM 18/08/2026 — COURSE IMPORT, Giai đoạn A]
 *
 * Dọn thư mục tạm của các lần nhập đã quá hạn.
 *
 * ----------------------------------------------------------------------------
 * VÌ SAO BẮT BUỘC PHẢI CÓ
 *
 * Trạng thái job nằm trên Redis và TTL tự dọn giúp. Nhưng FILE trên đĩa thì
 * không có TTL — không dọn thì chúng nằm đó vĩnh viễn. Với ổ đĩa đang chật của
 * bạn, vài lần thử nghiệm là đủ làm đầy ổ, và khi đó KHÔNG chỉ tính năng này
 * hỏng mà cả backend cũng không ghi nổi log.
 *
 * Đây chính là cái giá của việc chọn Redis thay vì bảng SQL: đổi lại việc
 * không phải viết migration, ta phải tự lo phần dọn đĩa. Đánh đổi vẫn có lợi,
 * nhưng KHÔNG được quên vế này.
 * ========================================================================== */

const cron = require('node-cron');
const fs = require('fs/promises');
const path = require('path');

const config = require('../config');
const logger = require('../utils/logger');

/** Thư mục có tên bắt đầu bằng '_' là thư mục hệ thống (vd `_uploads`). */
const isSystemDir = (name) => name.startsWith('_');

/**
 * Xóa mọi thư mục job quá hạn.
 *
 * Dựa vào THỜI GIAN SỬA ĐỔI của thư mục, không dựa vào Redis. Lý do: nếu Redis
 * bị xóa thì bản ghi job biến mất nhưng file vẫn còn — và đó chính là lúc cần
 * dọn nhất. Dùng mtime khiến việc dọn dẹp độc lập hoàn toàn với Redis.
 */
const cleanupExpiredImports = async () => {
  const root = config.import.tempDir;
  const maxAgeMs = config.import.ttlHours * 3600 * 1000;
  const now = Date.now();

  let removed = 0;
  let freedBytes = 0;

  try {
    const entries = await fs.readdir(root, { withFileTypes: true });

    for (const entry of entries) {
      const full = path.join(root, entry.name);

      try {
        const stat = await fs.stat(full);
        const age = now - stat.mtimeMs;
        if (age < maxAgeMs) continue;

        if (entry.isDirectory() && !isSystemDir(entry.name)) {
          freedBytes += await estimateDirSize(full);
          await fs.rm(full, { recursive: true, force: true });
          removed += 1;
        } else if (entry.isFile()) {
          // Tệp .zip mồ côi trong `_uploads` (request lỗi giữa chừng).
          freedBytes += stat.size;
          await fs.rm(full, { force: true });
          removed += 1;
        }
      } catch (error) {
        logger.warn(`[ImportCleanup] Không xử lý được ${entry.name}: ${error.message}`);
      }
    }

    // Dọn riêng bên trong `_uploads` — thư mục này không bao giờ bị xóa nhưng
    // các tệp .zip mồ côi bên trong thì có.
    const uploadsDir = path.join(root, '_uploads');
    try {
      const uploads = await fs.readdir(uploadsDir, { withFileTypes: true });
      for (const f of uploads) {
        if (!f.isFile()) continue;
        const full = path.join(uploadsDir, f.name);
        const stat = await fs.stat(full);
        if (now - stat.mtimeMs >= maxAgeMs) {
          freedBytes += stat.size;
          await fs.rm(full, { force: true });
          removed += 1;
        }
      }
    } catch {
      // `_uploads` chưa tồn tại — bình thường khi chưa ai tải tệp nào.
    }

    if (removed > 0) {
      logger.info(
        `[ImportCleanup] Đã dọn ${removed} mục quá hạn, giải phóng ~${Math.round(freedBytes / 1024 / 1024)}MB.`
      );
    }
  } catch (error) {
    if (error.code === 'ENOENT') return; // thư mục gốc chưa tồn tại
    logger.error('[ImportCleanup] Lỗi khi dọn thư mục tạm:', error);
  }
};

/** Ước tính dung lượng một thư mục — chỉ để ghi log, không cần chính xác tuyệt đối. */
const estimateDirSize = async (dir) => {
  let total = 0;
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) total += await estimateDirSize(full);
      else {
        const st = await fs.stat(full).catch(() => null);
        if (st) total += st.size;
      }
    }
  } catch {
    // Bỏ qua — đây chỉ là số liệu cho log.
  }
  return total;
};

const scheduleImportCleanup = () => {
  // Mỗi giờ một lần. Đủ thường xuyên để đĩa không phình, đủ thưa để không tốn
  // I/O vô ích (job thường rỗng).
  const schedule = process.env.IMPORT_CLEANUP_CRON || '15 * * * *';
  if (!cron.validate(schedule)) {
    logger.error(`[ImportCleanup] Biểu thức cron không hợp lệ: ${schedule}`);
    return;
  }
  cron.schedule(schedule, () => {
    cleanupImportsSafely();
  });

  // Chạy một lần lúc khởi động: sau khi container restart, rác từ phiên trước
  // vẫn còn nằm đó.
  setTimeout(() => cleanupImportsSafely(), 30000);

  logger.info(`[ImportCleanup] Đã lên lịch dọn thư mục tạm (${schedule}).`);
};

/** Bọc để lỗi trong cron không bao giờ thành unhandled rejection. */
const cleanupImportsSafely = () => {
  cleanupExpiredImports().catch((error) =>
    logger.error('[ImportCleanup] Lỗi ngoài dự kiến:', error)
  );
};

module.exports = {
  scheduleImportCleanup,
  cleanupExpiredImports,
};
