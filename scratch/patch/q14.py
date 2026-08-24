# -*- coding: utf-8 -*-
import io, sys
ROOT = sys.argv[1]
def read(p): return io.open(ROOT + p, encoding='utf-8').read()
def write(p, s): io.open(ROOT + p, 'w', encoding='utf-8', newline='\n').write(s)
def sub(s, old, new, label):
    assert s.count(old) == 1, 'KHONG TIM THAY: ' + label
    return s.replace(old, new)

p = '/3t-edu-tech-backend/src/queues/mediaUpload.queue.js'
s = read(p)

s = sub(s, """      const { jobId, courseId, accountId, items } = job.data;""",
"""      const { jobId, courseId, accountId, items, coverImagePath } = job.data;""",
'job.data')

s = sub(s, """      await importStore.patch(jobId, {
        mediaStatus: 'UPLOADING',
        mediaTotal: total,
        mediaDone: 0,
        mediaMessage: 'Bắt đầu tải video lên...',
      });""",
"""      await importStore.patch(jobId, {
        mediaStatus: 'UPLOADING',
        mediaTotal: total,
        mediaDone: 0,
        mediaMessage: 'Bắt đầu tải video lên...',
      });

      /* ==================================================================
         [THÊM 20/08/2026] ẢNH BÌA KHÓA HỌC

         Ảnh bìa lấy từ chính tệp ZIP (tệp có tên chứa cover/thumb/bia/banner,
         hoặc ảnh đầu tiên tìm được), hoặc do giảng viên chỉ định ở màn hình
         duyệt. Trước đây `ThumbnailUrl` của mọi khóa học nhập từ ZIP đều là
         NULL, nên thẻ khóa học ở trang chủ và trang danh sách hiện một ô trống
         — thứ đầu tiên người mua nhìn thấy.

         Làm ở ĐÂY chứ không trong transaction tạo khóa học: gọi Cloudinary bên
         trong một transaction CSDL nghĩa là giữ khóa hàng suốt thời gian chờ
         mạng. Và làm TRƯỚC vòng lặp video vì ảnh chỉ vài trăm KB — khóa học có
         ảnh bìa ngay trong vài giây, không phải đợi hết mấy trăm MB video.

         Lỗi ở bước này KHÔNG được làm hỏng việc tải video: khóa học thiếu ảnh
         bìa thì giảng viên tự tải lại được ở trang Sửa khóa học, còn video
         hỏng thì phải làm lại cả lần nhập.
         ================================================================== */
      if (coverImagePath) {
        try {
          await importStore
            .patch(jobId, { mediaMessage: 'Đang tải ảnh bìa khóa học...' })
            .catch(() => {});

          const anh = await cloudinaryUtil.uploadLargeFile(coverImagePath, {
            folder: `courses/${courseId}/cover`,
            resource_type: 'image',
          });

          if (anh?.secure_url) {
            const pool = await getConnection();
            await pool
              .request()
              .input('CourseID', sql.BigInt, courseId)
              .input('ThumbnailUrl', sql.VarChar(sql.MAX), anh.secure_url)
              .input('ThumbnailPublicId', sql.VarChar(255), anh.public_id || null)
              .query(
                `UPDATE Courses
                    SET ThumbnailUrl = @ThumbnailUrl,
                        ThumbnailPublicId = @ThumbnailPublicId,
                        UpdatedAt = GETDATE()
                  WHERE CourseID = @CourseID;`
              );
            logger.info(
              `[MediaUpload] Đã đặt ảnh bìa cho khóa học ${courseId}: ${anh.public_id}`
            );
          }
        } catch (error) {
          logger.error(
            `[MediaUpload] Không tải được ảnh bìa cho khóa học ${courseId}: ${error.message}`
          );
        }
      }""", 'anh bia')
write(p, s)
print('mediaUpload.queue.js OK')
