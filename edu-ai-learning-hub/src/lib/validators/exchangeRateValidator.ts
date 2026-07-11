// src/lib/validators/exchangeRateValidator.ts
import { z } from 'zod';

export const exchangeRateSchema = z
  .object({
    fromCurrencyId: z
      .string()
      .min(1, { message: 'Please select a "From" currency.' }),
    toCurrencyId: z
      .string()
      .min(1, { message: 'Please select a "To" currency.' }),
    rate: z.coerce
      .number() // Dùng coerce để tự động chuyển string từ input sang number
      .gt(0, { message: 'Rate must be greater than 0.' }), // gt = greater than
    effectiveTimestamp: z
      .string()
      .min(1, { message: 'Effective timestamp is required.' })
      .transform((str) => new Date(str).toISOString()), // Chuẩn hóa về ISO string
    source: z.string().optional(),
  })
  .refine((data) => data.fromCurrencyId !== data.toCurrencyId, {
    message: '"From" and "To" currencies cannot be the same.',
    path: ['toCurrencyId'], // Lỗi sẽ hiển thị ở field 'toCurrencyId'
  });

export type TExchangeRateSchema = z.infer<typeof exchangeRateSchema>;
