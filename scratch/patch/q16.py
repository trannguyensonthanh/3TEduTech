# -*- coding: utf-8 -*-
import io, sys
ROOT = sys.argv[1]
def read(p): return io.open(ROOT + p, encoding='utf-8').read()
def write(p, s): io.open(ROOT + p, 'w', encoding='utf-8', newline='\n').write(s)
def sub(s, old, new, label):
    assert s.count(old) == 1, 'KHONG TIM THAY: ' + label
    return s.replace(old, new)

p = '/edu-ai-learning-hub/src/services/import.service.ts'
s = read(p)

# 1. ImportProposal: them cac truong moi
s = sub(s, """export interface ImportProposal {
  courseName: string;
  courseDescription?: string | null;
  /** Mô tả ngắn do AI viết (Giai đoạn B). Chỉ có sau khi đã bấm "Dùng AI". */
  courseShortDescription?: string | null;
  sections: ProposedSection[];""",
"""/** Ảnh bìa tìm được trong tệp ZIP. Đường dẫn tuyệt đối đã bị máy chủ che. */
export interface ProposedCoverImage {
  relativePath: string;
  source?: 'zip' | 'upload';
}

export interface ImportProposal {
  courseName: string;
  courseDescription?: string | null;
  /** Mô tả ngắn do AI viết (Giai đoạn B). Chỉ có sau khi đã bấm "Dùng AI". */
  courseShortDescription?: string | null;
  /* [THÊM 20/08/2026] Hai khối nội dung AI nay cũng viết được.
     Trước đây cột Requirements và LearningOutcomes của khóa học nhập từ ZIP
     luôn rỗng, dù đó là hai khối thuyết phục người mua mạnh nhất trên trang
     chi tiết khóa học. Nội dung ở dạng HTML danh sách (<ul><li>). */
  courseRequirements?: string | null;
  courseLearningOutcomes?: string | null;
  /** [THÊM 20/08/2026] Ảnh bìa lấy từ chính tệp ZIP, nếu tìm được. */
  coverImage?: ProposedCoverImage | null;
  sections: ProposedSection[];""", 'ImportProposal')

# 2. AcceptImportPayload
s = sub(s, """  /** Có tạo kèm câu hỏi trắc nghiệm do AI soạn không. Mặc định false. */
  includeQuiz?: boolean;""",
"""  /** [THÊM 20/08/2026] Đường dẫn YouTube của video giới thiệu khóa học. */
  introVideoUrl?: string | null;
  /** Có tạo kèm câu hỏi trắc nghiệm do AI soạn không. Mặc định false. */
  includeQuiz?: boolean;
  /** [THÊM 20/08/2026] Dùng ảnh tìm được trong ZIP làm ảnh bìa. Mặc định true. */
  useCoverImage?: boolean;""", 'AcceptImportPayload')

# 3. AcceptImportResult
s = sub(s, """  totalQuestions: number;
  videosPendingUpload: number;""",
"""  totalQuestions: number;
  /** [THÊM 20/08/2026] Số BÀI KIỂM TRA được tạo — mỗi chương có đề thì một bài. */
  totalQuizLessons?: number;
  /** [THÊM 20/08/2026] Có đặt ảnh bìa cho khóa học hay không. */
  hasCoverImage?: boolean;
  videosPendingUpload: number;""", 'AcceptImportResult')

# 4. EnrichResult
s = sub(s, """  proposal: ImportProposal;
  shortDescription: string | null;
  sectionsWritten: number;""",
"""  proposal: ImportProposal;
  shortDescription: string | null;
  sectionsWritten: number;""", 'no-op')

# 5. generateQuiz: them do kho + ham luu de + URL xem truoc
s = sub(s, """export const generateQuiz = (
  jobId: string,
  questionsPerLesson = 3
): Promise<QuizResult> =>
  apiHelper.post(`/imports/${jobId}/quiz`, { questionsPerLesson });""",
"""export type QuizDifficulty = 'easy' | 'medium' | 'hard' | 'mixed';

export const generateQuiz = (
  jobId: string,
  questionsPerLesson = 3,
  difficulty: QuizDifficulty = 'mixed'
): Promise<QuizResult> =>
  apiHelper.post(`/imports/${jobId}/quiz`, { questionsPerLesson, difficulty });

/**
 * Lưu câu hỏi giảng viên đã sửa vào bản nháp trên máy chủ.
 *
 * [THÊM 20/08/2026] Trước đây câu hỏi do AI soạn là CHỈ ĐỌC ở màn hình duyệt:
 * sai một chữ trong đáp án cũng phải bấm "soạn đề lại" toàn bộ — đốt thêm một
 * lượt gọi mô hình và mất luôn những câu đang tốt.
 *
 * Không gửi kèm trong payload "Tạo khóa học": `acceptProposal` phía máy chủ vẫn
 * đọc câu hỏi từ bản nháp của chính nó, nên nguyên tắc "nội dung câu hỏi không
 * nhận từ payload chấp nhận" được giữ nguyên. Tuyến này chỉ cập nhật bản nháp
 * ấy cho khớp với thứ giảng viên đang nhìn thấy.
 */
export const saveImportQuiz = (
  jobId: string,
  lessons: Array<{ sourcePath: string; questions: ProposedQuizQuestion[] }>
): Promise<{
  proposal: ImportProposal;
  totalQuestions: number;
  lessonsWithQuiz: number;
}> => apiHelper.put(`/imports/${jobId}/quiz`, { lessons });

/**
 * Địa chỉ xem trước một tệp trong bản nháp (video, ảnh bìa).
 *
 * [THÊM 20/08/2026] Tệp đã nằm trên đĩa máy chủ sau khi giải nén nhưng chưa lên
 * Cloudinary, nên không có URL công khai nào trỏ tới nó — trước đây giảng viên
 * duyệt một khóa học mà chưa từng nhìn thấy nội dung của nó.
 *
 * ⚠️ Tuyến này đòi xác thực bằng Bearer token, mà thẻ <video src="..."> KHÔNG
 * gửi header được. Nên token được đính vào chuỗi truy vấn — chấp nhận được ở
 * đây vì đường dẫn chỉ sống trong trang này và không bao giờ được ghi ra ngoài;
 * đổi lại là thẻ video dùng được cơ chế tua theo Range của trình duyệt, thứ
 * không có cách nào mô phỏng bằng fetch + blob cho tệp hàng trăm MB.
 */
export const buildPreviewUrl = (jobId: string, sourcePath: string): string => {
  const token = TokenService.getLocalAccessToken();
  const qs = new URLSearchParams({ path: sourcePath });
  if (token) qs.set('access_token', token);
  return `${API_BASE_URL}/imports/${jobId}/preview?${qs.toString()}`;
};""", 'generateQuiz + moi')
write(p, s)
print('import.service.ts OK')
