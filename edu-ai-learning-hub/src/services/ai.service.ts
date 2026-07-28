// src/services/ai.service.ts
import { ChatHistoryPair } from '@/hooks/useChatbot';
const AI_API_BASE_URL = import.meta.env.VITE_AI_API_URL || `http://${window.location.hostname}:2111`; // Thay bằng URL API thật của bạn
const MASTER_API_KEY = '4mrOXXBBZuxLcUw2j9SXrFrXfGSxIIxR';
const COURSE_AI_API_KEY = 'AesHdAArx39flWyTKc74c5rP5SsF8Bz7';
// --- Interfaces for AI Chat ---
interface QueryPayload {
  query: string;
  chat_history?: ChatHistoryPair[];
  top_k?: number;
  cloud_call?: boolean;
}

export interface QueryResponse {
  answer: string;
  sources: { file_name: string; content: string }[];
  voice?: string;
}

// --- Interfaces for Suggestions ---
interface SuggestionPayload {
  previous_response: string;
  context?: string;
  query?: string;
}

export interface SuggestionResponse {
  suggested_questions: string[];
}

interface BaseQueryPayload {
  chat_history?: ChatHistoryPair[];
  top_k?: number;
  cloud_call?: boolean;
}

interface MasterQueryPayload extends BaseQueryPayload {
  query: string;
}

interface CourseQueryPayload extends BaseQueryPayload {
  query: string;
  courseName: string; // Tên khóa học để làm context
}

export interface QueryResponse {
  answer: string;
  sources: { file_name: string; content: string }[];
  voice?: string; // Dữ liệu audio base64
}
/**
 * Gửi truy vấn đến AI Master Chatbot.
 */
export const queryMasterAI = async (
  payload: QueryPayload
): Promise<QueryResponse> => {
  console.log('Sending query to AI:', payload);
  console.log('gửi cho AI:', {
    query: payload.query,
    chat_history: payload.chat_history?.map((item) => ({
      answer: item.answer,
      question: item.question,
    })),
    top_k: payload.top_k || 20,
    cloud_call: payload.cloud_call || true,
    voice: false,
  });
  const response = await fetch(
    `${AI_API_BASE_URL}/api/chat/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': MASTER_API_KEY,
      },
      body: JSON.stringify({
        ...payload,
        top_k: 20, // Tham số cố định
        cloud_call: true, // Tham số cố định
        voice: false, // Tham số cố định
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'AI Assistant failed to respond.');
  }
  return response.json();
};

/**
 * Gửi truy vấn đến AI của khóa học (có voice).
 */
export const queryCourseAI = async (
  payload: CourseQueryPayload
): Promise<QueryResponse> => {
  console.log('Sending course query to AI:', payload);
  if (!COURSE_AI_API_KEY)
    throw new Error('Course AI API Key is not configured.');
  console.log('Sending course query to AI:', payload);
  const body = {
    query: payload.query,
    course_name: payload.courseName,
    chat_history: payload.chat_history || [],
    top_k: 20,
  };

  const response = await fetch(
    `${AI_API_BASE_URL}/api/chat/course-query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': COURSE_AI_API_KEY,
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errJson = JSON.parse(errorText);
      throw new Error(errJson.message || 'AI Assistant failed to respond.');
    } catch (e) {
      throw new Error(
        errorText || 'An unknown error occurred on the AI server.'
      );
    }
  }

  const responseText = await response.text();
  if (!responseText)
    return {
      answer: 'Received an empty response from the server.',
      sources: [],
    };
  return JSON.parse(responseText);
};

/**
 * Lấy các câu hỏi gợi ý dựa trên câu trả lời trước đó.
 */
export const fetchSuggestedQuestions = async (
  payload: SuggestionPayload
): Promise<SuggestionResponse> => {
  const response = await fetch(
    `${AI_API_BASE_URL}/api/chat/suggest`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // API này có thể không cần key nếu backend cho phép
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    // Không ném lỗi ở đây, vì gợi ý là tính năng phụ
    console.error('Failed to fetch suggested questions.');
    return { suggested_questions: [] };
  }
  return response.json();
};

// --- Interfaces & Functions for AI Course Search (RAG + Gemini) ---
export interface CourseSearchPayload {
  query: string;
  top_k?: number;
}

