/* =============================================================================
   V6__certificates.sql
   -----------------------------------------------------------------------------
   MỤC ĐÍCH: Bổ sung module CHỨNG CHỈ ở tầng dữ liệu (đề cương mục B4).

   HIỆN TRẠNG: frontend đã có UI (Certificates.tsx, CertificateDisplay.tsx,
   CertificatePDFDocument.tsx) nhưng mã chứng chỉ được ghép ngay trên trình duyệt
   (`CERT-${courseId}-${accountId}`), KHÔNG lưu ở đâu và KHÔNG xác minh được.
   Bất kỳ ai cũng tự chế ra được một mã "hợp lệ".

   THIẾT KẾ:
     - CertificateCode: mã công khai, ngẫu nhiên, in lên chứng chỉ + QR
     - VerificationHash: chống sửa nội dung chứng chỉ
     - Các cột *Snapshot: đóng băng thông tin tại thời điểm cấp. Nếu sau này
       giảng viên đổi tên khóa học hoặc học viên đổi tên, chứng chỉ đã cấp
       vẫn giữ nguyên nội dung gốc — đúng nguyên tắc "giấy tờ đã cấp là bất biến".
     - CourseID trỏ đúng PHIÊN BẢN học viên đã học (nhờ V5), nên chứng chỉ
       phản ánh chính xác họ đã học giáo trình nào.

   THỨ TỰ: Chạy SAU V5.
============================================================================= */

USE [ThreeTEduTechLMS];
GO

PRINT N'=== V6: Bắt đầu tạo module Chứng chỉ ===';
GO

IF OBJECT_ID(N'dbo.Certificates', N'U') IS NOT NULL
BEGIN
    PRINT N'  [=] Bảng Certificates đã tồn tại, bỏ qua toàn bộ V6';
END
ELSE
BEGIN
    CREATE TABLE dbo.Certificates (
        CertificateID           BIGINT IDENTITY(1,1)  NOT NULL,

        -- Mã công khai in trên chứng chỉ, dùng để tra cứu tại /verify/:code
        -- Định dạng gợi ý: 3TEDU-2026-XXXXXXXX (sinh ở backend, ngẫu nhiên)
        CertificateCode         VARCHAR(50)           NOT NULL,

        AccountID               BIGINT                NOT NULL,
        CourseID                BIGINT                NOT NULL,  -- đúng phiên bản đã học
        EnrollmentID            BIGINT                NULL,

        -- Ảnh chụp thông tin tại thời điểm cấp (bất biến)
        StudentNameSnapshot     NVARCHAR(150)         NOT NULL,
        CourseNameSnapshot      NVARCHAR(500)         NOT NULL,
        InstructorNameSnapshot  NVARCHAR(150)         NULL,
        CourseVersionNumber     INT                   NOT NULL CONSTRAINT DF_Certificates_Version DEFAULT (1),
        TotalLessonsSnapshot    INT                   NULL,

        -- Kết quả học tập
        FinalQuizAverage        DECIMAL(5,2)          NULL,
        CompletedAt             DATETIME2(7)          NULL,

        -- Chống giả mạo: hash của (Code|AccountID|CourseID|IssuedAt|SECRET)
        VerificationHash        VARCHAR(128)          NOT NULL,

        IssuedAt                DATETIME2(7)          NOT NULL CONSTRAINT DF_Certificates_IssuedAt DEFAULT (GETDATE()),

        -- Thu hồi (ví dụ: phát hiện gian lận thi)
        IsRevoked               BIT                   NOT NULL CONSTRAINT DF_Certificates_IsRevoked DEFAULT (0),
        RevokedAt               DATETIME2(7)          NULL,
        RevokedReason           NVARCHAR(500)         NULL,
        RevokedByAdminID        BIGINT                NULL,

        CONSTRAINT PK_Certificates PRIMARY KEY CLUSTERED (CertificateID ASC),

        -- Mã chứng chỉ là duy nhất toàn hệ thống
        CONSTRAINT UQ_Certificates_Code UNIQUE NONCLUSTERED (CertificateCode ASC),

        -- Mỗi học viên chỉ có 1 chứng chỉ cho mỗi phiên bản khóa học.
        -- (Học viên nâng cấp lên v2 và học lại → được cấp chứng chỉ v2 riêng,
        --  đúng nghiệp vụ vì đó là giáo trình khác.)
        CONSTRAINT UQ_Certificates_Account_Course UNIQUE NONCLUSTERED (AccountID ASC, CourseID ASC),

        CONSTRAINT FK_Certificates_AccountID FOREIGN KEY (AccountID)
            REFERENCES dbo.Accounts (AccountID),
        CONSTRAINT FK_Certificates_CourseID FOREIGN KEY (CourseID)
            REFERENCES dbo.Courses (CourseID),
        CONSTRAINT FK_Certificates_EnrollmentID FOREIGN KEY (EnrollmentID)
            REFERENCES dbo.Enrollments (EnrollmentID) ON DELETE SET NULL,
        CONSTRAINT FK_Certificates_RevokedByAdminID FOREIGN KEY (RevokedByAdminID)
            REFERENCES dbo.Accounts (AccountID)
    );
    PRINT N'  [+] Đã tạo bảng Certificates';

    CREATE NONCLUSTERED INDEX IX_Certificates_AccountID
        ON dbo.Certificates (AccountID ASC)
        INCLUDE (CourseID, CertificateCode, IssuedAt, IsRevoked);
    PRINT N'  [+] Đã tạo index IX_Certificates_AccountID';

    CREATE NONCLUSTERED INDEX IX_Certificates_CourseID
        ON dbo.Certificates (CourseID ASC);
    PRINT N'  [+] Đã tạo index IX_Certificates_CourseID';
END
GO

PRINT N'=== V6: Hoàn tất ===';
GO

/* -----------------------------------------------------------------------------
   GHI CHÚ TRIỂN KHAI PHÍA BACKEND (module src/api/certificates/)

   API cần có:
     POST   /v1/certificates/issue/:courseId   (học viên tự bấm nhận, hoặc
                                                gọi tự động khi IsCompleted=1)
     GET    /v1/certificates/me                (danh sách chứng chỉ của tôi)
     GET    /v1/certificates/:code/download    (tải PDF sinh ở server)
     GET    /v1/certificates/verify/:code      (CÔNG KHAI, không cần đăng nhập)
     PATCH  /v1/certificates/:code/revoke      (chỉ ADMIN)

   Sinh mã và hash (Node.js):
     const crypto = require('crypto');
     const code = `3TEDU-${new Date().getFullYear()}-` +
                  crypto.randomBytes(5).toString('hex').toUpperCase();
     const hash = crypto
       .createHmac('sha256', process.env.CERTIFICATE_SECRET)
       .update(`${code}|${accountId}|${courseId}|${issuedAt.toISOString()}`)
       .digest('hex');

   Nhớ thêm CERTIFICATE_SECRET vào .env.production (openssl rand -hex 32).

   Điều kiện cấp: Enrollments.IsCompleted = 1 (cột vừa thêm ở V4).
----------------------------------------------------------------------------- */
