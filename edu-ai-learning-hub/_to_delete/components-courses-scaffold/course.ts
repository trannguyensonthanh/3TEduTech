/* ============================================================================
 * course.ts
 * [THÊM 19/08/2026]
 *
 * Ba tệp trong components/courses/ (CourseDetailsForm, CourseSettingsForm,
 * LessonItem) import `@/types/course`, nhưng mô-đun đó chưa bao giờ tồn tại —
 * chỉ có `@/types/common.types`. Vì cả ba tệp hiện KHÔNG được dùng ở đâu
 * (LessonItem chỉ còn nằm trong phần đã chú thích của CourseSectionCard.tsx),
 * lỗi này nằm im cho tới khi bật kiểm tra kiểu.
 *
 * Đây là lớp chuyển tiếp, không định nghĩa kiểu mới: nguồn sự thật vẫn là
 * common.types.ts. Nếu sau này bỏ hẳn ba tệp kia thì xóa luôn tệp này.
 * ========================================================================== */

export type {
  Course,
  Lesson,
  Section,
  AttachmentFE,
  SubtitleFE,
} from './common.types';
