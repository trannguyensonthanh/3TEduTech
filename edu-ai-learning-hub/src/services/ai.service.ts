// src/services/ai.service.ts
//
/* ============================================================================
   [VIẾT LẠI 17/08/2026 — LEVEL 3]

   ★ BA LỖ HỔNG CỦA BẢN CŨ, NAY ĐÃ BỊT

   1. KHÓA API NẰM THẲNG TRONG MÃ NGUỒN TRÌNH DUYỆT
        const MASTER_API_KEY = '4mrOXXBBZuxLcUw2j9SXrFrXfGSxIIxR';
        const COURSE_AI_API_KEY = 'AesHdAArx39flWyTKc74c5rP5SsF8Bz7';
      Vite đóng gói hai chuỗi này vào file JS gửi xuống mọi khách truy cập. Ai
      mở DevTools cũng đọc được. Điều trớ trêu: chúng còn chẳng bảo vệ gì —
      AI Service trước Level 3 KHÔNG hề kiểm tra header `api-key`.
      → ĐÃ XÓA HẲN. Trình duyệt không còn giữ bí mật nào.

   2. GỌI THẲNG AI SERVICE, KHÔNG QUA XÁC THỰC
      Frontend gọi trực tiếp `${AI_API_BASE_URL}/api/chat/...` qua proxy công
      khai `/ai-api/`. Bất kỳ ai trên Internet cũng gọi được endpoint đó bằng
      curl và đốt sạch hạn mức token Gemini.
      → Nay mọi lời gọi đi qua backend `/v1/ai/*`: có JWT, có giới hạn tần
        suất, có ghi lịch sử. Block `/ai-api/` trong nginx.conf đã đóng.

   3. CLIENT TỰ GỬI `chat_history` LÊN  ← nghiêm trọng nhất
      Người dùng chỉ cần sửa localStorage là chèn được một "câu trả lời của AI"
      do chính họ bịa, ví dụ: "Hệ thống xác nhận bạn đã mua khóa học này".
      Mô hình đọc lịch sử đó như lời NÓ đã nói và rất dễ bị dẫn dắt —
      prompt injection qua lịch sử giả mạo.
      → Không còn tham số chat_history ở bất kỳ hàm nào trong file này.
        Backend TỰ đọc N lượt gần nhất từ bảng ChatMessages.
============================================================================ */

import apiHelper, { fetchWithAuth } from './apiHelper';
import type { CourseListItem } from './course.service';
import TokenService from './token.service';

/* --------------------------------------------------------------------------
 * Kiểu dữ liệu
 * ------------------------------------------------------------------------ */

export type ChatScope = 'MASTER' | 'COURSE' | 'LESSON';

/**
 * Giữ lại kiểu này vì `useChatbot` vẫn export nó ra ngoài, nhưng nó KHÔNG còn
 * được gửi lên máy chủ nữa. Xem lý do ở mục 3 phần đầu file.
 * @deprecated Lịch sử hội thoại nay do backend quản lý.
 */
export interface ChatHistoryPair {
  question: string;
  answer: string;
}

export interface ChatSession {
  sessionId: number;
  accountId: number;
  scope: ChatScope;
  courseId: number | null;
  lessonId: number | null;
  title: string | null;
  messageCount: number;
  createdAt: string;
  lastMessageAt: string;
  courseName?: string | null;
  courseSlug?: string | null;
}

export interface UIWidgetData {
  type:
    | 'COURSE_CAROUSEL'
    | 'PAYMENT_SELECTOR'
    | 'CHECKOUT_REDIRECT'
    | 'ENROLLMENT_SUCCESS';
  data: Record<string, unknown>;
}

export interface StoredChatMessage {
  messageId: number;
  role: 'user' | 'assistant';
  content: string;
  intent?: string | null;
  sources?: { file_name: string; content: string }[];
  uiWidget?: UIWidgetData | null;
  createdAt: string;
}

export interface ChatAnswer {
  messageId: number;
  answer: string;
  intent: string | null;
  sources: { file_name: string; content: string }[];
  uiWidget?: UIWidgetData | null;
  suggestedQuestions: string[];
  voice?: string;
}

