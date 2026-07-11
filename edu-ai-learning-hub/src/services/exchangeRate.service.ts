// src/services/exchangeRate.service.ts
import apiHelper from './apiHelper';
import { IsoDateTimeString } from '@/types/common.types';

export interface ExchangeRate {
  rateId: number;
  fromCurrencyId: string;
  toCurrencyId: string;
  rate: number;
  effectiveTimestamp: IsoDateTimeString;
  source?: string | null;
}

export interface ExchangeRateListResponse {
  exchangeRates: ExchangeRate[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface ExchangeRateQueryParams {
  page?: number;
  limit?: number;
  fromCurrency?: string;
  toCurrency?: string;
}

export interface CreateExchangeRateData {
  fromCurrencyId: string;
  toCurrencyId: string;
  rate: number;
  effectiveTimestamp: string; // ISO string
  source?: string;
}

export interface UpdateExchangeRateData {
  rate?: number;
  effectiveTimestamp?: string; // ISO string
  source?: string;
}

export interface LatestRateResponse {
  from: string;
  to: string;
  rate: number;
  source: string;
  lastUpdated: string;
}

/** Lấy danh sách tỷ giá */
export const getExchangeRates = async (
  params?: ExchangeRateQueryParams
): Promise<ExchangeRateListResponse> => {
  return apiHelper.get('/exchange-rates', undefined, params);
};

/** Tạo tỷ giá mới */
export const createExchangeRate = async (
  data: CreateExchangeRateData
): Promise<ExchangeRate> => {
  return apiHelper.post('/exchange-rates', data);
};

/** Cập nhật tỷ giá */
export const updateExchangeRate = async (
  rateId: number,
  data: UpdateExchangeRateData
): Promise<ExchangeRate> => {
  return apiHelper.patch(`/exchange-rates/${rateId}`, data);
};

/** Xóa tỷ giá */
export const deleteExchangeRate = async (rateId: number): Promise<void> => {
  await apiHelper.delete(`/exchange-rates/${rateId}`);
};

/** Lấy tỷ giá tự động từ dịch vụ bên ngoài qua backend */
export const fetchExternalRate = async (
  fromCurrency: string,
  toCurrency: string
): Promise<{ rate: number; source: string }> => {
  return apiHelper.get('/exchange-rates/fetch-external-rate', undefined, {
    from: fromCurrency,
    to: toCurrency,
  });
};

/** Lấy tỷ giá mới nhất giữa hai loại tiền tệ */
export const getLatestRate = async (
  from: string,
  to: string
): Promise<LatestRateResponse> => {
  return apiHelper.get('/exchange-rates/latest', undefined, { from, to });
};
