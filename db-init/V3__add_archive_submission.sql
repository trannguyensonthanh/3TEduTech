-- ============================================================================
-- V3: Add ARCHIVE_SUBMISSION to CourseApprovalRequests RequestType check constraint
-- ============================================================================

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
