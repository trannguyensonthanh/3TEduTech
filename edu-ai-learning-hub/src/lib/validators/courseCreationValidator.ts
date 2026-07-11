// src/lib/validators/courseCreationValidator.ts
import { z } from 'zod';

export const courseCreationSchema = z.object({
  courseName: z
    .string()
    .trim()
    .min(10, { message: 'Course title must be at least 10 characters long.' })
    .max(100, {
      message: 'Title is too long. Keep it concise and compelling.',
    }),
  categoryId: z.preprocess(
    (val) => (val ? parseInt(String(val), 10) : undefined),
    z.number({ required_error: 'Please select a category.' })
  ),
  // Ngôn ngữ sẽ được dùng để xác định ngôn ngữ nguồn khi dịch
  language: z.enum(['vi', 'en'], {
    required_error: "Please select the course's primary language.",
  }),
});

export type TCourseCreationSchema = z.infer<typeof courseCreationSchema>;
