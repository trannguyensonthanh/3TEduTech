# -*- coding: utf-8 -*-
import io, sys
ROOT = sys.argv[1]
def read(p): return io.open(ROOT + p, encoding='utf-8').read()
def write(p, s): io.open(ROOT + p, 'w', encoding='utf-8', newline='\n').write(s)
def sub(s, old, new, label):
    assert s.count(old) == 1, 'KHONG TIM THAY: ' + label
    return s.replace(old, new)

SKIP = """
p = '/edu-ai-learning-hub/src/components/chatbot/ChatbotUI.tsx'
s = read(p)
s = sub(s,
  "  const { messages, isTyping, addUserMessage, confirmFallback, pushBotMessage, clearChatHistory } = useChatbot({",
  "  const {\n"
  "    messages,\n"
  "    isTyping,\n"
  "    isLoadingHistory,\n"
  "    sessionId,\n"
  "    addUserMessage,\n"
  "    confirmFallback,\n"
  "    pushBotMessage,\n"
  "    clearChatHistory,\n"
  "  } = useChatbot({",
  'destructure useChatbot')
write(p, s)
print('ChatbotUI.tsx (phan 2) OK')
"""

# ============ ai.service.ts : L6 — stream ket thuc ma khong co `done` ============
p = '/edu-ai-learning-hub/src/services/ai.service.ts'
s = read(p)
OLD = """    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let currentEvent = 'message';"""
NEW = """    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let currentEvent = 'message';

    /* [THÊM 20/08/2026] Cờ chốt luồng.

       Nơi gọi (useChatbot, AiMasterChat) đều chạy một bộ đếm nhả chữ và chỉ
       dừng nó khi nhận được `onDone` hoặc `onError`. Nhưng vòng lặp đọc dưới
       đây có thể kết thúc êm ở `if (done) break;` mà KHÔNG có sự kiện nào —
       xảy ra khi máy chủ đóng luồng giữa chừng: nginx hết thời gian chờ, tiến
       trình AI Service bị dừng, hoặc backend ném lỗi SAU khi đã gửi header SSE
       (lúc đó không đổi được mã HTTP nữa, xem chat.controller.js).

       Khi ấy `isStreaming` kẹt ở true vĩnh viễn: ô nhập và nút Gửi bị khóa,
       con trỏ nhấp nháy chạy mãi, bộ đếm 16ms quay không ngừng. Người dùng
       bắt buộc phải tải lại trang.

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
    };"""
s = sub(s, OLD, NEW, 'khoi reader')

OLD2 = """            if (currentEvent === 'metadata') callbacks.onMetadata?.(parsed);
            else if (currentEvent === 'token')
              callbacks.onToken?.(parsed.text || '');
            else if (currentEvent === 'done') callbacks.onDone?.(parsed);
            else if (currentEvent === 'error')
              callbacks.onError?.(parsed.message || 'Lỗi từ máy chủ AI.');"""
NEW2 = """            if (currentEvent === 'metadata') callbacks.onMetadata?.(parsed);
            else if (currentEvent === 'token')
              callbacks.onToken?.(parsed.text || '');
            else if (currentEvent === 'done') settleDone(parsed);
            else if (currentEvent === 'error')
              settleError(parsed.message || 'Lỗi từ máy chủ AI.');"""
s = sub(s, OLD2, NEW2, 'dispatch su kien')

OLD3 = """          currentEvent = 'message';
        }
      }
    }
  } catch (error) {
    // AbortError xảy ra khi người dùng đóng hộp thoại giữa chừng — đó là hành
    // vi bình thường, không phải sự cố, nên không hiện thông báo lỗi.
    if ((error as Error)?.name === 'AbortError') return;
    console.error('Lỗi Stream AI:', error);
    callbacks.onError?.(
      (error as Error).message || 'Gián đoạn kết nối tới dịch vụ AI.'
    );
  }
};"""
NEW3 = """          currentEvent = 'message';
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
};"""
s = sub(s, OLD3, NEW3, 'khoi catch cuoi ham stream')

# forceNew cho getOrCreateChatSession
OLD4 = """export const getOrCreateChatSession = async (params: {
  scope: ChatScope;
  courseId?: number | null;
  lessonId?: number | null;
}): Promise<ChatSession> => {
  return apiHelper.post('/ai/sessions', params);
};"""
NEW4 = """export const getOrCreateChatSession = async (params: {
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
};"""
s = sub(s, OLD4, NEW4, 'getOrCreateChatSession')
write(p, s)
print('ai.service.ts OK')
