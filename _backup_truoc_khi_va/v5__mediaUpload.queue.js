/* ============================================================================
 * mediaUpload.queue.js
 * [THÊM 18/08/2026 — COURSE IMPORT, Giai đoạn C]
 *
 * Tải video (và phụ đề đi kèm) của khóa học vừa nhập lên Cloudinary.
 *
 * ----------------------------------------------------------------------------
 * ★ VÌ SAO BƯỚC NÀY TỒN TẠI — VÀ VÌ SAO NÓ CHẠY SAU KHI CHẤP NHẬN
 *
 * Hết Giai đoạn A, khóa học đã có đủ chương và bài, nhưng mọi bài VIDEO đều
 * mang `ExternalVideoID = NULL` — tức là KHÔNG PHÁT ĐƯỢC. Đó là một khóa học
 * dở dang. Bước này là thứ biến nó thành khóa học dùng được thật.
 *
 * Đặt sau bước chấp nhận là CÓ CHỦ ĐÍCH (xem kế hoạch v3 §1.1). Nếu tải video
 * lên ngay lúc phân tích ZIP, mà giảng viên xem bản nháp rồi đổi ý bấm Hủy,
 * thì hàng chục video đã nằm trên Cloudinary mà KHÔNG có bản ghi nào trong CSDL
 * trỏ tới — không ai biết chúng tồn tại để mà xóa. Tài khoản Cloudinary miễn
 * phí sẽ đầy dần bởi rác vô hình.
 *
 * ----------------------------------------------------------------------------
 * ⚠️ BỘ NHỚ — RÀNG BUỘC QUYẾT ĐỊNH TOÀN BỘ THIẾT KẾ Ở ĐÂY
 *
 *   • `concurrency: 1`  — tải tuần tự. Ba video 200MB tải song song là chạm
 *     trần bộ nhớ container.
 *   • `uploadLargeFile` — đọc theo từng khối 20MB từ đĩa, KHÔNG nạp cả tệp vào
 *     RAM (xem ghi chú trong cloudinary.util.js).
 *   • Xóa tệp gốc NGAY sau khi tải xong từng cái, không đợi hết vòng lặp —
 *     trả lại dung lượng đĩa sớm nhất có thể.
 *
 * ----------------------------------------------------------------------------
 * ⚠️ TÍNH BẤT BIẾN KHI THỬ LẠI (IDEMPOTENCY)
 *
 * `attempts: 2` vì lỗi mạng khi tải lên là chuyện thường. Nhưng thử lại một
 * cách ngây thơ sẽ tải LẠI những video đã xong ở lần trước, tạo ra bản sao mồ
 * côi trên Cloudinary. Vì vậy trước mỗi tệp đều kiểm tra
 * `ExternalVideoID` trong CSDL — đã có thì bỏ qua. Nguồn sự thật là CSDL, chứ
 * không phải trạng thái trong bộ nhớ của lần chạy trước.
 * ========================================================================== */

const fs = require('fs/promises');
const path = require('path');
const { Queue, Worker } = require('bullmq');

const { createBullMQConnection } = require('./queue.config');
const cloudinaryUtil = require('../utils/cloudinary.util');
const lessonRepository = require('../api/lessons/lessons.repository');
const subtitleRepository = require('../api/lessons/subtitle.repository');
const importStore = require('../services/import/importStore');
const { cleanupJobDir } = require('../services/import/importPipeline');
const eventManager = require('../services/event.manager');
const logger = require('../utils/logger');

const QUEUE_NAME = 'media-upload';

/** Kích thước tối đa của một tệp phụ đề. Tệp .srt bình thường chỉ vài chục KB;
 *  lớn hơn nhiều nghĩa là không phải phụ đề thật. */
const MAX_SUBTITLE_BYTES = 2 * 1024 * 1024;

let queue = null;
let worker = null;

const getQueue = () => {
  if (!queue) {
    queue = new Queue(QUEUE_NAME, {
      connection: createBullMQConnection(),
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 10000 },
        removeOnComplete: { age: 3600, count: 50 },
        removeOnFail: { age: 86400 },
      },
    });
  }
  return queue;
};

/**
 * Đưa việc tải media của một khóa học vào hàng đợi.
 *
 * @param {object} payload - { jobId, courseId, accountId, items: [...] }
 *   items: [{ lessonId, lessonName, videoPath, subtitlePath }]
 */