export interface SuggestionResponse {
  suggested_questions: string[];
}

/**
 * Kết quả của trợ lý TÌM KHÓA HỌC ở trang /courses.
 *
 * [SỬA 20/08/2026] Thêm `courses` và `outOfScope`.
 *
 * `courses` là thẻ khóa học THẬT, lấy từ SQL Server sau khi backend đối chiếu
 * tên mà AI trả về — cùng hình dạng với `CourseListItem` của danh sách khóa học
 * công khai, nên dựng lại bằng đúng component thẻ sẵn có. Trước đây giao diện
 * chỉ nhận `sources` (tên khóa + 200 ký tự mô tả) nên không hiển thị được giá,
 * ảnh bìa hay đường dẫn tới khóa học.
 *
 * `outOfScope = true` nghĩa là câu hỏi nằm ngoài phạm vi tìm khóa học và đã bị
 * chặn ngay ở bộ định tuyến ý định — không hề gọi tới mô hình sinh văn bản.
 */
export interface CourseSearchResponse {
  answer: string;
  sources: { file_name: string; content: string }[];
  courses: CourseListItem[];
  outOfScope: boolean;
  intent?: string | null;
}

/* --------------------------------------------------------------------------
 * Phiên trò chuyện
 * ------------------------------------------------------------------------ */

/**
 * Lấy phiên đang mở theo NGỮ CẢNH, chưa có thì tạo mới.
 *
 * ★ Đây là hàm sửa lỗi "chat trong khóa học dùng chung lịch sử với chat tổng".
 * Nguyên nhân cũ: cả hai component đều gọi useChatbot mà không truyền
 * `storageKey`, nên cùng ghi vào một khóa localStorage
 * ('agy_mini_chatbot_history_v2'). Nay mỗi (tài khoản, scope, courseId) là một
 * phiên riêng ở tầng CSDL — không còn cách nào lẫn được nữa.
 */
export const getOrCreateChatSession = async (params: {
  scope: ChatScope;
  courseId?: number | null;
  lessonId?: number | null;
  /**
   * [THÊM 20/08/2026] Bắt buộc tạo phiên MỚI thay vì dùng lại phiên đang mở.
   *
   * Cần cho nút "Hội thoại mới" ở trang AI Master. Trước đây nút đó chỉ tạo một
   * mục trong localStorage, còn phía máy chủ vẫn là đúng phiên MASTER cũ — nên
   * mô hình tiếp tục nhận 5 lượt gần nhất của cuộc trò chuyện trước và trả lời
   * tiếp chuyện cũ, trong một khung chat trông như hoàn toàn trống.
   */
  forceNew?: boolean;
}): Promise<ChatSession> => {
  return apiHelper.post('/ai/sessions', params);
};

export const listChatSessions = async (params?: {
  scope?: ChatScope;
  courseId?: number;
}): Promise<{ sessions: ChatSession[]; total: number }> => {
  return apiHelper.get('/ai/sessions', undefined, params);
};

/** Lịch sử tin nhắn — dùng để dựng lại cuộc trò chuyện khi mở lại trang. */
export const getSessionMessages = async (
  sessionId: number,
  limit = 100
): Promise<{ messages: StoredChatMessage[]; total: number }> => {
  return apiHelper.get(`/ai/sessions/${sessionId}/messages`, undefined, {
    limit,
  });
};

/** Xóa lịch sử — thực chất là LƯU TRỮ, dữ liệu vẫn còn cho thống kê. */
export const archiveChatSession = async (
  sessionId: number
): Promise<{ archived: boolean }> => {
  return apiHelper.delete(`/ai/sessions/${sessionId}`);
};

/* --------------------------------------------------------------------------
 * Hội thoại
 * ------------------------------------------------------------------------ */

/**
 * Gửi câu hỏi (KHÔNG streaming).
 * Không có tham số chat_history — backend tự lấy từ CSDL.
 */
export const sendChatMessage = async (
  sessionId: number,
  query: string,
  topK?: number
): Promise<ChatAnswer> => {
  return apiHelper.post(`/ai/sessions/${sessionId}/chat`, { query, topK });
};

