// src/hooks/queries/level.queries.ts
import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getLevels,
  createLevel,
  getLevelById,
  updateLevel,
  deleteLevel,
  Level,
  LevelListData,
} from '@/services/level.service';

// Query Key Factory
const levelKeys = {
  all: ['levels'] as const,
  lists: () => [...levelKeys.all, 'list'] as const,
  details: () => [...levelKeys.all, 'detail'] as const,
  detail: (id: number | undefined) => [...levelKeys.details(), id] as const,
};

// --- Queries ---

/** Hook lấy danh sách levels */
export const useLevels = (
  options?: Omit<UseQueryOptions<LevelListData, Error>, 'queryKey' | 'queryFn'>
) => {
  const queryKey = levelKeys.lists();
  return useQuery<LevelListData, Error>({
    queryKey: queryKey,
    queryFn: getLevels,
    staleTime: 1000 * 60 * 60, // Dữ liệu level ít thay đổi, cache 1 giờ
    ...options,
  });
};

/** Hook lấy chi tiết level */
export const useLevelDetail = (
  levelId: number | undefined,
  options?: Omit<UseQueryOptions<Level, Error>, 'queryKey' | 'queryFn'>
) => {
  const queryKey = levelKeys.detail(levelId);
  return useQuery<Level, Error>({
    queryKey: queryKey,
    queryFn: () => getLevelById(levelId!),
    enabled: !!levelId,
    ...options,
  });
};

// --- Mutations ---

/** Hook tạo level */
export const useCreateLevel = (
  options?: UseMutationOptions<Level, Error, { levelName: string }>
) => {
  const queryClient = useQueryClient();
  return useMutation<Level, Error, { levelName: string }>({
    mutationFn: createLevel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: levelKeys.lists() });
      console.log('Level created successfully.');
      // toast.success('Tạo cấp độ thành công!');
    },
    onError: (error) => {
      console.error('Level creation failed:', error.message);
      // toast.error(error.message || 'Tạo cấp độ thất bại.');
    },
    ...options,
  });
};

/** Hook cập nhật level */
export const useUpdateLevel = (
  options?: UseMutationOptions<
    Level,
    Error,
    { levelId: number; data: { levelName: string } }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    Level,
    Error,
    { levelId: number; data: { levelName: string } }
  >({
    mutationFn: ({ levelId, data }) => updateLevel(levelId, data),
    onSuccess: (updatedLevel) => {
      queryClient.setQueryData(
        levelKeys.detail(updatedLevel.levelId),
        updatedLevel
      );
      queryClient.invalidateQueries({ queryKey: levelKeys.lists() });
      console.log('Level updated successfully.');
      // toast.success('Cập nhật cấp độ thành công!');
    },
    onError: (error) => {
      console.error('Level update failed:', error.message);
      // toast.error(error.message || 'Cập nhật cấp độ thất bại.');
    },
    ...options,
  });
};

/** Hook xóa level */
export const useDeleteLevel = (
  options?: UseMutationOptions<void, Error, number>
) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: deleteLevel,
    onSuccess: (_, levelId) => {
      queryClient.removeQueries({ queryKey: levelKeys.detail(levelId) });
      queryClient.invalidateQueries({ queryKey: levelKeys.lists() });
      console.log('Level deleted successfully.');
      // toast.success('Xóa cấp độ thành công!');
    },
    onError: (error) => {
      console.error('Level deletion failed:', error.message);
      // toast.error(error.message || 'Xóa cấp độ thất bại.');
    },
    ...options,
  });
};
