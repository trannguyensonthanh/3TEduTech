-- ============================================================================
-- V3: Add ARCHIVE_SUBMISSION to CourseApprovalRequests RequestType check constraint
-- ============================================================================

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

IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_CourseApprovalRequests_RequestType')
BEGIN
    ALTER TABLE [dbo].[CourseApprovalRequests] DROP CONSTRAINT [CK_CourseApprovalRequests_RequestType];
END
GO

ALTER TABLE [dbo].[CourseApprovalRequests] WITH CHECK ADD CONSTRAINT [CK_CourseApprovalRequests_RequestType] CHECK (
    ([RequestType]='RE_SUBMISSION' OR [RequestType]='UPDATE_SUBMISSION' OR [RequestType]='INITIAL_SUBMISSION' OR [RequestType]='ARCHIVE_SUBMISSION')
);
GO

ALTER TABLE [dbo].[CourseApprovalRequests] CHECK CONSTRAINT [CK_CourseApprovalRequests_RequestType];
GO