const addMediaUploadJob = async (payload) => {
  return getQueue().add('upload-course-media', payload, {
    jobId: `media-${payload.jobId}`,
  });
};

/** Đẩy tiến độ qua SSE. Không được để SSE hỏng làm chết việc tải video —
 *  đây chỉ là kênh thông báo phụ, giao diện còn có đường thăm dò dự phòng. */
const pushProgress = (accountId, data) => {
  try {
    eventManager.sendEventToUser(accountId, 'import_media_progress', data);
  } catch (error) {
    logger.debug(`[MediaUpload] Không gửi được SSE: ${error.message}`);
  }
};

/** Mã ngôn ngữ đoán từ tên tệp phụ đề: "Bai 1.vi.srt" → "vi". */
const guessLanguageCode = (subtitlePath) => {
  const base = path.basename(subtitlePath).replace(/\.[^.]+$/, '');
  const match = base.match(/\.([a-z]{2})(-[A-Za-z]{2})?$/);
  return match ? match[1] : 'vi';
};

/**
 * Tải phụ đề của MỘT bài học.
 *
 * Phụ đề là phần phụ: hỏng thì bài học vẫn có video và vẫn học được. Vì vậy
 * mọi lỗi ở đây chỉ ghi log rồi đi tiếp, TUYỆT ĐỐI không ném ra ngoài — để
 * một tệp .srt lỗi không kéo cả job tải video thất bại theo.
 */
const uploadSubtitle = async (lessonId, courseId, subtitlePath) => {
  try {
    const stat = await fs.stat(subtitlePath);
    if (stat.size === 0 || stat.size > MAX_SUBTITLE_BYTES) {
      logger.warn(
        `[MediaUpload] Bỏ qua phụ đề bất thường (${stat.size} byte): ${subtitlePath}`
      );
      return null;
    }

    const result = await cloudinaryUtil.uploadLargeFile(subtitlePath, {
      folder: `courses/${courseId}/lessons/${lessonId}/subtitles`,
      resource_type: 'raw',
      type: 'upload', // Phụ đề KHÔNG để 'private': trình phát <track> tải trực
      //                 tiếp bằng URL, không đi qua khâu ký của backend.
    });

    await subtitleRepository.addSubtitle({
      LessonID: lessonId,
      LanguageCode: guessLanguageCode(subtitlePath),
      SubtitleUrl: result.secure_url,
      IsDefault: 1,
    });

    return result.secure_url;
  } catch (error) {
    logger.warn(
      `[MediaUpload] Không tải được phụ đề cho bài ${lessonId}: ${error.message}`
    );
    return null;
  }
};

