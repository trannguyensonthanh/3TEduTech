/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/financials.service.ts
import { IsoDateTimeString } from '@/services/lesson.service';
import apiHelper from './apiHelper';

export interface PayoutOption {
  currencyId: 'VND' | 'USD' | string;
  minWithdrawal: number;
  maxWithdrawal: number;
  exchangeRate?: number;
  rateSource?: string;
}

export interface AvailableBalanceResponse {
  baseBalance: {
    currencyId: 'VND' | string;
    amount: number;
  };
  payoutOptions: PayoutOption[];
}

// export interface WithdrawalRequestData {
//   requestedAmount: number;
//   // currency và method cố định ở backend, không cần gửi lên
//   instructorNotes?: string;
// }

export interface RequestWithdrawalFormData {
  requestedAmount: number;
  requestedCurrencyId: 'VND' | 'USD'; // Loại tiền tệ người dùng chọn
  instructorPayoutMethodId: number;
  notes?: string;
}

export interface WithdrawalRequest {
  requestId: number;
  instructorId: number;
  requestedAmount: number;
  requestedCurrencyId: string;
  paymentMethodId: string;
  payoutDetailsSnapshot: string; // JSON string
  status: string; // WithdrawalStatus Enum
  instructorNotes?: string | null;
  adminId?: number | null;
  instructorName?: string;
  adminNotes?: string | null;
  processedAt?: string | null; // ISO Date string
  payoutId?: number | null;
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
}

export interface ReviewWithdrawalData {
  decision: 'APPROVED' | 'REJECTED';
  adminNotes?: string;
}

export interface WithdrawalHistoryResponse {
  requests: Partial<WithdrawalRequest>[]; // Thông tin rút gọn
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WithdrawalHistoryParams {
  page?: number;
  limit?: number;
  status?: string; // WithdrawalStatus Enum
}

export interface Payout {
  payoutId: number;
  amount: number;
  currencyId: string;
  payoutStatusId: string; // PayoutStatus Enum
  requestedAt: string;
  processedAt?: string | null;
  completedAt?: string | null;
  paymentMethodId: string;
  // Thêm các trường cần thiết khác từ API response
  instructorName?: string;
  adminName?: string;
  fee?: number;
  adminNote?: string;
}

export interface PayoutListResponse {
  payouts: Partial<Payout>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PayoutQueryParams {
  page?: number;
  limit?: number;
  instructorId?: number;
  statusId?: string; // PayoutStatus Enum
  paymentMethodId?: string;
  sortBy?: string;
}

export interface ProcessPayoutData {
  status: 'PAID' | 'FAILED';
  actualAmount?: number;
  actualCurrencyId?: string; // Currency Enum
  exchangeRate?: number;
  fee?: number;
  completedAt?: string; // ISO Date string
  adminNotes?: string;
}
// Interface cho response từ API lấy lịch sử giao dịch
export interface TransactionListResponse {
  // Đổi tên từ RevenueDetailsResponse
  transactions: InstructorTransactionDetail[]; // Đổi tên key
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Interface cho query params
export interface TransactionHistoryParams {
  // Đổi tên từ RevenueDetailsParams
  page?: number;
  limit?: number;
  type?: 'ALL' | 'CREDIT_SALE' | 'DEBIT_WITHDRAWAL' | string; // Thêm các type khác
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}
// Interface cho một giao dịch doanh thu/chi trả chi tiết hiển thị cho Instructor
export interface InstructorTransactionDetail {
  transactionId: number; // TransactionID từ InstructorBalanceTransactions
  type: string; // 'CREDIT_SALE', 'DEBIT_WITHDRAWAL', etc.
  amount: number; // Số tiền (+/-)
  currency: string;
  balanceAfter: number;
  transactionTimestamp: string; // TransactionTimestamp
  description: string | null;
  orderId?: number | null;
  courseName?: string | null;
  courseSlug?: string | null;
  sourcePaymentMethodName?: string | null; // Phương thức người mua dùng để thanh toán
  sourcePaymentExternalID?: string | null; // Mã giao dịch của người mua
  payoutId?: number | null; // ID của Payout nếu là giao dịch rút tiền
  payoutStatusId?: string | null;
  payoutDate?: string | null;
  status?: string | null; // chưa có
  // Thêm các trường từ join nếu cần
}

export interface WithdrawalActivityItem {
  // Từ WithdrawalRequests
  requestId: number;
  requestedAmount: number;
  requestedCurrencyId: string;
  requestStatus:
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED'
    | 'PROCESSING_PAYMENT'
    | 'CANCELLED'; // Status của YÊU CẦU
  requestedAt: IsoDateTimeString;
  instructorNotes?: string | null;
  adminNotesForRequest?: string | null; // Ghi chú của admin cho việc duyệt/từ chối request
  processedAt?: IsoDateTimeString | null; // Thời điểm request được admin xử lý (duyệt/từ chối)

