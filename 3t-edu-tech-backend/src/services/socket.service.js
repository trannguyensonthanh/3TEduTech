/* ============================================================================
 * socket.service.js
 * [THÊM 17/08/2026 — LEVEL 2, mục 2.3]
 *
 * Lớp thời gian thực HAI CHIỀU dựa trên Socket.IO (WebSocket).
 *
 * ----------------------------------------------------------------------------
 * VÌ SAO GIỮ CẢ SSE LẪN SOCKET.IO, KHÔNG THAY THẾ HẲN?
 *
 * Dự án đã có sẵn kênh SSE (services/event.manager.js + api/events) đang phục
 * vụ thông báo, và frontend dùng @microsoft/fetch-event-source để nghe. SSE làm
 * rất tốt việc SERVER → CLIENT một chiều: nhẹ, chạy trên HTTP thường, tự động
 * kết nối lại, không cần cấu hình gì thêm ở tầng hạ tầng.
 *
 * Thứ SSE KHÔNG làm được là chiều ngược lại và khái niệm "phòng":
 *   - Học viên đang mở bài học nào → tham gia phòng của khóa học đó.
 *   - Gõ bình luận → cả phòng thấy ngay, không cần F5.
 *   - "Ai đang xem bài này", "đang soạn tin"...
 * Đó đúng là phần Socket.IO sinh ra để giải quyết.
 *
 * Nên: SSE giữ nguyên vai trò thông báo cá nhân (đã chạy, đã vá lỗi lệch khóa),
 * Socket.IO gánh phần thảo luận theo phòng. Hai kênh không giẫm chân nhau, và
 * quan trọng hơn là KHÔNG phải viết lại phần thông báo đang hoạt động tốt.
 *
 * ----------------------------------------------------------------------------
 * THIẾT KẾ "HỎNG CŨNG KHÔNG SẬP" (fail-safe)
 *
 * Gói `socket.io` là phụ thuộc MỚI, phải chạy `npm install` mới có. Nếu file
 * này `require('socket.io')` ở đầu file theo cách thông thường thì trên một máy
 * chưa cài gói, server sẽ chết ngay lúc khởi động với MODULE_NOT_FOUND — mất
 * toàn bộ hệ thống chỉ vì thiếu một tính năng phụ.
 *
 * Vì vậy việc nạp gói được đặt trong try/catch và chạy trễ (lazy). Chưa cài gói
 * thì hệ thống vẫn chạy đầy đủ như cũ, chỉ ghi một dòng cảnh báo và mọi hàm
 * emit* trở thành lệnh rỗng.
 * ========================================================================== */

const logger = require('../utils/logger');
const config = require('../config');
const { verifyToken } = require('../utils/generateToken');

/** Instance Socket.IO Server, hoặc null nếu chưa khởi tạo được. */
let io = null;

/** Tên phòng — gom vào một chỗ để server và client không bao giờ đặt lệch tên. */
const userRoom = (accountId) => `user:${String(accountId)}`;
const courseRoom = (courseId) => `course:${String(courseId)}`;

/**
 * Khởi tạo Socket.IO và gắn vào HTTP server đang chạy.
 *
 * @param {import('http').Server} httpServer - Kết quả của app.listen().
 * @returns {object|null} instance io, hoặc null nếu không khởi tạo được.
 */
