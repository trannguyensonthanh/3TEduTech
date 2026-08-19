// Load environment variables from .env file
require('dotenv').config();

const app = require('./src/app');
const logger = require('./src/utils/logger');
const { connectDB, closeDB } = require('./src/database/connection');
const {
  schedulePendingOrderCancellation,
} = require('./src/jobs/pendingOrderCanceller');
const {
  scheduleExchangeRateUpdate,
} = require('./src/jobs/exchangeRateUpdater');
const {
  scheduleProgressReminders,
} = require('./src/jobs/progressReminderJob');
const {
  startCourseSyncWorker,
  closeCourseSyncQueue,
} = require('./src/queues/courseSync.queue');
const { syncInitialDataToAi } = require('./src/services/aiSync.service');
// [THÊM 17/08/2026 — LEVEL 2, mục 2.3] Lớp realtime hai chiều (Socket.IO).
const {
  initSocketServer,
  closeSocketServer,
} = require('./src/services/socket.service');

// [THÊM 18/08/2026 — COURSE IMPORT] Worker xử lý ZIP + cron dọn thư mục tạm.
const {
  startImportWorker,
  closeImportQueue,
} = require('./src/queues/import.queue');
const {
  scheduleImportCleanup,
} = require('./src/jobs/importCleanupJob');
// [THÊM 18/08/2026 — COURSE IMPORT, Giai đoạn C] Tải video lên Cloudinary sau
// khi giảng viên chấp nhận bản nháp.
const {
  startMediaUploadWorker,
  closeMediaUploadQueue,
} = require('./src/queues/mediaUpload.queue');

const PORT = process.env.PORT || 5000;

let server;

/* ============================================================================
 * [SỬA 18/08/2026] KHỞI ĐỘNG TÁC VỤ NỀN — TỪNG BƯỚC ĐƯỢC BẢO VỆ RIÊNG
 *
 * ★ VÌ SAO PHẢI SỬA
 *
 * Trước đây bảy lệnh khởi động nằm trần trong callback của `app.listen`. Một
 * lệnh ném lỗi là TOÀN BỘ các lệnh sau nó không bao giờ chạy — và vì
 * `uncaughtException` chỉ ghi log rồi đi tiếp, server vẫn "lên" bình thường.
 *
 * Hậu quả thật đã xảy ra: `scheduleExchangeRateUpdate()` ném lỗi, kéo theo
 * `startImportWorker()` và `startMediaUploadWorker()` không bao giờ chạy. Nhìn
 * từ ngoài, hệ thống hoàn toàn khỏe mạnh — cho tới lúc tải tệp ZIP lên và job
 * nằm mãi ở trạng thái PENDING mà không ai xử lý.
 *
 * ★ VÌ SAO STACK TRACE PHẢI NHÉT VÀO CHUỖI MESSAGE
 *
 * Định dạng winston của dự án là:
 *     printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
 *
 * Nó CHỈ in `info.message`. Mọi thứ truyền vào tham số thứ hai
 * (`logger.error('abc', err)`) rơi vào `splat` và KHÔNG BAO GIỜ được in ra.
 * Đó chính là lý do dòng log duy nhất nhìn thấy được là "Unhandled Error:"
 * trống trơn — nguyên nhân thật đã bị chính bộ ghi log nuốt mất.
 * ========================================================================== */

/** Chạy một bước khởi động; lỗi ở bước này KHÔNG được làm hỏng các bước khác. */
const runStep = (name, fn) => {
  try {
    fn();
    return true;
  } catch (error) {
    logger.error(
      `[Khởi động] Bước "${name}" THẤT BẠI (các bước còn lại vẫn tiếp tục): ` +
        `${(error && error.stack) || error}`
    );
    return false;
  }
};

