/* =============================================================================
   V8__protect_student_data.sql
   -----------------------------------------------------------------------------
   MỤC ĐÍCH: Bịt đường CASCADE DELETE có thể xóa sạch dữ liệu học viên.

   VẤN ĐỀ (đã xác minh trên schema live):
     FK_LessonProgress_LessonID  ON DELETE CASCADE
     FK_Lessons_SectionID        ON DELETE CASCADE
     FK_Sections_CourseID        ON DELETE CASCADE
     FK_Enrollments_CourseID     ON DELETE CASCADE
     FK_QuizAttempts_LessonID    ON DELETE CASCADE

     → Chuỗi: DELETE Sections → Lessons → LessonProgress + QuizAttempts
     Và trong mã nguồn, guard chặn xóa chỉ áp dụng khi `!isAdmin`
     (sections.service.js:37-45) → Admin xóa được chương của khóa PUBLISHED
     đang có học viên, tiến độ của TOÀN BỘ học viên bị xóa vĩnh viễn.

   TRIẾT LÝ SỬA (quan trọng — không phải bỏ hết CASCADE):

     GIỮ CASCADE:  Sections→Courses, Lessons→Sections
                   Lý do: cần thiết để dọn bản nháp. Khi hủy phiên cập nhật
                   (cancelUpdate), xóa khóa nháp phải kéo theo chương/bài của
                   nó — bản nháp không có học viên nên hoàn toàn an toàn.

     BỎ CASCADE:   LessonProgress→Lessons, QuizAttempts→Lessons,
                   Enrollments→Courses
                   Lý do: đây là DỮ LIỆU HỌC VIÊN. Đổi sang NO ACTION biến
                   database thành lưới an toàn cuối cùng: xóa bài có tiến độ
                   học viên sẽ bị SQL Server CHẶN (lỗi 547) thay vì xóa im lặng.

   KẾT QUẢ: xóa bản nháp vẫn chạy trơn tru; xóa nội dung có học viên bị chặn
   ở tầng database, bất kể lỗi ở tầng ứng dụng hay thao tác tay trong SSMS.

   THỨ TỰ: Chạy sau V4. Độc lập với V5/V6/V7.
============================================================================= */

USE [ThreeTEduTechLMS];
GO

PRINT N'=== V8: Bắt đầu gia cố bảo vệ dữ liệu học viên ===';
GO

/* -----------------------------------------------------------------------------
   BƯỚC 0 — KIỂM TRA TRƯỚC (chỉ đọc, không thay đổi gì)
   Nếu các câu này trả về dòng, nghĩa là ĐANG CÓ dữ liệu mồ côi cần dọn trước.
----------------------------------------------------------------------------- */
PRINT N'--- Kiểm tra dữ liệu mồ côi trước khi đổi ràng buộc ---';

SELECT COUNT(*) AS LessonProgress_MoCoi
FROM dbo.LessonProgress lp
WHERE NOT EXISTS (SELECT 1 FROM dbo.Lessons l WHERE l.LessonID = lp.LessonID);

SELECT COUNT(*) AS QuizAttempts_MoCoi
FROM dbo.QuizAttempts qa
WHERE NOT EXISTS (SELECT 1 FROM dbo.Lessons l WHERE l.LessonID = qa.LessonID);

SELECT COUNT(*) AS Enrollments_MoCoi
FROM dbo.Enrollments e
WHERE NOT EXISTS (SELECT 1 FROM dbo.Courses c WHERE c.CourseID = e.CourseID);
GO

/* -----------------------------------------------------------------------------
   1. LessonProgress → Lessons : CASCADE  ➜  NO ACTION
      Đây là thay đổi quan trọng nhất của file này.
----------------------------------------------------------------------------- */
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_LessonProgress_LessonID')
BEGIN
    ALTER TABLE dbo.LessonProgress DROP CONSTRAINT FK_LessonProgress_LessonID;
    PRINT N'  [-] Đã gỡ FK_LessonProgress_LessonID (bản CASCADE)';
END
GO

ALTER TABLE dbo.LessonProgress WITH CHECK
    ADD CONSTRAINT FK_LessonProgress_LessonID
    FOREIGN KEY (LessonID) REFERENCES dbo.Lessons (LessonID);
    -- KHÔNG có ON DELETE → mặc định NO ACTION → chặn xóa bài đã có tiến độ
