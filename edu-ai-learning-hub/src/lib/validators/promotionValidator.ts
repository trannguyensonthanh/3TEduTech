// src/lib/validators/promotionValidator.ts
import { z } from 'zod';

export const promotionSchema = z
  .object({
    promotionName: z
      .string()
      .min(1, { message: 'Promotion name is required.' }),
    discountCode: z
      .string()
      .min(3, { message: 'Code must be at least 3 characters.' })
      .max(50, { message: 'Code cannot exceed 50 characters.' })
      .regex(/^[A-Z0-9_]+$/, {
        message:
          'Code can only contain uppercase letters, numbers, and underscores.',
      })
      .transform((value) => value.toUpperCase()),
    description: z.string().optional(),
    discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
    discountValue: z.coerce
      .number()
      .positive({ message: 'Discount value must be positive.' }),
    minOrderValue: z.coerce
      .number()
      .min(0, { message: 'Minimum order value cannot be negative.' })
      .optional()
      .nullable(),
    maxDiscountAmount: z.coerce
      .number()
      .positive({ message: 'Max discount must be positive.' })
      .optional()
      .nullable(),
    startDate: z.string().min(1, { message: 'Start date is required.' }),
    endDate: z.string().min(1, { message: 'End date is required.' }),
    maxUsageLimit: z.coerce
      .number()
      .min(0, { message: 'Usage limit cannot be negative.' })
      .optional()
      .nullable(),
    status: z.enum(['ACTIVE', 'INACTIVE']),
  })
  .refine(
    (data) => {
      if (data.discountType === 'PERCENTAGE') {
        return data.discountValue <= 100;
      }
      return true;
    },
    {
      message: 'Percentage discount cannot exceed 100.',
      path: ['discountValue'],
    }
  )
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: 'End date cannot be before start date.',
    path: ['endDate'],
  });

export type TPromotionSchema = z.infer<typeof promotionSchema>;
