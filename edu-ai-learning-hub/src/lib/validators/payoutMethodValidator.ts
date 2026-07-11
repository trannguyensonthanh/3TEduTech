import { z } from 'zod';

// Schemas cho từng phương thức cụ thể
const paypalSchema = z.object({
  methodId: z.literal('PAYPAL'),
  details: z.object({
    email: z.string().email('Invalid PayPal email address.'),
  }),
});

const stripeSchema = z.object({
  methodId: z.literal('STRIPE'),
  details: z.object({
    accountId: z.string().min(10, 'Invalid Stripe Account ID.'), // Ví dụ: acct_...
  }),
});

const vnpaySchema = z.object({
  methodId: z.literal('VNPAY'),
  details: z.object({
    accountNumber: z.string().min(5, 'Account number is required.'),
    accountName: z.string().min(3, 'Account name is required.'),
    bankName: z.string().min(2, 'Bank name is required.'),
  }),
});

const momoSchema = z.object({
  methodId: z.literal('MOMO'),
  details: z.object({
    phoneNumber: z
      .string()
      .regex(
        /(84|0[3|5|7|8|9])+([0-9]{8})\b/,
        'Invalid Vietnamese phone number.'
      ),
    accountName: z.string().min(3, 'Account name is required.'),
  }),
});

// Schema chính, kết hợp tất cả lại
export const payoutMethodSchema = z.discriminatedUnion('methodId', [
  paypalSchema,
  stripeSchema,
  vnpaySchema,
  momoSchema,
]);

export type TPayoutMethodSchema = z.infer<typeof payoutMethodSchema>;
