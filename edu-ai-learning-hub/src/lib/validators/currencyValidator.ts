// src/lib/validators/currencyValidator.ts
import { z } from 'zod';

export const currencySchema = z.object({
  currencyId: z
    .string()
    .min(2, { message: 'Currency ID must be 2-10 characters long.' })
    .max(10, { message: 'Currency ID must be 2-10 characters long.' })
    .transform((value) => value.toUpperCase()), // Luôn chuyển thành chữ hoa
  currencyName: z.string().min(1, { message: 'Currency name is required.' }),
  type: z.enum(['FIAT', 'CRYPTO'], { required_error: 'Please select a type.' }),
  decimalPlaces: z.coerce
    .number() // Sử dụng coerce để chuyển đổi string từ input sang number
    .int({ message: 'Must be a whole number.' })
    .min(0, { message: 'Decimal places cannot be negative.' })
    .max(18, { message: 'Decimal places cannot exceed 18.' }),
});

export type TCurrencySchema = z.infer<typeof currencySchema>;
