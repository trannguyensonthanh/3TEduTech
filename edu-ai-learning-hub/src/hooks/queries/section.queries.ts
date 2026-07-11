// src/hooks/queries/section.queries.ts
import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
  useQuery,
} from '@tanstack/react-query';
import {
  createSection,
  updateSectionsOrder,
  updateSection,
  deleteSection,
  Section,
  SectionListData,
  CreateSectionData,
  UpdateSectionData,
  SectionOrderData,
} from '@/services/section.service';
import { courseKeys } from './course.queries'; // Import course keys để invalidate

// --- Mutations ---

/** Hook tạo section */
export const useCreateSection = (
  options?: UseMutationOptions<
    Section,
    Error,
    { courseId: number; data: CreateSectionData }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    Section,
    Error,
    { courseId: number; data: CreateSectionData }
  >({
    mutationFn: ({ courseId, data }) => createSection(courseId, data),
    onSuccess: (data, variables) => {
      // Invalidate cache chi tiết khóa học chứa section này
      queryClient.invalidateQueries({
        queryKey: courseKeys.detailById(variables.courseId),
      });
      queryClient.invalidateQueries({
        queryKey: courseKeys.detailBySlug(undefined),
      }); // Cần slug? Hoặc invalidate all details
      console.log('Section created successfully.');
      // toast.success('Tạo chương mới thành công!');
    },
    onError: (error) => {
      console.error('Section creation failed:', error.message);
      // toast.error(error.message || 'Tạo chương mới thất bại.');
    },
    ...options,
  });
};

/** Hook cập nhật thứ tự sections */
export const useUpdateSectionsOrder = (
  options?: UseMutationOptions<
    SectionListData,
    Error,
    { courseId: number; sectionOrders: SectionOrderData[] }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    SectionListData,
    Error,
    { courseId: number; sectionOrders: SectionOrderData[] }
  >({
    mutationFn: ({ courseId, sectionOrders }) =>
      updateSectionsOrder(courseId, sectionOrders),
    onSuccess: (data, variables) => {
      // Cập nhật cache chi tiết khóa học với thứ tự mới? Hơi phức tạp
      // Cách đơn giản là invalidate cache chi tiết khóa học
      queryClient.invalidateQueries({
        queryKey: courseKeys.detailById(variables.courseId),
      });
      queryClient.invalidateQueries({
        queryKey: courseKeys.detailBySlug(undefined),
      });
      console.log('Sections order updated.');
      // toast.success('Cập nhật thứ tự chương thành công!');
    },
    onError: (error) => {
      console.error('Update sections order failed:', error.message);
      // toast.error(error.message || 'Cập nhật thứ tự chương thất bại.');
    },
    ...options,
  });
};

/** Hook cập nhật section */
export const useUpdateSection = (
  options?: UseMutationOptions<
    Section,
    Error,
    { courseId: number; sectionId: number; data: UpdateSectionData }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    Section,
    Error,
    { courseId: number; sectionId: number; data: UpdateSectionData }
  >({
    mutationFn: ({ courseId, sectionId, data }) =>
      updateSection(courseId, sectionId, data),
    onSuccess: (data, variables) => {
      // Invalidate cache chi tiết khóa học
      queryClient.invalidateQueries({
        queryKey: courseKeys.detailById(variables.courseId),
      });
      queryClient.invalidateQueries({
        queryKey: courseKeys.detailBySlug(undefined),
      });
      console.log('Section updated successfully.');
      // toast.success('Cập nhật chương thành công!');
    },
    onError: (error) => {
      console.error('Section update failed:', error.message);
      // toast.error(error.message || 'Cập nhật chương thất bại.');
    },
    ...options,
  });
};

/** Hook xóa section */
export const useDeleteSection = (
  options?: UseMutationOptions<
    void,
    Error,
    { courseId: number; sectionId: number }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { courseId: number; sectionId: number }>({
    mutationFn: ({ courseId, sectionId }) => deleteSection(courseId, sectionId),
    onSuccess: (_, variables) => {
      // Invalidate cache chi tiết khóa học
      queryClient.invalidateQueries({
        queryKey: courseKeys.detailById(variables.courseId),
      });
      queryClient.invalidateQueries({
        queryKey: courseKeys.detailBySlug(undefined),
      });
      console.log('Section deleted successfully.');
      // toast.success('Xóa chương thành công!');
    },
    onError: (error) => {
      console.error('Section deletion failed:', error.message);
      // toast.error(error.message || 'Xóa chương thất bại.');
    },
    ...options,
  });
};
