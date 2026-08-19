/* =============================================================================
   V7__chat_history.sql
   -----------------------------------------------------------------------------
   MỤC ĐÍCH: Lưu lịch sử hội thoại AI ở database thay vì localStorage.

   VẤN ĐỀ ĐANG CÓ (đã xác minh trong mã nguồn):
     - useChatbot.ts:40,47 — chat master và chat khóa học dùng CHUNG một khóa
       localStorage 'agy_mini_chatbot_history_v2' (cả 2 component đều không
       truyền storageKey) → lịch sử lẫn lộn giữa các cuộc trò chuyện.
     - Client gửi mảng chat_history lên server mỗi request → học viên có thể
       sửa localStorage để chèn "câu trả lời giả của AI", một dạng
       prompt injection qua lịch sử giả mạo.
     - Mất sạch khi xóa cache, không đồng bộ giữa các thiết bị.

   THIẾT KẾ:
     Backend Node.js sở hữu dữ liệu này; AI Service giữ nguyên trạng thái
     STATELESS. Lý do không cho AI Service tự ghi DB: Security Group của bạn
     (sg-rds chỉ mở cổng 1433 cho sg-cpu-ec2) khiến AI Service trên GPU EC2 #2
     về mặt vật lý không kết nối được tới RDS — và đó là thiết kế đúng.

   Luồng: Frontend --JWT--> Backend --lấy N lượt gần nhất từ DB--> AI Service

   THỨ TỰ: Chạy SAU V5 (vì có tham chiếu tới Courses).
============================================================================= */

USE [ThreeTEduTechLMS];
GO

PRINT N'=== V7: Bắt đầu tạo module Lịch sử Chat AI ===';
GO

