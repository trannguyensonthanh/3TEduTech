-- ============================================================================
-- V9: Kho tri thức FAQ — chính sách hệ thống + nguồn dữ liệu cho chatbot Master
-- ============================================================================
-- [THÊM 18/08/2026]
--
-- ★ VÌ SAO CẦN MIGRATION NÀY
--
-- Mã nguồn đã tham chiếu bảng `FAQs` ở ba nơi:
--     • src/api/faqs/*            — CRUD + tải PDF lên
--     • src/services/aiSync.service.js — nạp FAQ vào ChromaDB cho RAG
--     • docker-compose (healthcheck cũ trỏ vào /v1/faqs)
--
-- Nhưng V1..V8 tạo 44 bảng và KHÔNG có bảng nào tên FAQs. Nên `/v1/faqs` luôn
-- trả 500 "Invalid object name 'FAQs'" trên mọi CSDL mới. Đây là bảng bị bỏ
-- quên, không phải lỗi Flyway.
--
-- ----------------------------------------------------------------------------
-- KIẾN TRÚC: BA BẢNG, BA VAI TRÒ KHÁC HẲN NHAU
--
--   FAQs               Câu hỏi–đáp NGẮN do quản trị viên tự gõ.
--                      Hiển thị trực tiếp trên trang FAQ công khai.
--
--   FaqDocuments       Tệp PDF chính sách NGUYÊN BẢN.
--                      Người dùng tải về đọc; quản trị viên quản lý ở trang FAQ.
--
--   FaqDocumentChunks  Các đoạn văn bản đã cắt từ PDF để nạp vào RAG.
--                      KHÔNG hiển thị cho người dùng — đây là thức ăn của chatbot.
--
-- ----------------------------------------------------------------------------
-- ★ VÌ SAO PHẢI LƯU CHUNK TRONG SQL KHI CHROMADB ĐÃ GIỮ CHÚNG RỒI?
--
-- Câu hỏi rất đáng đặt ra, vì nhìn qua thì đúng là trùng lặp. Lý do quyết định
-- nằm ở cột `VectorID`:
--
--   Xóa một tệp chính sách mà KHÔNG biết nó đã sinh ra những vector nào thì
--   các vector đó nằm lại trong ChromaDB VĨNH VIỄN. Hậu quả cụ thể: bạn gỡ
--   "Chính sách hoàn tiền 2025" xuống, nhưng chatbot vẫn thản nhiên trích dẫn
--   nó cho học viên. Không có cách nào tìm ra để xóa, vì ChromaDB chỉ biết id
--   chứ không biết id đó thuộc tài liệu nào.
--
-- Hai lợi ích kèm theo:
--   • Nạp lại RAG sau khi ChromaDB mất dữ liệu mà KHÔNG phải bóc lại PDF
--     (bóc PDF tốn CPU và phải gọi sang AI Service).
--   • Trang quản trị xem được CHÍNH XÁC những gì chatbot đang "biết" — thứ
--     không thể nhìn thấy nếu chunk chỉ nằm trong vector store.
-- ============================================================================

USE [ThreeTEduTechLMS];
GO

-- ============================================================================
-- 1. BẢNG FAQs — câu hỏi đáp ngắn
-- ============================================================================
-- ⚠️ Cột bắt buộc theo hợp đồng có sẵn của aiSync.service.js:
--        SELECT FaqID, Question, Answer FROM FAQs WHERE IsActive = 1
--    Đổi tên bốn cột này sẽ làm hỏng việc đồng bộ RAG.

IF OBJECT_ID('dbo.FAQs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.FAQs (
        FaqID           INT IDENTITY(1,1) NOT NULL,
        Question        NVARCHAR(500)     NOT NULL,
        Answer          NVARCHAR(MAX)     NOT NULL,

        -- Nhóm để trang FAQ chia mục, và để chatbot lọc theo chủ đề khi cần.
        Category        NVARCHAR(100)     NULL,

        -- Thứ tự hiển thị. Số nhỏ lên trước.
        -- ⚠️ TÊN CỘT PHẢI LÀ `SortOrder`. faqs.repository.js đang chạy đúng câu
        --    `ORDER BY SortOrder ASC, CreatedAt DESC` và `INSERT ... SortOrder`.
        --    Đặt tên khác (DisplayOrder chẳng hạn) là hỏng ngay getAllFAQs.
        SortOrder    INT               NOT NULL CONSTRAINT DF_FAQs_SortOrder DEFAULT (0),

        -- Tắt câu hỏi mà KHÔNG xóa. aiSync chỉ nạp bản ghi IsActive = 1, nên
        -- tắt ở đây cũng đồng nghĩa với việc gỡ khỏi tri thức của chatbot.
        IsActive        BIT               NOT NULL CONSTRAINT DF_FAQs_IsActive DEFAULT (1),

        -- Nếu câu hỏi này được rút ra từ một tệp PDF thì trỏ về tệp đó, để
        -- trang quản trị hiện được "nguồn: Quy chế học vụ.pdf".
        SourceDocumentID INT              NULL,

        CreatedAt       DATETIME2         NOT NULL CONSTRAINT DF_FAQs_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt       DATETIME2         NOT NULL CONSTRAINT DF_FAQs_UpdatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_FAQs PRIMARY KEY CLUSTERED (FaqID)
    );
    PRINT N'✅ Đã tạo bảng FAQs.';
END
ELSE
    PRINT N'ℹ️ Bảng FAQs đã tồn tại, bỏ qua bước tạo.';
GO

-- Bổ sung từng cột một, phòng trường hợp bảng đã được tạo dở dang từ trước.
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.FAQs') AND name = 'Category')
BEGIN
    ALTER TABLE dbo.FAQs ADD Category NVARCHAR(100) NULL;
    PRINT N'✅ Đã thêm cột FAQs.Category.';
END
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.FAQs') AND name = 'SortOrder')
BEGIN
    ALTER TABLE dbo.FAQs ADD SortOrder INT NOT NULL CONSTRAINT DF_FAQs_SortOrder DEFAULT (0);
    PRINT N'✅ Đã thêm cột FAQs.SortOrder.';
END
GO

-- Dọn tàn dư nếu bảng đã từng được tạo với tên cột cũ `DisplayOrder`
-- (bản nháp đầu của migration này đặt sai tên). Chép dữ liệu sang rồi bỏ cột cũ.
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.FAQs') AND name = 'DisplayOrder')
   AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.FAQs') AND name = 'SortOrder')
BEGIN
    UPDATE dbo.FAQs SET SortOrder = DisplayOrder WHERE SortOrder = 0 AND DisplayOrder <> 0;

    DECLARE @dfName SYSNAME;
    SELECT @dfName = dc.name FROM sys.default_constraints dc
      JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
     WHERE dc.parent_object_id = OBJECT_ID('dbo.FAQs') AND c.name = 'DisplayOrder';
    IF @dfName IS NOT NULL
        EXEC('ALTER TABLE dbo.FAQs DROP CONSTRAINT [' + @dfName + ']');

    ALTER TABLE dbo.FAQs DROP COLUMN DisplayOrder;
    PRINT N'✅ Đã gộp cột DisplayOrder cũ vào SortOrder rồi xóa cột thừa.';
END
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.FAQs') AND name = 'SourceDocumentID')
BEGIN
    ALTER TABLE dbo.FAQs ADD SourceDocumentID INT NULL;
    PRINT N'✅ Đã thêm cột FAQs.SourceDocumentID.';
END
GO

-- ============================================================================
-- 2. BẢNG FaqDocuments — tệp PDF chính sách nguyên bản
-- ============================================================================

IF OBJECT_ID('dbo.FaqDocuments', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.FaqDocuments (
        DocumentID       INT IDENTITY(1,1) NOT NULL,

        Title            NVARCHAR(255)     NOT NULL,
        Description      NVARCHAR(2000)    NULL,

        -- POLICY   : chính sách, quy chế
        -- GUIDE    : hướng dẫn sử dụng
        -- TERMS    : điều khoản dịch vụ
        -- PRIVACY  : chính sách quyền riêng tư
        -- OTHER    : còn lại
        DocumentType     VARCHAR(20)       NOT NULL CONSTRAINT DF_FaqDocuments_Type DEFAULT ('POLICY'),

        -- --- Tệp gốc trên Cloudinary ---
        -- ⚠️ FilePublicID BẮT BUỘC phải lưu. Chỉ có FileUrl thì lúc xóa tài liệu
        --    sẽ không xóa nổi tệp trên Cloudinary — rác tích tụ và không ai
        --    biết tệp nào còn được dùng, tệp nào mồ côi.
        FileUrl          VARCHAR(1000)     NOT NULL,
        FilePublicID     VARCHAR(500)      NULL,
        OriginalFileName NVARCHAR(500)     NULL,
        FileSizeBytes    BIGINT            NULL,
        MimeType         VARCHAR(100)      NULL CONSTRAINT DF_FaqDocuments_Mime DEFAULT ('application/pdf'),
        PageCount        INT               NULL,

        -- --- Trạng thái nạp vào RAG ---
        -- PENDING    : đã tải lên, chưa bóc text
        -- PROCESSING : đang bóc + cắt đoạn + đẩy vào ChromaDB
        -- INDEXED    : đã vào RAG, chatbot dùng được
        -- FAILED     : hỏng — đọc ErrorMessage để biết vì sao
        -- SKIPPED    : cố ý không đưa vào RAG (chỉ để người dùng tải về)
        Status           VARCHAR(20)       NOT NULL CONSTRAINT DF_FaqDocuments_Status DEFAULT ('PENDING'),
        ExtractedChars   INT               NULL,
        ChunkCount       INT               NOT NULL CONSTRAINT DF_FaqDocuments_ChunkCount DEFAULT (0),
        ErrorMessage     NVARCHAR(1000)    NULL,
        IndexedAt        DATETIME2         NULL,

        -- Ẩn khỏi trang công khai mà không xóa tệp.
        IsActive         BIT               NOT NULL CONSTRAINT DF_FaqDocuments_IsActive DEFAULT (1),
        -- Cho người dùng cuối tải tệp gốc về hay chỉ dùng nội bộ cho chatbot.
        IsPublic         BIT               NOT NULL CONSTRAINT DF_FaqDocuments_IsPublic DEFAULT (1),

        UploadedBy       BIGINT            NULL,
        CreatedAt        DATETIME2         NOT NULL CONSTRAINT DF_FaqDocuments_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt        DATETIME2         NOT NULL CONSTRAINT DF_FaqDocuments_UpdatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_FaqDocuments PRIMARY KEY CLUSTERED (DocumentID),
        CONSTRAINT CK_FaqDocuments_Status CHECK (
            Status IN ('PENDING', 'PROCESSING', 'INDEXED', 'FAILED', 'SKIPPED')
        ),
        CONSTRAINT CK_FaqDocuments_Type CHECK (
            DocumentType IN ('POLICY', 'GUIDE', 'TERMS', 'PRIVACY', 'OTHER')
        )
    );
    PRINT N'✅ Đã tạo bảng FaqDocuments.';
END
ELSE
    PRINT N'ℹ️ Bảng FaqDocuments đã tồn tại, bỏ qua bước tạo.';
GO

-- Khóa ngoại tới Accounts — tách riêng để nếu bảng Accounts có khác biệt thì
-- chỉ bước này hỏng, không kéo đổ cả migration.
IF OBJECT_ID('dbo.FaqDocuments', 'U') IS NOT NULL
   AND OBJECT_ID('dbo.Accounts', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_FaqDocuments_UploadedBy')
BEGIN
    -- ON DELETE SET NULL: xóa tài khoản quản trị viên KHÔNG được kéo theo việc
    -- xóa mất tài liệu chính sách của cả hệ thống.
    ALTER TABLE dbo.FaqDocuments
        ADD CONSTRAINT FK_FaqDocuments_UploadedBy
        FOREIGN KEY (UploadedBy) REFERENCES dbo.Accounts(AccountID)
        ON DELETE SET NULL;
    PRINT N'✅ Đã thêm khóa ngoại FaqDocuments.UploadedBy → Accounts.';
END
GO

-- ============================================================================
-- 3. BẢNG FaqDocumentChunks — các đoạn đã cắt, nạp vào RAG
-- ============================================================================

IF OBJECT_ID('dbo.FaqDocumentChunks', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.FaqDocumentChunks (
        ChunkID     BIGINT IDENTITY(1,1) NOT NULL,
        DocumentID  INT                  NOT NULL,

        -- Thứ tự đoạn trong tài liệu, đếm từ 0. Cần để ghép lại đúng mạch văn
        -- khi hiển thị, và để biết đoạn nào đứng trước đoạn nào.
        ChunkIndex  INT                  NOT NULL,
        Content     NVARCHAR(MAX)        NOT NULL,
        CharCount   INT                  NOT NULL CONSTRAINT DF_FaqChunks_CharCount DEFAULT (0),

        -- Trang trong PDF gốc mà đoạn này được lấy ra. Cho phép chatbot trả lời
        -- kèm "xem trang 4 của Quy chế học vụ" thay vì chỉ nói chung chung.
        PageNumber  INT                  NULL,

        -- ★ CỘT QUAN TRỌNG NHẤT CỦA CẢ BẢNG.
        --   Chính là `id` của đoạn này bên trong ChromaDB. Không có nó thì xóa
        --   tài liệu sẽ để lại vector mồ côi, và chatbot tiếp tục trích dẫn một
        --   chính sách đã bị gỡ bỏ. Xem phần đầu tệp.
        VectorID    VARCHAR(200)         NULL,

        CreatedAt   DATETIME2            NOT NULL CONSTRAINT DF_FaqChunks_CreatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_FaqDocumentChunks PRIMARY KEY CLUSTERED (ChunkID),

        -- ON DELETE CASCADE: chunk KHÔNG có ý nghĩa gì khi tài liệu gốc mất đi.
        -- Nhưng nhớ rằng thao tác này chỉ dọn SQL — phải xóa vector bên
        -- ChromaDB TRƯỚC (dựa vào VectorID), nếu không sẽ mất manh mối vĩnh viễn.
        CONSTRAINT FK_FaqDocumentChunks_Document FOREIGN KEY (DocumentID)
            REFERENCES dbo.FaqDocuments(DocumentID) ON DELETE CASCADE,

        -- Một tài liệu không thể có hai đoạn cùng số thứ tự.
        CONSTRAINT UQ_FaqDocumentChunks_Order UNIQUE (DocumentID, ChunkIndex)
    );
    PRINT N'✅ Đã tạo bảng FaqDocumentChunks.';
END
ELSE
    PRINT N'ℹ️ Bảng FaqDocumentChunks đã tồn tại, bỏ qua bước tạo.';
GO

-- Khóa ngoại FAQs.SourceDocumentID → FaqDocuments. Đặt SAU khi FaqDocuments đã
-- tồn tại (thứ tự tạo bảng khiến không thể khai báo ngay lúc CREATE TABLE FAQs).
IF OBJECT_ID('dbo.FAQs', 'U') IS NOT NULL
   AND OBJECT_ID('dbo.FaqDocuments', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_FAQs_SourceDocument')
BEGIN
    -- ON DELETE SET NULL chứ KHÔNG CASCADE: xóa tệp PDF nguồn không được làm
    -- biến mất câu hỏi–đáp mà quản trị viên đã tự tay biên tập lại.
    ALTER TABLE dbo.FAQs
        ADD CONSTRAINT FK_FAQs_SourceDocument
        FOREIGN KEY (SourceDocumentID) REFERENCES dbo.FaqDocuments(DocumentID)
        ON DELETE SET NULL;
    PRINT N'✅ Đã thêm khóa ngoại FAQs.SourceDocumentID → FaqDocuments.';
END
GO

-- ============================================================================
-- 4. CHỈ MỤC
-- ============================================================================

-- Truy vấn phổ biến nhất của trang FAQ công khai:
--     WHERE IsActive = 1 ORDER BY SortOrder, FaqID
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FAQs_Active_Order' AND object_id = OBJECT_ID('dbo.FAQs'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_FAQs_Active_Order
        ON dbo.FAQs (IsActive, SortOrder) INCLUDE (Question, Category);
    PRINT N'✅ Đã tạo chỉ mục IX_FAQs_Active_Order.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FaqDocuments_Status' AND object_id = OBJECT_ID('dbo.FaqDocuments'))
BEGIN
    -- Worker nạp RAG quét đúng truy vấn này để tìm việc cần làm.
    CREATE NONCLUSTERED INDEX IX_FaqDocuments_Status
        ON dbo.FaqDocuments (Status, IsActive) INCLUDE (Title, DocumentType);
    PRINT N'✅ Đã tạo chỉ mục IX_FaqDocuments_Status.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FaqDocumentChunks_Document' AND object_id = OBJECT_ID('dbo.FaqDocumentChunks'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_FaqDocumentChunks_Document
        ON dbo.FaqDocumentChunks (DocumentID, ChunkIndex);
    PRINT N'✅ Đã tạo chỉ mục IX_FaqDocumentChunks_Document.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FaqDocumentChunks_Vector' AND object_id = OBJECT_ID('dbo.FaqDocumentChunks'))
BEGIN
    -- Tra ngược từ id vector về tài liệu — dùng khi cần dọn vector mồ côi
    -- trong ChromaDB, hoặc khi chatbot trả về nguồn và ta cần biết nó ở đâu.
    -- Lọc NULL vì chunk chưa nạp vào RAG thì chưa có VectorID.
    CREATE NONCLUSTERED INDEX IX_FaqDocumentChunks_Vector
        ON dbo.FaqDocumentChunks (VectorID) WHERE VectorID IS NOT NULL;
    PRINT N'✅ Đã tạo chỉ mục IX_FaqDocumentChunks_Vector.';
END
GO

-- ============================================================================
-- 5. TRIGGER CẬP NHẬT UpdatedAt
-- ============================================================================
-- Đặt ở tầng CSDL để không phụ thuộc việc mọi câu UPDATE trong mã nguồn có nhớ
-- gán UpdatedAt hay không — chỉ cần một chỗ quên là dữ liệu sai âm thầm.

IF OBJECT_ID('dbo.TR_FAQs_UpdatedAt', 'TR') IS NOT NULL
    DROP TRIGGER dbo.TR_FAQs_UpdatedAt;
GO
CREATE TRIGGER dbo.TR_FAQs_UpdatedAt ON dbo.FAQs AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    -- Không đụng vào nếu chính câu UPDATE đó đã tự gán UpdatedAt — tránh ghi đè
    -- giá trị mà tầng ứng dụng cố ý đặt.
    IF UPDATE(UpdatedAt) RETURN;
    UPDATE f SET UpdatedAt = SYSUTCDATETIME()
    FROM dbo.FAQs f INNER JOIN inserted i ON f.FaqID = i.FaqID;
END
GO

IF OBJECT_ID('dbo.TR_FaqDocuments_UpdatedAt', 'TR') IS NOT NULL
    DROP TRIGGER dbo.TR_FaqDocuments_UpdatedAt;
GO
CREATE TRIGGER dbo.TR_FaqDocuments_UpdatedAt ON dbo.FaqDocuments AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE(UpdatedAt) RETURN;
    UPDATE d SET UpdatedAt = SYSUTCDATETIME()
    FROM dbo.FaqDocuments d INNER JOIN inserted i ON d.DocumentID = i.DocumentID;
END
GO

-- ============================================================================
-- 6. DỮ LIỆU MẪU — chính sách cơ bản
-- ============================================================================
-- Nạp sẵn để chatbot Master có gì đó trả lời ngay từ lần chạy đầu, thay vì
-- "tôi không có thông tin về điều này". Sửa lại nội dung cho khớp chính sách
-- thật của bạn — đây chỉ là điểm khởi đầu.
--
-- Chỉ chèn khi bảng còn RỖNG, để chạy lại migration không sinh bản trùng.

IF NOT EXISTS (SELECT 1 FROM dbo.FAQs)
BEGIN
    INSERT INTO dbo.FAQs (Question, Answer, Category, SortOrder) VALUES
    (N'Làm sao để đăng ký tài khoản trên 3T EduTech?',
     N'Bấm "Đăng ký" ở góc trên bên phải, điền email và mật khẩu, sau đó xác nhận qua đường dẫn được gửi tới email của bạn. Bạn cũng có thể đăng nhập nhanh bằng tài khoản Google hoặc Facebook.',
     N'Tài khoản', 10),

    (N'Tôi có thể thanh toán khóa học bằng những hình thức nào?',
     N'Hệ thống hỗ trợ VNPay, MoMo, Stripe (thẻ quốc tế), PayPal và thanh toán bằng tiền mã hóa qua NOWPayments. Sau khi thanh toán thành công, khóa học được kích hoạt ngay trong mục "Khóa học của tôi".',
     N'Thanh toán', 20),

    (N'Chính sách hoàn tiền như thế nào?',
     N'Bạn có thể yêu cầu hoàn tiền trong vòng 7 ngày kể từ ngày thanh toán, với điều kiện đã học dưới 30% nội dung khóa học. Gửi yêu cầu qua mục Hỗ trợ kèm mã đơn hàng; chúng tôi xử lý trong 3–5 ngày làm việc.',
     N'Thanh toán', 30),

    (N'Khi nào tôi nhận được chứng chỉ hoàn thành?',
     N'Chứng chỉ được cấp tự động khi bạn hoàn thành 100% bài học của khóa. Chứng chỉ có mã xác minh riêng và có thể tra cứu công khai tại trang Xác minh chứng chỉ mà không cần đăng nhập.',
     N'Chứng chỉ', 40),

    (N'Chứng chỉ của tôi có thể bị thu hồi không?',
     N'Có. Chứng chỉ có thể bị thu hồi nếu phát hiện gian lận trong quá trình học hoặc làm bài kiểm tra. Chứng chỉ đã thu hồi sẽ hiển thị trạng thái "Đã thu hồi" khi tra cứu.',
     N'Chứng chỉ', 50),

    (N'Làm sao để trở thành giảng viên?',
     N'Vào mục "Đăng ký giảng viên", điền hồ sơ chuyên môn và tải lên giấy tờ chứng minh năng lực. Quản trị viên sẽ xét duyệt trong 3–7 ngày làm việc. Sau khi được duyệt, bạn có thể tạo và đăng bán khóa học.',
     N'Giảng viên', 60),

    (N'Khóa học của tôi có được duyệt ngay không?',
     N'Không. Mọi khóa học mới đều ở trạng thái NHÁP và phải qua bước duyệt của quản trị viên trước khi hiển thị công khai. Điều này áp dụng cho cả khóa học tạo thủ công lẫn khóa học nhập từ tệp ZIP.',
     N'Giảng viên', 70),

    (N'Dữ liệu cá nhân của tôi được bảo vệ ra sao?',
     N'Mật khẩu được băm bằng bcrypt và không bao giờ lưu ở dạng gốc. Dữ liệu học tập chỉ được dùng để cá nhân hóa trải nghiệm và không chia sẻ cho bên thứ ba vì mục đích quảng cáo. Bạn có quyền yêu cầu xóa tài khoản và dữ liệu liên quan.',
     N'Quyền riêng tư', 80),

    (N'Trợ lý AI lấy thông tin từ đâu để trả lời tôi?',
     N'Trợ lý AI chỉ dựa trên nội dung khóa học đã xuất bản, các câu hỏi thường gặp và tài liệu chính sách do quản trị viên đăng tải trong hệ thống. Trợ lý có thể trả lời chưa chính xác trong một số trường hợp — với vấn đề quan trọng, vui lòng liên hệ bộ phận hỗ trợ để được xác nhận.',
     N'Trợ lý AI', 90),

    (N'Tôi liên hệ hỗ trợ bằng cách nào?',
     N'Dùng mục Hỗ trợ trong tài khoản, hoặc hỏi trực tiếp Trợ lý AI ở góc màn hình. Với vấn đề liên quan tới thanh toán, vui lòng kèm theo mã đơn hàng để được xử lý nhanh hơn.',
     N'Hỗ trợ', 100);

    PRINT N'✅ Đã nạp 10 câu hỏi thường gặp mẫu.';
END
ELSE
    PRINT N'ℹ️ Bảng FAQs đã có dữ liệu, bỏ qua bước nạp mẫu.';
GO

PRINT N'🎉 V9 hoàn tất: kho tri thức FAQ đã sẵn sàng.';
GO
