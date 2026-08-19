/* ============================================================================
 * import.queue.js
 * [THÊM 18/08/2026 — COURSE IMPORT, Giai đoạn A]
 *
 * Hàng đợi xử lý nền cho việc nhập khóa học từ ZIP.
 *
 * ----------------------------------------------------------------------------
 * VÌ SAO BẮT BUỘC PHẢI CHẠY NỀN
 *
 * Một tệp ZIP thật (30–200 tệp PDF/PPTX) mất 2–10 phút để xử lý. Làm đồng bộ
 * sẽ gặp cả ba vấn đề cùng lúc:
 *   • Nginx `proxy_read_timeout 300s` cắt kết nối, trình duyệt còn ngắn hơn
 *   • Giảng viên lỡ F5 là mất trắng, phải nạp lại từ đầu
 *   • Không hiển thị được tiến độ
 *
 * ----------------------------------------------------------------------------
 * ⚠️ CONCURRENCY = 1 — QUYẾT ĐỊNH QUAN TRỌNG NHẤT Ở FILE NÀY
 *
 * Chạy song song nhiều job sẽ:
 *   • Nhân đôi/ba dung lượng đĩa tạm cùng lúc (ổ đĩa đang chật)
 *   • Nhân đôi/ba bộ nhớ đỉnh — container backend có `mem_limit` thấp, và khi
 *     bị OOM kill thì tiến trình bị hạ NGAY, không kịp ghi một dòng log nào
 *
 * Nhập khóa học không phải thao tác thường xuyên (mỗi giảng viên vài lần một
 * học kỳ), nên xếp hàng tuần tự hoàn toàn chấp nhận được.
 * ========================================================================== */

const { Queue, Worker } = require('bullmq');

const { createBullMQConnection, defaultJobOptions } = require('./queue.config');
const importStore = require('../services/import/importStore');
const { runPipeline, cleanupJobDir } = require('../services/import/importPipeline');
const { ImportRejectedError } = require('../services/import/safeExtract');
const eventManager = require('../services/event.manager');
const logger = require('../utils/logger');
const config = require('../config');

const QUEUE_NAME = 'course-import';

const connection = createBullMQConnection();

const importQueue = new Queue(QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    ...defaultJobOptions,
    /* ⚠️ ĐÈ `attempts` VỀ 1 — KHÔNG thử lại.
     *
     * Mặc định của dự án là `attempts: 3`. Với hàng đợi này, thử lại là SAI:
     *   • Bước đầu tiên của pipeline XÓA tệp .zip gốc sau khi giải nén. Lần
     *     thử thứ hai sẽ không còn gì để giải nén.
     *   • Lỗi ở đây hầu hết là lỗi dữ liệu (ZIP hỏng, định dạng lạ) — thử lại
     *     3 lần chỉ tốn thêm 3× thời gian rồi vẫn hỏng.
     *   • Giảng viên tải lại tệp là xong, rõ ràng hơn nhiều so với việc chờ
     *     hệ thống âm thầm thử lại.
     */
    attempts: 1,
    removeOnComplete: { age: 3600, count: 50 },
    removeOnFail: { age: 86400 },
  },
});

/**
 * Đưa một job vào hàng đợi.
 * @param {object} data - { jobId, accountId, zipPath, zipFileName }
 */
const addImportJob = async (data) => {
  const job = await importQueue.add('process-zip', data, {
    jobId: `import-${data.jobId}`,
  });
  logger.info(`📥 [Import] Đã xếp hàng job ${data.jobId} (BullMQ id ${job.id}).`);
  return job;
};

/**
 * Đẩy tiến độ về trình duyệt qua SSE.
 *
 * Kênh SSE này vừa được vá ở Level 2 (lỗi lệch kiểu khóa Map khiến nó chưa bao
 * giờ gửi được gì) — đây đúng là chỗ để dùng nó.
 *
 * Bọc try/catch: SSE là kênh phụ, hỏng thì job vẫn phải chạy tiếp.
 */
const pushProgress = (accountId, payload) => {
  try {
    eventManager.sendEventToUser(accountId, 'import_progress', payload);
  } catch (error) {
    logger.debug(`[Import] Không đẩy được tiến độ SSE: ${error.message}`);
  }
};

let worker = null;

