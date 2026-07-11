/* eslint-disable @typescript-eslint/no-explicit-any */
// src/hooks/queries/lesson.queries.ts
import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from '@tanstack/react-query';
import {
  createLesson,
  updateLessonsOrder,
  updateLesson,
  deleteLesson,
  getLessonById,
  updateLessonVideo,
  addLessonAttachment,
  deleteLessonAttachment,
  getQuizQuestionsForLesson,
  createQuizQuestion, // Import thêm hàm quiz
  Attachment,
  LessonListData,
  CreateLessonData,
  UpdateLessonData,
  LessonOrderData,
  CreateQuestionData,
  getLessonVideoSignedUrl,
  UpdateQuestionData,
  updateQuizQuestion,
  deleteQuizQuestion,
  Lesson,
} from '@/services/lesson.service'; // Đảm bảo service export đủ
import { courseKeys } from './course.queries'; // Cần để invalidate course detail
import { toast } from '@/hooks/use-toast'; // Import toast nếu muốn dùng trong
import { QuizQuestion } from '@/services/quiz.service';
// Query Key Factory
const lessonKeys = {
  all: ['lessons'] as const,
  lists: (sectionId?: number) =>
    [...lessonKeys.all, 'list', { sectionId }] as const, // Key cho list theo section
  details: () => [...lessonKeys.all, 'detail'] as const,
  detail: (id: number | undefined) => [...lessonKeys.details(), id] as const,
  quizQuestions: (lessonId?: number) =>
    [...lessonKeys.all, 'quizQuestions', { lessonId }] as const, // Key cho quiz questions
  videoUrl: (id: number | undefined) =>
    [...lessonKeys.all, 'videoUrl', id] as const, // Key cho signed URL
};

// --- Queries ---

/** Hook lấy chi tiết lesson */
export const useLessonDetail = (
  lessonId: number | undefined,
  options?: Omit<UseQueryOptions<Lesson, Error>, 'queryKey' | 'queryFn'>
) => {
  const queryKey = lessonKeys.detail(lessonId);
  return useQuery<Lesson, Error>({
    queryKey: queryKey,
    queryFn: () => getLessonById(lessonId!),
    enabled: !!lessonId,
    ...options,
  });
};

/** Hook lấy Signed URL cho video private */
export const useLessonVideoUrl = (
  lessonId: number | undefined,
  options?: Omit<
    UseQueryOptions<{ signedUrl: string; publicEmbedUrl?: string }, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryKey = lessonKeys.videoUrl(lessonId);
  return useQuery<{ signedUrl: string; publicEmbedUrl?: string }, Error>({
    queryKey: queryKey,
    queryFn: () => getLessonVideoSignedUrl(lessonId!),
    enabled: !!lessonId, // Chỉ fetch khi có lessonId
    staleTime: 1000 * 60 * 50, // Cache URL trong 50 phút (ít hơn thời hạn 1 giờ của URL)
    refetchOnWindowFocus: false, // Không cần refetch khi focus lại cửa sổ
    refetchOnReconnect: false,
    retry: 1, // Thử lại 1 lần nếu lỗi
    ...options,
  });
};

/** Hook lấy câu hỏi quiz của lesson (Instructor) */
export const useLessonQuizQuestions = (
  lessonId: number | undefined,
  options?: Omit<
    UseQueryOptions<{ questions: QuizQuestion[] }, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryKey = lessonKeys.quizQuestions(lessonId);
  return useQuery<{ questions: QuizQuestion[] }, Error>({
    queryKey: queryKey,
    queryFn: () => getQuizQuestionsForLesson(lessonId!),
    enabled: !!lessonId,
    ...options,
  });
};

// --- Mutations ---

/** Hook tạo lesson */
export const useCreateLesson = (
  options?: UseMutationOptions<
    Lesson,
    Error,
    { courseId: number; sectionId: number; data: CreateLessonData }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    Lesson,
    Error,
    { courseId: number; sectionId: number; data: CreateLessonData }
  >({
    mutationFn: ({ courseId, sectionId, data }) =>
      createLesson(courseId, sectionId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: courseKeys.detailById(variables.courseId),
      });

      queryClient.invalidateQueries({
        queryKey: ['courses', 'detail', 'slug'],
      });
      console.log('Lesson created successfully.');
    },
    onError: (error) => {
      console.error('Lesson creation failed:', error.message);
    },
    ...options,
  });
};

