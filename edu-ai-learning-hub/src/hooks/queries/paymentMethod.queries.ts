// src/hooks/queries/paymentMethod.queries.ts
import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  PaymentMethod,
  PaymentMethodListResponse,
  PaymentMethodQueryParams,
  CreatePaymentMethodData,
  UpdatePaymentMethodData,
} from '@/services/paymentMethod.service';

export const paymentMethodKeys = {
  all: ['paymentMethods'] as const,
  lists: (params?: PaymentMethodQueryParams) =>
    [...paymentMethodKeys.all, 'list', params || {}] as const,
  details: () => [...paymentMethodKeys.all, 'detail'] as const,
  detail: (id: string | undefined) =>
    [...paymentMethodKeys.details(), id] as const,
};

export const usePaymentMethods = (
  params?: PaymentMethodQueryParams,
  options?: Omit<
    UseQueryOptions<PaymentMethodListResponse, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryKey = paymentMethodKeys.lists(params);
  return useQuery<PaymentMethodListResponse, Error>({
    queryKey,
    queryFn: () => getPaymentMethods(params),
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useCreatePaymentMethod = (
  options?: UseMutationOptions<PaymentMethod, Error, CreatePaymentMethodData>
) => {
  const queryClient = useQueryClient();
  return useMutation<PaymentMethod, Error, CreatePaymentMethodData>({
    mutationFn: createPaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentMethodKeys.lists() });
    },
    ...options,
  });
};

export const useUpdatePaymentMethod = (
  options?: UseMutationOptions<
    PaymentMethod,
    Error,
    { methodId: string; data: UpdatePaymentMethodData }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    PaymentMethod,
    Error,
    { methodId: string; data: UpdatePaymentMethodData }
  >({
    mutationFn: ({ methodId, data }) => updatePaymentMethod(methodId, data),
    onSuccess: (updatedMethod) => {
      queryClient.invalidateQueries({ queryKey: paymentMethodKeys.lists() });
      queryClient.setQueryData(
        paymentMethodKeys.detail(updatedMethod.methodId),
        updatedMethod
      );
    },
    ...options,
  });
};

export const useDeletePaymentMethod = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deletePaymentMethod,
    onSuccess: (_, methodId) => {
      queryClient.invalidateQueries({ queryKey: paymentMethodKeys.lists() });
      queryClient.removeQueries({
        queryKey: paymentMethodKeys.detail(methodId),
      });
    },
    ...options,
  });
};
