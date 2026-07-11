// src/hooks/queries/category.queries.ts
import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query';
import {
  getCategories,
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
  CategoryQueryParams,
  CategoryListData,
  Category,
  CreateCategoryData,
  UpdateCategoryData,
  getCategoryBySlug,
} from '@/services/category.service';
import { CategoryFilterItem } from '@/types/common.types';

// Query Key Factory (giúp quản lý keys nhất quán)
const categoryKeys = {
  all: ['categories'] as const,
  lists: (params?: CategoryQueryParams) =>
    [...categoryKeys.all, 'list', params || {}] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: number | undefined) => [...categoryKeys.details(), id] as const,
  detailBySlug: (slug: string | undefined) =>
    [...categoryKeys.details(), 'slug', slug] as const, // Key mới cho slug
};

// --- Queries ---

export const useMockFilterCategories = (): UseQueryResult<
  CategoryFilterItem[],
  Error
> => {
  console.warn('useFilterCategories is mocked.');
  return {
    data: [],
    isLoading: true,
    isError: false,
    error: null,
    // Thêm các thuộc tính khác của UseQueryResult nếu component của bạn dùng đến
    isFetching: false,
    status: 'pending', // hoặc 'loading' tùy phiên bản
    // ... và các hàm refetch, etc. nếu cần
  } as UseQueryResult<CategoryFilterItem[], Error>; // Ép kiểu để TypeScript chấp nhận
};

/** Hook lấy danh sách categories */
export const useCategories = (
  params?: CategoryQueryParams,
  options?: Omit<
    UseQueryOptions<CategoryListData, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryKey = categoryKeys.lists(params);
  return useQuery<CategoryListData, Error>({
    queryKey: queryKey,
    queryFn: () => getCategories(params),
    staleTime: 5000, // Tốt cho phân trang/filter, giữ dữ liệu cũ trong 5 giây
    ...options,
  });
};

/** Hook lấy chi tiết category */
export const useCategoryDetail = (
  categoryId: number | undefined,
  options?: Omit<UseQueryOptions<Category, Error>, 'queryKey' | 'queryFn'>
) => {
  const queryKey = categoryKeys.detail(categoryId);
  return useQuery<Category, Error>({
    queryKey: queryKey,
    queryFn: () => getCategoryById(categoryId!), // Dùng ! vì enabled đảm bảo id có giá trị
    enabled: !!categoryId, // Chỉ chạy query khi categoryId có giá trị
    ...options,
  });
};

// --- Mutations ---

/** Hook tạo category */
export const useCreateCategory = (
  options?: UseMutationOptions<Category, Error, CreateCategoryData>
) => {
  const queryClient = useQueryClient();
  return useMutation<Category, Error, CreateCategoryData>({
    mutationFn: createCategory,
    onSuccess: () => {
      // Invalidate query lấy danh sách categories để load lại
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      console.log('Category created successfully.');
      // toast.success('Tạo danh mục thành công!');
    },
    onError: (error) => {
      console.error('Category creation failed:', error.message);
      // toast.error(error.message || 'Tạo danh mục thất bại.');
    },
    ...options,
  });
};

/** Hook cập nhật category */
export const useUpdateCategory = (
  options?: UseMutationOptions<
    Category,
    Error,
    { categoryId: number; data: UpdateCategoryData }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    Category,
    Error,
    { categoryId: number; data: UpdateCategoryData }
  >({
    mutationFn: ({ categoryId, data }) => updateCategory(categoryId, data),
    onSuccess: (updatedCategory) => {
      // Cập nhật cache chi tiết (nếu có)
      queryClient.setQueryData(
        categoryKeys.detail(updatedCategory.categoryId),
        updatedCategory
      );
      // Invalidate cache danh sách
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      console.log('Category updated successfully.');
      // toast.success('Cập nhật danh mục thành công!');
    },
    onError: (error) => {
      console.error('Category update failed:', error.message);
      // toast.error(error.message || 'Cập nhật danh mục thất bại.');
    },
    ...options,
  });
};

/** Hook xóa category */
export const useDeleteCategory = (
  options?: UseMutationOptions<void, Error, number>
) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: deleteCategory,
    onSuccess: (_, categoryId) => {
      // Biến thứ 2 là biến truyền vào mutationFn
      // Xóa cache chi tiết (nếu có)
      queryClient.removeQueries({ queryKey: categoryKeys.detail(categoryId) });
      // Invalidate cache danh sách
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      console.log('Category deleted successfully.');
      // toast.success('Xóa danh mục thành công!');
    },
    onError: (error) => {
      console.error('Category deletion failed:', error.message);
      // toast.error(error.message || 'Xóa danh mục thất bại.');
    },
    ...options,
  });
};

/** Hook lấy chi tiết category bằng Slug */
export const useCategoryBySlug = (
  categorySlug: string | undefined,
  options?: Omit<UseQueryOptions<Category, Error>, 'queryKey' | 'queryFn'>
) => {
  const queryKey = categoryKeys.detailBySlug(categorySlug);
  return useQuery<Category, Error>({
    queryKey: queryKey,
    queryFn: () => {
      if (!categorySlug) {
        return Promise.reject(new Error('Category slug is required'));
      }
      return getCategoryBySlug(categorySlug);
    },
    enabled: !!categorySlug, // Chỉ chạy query khi categorySlug có giá trị
    staleTime: 1000 * 60 * 5, // Cache chi tiết category 5 phút
    ...options,
  });
};

// Tương tự tạo hooks cho Levels và Skills...