/** Xử lý MỘT bài học: tải video → cập nhật CSDL → tải phụ đề → xóa tệp gốc. */
const processOneItem = async (item, courseId) => {
  const { lessonId, videoPath, subtitlePath } = item;

  /* --- Chốt chặn bất biến: đã tải rồi thì bỏ qua ---
     Đây là thứ giữ cho `attempts: 2` an toàn. */
  const existing = await lessonRepository.findLessonById(lessonId);
  if (!existing) {
    return { status: 'skipped', reason: 'Bài học không còn tồn tại' };
  }
  /* [THÊM 18/08/2026] Mục CHỈ CÓ PHỤ ĐỀ.

     Từ nay video không còn được giải nén ra máy chủ (xem safeExtract.js), nên
     `videoPath` là null với hầu hết mục. Nhưng phụ đề thì vẫn nằm trên đĩa —
     tệp .srt chỉ vài KB nên được giải nén bình thường — và nó không phụ thuộc
     vào video.

     Tải phụ đề NGAY thay vì chờ giảng viên gắn video: rất có thể họ chọn dán
     link YouTube và không bao giờ tải video lên Cloudinary. Chờ một sự kiện có
     thể không bao giờ đến là cách chắc chắn để mất phụ đề.

     ⚠️ Đặt TRƯỚC phép kiểm tra `ExternalVideoID` bên dưới: một bài học đã có
     video (giảng viên vừa gắn ở bước 4) vẫn cần phụ đề của nó, nên không được
     rơi vào nhánh "bỏ qua vì đã có video từ trước". */
  if (!videoPath) {
    if (!subtitlePath) {
      return { status: 'skipped', reason: 'Mục không có video lẫn phụ đề' };
    }
    const url = await uploadSubtitle(lessonId, courseId, subtitlePath);
    await fs.rm(subtitlePath, { force: true }).catch(() => {});
    return url
      ? { status: 'done', subtitleOnly: true }
      : { status: 'failed', reason: 'Không tải được phụ đề' };
  }

  if (existing.ExternalVideoID) {
    return { status: 'skipped', reason: 'Đã có video từ trước' };
  }

  let uploadResult;
  try {
    uploadResult = await cloudinaryUtil.uploadLargeFile(videoPath, {
      // Trùng đúng quy ước thư mục của luồng tải video thủ công
      // (lessons.service.js) để việc dọn dẹp theo tiền tố vẫn quét được.
      folder: `courses/${courseId}/lessons/${lessonId}/videos_private`,
      resource_type: 'video',
      type: 'private',
    });
  } catch (error) {
    return { status: 'failed', reason: error.message };
  }

  try {
    await lessonRepository.updateLessonById(lessonId, {
      VideoSourceType: 'CLOUDINARY',
      ExternalVideoID: uploadResult.public_id,
      // Ưu tiên thời lượng do Cloudinary trả về: nó giải mã thật sự nên chính
      // xác hơn bộ đọc MP4 tự viết, và còn đúng với cả .mkv/.webm — những định
      // dạng mà mediaProbe đành trả về null.
      VideoDurationSeconds:
        Math.round(uploadResult.duration || 0) || item.durationSeconds || null,
    });
  } catch (error) {
    /* CSDL hỏng SAU khi đã tải lên → hoàn tác để không bỏ lại tệp mồ côi trên
       Cloudinary. Chính là kịch bản mà `lessons.service.js` đã xử lý cùng cách. */
    logger.error(
      `[MediaUpload] Cập nhật CSDL thất bại cho bài ${lessonId}, đang hoàn tác Cloudinary...`
    );
    await cloudinaryUtil
      .deleteAsset(uploadResult.public_id, {
        resource_type: 'video',
        type: 'private',
      })
      .catch(() => {});
    return { status: 'failed', reason: error.message };
  }

  if (subtitlePath) {
    await uploadSubtitle(lessonId, courseId, subtitlePath);
  }

  /* Xóa tệp gốc NGAY, không đợi hết vòng lặp. Với ổ đĩa đang chật thì mỗi
     video 200MB được trả lại sớm một chút đều đáng giá. */
  await fs.rm(videoPath, { force: true }).catch(() => {});
  if (subtitlePath) await fs.rm(subtitlePath, { force: true }).catch(() => {});

  return { status: 'done', publicId: uploadResult.public_id };
};

