/* ============================================================================
 * importStore.js
 * [THÊM 18/08/2026 — COURSE IMPORT, Giai đoạn A]
 *
 * Lưu trạng thái + bản nháp của một lần nhập khóa học trên REDIS.
 *
 * ----------------------------------------------------------------------------
 * VÌ SAO REDIS CHỨ KHÔNG PHẢI BẢNG SQL
 *
 * Dữ liệu này BẢN CHẤT LÀ TẠM THỜI:
 *   • Giảng viên chấp nhận → nó hóa thân thành Courses/Sections/Lessons thật
 *   • Giảng viên hủy       → nó là rác
 * Nó không bao giờ là dữ liệu cần giữ lâu dài — đúng định nghĩa của thứ nên
 * nằm trong Redis.
 *
 * Ba lợi ích cụ thể:
 *   1. TTL tự lo việc dọn dẹp — không cần viết cron xóa bản ghi cũ
 *   2. Không cần migration (tính năng này cần đúng 0 file SQL mới)
 *   3. Vòng đời KHỚP với thư mục tạm trên đĩa (cùng TTL) — hai thứ luôn nhất
 *      quán, không có cảnh bản ghi còn mà file đã mất
 *
 * Rủi ro Redis bị xóa: hậu quả xấu nhất là giảng viên phải nạp lại tệp ZIP.
 * Không mất dữ liệu thật nào, vì mọi thứ ở đây đều chưa được duyệt.
 *
 * ----------------------------------------------------------------------------
 * VÌ SAO DÙNG KHÓA REDIS RIÊNG, KHÔNG NHÉT VÀO JOB DATA CỦA BullMQ
 *
 * BullMQ tự dọn job đã hoàn thành theo `removeOnComplete` (24 giờ / 100 job
 * gần nhất). Nếu để bản nháp trong đó, nó có thể biến mất TRƯỚC khi giảng viên
 * kịp xem — và ta không kiểm soát được thời điểm. Khóa riêng cho phép đặt TTL
 * tường minh, khớp đúng với TTL của thư mục tạm.
 * ========================================================================== */

const redisClient = require('../../database/redis');
const config = require('../../config');
const logger = require('../../utils/logger');

/** Trạng thái vòng đời của một lần nhập. */
const ImportStatus = Object.freeze({
  PENDING: 'PENDING', // đã nhận tệp, chờ worker
  PROCESSING: 'PROCESSING', // đang giải nén / phân tích
  READY: 'READY', // bản nháp sẵn sàng cho giảng viên xem
  ACCEPTED: 'ACCEPTED', // đã tạo khóa học DRAFT
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
});

const jobKey = (jobId) => `import:job:${jobId}`;
const userIndexKey = (accountId) => `import:user:${accountId}`;
const acceptLockKey = (jobId) => `import:accept-lock:${jobId}`;

const ttlSeconds = () => config.import.ttlHours * 3600;

/**
 * Ghi/ghi đè toàn bộ bản ghi job.
 *
 * Luôn đặt lại TTL ở mỗi lần ghi: khi giảng viên còn đang thao tác thì job
 * "trẻ lại", tránh trường hợp bản nháp hết hạn ngay giữa lúc họ đang sửa.
 */
const save = async (job) => {
  const payload = JSON.stringify({ ...job, updatedAt: new Date().toISOString() });
  await redisClient.setex(jobKey(job.jobId), ttlSeconds(), payload);
  return job;
};

const get = async (jobId) => {
  const raw = await redisClient.get(jobKey(jobId));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    // Bản ghi hỏng (ghi dở khi mất kết nối). Coi như không tồn tại còn hơn để
    // lỗi phân tích JSON làm sập cả màn hình danh sách.
    logger.error(`[ImportStore] Bản ghi job ${jobId} hỏng, bỏ qua: ${error.message}`);
    return null;
  }
};

/**
 * Cập nhật một phần bản ghi.
 *
 * ⚠️ Đọc-rồi-ghi không nguyên tử. Chấp nhận được vì chỉ có ĐÚNG MỘT worker
 * chạm vào một job tại một thời điểm (concurrency = 1 cho hàng đợi này), nên
 * không có hai bên ghi đè lẫn nhau.
 */
const patch = async (jobId, changes) => {
  const current = await get(jobId);
  if (!current) return null;
  return save({ ...current, ...changes });
};

/**
 * Cập nhật tiến độ. Tách riêng vì được gọi rất nhiều lần trong một job.
 * @param {number} progress - 0..100
 */
const setProgress = async (jobId, progress, statusMessage) => {
  return patch(jobId, {
    progress: Math.max(0, Math.min(100, Math.round(progress))),
    statusMessage,
  });
};

/**
 * Tạo bản ghi mới và đưa vào chỉ mục của người dùng.
 */
