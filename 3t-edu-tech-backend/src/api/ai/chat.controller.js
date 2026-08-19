// File: src/api/ai/chat.controller.js
// [THÊM 17/08/2026 — LEVEL 3]

const httpStatus = require('http-status').status;
const chatService = require('./chat.service');
const { catchAsync } = require('../../utils/catchAsync');

/** POST /v1/ai/sessions — lấy phiên đang mở theo ngữ cảnh, chưa có thì tạo. */
const getOrCreateSession = catchAsync(async (req, res) => {
  const session = await chatService.getOrCreateSession(req.user, {
    scope: req.body.scope,
    courseId: req.body.courseId,
    lessonId: req.body.lessonId,
  });
  res.status(httpStatus.OK).send(session);
});

/** GET /v1/ai/sessions?scope=COURSE&courseId=12 */
const listSessions = catchAsync(async (req, res) => {
  const sessions = await chatService.listSessions(req.user, {
    scope: req.query.scope,
    courseId: req.query.courseId,
  });
  res.status(httpStatus.OK).send({ sessions, total: sessions.length });
});

/** GET /v1/ai/sessions/:sessionId/messages */
const getSessionMessages = catchAsync(async (req, res) => {
  const messages = await chatService.getSessionMessages(
    req.user,
    req.params.sessionId,
    Number(req.query.limit)
  );
  res.status(httpStatus.OK).send({ messages, total: messages.length });
});

/** DELETE /v1/ai/sessions/:sessionId — lưu trữ, KHÔNG xóa dữ liệu. */
const archiveSession = catchAsync(async (req, res) => {
  const result = await chatService.archiveSession(
    req.user,
    req.params.sessionId
  );
  res.status(httpStatus.OK).send(result);
});

/** POST /v1/ai/sessions/:sessionId/chat — hội thoại không streaming. */
const sendMessage = catchAsync(async (req, res) => {
  const result = await chatService.sendMessage(
    req.user,
    req.params.sessionId,
    req.body
  );
  res.status(httpStatus.OK).send(result);
});

/**
 * POST /v1/ai/sessions/:sessionId/chat/stream — hội thoại có streaming (SSE).
 *
 * ⚠️ Header PHẢI được gửi TRƯỚC khi gọi service.
 * Khi đã ghi header thì không thể đổi mã trạng thái nữa, nên mọi lỗi sau thời
 * điểm này chỉ báo được bằng một sự kiện trong chính luồng SSE (service lo
 * phần đó). Đổi lại, client nhận được kết nối mở ngay lập tức thay vì phải chờ
 * backend truy vấn CSDL xong.
 */
const streamMessage = catchAsync(async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  // X-Accel-Buffering: một số cấu hình Nginx vẫn gom bộ đệm dù đã tắt
  // proxy_buffering ở tầng location. Header này là chỉ thị trực tiếp cho Nginx
  // "đừng đệm response này" và có tác dụng bất kể cấu hình location.
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  await chatService.streamMessage(
    req.user,
    req.params.sessionId,
    req.body,
    res
  );
});

/** POST /v1/ai/suggestions — gợi ý câu hỏi tiếp theo. */
const getSuggestions = catchAsync(async (req, res) => {
  const result = await chatService.getSuggestions(req.body);
  res.status(httpStatus.OK).send(result);
});

/** POST /v1/ai/search-courses — tìm khóa học bằng AI. */
const searchCourses = catchAsync(async (req, res) => {
  const result = await chatService.searchCourses({
    query: req.body.query,
    top_k: req.body.topK || 5,
  });
  res.status(httpStatus.OK).send(result);
});

module.exports = {
  getOrCreateSession,
  listSessions,
  getSessionMessages,
  archiveSession,
  sendMessage,
  streamMessage,
  getSuggestions,
  searchCourses,
};
