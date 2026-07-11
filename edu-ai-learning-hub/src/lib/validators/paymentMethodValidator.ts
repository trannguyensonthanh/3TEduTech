// src/lib/validators/paymentMethodValidator.ts
import { z } from 'zod';

export const paymentMethodSchema = z.object({
  methodId: z
    .string()
    .min(2, { message: 'Method ID must be at least 2 characters.' })
    .max(20, { message: 'Method ID cannot exceed 20 characters.' })
    .regex(/^[A-Z0-9_]+$/, {
      message: 'Only uppercase letters, numbers, and underscores are allowed.',
    })
    .transform((value) => value.toUpperCase()),
  methodName: z.string().min(1, { message: 'Method name is required.' }),
  description: z.string().optional(),
});

export type TPaymentMethodSchema = z.infer<typeof paymentMethodSchema>;
