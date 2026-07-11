// src/hooks/queries/exchangeRate.queries.ts
import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getExchangeRates,
  createExchangeRate,
  updateExchangeRate,
  deleteExchangeRate,
  ExchangeRate,
  ExchangeRateListResponse,
  ExchangeRateQueryParams,
  CreateExchangeRateData,
  UpdateExchangeRateData,
  fetchExternalRate,
  getLatestRate,
  LatestRateResponse,
} from '@/services/exchangeRate.service';

export const exchangeRateKeys = {
  all: ['exchangeRates'] as const,
  lists: (params?: ExchangeRateQueryParams) =>
    [...exchangeRateKeys.all, 'list', params || {}] as const,
  details: () => [...exchangeRateKeys.all, 'detail'] as const,
  detail: (id: number | undefined) =>
    [...exchangeRateKeys.details(), id] as const,
};

export const useExchangeRates = (
  params?: ExchangeRateQueryParams,
  options?: Omit<
    UseQueryOptions<ExchangeRateListResponse, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryKey = exchangeRateKeys.lists(params);
  return useQuery<ExchangeRateListResponse, Error>({
    queryKey,
    queryFn: () => getExchangeRates(params),
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useCreateExchangeRate = (
  options?: UseMutationOptions<ExchangeRate, Error, CreateExchangeRateData>
) => {
  const queryClient = useQueryClient();
  return useMutation<ExchangeRate, Error, CreateExchangeRateData>({
    mutationFn: createExchangeRate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exchangeRateKeys.lists() });
    },
    ...options,
  });
};

export const useUpdateExchangeRate = (
  options?: UseMutationOptions<
    ExchangeRate,
    Error,
    { rateId: number; data: UpdateExchangeRateData }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    ExchangeRate,
    Error,
    { rateId: number; data: UpdateExchangeRateData }
  >({
    mutationFn: ({ rateId, data }) => updateExchangeRate(rateId, data),
    onSuccess: (updatedRate) => {
      queryClient.invalidateQueries({ queryKey: exchangeRateKeys.lists() });
      queryClient.setQueryData(
        exchangeRateKeys.detail(updatedRate.rateId),
        updatedRate
      );
    },
    ...options,
  });
};

export const useDeleteExchangeRate = (
  options?: UseMutationOptions<void, Error, number>
) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: deleteExchangeRate,
    onSuccess: (_, rateId) => {
      queryClient.invalidateQueries({ queryKey: exchangeRateKeys.lists() });
      queryClient.removeQueries({ queryKey: exchangeRateKeys.detail(rateId) });
    },
    ...options,
  });
};

// Thêm mutation mới, dùng mutation vì đây là một hành động "lấy" có chủ đích, không phải query nền
export const useFetchExternalRate = (
  options?: UseMutationOptions<
    { rate: number; source: string },
    Error,
    { from: string; to: string }
  >
) => {
  return useMutation<
    { rate: number; source: string },
    Error,
    { from: string; to: string }
  >({
    mutationFn: ({ from, to }) => fetchExternalRate(from, to),
    ...options,
  });
};

export const useLatestRate = (
  from: string,
  to: string,
  options?: Omit<
    UseQueryOptions<LatestRateResponse, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryKey = ['latestRate', from, to];
  return useQuery<LatestRateResponse, Error>({
    queryKey,
    queryFn: () => getLatestRate(from, to),
    enabled: !!from && !!to,
    staleTime: 1000 * 60 * 5, // Cache tỷ giá trong 5 phút
    ...options,
  });
};
