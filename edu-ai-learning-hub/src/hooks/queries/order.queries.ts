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
  cancelOrder,
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
    mutationFn: createOrderFromCart,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: cartKeys.myCart });
      queryClient.invalidateQueries({ queryKey: ['orders'], refetchType: 'active' });
      queryClient.setQueryData(orderKeys.myDetail(data.orderId), data);
      console.log(`Order ${data.orderId} created successfully.`);
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      console.error('Create order failed:', error.message);
      options?.onError?.(error, variables, context);
    },
  });
};

/** Hook hủy đơn hàng */
export const useCancelOrder = (
  options?: UseMutationOptions<{ message: string; order: Order }, Error, number>
) => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string; order: Order }, Error, number>({
    mutationFn: cancelOrder,
    ...options,
    onSuccess: async (data, orderId, context) => {
      queryClient.setQueryData(orderKeys.myDetail(orderId), data.order);
      await queryClient.invalidateQueries({ queryKey: ['orders'], refetchType: 'active' });
      console.log(`Order ${orderId} cancelled successfully.`);
      options?.onSuccess?.(data, orderId, context);
    },
    onError: (error, orderId, context) => {
      options?.onError?.(error, orderId, context);
    },
  });
};
