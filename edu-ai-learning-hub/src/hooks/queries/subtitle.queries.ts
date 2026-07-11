// src/hooks/queries/subtitle.queries.ts
import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getSubtitles,
  addSubtitleByUrl,
  addSubtitleByUpload,
  setPrimarySubtitle,
  deleteSubtitle,
  Subtitle,
  AddSubtitleData,
} from '@/services/subtitle.service'; // Điều chỉnh đường dẫn

// Query Key Factory
const subtitleKeys = {
  all: ['subtitles'] as const,
  lists: () => [...subtitleKeys.all, 'list'] as const,
  listByLesson: (lessonId: number | undefined) =>
    [...subtitleKeys.lists(), { lessonId }] as const,
  details: () => [...subtitleKeys.all, 'detail'] as const,
  detail: (id: number | undefined) => [...subtitleKeys.details(), id] as const,
};

// --- Queries ---

/** Hook lấy danh sách phụ đề của bài học */
export const useSubtitles = (
  lessonId: number | undefined,
  options?: Omit<
    UseQueryOptions<{ subtitles: Subtitle[] }, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryKey = subtitleKeys.listByLesson(lessonId);
  return useQuery<{ subtitles: Subtitle[] }, Error>({
    queryKey: queryKey,
    queryFn: () => getSubtitles(lessonId!),
    enabled: !!lessonId, // Chỉ chạy khi có lessonId
    ...options,
  });
};

// --- Mutations (Instructor/Admin) ---

/** Hook thêm phụ đề bằng URL */
export const useAddSubtitleByUrl = (
  options?: UseMutationOptions<
    Subtitle,
    Error,
    { lessonId: number; data: AddSubtitleData }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    Subtitle,
    Error,
    { lessonId: number; data: AddSubtitleData }
  >({
    mutationFn: ({ lessonId, data }) => addSubtitleByUrl(lessonId, data),
    onSuccess: (data, variables) => {
      // Invalidate danh sách phụ đề của lesson đó
      queryClient.invalidateQueries({
        queryKey: subtitleKeys.listByLesson(variables.lessonId),
      });
      console.log('Subtitle added by URL successfully.');
      // toast.success('Thêm phụ đề thành công!');
    },
    onError: (error) => {
      console.error('Add subtitle by URL failed:', error.message);
      // toast.error(error.message || 'Thêm phụ đề thất bại.');
    },
    ...options,
  });
};

/** Hook thêm phụ đề bằng Upload File */
export const useAddSubtitleByUpload = (
  options?: UseMutationOptions<
    Subtitle,
    Error,
    {
      lessonId: number;
      file: File;
      languageCode: string;
      isDefault?: boolean;
    }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    Subtitle,
    Error,
    {
      lessonId: number;
      file: File;
      languageCode: string;
      isDefault?: boolean;
    }
  >({
    mutationFn: ({ lessonId, file, languageCode, isDefault }) =>
      addSubtitleByUpload(lessonId, file, languageCode, isDefault),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: subtitleKeys.listByLesson(variables.lessonId),
      });
      console.log('Subtitle added by upload successfully.');
      // toast.success('Upload và thêm phụ đề thành công!');
    },
    onError: (error) => {
      console.error('Add subtitle by upload failed:', error.message);
      // toast.error(error.message || 'Upload phụ đề thất bại.');
    },
    ...options,
  });
};

/** Hook đặt phụ đề làm mặc định */
export const useSetPrimarySubtitle = (
  options?: UseMutationOptions<
    { message: string; subtitles: Subtitle[] },
    Error,
    { lessonId: number; subtitleId: number }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    { message: string; subtitles: Subtitle[] },
    Error,
    { lessonId: number; subtitleId: number }
  >({
    mutationFn: ({ lessonId, subtitleId }) =>
      setPrimarySubtitle(lessonId, subtitleId),
    onSuccess: (data, variables) => {
      // Cập nhật cache danh sách phụ đề với dữ liệu mới nhất từ response
      queryClient.setQueryData(subtitleKeys.listByLesson(variables.lessonId), {
        subtitles: data.subtitles,
      });
      console.log(`Subtitle ${variables.subtitleId} set as primary.`);
      // toast.success('Đặt phụ đề chính thành công!');
    },
    onError: (error) => {
      console.error('Set primary subtitle failed:', error.message);
      // toast.error(error.message || 'Đặt phụ đề chính thất bại.');
    },
    ...options,
  });
};

/** Hook xóa phụ đề */
export const useDeleteSubtitle = (
  options?: UseMutationOptions<
    void,
    Error,
    { lessonId: number; subtitleId: number }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { lessonId: number; subtitleId: number }>({
    mutationFn: ({ lessonId, subtitleId }) =>
      deleteSubtitle(lessonId, subtitleId),
    onSuccess: (_, variables) => {
      // Invalidate danh sách phụ đề của lesson đó
      queryClient.invalidateQueries({
        queryKey: subtitleKeys.listByLesson(variables.lessonId),
      });
      console.log(`Subtitle ${variables.subtitleId} deleted.`);
      // toast.success('Xóa phụ đề thành công!');
    },
    onError: (error) => {
      console.error('Delete subtitle failed:', error.message);
      // toast.error(error.message || 'Xóa phụ đề thất bại.');
    },
    ...options,
  });
};