/* -----------------------------------------------------------------------------
   1. ChatSessions — mỗi "cuộc trò chuyện" là 1 dòng
      Scope phân tách rõ ràng ngữ cảnh:
        MASTER = chatbot tổng ở trang chủ (tư vấn, tìm/mua khóa học)
        COURSE = trợ lý AI bên trong 1 khóa học cụ thể
        LESSON = trợ lý AI gắn với 1 bài giảng cụ thể
----------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.ChatSessions', N'U') IS NOT NULL
BEGIN
    PRINT N'  [=] Bảng ChatSessions đã tồn tại, bỏ qua';
END
ELSE
BEGIN
    CREATE TABLE dbo.ChatSessions (
        SessionID       BIGINT IDENTITY(1,1)  NOT NULL,
        AccountID       BIGINT                NOT NULL,

        Scope           VARCHAR(20)           NOT NULL,   -- MASTER | COURSE | LESSON
        CourseID        BIGINT                NULL,       -- NULL khi Scope = MASTER
        LessonID        BIGINT                NULL,       -- chỉ dùng khi Scope = LESSON

        Title           NVARCHAR(255)         NULL,       -- tự sinh từ câu hỏi đầu tiên
        MessageCount    INT                   NOT NULL CONSTRAINT DF_ChatSessions_MessageCount DEFAULT (0),

        CreatedAt       DATETIME2(7)          NOT NULL CONSTRAINT DF_ChatSessions_CreatedAt   DEFAULT (GETDATE()),
        LastMessageAt   DATETIME2(7)          NOT NULL CONSTRAINT DF_ChatSessions_LastMessage DEFAULT (GETDATE()),
        IsArchived      BIT                   NOT NULL CONSTRAINT DF_ChatSessions_IsArchived  DEFAULT (0),

        CONSTRAINT PK_ChatSessions PRIMARY KEY CLUSTERED (SessionID ASC),

        CONSTRAINT CK_ChatSessions_Scope CHECK (Scope IN ('MASTER', 'COURSE', 'LESSON')),

        -- Ràng buộc logic: COURSE/LESSON bắt buộc có CourseID, MASTER thì không
        CONSTRAINT CK_ChatSessions_ScopeCourse CHECK (
            (Scope = 'MASTER' AND CourseID IS NULL)
         OR (Scope IN ('COURSE', 'LESSON') AND CourseID IS NOT NULL)
        ),

        CONSTRAINT FK_ChatSessions_AccountID FOREIGN KEY (AccountID)
            REFERENCES dbo.Accounts (AccountID) ON DELETE CASCADE,
        CONSTRAINT FK_ChatSessions_CourseID FOREIGN KEY (CourseID)
            REFERENCES dbo.Courses (CourseID),
        CONSTRAINT FK_ChatSessions_LessonID FOREIGN KEY (LessonID)
            REFERENCES dbo.Lessons (LessonID)
    );
    PRINT N'  [+] Đã tạo bảng ChatSessions';

    -- Index chính: tra "phiên chat của user X trong khóa Y", mới nhất trước
    CREATE NONCLUSTERED INDEX IX_ChatSessions_Lookup
        ON dbo.ChatSessions (AccountID ASC, Scope ASC, CourseID ASC, LastMessageAt DESC)
        INCLUDE (Title, MessageCount, IsArchived);
    PRINT N'  [+] Đã tạo index IX_ChatSessions_Lookup';

    -- Index phục vụ phân tích: "học viên hỏi gì nhiều nhất ở khóa này"
    CREATE NONCLUSTERED INDEX IX_ChatSessions_CourseID
        ON dbo.ChatSessions (CourseID ASC, CreatedAt DESC)
        WHERE CourseID IS NOT NULL;
    PRINT N'  [+] Đã tạo index IX_ChatSessions_CourseID';
END
GO

/* -----------------------------------------------------------------------------
   2. ChatMessages — từng tin nhắn

   CASCADE ở đây HỢP LÝ (khác hoàn toàn với trường hợp LessonProgress):
   xóa một cuộc trò chuyện thì đương nhiên xóa các tin nhắn của nó.
----------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.ChatMessages', N'U') IS NOT NULL
BEGIN
    PRINT N'  [=] Bảng ChatMessages đã tồn tại, bỏ qua';
END
ELSE
BEGIN
    CREATE TABLE dbo.ChatMessages (
        MessageID       BIGINT IDENTITY(1,1)  NOT NULL,
        SessionID       BIGINT                NOT NULL,

        Role            VARCHAR(10)           NOT NULL,   -- user | assistant
        Content         NVARCHAR(MAX)         NOT NULL,

        -- Siêu dữ liệu phục vụ phân tích & kiểm toán
        Intent          VARCHAR(30)           NULL,       -- SEARCH_COURSE, FAQ_QUERY, BUY_COURSE...
        SourcesJson     NVARCHAR(MAX)         NULL,       -- nguồn RAG đã dùng để trả lời
        UiWidgetJson    NVARCHAR(MAX)         NULL,       -- widget kèm theo (carousel, payment...)
        LlmProvider     VARCHAR(20)           NULL,       -- qwen | gemini  → thống kê chi phí
        LlmModel        VARCHAR(60)           NULL,
        TokensUsed      INT                   NULL,
        LatencyMs       INT                   NULL,

        CreatedAt       DATETIME2(7)          NOT NULL CONSTRAINT DF_ChatMessages_CreatedAt DEFAULT (GETDATE()),

        CONSTRAINT PK_ChatMessages PRIMARY KEY CLUSTERED (MessageID ASC),
        CONSTRAINT CK_ChatMessages_Role CHECK (Role IN ('user', 'assistant')),
        CONSTRAINT FK_ChatMessages_SessionID FOREIGN KEY (SessionID)
            REFERENCES dbo.ChatSessions (SessionID) ON DELETE CASCADE
    );
    PRINT N'  [+] Đã tạo bảng ChatMessages';

    CREATE NONCLUSTERED INDEX IX_ChatMessages_Session
        ON dbo.ChatMessages (SessionID ASC, CreatedAt ASC);
    PRINT N'  [+] Đã tạo index IX_ChatMessages_Session';

    -- Phục vụ báo cáo "phân tích hiệu quả khóa học" (đề cương mục E2)
    CREATE NONCLUSTERED INDEX IX_ChatMessages_Intent
        ON dbo.ChatMessages (Intent ASC, CreatedAt DESC)
        WHERE Intent IS NOT NULL;
    PRINT N'  [+] Đã tạo index IX_ChatMessages_Intent';
END
GO

/* -----------------------------------------------------------------------------
   3. VIEW phân tích — "Bài giảng nào gây nhiều thắc mắc nhất"

   Đây chính là loại số liệu đề cương mục E2 yêu cầu
   ("Báo cáo và phân tích về hiệu quả của các khóa học"):
   bài học có nhiều câu hỏi bất thường = bài giảng trình bày chưa rõ.
----------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.vw_CourseChatInsights', N'V') IS NOT NULL
    DROP VIEW dbo.vw_CourseChatInsights;
GO

CREATE VIEW dbo.vw_CourseChatInsights
AS
SELECT
    c.CourseID,
    c.CourseName,
    c.VersionNumber,
    COUNT(DISTINCT s.SessionID)                                     AS TotalSessions,
    COUNT(DISTINCT s.AccountID)                                     AS UniqueStudentsAsking,
    SUM(CASE WHEN m.Role = 'user' THEN 1 ELSE 0 END)                AS TotalQuestions,
    CAST(
        SUM(CASE WHEN m.Role = 'user' THEN 1.0 ELSE 0 END)
        / NULLIF(COUNT(DISTINCT s.AccountID), 0)
    AS DECIMAL(10,2))                                               AS AvgQuestionsPerStudent,
    MAX(m.CreatedAt)                                                AS LastActivityAt
FROM dbo.ChatSessions s
JOIN dbo.Courses      c ON s.CourseID = c.CourseID
LEFT JOIN dbo.ChatMessages m ON m.SessionID = s.SessionID
WHERE s.Scope IN ('COURSE', 'LESSON')
GROUP BY c.CourseID, c.CourseName, c.VersionNumber;
GO
PRINT N'  [+] Đã tạo view vw_CourseChatInsights';
GO

PRINT N'=== V7: Hoàn tất ===';
GO

/* -----------------------------------------------------------------------------
   GHI CHÚ TRIỂN KHAI PHÍA BACKEND (module src/api/ai/)

     POST   /v1/ai/sessions              body: {scope, courseId?, lessonId?}
                                         → trả về phiên hiện có hoặc tạo mới
     GET    /v1/ai/sessions              query: ?scope=COURSE&courseId=12
     GET    /v1/ai/sessions/:id/messages query: ?limit=50&before=<messageId>
     POST   /v1/ai/sessions/:id/chat     → backend lưu tin nhắn user, gọi
                                           AI Service (SSE passthrough),
                                           lưu tin nhắn assistant khi stream xong
     DELETE /v1/ai/sessions/:id          → đặt IsArchived = 1

   QUAN TRỌNG: backend TỰ lấy N lượt gần nhất từ DB để gửi cho AI Service.
   TUYỆT ĐỐI không nhận chat_history do client gửi lên nữa — đó chính là
   lỗ hổng prompt injection cần bịt.
----------------------------------------------------------------------------- */
