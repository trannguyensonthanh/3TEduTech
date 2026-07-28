/* eslint-disable @typescript-eslint/no-explicit-any */
// src/hooks/useChatbot.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  queryMasterAI,
  fetchSuggestedQuestions,
  QueryResponse,
  AgentResponse,
  UIWidgetData,
  streamAgentAI,
} from '@/services/ai.service';

// --- INTERFACES ---
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

export interface ChatHistoryPair {
  question: string;
  answer: string;
}

interface UseChatbotOptions {
  initialMessages?: ChatMessage[];
  queryFn: (payload: any) => Promise<any>;
  queryContext?: Record<string, any>;
  useStreaming?: boolean;
  storageKey?: string;
}

const DEFAULT_STORAGE_KEY = 'agy_mini_chatbot_history_v2';

export const useChatbot = ({
  initialMessages,
  queryFn,
  queryContext = {},
  useStreaming = true,
  storageKey = DEFAULT_STORAGE_KEY,
}: UseChatbotOptions) => {
  // 1. Persistent LocalStorage Recovery: Giữ lịch sử không bao giờ biến mất khi reload hay chuyển trang
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading chat history from localStorage:', e);
    }
    return initialMessages || [];
  });

  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  // Refs cho hệ thống Typewriter Token Buffer (Nhả chữ mượt mà như lụa)
  const tokenQueueRef = useRef<string[]>([]);
  const typewriterTimerRef = useRef<any>(null);
  const streamDoneDataRef = useRef<{ isDone: boolean; suggestedQuestions?: string[] }>({ isDone: false });

  // Save to LocalStorage on every message update
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (e) {
      console.error('Error saving chat history to localStorage:', e);
    }
  }, [messages, storageKey]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
    };
  }, []);

  const clearChatHistory = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.error(e);
    }
    setMessages(initialMessages || []);
  }, [storageKey, initialMessages]);

  const { mutate: getSuggestions } = useMutation({
    mutationFn: fetchSuggestedQuestions,
    onSuccess: (data) => {
      if (data.suggested_questions?.length > 0) {
        setMessages((prev) => {
          const lastMessageIndex = prev.length - 1;
          if (
            lastMessageIndex >= 0 &&
            prev[lastMessageIndex].sender === 'bot'
          ) {
            const updatedMessages = [...prev];
            updatedMessages[lastMessageIndex] = {
              ...updatedMessages[lastMessageIndex],
              suggestedQuestions: data.suggested_questions,
            };
            return updatedMessages;
          }
          return prev;
        });
      }
    },
  });

  const { mutate: sendMessage, isPending: isMutationPending } = useMutation({
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
        uiWidget: data.ui_widget,
      };
      setMessages((prev) => [...prev, botMessage]);
      getSuggestions({
        previous_response: data.answer,
        query: variables.query.replace(/^duythai\s*/, ''),
      });
    },
    onError: (error) => {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        text: `Xin lỗi, tôi không thể trả lời lúc này: ${(error as Error).message}`,
        sender: 'bot',
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  const isTyping = isMutationPending || isStreaming;

  const addUserMessage = useCallback(
    (text: string, use_general_knowledge: boolean = false) => {
      if (!text.trim()) return;

      // Xóa các câu hỏi gợi ý cũ của AI khi người dùng gửi câu hỏi mới
      setMessages((prev) =>
        prev.map((msg) => ({ ...msg, suggestedQuestions: [], isFallbackPrompt: false }))
      );

      if (!use_general_knowledge) {
        const userMessage: ChatMessage = {
          id: `user-${Date.now()}`,
          text: text,
          sender: 'user',
        };
        setMessages((prev) => [...prev, userMessage]);
      }

      const currentMessages = use_general_knowledge ? messages : [...messages, { id: '', text, sender: 'user' as const }];
      const chat_history: ChatHistoryPair[] = [];
      for (let i = 0; i < currentMessages.length - 1; i++) {
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
      const recent_history = chat_history.slice(-5);

      if (useStreaming && !use_general_knowledge) {
        const botMsgId = `bot-${Date.now()}`;
        setIsStreaming(true);

        setMessages((prev) => [
          ...prev,
          {
            id: botMsgId,
            text: '',
            sender: 'bot',
            suggestedQuestions: [],
          },
        ]);

        // Reset typewriter buffer queue for new response
        tokenQueueRef.current = [];
        if (typewriterTimerRef.current) {
          clearInterval(typewriterTimerRef.current);
          typewriterTimerRef.current = null;
        }
        streamDoneDataRef.current = { isDone: false };

        // Bật luồng interval 15ms (~60-70 chữ/giây) để nhả từng ký tự đều đặn mượt mà
        typewriterTimerRef.current = setInterval(() => {
          if (tokenQueueRef.current.length > 0) {
            // Tối ưu số chữ nén ra theo độ dài buffer để vừa mịn vừa kịp tốc độ stream
            const count = tokenQueueRef.current.length > 80 ? 8 : tokenQueueRef.current.length > 30 ? 4 : 2;
            const chunk = tokenQueueRef.current.splice(0, count).join('');
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === botMsgId
                  ? { ...msg, text: (msg.text || '') + chunk }
                  : msg
              )
            );
          } else if (streamDoneDataRef.current.isDone) {
            if (typewriterTimerRef.current) {
              clearInterval(typewriterTimerRef.current);
              typewriterTimerRef.current = null;
            }
            setIsStreaming(false);
            const suggestions = streamDoneDataRef.current.suggestedQuestions || [];
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

        streamAgentAI(
          {
            query: text,
            chat_history: recent_history,
            use_general_knowledge,
            ...queryContext,
          },
          {
            onMetadata: (data) => {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === botMsgId
                    ? { ...msg, sources: data.sources, uiWidget: data.ui_widget as any }
                    : msg
                )
              );
            },
            onToken: (tokenText) => {
              // Nén các ký tự vào buffer queue thay vì nhét thẳng vào state thô bạo
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
                    ? { ...msg, text: (msg.text || '') + `\n\n⚠️ [Lỗi kết nối AI Streaming: ${err}]` }
                    : msg
                )
              );
            },
          }
        );
      } else {
        sendMessage({
          query: text,
          chat_history: recent_history,
          use_general_knowledge,
          ...queryContext,
        });
      }
    },
    [messages, sendMessage, useStreaming, queryContext]
  );

  const confirmFallback = useCallback((originalQuery: string) => {
    setMessages((prev) => prev.filter(msg => !msg.isFallbackPrompt));
    addUserMessage(originalQuery, true);
  }, [addUserMessage]);

  const pushBotMessage = useCallback((text: string, uiWidget?: UIWidgetData) => {
    const botMessage: ChatMessage = {
      id: `bot-${Date.now()}`,
      text,
      sender: 'bot',
      uiWidget,
    };
    setMessages((prev) => [...prev, botMessage]);
  }, []);

  return {
    messages,
    setMessages,
    isTyping,
    addUserMessage,
    confirmFallback,
    pushBotMessage,
    clearChatHistory,
  };
};
