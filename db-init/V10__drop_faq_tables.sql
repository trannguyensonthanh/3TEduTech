-- ============================================================================
-- V10: Gỡ bỏ ba bảng FAQ đã tạo ở V9
-- ============================================================================
-- [THÊM 18/08/2026]  [VIẾT LẠI 18/08/2026 — xem mục ★ LỖI ĐÃ SỬA bên dưới]
--
-- ★ VÌ SAO GỠ BỎ THỨ VỪA TẠO
--
-- V9 thêm FAQs / FaqDocuments / FaqDocumentChunks. Rà lại thì cả ba đều không
-- đáng một bảng:
--
--   FAQs               → Nội dung chính sách đổi vài tháng một lần. Để trong
--                        mã nguồn (src/api/faqs/faqs.data.js) thì lịch sử sửa
--                        đổi nằm luôn trong Git — có tác giả, có thời điểm,
--                        thứ mà một bảng CSDL không tự có.
--
--   FaqDocuments       → Chỉ là siêu dữ liệu của vài chục tệp PDF. Một tệp
--                        JSON là đủ; tệp gốc vẫn nằm trên Cloudinary.
--                        (Nay do src/api/faqs/faqDocuments.store.js quản lý.)
--
--   FaqDocumentChunks  → Lý do tôi đưa ra để giữ bảng này ĐÃ SAI. Tôi viết
--                        rằng không có cách nào xóa vector mồ côi trong
--                        ChromaDB. Thực tế ChromaDB xóa được theo bộ lọc
--                        metadata, và dự án ĐÃ CÓ SẴN endpoint làm đúng việc
--                        đó từ trước:
--
--                            DELETE /api/ingest/collection/{c}/source/{name}
--                            → collection.delete(where={"source": name})
--
--                        Chỉ cần đặt source_name = "FAQ-DOC-<id>" lúc nạp là
--                        xóa được sạch. Cột VectorID hoàn toàn thừa.
--
-- ============================================================================
-- ★ LỖI ĐÃ SỬA — ĐÂY LÀ THỨ LÀM FLYWAY BÁO ĐỎ
--
-- Bản đầu của tệp này có đoạn:
--
--     IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_FAQs_SourceDocument')
--     BEGIN
--         ALTER TABLE dbo.FAQs DROP CONSTRAINT FK_FAQs_SourceDocument;
--     END
--
-- Trông thì an toàn — có `IF EXISTS` bọc ngoài — nhưng nó KHÔNG an toàn:
--
--   SQL Server PHÂN GIẢI TÊN ĐỐI TƯỢNG CỦA `ALTER TABLE` LÚC BIÊN DỊCH LÔ LỆNH,
--   TRƯỚC KHI câu `IF` được thực thi.
--
-- Nghĩa là nếu bảng `dbo.FAQs` không tồn tại — đúng tình huống hiện tại, vì V9
-- đã bị gỡ khỏi thư mục migration và chưa từng chạy trên CSDL trong Docker —
-- thì cả lô lệnh đổ ngay:
--
--     Msg 4902: Cannot find the object "dbo.FAQs" because it does not exist
--               or you do not have permissions.
--
-- `IF EXISTS` không cứu được, vì lỗi xảy ra ở bước BIÊN DỊCH chứ không phải
-- bước chạy. (`DROP TABLE` thì ngược lại — nó phân giải tên MUỘN, nên mẫu
-- `IF ... DROP TABLE` vẫn chạy tốt. Khác biệt giữa hai câu lệnh này chính là
-- chỗ dễ mắc bẫy nhất.)
--
-- Hệ quả dây chuyền: Flyway ghi V10 vào `flyway_schema_history` với
-- success = 0, và từ đó MỌI lần chạy sau đều dừng ngay với "Detected failed
-- migration to version 10" — kể cả khi không ai đổi gì nữa. Đó là lý do
-- start.ps1 báo đỏ ở mục "Flyway da ap dung migration".
--
-- ★ CÁCH SỬA: BỎ HẲN `ALTER TABLE`.
--
-- Không cần gỡ khóa ngoại bằng tay. `DROP TABLE dbo.FAQs` tự xóa mọi khóa
-- ngoại ĐƯỢC ĐỊNH NGHĨA TRÊN chính nó — mà FK_FAQs_SourceDocument đúng là như
-- vậy (FAQs.SourceDocumentID → FaqDocuments). Chỉ cần xóa đúng thứ tự:
--
--     1. FaqDocumentChunks   (con của FaqDocuments)
--     2. FAQs                (mang khóa ngoại trỏ sang FaqDocuments)
--     3. FaqDocuments        (giờ đã hết thứ tham chiếu tới nó)
--
-- ============================================================================
-- ⚠️ TỆP db-init/V9__faq_knowledge_base.sql ĐÃ ĐƯỢC CHUYỂN RA `_to_delete/`
--    Ở GỐC DỰ ÁN, KHÔNG PHẢI vào một thư mục con của db-init.
--
--    Lý do: Flyway quét thư mục migration THEO CHIỀU SÂU. Một tệp .sql nằm
--    trong db-init/_to_delete/ vẫn được áp dụng bình thường — chuyển vào thư
--    mục con KHÔNG hề gỡ nó ra khỏi Flyway. start.ps1 nay có một mục kiểm tra
--    riêng cho đúng cái bẫy này.
-- ============================================================================