const startBackgroundJobs = () => {
  const steps = [
    ['Hủy đơn hàng quá hạn', schedulePendingOrderCancellation],
    ['Cập nhật tỷ giá', scheduleExchangeRateUpdate],
    ['Nhắc nhở tiến độ học', scheduleProgressReminders],
    ['Worker đồng bộ khóa học sang AI', startCourseSyncWorker],
    // 📥 Nhập khóa học từ ZIP (concurrency = 1 — xem import.queue.js)
    ['Worker nhập khóa học từ ZIP', startImportWorker],
    // 🎬 Tải video của khóa học vừa nhập lên Cloudinary
    ['Worker tải video lên Cloudinary', startMediaUploadWorker],
    // 🧹 BẮT BUỘC phải có: tệp trên đĩa không tự hết hạn như khóa Redis,
    //    không dọn thì ổ đĩa đầy dần cho tới khi hỏng.
    ['Cron dọn thư mục tạm', scheduleImportCleanup],
  ];

  const failed = steps.filter(([name, fn]) => !runStep(name, fn)).map(([n]) => n);

  if (failed.length === 0) {
    logger.info(`[Khởi động] ${steps.length}/${steps.length} tác vụ nền đã chạy.`);
  } else {
    logger.warn(
      `[Khởi động] ${steps.length - failed.length}/${steps.length} tác vụ nền chạy được. ` +
        `THẤT BẠI: ${failed.join(', ')}`
    );
  }

  // 🤖 Đồng bộ dữ liệu Khóa học sang AI RAG Vector Store.
  // Bọc catch riêng vì đây là lệnh BẤT ĐỒNG BỘ — `runStep` chỉ bắt được lỗi
  // đồng bộ, một promise bị từ chối sẽ lọt qua nó.
  setTimeout(() => {
    Promise.resolve()
      .then(() => syncInitialDataToAi())
      .catch((error) =>
        logger.error(
          `[Khởi động] Đồng bộ dữ liệu ban đầu sang AI thất bại: ${(error && error.stack) || error}`
        )
      );
  }, 3000);
};

const startServer = async () => {
  try {
    await connectDB();
    logger.info('Database connected successfully!');

    server = app.listen(PORT, () => {
      logger.info(`Server listening on port ${PORT}`);

      /* [THÊM 17/08/2026 — LEVEL 2] Gắn Socket.IO vào ĐÚNG HTTP server này.
         Socket.IO không tự mở cổng riêng — nó chia sẻ cổng với Express và tự
         tách các request có đường dẫn /socket.io ra xử lý. Nhờ vậy không phải
         mở thêm cổng ở Security Group của EC2, cũng không phải thêm upstream
         mới trong Nginx.

         Hàm này KHÔNG ném lỗi khi chưa cài gói `socket.io` — nó chỉ ghi cảnh
         báo rồi trả về null, nên server vẫn khởi động bình thường. */
      initSocketServer(server);

      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Access API at: http://localhost:${PORT}`);
      if (process.env.NODE_ENV !== 'test') {
        startBackgroundJobs();
      }
    });
  } catch (error) {
    logger.error('Failed to connect to the database or start server:', error);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  logger.info(`${signal} received. Closing http server...`);
  // Graceful shutdown: đóng Worker và Queue trước khi tắt server
  try {
    await closeCourseSyncQueue();
  } catch (err) {
    logger.error('Error closing course sync queue:', err);
  }
  // Đóng Socket.IO TRƯỚC server.close(). Nếu không, các kết nối WebSocket đang
  // mở sẽ giữ HTTP server sống mãi và callback của server.close() không bao giờ
  // chạy — container treo cho tới khi Docker buộc phải SIGKILL.
  try {
    await closeSocketServer();
  } catch (err) {
    logger.error('Error closing socket server:', err);
  }
  try {
    await closeImportQueue();
  } catch (err) {
    logger.error('Error closing import queue:', err);
  }
  try {
    await closeMediaUploadQueue();
  } catch (err) {
    logger.error('Error closing media upload queue:', err);
  }
  if (server) {
    server.close(async () => {
      logger.info('Http server closed.');
      await closeDB();
      logger.info('Database connection closed.');
      process.exit(0);
    });
  } else {
    await closeDB();
    logger.info('Database connection closed.');
    process.exit(0);
  }
};

/* [SỬA 18/08/2026] Nhét chi tiết lỗi vào CHUỖI message.
   Bản cũ dùng `logger.error('Unhandled Error:', error.stack || error)` — mà
   định dạng winston của dự án chỉ in `info.message`, nên tham số thứ hai bị
   bỏ qua hoàn toàn. Log ra đúng dòng "Unhandled Error:" trống trơn, không
   một manh mối nào. Chính điều đó đã giấu mất lỗi làm chết worker nhập khóa
   học. */
const unexpectedErrorHandler = (error) => {
  logger.error(`Unhandled Error: ${(error && error.stack) || error}`);
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${(reason && reason.stack) || reason}`);
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();
