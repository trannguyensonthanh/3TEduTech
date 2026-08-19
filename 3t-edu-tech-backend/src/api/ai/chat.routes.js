// File: src/api/ai/chat.routes.js
// [THÊM 17/08/2026 — LEVEL 3]
//
// TẤT CẢ các route ở đây đều BẮT BUỘC đăng nhập.
//
// Trước Level 3, frontend gọi THẲNG tới AI Service qua proxy công khai
// `/ai-api/` với một `api-key` hardcode ngay trong mã nguồn trình duyệt. Ai mở
// DevTools cũng đọc được khóa đó — mà thực ra chẳng cần: AI Service không kiểm
// tra header ấy bao giờ. Kết quả là bất kỳ ai trên Internet cũng gọi được và
// đốt sạch hạn mức token Gemini.
//
// Nay mọi đường đi tới AI đều phải qua backend, và backend đòi JWT.

const express = require('express');
const validate = require('../../middlewares/validation.middleware');
const chatValidation = require('./chat.validation');
const chatController = require('./chat.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const {
  aiChatLimiter,
  aiSearchLimiter,
  aiSessionLimiter,
} = require('../../middlewares/rateLimit.middleware');

const router = express.Router();

/* --- Phiên trò chuyện --- */

router.post(
  '/sessions',
  authenticate,
  aiSessionLimiter,
  validate(chatValidation.getOrCreateSession),
  chatController.getOrCreateSession
);

router.get(
  '/sessions',
  authenticate,
  validate(chatValidation.listSessions),
  chatController.listSessions
);

// Khai báo TRƯỚC '/sessions/:sessionId' để đoạn cố định '/messages' không bị
// mẫu tham số nuốt mất.
router.get(
  '/sessions/:sessionId/messages',
  authenticate,
  validate(chatValidation.getSessionMessages),
  chatController.getSessionMessages
);

router.delete(
  '/sessions/:sessionId',
  authenticate,
  validate(chatValidation.archiveSession),
  chatController.archiveSession
);

/* --- Hội thoại --- */

router.post(
  '/sessions/:sessionId/chat',
  authenticate,
  aiChatLimiter,
  validate(chatValidation.sendMessage),
  chatController.sendMessage
);

/* Bản streaming.
   Dùng CÙNG bộ giới hạn tần suất với bản không streaming: hai đường dẫn khác
   nhau nhưng cùng tiêu tốn một lượt gọi mô hình. Nếu đếm riêng, người dùng chỉ
   cần luân phiên hai endpoint là có hạn mức gấp đôi. */
router.post(
  '/sessions/:sessionId/chat/stream',
  authenticate,
  aiChatLimiter,
  validate(chatValidation.sendMessage),
  chatController.streamMessage
);

/* --- Tiện ích --- */

router.post(
  '/suggestions',
  authenticate,
  aiSearchLimiter,
  validate(chatValidation.getSuggestions),
  chatController.getSuggestions
);

router.post(
  '/search-courses',
  authenticate,
  aiSearchLimiter,
  validate(chatValidation.searchCourses),
  chatController.searchCourses
);

module.exports = router;
