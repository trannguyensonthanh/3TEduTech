/* eslint-disable @typescript-eslint/no-explicit-any */
// src/hooks/useChatbot.ts
//
/* ============================================================================
   [VIẾT LẠI 17/08/2026 — LEVEL 3]

   ★ LỖI ĐÃ SỬA: CHAT KHÓA HỌC DÙNG CHUNG LỊCH SỬ VỚI CHAT TỔNG

   Bản cũ lưu hội thoại vào localStorage với khóa mặc định
   DEFAULT_STORAGE_KEY = 'agy_mini_chatbot_history_v2'. Cả hai nơi gọi hook —
   ChatbotUI.tsx (chatbot tổng ở trang chủ) và AIAssistantDialog.tsx (trợ lý
   trong khóa học) — đều KHÔNG truyền `storageKey` riêng, nên cùng ghi vào một
   chỗ. Hệ quả: đang hỏi trợ lý khóa "Lập trình Python" lại thấy AI nhắc tới
   cuộc trò chuyện tư vấn mua hàng ở trang chủ, và ngược lại.

   Cách sửa KHÔNG phải là đặt hai storageKey khác nhau. Làm vậy chỉ chữa triệu
   chứng, còn ba vấn đề gốc vẫn nguyên:
     • Mất sạch khi người dùng xóa cache trình duyệt.
     • Không đồng bộ giữa máy tính và điện thoại.
     • Client tự gửi lịch sử lên server → sửa localStorage là chèn được câu trả
       lời giả của AI (prompt injection).

   → Nay lịch sử nằm trong CSDL, mỗi (tài khoản, scope, courseId) một phiên
     riêng, và client KHÔNG gửi lịch sử lên nữa.
============================================================================ */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  getOrCreateChatSession,
  getSessionMessages,
  archiveChatSession,
  sendChatMessage,
  streamChatMessage,
  fetchSuggestedQuestions,
  type ChatScope,
  type UIWidgetData,
} from '@/services/ai.service';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  sources?: { file_name: string; content: string }[];
  suggestedQuestions?: string[];
  voice?: string;
  isFallbackPrompt?: boolean;
  originalQuery?: string;
  uiWidget?: UIWidgetData | null;
}

/** @deprecated Lịch sử nay do backend quản lý; kiểu này chỉ còn để tương thích import cũ. */
export interface ChatHistoryPair {
  question: string;
  answer: string;
}

interface UseChatbotOptions {
  /** Tin nhắn chào mừng, chỉ hiện khi phiên chưa có tin nhắn nào. */
  initialMessages?: ChatMessage[];
  /** Ngữ cảnh hội thoại. Đây là thứ tách biệt chat tổng với chat khóa học. */
  scope?: ChatScope;
  courseId?: number | null;
  lessonId?: number | null;
  useStreaming?: boolean;
  /**
   * Chỉ khởi tạo phiên khi = true.
   * Hộp thoại trợ lý AI nằm sẵn trong cây React nhưng thường đang đóng; không
   * có cờ này thì mỗi lần mở trang học là tạo một phiên chat vô ích.
   */
  enabled?: boolean;
}

