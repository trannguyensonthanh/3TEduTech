// src/hooks/queries/cart.queries.ts
import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import {
  viewMyCart,
  addCourseToCart,
  removeCourseFromCart,
  clearMyCart,
  CartDetails,
} from '@/services/cart.service';

// Query Key Factory
export const cartKeys = {
  myCart: ['myCart'] as const, // Chỉ có một giỏ hàng cho user hiện tại
};

// --- Queries ---

/** Hook lấy giỏ hàng của user hiện tại */
export const useMyCart = (
  options?: Omit<UseQueryOptions<CartDetails, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<CartDetails, Error>({
    queryKey: cartKeys.myCart,
    queryFn: viewMyCart,
    staleTime: 1000 * 60, // Cache giỏ hàng trong 1 phút
    ...options,
  });
};

// --- Mutations ---

/** Hook thêm khóa học vào giỏ */
export const useAddCourseToCart = (
  options?: UseMutationOptions<
    { message: string; cart: CartDetails },
    Error,
    number
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string; cart: CartDetails }, Error, number>({
    // Input là courseId
    mutationFn: addCourseToCart,
    onSuccess: (data) => {
      // Cập nhật cache giỏ hàng với dữ liệu mới nhất
      queryClient.setQueryData(cartKeys.myCart, data.cart);
      console.log('Course added to cart.');
      // toast.success(data.message);
    },
    onError: (error) => {
      console.error('Add to cart failed:', error.message);
      // toast.error(error.message || 'Thêm vào giỏ hàng thất bại.');
    },
    ...options,
  });
};

/** Hook xóa khóa học khỏi giỏ */
export const useRemoveCourseFromCart = (
  options?: UseMutationOptions<
    { message: string; cart: CartDetails },
    Error,
    number
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string; cart: CartDetails }, Error, number>({
    // Input là courseId
    mutationFn: removeCourseFromCart,
    onSuccess: (data, courseId) => {
      queryClient.setQueryData(cartKeys.myCart, data.cart);
      console.log(`Course ${courseId} removed from cart.`);
      // toast.success(data.message);
    },
    onError: (error) => {
      console.error('Remove from cart failed:', error.message);
      // toast.error(error.message || 'Xóa khỏi giỏ hàng thất bại.');
    },
    ...options,
  });
};

/** Hook xóa toàn bộ giỏ hàng */
export const useClearMyCart = (
  options?: UseMutationOptions<
    { message: string; cart: CartDetails },
    Error,
    void
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string; cart: CartDetails }, Error, void>({
    mutationFn: clearMyCart,
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.myCart, data.cart); // Cập nhật giỏ hàng rỗng
      console.log('Cart cleared.');
      // toast.success(data.message);
    },
    onError: (error) => {
      console.error('Clear cart failed:', error.message);
      // toast.error(error.message || 'Xóa giỏ hàng thất bại.');
    },
    ...options,
  });
};
