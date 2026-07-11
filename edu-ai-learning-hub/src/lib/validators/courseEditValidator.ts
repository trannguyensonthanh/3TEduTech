// src/lib/validators/courseEditValidator.ts
import { z } from 'zod';

export const courseEditSchema = z
  .object({
    courseId: z.coerce.number(),
    courseName: z.string().trim().min(1, 'Course title is required').max(255),
    slug: z.string().optional(),
    shortDescription: z
      .string()
      .trim()
      .min(1, 'Short description is required')
      .max(500),
    fullDescription: z.string().max(50000).optional().nullable(),
    requirements: z.string().max(5000).optional().nullable(),
    learningOutcomes: z.string().max(5000).optional().nullable(),

    // Xử lý an toàn hơn: Nếu là null/undefined thì không cố parse, để zod bắt lỗi required
    categoryId: z.preprocess(
      (val) => (val ? parseInt(String(val), 10) : undefined),
      z.number({ required_error: 'Please select a category.' })
    ),
    levelId: z.preprocess(
      (val) => (val ? parseInt(String(val), 10) : undefined),
      z.number({ required_error: 'Please select a level.' })
    ),
    language: z.enum(['vi', 'en'], { required_error: 'Language is required' }),

    // Luôn đảm bảo có giá trị mặc định là chuỗi rỗng trước khi coerce
    originalPrice: z.preprocess(
      (val) => val ?? 0,
      z.coerce.number().min(0, 'Price must be 0 or greater')
    ),
    discountedPrice: z.preprocess(
      (val) => (val === '' || val === undefined ? null : val),
      z.coerce.number().min(0).optional().nullable()
    ),

    introVideoUrl: z.string().optional().nullable(),
  })
  .refine(
    (data) =>
      data.discountedPrice === null ||
      data.discountedPrice === undefined ||
      data.discountedPrice <= data.originalPrice,
    {
      message: 'Discount price cannot be higher than the original price.',
      path: ['discountedPrice'],
    }
  );

export type TCourseEditSchema = z.infer<typeof courseEditSchema>;
