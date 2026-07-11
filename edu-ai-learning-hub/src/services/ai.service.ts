// src/services/ai.service.ts
import { ChatHistoryPair } from '@/hooks/useChatbot';
const AI_API_BASE_URL = 'http://localhost:2111'; // Thay bằng URL API thật của bạn
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