const initSocketServer = (httpServer) => {
  if (io) return io;

  let SocketIOServer;
  try {
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    ({ Server: SocketIOServer } = require('socket.io'));
  } catch (error) {
    logger.warn(
      '[Socket.IO] Chưa cài gói `socket.io` nên bỏ qua lớp realtime hai chiều. ' +
        'Hệ thống vẫn chạy bình thường; thông báo tức thời vẫn đi qua SSE. ' +
        'Muốn bật, chạy: npm install socket.io'
    );
    return null;
  }

  io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    // Dùng đúng danh sách origin của CORS HTTP để không có hai nguồn sự thật.
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (config.env === 'development') return callback(null, true);
        if (config.corsAllowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        logger.warn(`[Socket.IO] Chặn origin không hợp lệ: ${origin}`);
        return callback(new Error('Origin không được phép'));
      },
      credentials: true,
    },
    /* Cho phép rơi xuống HTTP long-polling khi WebSocket bị chặn.
       Không phải chuyện lý thuyết: nhiều mạng công ty, mạng trường học và một
       số proxy chặn thẳng giao thức WebSocket. Ép `transports: ['websocket']`
       sẽ khiến đúng nhóm người dùng đó mất hẳn tính năng mà không hiểu vì sao. */
    transports: ['websocket', 'polling'],
    pingTimeout: 25000,
    pingInterval: 20000,
  });

  /* --- Xác thực ngay ở bước bắt tay (handshake) ---
     Bắt buộc phải xác thực TRƯỚC khi cho vào phòng. Nếu để client tự khai
     accountId rồi mới join, bất kỳ ai cũng có thể `join('user:5')` và nghe trộm
     thông báo riêng của người khác. */
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');

      if (!token) {
        return next(new Error('Thiếu token xác thực.'));
      }

      const payload = await verifyToken(token);
      if (!payload?.accountId) {
        return next(new Error('Token không hợp lệ.'));
      }

      // Gắn danh tính đã xác thực lên socket. Từ đây trở đi mọi handler chỉ
      // được dùng giá trị này, tuyệt đối không tin accountId do client gửi lên.
      socket.data.accountId = String(payload.accountId);
      return next();
    } catch (error) {
      logger.debug(`[Socket.IO] Bắt tay thất bại: ${error.message}`);
      return next(new Error('Xác thực thất bại.'));
    }
  });

  io.on('connection', (socket) => {
    const { accountId } = socket.data;

    // Mỗi người dùng có một phòng riêng → server đẩy sự kiện cá nhân dễ dàng,
    // và tự động bao phủ trường hợp mở nhiều tab/nhiều thiết bị.
    socket.join(userRoom(accountId));
    logger.info(`[Socket.IO] User ${accountId} đã kết nối (${socket.id}).`);

    /* Tham gia phòng thảo luận của một khóa học.
       Chỉ kiểm tra định dạng ở đây; quyền xem nội dung thảo luận vẫn do REST
       API kiểm soát khi tải danh sách bình luận. Ở phòng này chỉ phát đi tín
       hiệu "có bình luận mới, hãy tải lại" chứ KHÔNG phát nội dung bình luận,
       nên kể cả người không có quyền cũng không đọc lỏm được gì. */
    socket.on('course:join', (courseId) => {
      const id = String(courseId || '').trim();
      if (!/^\d+$/.test(id)) return;
      socket.join(courseRoom(id));
      logger.debug(`[Socket.IO] User ${accountId} vào phòng khóa học ${id}.`);
    });

    socket.on('course:leave', (courseId) => {
      const id = String(courseId || '').trim();
      if (!/^\d+$/.test(id)) return;
      socket.leave(courseRoom(id));
    });

    socket.on('disconnect', (reason) => {
      logger.debug(
        `[Socket.IO] User ${accountId} ngắt kết nối (${socket.id}): ${reason}`
      );
    });
  });

  logger.info(
    '[Socket.IO] Lớp realtime hai chiều đã sẵn sàng tại đường dẫn /socket.io'
  );
  return io;
};

/**
 * Đẩy sự kiện tới mọi thiết bị của một người dùng.
 * An toàn khi Socket.IO chưa bật — khi đó chỉ là lệnh rỗng.
 */
const emitToUser = (accountId, eventName, payload) => {
  if (!io) return;
  io.to(userRoom(accountId)).emit(eventName, payload);
};

/**
 * Đẩy sự kiện tới mọi người đang mở một khóa học.
 * @param {number|string} courseId
 * @param {string} eventName
 * @param {object} payload
 */
const emitToCourse = (courseId, eventName, payload) => {
  if (!io) return;
  io.to(courseRoom(courseId)).emit(eventName, payload);
};

/** Socket.IO có đang hoạt động không (dùng cho healthcheck/log). */
const isSocketEnabled = () => Boolean(io);

/** Số kết nối socket đang mở. */
const getConnectionCount = () => (io ? io.engine.clientsCount : 0);

/** Đóng sạch khi tắt server (graceful shutdown). */
const closeSocketServer = async () => {
  if (!io) return;
  await new Promise((resolve) => io.close(resolve));
  io = null;
  logger.info('[Socket.IO] Đã đóng.');
};

module.exports = {
  initSocketServer,
  emitToUser,
  emitToCourse,
  isSocketEnabled,
  getConnectionCount,
  closeSocketServer,
};
