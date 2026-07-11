// src/lib/validators/instructorProfileValidator.ts
import { z } from 'zod';

// Schema cho Tab "General Information"
export const GeneralInfoSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
  headline: z.string().max(255, 'Headline is too long.').optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
});

// Schema cho Tab "Professional Information"
export const ProfessionalInfoSchema = z.object({
  professionalTitle: z
    .string()
    .max(255, 'Title is too long.')
    .optional()
    .nullable(),
  bio: z.string().max(2000, 'Bio is too long.').optional().nullable(),
  aboutMe: z
    .string()
    .max(5000, 'About me section is too long.')
    .optional()
    .nullable(),
});

// Schema cho Tab "Social Links"
export const SocialLinksSchema = z.object({
  // Sử dụng refine để đảm bảo người dùng nhập đúng định dạng mong muốn nếu cần
  // Ở đây chỉ validate là string, backend sẽ xử lý logic URL đầy đủ
  LINKEDIN: z.string().optional(),
  GITHUB: z.string().optional(),
  YOUTUBE: z.string().optional(),
  TWITTER: z.string().optional(),
});

// Schema cho Tab "Security" - Đổi mật khẩu
export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, 'Current password is required.'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters.'),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords don't match.",
    path: ['confirmNewPassword'], // Lỗi sẽ hiển thị ở field này
  });

// Export các type từ schema để sử dụng trong component
export type TGeneralInfoSchema = z.infer<typeof GeneralInfoSchema>;
export type TProfessionalInfoSchema = z.infer<typeof ProfessionalInfoSchema>;
export type TSocialLinksSchema = z.infer<typeof SocialLinksSchema>;
export type TChangePasswordSchema = z.infer<typeof ChangePasswordSchema>;