const startImportWorker = () => {
  if (worker) return worker;

  worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { jobId, accountId, zipPath, zipFileName } = job.data;

      await importStore.patch(jobId, {
        status: importStore.ImportStatus.PROCESSING,
        progress: 0,
        statusMessage: 'Bắt đầu xử lý...',
      });
      pushProgress(accountId, { jobId, status: 'PROCESSING', progress: 0 });

      /* Giảm tần suất ghi Redis + SSE.
         Pipeline báo tiến độ sau MỖI tệp; với 200 tệp đó là 200 lượt ghi Redis
         và 200 sự kiện SSE — tốn vô ích vì mắt người không phân biệt được
         51% với 52%. Chỉ ghi khi phần trăm đổi ít nhất 2 đơn vị. */
      let lastReported = -10;

      const onProgress = async (percent, message) => {
        const rounded = Math.round(percent);
        if (rounded - lastReported < 2 && rounded < 100) return;
        lastReported = rounded;

        await importStore.setProgress(jobId, rounded, message);
        await job.updateProgress(rounded).catch(() => {});
        pushProgress(accountId, {
          jobId,
          status: 'PROCESSING',
          progress: rounded,
          statusMessage: message,
        });
      };

      try {
        const proposal = await runPipeline({
          jobId,
          zipPath,
          zipFileName,
          onProgress: (p, m) => {
            // Không await — báo tiến độ không được làm chậm việc chính.
            onProgress(p, m).catch(() => {});
          },
        });

        await importStore.patch(jobId, {
          status: importStore.ImportStatus.READY,
          progress: 100,
          statusMessage: 'Bản nháp đã sẵn sàng',
          proposed: proposal,
          completedAt: new Date().toISOString(),
        });

        pushProgress(accountId, {
          jobId,
          status: 'READY',
          progress: 100,
          totalSections: proposal.stats.totalSections,
          totalLessons: proposal.stats.totalLessons,
        });

        return { totalLessons: proposal.stats.totalLessons };
      } catch (error) {
        /* Phân biệt hai loại lỗi:
           • ImportRejectedError → lỗi DỮ LIỆU, thông điệp đã viết cho người
             dùng đọc, hiện thẳng lên giao diện.
           • Lỗi khác → sự cố hệ thống. Ghi log đầy đủ nhưng CHỈ hiện thông báo
             chung cho người dùng, tránh lộ đường dẫn máy chủ hay chi tiết nội bộ. */
        const isUserError = error instanceof ImportRejectedError;
        const userMessage = isUserError
          ? error.message
          : 'Đã xảy ra lỗi khi xử lý tệp. Vui lòng thử lại hoặc liên hệ quản trị viên.';

        if (isUserError) {
          logger.warn(`[Import] Job ${jobId} bị từ chối (${error.code}): ${error.message}`);
        } else {
          logger.error(`[Import] Job ${jobId} lỗi hệ thống:`, error);
        }

        await importStore.patch(jobId, {
          status: importStore.ImportStatus.FAILED,
          statusMessage: userMessage,
          errorCode: isUserError ? error.code : 'INTERNAL',
          completedAt: new Date().toISOString(),
        });
        pushProgress(accountId, {
          jobId,
          status: 'FAILED',
          statusMessage: userMessage,
        });

        // Job hỏng thì thư mục tạm không còn giá trị — dọn ngay để trả lại đĩa.
        await cleanupJobDir(jobId);

        throw error;
      }
    },
    {
      connection: createBullMQConnection(),
      // ⚠️ Xem ghi chú ở đầu file — KHÔNG tăng số này.
      concurrency: 1,
      // Job treo quá lâu sẽ bị coi là chết và giải phóng slot.
      lockDuration: config.import.jobTimeoutMinutes * 60 * 1000,
    }
  );

  worker.on('failed', (job, err) => {
    logger.error(`[Import] Job ${job?.id} thất bại: ${err.message}`);
  });

  logger.info('📥 [Import] Worker nhập khóa học đã sẵn sàng (concurrency = 1).');
  return worker;
};

const closeImportQueue = async () => {
  if (worker) {
    await worker.close();
    worker = null;
  }
  await importQueue.close().catch(() => {});
};

module.exports = {
  importQueue,
  addImportJob,
  startImportWorker,
  closeImportQueue,
  QUEUE_NAME,
};
