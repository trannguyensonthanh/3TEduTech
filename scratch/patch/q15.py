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

s = sub(s, """  if (pendingMedia.length > 0) {
    try {
      await addMediaUploadJob({
        jobId,
        courseId,
        accountId: user.id,
        items: pendingMedia,
      });""",
"""  /* [THÊM 20/08/2026] Ảnh bìa khóa học.

     Đường dẫn lấy từ bản nháp PHÍA MÁY CHỦ, không phải từ payload client — cùng
     nguyên tắc với đường dẫn video. Giảng viên chỉ gửi lên cờ `useCoverImage`
     (mặc định bật) để chọn có dùng ảnh tìm được trong tệp ZIP hay không. */
  const coverImagePath =
    body.useCoverImage !== false && proposal.coverImage?.absolutePath
      ? proposal.coverImage.absolutePath
      : null;

  /* Có ảnh bìa nhưng không có video nào thì VẪN phải xếp hàng: nếu không, ảnh
     bìa không bao giờ được tải lên và khóa học hiện ô trống ở trang danh sách. */
  if (pendingMedia.length > 0 || coverImagePath) {
    try {
      await addMediaUploadJob({
        jobId,
        courseId,
        accountId: user.id,
        items: pendingMedia,
        coverImagePath,
      });""", 'xep hang media')

s = sub(s, """    videosPendingUpload: pendingMedia.filter((m) => m.videoPath).length,""",
"""    videosPendingUpload: pendingMedia.filter((m) => m.videoPath).length,
    /* Có đặt ảnh bìa hay không — giao diện dùng để nói rõ "ảnh bìa đang được
       tải lên" thay vì để giảng viên tưởng khóa học sẽ mãi không có ảnh. */
    hasCoverImage: Boolean(coverImagePath),""", 'gia tri tra ve hasCoverImage')

write(p, s)
print('OK')
