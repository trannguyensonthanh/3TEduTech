/* eslint-disable @typescript-eslint/no-explicit-any */
// src/hooks/useChatbot.ts
import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  queryMasterAI,
  fetchSuggestedQuestions,
  QueryResponse,
} from '@/services/ai.service';

// --- INTERFACES ---
// Interface cho tin nhắn hiển thị trên UI
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  sources?: { file_name: string; content: string }[];
  suggestedQuestions?: string[];
  voice?: string; // Dữ liệu audio base64, nếu có
  isFallbackPrompt?: boolean;
  originalQuery?: string;
}

// Interface cho một cặp Q&A trong lịch sử chat gửi lên API
export interface ChatHistoryPair {
  question: string;
  answer: string;
}

interface UseChatbotOptions {
  initialMessages?: ChatMessage[];
  // Hàm query sẽ được truyền vào từ component, quyết định gọi AI nào
  queryFn: (payload: any) => Promise<QueryResponse>;
  // Context bổ sung, ví dụ như tên khóa học
  queryContext?: Record<string, any>;
}

export const useChatbot = ({
  initialMessages,
  queryFn,
  queryContext = {},
}: UseChatbotOptions) => {
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages || []
  );
  const { mutate: getSuggestions } = useMutation({
    mutationFn: fetchSuggestedQuestions,
    onSuccess: (data) => {
      if (data.suggested_questions.length >= 0) {
        // đang giả thôi còn thật ra là > 0
        setMessages((prev) => {
          console.log('Gợi ý câu hỏi:', data.suggested_questions);
          const lastMessageIndex = prev.length - 1;
          if (
            lastMessageIndex >= 0 &&
            prev[lastMessageIndex].sender === 'bot'
          ) {
            const updatedMessages = [...prev];
            updatedMessages[lastMessageIndex] = {
              ...updatedMessages[lastMessageIndex],
              suggestedQuestions: data.suggested_questions, // data.suggested_questions
            };

            return updatedMessages;
          }
          return prev;
        });
      }
    },
  });

  const { mutate: sendMessage, isPending: isTyping } = useMutation({
    mutationFn: queryFn,
    onSuccess: (data, variables) => {
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        text: data.answer,
        sender: 'bot',
        sources: data.sources,
        suggestedQuestions: [],
        voice: data.voice,
        isFallbackPrompt: data.is_fallback_prompt,
        originalQuery: variables.query,
      };
      // Thêm tin nhắn của bot vào trước
      setMessages((prev) => [...prev, botMessage]);

      // Sau đó mới gọi API gợi ý
      getSuggestions({
        previous_response: data.answer,
        query: variables.query.replace(/^duythai\s*/, ''),
      });
    },
    onError: (error) => {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        text: `Sorry, I ran into an error: ${(error as Error).message}`,
        sender: 'bot',
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  const addUserMessage = useCallback(
    (text: string, use_general_knowledge: boolean = false) => {
      if (!text.trim()) return;

      // Khi người dùng gửi tin nhắn mới, xóa gợi ý của tin nhắn cũ
      setMessages((prev) =>
        prev.map((msg) => ({ ...msg, suggestedQuestions: [], isFallbackPrompt: false }))
      );

      // Nếu không phải là confirm fallback (người dùng tự gõ)
      if (!use_general_knowledge) {
        const userMessage: ChatMessage = {
          id: `user-${Date.now()}`,
          text: text,
          sender: 'user',
        };
        // Cần cập nhật state messages ngay lập tức để có context cho API
        setMessages((prev) => [...prev, userMessage]);
      }

      // Tạo chat_history từ state messages mới nhất
      const currentMessages = use_general_knowledge ? messages : [...messages, { id: '', text, sender: 'user' as const }];
      const chat_history: ChatHistoryPair[] = [];
      for (let i = 0; i < currentMessages.length - 1; i++) {
        // Bỏ qua tin nhắn cuối cùng của user
        if (
          currentMessages[i].sender === 'user' &&
          i + 1 < currentMessages.length &&
          currentMessages[i + 1].sender === 'bot'
        ) {
          chat_history.push({
            question: currentMessages[i].text,
            answer: currentMessages[i + 1].text,
          });
          i++;
        }
      }
      const recent_history = chat_history.slice(-3);

      sendMessage({
        query: text,
        chat_history: recent_history,
        use_general_knowledge, // Pass this to the queryFn
        ...queryContext, // Thêm context nếu có
      });
    },
    [messages, sendMessage, getSuggestions, queryContext]
  );
  
  const confirmFallback = useCallback((originalQuery: string) => {
    // Xóa tin nhắn bot cuối cùng (chứa fallback prompt) để thay thế bằng câu trả lời mới
    setMessages((prev) => prev.filter(msg => !msg.isFallbackPrompt));
    addUserMessage(originalQuery, true);
  }, [addUserMessage]);

  return {
    messages,
    isTyping,
    addUserMessage,
    confirmFallback,
  };
};
