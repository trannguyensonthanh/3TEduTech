// src/hooks/queries/skill.queries.ts
import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getSkills,
  createSkill,
  getSkillById,
  updateSkill,
  deleteSkill,
  Skill,
  SkillListData,
  SkillQueryParams,
  CreateSkillData,
  UpdateSkillData,
} from '@/services/skill.service';

// Query Key Factory
const skillKeys = {
  all: ['skills'] as const,
  lists: (params?: SkillQueryParams) =>
    [...skillKeys.all, 'list', params || {}] as const,
  details: () => [...skillKeys.all, 'detail'] as const,
  detail: (id: number | undefined) => [...skillKeys.details(), id] as const,
};

// --- Queries ---

/** Hook lấy danh sách skills */
export const useSkills = (
  params?: SkillQueryParams,
  options?: Omit<UseQueryOptions<SkillListData, Error>, 'queryKey' | 'queryFn'>
) => {
  const queryKey = skillKeys.lists(params);
  return useQuery<SkillListData, Error>({
    queryKey: queryKey,
    queryFn: () => getSkills(params),
    staleTime: 5000, // Adjust the stale time as needed
    ...options,
  });
};

/** Hook lấy chi tiết skill */
export const useSkillDetail = (
  skillId: number | undefined,
  options?: Omit<UseQueryOptions<Skill, Error>, 'queryKey' | 'queryFn'>
) => {
  const queryKey = skillKeys.detail(skillId);
  return useQuery<Skill, Error>({
    queryKey: queryKey,
    queryFn: () => getSkillById(skillId!),
    enabled: !!skillId,
    ...options,
  });
};

// --- Mutations (Admin) ---

/** Hook tạo skill */
export const useCreateSkill = (
  options?: UseMutationOptions<Skill, Error, CreateSkillData>
) => {
  const queryClient = useQueryClient();
  return useMutation<Skill, Error, CreateSkillData>({
    mutationFn: createSkill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillKeys.lists() });
      console.log('Skill created successfully.');
      // toast.success('Tạo kỹ năng thành công!');
    },
    onError: (error) => {
      console.error('Skill creation failed:', error.message);
      // toast.error(error.message || 'Tạo kỹ năng thất bại.');
    },
    ...options,
  });
};

/** Hook cập nhật skill */
export const useUpdateSkill = (
  options?: UseMutationOptions<
    Skill,
    Error,
    { skillId: number; data: UpdateSkillData }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<Skill, Error, { skillId: number; data: UpdateSkillData }>({
    mutationFn: ({ skillId, data }) => updateSkill(skillId, data),
    onSuccess: (updatedSkill) => {
      queryClient.setQueryData(
        skillKeys.detail(updatedSkill.skillId),
        updatedSkill
      );
      queryClient.invalidateQueries({ queryKey: skillKeys.lists() });
      console.log('Skill updated successfully.');
      // toast.success('Cập nhật kỹ năng thành công!');
    },
    onError: (error) => {
      console.error('Skill update failed:', error.message);
      // toast.error(error.message || 'Cập nhật kỹ năng thất bại.');
    },
    ...options,
  });
};

/** Hook xóa skill */
export const useDeleteSkill = (
  options?: UseMutationOptions<void, Error, number>
) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: deleteSkill,
    onSuccess: (_, skillId) => {
      queryClient.removeQueries({ queryKey: skillKeys.detail(skillId) });
      queryClient.invalidateQueries({ queryKey: skillKeys.lists() });
      console.log('Skill deleted successfully.');
      // toast.success('Xóa kỹ năng thành công!');
    },
    onError: (error) => {
      console.error('Skill deletion failed:', error.message);
      // toast.error(error.message || 'Xóa kỹ năng thất bại.');
    },
    ...options,
  });
};