export const useChatbot = ({
  initialMessages,
  scope = 'MASTER',
  courseId = null,
  lessonId = null,
  useStreaming = true,
  enabled = true,
}: UseChatbotOptions) => {
  /* [THÊM 20/08/2026] `lessonId` chỉ có ý nghĩa với scope LESSON.
     Với scope COURSE, hook vẫn nhận `lessonId` từ trang học (nó đổi mỗi lần
     người dùng chuyển bài) nhưng lại ép về null khi gọi API. Vì biến đó nằm
     trong mảng phụ thuộc của hiệu ứng khởi tạo, mỗi lần chuyển bài là một lượt
     POST /ai/sessions + GET /messages hoàn toàn thừa (đều tính vào giới hạn tần
     suất), kèm một lần dựng lại mảng tin nhắn — cuốn mất lời chào và các nút
     gợi ý đang hiển thị giữa chừng cuộc trò chuyện. */
  const effectiveLessonId = scope === 'LESSON' ? lessonId : null;

  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages || []
  );
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Refs cho hệ thống Typewriter Token Buffer (nhả chữ mượt)
  const tokenQueueRef = useRef<string[]>([]);
  const typewriterTimerRef = useRef<any>(null);
  const streamDoneDataRef = useRef<{
    isDone: boolean;
    suggestedQuestions?: string[];
  }>({ isDone: false });
  const abortRef = useRef<AbortController | null>(null);

  /* ---------------------------------------------------------------------
     Khởi tạo phiên + nạp lịch sử từ CSDL
     ------------------------------------------------------------------- */
  useEffect(() => {
    if (!enabled) return undefined;
    // COURSE/LESSON bắt buộc có courseId; thiếu thì chờ chứ không gọi API để
    // nhận về lỗi 400.
    if (scope !== 'MASTER' && !courseId) return undefined;

    let active = true;
    setIsLoadingHistory(true);

    (async () => {
      try {
        const session = await getOrCreateChatSession({
          scope,
          courseId: scope === 'MASTER' ? null : courseId,
          lessonId: effectiveLessonId,
        });
        if (!active) return;
        setSessionId(session.sessionId);

        const { messages: stored } = await getSessionMessages(
          session.sessionId
        );
        if (!active) return;

        if (stored.length > 0) {
          setMessages(
            stored.map((m) => ({
              id: `db-${m.messageId}`,
              text: m.content,
              sender: m.role === 'user' ? 'user' : 'bot',
              sources: m.sources,
              uiWidget: m.uiWidget,
            }))
          );
        } else {
          // Phiên trống → hiện lời chào. Nếu luôn hiện lời chào kể cả khi đã có
          // lịch sử thì mỗi lần F5 lại thấy "Xin chào" chen giữa cuộc trò chuyện.
          setMessages(initialMessages || []);
        }
      } catch (error) {
        if (!active) return;
        console.error('Không khởi tạo được phiên chat:', error);
        // Vẫn hiện lời chào để khung chat không trống trơn; người dùng gửi tin
        // sẽ nhận thông báo lỗi cụ thể lúc đó.
        setMessages(initialMessages || []);
      } finally {
        if (active) setIsLoadingHistory(false);
      }
    })();

    return () => {
      active = false;
    };
    // initialMessages CỐ Ý không nằm trong mảng phụ thuộc: nơi gọi thường tạo
    // mảng đó ngay trong thân component nên nó có định danh mới mỗi lần render
    // — đưa vào đây sẽ tạo vòng lặp gọi API tạo phiên không dừng.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, scope, courseId, effectiveLessonId]);

  // Dọn timer và hủy stream đang chạy khi component bị gỡ.
  useEffect(() => {
    return () => {
      if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  /* ---------------------------------------------------------------------
     Xóa lịch sử
     ------------------------------------------------------------------- */
  const clearChatHistory = useCallback(async () => {
    if (sessionId) {
      try {
        // Backend chỉ ĐÁNH DẤU lưu trữ, không xóa dữ liệu — thống kê
        // vw_CourseChatInsights ("bài giảng nào gây nhiều thắc mắc nhất") sẽ
        // sai lệch nếu người dùng xóa được lịch sử thật.
        await archiveChatSession(sessionId);
      } catch (error) {
        console.error('Không lưu trữ được phiên chat:', error);
      }
    }
    setMessages(initialMessages || []);
    setSessionId(null);

    // Tạo lại phiên mới ngay để người dùng gõ tiếp được luôn.
    if (enabled && (scope === 'MASTER' || courseId)) {
      try {
        const session = await getOrCreateChatSession({
          scope,
          courseId: scope === 'MASTER' ? null : courseId,
          lessonId: effectiveLessonId,
        });
        setSessionId(session.sessionId);
      } catch (error) {
        console.error('Không tạo lại được phiên chat:', error);
      }
    }
  }, [sessionId, initialMessages, enabled, scope, courseId, effectiveLessonId]);

  /* ---------------------------------------------------------------------
     Câu hỏi gợi ý
     ------------------------------------------------------------------- */
  const loadSuggestions = useCallback(
    async (previousResponse: string, query: string, botMsgId: string) => {
      const data = await fetchSuggestedQuestions({
        previous_response: previousResponse,
        query,
      });
      if (!data.suggested_questions?.length) return;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMsgId
            ? { ...msg, suggestedQuestions: data.suggested_questions }
            : msg
        )
      );
    },
    []
  );

  /* ---------------------------------------------------------------------
     Gửi tin nhắn
     ------------------------------------------------------------------- */
  const addUserMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      if (!sessionId) {
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            text: 'Chưa kết nối được phiên trò chuyện. Vui lòng tải lại trang.',
            sender: 'bot',
          },
        ]);
        return;
      }

      // Xóa gợi ý cũ và thêm tin nhắn của người dùng.
      setMessages((prev) => [
        ...prev.map((msg) => ({
          ...msg,
          suggestedQuestions: [],
          isFallbackPrompt: false,
        })),
        { id: `user-${Date.now()}`, text: trimmed, sender: 'user' as const },
      ]);

      const botMsgId = `bot-${Date.now()}`;

      /* ★ KHÔNG dựng và KHÔNG gửi chat_history nữa.
         Bản cũ ghép mảng lịch sử từ state rồi gửi kèm mỗi request — chính là
         đường đi của prompt injection. Backend nay tự đọc 5 lượt gần nhất từ
         bảng ChatMessages, nơi người dùng không chạm tới được. */

      if (useStreaming) {
        setIsStreaming(true);
        setMessages((prev) => [
          ...prev,
          { id: botMsgId, text: '', sender: 'bot', suggestedQuestions: [] },
        ]);

        tokenQueueRef.current = [];
        if (typewriterTimerRef.current) {
          clearInterval(typewriterTimerRef.current);
          typewriterTimerRef.current = null;
        }
        streamDoneDataRef.current = { isDone: false };

        // Nhả chữ đều đặn ~60-70 ký tự/giây cho mượt mắt.
        typewriterTimerRef.current = setInterval(() => {
          if (tokenQueueRef.current.length > 0) {
            const count =
              tokenQueueRef.current.length > 80
                ? 8
                : tokenQueueRef.current.length > 30
                  ? 4
                  : 2;
            const chunk = tokenQueueRef.current.splice(0, count).join('');
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === botMsgId
                  ? { ...msg, text: (msg.text || '') + chunk }
                  : msg
              )
            );
          } else if (streamDoneDataRef.current.isDone) {
            clearInterval(typewriterTimerRef.current);
            typewriterTimerRef.current = null;
            setIsStreaming(false);
            const suggestions =
              streamDoneDataRef.current.suggestedQuestions || [];
            if (suggestions.length > 0) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === botMsgId
                    ? { ...msg, suggestedQuestions: suggestions }
                    : msg
                )
              );
            }
          }
        }, 16);

        abortRef.current?.abort();
        abortRef.current = new AbortController();

        await streamChatMessage(
          sessionId,
          trimmed,
          {
            onMetadata: (data) => {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === botMsgId
                    ? {
                        ...msg,
                        sources: data.sources as any,
                        uiWidget: data.ui_widget as any,
                      }
                    : msg
                )
              );
            },
            onToken: (tokenText) => {
              tokenQueueRef.current.push(...Array.from(tokenText));
            },
            onDone: (data) => {
              streamDoneDataRef.current = {
                isDone: true,
                suggestedQuestions: data.suggested_questions,
              };
            },
            onError: (err) => {
              streamDoneDataRef.current = { isDone: true };
              if (typewriterTimerRef.current) {
                clearInterval(typewriterTimerRef.current);
                typewriterTimerRef.current = null;
              }
              setIsStreaming(false);
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === botMsgId
                    ? {
                        ...msg,
                        // Nối vào phần đã nhả được thay vì thay thế: người dùng
                        // vẫn giữ được nửa câu trả lời đã nhận.
                        text: (msg.text || '') + `\n\n⚠️ ${err}`,
                      }
                    : msg
                )
              );
            },
          },
          abortRef.current.signal
        );
      } else {
        setIsSending(true);
        try {
          const data = await sendChatMessage(sessionId, trimmed);
          setMessages((prev) => [
            ...prev,
            {
              id: botMsgId,
              text: data.answer,
              sender: 'bot',
              sources: data.sources,
              suggestedQuestions: data.suggestedQuestions || [],
              voice: data.voice,
              uiWidget: data.uiWidget,
              originalQuery: trimmed,
            },
          ]);
          if (!data.suggestedQuestions?.length) {
            loadSuggestions(data.answer, trimmed, botMsgId);
          }
        } catch (error) {
          setMessages((prev) => [
            ...prev,
            {
              id: `error-${Date.now()}`,
              text: `Xin lỗi, tôi không thể trả lời lúc này: ${(error as Error).message}`,
              sender: 'bot',
            },
          ]);
        } finally {
          setIsSending(false);
        }
      }
    },
    [sessionId, useStreaming, loadSuggestions]
  );

  /**
   * Giữ lại để hai component gọi hook không phải sửa.
   * Cơ chế "hỏi lại bằng kiến thức tổng quát" cũ dựa trên cờ
   * `use_general_knowledge` gửi kèm request — nay backend không nhận trường đó
   * nữa (schema Joi từ chối khóa lạ), nên đơn giản là gửi lại câu hỏi.
   */
  const confirmFallback = useCallback(
    (originalQuery: string) => {
      setMessages((prev) => prev.filter((msg) => !msg.isFallbackPrompt));
      addUserMessage(originalQuery);
    },
    [addUserMessage]
  );

  const pushBotMessage = useCallback(
    (text: string, uiWidget?: UIWidgetData) => {
      setMessages((prev) => [
        ...prev,
        { id: `bot-${Date.now()}`, text, sender: 'bot', uiWidget },
      ]);
    },
    []
  );

  return {
    messages,
    setMessages,
    isTyping: isStreaming || isSending,
    isLoadingHistory,
    sessionId,
    addUserMessage,
    confirmFallback,
    pushBotMessage,
    clearChatHistory,
  };
};