-- Không có `USE [...]` ở đây.
--
-- Ở môi trường dev, Flyway kết nối vào CSDL mặc định rồi V1 mới `CREATE
-- DATABASE`; ở production (RDS) thì scripts/02-chay-migration.sh kết nối THẲNG
-- vào ThreeTEduTechLMS. Ghi cứng `USE` sẽ hỏng ở một trong hai nơi. Bỏ đi thì
-- lệnh chạy trong đúng CSDL mà Flyway đang kết nối — đúng ở cả hai.

-- ---------------------------------------------------------------------------
-- 1. Trigger — xóa trước cho gọn.
--
-- `DROP TRIGGER IF EXISTS` cần SQL Server 2016 trở lên; dự án đang ở mức tương
-- thích 160 (SQL Server 2022) nên dùng được. Cú pháp này phân giải tên muộn,
-- không dính bẫy biên dịch như ALTER TABLE.
--
-- (Thực ra `DROP TABLE` cũng tự xóa trigger của bảng đó. Khai báo tường minh ở
-- đây để phòng trường hợp ai đó đã xóa tay bảng mà trigger còn sót lại.)
-- ---------------------------------------------------------------------------
-- ============================================================================
-- [THÊM 18/08/2026] `USE [ThreeTEduTechLMS]` — DÒNG THIẾU LÀM MIGRATION ĐỔ
--
-- Flyway ở môi trường dev kết nối vào CSDL MẶC ĐỊNH của tài khoản `sa`, tức là
-- `master` (chuỗi kết nối trong docker-compose.dev.yml không có `databaseName`).
-- Bằng chứng nằm ngay trong log: bảng lịch sử là
-- `[master].[dbo].[flyway_schema_history]`.
--
-- V1 tạo CSDL rồi tự `USE` sang nó, nhưng ngữ cảnh đó KHÔNG kéo dài sang
-- migration sau — mỗi migration chạy trên một lô lệnh mới, quay lại `master`.
--
-- Vì vậy MỌI migration phải tự chuyển ngữ cảnh ở đầu tệp. V2, V4..V8 đều có
-- dòng này; V3 là tệp DUY NHẤT thiếu, nên nó đi tìm `dbo.CourseApprovalRequests`
-- trong `master` và đổ:
--
--     Msg 4902: Cannot find the object "dbo.CourseApprovalRequests"
--               because it does not exist or you do not have permissions.
--
-- Trên RDS, dòng này vô hại: scripts/02-chay-migration.sh kết nối THẲNG vào
-- ThreeTEduTechLMS nên `USE` chỉ là lệnh không làm gì.
-- ============================================================================
USE [ThreeTEduTechLMS];
GO

DROP TRIGGER IF EXISTS dbo.TR_FAQs_UpdatedAt;
GO
DROP TRIGGER IF EXISTS dbo.TR_FaqDocuments_UpdatedAt;
GO

-- ---------------------------------------------------------------------------
-- 2. Bảng — thứ tự QUAN TRỌNG: bảng con trước, bảng cha sau.
--
-- Ngược thứ tự thì khóa ngoại chặn lại và câu lệnh đổ.
-- ---------------------------------------------------------------------------

-- Con của FaqDocuments.
DROP TABLE IF EXISTS dbo.FaqDocumentChunks;
GO

-- Mang khóa ngoại FK_FAQs_SourceDocument trỏ sang FaqDocuments.
-- Xóa bảng này là khóa ngoại đó biến mất theo — không cần ALTER TABLE.
DROP TABLE IF EXISTS dbo.FAQs;
GO

-- Giờ không còn gì tham chiếu tới nó nữa.
DROP TABLE IF EXISTS dbo.FaqDocuments;
GO

-- ---------------------------------------------------------------------------
-- 3. Báo cáo kết quả.
--
-- `PRINT` ghi ra output của Flyway, nên `docker compose logs database-init`
-- sẽ thấy. Hữu ích để biết migration này thật sự đã chạy chứ không phải bị bỏ
-- qua trong im lặng.
--
-- Dùng chữ không dấu: output của Flyway đi qua vài lớp mã hóa (JDBC → log
-- Docker → console Windows) và dấu tiếng Việt hay ra ký tự lạ ở chặng cuối.
-- ---------------------------------------------------------------------------
PRINT 'V10 hoan tat: khong con bang FAQ nao trong CSDL.';
PRINT 'Noi dung FAQ nay nam o src/api/faqs/faqs.data.js';
PRINT 'Sieu du lieu tai lieu chinh sach nam o FAQ_DOCS_DIR/manifest.json';
GO
