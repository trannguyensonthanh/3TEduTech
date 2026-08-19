// File: src/services/event.manager.js
//
// Quản lý các kết nối Server-Sent Events (SSE) để đẩy thông báo thời gian thực.
//
/* ============================================================================
   [SỬA 17/08/2026 — LEVEL 2] LỖI NGHIÊM TRỌNG: SSE CHƯA BAO GIỜ HOẠT ĐỘNG

   TRIỆU CHỨNG: người dùng không nhận được thông báo tức thời, phải F5 mới thấy.

   NGUYÊN NHÂN — lệch KIỂU DỮ LIỆU của khóa Map:
     • events.controller.js:  addClient(req.user.id, res)
       → req.user.id lấy từ Accounts.AccountID (BIGINT) nên là SỐ.
       → Map lưu khóa là số:      clients.set(12, ...)

     • notifications.service.js: sendEventToUsers(recipientId.toString(), ...)
       → tra cứu bằng CHUỖI:      clients.has('12')

   Map của JavaScript so khớp khóa bằng SameValueZero — 12 và '12' là HAI khóa
   khác nhau. Vì vậy `clients.has('12')` luôn trả về false và không một thông
   báo nào được gửi đi. Log chỉ ghi ở mức warn ("No active SSE connections") nên
   lỗi này nằm im rất lâu: nhìn log thì tưởng người dùng đang offline, trong khi
   họ đang mở trang.

   Điều đáng nói: bản vá ở Level 0 (bỏ điều kiện `if (type === 'COURSE_SUBMITTED')`
   để đẩy mọi loại thông báo) là ĐÚNG nhưng vẫn vô tác dụng, vì nút thắt thật
   nằm ở đây chứ không ở đó.

   CÁCH SỬA: chuẩn hóa khóa qua đúng MỘT hàm `key()`. Mọi lối vào/ra của Map đều
   đi qua nó, nên kiểu dữ liệu không bao giờ lệch được nữa — kể cả khi sau này
   có người gọi bằng số, bằng chuỗi hay bằng BigInt.
============================================================================ */

const logger = require('../utils/logger');

const clients = new Map();

/**
 * Chuẩn hóa mọi định danh người dùng về CHUỖI.
 *
 * Đây là điểm mấu chốt của bản vá: chừng nào mọi thao tác trên `clients` đều đi
 * qua hàm này thì 12, '12' và 12n đều quy về cùng một khóa.
 *
 * @param {string|number|bigint} accountId
 * @returns {string}
 */
const key = (accountId) => String(accountId);

/**
 * Thêm một client (kết nối SSE) vào danh sách quản lý.
 * @param {number|string} accountId - ID của người dùng.
 * @param {object} res - Đối tượng response của Express.
 */
function addClient(accountId, res) {
  const k = key(accountId);
  if (!clients.has(k)) {
    clients.set(k, new Set());
  }
  clients.get(k).add(res);
  logger.info(
    `SSE client connected: User ${k}. Total connections for user: ${clients.get(k).size}`
  );
}

/**
 * Xóa một client khỏi danh sách khi họ ngắt kết nối.
 * @param {number|string} accountId
 * @param {object} res
 */
function removeClient(accountId, res) {
  const k = key(accountId);
  if (!clients.has(k)) return;

  const userClients = clients.get(k);
  userClients.delete(res);

  const remaining = userClients.size;
  // Không còn kết nối nào thì xóa hẳn khóa, để Map không phình theo số người
  // dùng từng truy cập (rò rỉ bộ nhớ chậm nhưng chắc chắn ở server chạy dài).
  if (remaining === 0) {
    clients.delete(k);
  }
  logger.info(
    `SSE client disconnected: User ${k}. Remaining connections: ${remaining}`
  );
}

/**
 * Ghi một message SSE tới tất cả kết nối của một người dùng.
 *
 * Bọc `res.write` trong try/catch vì kết nối có thể đã đứt mà `req.on('close')`
 * chưa kịp chạy (mất mạng đột ngột, laptop gập lại). Khi đó `write` ném lỗi;
 * nếu không bắt, một client chết sẽ làm hỏng cả vòng lặp và những người còn lại
 * cũng không nhận được gì.
 *
 * @returns {number} Số kết nối đã ghi thành công.
 */
function writeToClients(k, eventName, data) {
  const userClients = clients.get(k);
  if (!userClients || userClients.size === 0) return 0;

  const message = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  let delivered = 0;

  // Duyệt trên bản sao: nếu ghi lỗi ta xóa phần tử khỏi Set ngay trong vòng lặp.
  Array.from(userClients).forEach((res) => {
    try {
      res.write(message);
      delivered += 1;
    } catch (error) {
      logger.warn(
        `[EventManager] Kết nối SSE của user ${k} đã chết, loại khỏi danh sách: ${error.message}`
      );
      userClients.delete(res);
    }
  });

  if (userClients.size === 0) clients.delete(k);
  return delivered;
}

/**
 * Gửi một sự kiện đến MỘT người dùng cụ thể.
 * @param {string|number} accountId
 * @param {string} eventName
 * @param {object} data
 */
function sendEventToUser(accountId, eventName, data) {
  const k = key(accountId);
  const delivered = writeToClients(k, eventName, data);

  if (delivered > 0) {
    logger.info(
      `Sending SSE event '${eventName}' to User ${k} (${delivered} connections)`
    );
  } else {
    // Mức debug chứ không phải warn: người dùng đang offline là chuyện hoàn
    // toàn bình thường. Để ở mức warn thì log production sẽ ngập cảnh báo giả
    // và che mất cảnh báo thật — chính là thứ đã giấu kín lỗi lệch khóa ở trên.
    logger.debug(
      `[EventManager] User ${k} không có kết nối SSE nào đang mở; bỏ qua sự kiện '${eventName}'.`
    );
  }
}

/**
 * Gửi một sự kiện đến một hoặc nhiều người dùng.
 * @param {Array<number|string>|number|string} accountIds
 * @param {string} eventName
 * @param {object} data
 */
function sendEventToUsers(accountIds, eventName, data) {
  const userIds = Array.isArray(accountIds) ? accountIds : [accountIds];
  userIds.forEach((accountId) => sendEventToUser(accountId, eventName, data));
}

/**
 * Số người dùng đang có ít nhất một kết nối SSE mở.
 * Hữu ích cho bảng theo dõi vận hành và để kiểm chứng bản vá này thực sự chạy.
 * @returns {number}
 */
function getConnectedUserCount() {
  return clients.size;
}

module.exports = {
  addClient,
  removeClient,
  sendEventToUsers,
  sendEventToUser,
  getConnectedUserCount,
};
