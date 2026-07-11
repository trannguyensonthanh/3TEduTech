// src/lib/validators/settingsValidator.ts
import { z } from 'zod';

// Helper để chuyển đổi giá trị từ form (có thể là string) sang boolean
const booleanFromString = z.preprocess((val) => {
  if (typeof val === 'string') {
    if (val.toLowerCase() === 'true') return true;
    if (val.toLowerCase() === 'false') return false;
  }
  return val;
}, z.boolean());

export const settingsSchema = z.object({
  // General Tab
  AllowUserRegistration: booleanFromString,
  AllowInstructorRegistration: booleanFromString,

  // Payment Tab
  PlatformCommissionRate: z.coerce
    .number()
    .min(0, 'Commission rate cannot be negative.')
    .max(100, 'Commission rate cannot exceed 100.'),

  MinWithdrawalAmountVND: z.coerce
    .number()
    .positive('Amount must be positive.'),
  MinWithdrawalAmountUSD: z.coerce
    .number()
    .positive('Amount must be positive.'),

  EnableVnPay: booleanFromString,
  EnableMoMo: booleanFromString,
  EnableStripe: booleanFromString,
  EnablePayPal: booleanFromString,
  EnableCrypto: booleanFromString,

  // Các trường không cho phép sửa sẽ không cần trong schema
  // SiteLogoUrl: z.string().url().optional(), // Nếu muốn thêm upload logo sau này
});

export type TSettingsForm = z.infer<typeof settingsSchema>;
