// src/hooks/queries/language.queries.ts
import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getLanguages, // Service để lấy danh sách
  getLanguageByCode, // Service để lấy chi tiết (Admin)
  createLanguage, // Service Admin tạo
  updateLanguage, // Service Admin cập nhật
  deleteLanguage, // Service Admin xóa
  // --- Định nghĩa các kiểu dữ liệu trả về từ service ---
  // Giả sử service languages.service.ts export các kiểu này
  // Nếu không, bạn cần định nghĩa chúng ở đây hoặc import từ service
} from '@/services/language.service'; // Điều chỉnh đường dẫn đến service của bạn

// Interface cho một đối tượng Language (nên định nghĩa trong service và export ra)
export interface Language {
  languageCode: string;
  languageName: string;
  nativeName?: string | null; // Cho phép null nếu không có tên bản địa
  isActive?: boolean;
  displayOrder?: number | null; // Cho phép null nếu không có thứ tự hiển thị
  CreatedAt: string;
  UpdatedAt: string;
}

// Interface cho response từ API lấy danh sách
interface LanguageListResponse {
  languages: Language[];
  // Thêm các thuộc tính phân trang nếu API hỗ trợ (hiện tại service lấy tất cả)
}

// Interface cho dữ liệu tạo/sửa (nên định nghĩa trong service)
interface CreateLanguageData {
  languageCode: string;
  languageName: string;
  nativeName?: string;
  isActive?: boolean;
  displayOrder?: number;
}
interface UpdateLanguageData {
  languageName?: string;
  nativeName?: string;
  isActive?: boolean;
  displayOrder?: number;
}

// Query Key Factory
const languageKeys = {
  all: ['languages'] as const,
  lists: (params?: { isActive?: boolean }) =>
    [...languageKeys.all, 'list', params || {}] as const,
  details: () => [...languageKeys.all, 'detail'] as const,
  detail: (code: string | undefined) =>
    [...languageKeys.details(), code] as const,
};

// --- Queries ---

/**
 * Hook lấy danh sách tất cả các ngôn ngữ (có thể filter theo isActive).
 * Thường dùng để hiển thị trong dropdown chọn ngôn ngữ.
 */
export const useLanguages = (
  params?: { isActive?: boolean },
  options?: Omit<
    UseQueryOptions<LanguageListResponse, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryKey = languageKeys.lists(params);
  return useQuery<LanguageListResponse, Error>({
    queryKey: queryKey,
    queryFn: () => getLanguages(params),
    staleTime: 1000 * 60 * 60, // Dữ liệu ngôn ngữ ít thay đổi, cache 1 giờ
    ...options,
  });
};

/** Hook Admin lấy chi tiết một ngôn ngữ */
export const useLanguageDetail = (
  languageCode: string | undefined,
  options?: Omit<UseQueryOptions<Language, Error>, 'queryKey' | 'queryFn'>
) => {
  const queryKey = languageKeys.detail(languageCode);
  return useQuery<Language, Error>({
    queryKey: queryKey,
    queryFn: () => getLanguageByCode(languageCode!.toLowerCase()), // Chuẩn hóa code khi gọi
    enabled: !!languageCode, // Chỉ chạy khi có code
    ...options,
  });
};

// --- Mutations (Admin) ---

/** Hook Admin tạo ngôn ngữ mới */
export const useCreateLanguage = (
  options?: UseMutationOptions<Language, Error, CreateLanguageData>
) => {
  const queryClient = useQueryClient();
  return useMutation<Language, Error, CreateLanguageData>({
    mutationFn: (data) =>
      createLanguage({
        ...data,
        languageCode: data.languageCode.toLowerCase(),
      }), // Chuẩn hóa code
    onSuccess: () => {
      // Invalidate cache danh sách ngôn ngữ để load lại
      queryClient.invalidateQueries({ queryKey: languageKeys.lists() });
      console.log('Language created successfully.');
      // toast.success('Tạo ngôn ngữ thành công!');
    },
    onError: (error) => {
      console.error('Language creation failed:', error.message);
      // toast.error(error.message || 'Tạo ngôn ngữ thất bại.');
    },
    ...options,
  });
};

/** Hook Admin cập nhật ngôn ngữ */
export const useUpdateLanguage = (
  options?: UseMutationOptions<
    Language,
    Error,
    { languageCode: string; data: UpdateLanguageData }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    Language,
    Error,
    { languageCode: string; data: UpdateLanguageData }
  >({
    mutationFn: ({ languageCode, data }) =>
      updateLanguage(languageCode.toLowerCase(), data),
    onSuccess: (updatedLanguage) => {
      // Cập nhật cache chi tiết ngôn ngữ đó
      queryClient.setQueryData(
        languageKeys.detail(updatedLanguage.languageCode.toLowerCase()),
        updatedLanguage
      );
      // Invalidate cache danh sách ngôn ngữ
      queryClient.invalidateQueries({ queryKey: languageKeys.lists() });
      console.log('Language updated successfully.');
      // toast.success('Cập nhật ngôn ngữ thành công!');
    },
    onError: (error) => {
      console.error('Language update failed:', error.message);
      // toast.error(error.message || 'Cập nhật ngôn ngữ thất bại.');
    },
    ...options,
  });
};

/** Hook Admin xóa ngôn ngữ */
export const useDeleteLanguage = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    // Input là languageCode
    mutationFn: (languageCode) => deleteLanguage(languageCode.toLowerCase()),
    onSuccess: (_, languageCode) => {
      // languageCode là biến truyền vào mutationFn
      // Xóa cache chi tiết của ngôn ngữ đó
      queryClient.removeQueries({
        queryKey: languageKeys.detail(languageCode.toLowerCase()),
      });
      // Invalidate cache danh sách ngôn ngữ
      queryClient.invalidateQueries({ queryKey: languageKeys.lists() });
      console.log('Language deleted successfully.');
      // toast.success('Xóa ngôn ngữ thành công!');
    },
    onError: (error) => {
      console.error('Language deletion failed:', error.message);
      // toast.error(error.message || 'Xóa ngôn ngữ thất bại.');
    },
    ...options,
  });
};
