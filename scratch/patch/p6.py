# -*- coding: utf-8 -*-
import io, sys
ROOT = sys.argv[1]
def read(p): return io.open(ROOT + p, encoding='utf-8').read()
def write(p, s): io.open(ROOT + p, 'w', encoding='utf-8', newline='\n').write(s)

p = '/edu-ai-learning-hub/src/services/ai.service.ts'
s = read(p)
OLD = """export interface CourseSearchResponse {
  answer: string;
  sources: { file_name: string; content: string }[];
}"""
NEW = """/**
 * Kết quả của trợ lý TÌM KHÓA HỌC ở trang /courses.
 *
 * [SỬA 20/08/2026] Thêm `courses` và `outOfScope`.
 *
 * `courses` là thẻ khóa học THẬT, lấy từ SQL Server sau khi backend đối chiếu
 * tên mà AI trả về — cùng hình dạng với `CourseListItem` của danh sách khóa học
 * công khai, nên dựng lại bằng đúng component thẻ sẵn có. Trước đây giao diện
 * chỉ nhận `sources` (tên khóa + 200 ký tự mô tả) nên không hiển thị được giá,
 * ảnh bìa hay đường dẫn tới khóa học.
 *
 * `outOfScope = true` nghĩa là câu hỏi nằm ngoài phạm vi tìm khóa học và đã bị
 * chặn ngay ở bộ định tuyến ý định — không hề gọi tới mô hình sinh văn bản.
 */
export interface CourseSearchResponse {
  answer: string;
  sources: { file_name: string; content: string }[];
  courses: CourseListItem[];
  outOfScope: boolean;
  intent?: string | null;
}"""
assert s.count(OLD) == 1
s = s.replace(OLD, NEW)

OLD_IMP = "import apiHelper, { fetchWithAuth } from './apiHelper';"
NEW_IMP = ("import apiHelper, { fetchWithAuth } from './apiHelper';\n"
           "import type { CourseListItem } from './course.service';")
assert s.count(OLD_IMP) == 1
s = s.replace(OLD_IMP, NEW_IMP)
write(p, s)
print('ai.service.ts OK')