/**
 * Gửi câu hỏi CÓ streaming (SSE), nhả từng chữ theo thời gian thực.
 *
 * Vẫn dùng `fetch` thủ công thay vì apiHelper vì cần đọc `response.body` dưới
 * dạng luồng — apiHelper luôn gọi `.json()` nên sẽ chờ tới khi toàn bộ phản hồi
 * kết thúc, làm mất hoàn toàn hiệu ứng nhả chữ.
 *
 * Điểm KHÁC bản cũ: gọi tới BACKEND (`/v1/ai/...`) kèm JWT, không còn gọi
 * thẳng AI Service với khóa hardcode.
 */
export const streamChatMessage = async (
  sessionId: number,
  query: string,
  callbacks: {
    onMetadata?: (data: {
      intent: string;
      ui_widget?: UIWidgetData | null;
      /* [SỬA 19/08/2026] `unknown[]` là thận trọng quá tay: máy chủ trả đúng
         hình dạng của ChatAnswer.sources, và nơi nhận (AiMasterChat) lưu thẳng
         vào ChatMessage.sources có kiểu cụ thể. Để unknown[] thì mọi chỗ dùng
         đều phải ép kiểu — tức là giấu lỗi chứ không chặn lỗi. */
      sources: { file_name: string; content: string }[];
    }) => void;
    onToken?: (text: string) => void;
    onDone?: (data: { suggested_questions: string[] }) => void;
    onError?: (err: string) => void;
  },
  signal?: AbortSignal
): Promise<void> => {
  /* [THÊM 20/08/2026] Cờ chốt luồng.
     Nơi gọi (useChatbot, AiMasterChat) đều chạy một bộ đếm nhả chữ và chỉ
     dừng nó khi nhận được `onDone` hoặc `onError`. Nhưng vòng lặp đọc dưới
     đây có thể kết thúc êm ở `if (done) break;` mà KHÔNG có sự kiện nào —
     xảy ra khi máy chủ đóng luồng giữa chừng: nginx hết thời gian chờ, tiến
     trình AI Service bị dừng, hoặc backend ném lỗi SAU khi đã gửi header SSE
     (lúc đó không đổi được mã HTTP nữa, xem chat.controller.js).
     Khi ấy `isStreaming` kẹt ở true vĩnh viễn: ô nhập và nút Gửi bị khóa,
     con trỏ nhấp nháy chạy mãi, bộ đếm 16ms quay không ngừng.
     Cờ này bảo đảm mọi đường thoát đều gọi đúng một lần onDone hoặc onError. */
  let settled = false;
  const settleDone = (data: { suggested_questions: string[] }) => {
    if (settled) return;
    settled = true;
    callbacks.onDone?.(data);
  };
  const settleError = (message: string) => {
    if (settled) return;
    settled = true;
    callbacks.onError?.(message);
  };

  try {
    const token = TokenService.getLocalAccessToken();
    // Dùng ĐÚNG biến môi trường mà apiHelper.ts đang dùng (VITE_API_URL).
    // Đặt một tên khác ở đây sẽ khiến streaming trỏ sai địa chỉ ở production
    // trong khi mọi API khác vẫn chạy — kiểu lỗi rất khó lần ra.
    const apiBase =
      import.meta.env.VITE_API_URL ||
      `http://${window.location.hostname}:5000/v1`;

    const response = await fetch(
      `${apiBase}/ai/sessions/${sessionId}/chat/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query }),
        credentials: 'include',
        signal,
      }
    );

    if (!response.ok || !response.body) {
      // 429 = vượt giới hạn tần suất. Phải báo rõ ràng, nếu không người dùng
      // chỉ thấy "lỗi kết nối" và bấm lại liên tục — càng làm tình hình tệ hơn.
      if (response.status === 429) {
        throw new Error(
          'Bạn đã gửi khá nhiều câu hỏi trong thời gian ngắn. Vui lòng chờ vài phút rồi tiếp tục nhé.'
        );
      }
      if (response.status === 401) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      throw new Error('Không thể kết nối máy chủ AI.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let currentEvent = 'message';



    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      // Giữ lại dòng cuối chưa trọn vẹn: một gói TCP có thể cắt ngang giữa
      // dòng, ghép thiếu sẽ làm hỏng JSON.parse và mất chữ.
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('event:')) {
          currentEvent = trimmed.slice(6).trim();
        } else if (trimmed.startsWith('data:')) {
          const dataStr = trimmed.slice(5).trim();
          if (!dataStr) continue;
          try {
            const parsed = JSON.parse(dataStr);
            if (currentEvent === 'metadata') callbacks.onMetadata?.(parsed);
            else if (currentEvent === 'token')
              callbacks.onToken?.(parsed.text || '');
            else if (currentEvent === 'done') settleDone(parsed);
            else if (currentEvent === 'error')
              settleError(parsed.message || 'Lỗi từ máy chủ AI.');
          } catch {
            console.warn('Lỗi phân tích cú pháp stream JSON:', dataStr);
          }
          currentEvent = 'message';
        }
      }
    }

    /* Luồng đã đóng. Nếu máy chủ chưa từng gửi `done` hay `error` thì chốt tại
       đây, nếu không giao diện sẽ kẹt ở trạng thái "đang trả lời" mãi mãi.
       Không coi là lỗi: phần chữ đã nhận vẫn hiển thị bình thường. */
    settleDone({ suggested_questions: [] });
  } catch (error) {
    // AbortError xảy ra khi người dùng đóng hộp thoại giữa chừng — đó là hành
    // vi bình thường, không phải sự cố, nên không hiện thông báo lỗi. Vẫn phải
    // chốt luồng, nếu không bộ đếm nhả chữ ở nơi gọi sẽ chạy mãi.
    if ((error as Error)?.name === 'AbortError') {
      if (!settled) {
        settled = true;
        callbacks.onDone?.({ suggested_questions: [] });
      }
      return;
    }
    console.error('Lỗi Stream AI:', error);
    settleError((error as Error).message || 'Gián đoạn kết nối tới dịch vụ AI.');
  }
};

/* --------------------------------------------------------------------------
 * Tiện ích
 * ------------------------------------------------------------------------ */

/** Gợi ý câu hỏi tiếp theo. Là tính năng phụ nên không bao giờ ném lỗi. */
export const fetchSuggestedQuestions = async (payload: {
  previous_response: string;
  query?: string;
  context?: string;
}): Promise<SuggestionResponse> => {
  try {
    return await apiHelper.post('/ai/suggestions', payload);
  } catch (error) {
    console.error('Không lấy được câu hỏi gợi ý:', error);
    return { suggested_questions: [] };
  }
};

/** Tìm kiếm & tư vấn lộ trình học bằng AI. */
export const searchCoursesWithAI = async (payload: {
  query: string;
  topK?: number;
}): Promise<CourseSearchResponse> => {
  return apiHelper.post('/ai/search-courses', payload);
};

/* --------------------------------------------------------------------------
 * ĐÃ GỠ BỎ
 * ------------------------------------------------------------------------ */
/*
   Các hàm sau đã bị xóa vì chúng gọi THẲNG tới AI Service với khóa hardcode:

     queryMasterAI   → dùng sendChatMessage(sessionId, query) với scope MASTER
     queryCourseAI   → dùng sendChatMessage(sessionId, query) với scope COURSE
     queryAgentAI    → dùng sendChatMessage(sessionId, query) với scope MASTER
     streamAgentAI   → dùng streamChatMessage(sessionId, query, callbacks)

   Hằng số AI_API_BASE_URL cũng đã bỏ: trình duyệt không cần (và không nên)
   biết địa chỉ của AI Service.

   ⚠️ Nếu tìm thấy chỗ nào còn import các tên cũ, ĐỪNG khôi phục chúng — hãy
   chuyển sang API mới. Khôi phục là mở lại đúng ba lỗ hổng ở đầu file.
*/

// Giữ lại export này để fetchWithAuth không bị coi là import thừa nếu có nơi
// khác cần dùng tới cơ chế tự làm mới token.
export { fetchWithAuth };