  // Từ Payouts (nếu request đã được approve và có payout tương ứng)
  payoutId?: number | null;
  actualAmountPaid?: number | null; // Số tiền thực nhận sau phí
  payoutCurrencyId?: string | null; // Tiền tệ của payout (có thể khác requestedCurrency)
  exchangeRateUsed?: number | null; // Nếu có chuyển đổi tiền tệ
  transactionFee?: number | null;
  payoutStatus?: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED'; // Status của việc CHI TRẢ
  paymentMethodUsed?: string | null; // Tên phương thức (ví dụ: "PayPal", "Bank Transfer")
  payoutDetailsSnapshot?: any | null; // Thông tin chi tiết tài khoản nhận tiền tại thời điểm chi trả
  paymentCompletedAt?: IsoDateTimeString | null; // Thời điểm tiền thực sự được gửi/hoàn thành
  externalTransactionId?: string | null; // Mã giao dịch từ bên thứ 3 (PayPal, ngân hàng)
  adminNotesForPayout?: string | null; // Ghi chú của admin cho việc thực hiện payout
}

export interface WithdrawalActivityListResponse {
  activities: WithdrawalActivityItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WithdrawalActivityQueryParams {
  page?: number;
  limit?: number;
  // Filter theo trạng thái chung của "hành trình" này, backend sẽ map sang status của request hoặc payout
  // Ví dụ: 'PENDING' (request pending), 'PROCESSING' (request approved, payout pending/processing), 'COMPLETED' (payout paid), 'FAILED' (request rejected hoặc payout failed)
  overallStatus?:
    | 'PENDING'
    | 'PROCESSING'
    | 'COMPLETED'
    | 'FAILED'
    | 'REJECTED'
    | 'CANCELLED';
  dateFrom?: IsoDateTimeString;
  dateTo?: IsoDateTimeString;
  sortBy?:
    | 'requestedAt:desc'
    | 'requestedAt:asc'
    | 'paymentCompletedAt:desc'
    | 'paymentCompletedAt:asc';
}

// Interface cho API Lịch sử thu nhập theo tháng
export interface MonthlyEarningItem {
  month: string; // "YYYY-MM"
  totalRevenue: number;
  netEarnings: number;
}
export interface MonthlyEarningsResponse {
  earnings: MonthlyEarningItem[];
  currencyId: string;
}
export interface MonthlyEarningsQueryParams {
  period?: 'last_6_months' | 'last_12_months' | string; // string cho 'year_YYYY'
  courseId?: number;
}

// Interface cho API Phân tích doanh thu theo khóa học
export interface CourseRevenueItem {
  courseId: number;
  courseName: string;
  totalSalesCount: number;
  totalRevenue: number;
  netEarnings: number;
  percentageOfTotalEarnings: number;
  courseSlug: string;
}
export interface CourseRevenueResponse {
  courses: CourseRevenueItem[];
  currencyId: string;
  totalCourses: number;
}
export interface CourseRevenueQueryParams {
  period?: 'last_6_months' | 'last_12_months' | string; // string cho 'year_YYYY'
}

export interface AdminWithdrawalRequestParams {
  page?: number;
  limit?: number;
  status?: string;
  instructorId?: number;
  sortBy?: string;
}

export interface AdminWithdrawalRequestListResponse {
  requests: WithdrawalRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// --- Instructor APIs ---

/** Instructor: Lấy số dư khả dụng */
export const getMyAvailableBalance =
  async (): Promise<AvailableBalanceResponse> => {
    return apiHelper.get('/financials/balance');
  };

/** Instructor: Tạo yêu cầu rút tiền */
export const requestWithdrawal = async (
  data: RequestWithdrawalFormData
): Promise<WithdrawalRequest> => {
  return apiHelper.post('/financials/withdrawals/request', data);
};

/** Instructor: Lấy lịch sử hoạt động rút tiền tổng hợp */
export const getWithdrawalActivityHistory = async (
  params?: WithdrawalActivityQueryParams
): Promise<WithdrawalActivityListResponse> => {
  return apiHelper.get('/financials/payout-activity', undefined, params);
};

/** Instructor: Lấy chi tiết các giao dịch doanh thu/chi trả */
export const getMyTransactions = async (
  params?: TransactionHistoryParams
): Promise<TransactionListResponse> => {
  // Gọi API mới /financials/transactions
  return apiHelper.get('/financials/transactions', undefined, params);
};
// --- Admin APIs ---

/** Admin: Duyệt/Từ chối yêu cầu rút tiền */
export const reviewWithdrawalRequest = async (
  requestId: number,
  data: ReviewWithdrawalData
): Promise<WithdrawalRequest> => {
  return apiHelper.patch(`/financials/withdrawals/${requestId}/review`, data);
};

/** Admin: Lấy danh sách Payouts */
export const getPayouts = async (
  params?: PayoutQueryParams
): Promise<PayoutListResponse> => {
  return apiHelper.get('/financials/payouts', undefined, params);
};

/** Admin: Xử lý chi trả */
export const processPayoutExecution = async (
  payoutId: number,
  data: ProcessPayoutData
): Promise<Payout> => {
  return apiHelper.patch(`/financials/payouts/${payoutId}/process`, data);
};

/** Instructor: Lấy lịch sử thu nhập theo tháng */
export const getMyMonthlyEarnings = async (
  params?: MonthlyEarningsQueryParams
): Promise<MonthlyEarningsResponse> => {
  return apiHelper.get('/financials/monthly-earnings', undefined, params);
};

/** Instructor: Lấy phân tích doanh thu theo khóa học */
export const getMyRevenueByCourse = async (
  params?: CourseRevenueQueryParams
): Promise<CourseRevenueResponse> => {
  return apiHelper.get('/financials/revenue-by-course', undefined, params);
};

/** Admin: Lấy danh sách các yêu cầu rút tiền */
export const getWithdrawalRequestsForAdmin = async (
  params?: AdminWithdrawalRequestParams
): Promise<AdminWithdrawalRequestListResponse> => {
  return apiHelper.get('/financials/withdrawal-requests', undefined, params);
};
