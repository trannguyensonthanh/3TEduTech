// src/lib/validators/payoutValidator.ts
import { z } from 'zod';

// Schema cho form duyệt Withdrawal Request
export const reviewWithdrawalSchema = z
  .object({
    decision: z.enum(['APPROVED', 'REJECTED'], {
      required_error: 'A decision is required.',
    }),
    adminNotes: z.string().optional(),
  })
  .refine(
    (data) => {
      // Nếu từ chối, adminNotes là bắt buộc
      return (
        data.decision !== 'REJECTED' ||
        (!!data.adminNotes && data.adminNotes.trim().length > 0)
      );
    },
    {
      message: 'Admin notes are required when rejecting a request.',
      path: ['adminNotes'],
    }
  );
export type TReviewWithdrawalSchema = z.infer<typeof reviewWithdrawalSchema>;

// Schema cho form xử lý Payout
export const processPayoutSchema = z.object({
  status: z.enum(['PAID', 'FAILED'], {
    required_error: 'A final status is required.',
  }),
  completedAt: z.string().optional(), // ISO string
  adminNotes: z.string().optional(),
  // Các trường cho giao dịch quốc tế hoặc có phí
  actualAmount: z.coerce.number().optional(),
  actualCurrencyId: z.string().optional(),
  exchangeRate: z.coerce.number().optional(),
  fee: z.coerce.number().optional(),
  externalTransactionId: z.string().optional(), // Mã giao dịch từ bank/paypal...
});
export type TProcessPayoutSchema = z.infer<typeof processPayoutSchema>;
