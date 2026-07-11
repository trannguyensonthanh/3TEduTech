// src/hooks/queries/financials.queries.ts
import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getMyAvailableBalance,
  requestWithdrawal,
  // getMyWithdrawalHistory,
  // getMyPayoutHistory,
  reviewWithdrawalRequest,
  getPayouts,
  processPayoutExecution,
  AvailableBalanceResponse,
  // WithdrawalRequestData,
  WithdrawalRequest,
  ReviewWithdrawalData,
  WithdrawalHistoryResponse,
  WithdrawalHistoryParams,
  PayoutListResponse,
  PayoutQueryParams,
  Payout,
  ProcessPayoutData,
  TransactionHistoryParams,
  TransactionListResponse,
  getMyTransactions,
  WithdrawalActivityQueryParams,
  MonthlyEarningsQueryParams,
  getMyMonthlyEarnings,
  MonthlyEarningsResponse,
  CourseRevenueQueryParams,
  CourseRevenueResponse,
  getMyRevenueByCourse,
  RequestWithdrawalFormData,
  WithdrawalActivityListResponse,
  getWithdrawalActivityHistory,
  AdminWithdrawalRequestParams,
  AdminWithdrawalRequestListResponse,
  getWithdrawalRequestsForAdmin,
} from '@/services/financials.service';

// Query Key Factory
const financialsKeys = {
  all: ['financials'] as const,
  myBalance: () => [...financialsKeys.all, 'myBalance'] as const,

  myWithdrawalActivities: (params?: WithdrawalActivityQueryParams) =>
    [...financialsKeys.all, 'myWithdrawalActivities', params || {}] as const,
  myTransactions: (params?: TransactionHistoryParams) =>
    [...financialsKeys.all, 'myTransactions', params || {}] as const,
  adminWithdrawals: () => [...financialsKeys.all, 'adminWithdrawals'] as const, // Key chung cho admin list? Hoặc theo filter?
  adminPayouts: (params?: PayoutQueryParams) =>
    [...financialsKeys.all, 'adminPayouts', params || {}] as const,
  adminPayoutDetail: (id?: number) =>
    [...financialsKeys.all, 'adminPayoutDetail', id] as const,
  adminWithdrawalDetail: (id?: number) =>
    [...financialsKeys.all, 'adminWithdrawalDetail', id] as const,
  myMonthlyEarnings: (params?: MonthlyEarningsQueryParams) =>
    [...financialsKeys.all, 'myMonthlyEarnings', params || {}] as const,
  myRevenueByCourse: (params?: CourseRevenueQueryParams) =>
    [...financialsKeys.all, 'myRevenueByCourse', params || {}] as const,
  adminWithdrawalRequests: (params?: AdminWithdrawalRequestParams) =>
    [
      ...financialsKeys.all,
      'adminWithdrawalRequests',
      'list',
      params || {},
    ] as const,
};

// --- Instructor Queries ---

/** Hook Instructor lấy số dư */
export const useMyAvailableBalance = (
  options?: Omit<
    UseQueryOptions<AvailableBalanceResponse, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<AvailableBalanceResponse, Error>({
    queryKey: financialsKeys.myBalance(),
    queryFn: getMyAvailableBalance,
    // Cân nhắc staleTime ngắn hơn vì số dư có thể thay đổi thường xuyên
    staleTime: 1000 * 60 * 5, // 30 giây
    ...options,
  });
};

/** Hook Instructor lấy lịch sử giao dịch tổng hợp */
export const useMyTransactions = (
  params?: TransactionHistoryParams,
  options?: Omit<
    UseQueryOptions<TransactionListResponse, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryKey = financialsKeys.myTransactions(params);
  return useQuery<TransactionListResponse, Error>({
    queryKey: queryKey,
    queryFn: () => getMyTransactions(params),
    ...options,
  });
};

// --- Instructor Mutations ---

export const useRequestWithdrawal = (
  options?: UseMutationOptions<
    WithdrawalRequest,
    Error,
    RequestWithdrawalFormData
  > // *** Cập nhật kiểu input ***
) => {
  const queryClient = useQueryClient();
  return useMutation<WithdrawalRequest, Error, RequestWithdrawalFormData>({
    // *** Cập nhật kiểu input ***
    mutationFn: requestWithdrawal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialsKeys.myBalance() });
      queryClient.invalidateQueries({
        queryKey: financialsKeys.myWithdrawalActivities(),
      }); // Invalidate lịch sử hoạt động
    },
    onError: (error) => {
      console.error('Withdrawal request failed:', error.message);
      // toast.error(error.message || 'Gửi yêu cầu rút tiền thất bại.');
    },
    ...options,
  });
};

// --- Admin Queries ---

/** Hook Admin lấy danh sách Payouts */
export const useAdminGetPayouts = (
  params?: PayoutQueryParams,
  options?: Omit<
    UseQueryOptions<PayoutListResponse, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryKey = financialsKeys.adminPayouts(params);
  return useQuery<PayoutListResponse, Error>({
    queryKey: queryKey,
    queryFn: () => getPayouts(params),
    staleTime: 1000 * 60, // 1 minute
    ...options,
  });
};

/** Hook Instructor lấy lịch sử hoạt động rút tiền tổng hợp */
export const useMyWithdrawalActivities = (
  params?: WithdrawalActivityQueryParams,
  options?: Omit<
    UseQueryOptions<WithdrawalActivityListResponse, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryKey = financialsKeys.myWithdrawalActivities(params);
  return useQuery<WithdrawalActivityListResponse, Error>({
    queryKey: queryKey,
    queryFn: () => getWithdrawalActivityHistory(params),
    staleTime: 1000 * 60 * 2, // Cache 2 phút, điều chỉnh nếu cần
    ...options,
  });
};

