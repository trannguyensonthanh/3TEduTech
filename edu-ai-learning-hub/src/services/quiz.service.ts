// src/services/quiz.service.ts
import { IsoDateTimeString } from '@/types/common.types';
import apiHelper from './apiHelper';

export interface QuizOption {
  optionId?: number;
  tempId?: string | number; // FE temp ID
  questionId: number;
  optionText: string;
  isCorrectAnswer: boolean;
  optionOrder: number;
}

export interface QuizQuestion {
  questionId?: number;
  tempId?: string | number; // FE temp ID
  lessonId?: number; // Hoặc string
  questionText: string;
  explanation?: string | null;
  questionOrder: number;
  options: QuizOption[]; // Lồng options vào đây
  createdAt?: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
}

// --- Kiểu dữ liệu (Ví dụ) ---
export interface QuizAttempt {
  attemptId: number;
  lessonId: number;
  accountId: number;
  startedAt: string;
  completedAt?: string | null;
  score?: number | null;
  isPassed?: boolean | null;
  attemptNumber: number;
}

export interface QuizQuestionPublic {
  // Câu hỏi cho student (ko có đáp án đúng)
  questionId: number;
  questionText: string;
  questionOrder: number;
  options: { optionId: number; optionText: string; optionOrder: number }[];
}

export interface StartQuizResponse {
  attempt: QuizAttempt;
  questions: QuizQuestionPublic[];
}

export interface SubmitAnswer {
  questionId: number;
  selectedOptionId: number | null;
}

export interface QuizAttemptResultDetail {
  attemptAnswerId: number;
  questionId: number;
  questionText: string;
  explanation?: string | null;
  questionOrder: number;
  selectedOptionId: number | null;
  selectedOptionText?: string | null;
  isCorrect: boolean | null;
  correctOptionId: number;
  correctOptionText: string;
  options: QuizOption[];
}

export interface QuizAttemptResultResponse {
  attempt: QuizAttempt;
  details: QuizAttemptResultDetail[];
}

export interface AttemptHistory {
  attemptId: number;
  completedAt?: string | null;
  score?: number | null;
  isPassed?: boolean | null;
  attemptNumber: number;
}

export interface QuizHistoryResponse {
  history: AttemptHistory[];
}

// --- Student APIs ---

/** Bắt đầu lượt làm quiz */
export const startQuizAttempt = async (
  lessonId: number
): Promise<StartQuizResponse> => {
  console.log('Starting quiz attempt for lesson:', lessonId);
  return apiHelper.post(`/quizzes/lessons/${lessonId}/start`);
};

/** Nộp bài làm quiz */
export const submitQuizAttempt = async (
  attemptId: number,
  answers: SubmitAnswer[]
): Promise<QuizAttemptResultResponse> => {
  return apiHelper.post(`/quizzes/attempts/${attemptId}/submit`, { answers });
};

/** Xem kết quả chi tiết */
export const getQuizAttemptResult = async (
  attemptId: number
): Promise<QuizAttemptResultResponse> => {
  return apiHelper.get(`/quizzes/attempts/${attemptId}/result`);
};

/** Xem lịch sử làm bài */
export const getQuizAttemptHistory = async (
  lessonId: number
): Promise<QuizHistoryResponse> => {
  return apiHelper.get(`/quizzes/lessons/${lessonId}/history`);
};
