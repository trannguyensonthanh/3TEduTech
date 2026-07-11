// src/hooks/queries/quiz.queries.ts
import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import {
  startQuizAttempt,
  submitQuizAttempt,
  getQuizAttemptResult,
  getQuizAttemptHistory,
  StartQuizResponse,
  SubmitAnswer,
  QuizAttemptResultResponse,
  QuizHistoryResponse,
} from '@/services/quiz.service'; // Điều chỉnh đường dẫn đến quiz.service.ts
import { progressKeys } from './progress.queries'; // Để invalidate progress
import { courseKeys } from './course.queries'; // Để invalidate course detail (có thể chứa progress)

// Query Key Factory
const quizKeys = {
  all: ['quizzes'] as const,
  attempts: (lessonId?: number) =>
    [...quizKeys.all, 'attempts', { lessonId }] as const, // Key chung cho attempts
  attemptDetail: (attemptId: number | undefined) =>
    [...quizKeys.attempts(), 'detail', attemptId] as const,
  historyByLesson: (lessonId: number | undefined) =>
    [...quizKeys.attempts(), 'history', lessonId] as const,
  // Key cho danh sách câu hỏi của một lesson (dùng chung cho instructor và student khi bắt đầu quiz)
  questionsForLesson: (lessonId: number | undefined) =>
    ['quizQuestions', { lessonId }] as const,
};

// --- Queries (Student) ---

/**
 * Hook lấy kết quả chi tiết của một lượt làm quiz đã hoàn thành.
 * @param {number | undefined} attemptId - ID của lượt làm.
 * @param {Omit<UseQueryOptions<QuizAttemptResultResponse, Error>, 'queryKey' | 'queryFn'>} [options]
 */
export const useQuizAttemptResult = (
  attemptId: number | undefined,
  options?: Omit<
    UseQueryOptions<QuizAttemptResultResponse, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryKey = quizKeys.attemptDetail(attemptId);
  return useQuery<QuizAttemptResultResponse, Error>({
    queryKey: queryKey,
    queryFn: () => getQuizAttemptResult(attemptId!), // Thêm ! vì enabled sẽ đảm bảo có giá trị
    enabled: !!attemptId, // Chỉ fetch khi có attemptId
    staleTime: Infinity, // Kết quả của một attempt không thay đổi
    ...options,
  });
};

/**
 * Hook lấy lịch sử các lượt làm quiz của user cho một bài học.
 * @param {number | undefined} lessonId - ID của bài học.
 * @param {Omit<UseQueryOptions<QuizHistoryResponse, Error>, 'queryKey' | 'queryFn'>} [options]
 */
export const useQuizAttemptHistory = (
  lessonId: number | undefined,
  options?: Omit<
    UseQueryOptions<QuizHistoryResponse, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryKey = quizKeys.historyByLesson(lessonId);
  return useQuery<QuizHistoryResponse, Error>({
    queryKey: queryKey,
    queryFn: () => getQuizAttemptHistory(lessonId!),
    enabled: !!lessonId,
    ...options,
  });
};

// --- Mutations (Student) ---

/**
 * Hook bắt đầu một lượt làm quiz mới.
 * Trả về thông tin attempt và danh sách câu hỏi (không có đáp án đúng).
 * @param {UseMutationOptions<StartQuizResponse, Error, number>} [options] - Input là lessonId.
 */
export const useStartQuizAttempt = (
  options?: UseMutationOptions<StartQuizResponse, Error, number>
) => {
  // Không cần invalidate gì nhiều khi bắt đầu, có thể invalidate history nếu muốn hiển thị ngay
  const queryClient = useQueryClient();
  return useMutation<StartQuizResponse, Error, number>({
    mutationFn: startQuizAttempt, // service function nhận lessonId
    onSuccess: (data) => {
      console.log(
        `Quiz attempt ${data.attempt.attemptId} started for lesson ${data.attempt.lessonId}.`
      );
      // Invalidate history để cập nhật danh sách các lượt thử
      queryClient.invalidateQueries({
        queryKey: quizKeys.historyByLesson(data.attempt.lessonId),
      });
    },
    onError: (error) => {
      console.error('Start quiz attempt failed:', error.message);
      // toast.error(error.message || 'Bắt đầu làm bài thất bại.');
    },
    ...options,
  });
};

/**
 * Hook nộp bài làm quiz và nhận kết quả.
 * @param {UseMutationOptions<QuizAttemptResultResponse, Error, { attemptId: number; answers: SubmitAnswer[] }>} [options]
 */
export const useSubmitQuizAttempt = (
  options?: UseMutationOptions<
    QuizAttemptResultResponse,
    Error,
    { attemptId: number; answers: SubmitAnswer[] }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    QuizAttemptResultResponse,
    Error,
    { attemptId: number; answers: SubmitAnswer[] }
  >({
    mutationFn: ({ attemptId, answers }) =>
      submitQuizAttempt(attemptId, answers),
    onSuccess: (data, variables) => {
      console.log('data', data);
      console.log('variables', variables);
      // 1. Cập nhật cache cho chi tiết attempt này (để useQuizAttemptResult lấy được ngay)
      queryClient.setQueryData(
        quizKeys.attemptDetail(variables.attemptId),
        data
      );

      // 2. Invalidate lịch sử làm bài của lesson này
      queryClient.invalidateQueries({
        queryKey: quizKeys.historyByLesson(data.attempt.lessonId),
      });

      // 3. Nếu pass quiz, invalidate progress của course và lesson progress
      if (data.attempt.isPassed) {
        queryClient.invalidateQueries({ queryKey: progressKeys.all }); // Invalidate all progress
        queryClient.invalidateQueries({ queryKey: courseKeys.details() }); // Invalidate course details
      }
      console.log(
        `Quiz attempt ${
          variables.attemptId
        } submitted. Score: ${data.attempt.score?.toFixed(0)}%`
      );
      // toast.success(`Nộp bài thành công! Điểm của bạn: ${data.attempt.Score?.toFixed(0)}%`);
    },
    onError: (error) => {
      console.error('Submit quiz attempt failed:', error.message);
      // toast.error(error.message || 'Nộp bài thất bại.');
    },
    ...options,
  });
};