const startMediaUploadWorker = () => {
  if (worker) return worker;

  worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { jobId, courseId, accountId, items } = job.data;
      const total = items?.length || 0;

      if (total === 0) {
        await importStore.patch(jobId, {
          mediaStatus: 'DONE',
          mediaTotal: 0,
          mediaDone: 0,
          mediaMessage: 'Khóa học không có video nào cần tải lên.',
        });
        await cleanupJobDir(jobId).catch(() => {});
        return { total: 0 };
      }

      /* Thiếu khóa Cloudinary là chuyện bình thường trên máy dev. Dừng SỚM với
         thông báo rõ ràng, thay vì để từng tệp thất bại và ghi ra 30 dòng lỗi
         giống hệt nhau che mất nguyên nhân thật. */
      if (!cloudinaryUtil.isConfigured()) {
        const message =
          'Chưa cấu hình Cloudinary — bỏ qua bước tải video. ' +
          'Khóa học đã được tạo, bạn có thể tải video thủ công ở trang Sửa khóa học.';
        logger.warn(`[MediaUpload] ${message}`);
        await importStore.patch(jobId, {
          mediaStatus: 'SKIPPED',
          mediaTotal: total,
          mediaDone: 0,
          mediaMessage: message,
        });
        pushProgress(accountId, { jobId, courseId, mediaStatus: 'SKIPPED', message });
        return { total, skipped: total };
      }

      await importStore.patch(jobId, {
        mediaStatus: 'UPLOADING',
        mediaTotal: total,
        mediaDone: 0,
        mediaMessage: 'Bắt đầu tải video lên...',
      });

      let done = 0;
      let failed = 0;

      for (const item of items) {
        const message = `Đang tải "${item.lessonName}" (${done + 1}/${total})`;
        await importStore.patch(jobId, { mediaMessage: message }).catch(() => {});
        pushProgress(accountId, {
          jobId,
          courseId,
          mediaStatus: 'UPLOADING',
          mediaDone: done,
          mediaTotal: total,
          message,
        });

        let result;
        try {
          result = await processOneItem(item, courseId);
        } catch (error) {
          /* Một bài lỗi KHÔNG được làm chết cả khóa học. Ghi nhận rồi đi tiếp —
             giảng viên tải bù đúng bài đó sau, thay vì phải làm lại từ đầu. */
          logger.error(
            `[MediaUpload] Lỗi ngoài dự kiến ở bài ${item.lessonId}:`,
            error
          );
          result = { status: 'failed', reason: error.message };
        }

        if (result.status === 'failed') {
          failed += 1;
          logger.warn(
            `[MediaUpload] Bài ${item.lessonId} thất bại: ${result.reason}`
          );
        }

        done += 1;
        await importStore
          .patch(jobId, { mediaDone: done, mediaFailed: failed })
          .catch(() => {});
        await job.updateProgress(Math.round((done / total) * 100)).catch(() => {});
      }

      const succeeded = done - failed;
      const finalMessage =
        failed === 0
          ? `Đã tải lên ${succeeded}/${total} video.`
          : `Đã tải lên ${succeeded}/${total} video. ${failed} video thất bại — ` +
            'bạn có thể tải lại thủ công ở trang Sửa khóa học.';

      await importStore.patch(jobId, {
        mediaStatus: failed === 0 ? 'DONE' : 'PARTIAL',
        mediaDone: done,
        mediaFailed: failed,
        mediaMessage: finalMessage,
      });
      pushProgress(accountId, {
        jobId,
        courseId,
        mediaStatus: failed === 0 ? 'DONE' : 'PARTIAL',
        mediaDone: done,
        mediaTotal: total,
        message: finalMessage,
      });

      /* Dọn thư mục tạm KHI VÀ CHỈ KHI mọi video đã lên xong.
         Còn video thất bại thì giữ tệp lại — cron TTL sẽ dọn sau, nhưng trong
         thời gian đó vẫn còn cơ hội thử lại mà không phải nạp lại tệp ZIP. */
      if (failed === 0) {
        await cleanupJobDir(jobId).catch(() => {});
      }

      logger.info(
        `[MediaUpload] Khóa học ${courseId}: ${succeeded}/${total} video thành công.`
      );
      return { total, succeeded, failed };
    },
    {
      connection: createBullMQConnection(),
      // ⚠️ KHÔNG tăng số này — xem ghi chú bộ nhớ ở đầu tệp.
      concurrency: 1,
      // Video lớn tải rất lâu; mốc mặc định 30s của BullMQ sẽ coi nhầm là job
      // chết và cho chạy lại song song.
      lockDuration: 10 * 60 * 1000,
    }
  );

  worker.on('failed', (job, error) => {
    logger.error(
      `[MediaUpload] Job ${job?.id} thất bại: ${error?.message || error}`
    );
    const jobId = job?.data?.jobId;
    if (jobId) {
      importStore
        .patch(jobId, {
          mediaStatus: 'FAILED',
          mediaMessage:
            'Tải video lên thất bại. Khóa học vẫn đã được tạo — bạn có thể ' +
            'tải video thủ công ở trang Sửa khóa học.',
        })
        .catch(() => {});
    }
  });

  worker.on('error', (error) => {
    logger.error('[MediaUpload] Lỗi worker:', error);
  });

  logger.info('[MediaUpload] Worker đã khởi động (concurrency = 1).');
  return worker;
};

const closeMediaUploadQueue = async () => {
  if (worker) {
    await worker.close();
    worker = null;
  }
  if (queue) {
    await queue.close();
    queue = null;
  }
};

module.exports = {
  QUEUE_NAME,
  addMediaUploadJob,
  startMediaUploadWorker,
  closeMediaUploadQueue,
  // Xuất ra để kiểm thử được từng phần mà không cần dựng cả Redis + BullMQ.
  processOneItem,
  guessLanguageCode,
};