PRINT N'  [+] Đã tạo lại FK_LessonProgress_LessonID (NO ACTION - an toàn)';
GO

/* -----------------------------------------------------------------------------
   2. QuizAttempts → Lessons : CASCADE  ➜  NO ACTION
      Bài làm và điểm số của học viên cũng là dữ liệu không được phép mất.
----------------------------------------------------------------------------- */
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_QuizAttempts_LessonID')
BEGIN
    ALTER TABLE dbo.QuizAttempts DROP CONSTRAINT FK_QuizAttempts_LessonID;
    PRINT N'  [-] Đã gỡ FK_QuizAttempts_LessonID (bản CASCADE)';
END
GO

ALTER TABLE dbo.QuizAttempts WITH CHECK
    ADD CONSTRAINT FK_QuizAttempts_LessonID
    FOREIGN KEY (LessonID) REFERENCES dbo.Lessons (LessonID);
PRINT N'  [+] Đã tạo lại FK_QuizAttempts_LessonID (NO ACTION - an toàn)';
GO

/* -----------------------------------------------------------------------------
   3. Enrollments → Courses : CASCADE  ➜  NO ACTION
      Lịch sử ghi danh (ai đã mua gì) là dữ liệu giao dịch, không được xóa.
----------------------------------------------------------------------------- */
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Enrollments_CourseID')
BEGIN
    ALTER TABLE dbo.Enrollments DROP CONSTRAINT FK_Enrollments_CourseID;
    PRINT N'  [-] Đã gỡ FK_Enrollments_CourseID (bản CASCADE)';
END
GO

ALTER TABLE dbo.Enrollments WITH CHECK
    ADD CONSTRAINT FK_Enrollments_CourseID
    FOREIGN KEY (CourseID) REFERENCES dbo.Courses (CourseID);
PRINT N'  [+] Đã tạo lại FK_Enrollments_CourseID (NO ACTION - an toàn)';
GO

/* -----------------------------------------------------------------------------
   4. GIỮ NGUYÊN — ghi lại đây để nhớ vì sao KHÔNG đụng vào:

      FK_Lessons_SectionID   (CASCADE)  → cần để xóa bản nháp
      FK_Sections_CourseID   (CASCADE)  → cần để xóa bản nháp
      FK_CourseReviews_*     (CASCADE)  → đánh giá gắn liền khóa/tài khoản
      FK_CartItems_*         (CASCADE)  → giỏ hàng là dữ liệu tạm
      FK_ChatMessages_*      (CASCADE)  → tin nhắn thuộc phiên chat (V7)

   Sau thay đổi trên, hành vi xóa BẢN NHÁP vẫn hoạt động bình thường:
      DELETE Courses(nháp) → CASCADE Sections → CASCADE Lessons → xong
      (bản nháp không có LessonProgress/QuizAttempts/Enrollments nên
       các FK NO ACTION mới không cản trở)

   Còn xóa khóa học ĐÃ CÓ HỌC VIÊN sẽ bị chặn ngay ở tầng database.
----------------------------------------------------------------------------- */

PRINT N'=== V8: Hoàn tất ===';
GO

/* -----------------------------------------------------------------------------
   KIỂM TRA SAU KHI CHẠY — xác nhận trạng thái các quy tắc xóa
----------------------------------------------------------------------------- */
SELECT
    fk.name                              AS TenRangBuoc,
    OBJECT_NAME(fk.parent_object_id)     AS BangCon,
    OBJECT_NAME(fk.referenced_object_id) AS BangCha,
    fk.delete_referential_action_desc    AS QuyTacXoa
FROM sys.foreign_keys fk
WHERE fk.name IN (
    'FK_LessonProgress_LessonID',
    'FK_QuizAttempts_LessonID',
    'FK_Enrollments_CourseID',
    'FK_Lessons_SectionID',
    'FK_Sections_CourseID'
)
ORDER BY BangCon;
GO
-- Kết quả MONG ĐỢI:
--   FK_Enrollments_CourseID     Enrollments      Courses    NO_ACTION
--   FK_LessonProgress_LessonID  LessonProgress   Lessons    NO_ACTION
--   FK_Lessons_SectionID        Lessons          Sections   CASCADE
--   FK_QuizAttempts_LessonID    QuizAttempts     Lessons    NO_ACTION
--   FK_Sections_CourseID        Sections         Courses    CASCADE