// --- Admin Mutations ---

/** Hook Admin duyệt/từ chối yêu cầu rút tiền */
export const useReviewWithdrawalRequest = (
  options?: UseMutationOptions<
    WithdrawalRequest,
    Error,
    { requestId: number; data: ReviewWithdrawalData }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    WithdrawalRequest,
    Error,
    { requestId: number; data: ReviewWithdrawalData }
  >({
    mutationFn: ({ requestId, data }) =>
      reviewWithdrawalRequest(requestId, data), // Thiếu adminUser -> Cần lấy từ context hoặc truyền vào
    // Giả sử có thể lấy adminUser từ context global
    // mutationFn: ({ requestId, data }) => reviewWithdrawalRequest(requestId, data, adminUserFromContext),
    onSuccess: (updatedRequest, variables) => {
      // Invalidate lịch sử rút tiền của instructor liên quan
      queryClient.invalidateQueries({
        queryKey: financialsKeys.myWithdrawalActivities({
          /* instructorId: updatedRequest.InstructorID ? */
        }),
      });
      // Invalidate cache chi tiết request admin (nếu có)
      queryClient.invalidateQueries({
        queryKey: financialsKeys.adminWithdrawalDetail(variables.requestId),
      });
      // Invalidate cache danh sách request admin (nếu có)
      queryClient.invalidateQueries({
        queryKey: financialsKeys.adminWithdrawals(),
      });
      // Invalidate số dư của instructor
      queryClient.invalidateQueries({ queryKey: financialsKeys.myBalance() }); // Cần instructorId?
      console.log(`Withdrawal request ${variables.requestId} reviewed.`);
      // toast.success('Đã xử lý yêu cầu rút tiền.');
    },
    onError: (error) => {
      console.error('Review withdrawal request failed:', error.message);
      // toast.error(error.message || 'Xử lý yêu cầu thất bại.');
    },
    ...options,
  });
};

/** Hook Admin xử lý chi trả Payout */
export const useProcessPayoutExecution = (
  options?: UseMutationOptions<
    Payout,
    Error,
    { payoutId: number; data: ProcessPayoutData }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    Payout,
    Error,
    { payoutId: number; data: ProcessPayoutData }
  >({
    mutationFn: ({ payoutId, data }) => processPayoutExecution(payoutId, data), // Thiếu adminUser
    // mutationFn: ({ payoutId, data }) => processPayoutExecution(payoutId, data, adminUserFromContext),
    onSuccess: (updatedPayout, variables) => {
      // Invalidate danh sách payouts admin
      queryClient.invalidateQueries({
        queryKey: financialsKeys.adminPayouts(),
      });
      // Invalidate chi tiết payout admin (nếu có)
      queryClient.invalidateQueries({
        queryKey: financialsKeys.adminPayoutDetail(variables.payoutId),
      });
      // Invalidate lịch sử payouts của instructor
      queryClient.invalidateQueries({
        queryKey: financialsKeys.myWithdrawalActivities({
          /* instructorId: updatedPayout.InstructorID ? */
        }),
      });
      // Invalidate số dư của instructor nếu thành công
      if (updatedPayout.payoutStatusId === 'PAID') {
        queryClient.invalidateQueries({ queryKey: financialsKeys.myBalance() }); // Cần instructorId?
        queryClient.invalidateQueries({
          queryKey: financialsKeys.myTransactions(),
        }); // Invalidate revenue details
      }
      // Invalidate lịch sử withdrawal request nếu có liên kết
      queryClient.invalidateQueries({
        queryKey: financialsKeys.myWithdrawalActivities(),
      });
      queryClient.invalidateQueries({
        queryKey: financialsKeys.adminWithdrawals(),
      });

      console.log(
        `Payout ${variables.payoutId} processed with status ${updatedPayout.payoutStatusId}.`
      );
      // toast.success('Đã cập nhật trạng thái chi trả.');
    },
    onError: (error) => {
      console.error('Process payout execution failed:', error.message);
      // toast.error(error.message || 'Xử lý chi trả thất bại.');
    },
    ...options,
  });
};

/** Hook Instructor lấy lịch sử thu nhập theo tháng */
export const useMyMonthlyEarnings = (
  params?: MonthlyEarningsQueryParams,
  options?: Omit<
    UseQueryOptions<MonthlyEarningsResponse, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryKey = financialsKeys.myMonthlyEarnings(params);
  return useQuery<MonthlyEarningsResponse, Error>({
    queryKey: queryKey,
    queryFn: () => getMyMonthlyEarnings(params),
    ...(options || {}),
    // keepPreviousData should be passed via options if supported by your React Query version
  });
};

/** Hook Instructor lấy phân tích doanh thu theo khóa học */
export const useMyRevenueByCourse = (
  params?: CourseRevenueQueryParams,
  options?: Omit<
    UseQueryOptions<CourseRevenueResponse, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryKey = financialsKeys.myRevenueByCourse(params);
  return useQuery<CourseRevenueResponse, Error>({
    queryKey: queryKey,
    queryFn: () => getMyRevenueByCourse(params),
    ...(options || {}),
  });
};

/** Hook cho Admin lấy danh sách các yêu cầu rút tiền */
export const useAdminGetWithdrawalRequests = (
  params?: AdminWithdrawalRequestParams,
  options?: Omit<
    UseQueryOptions<AdminWithdrawalRequestListResponse, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryKey = financialsKeys.adminWithdrawalRequests(params);
  return useQuery<AdminWithdrawalRequestListResponse, Error>({
    queryKey,
    queryFn: () => getWithdrawalRequestsForAdmin(params),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60, // 1 minute
    ...options,
  });
};
