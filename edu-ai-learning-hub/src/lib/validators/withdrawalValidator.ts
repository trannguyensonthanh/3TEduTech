// src/lib/validators/withdrawalValidator.ts
import { z } from 'zod';

export const withdrawalSchema = z.object({
  // Amount vẫn là number, nhưng validation min/max sẽ được xử lý động trong component
  amount: z.coerce
    .number()
    .positive({ message: 'Withdrawal amount must be a positive number.' }),

  // Loại tiền tệ người dùng muốn NHẬN
  payoutCurrency: z.enum(['VND', 'USD'], {
    required_error: 'Please select a payout currency.',
  }),

  // ID của phương thức thanh toán đã lưu
  instructorPayoutMethodId: z.preprocess(
    (val) => (val ? parseInt(String(val), 10) : undefined),
    z.number({ required_error: 'Please select a payout method.' })
  ),

  // Ghi chú không bắt buộc
  notes: z.string().max(500, 'Notes cannot exceed 500 characters.').optional(),
});

export type TWithdrawalSchema = z.infer<typeof withdrawalSchema>;
