/* ============================================================================
 * aiClient.js
 * [THÊM 17/08/2026 — LEVEL 3]
 *
 * Điểm DUY NHẤT trong toàn backend được phép gọi sang AI Service.
 *
 * ----------------------------------------------------------------------------
 * VÌ SAO PHẢI GOM VỀ MỘT CHỖ
 *
 * Trước Level 3, AI Service KHÔNG kiểm tra xác thực gì cả — header `api-key`
 * mà frontend gửi lên bị bỏ qua hoàn toàn (đọc src/main.py: không có
 * dependency nào đọc header đó). Cộng với việc Nginx mở công khai `/ai-api/`,
 * bất kỳ ai trên Internet cũng gọi thẳng được và đốt sạch hạn mức token Gemini.
 *
 * Level 3 yêu cầu MỌI request tới AI Service phải mang header nội bộ. Nếu để
 * mỗi nơi tự gọi axios thì chỉ cần một chỗ quên header là thủng — mà lỗi kiểu
 * đó không hề gây triệu chứng ở môi trường dev (nơi thường tắt kiểm tra). Gom
 * về một module khiến việc quên trở nên bất khả thi.
 * ========================================================================== */

const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

/** Tên header. Phải khớp chính xác với phía AI Service (src/core/security.py). */
const INTERNAL_KEY_HEADER = 'x-internal-api-key';

let hasWarnedMissingKey = false;

/**
 * Header đính kèm mọi request sang AI Service.
 *
 * Nếu chưa cấu hình `AI_SERVICE_INTERNAL_KEY`, hàm vẫn trả về header rỗng và
 * ghi cảnh báo MỘT LẦN. Chọn cách này thay vì ném lỗi vì AI Service phía kia
 * cũng được thiết kế "chưa đặt khóa thì không kiểm tra" — hai bên cùng bỏ
 * trống thì hệ thống chạy y như trước Level 3, không ai bị chặn oan. Chỉ khi
 * CẢ HAI cùng đặt khóa thì lớp bảo vệ mới bật.
 */
const getInternalHeaders = () => {
  const key = config.aiService?.internalKey;
  if (!key) {
    if (!hasWarnedMissingKey) {
      hasWarnedMissingKey = true;
      logger.warn(
        '[AI Client] Chưa cấu hình AI_SERVICE_INTERNAL_KEY. AI Service đang chạy ở chế độ ' +
          'KHÔNG XÁC THỰC — bất kỳ ai truy cập được tới cổng 2111 đều gọi được. ' +
          'Hãy đặt cùng một giá trị ở cả backend (.env) và ai-service (.env).'
      );
    }
    return { 'Content-Type': 'application/json' };
  }
  return {
    'Content-Type': 'application/json',
    [INTERNAL_KEY_HEADER]: key,
  };
};

const baseUrl = () => config.aiServiceUrl;

/**
 * Gọi AI Agent (không streaming).
 * @param {object} payload - { query, chat_history, top_k }
 * @param {number} timeoutMs
 */
const postAgentAction = async (payload, timeoutMs = 60000) => {
  return axios.post(`${baseUrl()}/api/chat/agent-action`, payload, {
    headers: getInternalHeaders(),
    timeout: timeoutMs,
  });
};

/**
 * Gọi AI Agent ở chế độ streaming — trả về một Node.js Readable stream.
 *
 * ⚠️ `timeout` của axios áp cho việc NHẬN HEADER, không phải cho toàn bộ vòng
 * đời stream. Nếu đặt timeout ngắn ở đây, một câu trả lời dài đang nhả chữ
 * bình thường vẫn bị cắt giữa chừng. Vì vậy chỉ đặt đủ để phát hiện "AI Service
 * không phản hồi", còn phần thân stream để chạy tự do.
 */
const postAgentActionStream = async (payload, timeoutMs = 30000) => {
  return axios.post(`${baseUrl()}/api/chat/agent-action-stream`, payload, {
    headers: { ...getInternalHeaders(), Accept: 'text/event-stream' },
    timeout: timeoutMs,
    responseType: 'stream',
  });
};

/** Trợ lý AI trong phạm vi một khóa học (không streaming). */
const postCourseQuery = async (payload, timeoutMs = 60000) => {
  return axios.post(`${baseUrl()}/api/chat/course-query`, payload, {
    headers: getInternalHeaders(),
    timeout: timeoutMs,
  });
};

/** Gợi ý câu hỏi tiếp theo — tính năng phụ, timeout ngắn. */
const postSuggest = async (payload, timeoutMs = 15000) => {
  return axios.post(`${baseUrl()}/api/chat/suggest`, payload, {
    headers: getInternalHeaders(),
    timeout: timeoutMs,
  });
};

/** Tìm kiếm khóa học bằng AI. */
const postCourseSearch = async (payload, timeoutMs = 45000) => {
  return axios.post(`${baseUrl()}/api/search/courses`, payload, {
    headers: getInternalHeaders(),
    timeout: timeoutMs,
  });
};

/**
 * Gọi POST tới một đường dẫn bất kỳ của AI Service, có kèm khóa nội bộ.
 * Dùng cho các endpoint chưa có hàm chuyên dụng (ví dụ /api/chat/query mà
 * job nhắc nhở đang dùng), để không ai phải quay lại gọi axios trần.
 */
const post = async (path, payload, timeoutMs = 30000) => {
  return axios.post(`${baseUrl()}${path}`, payload, {
    headers: getInternalHeaders(),
    timeout: timeoutMs,
  });
};

/** Nạp tri thức vào ChromaDB (dùng bởi aiSync.service). */
const postIngest = async (path, payload, timeoutMs = 60000) => {
  return axios.post(`${baseUrl()}${path}`, payload, {
    headers: getInternalHeaders(),
    timeout: timeoutMs,
  });
};

/** Xóa tri thức khỏi ChromaDB. */
const deleteIngest = async (path, timeoutMs = 10000) => {
  return axios.delete(`${baseUrl()}${path}`, {
    headers: getInternalHeaders(),
    timeout: timeoutMs,
  });
};

/** Kiểm tra AI Service còn sống không. Endpoint /health là công khai. */
const checkHealth = async (timeoutMs = 3000) => {
  return axios.get(`${baseUrl()}/health`, { timeout: timeoutMs });
};

module.exports = {
  INTERNAL_KEY_HEADER,
  getInternalHeaders,
  post,
  postAgentAction,
  postAgentActionStream,
  postCourseQuery,
  postSuggest,
  postCourseSearch,
  postIngest,
  deleteIngest,
  checkHealth,
};
