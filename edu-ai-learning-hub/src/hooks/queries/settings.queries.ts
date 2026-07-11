// src/hooks/queries/settings.queries.ts
import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getAllSettings,
  updateSetting,
  SettingsResponse,
  UpdateSettingData,
  SettingValue,
} from '@/services/settings.service';

// Query Key Factory
const settingsKeys = {
  all: ['settings'] as const,
};

// --- Queries (Admin) ---

/** Hook Admin lấy tất cả settings */
export const useSettings = (
  options?: Omit<
    UseQueryOptions<SettingsResponse, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<SettingsResponse, Error>({
    queryKey: settingsKeys.all,
    queryFn: getAllSettings,
    staleTime: 1000 * 60 * 15, // Settings ít thay đổi, cache 15 phút
    ...options,
  });
};

// --- Mutations (Admin) ---

/** Hook Admin cập nhật setting */
export const useUpdateSetting = (
  options?: UseMutationOptions<
    SettingValue,
    Error,
    { settingKey: string; data: UpdateSettingData }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    SettingValue,
    Error,
    { settingKey: string; data: UpdateSettingData }
  >({
    mutationFn: ({ settingKey, data }) => updateSetting(settingKey, data),
    onSuccess: (updatedSettingData, variables) => {
      // Cập nhật cache tổng hợp settings
      queryClient.setQueryData(
        settingsKeys.all,
        (oldData: SettingsResponse | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            [variables.settingKey]: updatedSettingData,
          };
        }
      );
      console.log(`Setting ${variables.settingKey} updated.`);
      // toast.success('Cập nhật cài đặt thành công!');
    },
    onError: (error) => {
      console.error('Update setting failed:', error.message);
      // toast.error(error.message || 'Cập nhật cài đặt thất bại.');
    },
    ...options,
  });
};