/** Hook cập nhật thứ tự lessons */
export const useUpdateLessonsOrder = (
  options?: UseMutationOptions<
    LessonListData,
    Error,
    { courseId: number; sectionId: number; lessonOrders: LessonOrderData[] }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    LessonListData,
    Error,
    { courseId: number; sectionId: number; lessonOrders: LessonOrderData[] }
  >({
    mutationFn: ({ courseId, sectionId, lessonOrders }) =>
      updateLessonsOrder(courseId, sectionId, lessonOrders),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: courseKeys.detailById(variables.courseId),
      });
      queryClient.invalidateQueries({
        queryKey: courseKeys.detailBySlug(undefined),
      });
      console.log('Lessons order updated.');
    },
    onError: (error) => {
      console.error('Update lessons order failed:', error.message);
    },
    ...options,
  });
};

/** Hook cập nhật lesson */
export const useUpdateLesson = (
  options?: UseMutationOptions<
    Lesson,
    Error,
    { lessonId: number; data: UpdateLessonData }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    Lesson,
    Error,
    { lessonId: number; data: UpdateLessonData }
  >({
    mutationFn: ({ lessonId, data }) => {
      console.log('Updating lesson with ID:', lessonId, 'and data:', data);
      return updateLesson(lessonId, data);
    },
    onSuccess: (updatedLesson) => {
      queryClient.setQueryData(
        lessonKeys.detail(Number(updatedLesson.lessonId)),
        updatedLesson
      );
      // Invalidate course detail chứa lesson này
      // Cần lấy courseId từ lesson? Hơi phức tạp. Tạm invalidate all course details
      queryClient.invalidateQueries({ queryKey: courseKeys.details() });
    },
    onError: (error) => {
      console.error('Lesson update failed:', error.message);
    },
    ...options,
  });
};

/** Hook xóa lesson */
export const useDeleteLesson = (
  options?: UseMutationOptions<
    void,
    Error,
    { lessonId: number; courseId?: number }
  >
) => {
  const queryClient = useQueryClient();
  // courseId optional, chỉ dùng để invalidate cache course nếu có
  return useMutation<void, Error, { lessonId: number; courseId?: number }>({
    mutationFn: ({ lessonId }) => deleteLesson(lessonId),
    onSuccess: (_, variables) => {
      queryClient.removeQueries({
        queryKey: lessonKeys.detail(variables.lessonId),
      });
      if (variables.courseId) {
        queryClient.invalidateQueries({
          queryKey: courseKeys.detailById(variables.courseId),
        });
        queryClient.invalidateQueries({
          queryKey: courseKeys.detailBySlug(undefined),
        });
      } else {
        queryClient.invalidateQueries({ queryKey: courseKeys.details() });
      }
      console.log('Lesson deleted successfully.');
    },
    onError: (error) => {
      console.error('Lesson deletion failed:', error.message);
    },
    ...options,
  });
};

/** Hook cập nhật video bài học */
export const useUpdateLessonVideo = (
  options?: UseMutationOptions<Lesson, Error, { lessonId: number; file: File }>
) => {
  const queryClient = useQueryClient();
  return useMutation<Lesson, Error, { lessonId: number; file: File }>({
    mutationFn: ({ lessonId, file }) => updateLessonVideo(lessonId, file),
    onSuccess: (updatedLesson) => {
      queryClient.setQueryData(
        lessonKeys.detail(Number(updatedLesson.lessonId)),
        updatedLesson
      );
      queryClient.invalidateQueries({ queryKey: courseKeys.details() }); // Invalidate course chứa lesson
      console.log('Lesson video updated successfully.');
    },
    onError: (error) => {
      console.error('Lesson video update failed:', error.message);
    },
    ...options,
  });
};

/** Hook thêm attachment */
export const useAddLessonAttachment = (
  options?: UseMutationOptions<
    Attachment,
    Error,
    { lessonId: number; file: File }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<Attachment, Error, { lessonId: number; file: File }>({
    mutationFn: ({ lessonId, file }) => addLessonAttachment(lessonId, file),
    onSuccess: (data, variables) => {
      // Invalidate cache chi tiết lesson để load lại attachment
      queryClient.invalidateQueries({
        queryKey: lessonKeys.detail(variables.lessonId),
      });
      console.log('Attachment added successfully.');
    },
    onError: (error) => {
      console.error('Add attachment failed:', error.message);
    },
    ...options,
  });
};

