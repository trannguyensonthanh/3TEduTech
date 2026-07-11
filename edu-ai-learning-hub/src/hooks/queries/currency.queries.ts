// src/hooks/queries/currency.queries.ts
import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getCurrencies,
  createCurrency,
  updateCurrency,
  deleteCurrency,
  Currency,
  CurrencyListResponse,
  CurrencyQueryParams,
  CreateCurrencyData,
  UpdateCurrencyData,
} from '@/services/currency.service';

// Query Key Factory
export const currencyKeys = {
  all: ['currencies'] as const,
  lists: (params?: CurrencyQueryParams) =>
    [...currencyKeys.all, 'list', params || {}] as const,
  details: () => [...currencyKeys.all, 'detail'] as const,
  detail: (id: string | undefined) => [...currencyKeys.details(), id] as const,
};

// --- Queries ---
export const useCurrencies = (
  params?: CurrencyQueryParams,
  options?: Omit<
    UseQueryOptions<CurrencyListResponse, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryKey = currencyKeys.lists(params);
  return useQuery<CurrencyListResponse, Error>({
    queryKey,
    queryFn: () => getCurrencies(params),
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

// --- Mutations ---
export const useCreateCurrency = (
  options?: UseMutationOptions<Currency, Error, CreateCurrencyData>
) => {
  const queryClient = useQueryClient();
  return useMutation<Currency, Error, CreateCurrencyData>({
    mutationFn: createCurrency,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currencyKeys.lists() });
    },
    ...options,
  });
};

export const useUpdateCurrency = (
  options?: UseMutationOptions<
    Currency,
    Error,
    { currencyId: string; data: UpdateCurrencyData }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    Currency,
    Error,
    { currencyId: string; data: UpdateCurrencyData }
  >({
    mutationFn: ({ currencyId, data }) => updateCurrency(currencyId, data),
    onSuccess: (updatedCurrency) => {
      queryClient.invalidateQueries({ queryKey: currencyKeys.lists() });
      queryClient.setQueryData(
        currencyKeys.detail(updatedCurrency.currencyId),
        updatedCurrency
      );
    },
    ...options,
  });
};

export const useDeleteCurrency = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteCurrency,
    onSuccess: (_, currencyId) => {
      queryClient.invalidateQueries({ queryKey: currencyKeys.lists() });
      queryClient.removeQueries({ queryKey: currencyKeys.detail(currencyId) });
    },
    ...options,
  });
};
