# -*- coding: utf-8 -*-
import io, sys
ROOT = sys.argv[1]
def read(p): return io.open(ROOT + p, encoding='utf-8').read()
def write(p, s): io.open(ROOT + p, 'w', encoding='utf-8', newline='\n').write(s)
def sub(s, old, new, label):
    assert s.count(old) == 1, 'KHONG TIM THAY: ' + label
    return s.replace(old, new)

p = '/3t-edu-tech-backend/src/api/imports/imports.service.js'
s = read(p)

# ===== 1. buildCourseData: nhan them introVideoUrl =====
s = sub(s, """    // --- 🔧 HỆ THỐNG — không nhận từ đâu khác ---
    Slug: uniqueSlug,
    InstructorID: instructorId,
    StatusID: CourseStatus.DRAFT, // LUÔN LUÔN là DRAFT
    PublishedAt: null,
    IsFeatured: 0,
    ThumbnailUrl: null, // Cloudinary điền sau khi upload
    IntroVideoUrl: null,
  };""",
"""    /* [THÊM 20/08/2026] Video giới thiệu.
       Luồng thủ công có ô này (MediaTab), luồng nhập ZIP thì không — nên mọi
       khóa học nhập từ ZIP đều thiếu video giới thiệu, tức thiếu đúng thứ
       thuyết phục người mua nhất trên trang bán hàng. Đây là đường dẫn YouTube
       do giảng viên dán vào, không phải tệp trong ZIP. */
    IntroVideoUrl: body.introVideoUrl || null,

    // --- 🔧 HỆ THỐNG — không nhận từ đâu khác ---
    Slug: uniqueSlug,
    InstructorID: instructorId,
    StatusID: CourseStatus.DRAFT, // LUÔN LUÔN là DRAFT
    PublishedAt: null,
    IsFeatured: 0,
    /* Ảnh bìa: nếu bản nháp có ảnh bìa (lấy từ chính tệp ZIP hoặc do giảng
       viên tải lên ở màn hình duyệt) thì hàng đợi media-upload sẽ đẩy lên
       Cloudinary rồi điền vào cột này sau khi transaction commit. Để null ở
       đây là đúng: gọi Cloudinary bên trong một transaction CSDL nghĩa là giữ
       khóa hàng suốt thời gian chờ mạng. */
    ThumbnailUrl: null,
  };""", 'buildCourseData')

# ===== 2. sanitizeProposalForClient: che duong dan tuyet doi cua anh bia =====
s = sub(s, """  return {
    ...proposal,
    sections: (proposal.sections || []).map((section) => ({""",
"""  /* [THÊM 20/08/2026] Ảnh bìa cũng phải che đường dẫn tuyệt đối.
     `proposal.coverImage` có dạng `{ relativePath, absolutePath }`, và trước
     đây nó được spread thẳng ra client qua `...proposal` — lộ đường dẫn thật
     trên đĩa máy chủ, đúng thứ mà việc gỡ `absolutePath` khỏi từng bài học
     sinh ra để tránh. */
  const coverImage = proposal.coverImage
    ? {
        relativePath: proposal.coverImage.relativePath,
        source: proposal.coverImage.source || 'zip',
      }
    : null;

  return {
    ...proposal,
    coverImage,
    sections: (proposal.sections || []).map((section) => ({""", 'sanitize coverImage')

write(p, s)
print('imports.service.js phan 1 OK')
