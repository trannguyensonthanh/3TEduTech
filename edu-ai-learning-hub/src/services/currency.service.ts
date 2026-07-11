// src/services/currency.service.ts
import apiHelper from './apiHelper';
import { IsoDateTimeString } from '@/types/common.types';

export interface Currency {
  currencyId: string;
  currencyName: string;
  type: 'FIAT' | 'CRYPTO';
  decimalPlaces: number;
  createdAt?: IsoDateTimeString; // Có thể backend trả về
  updatedAt?: IsoDateTimeString; // Có thể backend trả về
}

export interface CurrencyListResponse {
  currencies: Currency[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface CurrencyQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
}

export interface CreateCurrencyData {
  currencyId: string;
  currencyName: string;
  type: 'FIAT' | 'CRYPTO';
  decimalPlaces: number;
}

export interface UpdateCurrencyData {
  currencyName?: string;
  type?: 'FIAT' | 'CRYPTO';
  decimalPlaces?: number;
}

/** Lấy danh sách tiền tệ với phân trang */
export const getCurrencies = async (
  params?: CurrencyQueryParams
): Promise<CurrencyListResponse> => {
  return apiHelper.get('/currencies', undefined, params);
};

/** Tạo tiền tệ mới */
export const createCurrency = async (
  data: CreateCurrencyData
): Promise<Currency> => {
  return apiHelper.post('/currencies', data);
};

/** Cập nhật tiền tệ */
export const updateCurrency = async (
  currencyId: string,
  data: UpdateCurrencyData
): Promise<Currency> => {
  return apiHelper.patch(`/currencies/${currencyId}`, data);
};

/** Xóa tiền tệ */
export const deleteCurrency = async (currencyId: string): Promise<void> => {
  await apiHelper.delete(`/currencies/${currencyId}`);
};