export interface CourseSearchResponse {
  answer: string;
  sources: { file_name: string; content: string }[];
}

/**
 * Tìm kiếm & Tư vấn lộ trình học tập bằng Trí Tuệ Nhân Tạo (RAG + Gemini AI).
 */
export const searchCoursesWithAI = async (
  payload: CourseSearchPayload
): Promise<CourseSearchResponse> => {
  console.log('Sending AI course search query:', payload);
  const response = await fetch(`${AI_API_BASE_URL}/api/search/courses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': MASTER_API_KEY,
    },
    body: JSON.stringify({
      query: payload.query,
      top_k: payload.top_k || 5,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errJson = JSON.parse(errorText);
      throw new Error(errJson.detail || errJson.message || 'AI Course Search failed.');
    } catch {
      throw new Error(errorText || 'Error connecting to AI search service.');
    }
  }
  return response.json();
};

// --- AI Agent: Unified Endpoint (Intent Router + Hybrid Search + Commerce) ---
export interface UIWidgetData {
  type: 'COURSE_CAROUSEL' | 'PAYMENT_SELECTOR' | 'CHECKOUT_REDIRECT' | 'ENROLLMENT_SUCCESS';
  data: Record<string, unknown>;
}

export interface AgentResponse {
  answer: string;
  intent: string;
  sources: { file_name: string; content: string }[];
  suggested_questions: string[];
  ui_widget?: UIWidgetData | null;
  voice?: string;
}

/**
 * Gửi tin nhắn đến AI Agent thống nhất.
 * Agent tự động nhận diện ý định (Intent) và định tuyến xử lý phù hợp:
 * - SEARCH_COURSE: Hybrid Search (BM25 + Dense RAG + RRF Fusion)
 * - FAQ_QUERY: RAG Knowledge Base
 * - BUY_COURSE: Conversational Commerce widgets
 * - GENERAL_CHAT: Friendly conversation
 */
export const queryAgentAI = async (
  payload: QueryPayload
): Promise<AgentResponse> => {
  const response = await fetch(`${AI_API_BASE_URL}/api/chat/agent-action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': MASTER_API_KEY,
    },
    body: JSON.stringify({
      query: payload.query,
      chat_history: payload.chat_history || [],
      top_k: payload.top_k || 10,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errJson = JSON.parse(errorText);
      throw new Error(errJson.detail || errJson.message || 'AI Agent failed.');
    } catch {
      throw new Error(errorText || 'Error connecting to AI Agent.');
    }
  }
  return response.json();
};

/**
 * Gửi tin nhắn đến AI Agent dưới dạng Realtime SSE Token Streaming (Nhả từng chữ theo thời gian thực).
 */
export const streamAgentAI = async (
  payload: QueryPayload,
  callbacks: {
    onMetadata?: (data: { intent: string; ui_widget?: UIWidgetData | null; sources: any[] }) => void;
    onToken?: (text: string) => void;
    onDone?: (data: { suggested_questions: string[] }) => void;
    onError?: (err: string) => void;
  }
): Promise<void> => {
  try {
    const response = await fetch(`${AI_API_BASE_URL}/api/chat/agent-action-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': MASTER_API_KEY,
      },
      body: JSON.stringify({
        query: payload.query,
        chat_history: payload.chat_history || [],
        top_k: payload.top_k || 10,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error('Không thể kết nối máy chủ streaming AI.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let currentEvent = 'message';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete trailing line

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('event:')) {
          currentEvent = trimmed.replace('event:', '').trim();
        } else if (trimmed.startsWith('data:')) {
          const dataStr = trimmed.replace('data:', '').trim();
          if (!dataStr) continue;
          try {
            const parsed = JSON.parse(dataStr);
            if (currentEvent === 'metadata') {
              callbacks.onMetadata?.(parsed);
            } else if (currentEvent === 'token') {
              callbacks.onToken?.(parsed.text || '');
            } else if (currentEvent === 'done') {
              callbacks.onDone?.(parsed);
            }
          } catch (e) {
            console.warn('Lỗi phân tích cú pháp stream JSON:', e, dataStr);
          }
          currentEvent = 'message';
        }
      }
    }
  } catch (error: any) {
    console.error('Lỗi Stream AI Agent:', error);
    callbacks.onError?.(error.message || 'Gián đoạn kết nối tới dịch vụ AI.');
  }
};