const create = async (job) => {
  await save(job);
  // Set có TTL riêng — nếu không đặt, chỉ mục sẽ phình vô hạn theo thời gian
  // trong khi các job bên trong đã hết hạn từ lâu.
  await redisClient.sadd(userIndexKey(job.accountId), job.jobId);
  await redisClient.expire(userIndexKey(job.accountId), ttlSeconds());
  return job;
};

/**
 * Danh sách job của một giảng viên.
 *
 * Tự dọn các ID đã hết hạn khỏi chỉ mục trong lúc đọc — rẻ hơn nhiều so với
 * chạy một cron riêng chỉ để dọn Set.
 */
const listByAccount = async (accountId) => {
  const ids = await redisClient.smembers(userIndexKey(accountId));
  if (!ids || ids.length === 0) return [];

  const jobs = [];
  const stale = [];
  for (const id of ids) {
    const job = await get(id);
    if (job) jobs.push(job);
    else stale.push(id);
  }
  if (stale.length > 0) {
    await redisClient.srem(userIndexKey(accountId), ...stale).catch(() => {});
  }

  return jobs.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
};

/**
 * Đếm số job ĐANG CHẠY của một giảng viên.
 *
 * Dùng để chặn một người mở nhiều job cùng lúc — mỗi job chiếm dung lượng đĩa
 * đáng kể, và với ổ đĩa đang chật thì đây là van an toàn quan trọng.
 */
const countActiveByAccount = async (accountId) => {
  const jobs = await listByAccount(accountId);
  return jobs.filter(
    (j) => j.status === ImportStatus.PENDING || j.status === ImportStatus.PROCESSING
  ).length;
};

/* ---------------------------------------------------------------------------
 * Khóa chống chấp nhận HAI LẦN
 *
 * ★ Đây là lỗi thật sự sẽ xảy ra chứ không phải giả định: giảng viên bấm nút
 * "Chấp nhận" hai lần (mạng chậm, nút chưa kịp mờ đi, hoặc đơn giản là nhấp
 * đúp). Hai request cùng đọc thấy trạng thái READY, cùng đi tiếp, và hệ thống
 * tạo ra HAI khóa học trùng nhau — mỗi cái với một Slug khác nhau nên không có
 * ràng buộc UNIQUE nào chặn lại.
 *
 * Kiểm tra trạng thái đơn thuần KHÔNG cứu được, vì giữa lúc đọc trạng thái và
 * lúc ghi ACCEPTED có cả một transaction dài đang chạy.
 *
 * `SET key value NX EX` là thao tác NGUYÊN TỬ của Redis: chỉ ĐÚNG MỘT request
 * nhận được 'OK', request còn lại nhận null và bị từ chối ngay.
 *
 * Vì sao khóa tự hết hạn thay vì phải mở khóa tường minh: nếu tiến trình chết
 * giữa transaction, một khóa vĩnh viễn sẽ khóa chết bản nháp đó mãi mãi. Hết
 * hạn sau 2 phút thì tệ nhất là người dùng chờ 2 phút — mà lúc đó trạng thái
 * cũng đã thành ACCEPTED nên lần thử lại vẫn bị chặn đúng cách.
 * ------------------------------------------------------------------------- */
const ACCEPT_LOCK_SECONDS = 120;

const acquireAcceptLock = async (jobId) => {
  if (typeof redisClient.set !== 'function') {
    // Client dự phòng (Redis khởi tạo lỗi). Không có Redis thì tính năng nhập
    // khóa học vốn đã không chạy được; báo không lấy được khóa là đúng.
    return false;
  }
  const result = await redisClient.set(
    acceptLockKey(jobId),
    '1',
    'EX',
    ACCEPT_LOCK_SECONDS,
    'NX'
  );
  return result === 'OK';
};

const releaseAcceptLock = async (jobId) => {
  try {
    await redisClient.del(acceptLockKey(jobId));
  } catch {
    // Không sao — khóa sẽ tự hết hạn.
  }
};

const remove = async (jobId, accountId) => {
  await redisClient.del(jobKey(jobId));
  if (accountId) {
    await redisClient.srem(userIndexKey(accountId), jobId).catch(() => {});
  }
};

/**
 * Bản rút gọn để trả về danh sách — bỏ `proposed` (có thể vài trăm KB).
 *
 * Gửi nguyên bản nháp trong danh sách sẽ khiến một giảng viên có 5 lần nhập
 * phải tải về vài MB JSON chỉ để xem tên và trạng thái.
 */
const toSummary = (job) => {
  if (!job) return null;
  const { proposed, ...rest } = job;
  return {
    ...rest,
    hasProposal: Boolean(proposed),
    totalSections: proposed?.sections?.length || 0,
    totalLessons: proposed?.stats?.totalLessons || 0,
  };
};

module.exports = {
  ImportStatus,
  create,
  get,
  save,
  patch,
  setProgress,
  listByAccount,
  countActiveByAccount,
  remove,
  toSummary,
  jobKey,
  acquireAcceptLock,
  releaseAcceptLock,
};