/** Hook xóa attachment */
export const useDeleteLessonAttachment = (
  options?: UseMutationOptions<
    void,
    Error,
    { lessonId: number; attachmentId: number }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { lessonId: number; attachmentId: number }>({
    mutationFn: ({ lessonId, attachmentId }) =>
      deleteLessonAttachment(lessonId, attachmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: lessonKeys.detail(variables.lessonId),
      });
      console.log('Attachment deleted successfully.');
    },
    onError: (error) => {
      console.error('Delete attachment failed:', error.message);
    },
    ...options,
  });
};

// --- Quiz Question Mutations (Instructor) ---

/** Hook tạo câu hỏi quiz */
export const useCreateQuizQuestion = (
  options?: UseMutationOptions<
    QuizQuestion,
    Error,
    { lessonId: number; data: CreateQuestionData }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    QuizQuestion,
    Error,
    { lessonId: number; data: CreateQuestionData }
  >({
    mutationFn: ({ lessonId, data }) => createQuizQuestion(lessonId, data),
    onSuccess: (data, variables) => {
      // Invalidate danh sách câu hỏi của lesson đó
      queryClient.invalidateQueries({
        queryKey: lessonKeys.quizQuestions(variables.lessonId),
      });
      console.log('Quiz question created successfully.');
    },
    onError: (error) => {
      console.error('Quiz question creation failed:', error.message);
    },
    ...options,
  });
};

/** Hook cập nhật câu hỏi quiz */
export const useUpdateQuizQuestion = (
  options?: UseMutationOptions<
    QuizQuestion,
    Error,
    { questionId: number; data: UpdateQuestionData }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    QuizQuestion,
    Error,
    { questionId: number; data: UpdateQuestionData }
  >({
    mutationFn: ({ questionId, data }) => updateQuizQuestion(questionId, data),
    onSuccess: (data, variables) => {
      // Invalidate danh sách câu hỏi của lesson chứa câu hỏi này
      queryClient.invalidateQueries({
        queryKey: lessonKeys.quizQuestions(data.lessonId),
      });
      console.log('Quiz question updated successfully.');
    },
    onError: (error) => {
      console.error('Quiz question update failed:', error.message);
    },
    ...options,
  });
};

/** Hook xóa câu hỏi quiz */
export const useDeleteQuizQuestion = (
  options?: UseMutationOptions<
    void,
    Error,
    { questionId: number; lessonId: number }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { questionId: number; lessonId: number }>({
    mutationFn: ({ questionId }) => deleteQuizQuestion(questionId),
    onSuccess: (_, variables) => {
      // Invalidate danh sách câu hỏi của lesson chứa câu hỏi này
      queryClient.invalidateQueries({
        queryKey: lessonKeys.quizQuestions(variables.lessonId),
      });
      console.log('Quiz question deleted successfully.');
    },
    onError: (error) => {
      console.error('Quiz question deletion failed:', error.message);
    },
    ...options,
  });
};

// Mock cho useCreateQuizQuestion
export const useMockCreateQuizQuestion = () => {
  console.warn('useCreateQuizQuestion hook is not available. Using mock.');
  return {
    mutateAsync: async (args: any) => {
      console.error('Mock createQuestionMutateAsync called with:', args);
      toast({
        title: 'Error',
        description: 'Create question function not implemented.',
        variant: 'destructive',
      });
      throw new Error('Create function not implemented');
    },
    isPending: false,
    // Thêm các trạng thái khác nếu cần để tránh lỗi undefined
    error: null,
    status: 'idle',
  };
};

// Mock cho useUpdateQuestion
export const useMockUpdateQuestion = () => {
  console.warn('useUpdateQuestion hook is not available. Using mock.');
  return {
    mutateAsync: async (args: any) => {
      console.error('Mock updateQuestionMutateAsync called with:', args);
      toast({
        title: 'Error',
        description: 'Update question function not implemented.',
        variant: 'destructive',
      });
      throw new Error('Update function not implemented');
    },
    isPending: false,
    error: null,
    status: 'idle',
  };
};
