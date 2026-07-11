// src/hooks/queries/order.queries.ts
import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createOrderFromCart,
  getMyOrders,
  getMyOrderDetails,
  Order,
  OrderListResponse,
  OrderQueryParams,
} from '@/services/order.service';
import { cartKeys } from './cart.queries'; // Để invalidate cart sau khi tạo order

// Query Key Factory
const orderKeys = {
  all: ['orders'] as const,
  myLists: (params?: OrderQueryParams) =>
    [...orderKeys.all, 'myList', params || {}] as const,
  myDetails: () => [...orderKeys.all, 'myDetail'] as const,
  myDetail: (id: number | undefined) => [...orderKeys.myDetails(), id] as const,
};

// --- Queries ---

/** Hook lấy lịch sử đơn hàng */
export const useMyOrders = (
  params?: OrderQueryParams,
  options?: Omit<
    UseQueryOptions<OrderListResponse, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryKey = orderKeys.myLists(params);
  return useQuery<OrderListResponse, Error>({
    queryKey: queryKey,
    queryFn: () => getMyOrders(params),
    staleTime: 1000 * 60, // 1 minute
    ...options,
  });
};

/** Hook lấy chi tiết đơn hàng */
export const useMyOrderDetail = (
  orderId: number | undefined,
  options?: Omit<UseQueryOptions<Order, Error>, 'queryKey' | 'queryFn'>
) => {
  const queryKey = orderKeys.myDetail(orderId);
  return useQuery<Order, Error>({
    queryKey: queryKey,
    queryFn: () => getMyOrderDetails(orderId!),
    enabled: !!orderId,
    ...options,
  });
};

// --- Mutations ---

/** Hook tạo đơn hàng từ giỏ hàng */
export const useCreateOrderFromCart = (
  options?: UseMutationOptions<Order, Error, string | null | undefined>
) => {
  const queryClient = useQueryClient();
  return useMutation<Order, Error, string | null | undefined>({
    // Input là promotionCode (string | null | undefined)
    mutationFn: createOrderFromCart,
    onSuccess: (data) => {
      // Invalidate giỏ hàng (đã bị xóa)
      queryClient.invalidateQueries({ queryKey: cartKeys.myCart });
      // Invalidate danh sách đơn hàng
      queryClient.invalidateQueries({ queryKey: orderKeys.myLists() });
      // Có thể set cache cho đơn hàng mới tạo
      queryClient.setQueryData(orderKeys.myDetail(data.orderId), data);
      console.log(`Order ${data.orderId} created successfully.`);
      // toast.success('Tạo đơn hàng thành công!');
      // Thường sẽ chuyển hướng đến trang thanh toán hoặc chi tiết đơn hàng
    },
    onError: (error) => {
      console.error('Create order failed:', error.message);
      // toast.error(error.message || 'Tạo đơn hàng thất bại.');
    },
    ...options,
  });
};
