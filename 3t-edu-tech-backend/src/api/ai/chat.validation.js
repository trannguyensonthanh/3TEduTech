// File: src/api/ai/chat.validation.js
// [THÊM 17/08/2026 — LEVEL 3]

const Joi = require('joi');

const scope = Joi.string().valid('MASTER', 'COURSE', 'LESSON');

/**
 * Độ dài câu hỏi tối đa.
 *
 * Không phải con số tùy tiện: câu hỏi đi thẳng vào prompt của mô hình, mà
 * token đầu vào là tiền. Một request 100.000 ký tự vừa tốn kém vừa có thể đẩy
 * phần chỉ dẫn hệ thống (system prompt) ra khỏi cửa sổ ngữ cảnh — một kỹ thuật
 * prompt injection kinh điển gọi là "context flooding". 4000 ký tự đủ rộng cho
 * mọi câu hỏi thật của học viên, kể cả khi dán kèm một đoạn mã.
 */
const MAX_QUERY_LENGTH = 4000;

const getOrCreateSession = {
  body: Joi.object().keys({
    scope: scope.required(),
    courseId: Joi.number().integer().allow(null),
    lessonId: Joi.number().integer().allow(null),
    /* [THÊM 20/08/2026] Bắt buộc tạo phiên MỚI thay vì dùng lại phiên đang mở.
       Phục vụ nút "Hội thoại mới" ở trang AI Master — trước đây nút đó chỉ tạo
       một mục trong localStorage còn phía máy chủ vẫn là phiên cũ, nên mô hình
       tiếp tục nhận lịch sử của cuộc trò chuyện trước trong một khung chat
       trông như hoàn toàn trống. */
    forceNew: Joi.boolean().optional(),
  }),
};

const listSessions = {
  query: Joi.object().keys({
    scope: scope.optional(),
    courseId: Joi.number().integer().optional(),
  }),
};

const getSessionMessages = {
  params: Joi.object().keys({
    sessionId: Joi.number().integer().required(),
  }),
  query: Joi.object().keys({
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),
};

const archiveSession = {
  params: Joi.object().keys({
    sessionId: Joi.number().integer().required(),
  }),
};

/* ============================================================================
   ★ ĐIỂM QUAN TRỌNG NHẤT CỦA FILE NÀY

   Schema body KHÔNG có trường `chat_history`, và Joi mặc định TỪ CHỐI mọi khóa
   lạ. Nghĩa là client cố gửi lịch sử hội thoại lên sẽ nhận thẳng lỗi 400 chứ
   không phải bị âm thầm bỏ qua.

   Chọn báo lỗi thay vì bỏ qua là có chủ đích: nếu lặng lẽ lược bỏ, một ngày
   nào đó có người sửa frontend gửi lại chat_history và tưởng nó vẫn hoạt động
   — lỗ hổng prompt injection quay lại mà không ai hay. Lỗi 400 rõ ràng buộc
   người viết mã phải đọc lại lý do.

   Lịch sử hội thoại nay do backend TỰ đọc từ CSDL (chat.service.buildHistoryFromDb).
============================================================================ */
const sendMessage = {
  params: Joi.object().keys({
    sessionId: Joi.number().integer().required(),
  }),
  body: Joi.object().keys({
    query: Joi.string().trim().min(1).max(MAX_QUERY_LENGTH).required().messages({
      'string.max': `Câu hỏi quá dài (tối đa ${MAX_QUERY_LENGTH} ký tự).`,
      'string.empty': 'Vui lòng nhập câu hỏi.',
    }),
    topK: Joi.number().integer().min(1).max(50).optional(),
  }),
};

const getSuggestions = {
  body: Joi.object().keys({
    previous_response: Joi.string().max(20000).required(),
    query: Joi.string().max(MAX_QUERY_LENGTH).allow('').optional(),
    context: Joi.string().max(20000).allow('').optional(),
  }),
};

const searchCourses = {
  body: Joi.object().keys({
    query: Joi.string().trim().min(1).max(MAX_QUERY_LENGTH).required(),
    topK: Joi.number().integer().min(1).max(20).optional(),
  }),
};

module.exports = {
  getOrCreateSession,
  listSessions,
  getSessionMessages,
  archiveSession,
  sendMessage,
  getSuggestions,
  searchCourses,
  MAX_QUERY_LENGTH,
};
