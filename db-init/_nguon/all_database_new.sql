USE [master]
GO
/****** Object:  Database [ThreeTEduTechLMS]    Script Date: 8/24/2026 10:41:03 AM ******/
CREATE DATABASE [ThreeTEduTechLMS]
 CONTAINMENT = NONE
 ON  PRIMARY 
( NAME = N'ThreeTEduTechLMS', FILENAME = N'D:\Download\appName\SQL server\data\MSSQL16.MSSQLSERVER\MSSQL\DATA\ThreeTEduTechLMS.mdf' , SIZE = 73728KB , MAXSIZE = UNLIMITED, FILEGROWTH = 65536KB )
 LOG ON 
( NAME = N'ThreeTEduTechLMS_log', FILENAME = N'D:\Download\appName\SQL server\data\MSSQL16.MSSQLSERVER\MSSQL\DATA\ThreeTEduTechLMS_log.ldf' , SIZE = 204800KB , MAXSIZE = 2048GB , FILEGROWTH = 65536KB )
 WITH CATALOG_COLLATION = DATABASE_DEFAULT, LEDGER = OFF
GO
ALTER DATABASE [ThreeTEduTechLMS] SET COMPATIBILITY_LEVEL = 160
GO
IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC [ThreeTEduTechLMS].[dbo].[sp_fulltext_database] @action = 'enable'
end
GO
ALTER DATABASE [ThreeTEduTechLMS] SET ANSI_NULL_DEFAULT OFF 
GO
ALTER DATABASE [ThreeTEduTechLMS] SET ANSI_NULLS OFF 
GO
ALTER DATABASE [ThreeTEduTechLMS] SET ANSI_PADDING OFF 
GO
ALTER DATABASE [ThreeTEduTechLMS] SET ANSI_WARNINGS OFF 
GO
ALTER DATABASE [ThreeTEduTechLMS] SET ARITHABORT OFF 
GO
ALTER DATABASE [ThreeTEduTechLMS] SET AUTO_CLOSE OFF 
GO
ALTER DATABASE [ThreeTEduTechLMS] SET AUTO_SHRINK OFF 
GO
ALTER DATABASE [ThreeTEduTechLMS] SET AUTO_UPDATE_STATISTICS ON 
GO
ALTER DATABASE [ThreeTEduTechLMS] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO
ALTER DATABASE [ThreeTEduTechLMS] SET CURSOR_DEFAULT  GLOBAL 
GO
ALTER DATABASE [ThreeTEduTechLMS] SET CONCAT_NULL_YIELDS_NULL OFF 
GO
ALTER DATABASE [ThreeTEduTechLMS] SET NUMERIC_ROUNDABORT OFF 
GO
ALTER DATABASE [ThreeTEduTechLMS] SET QUOTED_IDENTIFIER OFF 
GO
ALTER DATABASE [ThreeTEduTechLMS] SET RECURSIVE_TRIGGERS OFF 
GO
ALTER DATABASE [ThreeTEduTechLMS] SET  DISABLE_BROKER 
GO
ALTER DATABASE [ThreeTEduTechLMS] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO
ALTER DATABASE [ThreeTEduTechLMS] SET DATE_CORRELATION_OPTIMIZATION OFF 
GO
ALTER DATABASE [ThreeTEduTechLMS] SET TRUSTWORTHY OFF 
GO
ALTER DATABASE [ThreeTEduTechLMS] SET ALLOW_SNAPSHOT_ISOLATION OFF 
GO
ALTER DATABASE [ThreeTEduTechLMS] SET PARAMETERIZATION SIMPLE 
GO
ALTER DATABASE [ThreeTEduTechLMS] SET READ_COMMITTED_SNAPSHOT OFF 
GO
ALTER DATABASE [ThreeTEduTechLMS] SET HONOR_BROKER_PRIORITY OFF 
GO
ALTER DATABASE [ThreeTEduTechLMS] SET RECOVERY FULL 
GO
ALTER DATABASE [ThreeTEduTechLMS] SET  MULTI_USER 
GO
ALTER DATABASE [ThreeTEduTechLMS] SET PAGE_VERIFY CHECKSUM  
GO
ALTER DATABASE [ThreeTEduTechLMS] SET DB_CHAINING OFF 
GO
ALTER DATABASE [ThreeTEduTechLMS] SET FILESTREAM( NON_TRANSACTED_ACCESS = OFF ) 
GO
ALTER DATABASE [ThreeTEduTechLMS] SET TARGET_RECOVERY_TIME = 60 SECONDS 
GO
ALTER DATABASE [ThreeTEduTechLMS] SET DELAYED_DURABILITY = DISABLED 
GO
ALTER DATABASE [ThreeTEduTechLMS] SET ACCELERATED_DATABASE_RECOVERY = OFF  
GO
EXEC sys.sp_db_vardecimal_storage_format N'ThreeTEduTechLMS', N'ON'
GO
ALTER DATABASE [ThreeTEduTechLMS] SET QUERY_STORE = ON
GO
ALTER DATABASE [ThreeTEduTechLMS] SET QUERY_STORE (OPERATION_MODE = READ_WRITE, CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 30), DATA_FLUSH_INTERVAL_SECONDS = 900, INTERVAL_LENGTH_MINUTES = 60, MAX_STORAGE_SIZE_MB = 1000, QUERY_CAPTURE_MODE = AUTO, SIZE_BASED_CLEANUP_MODE = AUTO, MAX_PLANS_PER_QUERY = 200, WAIT_STATS_CAPTURE_MODE = ON)
GO
USE [ThreeTEduTechLMS]
GO
/****** Object:  User [ThreeTEduTechLMS_AppUser]    Script Date: 8/24/2026 10:41:03 AM ******/
CREATE USER [ThreeTEduTechLMS_AppUser] FOR LOGIN [ThreeTEduTechLMS_AppUser] WITH DEFAULT_SCHEMA=[dbo]
GO
ALTER ROLE [db_datareader] ADD MEMBER [ThreeTEduTechLMS_AppUser]
GO
ALTER ROLE [db_datawriter] ADD MEMBER [ThreeTEduTechLMS_AppUser]
GO
/****** Object:  Table [dbo].[Enrollments]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Enrollments](
	[EnrollmentID] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountID] [bigint] NOT NULL,
	[CourseID] [bigint] NOT NULL,
	[EnrolledAt] [datetime2](7) NOT NULL,
	[PurchasePrice] [decimal](18, 4) NOT NULL,
	[IsCompleted] [bit] NOT NULL,
	[CompletedAt] [datetime2](7) NULL,
 CONSTRAINT [PK_Enrollments] PRIMARY KEY CLUSTERED 
(
	[EnrollmentID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Courses]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Courses](
	[CourseID] [bigint] IDENTITY(1,1) NOT NULL,
	[CourseName] [nvarchar](500) NOT NULL,
	[Slug] [nvarchar](500) NOT NULL,
	[ShortDescription] [nvarchar](500) NOT NULL,
	[FullDescription] [nvarchar](max) NOT NULL,
	[Requirements] [nvarchar](max) NULL,
	[LearningOutcomes] [nvarchar](max) NULL,
	[ThumbnailUrl] [varchar](max) NULL,
	[IntroVideoUrl] [varchar](max) NULL,
	[OriginalPrice] [decimal](18, 4) NOT NULL,
	[DiscountedPrice] [decimal](18, 4) NULL,
	[InstructorID] [bigint] NOT NULL,
	[CategoryID] [int] NOT NULL,
	[LevelID] [int] NOT NULL,
	[Language] [varchar](10) NOT NULL,
	[StatusID] [varchar](20) NOT NULL,
	[PublishedAt] [datetime2](7) NULL,
	[IsFeatured] [bit] NOT NULL,
	[LiveCourseID] [bigint] NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
	[ThumbnailPublicId] [varchar](255) NULL,
	[AverageRating] [decimal](3, 2) NULL,
	[ReviewCount] [int] NOT NULL,
	[IntroVideoPublicId] [varchar](255) NULL,
	[VersionNumber] [int] NOT NULL,
	[RootCourseID] [bigint] NULL,
	[PreviousVersionID] [bigint] NULL,
	[IsLatestVersion] [bit] NOT NULL,
	[VersionNotes] [nvarchar](max) NULL,
	[ArchivedAt] [datetime2](7) NULL,
 CONSTRAINT [PK_Courses] PRIMARY KEY CLUSTERED 
(
	[CourseID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  View [dbo].[vw_CourseFamilyStats]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE VIEW [dbo].[vw_CourseFamilyStats]
AS
SELECT
    c.RootCourseID,
    MAX(CASE WHEN c.IsLatestVersion = 1 THEN c.CourseID END)    AS LatestCourseID,
    MAX(CASE WHEN c.IsLatestVersion = 1 THEN c.CourseName END)  AS LatestCourseName,
    MAX(CASE WHEN c.IsLatestVersion = 1 THEN c.Slug END)        AS LatestSlug,
    MAX(c.VersionNumber)                                        AS LatestVersionNumber,
    COUNT(DISTINCT c.CourseID)                                  AS TotalVersions,
    MAX(c.InstructorID)                                         AS InstructorID,
    (SELECT COUNT(*) FROM dbo.Enrollments e
      JOIN dbo.Courses c2 ON e.CourseID = c2.CourseID
     WHERE c2.RootCourseID = c.RootCourseID)                    AS TotalEnrollmentsAllVersions,
    (SELECT COUNT(*) FROM dbo.Enrollments e
      JOIN dbo.Courses c2 ON e.CourseID = c2.CourseID
     WHERE c2.RootCourseID = c.RootCourseID AND e.IsCompleted = 1) AS TotalCompletedAllVersions
FROM dbo.Courses c
WHERE c.LiveCourseID IS NULL          -- loại bản nháp đang soạn
GROUP BY c.RootCourseID;
GO
/****** Object:  Table [dbo].[ChatSessions]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ChatSessions](
	[SessionID] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountID] [bigint] NOT NULL,
	[Scope] [varchar](20) NOT NULL,
	[CourseID] [bigint] NULL,
	[LessonID] [bigint] NULL,
	[Title] [nvarchar](255) NULL,
	[MessageCount] [int] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[LastMessageAt] [datetime2](7) NOT NULL,
	[IsArchived] [bit] NOT NULL,
 CONSTRAINT [PK_ChatSessions] PRIMARY KEY CLUSTERED 
(
	[SessionID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ChatMessages]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ChatMessages](
	[MessageID] [bigint] IDENTITY(1,1) NOT NULL,
	[SessionID] [bigint] NOT NULL,
	[Role] [varchar](10) NOT NULL,
	[Content] [nvarchar](max) NOT NULL,
	[Intent] [varchar](30) NULL,
	[SourcesJson] [nvarchar](max) NULL,
	[UiWidgetJson] [nvarchar](max) NULL,
	[LlmProvider] [varchar](20) NULL,
	[LlmModel] [varchar](60) NULL,
	[TokensUsed] [int] NULL,
	[LatencyMs] [int] NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_ChatMessages] PRIMARY KEY CLUSTERED 
(
	[MessageID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  View [dbo].[vw_CourseChatInsights]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE VIEW [dbo].[vw_CourseChatInsights]
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
/****** Object:  Table [dbo].[Accounts]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Accounts](
	[AccountID] [bigint] IDENTITY(1,1) NOT NULL,
	[Email] [varchar](255) NOT NULL,
	[HashedPassword] [varchar](255) NULL,
	[RoleID] [varchar](10) NOT NULL,
	[Status] [varchar](20) NOT NULL,
	[EmailVerificationToken] [varchar](128) NULL,
	[EmailVerificationExpires] [datetime2](7) NULL,
	[PasswordResetToken] [varchar](128) NULL,
	[PasswordResetExpires] [datetime2](7) NULL,
	[HasSocialLogin] [bit] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_Accounts] PRIMARY KEY CLUSTERED 
(
	[AccountID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[AuthMethods]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AuthMethods](
	[AuthMethodID] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountID] [bigint] NOT NULL,
	[LoginType] [varchar](20) NOT NULL,
	[ExternalID] [varchar](255) NULL,
 CONSTRAINT [PK_AuthMethods] PRIMARY KEY CLUSTERED 
(
	[AuthMethodID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CartItems]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CartItems](
	[CartItemID] [bigint] IDENTITY(1,1) NOT NULL,
	[CartID] [bigint] NOT NULL,
	[CourseID] [bigint] NOT NULL,
	[PriceAtAddition] [decimal](18, 4) NOT NULL,
	[AddedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_CartItems] PRIMARY KEY CLUSTERED 
(
	[CartItemID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Carts]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Carts](
	[CartID] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountID] [bigint] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_Carts] PRIMARY KEY CLUSTERED 
(
	[CartID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Categories]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Categories](
	[CategoryID] [int] IDENTITY(1,1) NOT NULL,
	[CategoryName] [nvarchar](150) NOT NULL,
	[Slug] [varchar](150) NOT NULL,
	[Description] [nvarchar](500) NULL,
	[IconUrl] [varchar](500) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_Categories] PRIMARY KEY CLUSTERED 
(
	[CategoryID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Certificates]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Certificates](
	[CertificateID] [bigint] IDENTITY(1,1) NOT NULL,
	[CertificateCode] [varchar](50) NOT NULL,
	[AccountID] [bigint] NOT NULL,
	[CourseID] [bigint] NOT NULL,
	[EnrollmentID] [bigint] NULL,
	[StudentNameSnapshot] [nvarchar](150) NOT NULL,
	[CourseNameSnapshot] [nvarchar](500) NOT NULL,
	[InstructorNameSnapshot] [nvarchar](150) NULL,
	[CourseVersionNumber] [int] NOT NULL,
	[TotalLessonsSnapshot] [int] NULL,
	[FinalQuizAverage] [decimal](5, 2) NULL,
	[CompletedAt] [datetime2](7) NULL,
	[VerificationHash] [varchar](128) NOT NULL,
	[IssuedAt] [datetime2](7) NOT NULL,
	[IsRevoked] [bit] NOT NULL,
	[RevokedAt] [datetime2](7) NULL,
	[RevokedReason] [nvarchar](500) NULL,
	[RevokedByAdminID] [bigint] NULL,
 CONSTRAINT [PK_Certificates] PRIMARY KEY CLUSTERED 
(
	[CertificateID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CourseApprovalRequests]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CourseApprovalRequests](
	[RequestID] [bigint] IDENTITY(1,1) NOT NULL,
	[CourseID] [bigint] NOT NULL,
	[InstructorID] [bigint] NOT NULL,
	[RequestType] [varchar](30) NOT NULL,
	[Status] [varchar](20) NOT NULL,
	[InstructorNotes] [nvarchar](max) NULL,
	[AdminID] [bigint] NULL,
	[AdminNotes] [nvarchar](max) NULL,
	[ReviewedAt] [datetime2](7) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_CourseApprovalRequests] PRIMARY KEY CLUSTERED 
(
	[RequestID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CoursePayments]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CoursePayments](
	[PaymentID] [bigint] IDENTITY(1,1) NOT NULL,
	[OrderID] [bigint] NOT NULL,
	[FinalAmount] [decimal](18, 4) NOT NULL,
	[PaymentMethodID] [varchar](20) NOT NULL,
	[OriginalCurrencyID] [varchar](10) NOT NULL,
	[OriginalAmount] [decimal](36, 18) NOT NULL,
	[ExternalTransactionID] [varchar](255) NULL,
	[ConvertedCurrencyID] [varchar](10) NOT NULL,
	[ConversionRate] [decimal](24, 12) NULL,
	[ConvertedTotalAmount] [decimal](18, 4) NOT NULL,
	[TransactionFee] [decimal](18, 4) NOT NULL,
	[PaymentStatusID] [varchar](20) NOT NULL,
	[TransactionCompletedAt] [datetime2](7) NULL,
	[AdditionalInfo] [nvarchar](max) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_CoursePayments] PRIMARY KEY CLUSTERED 
(
	[PaymentID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CourseReviews]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CourseReviews](
	[ReviewID] [bigint] IDENTITY(1,1) NOT NULL,
	[CourseID] [bigint] NOT NULL,
	[AccountID] [bigint] NOT NULL,
	[Rating] [tinyint] NOT NULL,
	[Comment] [nvarchar](max) NULL,
	[ReviewedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_CourseReviews] PRIMARY KEY CLUSTERED 
(
	[ReviewID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CourseStatuses]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CourseStatuses](
	[StatusID] [varchar](20) NOT NULL,
	[StatusName] [nvarchar](100) NOT NULL,
	[Description] [nvarchar](255) NULL,
 CONSTRAINT [PK_CourseStatuses] PRIMARY KEY CLUSTERED 
(
	[StatusID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Currencies]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Currencies](
	[CurrencyID] [varchar](10) NOT NULL,
	[CurrencyName] [nvarchar](100) NOT NULL,
	[Type] [varchar](10) NOT NULL,
	[DecimalPlaces] [tinyint] NOT NULL,
 CONSTRAINT [PK_Currencies] PRIMARY KEY CLUSTERED 
(
	[CurrencyID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DiscussionPosts]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DiscussionPosts](
	[PostID] [bigint] IDENTITY(1,1) NOT NULL,
	[ThreadID] [bigint] NOT NULL,
	[ParentPostID] [bigint] NULL,
	[AccountID] [bigint] NOT NULL,
	[PostText] [nvarchar](max) NOT NULL,
	[IsInstructorPost] [bit] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_DiscussionPosts] PRIMARY KEY CLUSTERED 
(
	[PostID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DiscussionThreads]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DiscussionThreads](
	[ThreadID] [bigint] IDENTITY(1,1) NOT NULL,
	[CourseID] [bigint] NOT NULL,
	[LessonID] [bigint] NULL,
	[Title] [nvarchar](500) NOT NULL,
	[CreatedByAccountID] [bigint] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
	[IsClosed] [bit] NOT NULL,
	[LastReplierAccountID] [bigint] NULL,
	[LastReplyAt] [datetime2](7) NULL,
 CONSTRAINT [PK_DiscussionThreads] PRIMARY KEY CLUSTERED 
(
	[ThreadID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ExchangeRates]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ExchangeRates](
	[RateID] [bigint] IDENTITY(1,1) NOT NULL,
	[FromCurrencyID] [varchar](10) NOT NULL,
	[ToCurrencyID] [varchar](10) NOT NULL,
	[Rate] [decimal](36, 18) NOT NULL,
	[EffectiveTimestamp] [datetime2](7) NOT NULL,
	[Source] [nvarchar](100) NULL,
 CONSTRAINT [PK_ExchangeRates] PRIMARY KEY CLUSTERED 
(
	[RateID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[InstructorBalanceTransactions]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[InstructorBalanceTransactions](
	[TransactionID] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountID] [bigint] NOT NULL,
	[Type] [varchar](30) NOT NULL,
	[Amount] [decimal](18, 4) NOT NULL,
	[CurrencyID] [varchar](10) NOT NULL,
	[CurrentBalance] [decimal](18, 4) NOT NULL,
	[RelatedEntityType] [varchar](50) NULL,
	[RelatedEntityID] [bigint] NULL,
	[Description] [nvarchar](500) NULL,
	[TransactionTimestamp] [datetime2](7) NOT NULL,
	[PaymentID] [bigint] NULL,
	[OrderItemID] [bigint] NULL,
 CONSTRAINT [PK_InstructorBalanceTransactions] PRIMARY KEY CLUSTERED 
(
	[TransactionID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[InstructorPayoutMethods]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[InstructorPayoutMethods](
	[PayoutMethodID] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountID] [bigint] NOT NULL,
	[MethodID] [varchar](20) NOT NULL,
	[Details] [nvarchar](max) NOT NULL,
	[IsPrimary] [bit] NOT NULL,
	[Status] [varchar](20) NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_InstructorPayoutMethods] PRIMARY KEY CLUSTERED 
(
	[PayoutMethodID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[InstructorProfiles]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[InstructorProfiles](
	[AccountID] [bigint] NOT NULL,
	[ProfessionalTitle] [nvarchar](255) NULL,
	[Bio] [nvarchar](max) NULL,
	[AboutMe] [nvarchar](max) NULL,
	[LastBalanceUpdate] [datetime2](7) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_InstructorProfiles] PRIMARY KEY CLUSTERED 
(
	[AccountID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[InstructorSkills]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[InstructorSkills](
	[InstructorSkillID] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountID] [bigint] NOT NULL,
	[SkillID] [int] NOT NULL,
 CONSTRAINT [PK_InstructorSkills] PRIMARY KEY CLUSTERED 
(
	[InstructorSkillID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[InstructorSocialLinks]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[InstructorSocialLinks](
	[SocialLinkID] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountID] [bigint] NOT NULL,
	[Platform] [varchar](50) NOT NULL,
	[Url] [nvarchar](max) NOT NULL,
 CONSTRAINT [PK_InstructorSocialLinks] PRIMARY KEY CLUSTERED 
(
	[SocialLinkID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Languages]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Languages](
	[LanguageCode] [varchar](10) NOT NULL,
	[LanguageName] [nvarchar](50) NOT NULL,
	[NativeName] [nvarchar](50) NULL,
	[IsActive] [bit] NOT NULL,
	[DisplayOrder] [int] NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_Languages] PRIMARY KEY CLUSTERED 
(
	[LanguageCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[LessonAttachments]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[LessonAttachments](
	[AttachmentID] [int] IDENTITY(1,1) NOT NULL,
	[LessonID] [bigint] NOT NULL,
	[FileName] [nvarchar](255) NOT NULL,
	[FileURL] [varchar](max) NOT NULL,
	[FileType] [varchar](100) NULL,
	[FileSize] [bigint] NULL,
	[CloudStorageID] [varchar](255) NULL,
	[UploadedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_LessonAttachments] PRIMARY KEY CLUSTERED 
(
	[AttachmentID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[LessonProgress]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[LessonProgress](
	[ProgressID] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountID] [bigint] NOT NULL,
	[LessonID] [bigint] NOT NULL,
	[IsCompleted] [bit] NOT NULL,
	[CompletedAt] [datetime2](7) NULL,
	[LastWatchedPosition] [int] NULL,
	[LastWatchedAt] [datetime2](7) NULL,
	[TotalTimeSpent] [int] NOT NULL,
 CONSTRAINT [PK_LessonProgress] PRIMARY KEY CLUSTERED 
(
	[ProgressID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Lessons]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Lessons](
	[LessonID] [bigint] IDENTITY(1,1) NOT NULL,
	[SectionID] [bigint] NOT NULL,
	[LessonName] [nvarchar](255) NOT NULL,
	[Description] [nvarchar](max) NULL,
	[LessonOrder] [int] NOT NULL,
	[LessonType] [varchar](20) NOT NULL,
	[ExternalVideoID] [varchar](255) NULL,
	[ThumbnailUrl] [varchar](500) NULL,
	[VideoDurationSeconds] [int] NULL,
	[TextContent] [nvarchar](max) NULL,
	[IsFreePreview] [bit] NOT NULL,
	[OriginalID] [bigint] NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
	[VideoSourceType] [varchar](20) NULL,
	[IsArchived] [bit] NOT NULL,
 CONSTRAINT [PK_Lessons] PRIMARY KEY CLUSTERED 
(
	[LessonID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[LessonSubtitles]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[LessonSubtitles](
	[SubtitleID] [int] IDENTITY(1,1) NOT NULL,
	[LessonID] [bigint] NOT NULL,
	[LanguageCode] [varchar](10) NOT NULL,
	[SubtitleUrl] [varchar](max) NOT NULL,
	[IsDefault] [bit] NOT NULL,
	[UploadedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_LessonSubtitles] PRIMARY KEY CLUSTERED 
(
	[SubtitleID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Levels]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Levels](
	[LevelID] [int] IDENTITY(1,1) NOT NULL,
	[LevelName] [nvarchar](100) NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_Levels] PRIMARY KEY CLUSTERED 
(
	[LevelID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Notifications]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Notifications](
	[NotificationID] [bigint] IDENTITY(1,1) NOT NULL,
	[RecipientAccountID] [bigint] NOT NULL,
	[Type] [varchar](50) NOT NULL,
	[Message] [nvarchar](max) NOT NULL,
	[RelatedEntityType] [varchar](50) NULL,
	[RelatedEntityID] [varchar](255) NULL,
	[IsRead] [bit] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_Notifications] PRIMARY KEY CLUSTERED 
(
	[NotificationID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[OrderItems]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[OrderItems](
	[OrderItemID] [bigint] IDENTITY(1,1) NOT NULL,
	[OrderID] [bigint] NOT NULL,
	[CourseID] [bigint] NOT NULL,
	[PriceAtOrder] [decimal](18, 4) NOT NULL,
	[EnrollmentID] [bigint] NULL,
 CONSTRAINT [PK_OrderItems] PRIMARY KEY CLUSTERED 
(
	[OrderItemID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Orders]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Orders](
	[OrderID] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountID] [bigint] NOT NULL,
	[OrderDate] [datetime2](7) NOT NULL,
	[OriginalTotalPrice] [decimal](18, 4) NOT NULL,
	[DiscountAmount] [decimal](18, 4) NOT NULL,
	[FinalAmount] [decimal](18, 4) NOT NULL,
	[PromotionID] [int] NULL,
	[PaymentID] [bigint] NULL,
	[OrderStatus] [varchar](30) NOT NULL,
	[CurrencyID] [varchar](10) NOT NULL,
 CONSTRAINT [PK_Orders] PRIMARY KEY CLUSTERED 
(
	[OrderID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PaymentMethods]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PaymentMethods](
	[MethodID] [varchar](20) NOT NULL,
	[MethodName] [nvarchar](100) NOT NULL,
	[IconUrl] [varchar](500) NULL,
	[Description] [nvarchar](255) NULL,
 CONSTRAINT [PK_PaymentMethods] PRIMARY KEY CLUSTERED 
(
	[MethodID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PaymentStatuses]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PaymentStatuses](
	[StatusID] [varchar](20) NOT NULL,
	[StatusName] [nvarchar](100) NOT NULL,
 CONSTRAINT [PK_PaymentStatuses] PRIMARY KEY CLUSTERED 
(
	[StatusID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Payouts]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Payouts](
	[PayoutID] [bigint] IDENTITY(1,1) NOT NULL,
	[InstructorID] [bigint] NOT NULL,
	[Amount] [decimal](18, 4) NOT NULL,
	[CurrencyID] [varchar](10) NOT NULL,
	[ActualAmount] [decimal](36, 18) NULL,
	[ActualCurrencyID] [varchar](10) NULL,
	[ExchangeRate] [decimal](24, 12) NULL,
	[PaymentMethodID] [varchar](20) NOT NULL,
	[PayoutDetails] [nvarchar](max) NULL,
	[Fee] [decimal](18, 4) NOT NULL,
	[PayoutStatusID] [varchar](20) NOT NULL,
	[RequestedAt] [datetime2](7) NOT NULL,
	[ProcessedAt] [datetime2](7) NULL,
	[CompletedAt] [datetime2](7) NULL,
	[AdminID] [bigint] NULL,
	[AdminNote] [nvarchar](1000) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_Payouts] PRIMARY KEY CLUSTERED 
(
	[PayoutID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PayoutStatuses]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PayoutStatuses](
	[StatusID] [varchar](20) NOT NULL,
	[StatusName] [nvarchar](100) NOT NULL,
 CONSTRAINT [PK_PayoutStatuses] PRIMARY KEY CLUSTERED 
(
	[StatusID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Promotions]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Promotions](
	[PromotionID] [int] IDENTITY(1,1) NOT NULL,
	[DiscountCode] [varchar](50) NOT NULL,
	[PromotionName] [nvarchar](255) NOT NULL,
	[Description] [nvarchar](max) NULL,
	[DiscountType] [varchar](20) NOT NULL,
	[DiscountValue] [decimal](18, 4) NOT NULL,
	[MinOrderValue] [decimal](18, 4) NULL,
	[MaxDiscountAmount] [decimal](18, 4) NULL,
	[StartDate] [datetime2](7) NOT NULL,
	[EndDate] [datetime2](7) NOT NULL,
	[MaxUsageLimit] [int] NULL,
	[UsageCount] [int] NOT NULL,
	[Status] [varchar](20) NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_Promotions] PRIMARY KEY CLUSTERED 
(
	[PromotionID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[QuizAttemptAnswers]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[QuizAttemptAnswers](
	[AttemptAnswerID] [bigint] IDENTITY(1,1) NOT NULL,
	[AttemptID] [bigint] NOT NULL,
	[QuestionID] [int] NOT NULL,
	[SelectedOptionID] [bigint] NULL,
	[IsCorrect] [bit] NULL,
 CONSTRAINT [PK_QuizAttemptAnswers] PRIMARY KEY CLUSTERED 
(
	[AttemptAnswerID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[QuizAttempts]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[QuizAttempts](
	[AttemptID] [bigint] IDENTITY(1,1) NOT NULL,
	[LessonID] [bigint] NOT NULL,
	[AccountID] [bigint] NOT NULL,
	[StartedAt] [datetime2](7) NOT NULL,
	[CompletedAt] [datetime2](7) NULL,
	[Score] [decimal](5, 2) NULL,
	[IsPassed] [bit] NULL,
	[AttemptNumber] [int] NOT NULL,
 CONSTRAINT [PK_QuizAttempts] PRIMARY KEY CLUSTERED 
(
	[AttemptID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[QuizOptions]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[QuizOptions](
	[OptionID] [bigint] IDENTITY(1,1) NOT NULL,
	[QuestionID] [int] NOT NULL,
	[OptionText] [nvarchar](max) NOT NULL,
	[IsCorrectAnswer] [bit] NOT NULL,
	[OptionOrder] [int] NOT NULL,
	[IsArchived] [bit] NOT NULL,
 CONSTRAINT [PK_QuizOptions] PRIMARY KEY CLUSTERED 
(
	[OptionID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[QuizQuestions]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[QuizQuestions](
	[QuestionID] [int] IDENTITY(1,1) NOT NULL,
	[LessonID] [bigint] NOT NULL,
	[QuestionText] [nvarchar](max) NOT NULL,
	[Explanation] [nvarchar](max) NULL,
	[QuestionOrder] [int] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
	[IsArchived] [bit] NOT NULL,
 CONSTRAINT [PK_QuizQuestions] PRIMARY KEY CLUSTERED 
(
	[QuestionID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Roles]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Roles](
	[RoleID] [varchar](10) NOT NULL,
	[RoleName] [nvarchar](100) NOT NULL,
	[Description] [nvarchar](500) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_Roles] PRIMARY KEY CLUSTERED 
(
	[RoleID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Sections]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Sections](
	[SectionID] [bigint] IDENTITY(1,1) NOT NULL,
	[CourseID] [bigint] NOT NULL,
	[SectionName] [nvarchar](255) NOT NULL,
	[SectionOrder] [int] NOT NULL,
	[Description] [nvarchar](max) NULL,
	[OriginalID] [bigint] NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
	[IsArchived] [bit] NOT NULL,
 CONSTRAINT [PK_Sections] PRIMARY KEY CLUSTERED 
(
	[SectionID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Settings]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Settings](
	[SettingKey] [varchar](100) NOT NULL,
	[SettingValue] [nvarchar](max) NOT NULL,
	[Description] [nvarchar](500) NULL,
	[IsEditableByAdmin] [bit] NOT NULL,
	[LastUpdated] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_Settings] PRIMARY KEY CLUSTERED 
(
	[SettingKey] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Skills]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Skills](
	[SkillID] [int] IDENTITY(1,1) NOT NULL,
	[SkillName] [nvarchar](100) NOT NULL,
	[Description] [nvarchar](500) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_Skills] PRIMARY KEY CLUSTERED 
(
	[SkillID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[UserProfiles]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[UserProfiles](
	[AccountID] [bigint] NOT NULL,
	[FullName] [nvarchar](150) NOT NULL,
	[AvatarUrl] [varchar](500) NULL,
	[CoverImageUrl] [varchar](500) NULL,
	[Gender] [varchar](10) NULL,
	[BirthDate] [date] NULL,
	[PhoneNumber] [varchar](20) NULL,
	[Headline] [nvarchar](255) NULL,
	[Location] [nvarchar](255) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
	[AvatarPublicId] [nvarchar](255) NULL,
 CONSTRAINT [PK_UserProfiles] PRIMARY KEY CLUSTERED 
(
	[AccountID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[WithdrawalRequests]    Script Date: 8/24/2026 10:41:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[WithdrawalRequests](
	[RequestID] [bigint] IDENTITY(1,1) NOT NULL,
	[InstructorID] [bigint] NOT NULL,
	[RequestedAmount] [decimal](18, 4) NOT NULL,
	[RequestedCurrencyID] [varchar](10) NOT NULL,
	[PaymentMethodID] [varchar](20) NOT NULL,
	[PayoutDetailsSnapshot] [nvarchar](max) NOT NULL,
	[Status] [varchar](20) NOT NULL,
	[InstructorNotes] [nvarchar](1000) NULL,
	[AdminID] [bigint] NULL,
	[AdminNotes] [nvarchar](1000) NULL,
	[ProcessedAt] [datetime2](7) NULL,
	[PayoutID] [bigint] NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_WithdrawalRequests] PRIMARY KEY CLUSTERED 
(
	[RequestID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET IDENTITY_INSERT [dbo].[Accounts] ON 
GO
INSERT [dbo].[Accounts] ([AccountID], [Email], [HashedPassword], [RoleID], [Status], [EmailVerificationToken], [EmailVerificationExpires], [PasswordResetToken], [PasswordResetExpires], [HasSocialLogin], [CreatedAt], [UpdatedAt]) VALUES (2, N'sonthanh12345678910@gmail.com', N'$2b$10$wOfqOxn/4inuaFM4.8R/0OHRjU2eh0K74Owl/4W5kWlg/mD8CCSs2', N'NU', N'ACTIVE', NULL, NULL, NULL, NULL, 1, CAST(N'2025-05-02T17:42:15.2000000' AS DateTime2), CAST(N'2025-05-09T12:07:19.4480000' AS DateTime2))
GO
INSERT [dbo].[Accounts] ([AccountID], [Email], [HashedPassword], [RoleID], [Status], [EmailVerificationToken], [EmailVerificationExpires], [PasswordResetToken], [PasswordResetExpires], [HasSocialLogin], [CreatedAt], [UpdatedAt]) VALUES (3, N'sonthanh1234567891011@gmail.com', N'$2b$10$H87VokOt3t1mDi9a8fV1MOA4QKzDBnYsNjWGZY11dHD9jz8G0ax9m', N'NU', N'ACTIVE', NULL, NULL, NULL, NULL, 0, CAST(N'2025-05-02T19:57:33.3800000' AS DateTime2), CAST(N'2025-05-02T12:57:56.3310000' AS DateTime2))
GO
INSERT [dbo].[Accounts] ([AccountID], [Email], [HashedPassword], [RoleID], [Status], [EmailVerificationToken], [EmailVerificationExpires], [PasswordResetToken], [PasswordResetExpires], [HasSocialLogin], [CreatedAt], [UpdatedAt]) VALUES (15, N'sonthanh123456789101112@gmail.com', N'$2b$10$BJQIZ/Bp205bcDDzCsL6e.zT4.s1ItLiCw52/9BtFUHXRUBdPAl36', N'GV', N'ACTIVE', NULL, NULL, NULL, NULL, 0, CAST(N'2025-05-03T01:35:30.5033333' AS DateTime2), CAST(N'2025-05-02T18:37:30.5390000' AS DateTime2))
GO
INSERT [dbo].[Accounts] ([AccountID], [Email], [HashedPassword], [RoleID], [Status], [EmailVerificationToken], [EmailVerificationExpires], [PasswordResetToken], [PasswordResetExpires], [HasSocialLogin], [CreatedAt], [UpdatedAt]) VALUES (16, N'n22dccn078@student.ptithcm.edu.vn', NULL, N'NU', N'ACTIVE', NULL, NULL, NULL, NULL, 1, CAST(N'2025-05-03T14:20:00.9100000' AS DateTime2), CAST(N'2025-05-03T14:20:00.9100000' AS DateTime2))
GO
INSERT [dbo].[Accounts] ([AccountID], [Email], [HashedPassword], [RoleID], [Status], [EmailVerificationToken], [EmailVerificationExpires], [PasswordResetToken], [PasswordResetExpires], [HasSocialLogin], [CreatedAt], [UpdatedAt]) VALUES (17, N'sonthanh030504@gmail.com', NULL, N'NU', N'ACTIVE', NULL, NULL, NULL, NULL, 1, CAST(N'2025-05-03T15:17:21.0233333' AS DateTime2), CAST(N'2025-05-03T15:17:21.0233333' AS DateTime2))
GO
INSERT [dbo].[Accounts] ([AccountID], [Email], [HashedPassword], [RoleID], [Status], [EmailVerificationToken], [EmailVerificationExpires], [PasswordResetToken], [PasswordResetExpires], [HasSocialLogin], [CreatedAt], [UpdatedAt]) VALUES (18, N'3tedutech@gmail.com', N'$2b$10$O5VP3gqmDvO0hqjEhwUm6.ePULiCFn0sbllci3CxfZqWJzopL/kGm', N'SA', N'ACTIVE', NULL, NULL, NULL, NULL, 0, CAST(N'2025-05-03T16:17:57.9800000' AS DateTime2), CAST(N'2025-06-15T19:56:55.4010000' AS DateTime2))
GO
INSERT [dbo].[Accounts] ([AccountID], [Email], [HashedPassword], [RoleID], [Status], [EmailVerificationToken], [EmailVerificationExpires], [PasswordResetToken], [PasswordResetExpires], [HasSocialLogin], [CreatedAt], [UpdatedAt]) VALUES (19, N'sonthanhit35@gmail.com', NULL, N'NU', N'ACTIVE', NULL, NULL, NULL, NULL, 1, CAST(N'2025-06-09T21:58:19.0466667' AS DateTime2), CAST(N'2025-06-09T21:58:19.0466667' AS DateTime2))
GO
INSERT [dbo].[Accounts] ([AccountID], [Email], [HashedPassword], [RoleID], [Status], [EmailVerificationToken], [EmailVerificationExpires], [PasswordResetToken], [PasswordResetExpires], [HasSocialLogin], [CreatedAt], [UpdatedAt]) VALUES (20, N't2texchange@gmail.com', NULL, N'NU', N'ACTIVE', NULL, NULL, NULL, NULL, 1, CAST(N'2025-06-14T22:58:58.2133333' AS DateTime2), CAST(N'2025-06-14T22:58:58.2133333' AS DateTime2))
GO
INSERT [dbo].[Accounts] ([AccountID], [Email], [HashedPassword], [RoleID], [Status], [EmailVerificationToken], [EmailVerificationExpires], [PasswordResetToken], [PasswordResetExpires], [HasSocialLogin], [CreatedAt], [UpdatedAt]) VALUES (21, N'tranvanroi123456@gmail.com', NULL, N'NU', N'ACTIVE', NULL, NULL, NULL, NULL, 1, CAST(N'2025-06-15T20:52:52.5666667' AS DateTime2), CAST(N'2025-06-15T20:52:52.5666667' AS DateTime2))
GO
SET IDENTITY_INSERT [dbo].[Accounts] OFF
GO
SET IDENTITY_INSERT [dbo].[AuthMethods] ON 
GO
INSERT [dbo].[AuthMethods] ([AuthMethodID], [AccountID], [LoginType], [ExternalID]) VALUES (1, 2, N'EMAIL', NULL)
GO
INSERT [dbo].[AuthMethods] ([AuthMethodID], [AccountID], [LoginType], [ExternalID]) VALUES (2, 3, N'EMAIL', NULL)
GO
INSERT [dbo].[AuthMethods] ([AuthMethodID], [AccountID], [LoginType], [ExternalID]) VALUES (3, 15, N'EMAIL', NULL)
GO
INSERT [dbo].[AuthMethods] ([AuthMethodID], [AccountID], [LoginType], [ExternalID]) VALUES (4, 16, N'FACEBOOK', N'672044372233261')
GO
INSERT [dbo].[AuthMethods] ([AuthMethodID], [AccountID], [LoginType], [ExternalID]) VALUES (5, 17, N'GOOGLE', N'117852095516526296300')
GO
INSERT [dbo].[AuthMethods] ([AuthMethodID], [AccountID], [LoginType], [ExternalID]) VALUES (6, 18, N'EMAIL', NULL)
GO
INSERT [dbo].[AuthMethods] ([AuthMethodID], [AccountID], [LoginType], [ExternalID]) VALUES (7, 2, N'GOOGLE', N'100626742021190697216')
GO
INSERT [dbo].[AuthMethods] ([AuthMethodID], [AccountID], [LoginType], [ExternalID]) VALUES (8, 19, N'GOOGLE', N'117682776973583941405')
GO
INSERT [dbo].[AuthMethods] ([AuthMethodID], [AccountID], [LoginType], [ExternalID]) VALUES (9, 20, N'GOOGLE', N'117207619444149580833')
GO
INSERT [dbo].[AuthMethods] ([AuthMethodID], [AccountID], [LoginType], [ExternalID]) VALUES (10, 21, N'GOOGLE', N'110129473972958756128')
GO
SET IDENTITY_INSERT [dbo].[AuthMethods] OFF
GO
SET IDENTITY_INSERT [dbo].[Carts] ON 
GO
INSERT [dbo].[Carts] ([CartID], [AccountID], [CreatedAt], [UpdatedAt]) VALUES (1, 18, CAST(N'2025-05-09T18:01:11.1666667' AS DateTime2), CAST(N'2025-05-09T18:01:11.1666667' AS DateTime2))
GO
INSERT [dbo].[Carts] ([CartID], [AccountID], [CreatedAt], [UpdatedAt]) VALUES (2, 2, CAST(N'2025-05-09T19:07:31.9700000' AS DateTime2), CAST(N'2025-05-09T19:07:31.9700000' AS DateTime2))
GO
INSERT [dbo].[Carts] ([CartID], [AccountID], [CreatedAt], [UpdatedAt]) VALUES (3, 15, CAST(N'2025-05-18T15:02:25.9366667' AS DateTime2), CAST(N'2025-05-18T15:02:25.9366667' AS DateTime2))
GO
INSERT [dbo].[Carts] ([CartID], [AccountID], [CreatedAt], [UpdatedAt]) VALUES (4, 3, CAST(N'2025-05-20T22:24:03.3266667' AS DateTime2), CAST(N'2025-05-20T22:24:03.3266667' AS DateTime2))
GO
INSERT [dbo].[Carts] ([CartID], [AccountID], [CreatedAt], [UpdatedAt]) VALUES (5, 17, CAST(N'2025-06-02T19:36:10.9400000' AS DateTime2), CAST(N'2025-06-02T19:36:10.9400000' AS DateTime2))
GO
INSERT [dbo].[Carts] ([CartID], [AccountID], [CreatedAt], [UpdatedAt]) VALUES (6, 19, CAST(N'2025-06-09T21:58:19.8500000' AS DateTime2), CAST(N'2025-06-09T21:58:19.8500000' AS DateTime2))
GO
INSERT [dbo].[Carts] ([CartID], [AccountID], [CreatedAt], [UpdatedAt]) VALUES (7, 20, CAST(N'2025-06-14T22:58:59.5533333' AS DateTime2), CAST(N'2025-06-14T22:58:59.5533333' AS DateTime2))
GO
INSERT [dbo].[Carts] ([CartID], [AccountID], [CreatedAt], [UpdatedAt]) VALUES (8, 16, CAST(N'2025-06-15T15:20:24.2733333' AS DateTime2), CAST(N'2025-06-15T15:20:24.2733333' AS DateTime2))
GO
INSERT [dbo].[Carts] ([CartID], [AccountID], [CreatedAt], [UpdatedAt]) VALUES (9, 21, CAST(N'2025-06-15T20:52:55.8133333' AS DateTime2), CAST(N'2025-06-15T20:52:55.8133333' AS DateTime2))
GO
SET IDENTITY_INSERT [dbo].[Carts] OFF
GO
SET IDENTITY_INSERT [dbo].[Categories] ON 
GO
INSERT [dbo].[Categories] ([CategoryID], [CategoryName], [Slug], [Description], [IconUrl], [CreatedAt], [UpdatedAt]) VALUES (1, N'sonthanhh', N'sonthanhhhh', N'uuu', N'https://i.imgur.com/Fv9X0sX.jpeg', CAST(N'2025-05-04T12:01:48.6400000' AS DateTime2), CAST(N'2025-05-07T06:52:21.4820000' AS DateTime2))
GO
INSERT [dbo].[Categories] ([CategoryID], [CategoryName], [Slug], [Description], [IconUrl], [CreatedAt], [UpdatedAt]) VALUES (2, N'Phát triển Di động', N'phat-trien-di-dong', NULL, N'', CAST(N'2025-05-07T13:57:39.4566667' AS DateTime2), CAST(N'2025-06-14T18:41:08.1720000' AS DateTime2))
GO
INSERT [dbo].[Categories] ([CategoryID], [CategoryName], [Slug], [Description], [IconUrl], [CreatedAt], [UpdatedAt]) VALUES (8, N'Web Development', N'web-development', N'Courses on front-end and back-end web development, including HTML, CSS, JavaScript, React, Angular, Node.js, PHP, Laravel, and more.', N'https://i.imgur.com/d5p124y.png', CAST(N'2025-06-13T15:39:56.4766667' AS DateTime2), CAST(N'2025-06-14T13:46:09.6850000' AS DateTime2))
GO
INSERT [dbo].[Categories] ([CategoryID], [CategoryName], [Slug], [Description], [IconUrl], [CreatedAt], [UpdatedAt]) VALUES (9, N'Data Science', N'data-science', N'Explore the world of data with Python, R, Machine Learning, Deep Learning, and powerful data analysis tools.', N'https://i.imgur.com/d5p124y.png', CAST(N'2025-06-13T15:39:56.4766667' AS DateTime2), CAST(N'2025-06-14T13:45:51.7710000' AS DateTime2))
GO
INSERT [dbo].[Categories] ([CategoryID], [CategoryName], [Slug], [Description], [IconUrl], [CreatedAt], [UpdatedAt]) VALUES (10, N'Graphic Design', N'graphic-design', N'Learn how to use Photoshop, Illustrator, and Figma to create stunning designs for web, mobile, and print.', N'https://i.imgur.com/d5p124y.png', CAST(N'2025-06-13T15:39:56.4766667' AS DateTime2), CAST(N'2025-06-14T13:46:01.8770000' AS DateTime2))
GO
INSERT [dbo].[Categories] ([CategoryID], [CategoryName], [Slug], [Description], [IconUrl], [CreatedAt], [UpdatedAt]) VALUES (11, N'Digital Marketing', N'digital-marketing', N'Master essential skills in SEO, SEM, Content Marketing, and Social Media Marketing to promote products and services effectively.', N'https://i.imgur.com/d5p124y.png', CAST(N'2025-06-13T15:39:56.4766667' AS DateTime2), CAST(N'2025-06-14T13:45:58.3630000' AS DateTime2))
GO
INSERT [dbo].[Categories] ([CategoryID], [CategoryName], [Slug], [Description], [IconUrl], [CreatedAt], [UpdatedAt]) VALUES (12, N'Languages', N'languages', N'Improve your English, Japanese, Korean, and other popular languages for work and communication.', N'https://i.imgur.com/d5p124y.png', CAST(N'2025-06-13T15:39:56.4766667' AS DateTime2), CAST(N'2025-06-14T13:46:04.7010000' AS DateTime2))
GO
INSERT [dbo].[Categories] ([CategoryID], [CategoryName], [Slug], [Description], [IconUrl], [CreatedAt], [UpdatedAt]) VALUES (13, N'Backend Development', N'backend-development', N'Learn how to build powerful, scalable server-side applications using Node.js. This course covers APIs, databases, authentication, and everything you need to master backend development.', N'https://i.imgur.com/d5p124y.png', CAST(N'2025-06-15T01:42:22.0500000' AS DateTime2), CAST(N'2025-06-15T01:42:22.0500000' AS DateTime2))
GO
SET IDENTITY_INSERT [dbo].[Categories] OFF
GO
SET IDENTITY_INSERT [dbo].[CourseApprovalRequests] ON 
GO
INSERT [dbo].[CourseApprovalRequests] ([RequestID], [CourseID], [InstructorID], [RequestType], [Status], [InstructorNotes], [AdminID], [AdminNotes], [ReviewedAt], [CreatedAt], [UpdatedAt]) VALUES (36, 48, 18, N'INITIAL_SUBMISSION', N'APPROVED', NULL, 18, N'ok tốt lắm', CAST(N'2025-06-14T13:34:55.9490000' AS DateTime2), CAST(N'2025-06-14T20:33:39.9000000' AS DateTime2), CAST(N'2025-06-14T13:34:55.9490000' AS DateTime2))
GO
INSERT [dbo].[CourseApprovalRequests] ([RequestID], [CourseID], [InstructorID], [RequestType], [Status], [InstructorNotes], [AdminID], [AdminNotes], [ReviewedAt], [CreatedAt], [UpdatedAt]) VALUES (39, 55, 18, N'INITIAL_SUBMISSION', N'APPROVED', NULL, 18, N'ok tốt lắm phát huy nhé', CAST(N'2025-06-14T18:53:14.6220000' AS DateTime2), CAST(N'2025-06-15T01:52:58.6800000' AS DateTime2), CAST(N'2025-06-14T18:53:14.6220000' AS DateTime2))
GO
INSERT [dbo].[CourseApprovalRequests] ([RequestID], [CourseID], [InstructorID], [RequestType], [Status], [InstructorNotes], [AdminID], [AdminNotes], [ReviewedAt], [CreatedAt], [UpdatedAt]) VALUES (41, 57, 18, N'INITIAL_SUBMISSION', N'APPROVED', NULL, 18, N'okc on dê', CAST(N'2025-06-15T05:06:51.7860000' AS DateTime2), CAST(N'2025-06-15T12:06:30.4133333' AS DateTime2), CAST(N'2025-06-15T05:06:51.7860000' AS DateTime2))
GO
INSERT [dbo].[CourseApprovalRequests] ([RequestID], [CourseID], [InstructorID], [RequestType], [Status], [InstructorNotes], [AdminID], [AdminNotes], [ReviewedAt], [CreatedAt], [UpdatedAt]) VALUES (42, 58, 15, N'INITIAL_SUBMISSION', N'APPROVED', NULL, 18, N'tốt lắm', CAST(N'2025-06-15T09:18:25.5830000' AS DateTime2), CAST(N'2025-06-15T16:10:04.3933333' AS DateTime2), CAST(N'2025-06-15T09:18:25.5830000' AS DateTime2))
GO
INSERT [dbo].[CourseApprovalRequests] ([RequestID], [CourseID], [InstructorID], [RequestType], [Status], [InstructorNotes], [AdminID], [AdminNotes], [ReviewedAt], [CreatedAt], [UpdatedAt]) VALUES (44, 60, 18, N'INITIAL_SUBMISSION', N'REJECTED', NULL, 18, N'chưa tốt lắm hãy fix lại', CAST(N'2025-06-15T13:23:22.2820000' AS DateTime2), CAST(N'2025-06-15T20:22:36.2566667' AS DateTime2), CAST(N'2025-06-15T13:23:22.2820000' AS DateTime2))
GO
INSERT [dbo].[CourseApprovalRequests] ([RequestID], [CourseID], [InstructorID], [RequestType], [Status], [InstructorNotes], [AdminID], [AdminNotes], [ReviewedAt], [CreatedAt], [UpdatedAt]) VALUES (45, 60, 18, N'RE_SUBMISSION', N'REJECTED', NULL, 18, N'chưa ổn lắm tiền còn chưa nhập thik dạy free lắm à', CAST(N'2025-06-15T13:29:30.4160000' AS DateTime2), CAST(N'2025-06-15T20:27:51.7400000' AS DateTime2), CAST(N'2025-06-15T13:29:30.4160000' AS DateTime2))
GO
INSERT [dbo].[CourseApprovalRequests] ([RequestID], [CourseID], [InstructorID], [RequestType], [Status], [InstructorNotes], [AdminID], [AdminNotes], [ReviewedAt], [CreatedAt], [UpdatedAt]) VALUES (46, 60, 18, N'RE_SUBMISSION', N'APPROVED', NULL, 18, N'ok tốt', CAST(N'2025-06-15T13:44:18.1960000' AS DateTime2), CAST(N'2025-06-15T20:40:07.3500000' AS DateTime2), CAST(N'2025-06-15T13:44:18.1960000' AS DateTime2))
GO
SET IDENTITY_INSERT [dbo].[CourseApprovalRequests] OFF
GO
SET IDENTITY_INSERT [dbo].[CoursePayments] ON 
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (56, 141, CAST(450000.0000 AS Decimal(18, 4)), N'MOMO', N'VND', CAST(450000.000000000000000000 AS Decimal(36, 18)), N'b761e8d2-0fb3-45d5-b960-c97da7407109', N'VND', CAST(1.000000000000 AS Decimal(24, 12)), CAST(450000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'PENDING', NULL, N'{"deepLink":"momo://app?action=payWithApp&isScanQR=false&serviceType=app&sid=TU9NT0xSSloyMDE4MTIwNnwxNDE&v=3.0"}', CAST(N'2025-06-14T23:05:35.2100000' AS DateTime2), CAST(N'2025-06-14T23:05:35.2100000' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (57, 142, CAST(450000.0000 AS Decimal(18, 4)), N'MOMO', N'VND', CAST(450000.000000000000000000 AS Decimal(36, 18)), N'fc853717-3454-4d60-a338-5610f4f8db91', N'VND', CAST(1.000000000000 AS Decimal(24, 12)), CAST(450000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'PENDING', NULL, N'{"deepLink":"momo://app?action=payWithApp&isScanQR=false&serviceType=app&sid=TU9NT0xSSloyMDE4MTIwNnwxNDI&v=3.0"}', CAST(N'2025-06-14T23:15:57.8766667' AS DateTime2), CAST(N'2025-06-14T23:15:57.8766667' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (58, 143, CAST(1.5300 AS Decimal(18, 4)), N'PAYPAL', N'USD', CAST(1.530000000000000000 AS Decimal(36, 18)), N'5G297515MX672904S', N'VND', CAST(26082.420448618000 AS Decimal(24, 12)), CAST(39906.1033 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'PENDING', NULL, N'{"payPalOrderId":"5G297515MX672904S"}', CAST(N'2025-06-15T16:27:01.8400000' AS DateTime2), CAST(N'2025-06-15T16:27:01.8400000' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (59, 144, CAST(1.5300 AS Decimal(18, 4)), N'PAYPAL', N'USD', CAST(1.530000000000000000 AS Decimal(36, 18)), N'88L434650Y885261L', N'VND', CAST(26082.420448618000 AS Decimal(24, 12)), CAST(39906.1033 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'PENDING', NULL, N'{"payPalOrderId":"88L434650Y885261L"}', CAST(N'2025-06-15T16:30:57.3100000' AS DateTime2), CAST(N'2025-06-15T16:30:57.3100000' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (60, 145, CAST(1.5300 AS Decimal(18, 4)), N'PAYPAL', N'USD', CAST(1.530000000000000000 AS Decimal(36, 18)), N'00E596618Y043970L', N'VND', CAST(26082.420448618000 AS Decimal(24, 12)), CAST(39906.1033 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'PENDING', NULL, N'{"payPalOrderId":"00E596618Y043970L"}', CAST(N'2025-06-15T16:46:21.4233333' AS DateTime2), CAST(N'2025-06-15T16:46:21.4233333' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (61, 146, CAST(1.5300 AS Decimal(18, 4)), N'PAYPAL', N'USD', CAST(1.530000000000000000 AS Decimal(36, 18)), N'8V296533YK6501324', N'VND', CAST(26082.420448618000 AS Decimal(24, 12)), CAST(39906.1033 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'PENDING', NULL, N'{"payPalOrderId":"8V296533YK6501324"}', CAST(N'2025-06-15T16:51:20.7866667' AS DateTime2), CAST(N'2025-06-15T16:51:20.7866667' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (62, 147, CAST(1.5300 AS Decimal(18, 4)), N'PAYPAL', N'USD', CAST(1.530000000000000000 AS Decimal(36, 18)), N'0VW52309X8648615D', N'VND', CAST(26082.420448618000 AS Decimal(24, 12)), CAST(39906.1033 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'PENDING', NULL, N'{"payPalOrderId":"0VW52309X8648615D"}', CAST(N'2025-06-15T16:57:24.1733333' AS DateTime2), CAST(N'2025-06-15T16:57:24.1733333' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (63, 148, CAST(1.5300 AS Decimal(18, 4)), N'PAYPAL', N'USD', CAST(1.530000000000000000 AS Decimal(36, 18)), N'05B062240P433805E', N'VND', CAST(26082.420448618000 AS Decimal(24, 12)), CAST(39906.1033 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'PENDING', NULL, N'{"payPalOrderId":"05B062240P433805E"}', CAST(N'2025-06-15T16:57:42.2333333' AS DateTime2), CAST(N'2025-06-15T16:57:42.2333333' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (64, 149, CAST(1.5300 AS Decimal(18, 4)), N'PAYPAL', N'USD', CAST(1.530000000000000000 AS Decimal(36, 18)), N'17B801494G837393B', N'VND', CAST(26082.420448618000 AS Decimal(24, 12)), CAST(39906.1033 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'PENDING', NULL, N'{"payPalOrderId":"17B801494G837393B"}', CAST(N'2025-06-15T17:04:26.2166667' AS DateTime2), CAST(N'2025-06-15T17:04:26.2166667' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (65, 150, CAST(1.5300 AS Decimal(18, 4)), N'PAYPAL', N'USD', CAST(1.530000000000000000 AS Decimal(36, 18)), N'0V015951D46276029', N'VND', CAST(26082.420448618000 AS Decimal(24, 12)), CAST(39906.1033 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'PENDING', NULL, N'{"payPalOrderId":"0V015951D46276029"}', CAST(N'2025-06-15T17:05:28.2666667' AS DateTime2), CAST(N'2025-06-15T17:05:28.2666667' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (66, 151, CAST(1.5300 AS Decimal(18, 4)), N'PAYPAL', N'USD', CAST(1.530000000000000000 AS Decimal(36, 18)), N'7HV343016V7020030', N'VND', CAST(26082.420448618000 AS Decimal(24, 12)), CAST(39906.1033 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'PENDING', NULL, N'{"payPalOrderId":"7HV343016V7020030"}', CAST(N'2025-06-15T17:06:55.8800000' AS DateTime2), CAST(N'2025-06-15T17:06:55.8800000' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (67, 152, CAST(1.5300 AS Decimal(18, 4)), N'PAYPAL', N'USD', CAST(1.530000000000000000 AS Decimal(36, 18)), N'00A49263RP0553705', N'VND', CAST(26082.420448618000 AS Decimal(24, 12)), CAST(39906.1033 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'PENDING', NULL, N'{"payPalOrderId":"00A49263RP0553705"}', CAST(N'2025-06-15T17:12:40.3200000' AS DateTime2), CAST(N'2025-06-15T17:12:40.3200000' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (68, 153, CAST(1.5300 AS Decimal(18, 4)), N'PAYPAL', N'USD', CAST(1.530000000000000000 AS Decimal(36, 18)), N'44L06708RW350023X', N'VND', CAST(26082.420448618000 AS Decimal(24, 12)), CAST(39906.1033 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'SUCCESS', CAST(N'2025-06-15T10:16:40.0000000' AS DateTime2), N'{"payPalOrderId":"84B41029B0986663X"}', CAST(N'2025-06-15T17:16:29.9700000' AS DateTime2), CAST(N'2025-06-15T10:16:39.7750000' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (69, 155, CAST(499000.0000 AS Decimal(18, 4)), N'MOMO', N'VND', CAST(499000.000000000000000000 AS Decimal(36, 18)), N'51713f2b-3eca-420f-b3aa-80e710b45848', N'VND', CAST(1.000000000000 AS Decimal(24, 12)), CAST(499000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'PENDING', NULL, N'{"deepLink":"momo://app?action=payWithApp&isScanQR=false&serviceType=app&sid=TU9NT0xSSloyMDE4MTIwNnwxNTUtMTc0OTk4MzM3NTA4NQ&v=3.0","momoOrderId":"155-1749983375085"}', CAST(N'2025-06-15T17:29:35.1933333' AS DateTime2), CAST(N'2025-06-15T17:29:35.1933333' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (70, 157, CAST(1299000.0000 AS Decimal(18, 4)), N'MOMO', N'VND', CAST(1299000.000000000000000000 AS Decimal(36, 18)), N'abb41550-002f-45bc-8f8d-15c8ae7aa2df', N'VND', CAST(1.000000000000 AS Decimal(24, 12)), CAST(1299000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'PENDING', NULL, N'{"deepLink":"momo://app?action=payWithApp&isScanQR=false&serviceType=app&sid=TU9NT0xSSloyMDE4MTIwNnwxNTctMTc0OTk4NDY5NTg2Mg&v=3.0","momoOrderId":"157-1749984695862"}', CAST(N'2025-06-15T17:51:35.9533333' AS DateTime2), CAST(N'2025-06-15T17:51:35.9533333' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (71, 159, CAST(1299000.0000 AS Decimal(18, 4)), N'MOMO', N'VND', CAST(1299000.000000000000000000 AS Decimal(36, 18)), N'f133836e-1b4b-4193-999b-d25245856141', N'VND', CAST(1.000000000000 AS Decimal(24, 12)), CAST(1299000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'PENDING', NULL, N'{"deepLink":"momo://app?action=payWithApp&isScanQR=false&serviceType=app&sid=TU9NT0xSSloyMDE4MTIwNnwxNTktMTc0OTk4NDgxMzQ3Mw&v=3.0","momoOrderId":"159-1749984813473"}', CAST(N'2025-06-15T17:53:33.5433333' AS DateTime2), CAST(N'2025-06-15T17:53:33.5433333' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (72, 160, CAST(1299000.0000 AS Decimal(18, 4)), N'MOMO', N'VND', CAST(1299000.000000000000000000 AS Decimal(36, 18)), N'7abdeef6-c62b-44f0-87b4-45228e71a446', N'VND', CAST(1.000000000000 AS Decimal(24, 12)), CAST(1299000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'PENDING', NULL, N'{"deepLink":"momo://app?action=payWithApp&isScanQR=false&serviceType=app&sid=TU9NT0xSSloyMDE4MTIwNnwxNjAtMTc0OTk4NTU3ODIwMQ&v=3.0","momoOrderId":"160-1749985578201"}', CAST(N'2025-06-15T18:06:18.3166667' AS DateTime2), CAST(N'2025-06-15T18:06:18.3166667' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (73, 161, CAST(1299000.0000 AS Decimal(18, 4)), N'MOMO', N'VND', CAST(1299000.000000000000000000 AS Decimal(36, 18)), N'f71819bf-187b-4d1e-b42e-016cb022cae5', N'VND', CAST(1.000000000000 AS Decimal(24, 12)), CAST(1299000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'PENDING', NULL, N'{"deepLink":"momo://app?action=payWithApp&isScanQR=false&serviceType=app&sid=TU9NT0xSSloyMDE4MTIwNnwxNjEtMTc0OTk4NjA3NzYxMA&v=3.0","momoOrderId":"161-1749986077610"}', CAST(N'2025-06-15T18:14:37.7000000' AS DateTime2), CAST(N'2025-06-15T18:14:37.7000000' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (74, 162, CAST(499000.0000 AS Decimal(18, 4)), N'MOMO', N'VND', CAST(499000.000000000000000000 AS Decimal(36, 18)), N'bb8ede5e-98d5-4422-ba45-e014272d6278', N'VND', CAST(1.000000000000 AS Decimal(24, 12)), CAST(499000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'PENDING', NULL, N'{"deepLink":"momo://app?action=payWithApp&isScanQR=false&serviceType=app&sid=TU9NT0xSSloyMDE4MTIwNnwxNjItMTc0OTk4NzMzOTQ0OA&v=3.0","momoOrderId":"162-1749987339448"}', CAST(N'2025-06-15T18:35:39.5833333' AS DateTime2), CAST(N'2025-06-15T18:35:39.5833333' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (75, 163, CAST(1299000.0000 AS Decimal(18, 4)), N'MOMO', N'VND', CAST(1299000.000000000000000000 AS Decimal(36, 18)), N'40afe11b-a805-4714-9884-231148b18c09', N'VND', CAST(1.000000000000 AS Decimal(24, 12)), CAST(1299000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'PENDING', NULL, N'{"deepLink":"momo://app?action=payWithApp&isScanQR=false&serviceType=app&sid=TU9NT0xSSloyMDE4MTIwNnwxNjMtMTc0OTk4NzYxNTkyMg&v=3.0","momoOrderId":"163-1749987615922"}', CAST(N'2025-06-15T18:40:16.0966667' AS DateTime2), CAST(N'2025-06-15T18:40:16.0966667' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (76, 164, CAST(1299000.0000 AS Decimal(18, 4)), N'MOMO', N'VND', CAST(1299000.000000000000000000 AS Decimal(36, 18)), N'c066bec9-433d-47e0-92ee-7e97755c1ef0', N'VND', CAST(1.000000000000 AS Decimal(24, 12)), CAST(1299000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'PENDING', NULL, N'{"deepLink":"momo://app?action=payWithApp&isScanQR=false&serviceType=app&sid=TU9NT0xSSloyMDE4MTIwNnwxNjQtMTc0OTk4ODkwMDU1OQ&v=3.0","momoOrderId":"164-1749988900559"}', CAST(N'2025-06-15T19:01:40.7400000' AS DateTime2), CAST(N'2025-06-15T19:01:40.7400000' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (77, 165, CAST(1299000.0000 AS Decimal(18, 4)), N'MOMO', N'VND', CAST(1299000.000000000000000000 AS Decimal(36, 18)), N'7835d1bc-a249-4608-9701-7f2c8eeb846b', N'VND', CAST(1.000000000000 AS Decimal(24, 12)), CAST(1299000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'PENDING', NULL, N'{"deepLink":"momo://app?action=payWithApp&isScanQR=false&serviceType=app&sid=TU9NT0xSSloyMDE4MTIwNnwxNjUtMTc0OTk4OTY0MjE3OA&v=3.0","momoOrderId":"165-1749989642178"}', CAST(N'2025-06-15T19:14:02.3033333' AS DateTime2), CAST(N'2025-06-15T19:14:02.3033333' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (78, 167, CAST(40000.0000 AS Decimal(18, 4)), N'MOMO', N'VND', CAST(40000.000000000000000000 AS Decimal(36, 18)), N'03872a8d-b09f-48e0-bdef-630719ef6413', N'VND', CAST(1.000000000000 AS Decimal(24, 12)), CAST(40000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'PENDING', NULL, N'{"deepLink":"momo://app?action=payWithApp&isScanQR=false&serviceType=app&sid=TU9NT0xSSloyMDE4MTIwNnwxNjctMTc0OTk5NjczNjA1MA&v=3.0","momoOrderId":"167-1749996736050"}', CAST(N'2025-06-15T21:12:16.3066667' AS DateTime2), CAST(N'2025-06-15T21:12:16.3066667' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (79, 168, CAST(40000.0000 AS Decimal(18, 4)), N'MOMO', N'VND', CAST(40000.000000000000000000 AS Decimal(36, 18)), N'4508206555', N'VND', CAST(1.000000000000 AS Decimal(24, 12)), CAST(40000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'SUCCESS', CAST(N'2025-06-15T14:24:09.6530000' AS DateTime2), N'{"deepLink":"momo://app?action=payWithApp&isScanQR=false&serviceType=app&sid=TU9NT0xSSloyMDE4MTIwNnwxNjgtMTc0OTk5NzM4ODg3NQ&v=3.0","momoOrderId":"168-1749997388875"}', CAST(N'2025-06-15T21:23:09.0100000' AS DateTime2), CAST(N'2025-06-15T14:24:09.6530000' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (80, 201, CAST(7.6300 AS Decimal(18, 4)), N'PAYPAL', N'USD', CAST(7.630000000000000000 AS Decimal(36, 18)), N'4FC19316M7515894X', N'VND', CAST(26075.619295958000 AS Decimal(24, 12)), CAST(198956.9752 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'SUCCESS', CAST(N'2025-06-15T18:10:25.0000000' AS DateTime2), N'{"payPalOrderId":"56X98990PG621383B"}', CAST(N'2025-06-16T01:04:16.3166667' AS DateTime2), CAST(N'2025-06-15T18:10:26.4940000' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (81, 204, CAST(17.2600 AS Decimal(18, 4)), N'STRIPE', N'USD', CAST(17.260000000000000000 AS Decimal(36, 18)), N'pi_3RaLDGQLdKKBkzHj0AKzU64k', N'VND', CAST(26075.619295958000 AS Decimal(24, 12)), CAST(450065.1890 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'SUCCESS', CAST(N'2025-06-15T18:23:05.0000000' AS DateTime2), N'{"id":"cs_test_a1RVGhLz1AaOm2FNXrWBbOcBSHBUW61nc1H7RlYX4TUlytfJkrgll7lILC","object":"checkout.session","adaptive_pricing":{"enabled":true},"after_expiration":null,"allow_promotion_codes":null,"amount_subtotal":1726,"amount_total":1726,"automatic_tax":{"enabled":false,"liability":null,"provider":null,"status":null},"billing_address_collection":null,"cancel_url":"http://localhost:8080/payment/result?status=cancel&orderId=204","client_reference_id":null,"client_secret":null,"collected_information":{"shipping_details":null},"consent":null,"consent_collection":null,"created":1750011785,"currency":"usd","currency_conversion":null,"custom_fields":[],"custom_text":{"after_submit":null,"shipping_address":null,"submit":null,"terms_of_service_acceptance":null},"customer":null,"customer_creation":"if_required","customer_details":{"address":{"city":null,"country":"VN","line1":null,"line2":null,"postal_code":null,"state":null},"email":"tranvanroi123456@gmail.com","name":"ssss","phone":null,"tax_exempt":"none","tax_ids":[]},"customer_email":"tranvanroi123456@gmail.com","discounts":[],"expires_at":1750098185,"invoice":null,"invoice_creation":{"enabled":false,"invoice_data":{"account_tax_ids":null,"custom_fields":null,"description":null,"footer":null,"issuer":null,"metadata":{},"rendering_options":null}},"livemode":false,"locale":null,"metadata":{"accountId":"21","orderId":"204"},"mode":"payment","payment_intent":"pi_3RaLDGQLdKKBkzHj0AKzU64k","payment_link":null,"payment_method_collection":"if_required","payment_method_configuration_details":null,"payment_method_options":{"card":{"request_three_d_secure":"automatic"}},"payment_method_types":["card"],"payment_status":"paid","permissions":null,"phone_number_collection":{"enabled":false},"presentment_details":{"presentment_amount":468045,"presentment_currency":"vnd"},"recovered_from":null,"saved_payment_method_options":null,"setup_intent":null,"shipping_address_collection":null,"shipping_cost":null,"shipping_options":[],"status":"complete","submit_type":null,"subscription":null,"success_url":"http://localhost:8080/payment/result?status=success&orderId=204","total_details":{"amount_discount":0,"amount_shipping":0,"amount_tax":0},"ui_mode":"hosted","url":null,"wallet_options":null}', CAST(N'2025-06-16T01:23:28.5866667' AS DateTime2), CAST(N'2025-06-16T01:23:28.5866667' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (82, 205, CAST(499000.0000 AS Decimal(18, 4)), N'MOMO', N'VND', CAST(499000.000000000000000000 AS Decimal(36, 18)), N'3b2c55af-7036-4e8c-bd41-5fa966555fc1', N'VND', CAST(1.000000000000 AS Decimal(24, 12)), CAST(499000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'PENDING', NULL, N'{"deepLink":"momo://app?action=payWithApp&isScanQR=false&serviceType=app&sid=TU9NT0xSSloyMDE4MTIwNnwyMDUtMTc1MDAxMzE4OTg3Mw&v=3.0","momoOrderId":"205-1750013189873"}', CAST(N'2025-06-16T01:46:30.4900000' AS DateTime2), CAST(N'2025-06-16T01:46:30.4900000' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (83, 206, CAST(199000.0000 AS Decimal(18, 4)), N'MOMO', N'VND', CAST(199000.000000000000000000 AS Decimal(36, 18)), N'f45cb502-1a7c-40d2-963c-28b87c75dbfb', N'VND', CAST(1.000000000000 AS Decimal(24, 12)), CAST(199000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'PENDING', NULL, N'{"deepLink":"momo://app?action=payWithApp&isScanQR=false&serviceType=app&sid=TU9NT0xSSloyMDE4MTIwNnwyMDYtMTc1MDA0NDcxNDQwMQ&v=3.0","momoOrderId":"206-1750044714401"}', CAST(N'2025-06-16T10:31:54.6866667' AS DateTime2), CAST(N'2025-06-16T10:31:54.6866667' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (84, 208, CAST(7.6300 AS Decimal(18, 4)), N'STRIPE', N'USD', CAST(7.630000000000000000 AS Decimal(36, 18)), N'pi_3RaTqpQLdKKBkzHj1lOxiBUP', N'VND', CAST(26075.619295958000 AS Decimal(24, 12)), CAST(198956.9752 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'SUCCESS', CAST(N'2025-06-16T03:36:33.0000000' AS DateTime2), N'{"id":"cs_test_a1lZi1PFcMwn7epgSvs7KkI6dJ9KKg3I3GEs2qSflOh7koouxjIfJdGbUA","object":"checkout.session","adaptive_pricing":{"enabled":true},"after_expiration":null,"allow_promotion_codes":null,"amount_subtotal":763,"amount_total":763,"automatic_tax":{"enabled":false,"liability":null,"provider":null,"status":null},"billing_address_collection":null,"cancel_url":"http://localhost:8080/payment/result?status=cancel&orderId=208","client_reference_id":null,"client_secret":null,"collected_information":{"shipping_details":null},"consent":null,"consent_collection":null,"created":1750044993,"currency":"usd","currency_conversion":null,"custom_fields":[],"custom_text":{"after_submit":null,"shipping_address":null,"submit":null,"terms_of_service_acceptance":null},"customer":null,"customer_creation":"if_required","customer_details":{"address":{"city":null,"country":"VN","line1":null,"line2":null,"postal_code":null,"state":null},"email":"sonthanh12345678910@gmail.com","name":"cvszdvg","phone":null,"tax_exempt":"none","tax_ids":[]},"customer_email":"sonthanh12345678910@gmail.com","discounts":[],"expires_at":1750131393,"invoice":null,"invoice_creation":{"enabled":false,"invoice_data":{"account_tax_ids":null,"custom_fields":null,"description":null,"footer":null,"issuer":null,"metadata":{},"rendering_options":null}},"livemode":false,"locale":null,"metadata":{"accountId":"2","orderId":"208"},"mode":"payment","payment_intent":"pi_3RaTqpQLdKKBkzHj1lOxiBUP","payment_link":null,"payment_method_collection":"if_required","payment_method_configuration_details":null,"payment_method_options":{"card":{"request_three_d_secure":"automatic"}},"payment_method_types":["card"],"payment_status":"paid","permissions":null,"phone_number_collection":{"enabled":false},"presentment_details":{"presentment_amount":207073,"presentment_currency":"vnd"},"recovered_from":null,"saved_payment_method_options":null,"setup_intent":null,"shipping_address_collection":null,"shipping_cost":null,"shipping_options":[],"status":"complete","submit_type":null,"subscription":null,"success_url":"http://localhost:8080/payment/result?status=success&orderId=208","total_details":{"amount_discount":0,"amount_shipping":0,"amount_tax":0},"ui_mode":"hosted","url":null,"wallet_options":null}', CAST(N'2025-06-16T10:36:53.6366667' AS DateTime2), CAST(N'2025-06-16T10:36:53.6366667' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (85, 209, CAST(49.8200 AS Decimal(18, 4)), N'CRYPTO', N'USD', CAST(49.820000000000000000 AS Decimal(36, 18)), N'4967693335', N'VND', CAST(1.000000000000 AS Decimal(24, 12)), CAST(0.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'PENDING', NULL, N'{"payAddress":"TEw8Dn13LygQ3cYvaz1wUTywNxTCGtGYSB","payAmount":49.649319,"cryptoCurrency":"usdttrc20","network":"trx","paymentId":"4967693335"}', CAST(N'2025-06-16T10:51:22.4166667' AS DateTime2), CAST(N'2025-06-16T10:51:22.4166667' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (86, 210, CAST(199000.0000 AS Decimal(18, 4)), N'MOMO', N'VND', CAST(199000.000000000000000000 AS Decimal(36, 18)), N'8c5add05-3ae1-432b-b35e-fe9cee078520', N'VND', CAST(1.000000000000 AS Decimal(24, 12)), CAST(199000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'PENDING', NULL, N'{"deepLink":"momo://app?action=payWithApp&isScanQR=false&serviceType=app&sid=TU9NT0xSSloyMDE4MTIwNnwyMTAtMTc1MDA1MjMzNzIzNA&v=3.0","momoOrderId":"210-1750052337234"}', CAST(N'2025-06-16T12:38:57.4900000' AS DateTime2), CAST(N'2025-06-16T12:38:57.4900000' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (87, 211, CAST(199000.0000 AS Decimal(18, 4)), N'MOMO', N'VND', CAST(199000.000000000000000000 AS Decimal(36, 18)), N'4509031212', N'VND', CAST(1.000000000000 AS Decimal(24, 12)), CAST(199000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'SUCCESS', CAST(N'2025-06-16T05:43:22.9680000' AS DateTime2), N'{"deepLink":"momo://app?action=payWithApp&isScanQR=false&serviceType=app&sid=TU9NT0xSSloyMDE4MTIwNnwyMTEtMTc1MDA1MjU4MjA0Nw&v=3.0","momoOrderId":"211-1750052582047"}', CAST(N'2025-06-16T12:43:02.1000000' AS DateTime2), CAST(N'2025-06-16T05:43:22.9680000' AS DateTime2))
GO
INSERT [dbo].[CoursePayments] ([PaymentID], [OrderID], [FinalAmount], [PaymentMethodID], [OriginalCurrencyID], [OriginalAmount], [ExternalTransactionID], [ConvertedCurrencyID], [ConversionRate], [ConvertedTotalAmount], [TransactionFee], [PaymentStatusID], [TransactionCompletedAt], [AdditionalInfo], [CreatedAt], [UpdatedAt]) VALUES (88, 214, CAST(499000.0000 AS Decimal(18, 4)), N'MOMO', N'VND', CAST(499000.000000000000000000 AS Decimal(36, 18)), N'1750057609947', N'VND', CAST(1.000000000000 AS Decimal(24, 12)), CAST(499000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), N'FAILED', CAST(N'2025-06-16T07:06:49.5480000' AS DateTime2), N'{"deepLink":"momo://app?action=payWithApp&isScanQR=false&serviceType=app&sid=TU9NT0xSSloyMDE4MTIwNnwyMTQtMTc1MDA1NzU3MDQ0Nw&v=3.0","momoOrderId":"214-1750057570447"}', CAST(N'2025-06-16T14:06:10.5833333' AS DateTime2), CAST(N'2025-06-16T07:06:49.5480000' AS DateTime2))
GO
SET IDENTITY_INSERT [dbo].[CoursePayments] OFF
GO
SET IDENTITY_INSERT [dbo].[CourseReviews] ON 
GO
INSERT [dbo].[CourseReviews] ([ReviewID], [CourseID], [AccountID], [Rating], [Comment], [ReviewedAt]) VALUES (3, 60, 18, 5, N'cũng đc', CAST(N'2025-06-16T09:20:22.8733333' AS DateTime2))
GO
SET IDENTITY_INSERT [dbo].[CourseReviews] OFF
GO
SET IDENTITY_INSERT [dbo].[Courses] ON 
GO
INSERT [dbo].[Courses] ([CourseID], [CourseName], [Slug], [ShortDescription], [FullDescription], [Requirements], [LearningOutcomes], [ThumbnailUrl], [IntroVideoUrl], [OriginalPrice], [DiscountedPrice], [InstructorID], [CategoryID], [LevelID], [Language], [StatusID], [PublishedAt], [IsFeatured], [LiveCourseID], [CreatedAt], [UpdatedAt], [ThumbnailPublicId], [AverageRating], [ReviewCount], [IntroVideoPublicId], [VersionNumber], [RootCourseID], [PreviousVersionID], [IsLatestVersion], [VersionNotes], [ArchivedAt]) VALUES (48, N'JavaScript Introduction All tutorial Step-by-step new 2025', N'javascript-introduction-all-tutorial-step-by-step-new-2025-12a5a563', N'<p>A complete step-by-step JavaScript introduction course for beginners in 2025. Learn the fundamentals of JS including variables, data types, functions, loops, DOM manipulation, and modern ES6+ features — all with clear, beginner-friendly explanations and real-world examples.</p>', N'<h3>📘 <strong>Course Overview</strong></h3><p>This beginner-friendly course offers a <strong>comprehensive, step-by-step introduction to JavaScript</strong>, designed for absolute beginners in 2025. Whether you''re starting your journey into web development or looking to strengthen your understanding of modern JavaScript, this course will guide you through <strong>foundational to intermediate concepts</strong> using clear explanations and hands-on practice.</p><p>By the end of the course, you’ll be able to write clean JavaScript code, interact with the browser DOM, and understand the core programming principles used in real-world applications.</p><hr><h3>🎯 <strong>What You''ll Learn</strong></h3><ul><li><p>✅ What JavaScript is and how it works in the browser</p></li><li><p>✅ Setting up your coding environment (VSCode, browser DevTools)</p></li><li><p>✅ Variables (<code>let</code>, <code>const</code>, <code>var</code>) and data types (String, Number, Boolean, etc.)</p></li><li><p>✅ Operators and expressions</p></li><li><p>✅ Conditional statements (<code>if</code>, <code>else</code>, <code>switch</code>)</p></li><li><p>✅ Loops (<code>for</code>, <code>while</code>, <code>do...while</code>)</p></li><li><p>✅ Functions (declaration, expression, arrow functions)</p></li><li><p>✅ Arrays and array methods (<code>map</code>, <code>filter</code>, <code>reduce</code>)</p></li><li><p>✅ Objects and object manipulation</p></li><li><p>✅ Error handling (<code>try...catch</code>)</p></li><li><p>✅ DOM manipulation (selecting, updating, and handling events)</p></li><li><p>✅ ES6+ Features: Template literals, destructuring, spread/rest, default params, etc.</p></li><li><p>✅ Introduction to asynchronous JavaScript (callbacks, promises, <code>async/await</code>)</p></li><li><p>✅ Mini-projects and practical coding challenges</p></li></ul><hr><h3>🧑‍💻 <strong>Who This Course Is For</strong></h3><ul><li><p>Anyone new to JavaScript or web development</p></li><li><p>Students, hobby coders, or career changers</p></li><li><p>Developers familiar with HTML/CSS looking to move into front-end scripting</p></li><li><p>Anyone preparing for more advanced JS topics (e.g., React, Node.js)</p></li></ul><hr><h3>🛠️ <strong>Course Format</strong></h3><ul><li><p>Step-by-step tutorials with code examples</p></li><li><p>Interactive coding exercises and quizzes</p></li><li><p>Real-world mini-projects (e.g., to-do app, calculator, form validator)</p></li><li><p>Assignments and final project for practice</p></li><li><p>Updated for modern JavaScript (2025 standards)</p></li></ul><hr><h3>⏱️ <strong>Estimated Time to Complete</strong></h3><ul><li><p>~20–30 hours (self-paced)</p></li></ul>', N'<h2>📚 Course Requirements</h2><p>To take this course smoothly and get the most out of it, you’ll only need a few simple things:</p><h3>✅ 1. <strong>No Prior Programming Experience Required</strong></h3><ul><li><p>This course is beginner-friendly.</p></li><li><p>You don’t need to know any programming language beforehand — everything is taught from scratch.</p></li></ul><h3>✅ 2. <strong>Basic Computer Skills</strong></h3><ul><li><p>Be comfortable using a computer (file management, installing software).</p></li><li><p>Familiarity with using a browser like Chrome or Firefox.</p></li></ul><h3>✅ 3. <strong>A Computer with Internet Access</strong></h3><ul><li><p>Any operating system: Windows, macOS, or Linux.</p></li><li><p>Stable internet connection for accessing learning materials, watching videos, and using online code tools.</p></li></ul><h3>✅ 4. <strong>A Modern Web Browser</strong></h3><ul><li><p>Chrome, Firefox, Edge, or Safari – latest versions preferred.</p></li></ul><h3>✅ 5. <strong>A Code Editor (Recommended: VS Code)</strong></h3><ul><li><p>You’ll write and test JavaScript code using a text/code editor.</p></li><li><p><a target="_new" rel="noopener" class="" href="https://code.visualstudio.com/">Visual Studio Code</a> is highly recommended (free and cross-platform).</p></li></ul><h3>✅ 6. <strong>Curiosity &amp; Willingness to Practice</strong></h3><ul><li><p>Learning to code requires patience, repetition, and experimentation.</p></li><li><p>We encourage you to <strong>code along</strong> with lessons and <strong>try small variations</strong> on your own.</p></li></ul>', N'<h3>🔰 <strong>Getting Started</strong></h3><ul><li><p>What is JavaScript and why it''s essential for the web</p></li><li><p>How JavaScript runs in the browser</p></li><li><p>Setting up your first development environment (VS Code + Live Server)</p></li><li><p>Writing your first lines of JS with <code>console.log</code></p></li></ul><hr><h3>📦 <strong>Core Concepts</strong></h3><ul><li><p>Variables: <code>var</code>, <code>let</code>, <code>const</code> – differences and best practices</p></li><li><p>Data types: String, Number, Boolean, Null, Undefined, Object, Array</p></li><li><p>Type coercion and type conversion in JS</p></li><li><p>Operators: arithmetic, assignment, comparison, logical</p></li></ul><hr><h3>🔀 <strong>Control Flow</strong></h3><ul><li><p><code>if</code>, <code>else</code>, <code>else if</code> statements</p></li><li><p><code>switch</code> statements for cleaner conditional logic</p></li><li><p>Truthy and falsy values</p></li><li><p>Ternary operators</p></li></ul><hr><h3>🔁 <strong>Loops &amp; Iteration</strong></h3><ul><li><p><code>for</code>, <code>while</code>, <code>do...while</code> loops</p></li><li><p>Looping through arrays and objects</p></li><li><p>Using <code>break</code> and <code>continue</code> effectively</p></li></ul><hr><h3>🧠 <strong>Functions</strong></h3><ul><li><p>Function declarations vs. expressions</p></li><li><p>Arrow functions (<code>=&gt;</code>)</p></li><li><p>Parameters, arguments, and return values</p></li><li><p>Scope and variable visibility (block vs function scope)</p></li><li><p>Closures (intro level)</p></li></ul><hr><h3>🧱 <strong>Arrays and Objects</strong></h3><ul><li><p>Creating and manipulating arrays</p></li><li><p>Common array methods: <code>push</code>, <code>pop</code>, <code>shift</code>, <code>unshift</code>, <code>splice</code>, <code>slice</code></p></li><li><p>High-order functions: <code>forEach</code>, <code>map</code>, <code>filter</code>, <code>reduce</code></p></li><li><p>Creating and working with objects (key-value pairs)</p></li><li><p>Accessing and updating object properties</p></li></ul><hr><h3>🧩 <strong>DOM Manipulation</strong></h3><ul><li><p>What is the DOM and how JS interacts with it</p></li><li><p>Selecting elements using <code>getElementById</code>, <code>querySelector</code>, etc.</p></li><li><p>Changing content, styles, and attributes</p></li><li><p>Handling user events (clicks, input, etc.) with event listeners</p></li><li><p>Building simple interactive web pages</p></li></ul><hr><h3>⚙️ <strong>ES6+ and Modern JavaScript</strong></h3><ul><li><p>Template literals</p></li><li><p>Destructuring arrays and objects</p></li><li><p>Spread and rest operators</p></li><li><p>Default function parameters</p></li><li><p>Short-circuiting and optional chaining</p></li><li><p>Modules (intro)</p></li></ul><hr><h3>🧵 <strong>Intro to Asynchronous JavaScript</strong></h3><ul><li><p>Understanding synchronous vs asynchronous code</p></li><li><p>Using <code>setTimeout</code> and <code>setInterval</code></p></li><li><p>Introduction to callbacks</p></li><li><p>Overview of Promises and <code>async/await</code> (just enough for beginners)</p></li></ul><hr><h3>🧪 <strong>Debugging &amp; Tools</strong></h3><ul><li><p>Using the browser''s developer tools (console, sources)</p></li><li><p>Debugging common JS errors</p></li><li><p>Writing cleaner and readable code</p></li><li><p>Using linters like ESLint and formatters like Prettier</p></li></ul><hr><h3>🛠️ <strong>Mini Projects &amp; Challenges</strong></h3><ul><li><p>Build a basic calculator</p></li><li><p>Create a to-do list app</p></li><li><p>Interactive quiz or counter</p></li><li><p>Form validation example</p></li><li><p>DOM-based mini games (e.g., number guessing)</p></li></ul>', N'https://res.cloudinary.com/dkuqtn6bp/image/upload/v1749902586/courses/48/thumbnails/wgnyyhyg2g9isdyqd7ga.png', N'', CAST(500000.0000 AS Decimal(18, 4)), CAST(450000.0000 AS Decimal(18, 4)), 18, 8, 2, N'en', N'PUBLISHED', NULL, 1, NULL, CAST(N'2025-06-14T18:48:14.7233333' AS DateTime2), CAST(N'2025-06-14T13:34:55.9650000' AS DateTime2), NULL, NULL, 0, NULL, 1, 48, NULL, 1, NULL, NULL)
GO
INSERT [dbo].[Courses] ([CourseID], [CourseName], [Slug], [ShortDescription], [FullDescription], [Requirements], [LearningOutcomes], [ThumbnailUrl], [IntroVideoUrl], [OriginalPrice], [DiscountedPrice], [InstructorID], [CategoryID], [LevelID], [Language], [StatusID], [PublishedAt], [IsFeatured], [LiveCourseID], [CreatedAt], [UpdatedAt], [ThumbnailPublicId], [AverageRating], [ReviewCount], [IntroVideoPublicId], [VersionNumber], [RootCourseID], [PreviousVersionID], [IsLatestVersion], [VersionNotes], [ArchivedAt]) VALUES (55, N'Learn Node.js the Hard Way (But Smarter)', N'learn-nodejs-the-hard-way-but-smarter-a919a398', N'<p>&lt;p&gt;</p><p>    &lt;strong&gt;Bạn mệt mỏi với các khóa học Node.js chỉ dạy "bề nổi"?&lt;/strong&gt;</p><p>    Khóa học này sẽ đưa bạn vào sâu trong "động cơ" của Node.js. Học cách xây dựng các ứng dụng backend mạnh mẽ, hiệu suất cao từ con số không, hiểu rõ từng dòng code thay vì chỉ sao chép một cách máy móc.</p><p>&lt;/p&gt;</p>', N'<p>&lt;h2&gt;Tại sao lại là "The Hard Way (But Smarter)"?&lt;/h2&gt;</p><p>&lt;p&gt;</p><p>    Trong thế giới lập trình, "The Hard Way" không có nghĩa là khó khăn một cách vô nghĩa. Nó có nghĩa là chúng ta sẽ không dùng những công cụ "ma thuật" che giấu đi bản chất vấn đề. Bạn sẽ học cách:</p><p>&lt;/p&gt;</p><p>&lt;ul&gt;</p><p>    &lt;li&gt;&lt;strong&gt;Xây dựng Server từ đầu:&lt;/strong&gt; Chỉ sử dụng các module cốt lõi của Node.js (&lt;code&gt;http&lt;/code&gt;, &lt;code&gt;fs&lt;/code&gt;, &lt;code&gt;path&lt;/code&gt;) để hiểu rõ cách một web server thực sự hoạt động trước khi dùng đến các framework như Express.js.&lt;/li&gt;</p><p>    &lt;li&gt;&lt;strong&gt;Quản lý Asynchronous Flow:&lt;/strong&gt; Nắm vững Callback, Promises, và đặc biệt là &lt;code&gt;async/await&lt;/code&gt; để xử lý các tác vụ bất đồng bộ một cách thông minh và tránh "Callback Hell".&lt;/li&gt;</p><p>    &lt;li&gt;&lt;strong&gt;Kiến trúc có tổ chức:&lt;/strong&gt; Học cách cấu trúc một dự án Node.js theo các mô hình phổ biến (MVC, Layered Architecture) để dễ dàng bảo trì và mở rộng.&lt;/li&gt;</p><p>    &lt;li&gt;&lt;strong&gt;Kết nối Database một cách "thuần túy":&lt;/strong&gt; Tương tác với cơ sở dữ liệu (PostgreSQL/MongoDB) bằng driver gốc trước khi sử dụng ORM/ODM, giúp bạn hiểu sâu về cách truy vấn và quản lý kết nối.&lt;/li&gt;</p><p>&lt;/ul&gt;</p><p>&lt;h2&gt;Khóa học này dành cho ai?&lt;/h2&gt;</p><p>&lt;p&gt;</p><p>    Đây không phải là khóa học cho người mới hoàn toàn với lập trình. Bạn sẽ phù hợp nếu bạn là:</p><p>&lt;/p&gt;</p><p>&lt;ul&gt;</p><p>    &lt;li&gt;Lập trình viên đã có kiến thức cơ bản về &lt;strong&gt;JavaScript (đặc biệt là ES6+)&lt;/strong&gt; và muốn chuyển hướng sang phát triển backend.&lt;/li&gt;</p><p>    &lt;li&gt;Lập trình viên Frontend (React, Vue, Angular) muốn trở thành Full-stack.&lt;/li&gt;</p><p>    &lt;li&gt;Sinh viên ngành CNTT muốn xây dựng một nền tảng Node.js vững chắc để làm đồ án hoặc tìm việc.&lt;/li&gt;</p><p>    &lt;li&gt;Lập trình viên backend từ các ngôn ngữ khác (PHP, Python, Java) muốn tìm hiểu về hệ sinh thái Node.js.&lt;/li&gt;</p><p>&lt;/ul&gt;</p><p>&lt;h2&gt;Bạn sẽ xây dựng được gì?&lt;/h2&gt;</p><p>&lt;p&gt;</p><p>    Xuyên suốt khóa học, chúng ta sẽ cùng nhau xây dựng một dự án thực tế: &lt;strong&gt;Một hệ thống RESTful API hoàn chỉnh cho một ứng dụng Blog&lt;/strong&gt;, bao gồm các tính năng như quản lý bài viết, danh mục, người dùng, xác thực và phân quyền bằng JSON Web Tokens (JWT).</p><p>&lt;/p&gt;</p>', N'<p>&lt;h4&gt;Kiến thức bắt buộc&lt;/h4&gt;</p><p>&lt;p&gt;Để tận dụng tối đa giá trị của khóa học, bạn &lt;strong&gt;bắt buộc&lt;/strong&gt; phải có nền tảng vững chắc về những phần sau:&lt;/p&gt;</p><p>&lt;ul&gt;</p><p>    &lt;li&gt;&lt;strong&gt;JavaScript cơ bản đến nâng cao:&lt;/strong&gt;</p><p>        &lt;ul&gt;</p><p>            &lt;li&gt;Hiểu rõ về các kiểu dữ liệu, biến, toán tử, cấu trúc điều khiển (if/else, switch).&lt;/li&gt;</p><p>            &lt;li&gt;Thành thạo về vòng lặp (for, while, for...of).&lt;/li&gt;</p><p>            &lt;li&gt;Nắm vững về Functions, Scope, và Closures.&lt;/li&gt;</p><p>            &lt;li&gt;&lt;strong&gt;Đặc biệt quan trọng:&lt;/strong&gt; Hiểu sâu về lập trình bất đồng bộ trong JavaScript, bao gồm Callbacks, Promises (&lt;code&gt;.then()&lt;/code&gt;, &lt;code&gt;.catch()&lt;/code&gt;, &lt;code&gt;.finally()&lt;/code&gt;, &lt;code&gt;Promise.all()&lt;/code&gt;), và cú pháp &lt;code&gt;async/await&lt;/code&gt;.&lt;/li&gt;</p><p>        &lt;/ul&gt;</p><p>    &lt;/li&gt;</p><p>    &lt;li&gt;&lt;strong&gt;Kiến thức cơ bản về Terminal/Command Line:&lt;/strong&gt; Bạn cần biết cách sử dụng các lệnh cơ bản như &lt;code&gt;cd&lt;/code&gt;, &lt;code&gt;ls&lt;/code&gt; (hoặc &lt;code&gt;dir&lt;/code&gt;), &lt;code&gt;mkdir&lt;/code&gt;, &lt;code&gt;npm&lt;/code&gt;.&lt;/li&gt;</p><p>    &lt;li&gt;&lt;strong&gt;HTML &amp; CSS cơ bản:&lt;/strong&gt; Không cần phải là chuyên gia, chỉ cần hiểu cấu trúc cơ bản để có thể test API với các công cụ như Postman hoặc các form đơn giản.&lt;/li&gt;</p><p>&lt;/ul&gt;</p><p>&lt;h4&gt;Kiến thức khuyến khích (Có lợi thế nhưng không bắt buộc)&lt;/h4&gt;</p><p>&lt;ul&gt;</p><p>    &lt;li&gt;Hiểu biết về Git và các nền tảng như GitHub/GitLab.&lt;/li&gt;</p><p>    &lt;li&gt;Kiến thức sơ lược về cơ sở dữ liệu quan hệ (SQL) hoặc NoSQL.&lt;/li&gt;</p><p>    &lt;li&gt;Đã từng nghe qua về khái niệm API, REST, JSON.&lt;/li&gt;</p><p>&lt;/ul&gt;</p><p>&lt;h4&gt;Yêu cầu về phần mềm&lt;/h4&gt;</p><p>&lt;ul&gt;</p><p>    &lt;li&gt;Một máy tính (Windows, macOS, hoặc Linux).&lt;/li&gt;</p><p>    &lt;li&gt;Trình soạn thảo code (Visual Studio Code được khuyến nghị).&lt;/li&gt;</p><p>    &lt;li&gt;Node.js và NPM đã được cài đặt (sẽ có hướng dẫn chi tiết trong khóa học).&lt;/li&gt;</p><p>    &lt;li&gt;Công cụ test API như Postman hoặc Insomnia.&lt;/li&gt;</p><p>&lt;/ul&gt;</p>', N'<p>&lt;h4&gt;Sau khi hoàn thành khóa học này, bạn sẽ có khả năng:&lt;/h4&gt;</p><p>&lt;ul&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Hiểu sâu về bản chất của Node.js:&lt;/strong&gt; Giải thích được Event Loop, non-blocking I/O là gì và tại sao Node.js lại có hiệu suất cao cho các ứng dụng I/O-intensive.&lt;/li&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Xây dựng RESTful API hoàn chỉnh:&lt;/strong&gt; Thiết kế và triển khai các API tuân thủ theo chuẩn REST để phục vụ cho các ứng dụng web và di động.&lt;/li&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Làm chủ luồng bất đồng bộ:&lt;/strong&gt; Tự tin sử dụng &lt;code&gt;async/await&lt;/code&gt; để viết code sạch sẽ, dễ đọc và quản lý các tác vụ phức tạp.&lt;/li&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Tổ chức và cấu trúc dự án chuyên nghiệp:&lt;/strong&gt; Áp dụng các mẫu thiết kế như MVC, Layered Architecture để xây dựng các ứng dụng dễ bảo trì và mở rộng.&lt;/li&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Xác thực và phân quyền người dùng:&lt;/strong&gt; Triển khai hệ thống login, register, và bảo vệ các route bằng JSON Web Tokens (JWT).&lt;/li&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Tương tác hiệu quả với Cơ sở dữ liệu:&lt;/strong&gt; Kết nối, truy vấn và quản lý dữ liệu với cả cơ sở dữ liệu SQL (PostgreSQL) và NoSQL (MongoDB).&lt;/li&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Xử lý lỗi một cách tinh tế:&lt;/strong&gt; Xây dựng hệ thống middleware để bắt và xử lý lỗi một cách tập trung, trả về các thông báo lỗi có ý nghĩa cho client.&lt;/li&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Quản lý biến môi trường:&lt;/strong&gt; Sử dụng các tệp &lt;code&gt;.env&lt;/code&gt; để quản lý các thông tin nhạy cảm (API keys, database credentials) một cách an toàn.&lt;/li&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Tự tin xây dựng ứng dụng backend:&lt;/strong&gt; Có đủ kiến thức và kỹ năng nền tảng để tự mình bắt đầu xây dựng các dự án backend bằng Node.js.&lt;/li&gt;</p><p>&lt;/ul&gt;</p>', N'https://res.cloudinary.com/dkuqtn6bp/image/upload/v1749926416/courses/55/thumbnails/mwchb1dplcef64mskpzm.jpg', N'https://www.youtube.com/watch?v=q-xS25lsN3I', CAST(1299000.0000 AS Decimal(18, 4)), CAST(499000.0000 AS Decimal(18, 4)), 18, 8, 1, N'en', N'PUBLISHED', NULL, 1, NULL, CAST(N'2025-06-14T23:33:06.7333333' AS DateTime2), CAST(N'2025-06-14T19:11:15.2310000' AS DateTime2), NULL, NULL, 0, NULL, 1, 55, NULL, 1, NULL, NULL)
GO
INSERT [dbo].[Courses] ([CourseID], [CourseName], [Slug], [ShortDescription], [FullDescription], [Requirements], [LearningOutcomes], [ThumbnailUrl], [IntroVideoUrl], [OriginalPrice], [DiscountedPrice], [InstructorID], [CategoryID], [LevelID], [Language], [StatusID], [PublishedAt], [IsFeatured], [LiveCourseID], [CreatedAt], [UpdatedAt], [ThumbnailPublicId], [AverageRating], [ReviewCount], [IntroVideoPublicId], [VersionNumber], [RootCourseID], [PreviousVersionID], [IsLatestVersion], [VersionNotes], [ArchivedAt]) VALUES (57, N'Khóa demo cho thanh toán và cái tính năng nhỏ lẻ', N'khoa-demo-cho-thanh-toan-va-cai-tinh-nang-nho-le-cd1fb511', N'Một khóa học mới của Super Admin 3T. Chi tiết sẽ được cập nhật sớm.', N'<p>Nội dung khóa học đang được giảng viên soạn thảo...</p>', N'', N'', NULL, N'', CAST(50000.0000 AS Decimal(18, 4)), CAST(40000.0000 AS Decimal(18, 4)), 18, 1, 1, N'en', N'PUBLISHED', NULL, 0, NULL, CAST(N'2025-06-15T12:05:49.1233333' AS DateTime2), CAST(N'2025-06-15T05:06:51.8020000' AS DateTime2), NULL, NULL, 0, NULL, 1, 57, NULL, 1, NULL, NULL)
GO
INSERT [dbo].[Courses] ([CourseID], [CourseName], [Slug], [ShortDescription], [FullDescription], [Requirements], [LearningOutcomes], [ThumbnailUrl], [IntroVideoUrl], [OriginalPrice], [DiscountedPrice], [InstructorID], [CategoryID], [LevelID], [Language], [StatusID], [PublishedAt], [IsFeatured], [LiveCourseID], [CreatedAt], [UpdatedAt], [ThumbnailPublicId], [AverageRating], [ReviewCount], [IntroVideoPublicId], [VersionNumber], [RootCourseID], [PreviousVersionID], [IsLatestVersion], [VersionNotes], [ArchivedAt]) VALUES (58, N'Learn Python Like a Pro (Even If You''re Not One Yet)', N'learn-python-like-a-pro-even-if-youre-not-one-yet-579959c4', N'Một khóa học mới của Trần Nguyễn Sơn Thành. Chi tiết sẽ được cập nhật sớm.', N'<p>&lt;h3&gt;📘 Khóa học này dành cho ai ?&lt;/h3&gt;</p><p>&lt;p&gt;Bạn là sinh viên CNTT, người chuyển ngành, hay một người đam mê công nghệ muốn biến ý tưởng thành hiện thực bằng Python? Bạn đã thử tự học nhưng cảm thấy lạc lối giữa biển kiến thức? Khóa học &lt;strong&gt;"Learn Python Like a Pro"&lt;/strong&gt; được tạo ra chính là dành cho bạn. Chúng tôi không chỉ dạy bạn cú pháp, chúng tôi dạy bạn cách &lt;em&gt;suy nghĩ&lt;/em&gt; như một lập trình viên Python chuyên nghiệp.&lt;/p&gt;</p><p>&lt;hr&gt;</p><p>&lt;h3&gt;🚀 Điều gì làm nên sự khác biệt?&lt;/h3&gt;</p><p>&lt;ul&gt;</p><p>&lt;li&gt;&lt;strong&gt;Lộ trình từ Zero đến Hero:&lt;/strong&gt; Bắt đầu từ những khái niệm cơ bản nhất như biến và kiểu dữ liệu, chúng ta sẽ đi qua các cấu trúc phức tạp, lập trình hướng đối tượng (OOP), và kết thúc bằng việc xây dựng các dự án thực tế.&lt;/li&gt;</p><p>&lt;li&gt;&lt;strong&gt;Học qua dự án (Project-Based Learning):&lt;/strong&gt; Thay vì các bài tập lý thuyết khô khan, bạn sẽ áp dụng kiến thức ngay lập tức vào việc xây dựng các ứng dụng như một công cụ tự động hóa, một web scraper, hay một API đơn giản.&lt;/li&gt;</p><p>&lt;li&gt;&lt;strong&gt;Tập trung vào "Clean Code":&lt;/strong&gt; Bạn sẽ học cách viết mã không chỉ chạy được, mà còn dễ đọc, dễ bảo trì và tuân theo các chuẩn mực tốt nhất (best practices) trong ngành.&lt;/li&gt;</p><p>&lt;li&gt;&lt;strong&gt;Cập nhật cho năm 2025:&lt;/strong&gt; Toàn bộ nội dung được xây dựng dựa trên phiên bản Python mới nhất và các thư viện phổ biến hiện nay.&lt;/li&gt;</p><p>&lt;/ul&gt;</p><p>&lt;hr&gt;</p><p>&lt;h3&gt;💡 Bạn sẽ xây dựng được gì?&lt;/h3&gt;</p><p>&lt;p&gt;Trong suốt khóa học, chúng ta sẽ cùng nhau hoàn thành các dự án nhỏ và một dự án lớn cuối khóa để đưa vào portfolio của bạn:&lt;/p&gt;</p><p>&lt;ul&gt;</p><p>&lt;li&gt;&lt;strong&gt;Automated File Organizer:&lt;/strong&gt; Một script tự động sắp xếp các tệp trong thư mục Downloads của bạn.&lt;/li&gt;</p><p>&lt;li&gt;&lt;strong&gt;Web Scraper:&lt;/strong&gt; Công cụ thu thập dữ liệu giá sản phẩm từ một trang thương mại điện tử.&lt;/li&gt;</p><p>&lt;li&gt;&lt;strong&gt;Simple REST API with Flask:&lt;/strong&gt; Xây dựng một API backend cơ bản cho một ứng dụng danh sách công việc (To-do list).&lt;/li&gt;</p><p>&lt;li&gt;&lt;strong&gt;Và nhiều hơn nữa!&lt;/strong&gt;&lt;/li&gt;</p><p>&lt;/ul&gt;</p>', N'<p>&lt;h3&gt;✅ Yêu cầu Bắt buộc&lt;/h3&gt;</p><p>&lt;ul&gt;</p><p>    &lt;li&gt;&lt;strong&gt;Không yêu cầu kinh nghiệm lập trình:&lt;/strong&gt; Khóa học được thiết kế cho người mới bắt đầu. Chúng tôi sẽ dạy bạn mọi thứ từ đầu.&lt;/li&gt;</p><p>    &lt;li&gt;&lt;strong&gt;Một máy tính cá nhân:&lt;/strong&gt; Bất kỳ máy tính nào chạy Windows, macOS, hoặc Linux đều phù hợp.&lt;/li&gt;</p><p>    &lt;li&gt;&lt;strong&gt;Kết nối Internet ổn định:&lt;/strong&gt; Để xem video và tải tài liệu.&lt;/li&gt;</p><p>&lt;/ul&gt;</p><p>&lt;h3&gt;👍 Yêu cầu Khuyến khích (sẽ là một lợi thế)&lt;/h3&gt;</p><p>&lt;ul&gt;</p><p>    &lt;li&gt;&lt;strong&gt;Tư duy logic và kiên nhẫn:&lt;/strong&gt; Lập trình là một hành trình giải quyết vấn đề. Sự kiên trì là chìa khóa!&lt;/li&gt;</p><p>    &lt;li&gt;&lt;strong&gt;Tiếng Anh cơ bản:&lt;/strong&gt; Khả năng đọc hiểu tài liệu kỹ thuật bằng tiếng Anh sẽ giúp bạn tiến xa hơn sau khóa học.&lt;/li&gt;</p><p>&lt;/ul&gt;</p>', N'<p>&lt;h3&gt;🎓 Sau khi hoàn thành khóa học, bạn sẽ có khả năng:&lt;/h3&gt;</p><p>&lt;ul&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Nắm vững các khái niệm cốt lõi của Python:&lt;/strong&gt; Từ biến, kiểu dữ liệu, vòng lặp, câu điều kiện đến hàm và cấu trúc dữ liệu.&lt;/li&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Hiểu và áp dụng Lập trình Hướng đối tượng (OOP):&lt;/strong&gt; Xây dựng các lớp (classes) và đối tượng (objects) một cách hiệu quả.&lt;/li&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Làm việc với tệp và hệ thống:&lt;/strong&gt; Đọc, ghi tệp và tự động hóa các tác vụ trên máy tính của bạn.&lt;/li&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Sử dụng các thư viện phổ biến:&lt;/strong&gt; Có kiến thức nền tảng về các thư viện như &lt;code&gt;Requests&lt;/code&gt; (cho web), &lt;code&gt;Pillow&lt;/code&gt; (xử lý ảnh), và &lt;code&gt;Flask&lt;/code&gt; (web framework).&lt;/li&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Xử lý lỗi và gỡ lỗi (Debugging):&lt;/strong&gt; Tự tin tìm và sửa các lỗi trong chương trình của mình.&lt;/li&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Xây dựng các ứng dụng dòng lệnh (Command-Line Applications):&lt;/strong&gt; Tạo ra các công cụ hữu ích chạy trực tiếp từ terminal.&lt;/li&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Viết mã sạch (Clean Code):&lt;/strong&gt; Áp dụng các nguyên tắc để mã nguồn của bạn trở nên chuyên nghiệp và dễ hiểu.&lt;/li&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Tự tin xây dựng các dự án nhỏ của riêng mình:&lt;/strong&gt; Có đủ nền tảng để bắt đầu hiện thực hóa các ý tưởng cá nhân.&lt;/li&gt;</p><p>&lt;/ul&gt;</p>', N'https://res.cloudinary.com/dkuqtn6bp/image/upload/v1749978353/courses/58/thumbnails/urbe3xydtu5vph4csi3w.png', N'https://www.youtube.com/watch?v=5Pz8WGiMJ_c&list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg&index=100', CAST(1599000.0000 AS Decimal(18, 4)), CAST(1299000.0000 AS Decimal(18, 4)), 15, 9, 1, N'en', N'PUBLISHED', NULL, 1, NULL, CAST(N'2025-06-15T15:38:26.4800000' AS DateTime2), CAST(N'2025-06-15T09:25:46.5710000' AS DateTime2), NULL, NULL, 0, NULL, 1, 58, NULL, 1, NULL, NULL)
GO
INSERT [dbo].[Courses] ([CourseID], [CourseName], [Slug], [ShortDescription], [FullDescription], [Requirements], [LearningOutcomes], [ThumbnailUrl], [IntroVideoUrl], [OriginalPrice], [DiscountedPrice], [InstructorID], [CategoryID], [LevelID], [Language], [StatusID], [PublishedAt], [IsFeatured], [LiveCourseID], [CreatedAt], [UpdatedAt], [ThumbnailPublicId], [AverageRating], [ReviewCount], [IntroVideoPublicId], [VersionNumber], [RootCourseID], [PreviousVersionID], [IsLatestVersion], [VersionNotes], [ArchivedAt]) VALUES (60, N'TypeScript Tutorial Step-by-stepp', N'typescript-tutorial-step-by-step-5d42f5dd', N'<p>&lt;p&gt;Nâng cấp kỹ năng JavaScript của bạn với TypeScript! Khóa học giúp bạn viết mã an toàn, dễ bảo trì và phát hiện lỗi sớm trong quá trình phát triển. Phù hợp cho lập trình viên JavaScript muốn nâng tầm dự án.&lt;/p&gt;</p><p></p>', N'<p>&lt;h3&gt;🤔 Tại sao bạn nên học TypeScript?&lt;/h3&gt;</p><p>&lt;p&gt;Bạn đã bao giờ gặp lỗi &lt;code&gt;"Cannot read property ''...'' of undefined"&lt;/code&gt; vào lúc nửa đêm? Hay tốn hàng giờ để tìm ra một lỗi logic chỉ vì truyền sai kiểu dữ liệu cho một hàm? Nếu câu trả lời là có, thì TypeScript chính là công cụ bạn đang tìm kiếm. TypeScript là một "lớp siêu năng lực" cho JavaScript, giúp bạn xây dựng các ứng dụng lớn một cách tự tin, có tổ chức và ít lỗi hơn rất nhiều.&lt;/p&gt;</p><p>&lt;hr&gt;</p><p>&lt;h3&gt;✨ Khóa học này sẽ giúp bạn như thế nào?&lt;/h3&gt;</p><p>&lt;ul&gt;</p><p>    &lt;li&gt;&lt;strong&gt;Lộ trình thực tế:&lt;/strong&gt; Chúng tôi sẽ không chỉ dạy lý thuyết. Khóa học được xây dựng theo lộ trình từng bước, bắt đầu từ việc thiết lập môi trường, hiểu về các kiểu dữ liệu cơ bản, cho đến việc áp dụng các tính năng nâng cao như Generics, Decorators vào các dự án React hoặc Node.js.&lt;/li&gt;</p><p>    &lt;li&gt;&lt;strong&gt;Tái cấu trúc mã JavaScript:&lt;/strong&gt; Một phần quan trọng của khóa học sẽ hướng dẫn bạn cách chuyển đổi một dự án JavaScript hiện có sang TypeScript một cách an toàn và hiệu quả, một kỹ năng cực kỳ giá trị trong thực tế.&lt;/li&gt;</p><p>    &lt;li&gt;&lt;strong&gt;Tích hợp với các Framework phổ biến:&lt;/strong&gt; Học cách sử dụng TypeScript một cách nhuần nhuyễn với các thư viện/framework hàng đầu như React, Node.js &amp; Express, giúp bạn sẵn sàng cho mọi dự án.&lt;/li&gt;</p><p>    &lt;li&gt;&lt;strong&gt;Tư duy về kiểu dữ liệu (Type-Thinking):&lt;/strong&gt; Quan trọng hơn cả cú pháp, bạn sẽ học được cách tư duy về cấu trúc dữ liệu và giao diện (interfaces), giúp thiết kế hệ thống tốt hơn ngay từ đầu.&lt;/li&gt;</p><p>&lt;/ul&gt;</p><p>&lt;hr&gt;</p><p>&lt;h3&gt;💻 Dự án thực hành:&lt;/h3&gt;</p><p>&lt;p&gt;Bạn sẽ áp dụng kiến thức đã học để xây dựng một ứng dụng &lt;strong&gt;"Quản lý Công việc (Task Manager)"&lt;/strong&gt; hoàn chỉnh, sử dụng React cho frontend và Node.js/Express cho backend, tất cả đều được viết bằng TypeScript.&lt;/p&gt;</p>', N'<p>&lt;h3&gt;✅ Yêu cầu Bắt buộc&lt;/h3&gt;</p><p>&lt;ul&gt;</p><p>    &lt;li&gt;&lt;strong&gt;Kiến thức vững chắc về JavaScript:&lt;/strong&gt; Bạn phải thoải mái với các khái niệm của JavaScript hiện đại (ES6+), bao gồm &lt;code&gt;let/const&lt;/code&gt;, hàm mũi tên (arrow functions), destructuring, promises, và &lt;code&gt;async/await&lt;/code&gt;.&lt;/li&gt;</p><p>    &lt;li&gt;&lt;strong&gt;Hiểu biết cơ bản về Node.js và NPM:&lt;/strong&gt; Bạn cần biết cách khởi tạo một dự án và cài đặt các gói thư viện.&lt;/li&gt;</p><p>    &lt;li&gt;&lt;strong&gt;Máy tính và kết nối Internet:&lt;/strong&gt; Để cài đặt môi trường và theo dõi bài giảng.&lt;/li&gt;</p><p>&lt;/ul&gt;</p><p>&lt;h3&gt;👍 Yêu cầu Khuyến khích (sẽ là một lợi thế)&lt;/h3&gt;</p><p>&lt;ul&gt;</p><p>    &lt;li&gt;Đã từng làm việc với một framework JavaScript như React, Vue, hoặc Angular.&lt;/li&gt;</p><p>    &lt;li&gt;Có kiến thức cơ bản về lập trình hướng đối tượng (OOP).&lt;/li&gt;</p><p>&lt;/ul&gt;</p>', N'<p>&lt;h3&gt;🎓 Sau khi hoàn thành khóa học, bạn sẽ có khả năng:&lt;/h3&gt;</p><p>&lt;ul&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Sử dụng thành thạo các kiểu dữ liệu của TypeScript:&lt;/strong&gt; Từ các kiểu cơ bản (string, number, boolean) đến các kiểu phức tạp như Union, Intersection, Tuples, và Enums.&lt;/li&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Định nghĩa cấu trúc dữ liệu phức tạp:&lt;/strong&gt; Sử dụng &lt;code&gt;Interfaces&lt;/code&gt; và &lt;code&gt;Types&lt;/code&gt; để tạo ra các hợp đồng dữ liệu rõ ràng và an toàn.&lt;/li&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Viết các hàm an toàn về kiểu:&lt;/strong&gt; Tận dụng sức mạnh của TypeScript để định nghĩa kiểu cho tham số và giá trị trả về, tránh các lỗi không mong muốn.&lt;/li&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Làm chủ Generics:&lt;/strong&gt; Viết các thành phần và hàm có thể tái sử dụng, hoạt động với nhiều kiểu dữ liệu khác nhau một cách an toàn.&lt;/li&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Tích hợp TypeScript vào dự án React và Node.js:&lt;/strong&gt; Cấu hình và xây dựng các ứng dụng full-stack hoàn toàn bằng TypeScript.&lt;/li&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Đọc và hiểu các tệp định nghĩa kiểu (&lt;code&gt;.d.ts&lt;/code&gt;):&lt;/strong&gt; Tự tin làm việc với các thư viện JavaScript của bên thứ ba trong một môi trường TypeScript.&lt;/li&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Tự tin chuyển đổi (migrate) một dự án JavaScript sang TypeScript.&lt;/strong&gt;&lt;/li&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Tối ưu hóa quy trình làm việc với trình soạn thảo mã (VS Code):&lt;/strong&gt; Tận dụng tối đa các tính năng gợi ý, tự động hoàn thành và báo lỗi của TypeScript.&lt;/li&gt;</p><p>&lt;/ul&gt;</p>', N'https://res.cloudinary.com/dkuqtn6bp/image/upload/v1749993954/courses/60/thumbnails/nwyuiuba8nnqbatv7u7o.png', N'https://www.youtube.com/watch?v=fPYbNXzXP6M&list=PL4cUxeGkcC9gUgr39Q_yD6v-bSyMwKPUI&index=21', CAST(500000.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), 18, 8, 1, N'en', N'PUBLISHED', NULL, 1, NULL, CAST(N'2025-06-15T19:26:23.2300000' AS DateTime2), CAST(N'2025-06-16T05:53:02.8460000' AS DateTime2), NULL, CAST(5.00 AS Decimal(3, 2)), 1, NULL, 1, 60, NULL, 1, NULL, NULL)
GO
INSERT [dbo].[Courses] ([CourseID], [CourseName], [Slug], [ShortDescription], [FullDescription], [Requirements], [LearningOutcomes], [ThumbnailUrl], [IntroVideoUrl], [OriginalPrice], [DiscountedPrice], [InstructorID], [CategoryID], [LevelID], [Language], [StatusID], [PublishedAt], [IsFeatured], [LiveCourseID], [CreatedAt], [UpdatedAt], [ThumbnailPublicId], [AverageRating], [ReviewCount], [IntroVideoPublicId], [VersionNumber], [RootCourseID], [PreviousVersionID], [IsLatestVersion], [VersionNotes], [ArchivedAt]) VALUES (61, N'ddddddddddddddđhhh', N'dddddddddddddddhhh', N'Một khóa học mới của Super Admin 3T. Chi tiết sẽ được cập nhật sớm.', N'<p>Nội dung khóa học đang được giảng viên soạn thảo...</p>', N'', N'', NULL, N'', CAST(0.0000 AS Decimal(18, 4)), NULL, 18, 1, 1, N'en', N'DRAFT', NULL, 0, NULL, CAST(N'2025-06-16T10:57:05.5466667' AS DateTime2), CAST(N'2025-06-16T03:57:18.6270000' AS DateTime2), NULL, NULL, 0, NULL, 1, 61, NULL, 1, NULL, NULL)
GO
INSERT [dbo].[Courses] ([CourseID], [CourseName], [Slug], [ShortDescription], [FullDescription], [Requirements], [LearningOutcomes], [ThumbnailUrl], [IntroVideoUrl], [OriginalPrice], [DiscountedPrice], [InstructorID], [CategoryID], [LevelID], [Language], [StatusID], [PublishedAt], [IsFeatured], [LiveCourseID], [CreatedAt], [UpdatedAt], [ThumbnailPublicId], [AverageRating], [ReviewCount], [IntroVideoPublicId], [VersionNumber], [RootCourseID], [PreviousVersionID], [IsLatestVersion], [VersionNotes], [ArchivedAt]) VALUES (64, N'Mastering Mobile Development with Sonthanh', N'mastering-mobile-development-with-sonthanh-f27b3583', N'Một khóa học mới của Super Admin 3T. Chi tiết sẽ được cập nhật sớm.', N'<p>Nội dung khóa học đang được giảng viên soạn thảo...</p>', NULL, NULL, NULL, NULL, CAST(0.0000 AS Decimal(18, 4)), NULL, 18, 8, 1, N'en', N'DRAFT', NULL, 0, NULL, CAST(N'2025-06-16T13:53:54.8433333' AS DateTime2), CAST(N'2025-06-16T13:53:54.8433333' AS DateTime2), NULL, NULL, 0, NULL, 1, 64, NULL, 1, NULL, NULL)
GO
INSERT [dbo].[Courses] ([CourseID], [CourseName], [Slug], [ShortDescription], [FullDescription], [Requirements], [LearningOutcomes], [ThumbnailUrl], [IntroVideoUrl], [OriginalPrice], [DiscountedPrice], [InstructorID], [CategoryID], [LevelID], [Language], [StatusID], [PublishedAt], [IsFeatured], [LiveCourseID], [CreatedAt], [UpdatedAt], [ThumbnailPublicId], [AverageRating], [ReviewCount], [IntroVideoPublicId], [VersionNumber], [RootCourseID], [PreviousVersionID], [IsLatestVersion], [VersionNotes], [ArchivedAt]) VALUES (65, N'TypeScript Tutorial Step-by-step', N'typescript-tutorial-step-by-step', N'<p>&lt;p&gt;Nâng cấp kỹ năng JavaScript của bạn với TypeScript! Khóa học giúp bạn viết mã an toàn, dễ bảo trì và phát hiện lỗi sớm trong quá trình phát triển. Phù hợp cho lập trình viên JavaScript muốn nâng tầm dự án.&lt;/p&gt;</p><p></p>', N'<p>&lt;h3&gt;🤔 Tại sao bạn nên học TypeScript?&lt;/h3&gt;</p><p>&lt;p&gt;Bạn đã bao giờ gặp lỗi &lt;code&gt;"Cannot read property ''...'' of undefined"&lt;/code&gt; vào lúc nửa đêm? Hay tốn hàng giờ để tìm ra một lỗi logic chỉ vì truyền sai kiểu dữ liệu cho một hàm? Nếu câu trả lời là có, thì TypeScript chính là công cụ bạn đang tìm kiếm. TypeScript là một "lớp siêu năng lực" cho JavaScript, giúp bạn xây dựng các ứng dụng lớn một cách tự tin, có tổ chức và ít lỗi hơn rất nhiều.&lt;/p&gt;</p><p>&lt;hr&gt;</p><p>&lt;h3&gt;✨ Khóa học này sẽ giúp bạn như thế nào?&lt;/h3&gt;</p><p>&lt;ul&gt;</p><p>    &lt;li&gt;&lt;strong&gt;Lộ trình thực tế:&lt;/strong&gt; Chúng tôi sẽ không chỉ dạy lý thuyết. Khóa học được xây dựng theo lộ trình từng bước, bắt đầu từ việc thiết lập môi trường, hiểu về các kiểu dữ liệu cơ bản, cho đến việc áp dụng các tính năng nâng cao như Generics, Decorators vào các dự án React hoặc Node.js.&lt;/li&gt;</p><p>    &lt;li&gt;&lt;strong&gt;Tái cấu trúc mã JavaScript:&lt;/strong&gt; Một phần quan trọng của khóa học sẽ hướng dẫn bạn cách chuyển đổi một dự án JavaScript hiện có sang TypeScript một cách an toàn và hiệu quả, một kỹ năng cực kỳ giá trị trong thực tế.&lt;/li&gt;</p><p>    &lt;li&gt;&lt;strong&gt;Tích hợp với các Framework phổ biến:&lt;/strong&gt; Học cách sử dụng TypeScript một cách nhuần nhuyễn với các thư viện/framework hàng đầu như React, Node.js &amp; Express, giúp bạn sẵn sàng cho mọi dự án.&lt;/li&gt;</p><p>    &lt;li&gt;&lt;strong&gt;Tư duy về kiểu dữ liệu (Type-Thinking):&lt;/strong&gt; Quan trọng hơn cả cú pháp, bạn sẽ học được cách tư duy về cấu trúc dữ liệu và giao diện (interfaces), giúp thiết kế hệ thống tốt hơn ngay từ đầu.&lt;/li&gt;</p><p>&lt;/ul&gt;</p><p>&lt;hr&gt;</p><p>&lt;h3&gt;💻 Dự án thực hành:&lt;/h3&gt;</p><p>&lt;p&gt;Bạn sẽ áp dụng kiến thức đã học để xây dựng một ứng dụng &lt;strong&gt;"Quản lý Công việc (Task Manager)"&lt;/strong&gt; hoàn chỉnh, sử dụng React cho frontend và Node.js/Express cho backend, tất cả đều được viết bằng TypeScript.&lt;/p&gt;</p>', N'<p>&lt;h3&gt;✅ Yêu cầu Bắt buộc&lt;/h3&gt;</p><p>&lt;ul&gt;</p><p>    &lt;li&gt;&lt;strong&gt;Kiến thức vững chắc về JavaScript:&lt;/strong&gt; Bạn phải thoải mái với các khái niệm của JavaScript hiện đại (ES6+), bao gồm &lt;code&gt;let/const&lt;/code&gt;, hàm mũi tên (arrow functions), destructuring, promises, và &lt;code&gt;async/await&lt;/code&gt;.&lt;/li&gt;</p><p>    &lt;li&gt;&lt;strong&gt;Hiểu biết cơ bản về Node.js và NPM:&lt;/strong&gt; Bạn cần biết cách khởi tạo một dự án và cài đặt các gói thư viện.&lt;/li&gt;</p><p>    &lt;li&gt;&lt;strong&gt;Máy tính và kết nối Internet:&lt;/strong&gt; Để cài đặt môi trường và theo dõi bài giảng.&lt;/li&gt;</p><p>&lt;/ul&gt;</p><p>&lt;h3&gt;👍 Yêu cầu Khuyến khích (sẽ là một lợi thế)&lt;/h3&gt;</p><p>&lt;ul&gt;</p><p>    &lt;li&gt;Đã từng làm việc với một framework JavaScript như React, Vue, hoặc Angular.&lt;/li&gt;</p><p>    &lt;li&gt;Có kiến thức cơ bản về lập trình hướng đối tượng (OOP).&lt;/li&gt;</p><p>&lt;/ul&gt;</p>', N'<p>&lt;h3&gt;🎓 Sau khi hoàn thành khóa học, bạn sẽ có khả năng:&lt;/h3&gt;</p><p>&lt;ul&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Sử dụng thành thạo các kiểu dữ liệu của TypeScript:&lt;/strong&gt; Từ các kiểu cơ bản (string, number, boolean) đến các kiểu phức tạp như Union, Intersection, Tuples, và Enums.&lt;/li&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Định nghĩa cấu trúc dữ liệu phức tạp:&lt;/strong&gt; Sử dụng &lt;code&gt;Interfaces&lt;/code&gt; và &lt;code&gt;Types&lt;/code&gt; để tạo ra các hợp đồng dữ liệu rõ ràng và an toàn.&lt;/li&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Viết các hàm an toàn về kiểu:&lt;/strong&gt; Tận dụng sức mạnh của TypeScript để định nghĩa kiểu cho tham số và giá trị trả về, tránh các lỗi không mong muốn.&lt;/li&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Làm chủ Generics:&lt;/strong&gt; Viết các thành phần và hàm có thể tái sử dụng, hoạt động với nhiều kiểu dữ liệu khác nhau một cách an toàn.&lt;/li&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Tích hợp TypeScript vào dự án React và Node.js:&lt;/strong&gt; Cấu hình và xây dựng các ứng dụng full-stack hoàn toàn bằng TypeScript.&lt;/li&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Đọc và hiểu các tệp định nghĩa kiểu (&lt;code&gt;.d.ts&lt;/code&gt;):&lt;/strong&gt; Tự tin làm việc với các thư viện JavaScript của bên thứ ba trong một môi trường TypeScript.&lt;/li&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Tự tin chuyển đổi (migrate) một dự án JavaScript sang TypeScript.&lt;/strong&gt;&lt;/li&gt;</p><p>    &lt;li&gt;✅ &lt;strong&gt;Tối ưu hóa quy trình làm việc với trình soạn thảo mã (VS Code):&lt;/strong&gt; Tận dụng tối đa các tính năng gợi ý, tự động hoàn thành và báo lỗi của TypeScript.&lt;/li&gt;</p><p>&lt;/ul&gt;</p>', N'https://res.cloudinary.com/dkuqtn6bp/image/upload/v1749993954/courses/60/thumbnails/nwyuiuba8nnqbatv7u7o.png', N'https://www.youtube.com/watch?v=fPYbNXzXP6M&list=PL4cUxeGkcC9gUgr39Q_yD6v-bSyMwKPUI&index=21', CAST(500000.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), 18, 8, 1, N'en', N'DRAFT', NULL, 1, 60, CAST(N'2025-06-16T13:56:07.1400000' AS DateTime2), CAST(N'2025-06-16T06:56:31.9730000' AS DateTime2), NULL, NULL, 0, NULL, 2, 60, 60, 0, NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[Courses] OFF
GO
INSERT [dbo].[CourseStatuses] ([StatusID], [StatusName], [Description]) VALUES (N'ARCHIVED', N'Đã lưu trữ', N'Khóa học không còn hiển thị công khai nhưng vẫn được lưu trữ')
GO
INSERT [dbo].[CourseStatuses] ([StatusID], [StatusName], [Description]) VALUES (N'DRAFT', N'Bản nháp', N'Khóa học đang được soạn thảo, chưa gửi duyệt')
GO
INSERT [dbo].[CourseStatuses] ([StatusID], [StatusName], [Description]) VALUES (N'PENDING', N'Chờ duyệt', N'Khóa học đã được gửi và đang chờ quản trị viên phê duyệt')
GO
INSERT [dbo].[CourseStatuses] ([StatusID], [StatusName], [Description]) VALUES (N'PUBLISHED', N'Đã xuất bản', N'Khóa học đã được phê duyệt và hiển thị công khai')
GO
INSERT [dbo].[CourseStatuses] ([StatusID], [StatusName], [Description]) VALUES (N'REJECTED', N'Bị từ chối', N'Khóa học bị từ chối phê duyệt')
GO
INSERT [dbo].[CourseStatuses] ([StatusID], [StatusName], [Description]) VALUES (N'SUPERSEDED', N'Đã có phiên bản mới', N'Phiên bản cũ đã được thay thế bởi phiên bản mới hơn. Không còn bán ra, nhưng học viên đã mua vẫn giữ nguyên quyền truy cập và toàn bộ tiến độ.')
GO
INSERT [dbo].[CourseStatuses] ([StatusID], [StatusName], [Description]) VALUES (N'UPDATING', N'Updating', N'A new version of this published course is being drafted for review.')
GO
INSERT [dbo].[Currencies] ([CurrencyID], [CurrencyName], [Type], [DecimalPlaces]) VALUES (N'USD', N'Đô la Mỹ', N'FIAT', 2)
GO
INSERT [dbo].[Currencies] ([CurrencyID], [CurrencyName], [Type], [DecimalPlaces]) VALUES (N'VND', N'Việt Nam Đồng', N'FIAT', 0)
GO
SET IDENTITY_INSERT [dbo].[DiscussionPosts] ON 
GO
INSERT [dbo].[DiscussionPosts] ([PostID], [ThreadID], [ParentPostID], [AccountID], [PostText], [IsInstructorPost], [CreatedAt], [UpdatedAt]) VALUES (15, 8, NULL, 21, N'ccc', 0, CAST(N'2025-06-16T01:50:10.0733333' AS DateTime2), CAST(N'2025-06-16T01:50:10.0733333' AS DateTime2))
GO
INSERT [dbo].[DiscussionPosts] ([PostID], [ThreadID], [ParentPostID], [AccountID], [PostText], [IsInstructorPost], [CreatedAt], [UpdatedAt]) VALUES (18, 10, NULL, 18, N'ko bk phải làm sao', 0, CAST(N'2025-06-16T12:59:18.1966667' AS DateTime2), CAST(N'2025-06-16T12:59:18.1966667' AS DateTime2))
GO
INSERT [dbo].[DiscussionPosts] ([PostID], [ThreadID], [ParentPostID], [AccountID], [PostText], [IsInstructorPost], [CreatedAt], [UpdatedAt]) VALUES (19, 10, 18, 18, N'@Super Admin 3T ok
', 0, CAST(N'2025-06-16T12:59:27.6666667' AS DateTime2), CAST(N'2025-06-16T12:59:27.6666667' AS DateTime2))
GO
SET IDENTITY_INSERT [dbo].[DiscussionPosts] OFF
GO
SET IDENTITY_INSERT [dbo].[DiscussionThreads] ON 
GO
INSERT [dbo].[DiscussionThreads] ([ThreadID], [CourseID], [LessonID], [Title], [CreatedByAccountID], [CreatedAt], [UpdatedAt], [IsClosed], [LastReplierAccountID], [LastReplyAt]) VALUES (7, 48, 181, N'JS ngôn ngữ hiện địa bậc nhất', 18, CAST(N'2025-06-15T14:57:09.9600000' AS DateTime2), CAST(N'2025-06-15T14:57:09.9600000' AS DateTime2), 0, NULL, NULL)
GO
INSERT [dbo].[DiscussionThreads] ([ThreadID], [CourseID], [LessonID], [Title], [CreatedByAccountID], [CreatedAt], [UpdatedAt], [IsClosed], [LastReplierAccountID], [LastReplyAt]) VALUES (8, 48, 181, N'xin chào khó quá', 21, CAST(N'2025-06-16T01:50:09.9933333' AS DateTime2), CAST(N'2025-06-16T01:50:09.9933333' AS DateTime2), 0, NULL, NULL)
GO
INSERT [dbo].[DiscussionThreads] ([ThreadID], [CourseID], [LessonID], [Title], [CreatedByAccountID], [CreatedAt], [UpdatedAt], [IsClosed], [LastReplierAccountID], [LastReplyAt]) VALUES (9, 48, 184, N'js là 1 ngôn ngữ hay', 21, CAST(N'2025-06-16T10:43:37.7000000' AS DateTime2), CAST(N'2025-06-16T10:43:37.7000000' AS DateTime2), 0, NULL, NULL)
GO
INSERT [dbo].[DiscussionThreads] ([ThreadID], [CourseID], [LessonID], [Title], [CreatedByAccountID], [CreatedAt], [UpdatedAt], [IsClosed], [LastReplierAccountID], [LastReplyAt]) VALUES (10, 55, 219, N'js khó quá ae', 18, CAST(N'2025-06-16T12:59:18.0766667' AS DateTime2), CAST(N'2025-06-16T12:59:18.0766667' AS DateTime2), 0, NULL, NULL)
GO
SET IDENTITY_INSERT [dbo].[DiscussionThreads] OFF
GO
SET IDENTITY_INSERT [dbo].[Enrollments] ON 
GO
INSERT [dbo].[Enrollments] ([EnrollmentID], [AccountID], [CourseID], [EnrolledAt], [PurchasePrice], [IsCompleted], [CompletedAt]) VALUES (3, 2, 57, CAST(N'2025-06-15T17:16:39.9133333' AS DateTime2), CAST(1.5300 AS Decimal(18, 4)), 0, NULL)
GO
INSERT [dbo].[Enrollments] ([EnrollmentID], [AccountID], [CourseID], [EnrolledAt], [PurchasePrice], [IsCompleted], [CompletedAt]) VALUES (4, 21, 57, CAST(N'2025-06-15T21:24:09.8033333' AS DateTime2), CAST(40000.0000 AS Decimal(18, 4)), 0, NULL)
GO
INSERT [dbo].[Enrollments] ([EnrollmentID], [AccountID], [CourseID], [EnrolledAt], [PurchasePrice], [IsCompleted], [CompletedAt]) VALUES (5, 21, 60, CAST(N'2025-06-16T01:10:26.7200000' AS DateTime2), CAST(7.6300 AS Decimal(18, 4)), 0, NULL)
GO
INSERT [dbo].[Enrollments] ([EnrollmentID], [AccountID], [CourseID], [EnrolledAt], [PurchasePrice], [IsCompleted], [CompletedAt]) VALUES (6, 21, 48, CAST(N'2025-06-16T01:23:28.7433333' AS DateTime2), CAST(17.2600 AS Decimal(18, 4)), 0, NULL)
GO
INSERT [dbo].[Enrollments] ([EnrollmentID], [AccountID], [CourseID], [EnrolledAt], [PurchasePrice], [IsCompleted], [CompletedAt]) VALUES (7, 2, 60, CAST(N'2025-06-16T10:36:53.7433333' AS DateTime2), CAST(7.6300 AS Decimal(18, 4)), 0, NULL)
GO
INSERT [dbo].[Enrollments] ([EnrollmentID], [AccountID], [CourseID], [EnrolledAt], [PurchasePrice], [IsCompleted], [CompletedAt]) VALUES (8, 19, 60, CAST(N'2025-06-16T12:43:23.1400000' AS DateTime2), CAST(199000.0000 AS Decimal(18, 4)), 0, NULL)
GO
SET IDENTITY_INSERT [dbo].[Enrollments] OFF
GO
SET IDENTITY_INSERT [dbo].[ExchangeRates] ON 
GO
INSERT [dbo].[ExchangeRates] ([RateID], [FromCurrencyID], [ToCurrencyID], [Rate], [EffectiveTimestamp], [Source]) VALUES (1, N'VND', N'USD', CAST(0.000038380000000000 AS Decimal(36, 18)), CAST(N'2025-06-09T21:03:00.5233333' AS DateTime2), N'exchangerate-api.com')
GO
INSERT [dbo].[ExchangeRates] ([RateID], [FromCurrencyID], [ToCurrencyID], [Rate], [EffectiveTimestamp], [Source]) VALUES (3, N'VND', N'USD', CAST(0.000038380000000000 AS Decimal(36, 18)), CAST(N'2025-06-10T21:03:00.5466667' AS DateTime2), N'exchangerate-api.com')
GO
INSERT [dbo].[ExchangeRates] ([RateID], [FromCurrencyID], [ToCurrencyID], [Rate], [EffectiveTimestamp], [Source]) VALUES (4, N'VND', N'USD', CAST(0.000038380000000000 AS Decimal(36, 18)), CAST(N'2025-06-11T00:11:00.9333333' AS DateTime2), N'exchangerate-api.com')
GO
INSERT [dbo].[ExchangeRates] ([RateID], [FromCurrencyID], [ToCurrencyID], [Rate], [EffectiveTimestamp], [Source]) VALUES (5, N'VND', N'USD', CAST(0.000038380000000000 AS Decimal(36, 18)), CAST(N'2025-06-11T00:12:00.6333333' AS DateTime2), N'exchangerate-api.com')
GO
INSERT [dbo].[ExchangeRates] ([RateID], [FromCurrencyID], [ToCurrencyID], [Rate], [EffectiveTimestamp], [Source]) VALUES (6, N'VND', N'USD', CAST(0.000038380000000000 AS Decimal(36, 18)), CAST(N'2025-06-11T00:13:02.8133333' AS DateTime2), N'exchangerate-api.com')
GO
INSERT [dbo].[ExchangeRates] ([RateID], [FromCurrencyID], [ToCurrencyID], [Rate], [EffectiveTimestamp], [Source]) VALUES (7, N'VND', N'USD', CAST(0.000038380000000000 AS Decimal(36, 18)), CAST(N'2025-06-11T00:17:00.6000000' AS DateTime2), N'exchangerate-api.com')
GO
INSERT [dbo].[ExchangeRates] ([RateID], [FromCurrencyID], [ToCurrencyID], [Rate], [EffectiveTimestamp], [Source]) VALUES (8, N'USD', N'VND', CAST(25995.240300000000000000 AS Decimal(36, 18)), CAST(N'2025-06-11T18:20:00.0000000' AS DateTime2), N'exchangerate-api.com')
GO
INSERT [dbo].[ExchangeRates] ([RateID], [FromCurrencyID], [ToCurrencyID], [Rate], [EffectiveTimestamp], [Source]) VALUES (9, N'VND', N'USD', CAST(0.000038460000000000 AS Decimal(36, 18)), CAST(N'2025-06-12T17:17:00.7230000' AS DateTime2), N'exchangerate-api.com')
GO
INSERT [dbo].[ExchangeRates] ([RateID], [FromCurrencyID], [ToCurrencyID], [Rate], [EffectiveTimestamp], [Source]) VALUES (10, N'USD', N'VND', CAST(26001.040041602000000000 AS Decimal(36, 18)), CAST(N'2025-06-12T17:17:00.8250000' AS DateTime2), N'Calculated Inverse')
GO
INSERT [dbo].[ExchangeRates] ([RateID], [FromCurrencyID], [ToCurrencyID], [Rate], [EffectiveTimestamp], [Source]) VALUES (11, N'VND', N'USD', CAST(0.000038410000000000 AS Decimal(36, 18)), CAST(N'2025-06-13T17:17:01.7770000' AS DateTime2), N'exchangerate-api.com')
GO
INSERT [dbo].[ExchangeRates] ([RateID], [FromCurrencyID], [ToCurrencyID], [Rate], [EffectiveTimestamp], [Source]) VALUES (12, N'USD', N'VND', CAST(26034.886748243000000000 AS Decimal(36, 18)), CAST(N'2025-06-13T17:17:01.8560000' AS DateTime2), N'Calculated Inverse')
GO
INSERT [dbo].[ExchangeRates] ([RateID], [FromCurrencyID], [ToCurrencyID], [Rate], [EffectiveTimestamp], [Source]) VALUES (13, N'VND', N'USD', CAST(0.000038340000000000 AS Decimal(36, 18)), CAST(N'2025-06-14T17:17:00.5600000' AS DateTime2), N'exchangerate-api.com')
GO
INSERT [dbo].[ExchangeRates] ([RateID], [FromCurrencyID], [ToCurrencyID], [Rate], [EffectiveTimestamp], [Source]) VALUES (14, N'USD', N'VND', CAST(26082.420448618000000000 AS Decimal(36, 18)), CAST(N'2025-06-14T17:17:00.6570000' AS DateTime2), N'Calculated Inverse')
GO
INSERT [dbo].[ExchangeRates] ([RateID], [FromCurrencyID], [ToCurrencyID], [Rate], [EffectiveTimestamp], [Source]) VALUES (15, N'VND', N'USD', CAST(0.000038350000000000 AS Decimal(36, 18)), CAST(N'2025-06-15T17:17:00.6240000' AS DateTime2), N'exchangerate-api.com')
GO
INSERT [dbo].[ExchangeRates] ([RateID], [FromCurrencyID], [ToCurrencyID], [Rate], [EffectiveTimestamp], [Source]) VALUES (16, N'USD', N'VND', CAST(26075.619295958000000000 AS Decimal(36, 18)), CAST(N'2025-06-15T17:17:00.6870000' AS DateTime2), N'Calculated Inverse')
GO
SET IDENTITY_INSERT [dbo].[ExchangeRates] OFF
GO
SET IDENTITY_INSERT [dbo].[InstructorBalanceTransactions] ON 
GO
INSERT [dbo].[InstructorBalanceTransactions] ([TransactionID], [AccountID], [Type], [Amount], [CurrencyID], [CurrentBalance], [RelatedEntityType], [RelatedEntityID], [Description], [TransactionTimestamp], [PaymentID], [OrderItemID]) VALUES (4, 18, N'CREDIT_SALE', CAST(27934.2723 AS Decimal(18, 4)), N'VND', CAST(27934.2723 AS Decimal(18, 4)), N'OrderItem', 153, N'Doanh thu từ khóa học "Khóa demo cho thanh toán và cái tính năng nhỏ lẻ" (ĐH #153, Item #153)', CAST(N'2025-06-15T17:16:39.8900000' AS DateTime2), 68, NULL)
GO
INSERT [dbo].[InstructorBalanceTransactions] ([TransactionID], [AccountID], [Type], [Amount], [CurrencyID], [CurrentBalance], [RelatedEntityType], [RelatedEntityID], [Description], [TransactionTimestamp], [PaymentID], [OrderItemID]) VALUES (5, 18, N'CREDIT_SALE', CAST(28000.0000 AS Decimal(18, 4)), N'VND', CAST(55934.2723 AS Decimal(18, 4)), N'OrderItem', 168, N'Doanh thu từ khóa học "Khóa demo cho thanh toán và cái tính năng nhỏ lẻ" (ĐH #168, Item #168)', CAST(N'2025-06-15T21:24:09.7800000' AS DateTime2), 79, NULL)
GO
INSERT [dbo].[InstructorBalanceTransactions] ([TransactionID], [AccountID], [Type], [Amount], [CurrencyID], [CurrentBalance], [RelatedEntityType], [RelatedEntityID], [Description], [TransactionTimestamp], [PaymentID], [OrderItemID]) VALUES (6, 18, N'CREDIT_SALE', CAST(139269.8827 AS Decimal(18, 4)), N'VND', CAST(195204.1550 AS Decimal(18, 4)), N'OrderItem', 201, N'Doanh thu từ khóa học "TypeScript Tutorial Step-by-step" (ĐH #201, Item #201)', CAST(N'2025-06-16T01:10:26.6966667' AS DateTime2), 80, NULL)
GO
INSERT [dbo].[InstructorBalanceTransactions] ([TransactionID], [AccountID], [Type], [Amount], [CurrencyID], [CurrentBalance], [RelatedEntityType], [RelatedEntityID], [Description], [TransactionTimestamp], [PaymentID], [OrderItemID]) VALUES (7, 18, N'CREDIT_SALE', CAST(315045.6323 AS Decimal(18, 4)), N'VND', CAST(510249.7873 AS Decimal(18, 4)), N'OrderItem', 204, N'Doanh thu từ khóa học "JavaScript Introduction All tutorial Step-by-step new 2025" (ĐH #204, Item #204)', CAST(N'2025-06-16T01:23:28.6966667' AS DateTime2), 81, NULL)
GO
INSERT [dbo].[InstructorBalanceTransactions] ([TransactionID], [AccountID], [Type], [Amount], [CurrencyID], [CurrentBalance], [RelatedEntityType], [RelatedEntityID], [Description], [TransactionTimestamp], [PaymentID], [OrderItemID]) VALUES (8, 18, N'CREDIT_SALE', CAST(139269.8827 AS Decimal(18, 4)), N'VND', CAST(649519.6700 AS Decimal(18, 4)), N'OrderItem', 208, N'Doanh thu từ khóa học "TypeScript Tutorial Step-by-step" (ĐH #208, Item #208)', CAST(N'2025-06-16T10:36:53.7233333' AS DateTime2), 84, NULL)
GO
INSERT [dbo].[InstructorBalanceTransactions] ([TransactionID], [AccountID], [Type], [Amount], [CurrencyID], [CurrentBalance], [RelatedEntityType], [RelatedEntityID], [Description], [TransactionTimestamp], [PaymentID], [OrderItemID]) VALUES (9, 18, N'DEBIT_WITHDRAWAL', CAST(-100000.0000 AS Decimal(18, 4)), N'VND', CAST(549519.6700 AS Decimal(18, 4)), N'Payout', 2, N'Chi trả thành công cho Payout #2', CAST(N'2025-06-16T11:05:07.6733333' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[InstructorBalanceTransactions] ([TransactionID], [AccountID], [Type], [Amount], [CurrencyID], [CurrentBalance], [RelatedEntityType], [RelatedEntityID], [Description], [TransactionTimestamp], [PaymentID], [OrderItemID]) VALUES (10, 18, N'CREDIT_SALE', CAST(139300.0000 AS Decimal(18, 4)), N'VND', CAST(688819.6700 AS Decimal(18, 4)), N'OrderItem', 211, N'Doanh thu từ khóa học "TypeScript Tutorial Step-by-stepp" (ĐH #211, Item #211)', CAST(N'2025-06-16T12:43:23.1100000' AS DateTime2), 87, NULL)
GO
SET IDENTITY_INSERT [dbo].[InstructorBalanceTransactions] OFF
GO
SET IDENTITY_INSERT [dbo].[InstructorPayoutMethods] ON 
GO
INSERT [dbo].[InstructorPayoutMethods] ([PayoutMethodID], [AccountID], [MethodID], [Details], [IsPrimary], [Status], [CreatedAt], [UpdatedAt]) VALUES (1, 18, N'MOMO', N'{"phoneNumber":"0399038165","accountName":"Trần Nguyễn Sơn Thành"}', 0, N'ACTIVE', CAST(N'2025-06-12T14:12:25.5500000' AS DateTime2), CAST(N'2025-06-12T14:12:25.5500000' AS DateTime2))
GO
INSERT [dbo].[InstructorPayoutMethods] ([PayoutMethodID], [AccountID], [MethodID], [Details], [IsPrimary], [Status], [CreatedAt], [UpdatedAt]) VALUES (2, 18, N'PAYPAL', N'{"email":"sonthanh12345678910@gmail.com"}', 0, N'ACTIVE', CAST(N'2025-06-12T14:25:59.8966667' AS DateTime2), CAST(N'2025-06-12T14:25:59.8966667' AS DateTime2))
GO
INSERT [dbo].[InstructorPayoutMethods] ([PayoutMethodID], [AccountID], [MethodID], [Details], [IsPrimary], [Status], [CreatedAt], [UpdatedAt]) VALUES (4, 18, N'STRIPE', N'{"accountId":"acct_dgeegege"}', 1, N'ACTIVE', CAST(N'2025-06-12T14:33:24.5300000' AS DateTime2), CAST(N'2025-06-12T14:33:24.5300000' AS DateTime2))
GO
SET IDENTITY_INSERT [dbo].[InstructorPayoutMethods] OFF
GO
INSERT [dbo].[InstructorProfiles] ([AccountID], [ProfessionalTitle], [Bio], [AboutMe], [LastBalanceUpdate], [CreatedAt], [UpdatedAt]) VALUES (15, N'Senior Java Backend Developer | Microservices & Scalable Systems Specialist', N'fbdxcfxfxb', NULL, NULL, CAST(N'2025-05-03T01:35:30.5533333' AS DateTime2), CAST(N'2025-05-02T18:35:30.5670000' AS DateTime2))
GO
SET IDENTITY_INSERT [dbo].[InstructorSkills] ON 
GO
INSERT [dbo].[InstructorSkills] ([InstructorSkillID], [AccountID], [SkillID]) VALUES (1, 15, 18)
GO
INSERT [dbo].[InstructorSkills] ([InstructorSkillID], [AccountID], [SkillID]) VALUES (3, 15, 23)
GO
INSERT [dbo].[InstructorSkills] ([InstructorSkillID], [AccountID], [SkillID]) VALUES (2, 15, 24)
GO
SET IDENTITY_INSERT [dbo].[InstructorSkills] OFF
GO
SET IDENTITY_INSERT [dbo].[InstructorSocialLinks] ON 
GO
INSERT [dbo].[InstructorSocialLinks] ([SocialLinkID], [AccountID], [Platform], [Url]) VALUES (1, 15, N'YOUTUBE', N'https://www.youtube.com/watch?v=jpPa1-EOxcc&list=RDPcRfuPmk7eQ&index=8')
GO
SET IDENTITY_INSERT [dbo].[InstructorSocialLinks] OFF
GO
INSERT [dbo].[Languages] ([LanguageCode], [LanguageName], [NativeName], [IsActive], [DisplayOrder], [CreatedAt], [UpdatedAt]) VALUES (N'en', N'English', N'English', 1, 2, CAST(N'2025-05-09T12:39:54.5500000' AS DateTime2), CAST(N'2025-05-09T12:39:54.5500000' AS DateTime2))
GO
INSERT [dbo].[Languages] ([LanguageCode], [LanguageName], [NativeName], [IsActive], [DisplayOrder], [CreatedAt], [UpdatedAt]) VALUES (N'vi', N'Tiếng Việt', N'Tiếng Việt', 1, 1, CAST(N'2025-05-09T12:39:54.5500000' AS DateTime2), CAST(N'2025-05-09T12:39:54.5500000' AS DateTime2))
GO
SET IDENTITY_INSERT [dbo].[LessonAttachments] ON 
GO
INSERT [dbo].[LessonAttachments] ([AttachmentID], [LessonID], [FileName], [FileURL], [FileType], [FileSize], [CloudStorageID], [UploadedAt]) VALUES (87, 270, N'maxresdefault.jpg', N'https://res.cloudinary.com/dkuqtn6bp/raw/upload/v1749992257/courses/60/lessons/270/attachments/zapakwmfgr71fujn9ob6', N'image/jpeg', 47800, N'courses/60/lessons/270/attachments/zapakwmfgr71fujn9ob6', CAST(N'2025-06-16T11:02:01.1900000' AS DateTime2))
GO
INSERT [dbo].[LessonAttachments] ([AttachmentID], [LessonID], [FileName], [FileURL], [FileType], [FileSize], [CloudStorageID], [UploadedAt]) VALUES (89, 301, N'maxresdefault.jpg', N'https://res.cloudinary.com/dkuqtn6bp/raw/upload/v1749992257/courses/60/lessons/270/attachments/zapakwmfgr71fujn9ob6', N'image/jpeg', 47800, N'courses/60/lessons/270/attachments/zapakwmfgr71fujn9ob6', CAST(N'2025-06-16T13:56:07.3600000' AS DateTime2))
GO
SET IDENTITY_INSERT [dbo].[LessonAttachments] OFF
GO
SET IDENTITY_INSERT [dbo].[LessonProgress] ON 
GO
INSERT [dbo].[LessonProgress] ([ProgressID], [AccountID], [LessonID], [IsCompleted], [CompletedAt], [LastWatchedPosition], [LastWatchedAt], [TotalTimeSpent]) VALUES (13, 18, 219, 1, CAST(N'2025-06-15T13:45:44.7100000' AS DateTime2), NULL, CAST(N'2025-06-15T13:45:44.7100000' AS DateTime2), 399)
GO
INSERT [dbo].[LessonProgress] ([ProgressID], [AccountID], [LessonID], [IsCompleted], [CompletedAt], [LastWatchedPosition], [LastWatchedAt], [TotalTimeSpent]) VALUES (14, 18, 239, 1, CAST(N'2025-06-15T13:49:50.5660000' AS DateTime2), NULL, CAST(N'2025-06-15T13:49:50.5660000' AS DateTime2), 0)
GO
INSERT [dbo].[LessonProgress] ([ProgressID], [AccountID], [LessonID], [IsCompleted], [CompletedAt], [LastWatchedPosition], [LastWatchedAt], [TotalTimeSpent]) VALUES (15, 21, 239, 1, CAST(N'2025-06-15T14:24:31.8560000' AS DateTime2), NULL, CAST(N'2025-06-15T14:24:31.8560000' AS DateTime2), 0)
GO
INSERT [dbo].[LessonProgress] ([ProgressID], [AccountID], [LessonID], [IsCompleted], [CompletedAt], [LastWatchedPosition], [LastWatchedAt], [TotalTimeSpent]) VALUES (16, 21, 261, 1, CAST(N'2025-06-15T18:47:26.9590000' AS DateTime2), 0, CAST(N'2025-06-15T18:47:46.8050000' AS DateTime2), 0)
GO
INSERT [dbo].[LessonProgress] ([ProgressID], [AccountID], [LessonID], [IsCompleted], [CompletedAt], [LastWatchedPosition], [LastWatchedAt], [TotalTimeSpent]) VALUES (17, 21, 183, 1, CAST(N'2025-06-15T18:48:10.4990000' AS DateTime2), NULL, CAST(N'2025-06-15T18:48:10.4990000' AS DateTime2), 0)
GO
INSERT [dbo].[LessonProgress] ([ProgressID], [AccountID], [LessonID], [IsCompleted], [CompletedAt], [LastWatchedPosition], [LastWatchedAt], [TotalTimeSpent]) VALUES (18, 19, 260, 1, CAST(N'2025-06-16T05:44:11.9550000' AS DateTime2), 0, CAST(N'2025-06-16T05:46:42.9610000' AS DateTime2), 0)
GO
INSERT [dbo].[LessonProgress] ([ProgressID], [AccountID], [LessonID], [IsCompleted], [CompletedAt], [LastWatchedPosition], [LastWatchedAt], [TotalTimeSpent]) VALUES (19, 19, 261, 0, NULL, 0, CAST(N'2025-06-16T05:51:11.0140000' AS DateTime2), 0)
GO
SET IDENTITY_INSERT [dbo].[LessonProgress] OFF
GO
SET IDENTITY_INSERT [dbo].[Lessons] ON 
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (181, 52, N'1 JavaScript Introduction', N'', 0, N'VIDEO', N'zBPeGR48_vE', NULL, NULL, NULL, 1, NULL, CAST(N'2025-06-14T19:06:19.0300000' AS DateTime2), CAST(N'2025-06-14T12:20:03.9980000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (182, 52, N'2 Development Environment Setting', N'', 1, N'VIDEO', N'sEGC-adSKXo', NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-14T19:20:24.2333333' AS DateTime2), CAST(N'2025-06-14T12:22:29.1960000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (183, 52, N'📚 Quiz – Section 1: Getting Started with JavaScript', N'', 2, N'QUIZ', NULL, NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-14T19:37:45.8933333' AS DateTime2), CAST(N'2025-06-14T12:44:53.6640000' AS DateTime2), NULL, 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (184, 52, N'Getting Started with JavaScript Knowledge', N'', 3, N'TEXT', NULL, NULL, NULL, N'<h2>🟦 1. JavaScript là gì?</h2><h3>🧠 Định nghĩa:</h3><p>JavaScript (JS) là <strong>ngôn ngữ lập trình</strong> dùng chủ yếu để tạo ra <strong>sự tương tác động (dynamic)</strong> trên website.</p><ul><li><p>Giúp web không chỉ là “hình ảnh tĩnh” mà <strong>biết phản hồi người dùng</strong>, như:</p><ul><li><p>Nhấn nút hiện popup</p></li><li><p>Kiểm tra form trước khi gửi</p></li><li><p>Animation</p></li><li><p>Lấy dữ liệu từ server mà không cần reload (AJAX)</p></li></ul></li></ul><h3>⚙️ JavaScript hoạt động ở đâu?</h3><ul><li><p><strong>Client-side (phía trình duyệt)</strong>: dùng để xử lý UI, hiệu ứng, event...</p></li><li><p><strong>Server-side (phía backend)</strong>: nhờ vào <strong>Node.js</strong>, JS cũng xử lý được API, database, web server.</p></li></ul><p>📌 <strong>Kết luận</strong>: JavaScript là <strong>“ngôn ngữ của web”</strong>, cực kỳ phổ biến. Mở trình duyệt nào cũng support nó.</p><hr><h2>🟦 2. Lịch sử &amp; vai trò của JS trong web</h2><p>Giai đoạnÝ nghĩa1995Netscape tạo ra JavaScript để xử lý tương tác đơn giản2000sAJAX ra đời → website trở nên “ứng dụng hóa” (Gmail, Facebook)2010sNode.js ra đời → JS trở thành <strong>fullstack language</strong>Hiện nayReact, Angular, Vue, Next.js, v.v. → dùng JS cho cả client &amp; server</p><p>✅ Dùng JS → m làm được mọi thứ: frontend, backend, mobile app, game, AI prototype luôn nếu muốn.</p><hr><h2>🟨 3. Cách chạy JavaScript cơ bản</h2><h3>➕ Cách nhúng JS vào trang HTML</h3><pre><code>html</code></pre><p>Copy code</p><p><code>&lt;!DOCTYPE html&gt; &lt;html&gt;   &lt;head&gt;     &lt;title&gt;My First JS Page&lt;/title&gt;     &lt;script&gt;       alert("Hello world!");     &lt;/script&gt;   &lt;/head&gt;   &lt;body&gt;     &lt;h1&gt;Xin chào!&lt;/h1&gt;   &lt;/body&gt; &lt;/html&gt; </code></p><blockquote><p>👉 Mở bằng trình duyệt → sẽ hiện pop-up alert.</p></blockquote><hr><h2>🟩 4. Cài đặt môi trường phát triển JavaScript</h2><h3>✅ Những thứ cần cài:</h3><p>Công cụChức năng<strong>Visual Studio Code (VS Code)</strong>Viết code JS, có plugin, highlight đẹp<strong>Live Server</strong>Reload web ngay khi lưu file<strong>Trình duyệt (Chrome)</strong>Chạy, debug JavaScript</p><hr><h2>🔧 5. Bật DevTools để debug</h2><h3>Mở DevTools:</h3><ul><li><p>Trên Chrome: Nhấn <code>F12</code> hoặc <code>Ctrl + Shift + I</code></p></li><li><p>Vào tab <strong>Console</strong> → m có thể thử lệnh JavaScript ngay:</p></li></ul><pre><code>js</code></pre><p>Copy code</p><p><code>console.log("Xin chào JavaScript!"); </code></p><h3>➕ Ví dụ:</h3><pre><code>js</code></pre><p>Copy code</p><p><code>let name = "Sơn đẹp trai"; console.log("Tên tui là:", name); </code></p><hr><h2>🟦 6. File <code>.js</code> riêng biệt</h2><p>Để sạch code hơn, m có thể tạo file <code>.js</code> riêng:</p><p><strong>index.html:</strong></p><pre><code>html</code></pre><p>Copy code</p><p><code>&lt;!DOCTYPE html&gt; &lt;html&gt;   &lt;head&gt;     &lt;script src="script.js"&gt;&lt;/script&gt;   &lt;/head&gt;   &lt;body&gt;     &lt;h1&gt;Hello JS!&lt;/h1&gt;   &lt;/body&gt; &lt;/html&gt; </code></p><p><strong>script.js:</strong></p><pre><code>js</code></pre><p>Copy code</p><p><code>console.log("JS đang chạy từ file ngoài!"); </code></p><blockquote><p>Khi mở <code>index.html</code>, trình duyệt sẽ tải và thực thi file <code>script.js</code>.</p></blockquote><hr><h2>🧠 Ghi nhớ:</h2><p>Kiến thứcÝ nghĩaJavaScript là gì?Ngôn ngữ lập trình chạy trên webDùng để làm gì?Tạo web tương tác: bấm nút, xử lý dữ liệu, <a target="_blank" rel="noopener noreferrer nofollow" href="http://v.v.Ch">v.v.Ch</a>ạy bằng gì?Trình duyệt hoặc Node.jsDevTools dùng làm gì?Debug, test nhanh lệnh JSCần cài gì?VS Code, Live Server, trình duyệt Chrome</p><hr><h2>✅ Mini Practice</h2><pre><code>js</code></pre><p>Copy code</p><p><code>// Viết dòng chào tên của bạn let yourName = "Thành Sơn"; console.log("Xin chào", yourName); </code></p><hr><h2>📝 Tóm tắt:</h2><ul><li><p>JavaScript là <strong>ngôn ngữ bắt buộc phải học</strong> nếu m làm web.</p></li><li><p>Nó vừa dễ bắt đầu, vừa có chiều sâu.</p></li><li><p>Học từ cách chạy JS cơ bản → syntax → biến → hàm → mảng → DOM → async → framework.</p></li></ul>', 0, NULL, CAST(N'2025-06-14T19:48:06.4533333' AS DateTime2), CAST(N'2025-06-14T19:48:06.4533333' AS DateTime2), NULL, 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (185, 53, N'3 Basic JavaScript Syntax', N'', 0, N'VIDEO', N'KXxXr0RxGDE', NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-14T20:04:38.6733333' AS DateTime2), CAST(N'2025-06-14T13:08:29.1460000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (186, 53, N'4 JavaScript Variables', N'', 1, N'VIDEO', N'plOo5hNVQJU', NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-14T20:05:00.2200000' AS DateTime2), CAST(N'2025-06-14T13:11:43.8940000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (187, 53, N'5 JavaScript Data Types', N'', 2, N'VIDEO', N'yjE_xXL26qA', NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-14T20:05:06.4400000' AS DateTime2), CAST(N'2025-06-14T13:13:00.0260000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (188, 54, N'6 JavaScript Type Conversion', N'', 0, N'VIDEO', N'jfQyMPzPTjY', NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-14T20:05:15.2666667' AS DateTime2), CAST(N'2025-06-14T13:14:22.7030000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (189, 54, N'7 Expressions and Operators', N'', 1, N'VIDEO', N'nMQlXMHMz_Y', NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-14T20:05:19.5600000' AS DateTime2), CAST(N'2025-06-14T13:15:10.7420000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (190, 55, N'8 JavaScript Arrays', N'', 0, N'VIDEO', NULL, NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-14T20:05:26.5500000' AS DateTime2), CAST(N'2025-06-14T20:05:26.5500000' AS DateTime2), N'CLOUDINARY', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (191, 56, N'9 Function Declaration', N'', 0, N'VIDEO', N'yPJCFWLd23o', NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-14T20:05:35.6233333' AS DateTime2), CAST(N'2025-06-14T13:16:48.5990000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (192, 56, N'10 JavaScript Function Expressions', N'', 1, N'VIDEO', N'Wggcy2oKV3E', NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-14T20:05:40.1933333' AS DateTime2), CAST(N'2025-06-14T13:17:22.3560000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (193, 53, N'JavaScript Basics – Quiz (Section 2)', N'', 3, N'QUIZ', NULL, NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-14T20:18:54.8500000' AS DateTime2), CAST(N'2025-06-14T13:21:28.2940000' AS DateTime2), NULL, 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (194, 53, N'JavaScript Basics Knowledge', N'', 4, N'TEXT', NULL, NULL, NULL, N'<h1>📘 <strong>Section 2: JavaScript Basics</strong></h1><hr><h2>🟦 1. JavaScript Syntax</h2><p>JavaScript syntax is the set of rules that define how JS programs are written and understood by the JavaScript engine.</p><h3>✅ Basic syntax elements:</h3><ul><li><p><strong>Statements end with </strong><code>;</code><strong> (semicolon)</strong> – optional but recommended.</p></li><li><p><strong>Case-sensitive:</strong> <code>name</code> ≠ <code>Name</code>.</p></li><li><p><strong>Blocks:</strong> <code>{}</code> groups multiple statements together (used in functions, ifs, loops...).</p></li></ul><pre><code>js</code></pre><p>Copy code</p><p><code>let name = "Sơn"; console.log("Hello " + name); </code></p><hr><h2>🟦 2. Variables</h2><p>Variables store data values that your program can use and change.</p><h3>✅ How to declare variables:</h3><pre><code>js</code></pre><p>Copy code</p><p><code>let x = 5; const y = 10; var z = 15; </code></p><p>KeywordReassignable?ScopeNotes<code>let</code>✅ YesBlockModern, preferred<code>const</code>❌ NoBlockFor constants<code>var</code>✅ YesFunctionOld-style, avoid using</p><hr><h2>🟦 3. Data Types</h2><p>JavaScript has <strong>dynamic typing</strong>, so variables can hold different types of values.</p><h3>✅ Primitive Types:</h3><ul><li><p><code>string</code> – text: <code>"hello"</code></p></li><li><p><code>number</code> – numeric: <code>42</code>, <code>3.14</code></p></li><li><p><code>boolean</code> – <code>true</code> or <code>false</code></p></li><li><p><code>undefined</code> – declared but not assigned</p></li><li><p><code>null</code> – explicitly nothing</p></li><li><p><code>symbol</code> – unique values (advanced)</p></li><li><p><code>bigint</code> – very large numbers</p></li></ul><h3>✅ Complex Types:</h3><ul><li><p><code>object</code> – used for structured data (arrays, functions, custom objects)</p></li></ul><pre><code>js</code></pre><p>Copy code</p><p><code>let name = "John";         // string let age = 25;              // number let isStudent = true;      // boolean let hobbies = ["music"];   // object (array) </code></p><hr><h2>🟦 4. Type Conversion (Coercion)</h2><p>JS converts between types automatically when needed (called coercion).</p><pre><code>js</code></pre><p>Copy code</p><p><code>let result = 5 + "5";  // → "55" (string) let num = "10" * 2;    // → 20 (number) </code></p><blockquote><p>Use <code>==</code> for loose comparison (type-converting), <code>===</code> for strict (no type conversion).</p></blockquote><hr><h2>🟦 5. Operators</h2><h3>✅ Arithmetic Operators:</h3><pre><code>js</code></pre><p>Copy code</p><p><code>+  // addition -  // subtraction *  // multiplication /  // division %  // modulo (remainder) ** // exponentiation </code></p><h3>✅ Comparison Operators:</h3><pre><code>js</code></pre><p>Copy code</p><p><code>==   // equal (with coercion) ===  // equal (strict) !=   // not equal !==  // not equal (strict) &gt;    // greater than &lt;    // less than </code></p><h3>✅ Logical Operators:</h3><pre><code>js</code></pre><p>Copy code</p><p><code>&amp;&amp;  // AND ||  // OR !   // NOT </code></p><hr><h2>🟦 6. Expressions vs Statements</h2><ul><li><p><strong>Expression</strong> → produces a value:</p></li></ul><pre><code>js</code></pre><p>Copy code</p><p><code>2 + 3     // → 5 x &gt; 5     // → true or false </code></p><ul><li><p><strong>Statement</strong> → performs an action:</p></li></ul><pre><code>js</code></pre><p>Copy code</p><p><code>let x = 10; if (x &gt; 5) { console.log("Big!"); } </code></p><hr><h2>🧠 Common Mistakes to Avoid:</h2><p>MistakeWhy it’s wrongUsing <code>var</code> instead of <code>let</code> or <code>constvar</code> has weird scoping behaviorComparing with <code>==</code> carelesslyMay cause bugs due to type coercionForgetting semicolonsCan lead to automatic semicolon insertion bugsThinking JS has <code>int</code>, <code>float</code>All numbers are just <code>number</code> type</p><hr><h2>✅ Practice Examples</h2><pre><code>js</code></pre><p>Copy code</p><p><code>let score = 85; let passed = score &gt;= 50; console.log("Passed?", passed);  // → true </code></p><pre><code>js</code></pre><p>Copy code</p><p><code>const pi = 3.1415; let radius = 5; let area = pi * radius * radius; console.log("Area:", area); // → 78.5375 </code></p><hr><h2>📝 Summary</h2><p>ConceptKey IdeaVariableUse <code>let</code> or <code>const</code>Data Typesstring, number, boolean, object, etc.Operators+, -, ==, ===, &amp;&amp;,CoercionJS automatically changes types in some casesExpressionReturns a valueStatementDoes something</p>', 0, NULL, CAST(N'2025-06-14T20:22:52.6900000' AS DateTime2), CAST(N'2025-06-14T20:22:52.6900000' AS DateTime2), NULL, 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (195, 54, N'Working with Data – Quiz', N'', 2, N'QUIZ', NULL, NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-14T20:23:28.5766667' AS DateTime2), CAST(N'2025-06-14T13:28:16.9500000' AS DateTime2), NULL, 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (196, 54, N'Working with Data Knowledge', N'', 3, N'TEXT', NULL, NULL, NULL, N'<h1>📘 <strong>Section 3: Working with Data</strong></h1><hr><h2>🟦 1. Arrays in JavaScript</h2><p>An <strong>array</strong> is a special type of object used to store <strong>ordered collections</strong> of values.</p><pre><code>js</code></pre><p>Copy code</p><p><code>let fruits = ["apple", "banana", "cherry"]; </code></p><h3>✅ Key Characteristics:</h3><ul><li><p>Indexed: <code>fruits[0]</code> → <code>"apple"</code></p></li><li><p>Dynamic: Can grow/shrink</p></li><li><p>Can hold <strong>any type</strong>: numbers, strings, objects, arrays...</p></li></ul><h3>✅ Common Array Methods:</h3><p>MethodDescriptionExample<code>push()</code>Add to end<code>arr.push("grape")pop()</code>Remove from end<code>arr.pop()unshift()</code>Add to start<code>arr.unshift("kiwi")shift()</code>Remove from start<code>arr.shift()map()</code>Transform elements<code>arr.map(x =&gt; x * 2)filter()</code>Filter based on condition<code>arr.filter(x =&gt; x &gt; 10)forEach()</code>Loop over each element<code>arr.forEach(x =&gt; console.log(x))includes()</code>Check existence<code>arr.includes("banana")indexOf()</code>Find index<code>arr.indexOf("apple")</code></p><h3>🔄 Spread Operator:</h3><p>Used to copy or merge arrays:</p><pre><code>js</code></pre><p>Copy code</p><p><code>let nums = [1, 2, 3]; let copy = [...nums]; // copy of nums </code></p><hr><h2>🟦 2. Objects in JavaScript</h2><p>An <strong>object</strong> stores data as <strong>key-value pairs</strong>. It’s perfect for representing real-world entities.</p><pre><code>js</code></pre><p>Copy code</p><p><code>let user = {   name: "Alice",   age: 25,   isStudent: true }; </code></p><h3>✅ Accessing Object Properties:</h3><pre><code>js</code></pre><p>Copy code</p><p><code>console.log(user.name);       // "Alice" (dot notation) console.log(user["age"]);     // 25 (bracket notation) </code></p><h3>✅ Updating &amp; Adding:</h3><pre><code>js</code></pre><p>Copy code</p><p><code>user.age = 26; user.email = "alice@example.com"; </code></p><h3>✅ Deleting a Property:</h3><pre><code>js</code></pre><p>Copy code</p><p><code>delete user.isStudent; </code></p><h3>✅ Looping through an Object:</h3><pre><code>js</code></pre><p>Copy code</p><p><code>for (let key in user) {   console.log${key}: ${user[key]}); } </code></p><hr><h2>🟦 3. Nested Arrays &amp; Objects</h2><p>You can nest arrays inside objects, or objects inside arrays.</p><pre><code>js</code></pre><p>Copy code</p><p><code>let users = [   { name: "John", age: 22 },   { name: "Jane", age: 30 } ];  console.log(users[1].name); // "Jane" </code></p><hr><h2>🟦 4. Array vs Object – When to Use What?</h2><p>Use CaseUse...Ordered list of items<strong>Array</strong>Key-value data (e.g. user info)<strong>Object</strong>Dynamic, indexed access<strong>Array</strong>Named properties<strong>Object</strong></p><hr><h2>🟦 5. Destructuring</h2><p>Destructuring allows you to unpack values from arrays or properties from objects.</p><h3>✅ Array Destructuring:</h3><pre><code>js</code></pre><p>Copy code</p><p><code>let [a, b] = [1, 2]; console.log(a); // 1 </code></p><h3>✅ Object Destructuring:</h3><pre><code>js</code></pre><p>Copy code</p><p><code>let { name, age } = user; console.log(name); // "Alice" </code></p><hr><h2>🟦 6. JSON (JavaScript Object Notation)</h2><ul><li><p>JSON is a format for sending data</p></li><li><p>JS objects can be <strong>converted to/from JSON</strong></p></li></ul><pre><code>js</code></pre><p>Copy code</p><p><code>let jsonString = JSON.stringify(user); let backToObject = JSON.parse(jsonString); </code></p><hr><h2>🧠 Common Mistakes:</h2><p>MistakeWhy it''s wrongUsing <code>arr[1] = 5</code> on an objectOnly valid for arraysUsing <code>map()</code> without <code>return</code>Returns <code>undefined</code>Forgetting to clone arrays before modifyingYou end up modifying the originalConfusing <code>=</code> with <code>==</code> or <code>===</code>One is assignment, the others are comparison</p><hr><h2>✅ Real Example</h2><pre><code>js</code></pre><p>Copy code</p><p><code>let products = [   { name: "Laptop", price: 1200 },   { name: "Phone", price: 800 },   { name: "Tablet", price: 400 } ];  // Get products under $1000 let affordable = products.filter(p =&gt; p.price &lt; 1000); console.log(affordable);  </code></p><hr><h2>📝 Summary</h2><p>TopicKey ConceptsArraysOrdered collections, indexedObjectsKey-value pairs, structured dataMethods<code>map()</code>, <code>filter()</code>, <code>forEach()</code>DestructuringEasier access to array/object valuesJSONUsed for data exchangeLooping<code>for</code>, <code>for...of</code>, <code>for...in</code></p>', 0, NULL, CAST(N'2025-06-14T20:29:16.9733333' AS DateTime2), CAST(N'2025-06-14T20:29:16.9733333' AS DateTime2), NULL, 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (197, 55, N'Arrays & Data Structures Knowledge', N'', 1, N'TEXT', NULL, NULL, NULL, N'<h2>🟦 1. Arrays – Core Data Structure</h2><p>An <strong>array</strong> is a linear, indexed collection used to store ordered elements.</p><pre><code>js</code></pre><p>Copy code</p><p><code>let fruits = ["apple", "banana", "cherry"]; </code></p><h3>✅ Characteristics:</h3><ul><li><p><strong>Zero-based indexing</strong>: <code>fruits[0]</code> → "apple"</p></li><li><p><strong>Dynamic size</strong>: You can add/remove elements anytime</p></li><li><p>Can store <strong>mixed types</strong>: <code>[1, "a", true]</code></p></li></ul><h3>🔧 Common Operations:</h3><p>MethodDescription<code>push()</code>Add to end<code>pop()</code>Remove from end<code>unshift()</code>Add to start<code>shift()</code>Remove from start<code>splice()</code>Add/remove at specific index<code>slice()</code>Copy a portion<code>map()</code>Transform array<code>filter()</code>Filter based on condition<code>reduce()</code>Accumulate a single result<code>includes()</code>Check if value exists<code>indexOf()</code>Find index of value<code>forEach()</code>Loop over each element</p><hr><h2>🟦 2. Stack – Last In First Out (LIFO)</h2><p>A <strong>stack</strong> is a data structure where the <strong>last item added is the first to be removed</strong>.</p><h3>✅ JavaScript Stack using Array:</h3><pre><code>js</code></pre><p>Copy code</p><p><code>let stack = []; stack.push(1);  // Add stack.push(2); let item = stack.pop();  // Remove → 2 </code></p><h3>🔁 Real World Example:</h3><ul><li><p>Browser history</p></li><li><p>Undo/Redo system</p></li></ul><hr><h2>🟦 3. Queue – First In First Out (FIFO)</h2><p>A <strong>queue</strong> is where the <strong>first item added is the first to be removed</strong>.</p><h3>✅ JavaScript Queue using Array:</h3><pre><code>js</code></pre><p>Copy code</p><p><code>let queue = []; queue.push(1);     // Enqueue queue.push(2); let item = queue.shift();  // Dequeue → 1 </code></p><h3>🔁 Real World Example:</h3><ul><li><p>Print jobs</p></li><li><p>Task processing in servers</p></li></ul><hr><h2>🟦 4. Set – Unique Value Storage</h2><p>A <strong>Set</strong> is a collection of values where <strong>duplicates are not allowed</strong>.</p><pre><code>js</code></pre><p>Copy code</p><p><code>let s = new Set(); s.add(1); s.add(2); s.add(1);  // duplicate, ignored console.log(s);  // Set(2) {1, 2} </code></p><h3>🔧 Use Cases:</h3><ul><li><p>Remove duplicates from an array:</p></li></ul><pre><code>js</code></pre><p>Copy code</p><p><code>let arr = [1, 2, 2, 3]; let unique = [...new Set(arr)];  // [1, 2, 3] </code></p><hr><h2>🟦 5. Map – Advanced Key-Value Store</h2><p>A <strong>Map</strong> is a collection of key-value pairs where <strong>keys can be of any type</strong> (not just strings like in objects).</p><pre><code>js</code></pre><p>Copy code</p><p><code>let map = new Map(); map.set("name", "John"); map.set(1, "One"); console.log(map.get("name"));  // John </code></p><h3>✅ Benefits over Object:</h3><p>Feature<code>ObjectMap</code>Key TypesOnly strings/symbolsAny type (number, object, etc)Order of KeysNot guaranteedPreserved insertion orderPerformance (big data)SlowerFaster for frequent insert/delete</p><hr><h2>🟦 6. Destructuring Arrays &amp; Objects</h2><h3>✅ Array Destructuring:</h3><pre><code>js</code></pre><p>Copy code</p><p><code>let [a, b] = [10, 20]; console.log(a); // 10 </code></p><h3>✅ Object Destructuring:</h3><pre><code>js</code></pre><p>Copy code</p><p><code>let user = { name: "Alice", age: 25 }; let { name, age } = user; </code></p><hr><h2>🟦 7. JSON &amp; Data Conversion</h2><h3>✅ Object to JSON:</h3><pre><code>js</code></pre><p>Copy code</p><p><code>let json = JSON.stringify({ a: 1 });  // ''{"a":1}'' </code></p><h3>✅ JSON to Object:</h3><pre><code>js</code></pre><p>Copy code</p><p><code>let obj = JSON.parse(''{"a":1}'');  // { a: 1 } </code></p><p>Used for:</p><ul><li><p>APIs</p></li><li><p>Config files</p></li><li><p>Data storage/transfer</p></li></ul><hr><h2>🔍 Summary Table</h2><p>StructureAccessAddRemoveUniquenessOrderedUse CaseArrayO(1)✅✅❌✅Lists, Queues, StacksStackO(1)✅✅❌✅Undo, HistoryQueueO(n)✅✅❌✅Scheduling, MessagingSetO(1)✅✅✅✅Unique elements, FilteringMapO(1)✅✅N/A✅Key-value store, Caching</p><hr><h2>🧠 Pro Tip:</h2><p>When in doubt:</p><ul><li><p>Need uniqueness? → Use <code>Set</code></p></li><li><p>Need key-value store with any type of key? → Use <code>Map</code></p></li><li><p>Need just indexed list of stuff? → Use <code>Array</code></p></li><li><p>Need fast history-like behavior? → Use <code>Stack</code> or <code>Queue</code></p></li></ul>', 0, NULL, CAST(N'2025-06-14T20:30:47.9866667' AS DateTime2), CAST(N'2025-06-14T13:31:06.7750000' AS DateTime2), NULL, 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (219, 63, N'Node.js Tutorial - 1 - Introduction', N'', 0, N'VIDEO', N'courses/55/lessons/219/videos_private/hpxnaewl3xwdy1q7eqdo', NULL, 399, NULL, 0, NULL, CAST(N'2025-06-15T01:21:36.2333333' AS DateTime2), CAST(N'2025-06-14T19:11:14.8920000' AS DateTime2), N'CLOUDINARY', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (220, 63, N'Node.js Tutorial - 2 - ECMAScript', N'', 1, N'VIDEO', N'courses/55/lessons/220/videos_private/qotxidfd2u2jatatpcdj', NULL, 325, NULL, 0, NULL, CAST(N'2025-06-15T01:21:45.1233333' AS DateTime2), CAST(N'2025-06-14T19:11:14.9420000' AS DateTime2), N'CLOUDINARY', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (221, 63, N'Node.js Tutorial - 3 - Chrome''s V8 Engine', N'', 2, N'VIDEO', N'courses/55/lessons/221/videos_private/kqxp6yggdisjnaym6yxb', NULL, 333, NULL, 0, NULL, CAST(N'2025-06-15T01:21:53.9300000' AS DateTime2), CAST(N'2025-06-14T19:11:14.9680000' AS DateTime2), N'CLOUDINARY', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (222, 63, N'Node.js Tutorial - 4 - JavaScript Runtime', N'', 3, N'VIDEO', N'courses/55/lessons/222/videos_private/aatj8yrzj9dvrhexy5lm', NULL, 188, NULL, 0, NULL, CAST(N'2025-06-15T01:21:58.9000000' AS DateTime2), CAST(N'2025-06-14T19:11:14.9940000' AS DateTime2), N'CLOUDINARY', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (223, 63, N'Node.js Tutorial - 5 - What is Node.js', N'', 4, N'VIDEO', N'courses/55/lessons/223/videos_private/h9es8viuwnzqxcaw24uv', NULL, 437, NULL, 0, NULL, CAST(N'2025-06-15T01:22:05.1200000' AS DateTime2), CAST(N'2025-06-14T19:11:15.0090000' AS DateTime2), N'CLOUDINARY', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (224, 64, N'Node.js Tutorial - 6 - Hello World', N'', 0, N'VIDEO', N'courses/55/lessons/224/videos_private/n8npi3fda5gmpokre3vj', NULL, 339, NULL, 0, NULL, CAST(N'2025-06-15T01:22:28.6333333' AS DateTime2), CAST(N'2025-06-14T19:11:15.0660000' AS DateTime2), N'CLOUDINARY', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (225, 64, N'Node.js Tutorial - 7 - Browser vs Node.js', N'', 1, N'VIDEO', NULL, NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-15T01:22:36.6000000' AS DateTime2), CAST(N'2025-06-14T19:11:15.0920000' AS DateTime2), N'CLOUDINARY', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (226, 65, N'Node.js Tutorials - 8 - Modules', N'', 0, N'VIDEO', N'courses/55/lessons/226/videos_private/yhokwkrk8twpal4uaivv', NULL, 84, NULL, 0, NULL, CAST(N'2025-06-15T01:22:58.2133333' AS DateTime2), CAST(N'2025-06-14T19:11:15.1610000' AS DateTime2), N'CLOUDINARY', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (227, 65, N'Node.js Tutorial - 9 - Local Modules', N'', 1, N'VIDEO', N'courses/55/lessons/227/videos_private/bim1plbxlia0ufzhbezs', NULL, 444, NULL, 0, NULL, CAST(N'2025-06-15T01:23:04.4400000' AS DateTime2), CAST(N'2025-06-14T19:11:15.1830000' AS DateTime2), N'CLOUDINARY', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (228, 65, N'Node.js Tutorial - 10 - Module Exports', N'', 2, N'VIDEO', N'courses/55/lessons/228/videos_private/bjyyvk1wjxmbb8niw2tc', NULL, 236, NULL, 0, NULL, CAST(N'2025-06-15T01:23:10.9100000' AS DateTime2), CAST(N'2025-06-14T19:11:15.2150000' AS DateTime2), N'CLOUDINARY', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (239, 69, N'ssssssssssssssssssssssssssssssssssssssss', N'', 0, N'TEXT', NULL, NULL, NULL, N'<p>dfhrhgrgrgrgrgffffffff</p>', 0, NULL, CAST(N'2025-06-15T12:06:12.5500000' AS DateTime2), CAST(N'2025-06-15T12:06:12.5500000' AS DateTime2), NULL, 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (240, 70, N'Introduction to Programming & Python', N'', 0, N'VIDEO', N'7wnove7K-ZQ', NULL, NULL, NULL, 1, NULL, CAST(N'2025-06-15T15:39:51.6400000' AS DateTime2), CAST(N'2025-06-15T09:25:46.1690000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (241, 70, N'Some Amazing Python Programs – The Power of Python', N'', 1, N'VIDEO', N'Tto8TS-fJQU', NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-15T15:40:00.9866667' AS DateTime2), CAST(N'2025-06-15T09:25:46.2350000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (242, 71, N'Modules and Pip', N'', 0, N'VIDEO', N'xwKO_y2gHxQ', NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-15T15:41:00.2633333' AS DateTime2), CAST(N'2025-06-15T09:25:46.2990000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (243, 71, N'Our First Python Program', N'', 1, N'VIDEO', N'7IWOYhfAcVg', NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-15T15:41:06.7366667' AS DateTime2), CAST(N'2025-06-15T09:25:46.3210000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (244, 71, N'Comments, Escape Sequences & Print Statement', N'', 2, N'VIDEO', N'qxPMmW93eDs', NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-15T15:41:13.0100000' AS DateTime2), CAST(N'2025-06-15T09:25:46.3410000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (245, 72, N'Variables and Data Types', N'', 0, N'VIDEO', N'ORCuz7s5cCY', NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-15T15:41:20.0533333' AS DateTime2), CAST(N'2025-06-15T09:25:46.3890000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (246, 72, N'Exercise 1: Calculator using Python', N'', 1, N'VIDEO', N'FLVqcxnJP_E', NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-15T15:41:27.0266667' AS DateTime2), CAST(N'2025-06-15T09:25:46.4080000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (247, 72, N'Exercise 1: Calculator using Python (Solution)', N'', 2, N'VIDEO', N'dohaSBCKCr0', NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-15T15:41:39.2366667' AS DateTime2), CAST(N'2025-06-15T09:25:46.4410000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (248, 73, N'Typecasting in Python', N'', 0, N'VIDEO', N'Pu5bqySSSS0', NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-15T15:42:35.7766667' AS DateTime2), CAST(N'2025-06-15T09:25:46.5030000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (249, 73, N'Taking User Input in Python', N'', 1, N'VIDEO', N'WvG-R-xXouA', NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-15T15:42:41.8266667' AS DateTime2), CAST(N'2025-06-15T09:25:46.5340000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (260, 78, N'Introduction & Setup', N'', 0, N'VIDEO', N'2pZmKW9-I_k', NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-15T19:51:06.4200000' AS DateTime2), CAST(N'2025-06-16T04:02:00.8270000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (261, 78, N'Compiling TypeScript', N'', 1, N'VIDEO', N'iTZ1-85I77c', NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-15T19:51:11.9566667' AS DateTime2), CAST(N'2025-06-16T04:02:00.8760000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (263, 79, N'Type Basics', N'', 0, N'VIDEO', N'0DzDqtcxnz0', NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-15T19:51:46.7633333' AS DateTime2), CAST(N'2025-06-16T04:02:00.9240000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (264, 79, N'Objects & Arrays', N'', 1, N'VIDEO', N'157NopQ-chU', NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-15T19:51:54.0966667' AS DateTime2), CAST(N'2025-06-16T04:02:00.9430000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (265, 79, N'Explicit Types', N'', 2, N'VIDEO', N'__92ek8Xh4o', NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-15T19:52:42.1866667' AS DateTime2), CAST(N'2025-06-16T04:02:00.9590000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (266, 79, N'Dynamic (any) Types', N'', 3, N'VIDEO', N'nm9P2vnS9_I', NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-15T19:53:01.0666667' AS DateTime2), CAST(N'2025-06-16T04:02:00.9770000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (267, 80, N'Better Workflow & tsconfig', N'', 0, N'VIDEO', N'Y4IiQY9dNRA', NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-15T19:53:46.1100000' AS DateTime2), CAST(N'2025-06-16T04:02:01.0820000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (268, 81, N'Function Basics', N'', 0, N'VIDEO', N'jXoSaX_yFh4', NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-15T19:54:05.0633333' AS DateTime2), CAST(N'2025-06-16T04:02:01.1380000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (269, 81, N'Type Aliases', N'', 1, N'VIDEO', N'AmpwfbdFYL8', NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-15T19:54:10.0533333' AS DateTime2), CAST(N'2025-06-16T04:02:01.1590000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (270, 81, N'Function Signatures', N'', 2, N'VIDEO', N'TZNbzyY6hMU', NULL, NULL, NULL, 0, NULL, CAST(N'2025-06-15T19:54:16.2133333' AS DateTime2), CAST(N'2025-06-16T04:02:01.1770000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (291, 90, N'Course Overview & Tools Setup', N'', 0, N'VIDEO', N'courses/64/lessons/291/videos_private/mqsvrvglmmkutcgt4oqw', NULL, 13, NULL, 0, NULL, CAST(N'2025-06-16T13:54:36.0200000' AS DateTime2), CAST(N'2025-06-16T06:55:09.5610000' AS DateTime2), N'CLOUDINARY', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (292, 91, N'Introduction & Setup', N'', 0, N'VIDEO', N'2pZmKW9-I_k', NULL, NULL, NULL, 0, 260, CAST(N'2025-06-16T13:56:07.1966667' AS DateTime2), CAST(N'2025-06-16T13:56:07.1966667' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (293, 91, N'Compiling TypeScript', N'', 1, N'VIDEO', N'iTZ1-85I77c', NULL, NULL, NULL, 0, 261, CAST(N'2025-06-16T13:56:07.2200000' AS DateTime2), CAST(N'2025-06-16T13:56:07.2200000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (294, 92, N'Type Basics', N'', 0, N'VIDEO', N'0DzDqtcxnz0', NULL, NULL, NULL, 0, 263, CAST(N'2025-06-16T13:56:07.2433333' AS DateTime2), CAST(N'2025-06-16T13:56:07.2433333' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (295, 92, N'Objects & Arrays', N'', 1, N'VIDEO', N'157NopQ-chU', NULL, NULL, NULL, 0, 264, CAST(N'2025-06-16T13:56:07.2566667' AS DateTime2), CAST(N'2025-06-16T13:56:07.2566667' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (296, 92, N'Explicit Types', N'', 2, N'VIDEO', N'__92ek8Xh4o', NULL, NULL, NULL, 0, 265, CAST(N'2025-06-16T13:56:07.2700000' AS DateTime2), CAST(N'2025-06-16T13:56:07.2700000' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (297, 92, N'Dynamic (any) Types', N'', 3, N'VIDEO', N'nm9P2vnS9_I', NULL, NULL, NULL, 0, 266, CAST(N'2025-06-16T13:56:07.2833333' AS DateTime2), CAST(N'2025-06-16T13:56:07.2833333' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (298, 93, N'Better Workflow & tsconfig', N'', 0, N'VIDEO', N'Y4IiQY9dNRA', NULL, NULL, NULL, 0, 267, CAST(N'2025-06-16T13:56:07.3033333' AS DateTime2), CAST(N'2025-06-16T13:56:07.3033333' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (299, 94, N'Function Basics', N'', 0, N'VIDEO', N'jXoSaX_yFh4', NULL, NULL, NULL, 0, 268, CAST(N'2025-06-16T13:56:07.3333333' AS DateTime2), CAST(N'2025-06-16T13:56:07.3333333' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (300, 94, N'Type Aliases', N'', 1, N'VIDEO', N'AmpwfbdFYL8', NULL, NULL, NULL, 0, 269, CAST(N'2025-06-16T13:56:07.3466667' AS DateTime2), CAST(N'2025-06-16T13:56:07.3466667' AS DateTime2), N'YOUTUBE', 0)
GO
INSERT [dbo].[Lessons] ([LessonID], [SectionID], [LessonName], [Description], [LessonOrder], [LessonType], [ExternalVideoID], [ThumbnailUrl], [VideoDurationSeconds], [TextContent], [IsFreePreview], [OriginalID], [CreatedAt], [UpdatedAt], [VideoSourceType], [IsArchived]) VALUES (301, 94, N'Function Signatures', N'', 2, N'VIDEO', N'TZNbzyY6hMU', NULL, NULL, NULL, 0, 270, CAST(N'2025-06-16T13:56:07.3500000' AS DateTime2), CAST(N'2025-06-16T13:56:07.3500000' AS DateTime2), N'YOUTUBE', 0)
GO
SET IDENTITY_INSERT [dbo].[Lessons] OFF
GO
SET IDENTITY_INSERT [dbo].[LessonSubtitles] ON 
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (114, 181, N'en', N'https://files.catbox.moe/79gcwu.vtt', 1, CAST(N'2025-06-14T19:20:01.6633333' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (115, 182, N'en', N'https://files.catbox.moe/73742a.vtt', 1, CAST(N'2025-06-14T19:22:27.7500000' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (116, 185, N'en', N'https://files.catbox.moe/6pdutg.vtt', 1, CAST(N'2025-06-14T20:08:27.7566667' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (117, 186, N'en', N'https://files.catbox.moe/4trgmq.vtt', 1, CAST(N'2025-06-14T20:11:41.0666667' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (118, 187, N'en', N'https://files.catbox.moe/xg4e07.vtt', 1, CAST(N'2025-06-14T20:12:57.9966667' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (119, 188, N'en', N'https://files.catbox.moe/u9oatu.vtt', 1, CAST(N'2025-06-14T20:13:42.3700000' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (120, 189, N'en', N'https://files.catbox.moe/k5vcjy.vtt', 1, CAST(N'2025-06-14T20:15:09.1633333' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (121, 190, N'en', N'https://files.catbox.moe/5nsnc3.vtt', 1, CAST(N'2025-06-14T20:15:41.4200000' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (123, 191, N'en', N'https://files.catbox.moe/hj48xa.vtt', 1, CAST(N'2025-06-14T20:16:34.4700000' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (124, 192, N'en', N'https://files.catbox.moe/vzaw4n.vtt', 1, CAST(N'2025-06-14T20:17:18.6000000' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (159, 219, N'en', N'https://res.cloudinary.com/dkuqtn6bp/raw/upload/v1749927803/sub/Learn%20Node.js%20the%20Hard%20Way%20%28But%20Smarter%29/English_auto-generated_Node.js_Tutorial_-_1_-_Introduction_DownSub.com_yy5scw.vtt', 1, CAST(N'2025-06-15T02:11:14.9400000' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (160, 220, N'en', N'https://res.cloudinary.com/dkuqtn6bp/raw/upload/v1749927803/sub/Learn%20Node.js%20the%20Hard%20Way%20%28But%20Smarter%29/English_auto-generated_Node.js_Tutorial_-_2_-_ECMAScript_DownSub.com_o19fic.vtt', 1, CAST(N'2025-06-15T02:11:14.9633333' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (161, 221, N'en', N'https://res.cloudinary.com/dkuqtn6bp/raw/upload/v1749927804/sub/Learn%20Node.js%20the%20Hard%20Way%20%28But%20Smarter%29/English_auto-generated_Node.js_Tutorial_-_3_-_Chrome_s_V8_Engine_DownSub.com_nynple.vtt', 1, CAST(N'2025-06-15T02:11:14.9900000' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (162, 222, N'en', N'https://res.cloudinary.com/dkuqtn6bp/raw/upload/v1749927801/sub/Learn%20Node.js%20the%20Hard%20Way%20%28But%20Smarter%29/English_auto-generated_Node.js_Tutorial_-_4_-_JavaScript_Runtime_DownSub.com_d83vqh.vtt', 1, CAST(N'2025-06-15T02:11:15.0033333' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (163, 223, N'en', N'https://res.cloudinary.com/dkuqtn6bp/raw/upload/v1749927801/sub/Learn%20Node.js%20the%20Hard%20Way%20%28But%20Smarter%29/English_auto-generated_Node.js_Tutorial_-_5_-_What_is_Node.js__DownSub.com_qmjvgg.vtt', 1, CAST(N'2025-06-15T02:11:15.0266667' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (164, 224, N'en', N'https://res.cloudinary.com/dkuqtn6bp/raw/upload/v1749927801/sub/Learn%20Node.js%20the%20Hard%20Way%20%28But%20Smarter%29/English_auto-generated_Node.js_Tutorial_-_6_-_Hello_World_DownSub.com_jcnrf4.vtt', 1, CAST(N'2025-06-15T02:11:15.0900000' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (165, 225, N'en', N'https://res.cloudinary.com/dkuqtn6bp/raw/upload/v1749927801/sub/Learn%20Node.js%20the%20Hard%20Way%20%28But%20Smarter%29/English_auto-generated_Node.js_Tutorial_-_7_-_Browser_vs_Node.js_DownSub.com_bn0qtc.vtt', 1, CAST(N'2025-06-15T02:11:15.1100000' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (166, 226, N'en', N'https://res.cloudinary.com/dkuqtn6bp/raw/upload/v1749927801/sub/Learn%20Node.js%20the%20Hard%20Way%20%28But%20Smarter%29/English_auto-generated_Node.js_Tutorial_-_8_-_Modules_DownSub.com_jpib3l.vtt', 1, CAST(N'2025-06-15T02:11:15.1800000' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (167, 227, N'en', N'https://res.cloudinary.com/dkuqtn6bp/raw/upload/v1749927801/sub/Learn%20Node.js%20the%20Hard%20Way%20%28But%20Smarter%29/English_auto-generated_Node.js_Tutorial_-_9_-_Local_Modules_DownSub.com_oebdp3.vtt', 1, CAST(N'2025-06-15T02:11:15.2133333' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (168, 228, N'en', N'https://res.cloudinary.com/dkuqtn6bp/raw/upload/v1749927802/sub/Learn%20Node.js%20the%20Hard%20Way%20%28But%20Smarter%29/English_auto-generated_Node.js_Tutorial_-_10_-_Module_Exports_DownSub.com_fvto3s.vtt', 1, CAST(N'2025-06-15T02:11:15.2233333' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (179, 240, N'en', N'https://files.catbox.moe/d4606a.vtt', 1, CAST(N'2025-06-15T16:25:46.2266667' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (180, 241, N'en', N'https://files.catbox.moe/dhobw1.vtt', 1, CAST(N'2025-06-15T16:25:46.2566667' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (181, 242, N'en', N'https://files.catbox.moe/hw3i5p.vtt', 1, CAST(N'2025-06-15T16:25:46.3166667' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (182, 243, N'en', N'https://files.catbox.moe/9uc973.vtt', 1, CAST(N'2025-06-15T16:25:46.3366667' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (183, 244, N'en', N'https://files.catbox.moe/s52eka.vtt', 1, CAST(N'2025-06-15T16:25:46.3633333' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (184, 245, N'en', N'https://files.catbox.moe/sr7dnv.vtt', 1, CAST(N'2025-06-15T16:25:46.4033333' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (185, 246, N'en', N'https://files.catbox.moe/6418wi.vtt', 1, CAST(N'2025-06-15T16:25:46.4366667' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (186, 247, N'en', N'https://files.catbox.moe/5a3tym.vtt', 1, CAST(N'2025-06-15T16:25:46.4700000' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (187, 248, N'en', N'https://files.catbox.moe/ueuwnq.vtt', 1, CAST(N'2025-06-15T16:25:46.5300000' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (188, 249, N'en', N'https://files.catbox.moe/m4p5f1.vtt', 1, CAST(N'2025-06-15T16:25:46.5600000' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (210, 260, N'en', N'https://files.catbox.moe/zevjya.vtt', 1, CAST(N'2025-06-16T11:02:00.8733333' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (211, 261, N'en', N'https://files.catbox.moe/1mo2qt.vtt', 1, CAST(N'2025-06-16T11:02:00.8900000' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (212, 263, N'en', N'https://files.catbox.moe/meyn4q.vtt', 1, CAST(N'2025-06-16T11:02:00.9400000' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (213, 264, N'en', N'https://files.catbox.moe/b7ayaf.vtt', 1, CAST(N'2025-06-16T11:02:00.9566667' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (214, 265, N'en', N'https://files.catbox.moe/nzfmik.vtt', 1, CAST(N'2025-06-16T11:02:00.9733333' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (215, 266, N'en', N'https://files.catbox.moe/y1f75v.vtt', 1, CAST(N'2025-06-16T11:02:01.0200000' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (216, 267, N'en', N'https://files.catbox.moe/5cnxrx.vtt', 1, CAST(N'2025-06-16T11:02:01.1000000' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (217, 268, N'en', N'https://files.catbox.moe/c8t3u4.vtt', 1, CAST(N'2025-06-16T11:02:01.1566667' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (218, 269, N'en', N'https://files.catbox.moe/52pl5b.vtt', 1, CAST(N'2025-06-16T11:02:01.1733333' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (219, 270, N'en', N'https://files.catbox.moe/hzwly8.vtt', 1, CAST(N'2025-06-16T11:02:01.1933333' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (230, 292, N'en', N'https://files.catbox.moe/zevjya.vtt', 1, CAST(N'2025-06-16T13:56:07.2166667' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (231, 293, N'en', N'https://files.catbox.moe/1mo2qt.vtt', 1, CAST(N'2025-06-16T13:56:07.2266667' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (232, 294, N'en', N'https://files.catbox.moe/meyn4q.vtt', 1, CAST(N'2025-06-16T13:56:07.2466667' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (233, 295, N'en', N'https://files.catbox.moe/b7ayaf.vtt', 1, CAST(N'2025-06-16T13:56:07.2633333' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (234, 296, N'en', N'https://files.catbox.moe/nzfmik.vtt', 1, CAST(N'2025-06-16T13:56:07.2733333' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (235, 297, N'en', N'https://files.catbox.moe/y1f75v.vtt', 1, CAST(N'2025-06-16T13:56:07.2866667' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (236, 298, N'en', N'https://files.catbox.moe/5cnxrx.vtt', 1, CAST(N'2025-06-16T13:56:07.3100000' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (237, 299, N'en', N'https://files.catbox.moe/c8t3u4.vtt', 1, CAST(N'2025-06-16T13:56:07.3400000' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (238, 300, N'en', N'https://files.catbox.moe/52pl5b.vtt', 1, CAST(N'2025-06-16T13:56:07.3500000' AS DateTime2))
GO
INSERT [dbo].[LessonSubtitles] ([SubtitleID], [LessonID], [LanguageCode], [SubtitleUrl], [IsDefault], [UploadedAt]) VALUES (239, 301, N'en', N'https://files.catbox.moe/hzwly8.vtt', 1, CAST(N'2025-06-16T13:56:07.3700000' AS DateTime2))
GO
SET IDENTITY_INSERT [dbo].[LessonSubtitles] OFF
GO
SET IDENTITY_INSERT [dbo].[Levels] ON 
GO
INSERT [dbo].[Levels] ([LevelID], [LevelName], [CreatedAt], [UpdatedAt]) VALUES (1, N'Cơ bản', CAST(N'2025-04-28T22:25:25.1633333' AS DateTime2), CAST(N'2025-05-04T06:16:30.7340000' AS DateTime2))
GO
INSERT [dbo].[Levels] ([LevelID], [LevelName], [CreatedAt], [UpdatedAt]) VALUES (2, N'Trung cấp', CAST(N'2025-04-28T22:25:25.1633333' AS DateTime2), CAST(N'2025-04-28T22:25:25.1633333' AS DateTime2))
GO
INSERT [dbo].[Levels] ([LevelID], [LevelName], [CreatedAt], [UpdatedAt]) VALUES (3, N'Nâng cao', CAST(N'2025-04-28T22:25:25.1633333' AS DateTime2), CAST(N'2025-04-28T22:25:25.1633333' AS DateTime2))
GO
INSERT [dbo].[Levels] ([LevelID], [LevelName], [CreatedAt], [UpdatedAt]) VALUES (4, N'Mọi cấp độ', CAST(N'2025-04-28T22:25:25.1633333' AS DateTime2), CAST(N'2025-04-28T22:25:25.1633333' AS DateTime2))
GO
SET IDENTITY_INSERT [dbo].[Levels] OFF
GO
SET IDENTITY_INSERT [dbo].[Notifications] ON 
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (75, 18, N'COURSE_SUBMITTED', N'Giảng viên 3tedutech@gmail.com vừa gửi yêu cầu duyệt cho khóa học "Learn Node.js the Hard Way (But Smarter)".', N'CourseApprovalRequest', N'39', 0, CAST(N'2025-06-15T01:52:58.7066667' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (76, 18, N'COURSE_APPROVED', N'Khóa học "của bạn" đã được phê duyệt và xuất bản!', N'Course', N'55', 0, CAST(N'2025-06-15T01:53:14.6566667' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (77, 18, N'COURSE_SUBMITTED', N'Giảng viên 3tedutech@gmail.com vừa gửi yêu cầu duyệt cho khóa học "Learn Node.js the Hard Way (But Smarter)".', N'CourseApprovalRequest', N'40', 0, CAST(N'2025-06-15T02:10:53.5100000' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (78, 18, N'COURSE_APPROVED', N'Khóa học "của bạn" đã được phê duyệt và xuất bản!', N'Course', N'56', 0, CAST(N'2025-06-15T02:11:15.4566667' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (79, 18, N'COURSE_SUBMITTED', N'Giảng viên 3tedutech@gmail.com vừa gửi yêu cầu duyệt cho khóa học "Khóa demo cho thanh toán và cái tính năng nhỏ lẻ".', N'CourseApprovalRequest', N'41', 0, CAST(N'2025-06-15T12:06:30.4566667' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (80, 18, N'COURSE_APPROVED', N'Khóa học "của bạn" đã được phê duyệt và xuất bản!', N'Course', N'57', 0, CAST(N'2025-06-15T12:06:51.8300000' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (81, 18, N'COURSE_SUBMITTED', N'Giảng viên sonthanh123456789101112@gmail.com vừa gửi yêu cầu duyệt cho khóa học "Learn Python Like a Pro (Even If You''re Not One Yet)".', N'CourseApprovalRequest', N'42', 1, CAST(N'2025-06-15T16:10:04.4466667' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (82, 15, N'COURSE_APPROVED', N'Khóa học "của bạn" đã được phê duyệt và xuất bản!', N'Course', N'58', 0, CAST(N'2025-06-15T16:18:25.6500000' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (83, 18, N'COURSE_SUBMITTED', N'Giảng viên sonthanh123456789101112@gmail.com vừa gửi yêu cầu duyệt cho khóa học "Learn Python Like a Pro (Even If You''re Not One Yet)".', N'CourseApprovalRequest', N'43', 0, CAST(N'2025-06-15T16:24:15.9700000' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (84, 15, N'COURSE_APPROVED', N'Khóa học "của bạn" đã được phê duyệt và xuất bản!', N'Course', N'59', 0, CAST(N'2025-06-15T16:25:46.7733333' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (85, 2, N'COURSE_ENROLLED', N'Chúc mừng bạn đã đăng ký thành công khóa học "Khóa demo cho thanh toán và cái tính năng nhỏ lẻ"!', N'Course', N'57', 0, CAST(N'2025-06-15T17:16:39.9300000' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (86, 2, N'ORDER_COMPLETED', N'Đơn hàng #153 của bạn đã hoàn tất. Bạn có thể bắt đầu học ngay!', N'Order', N'153', 0, CAST(N'2025-06-15T17:16:39.9566667' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (87, 18, N'COURSE_SUBMITTED', N'Giảng viên 3tedutech@gmail.com vừa gửi yêu cầu duyệt cho khóa học "TypeScript Tutorial Step-by-step".', N'CourseApprovalRequest', N'44', 0, CAST(N'2025-06-15T20:22:36.2933333' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (88, 18, N'COURSE_REJECTED', N'Khóa học "của bạn" đã bị từ chối. Lý do: chưa tốt lắm hãy fix lại', N'Course', N'60', 0, CAST(N'2025-06-15T20:23:22.3400000' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (89, 18, N'COURSE_SUBMITTED', N'Giảng viên 3tedutech@gmail.com vừa gửi yêu cầu duyệt cho khóa học "TypeScript Tutorial Step-by-step".', N'CourseApprovalRequest', N'45', 0, CAST(N'2025-06-15T20:27:51.8400000' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (90, 18, N'COURSE_REJECTED', N'Khóa học "của bạn" đã bị từ chối. Lý do: chưa ổn lắm tiền còn chưa nhập thik dạy free lắm à', N'Course', N'60', 0, CAST(N'2025-06-15T20:29:30.4533333' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (91, 18, N'COURSE_SUBMITTED', N'Giảng viên 3tedutech@gmail.com vừa gửi yêu cầu duyệt cho khóa học "TypeScript Tutorial Step-by-step".', N'CourseApprovalRequest', N'46', 0, CAST(N'2025-06-15T20:40:07.3833333' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (92, 18, N'COURSE_APPROVED', N'Khóa học "của bạn" đã được phê duyệt và xuất bản!', N'Course', N'60', 0, CAST(N'2025-06-15T20:44:18.2400000' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (93, 21, N'COURSE_ENROLLED', N'Chúc mừng bạn đã đăng ký thành công khóa học "Khóa demo cho thanh toán và cái tính năng nhỏ lẻ"!', N'Course', N'57', 1, CAST(N'2025-06-15T21:24:09.8200000' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (94, 21, N'ORDER_COMPLETED', N'Đơn hàng #168 của bạn đã hoàn tất. Bạn có thể bắt đầu học ngay!', N'Order', N'168', 1, CAST(N'2025-06-15T21:24:09.8466667' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (95, 21, N'COURSE_ENROLLED', N'Chúc mừng bạn đã đăng ký thành công khóa học "TypeScript Tutorial Step-by-step"!', N'Course', N'60', 1, CAST(N'2025-06-16T01:10:26.7400000' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (96, 21, N'ORDER_COMPLETED', N'Đơn hàng #201 của bạn đã hoàn tất. Bạn có thể bắt đầu học ngay!', N'Order', N'201', 1, CAST(N'2025-06-16T01:10:26.7700000' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (97, 18, N'COURSE_SOLD', N'Chúc mừng! Các khóa học của bạn (TypeScript Tutorial Step-by-step) vừa được bán trong đơn hàng #201.', N'Order', N'201', 0, CAST(N'2025-06-16T01:10:26.7900000' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (98, 21, N'COURSE_ENROLLED', N'Chúc mừng bạn đã đăng ký thành công khóa học "JavaScript Introduction All tutorial Step-by-step new 2025"!', N'Course', N'48', 1, CAST(N'2025-06-16T01:23:28.7700000' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (99, 21, N'ORDER_COMPLETED', N'Đơn hàng #204 của bạn đã hoàn tất. Bạn có thể bắt đầu học ngay!', N'Order', N'204', 1, CAST(N'2025-06-16T01:23:28.7900000' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (100, 18, N'COURSE_SOLD', N'Chúc mừng! Các khóa học của bạn (JavaScript Introduction All tutorial Step-by-step new 2025) vừa được bán trong đơn hàng #204.', N'Order', N'204', 0, CAST(N'2025-06-16T01:23:28.8066667' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (101, 2, N'COURSE_ENROLLED', N'Chúc mừng bạn đã đăng ký thành công khóa học "TypeScript Tutorial Step-by-step"!', N'Course', N'60', 0, CAST(N'2025-06-16T10:36:53.7666667' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (102, 2, N'ORDER_COMPLETED', N'Đơn hàng #208 của bạn đã hoàn tất. Bạn có thể bắt đầu học ngay!', N'Order', N'208', 0, CAST(N'2025-06-16T10:36:53.7900000' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (103, 18, N'COURSE_SOLD', N'Chúc mừng! Các khóa học của bạn (TypeScript Tutorial Step-by-step) vừa được bán trong đơn hàng #208.', N'Order', N'208', 0, CAST(N'2025-06-16T10:36:53.8100000' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (104, 18, N'COURSE_SUBMITTED', N'Giảng viên 3tedutech@gmail.com vừa gửi yêu cầu duyệt cho khóa học "TypeScript Tutorial Step-by-stepp".', N'CourseApprovalRequest', N'47', 0, CAST(N'2025-06-16T10:58:47.7800000' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (105, 18, N'COURSE_APPROVED', N'Khóa học "của bạn" đã được phê duyệt và xuất bản!', N'Course', N'62', 0, CAST(N'2025-06-16T11:02:01.3533333' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (106, 18, N'WITHDRAWAL_REQUESTED', N'Giảng viên Super Admin 3T vừa tạo yêu cầu rút tiền #2 (100,000 VND).', N'WithdrawalRequest', N'2', 0, CAST(N'2025-06-16T11:03:26.5700000' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (107, 19, N'COURSE_ENROLLED', N'Chúc mừng bạn đã đăng ký thành công khóa học "TypeScript Tutorial Step-by-stepp"!', N'Course', N'60', 0, CAST(N'2025-06-16T12:43:23.1633333' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (108, 19, N'ORDER_COMPLETED', N'Đơn hàng #211 của bạn đã hoàn tất. Bạn có thể bắt đầu học ngay!', N'Order', N'211', 0, CAST(N'2025-06-16T12:43:23.1900000' AS DateTime2))
GO
INSERT [dbo].[Notifications] ([NotificationID], [RecipientAccountID], [Type], [Message], [RelatedEntityType], [RelatedEntityID], [IsRead], [CreatedAt]) VALUES (109, 18, N'COURSE_SOLD', N'Chúc mừng! Các khóa học của bạn (TypeScript Tutorial Step-by-stepp) vừa được bán trong đơn hàng #211.', N'Order', N'211', 0, CAST(N'2025-06-16T12:43:23.2100000' AS DateTime2))
GO
SET IDENTITY_INSERT [dbo].[Notifications] OFF
GO
SET IDENTITY_INSERT [dbo].[OrderItems] ON 
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (138, 138, 48, CAST(450000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (139, 139, 48, CAST(450000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (140, 140, 48, CAST(450000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (141, 141, 48, CAST(450000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (142, 142, 48, CAST(450000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (143, 143, 57, CAST(1.5300 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (144, 144, 57, CAST(1.5300 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (145, 145, 57, CAST(1.5300 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (146, 146, 57, CAST(1.5300 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (147, 147, 57, CAST(1.5300 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (148, 148, 57, CAST(1.5300 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (149, 149, 57, CAST(1.5300 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (150, 150, 57, CAST(1.5300 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (151, 151, 57, CAST(1.5300 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (152, 152, 57, CAST(1.5300 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (153, 153, 57, CAST(1.5300 AS Decimal(18, 4)), 3)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (154, 154, 55, CAST(499000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (155, 155, 55, CAST(499000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (156, 156, 58, CAST(1299000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (157, 157, 58, CAST(1299000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (158, 158, 58, CAST(1299000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (159, 159, 58, CAST(1299000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (160, 160, 58, CAST(1299000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (161, 161, 58, CAST(1299000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (162, 162, 55, CAST(499000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (163, 163, 58, CAST(1299000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (164, 164, 58, CAST(1299000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (165, 165, 58, CAST(1299000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (166, 166, 57, CAST(40000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (167, 167, 57, CAST(40000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (168, 168, 57, CAST(40000.0000 AS Decimal(18, 4)), 4)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (169, 169, 58, CAST(1299000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (170, 170, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (171, 171, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (172, 172, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (173, 173, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (174, 174, 55, CAST(499000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (175, 175, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (176, 176, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (177, 177, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (178, 178, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (179, 179, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (180, 180, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (181, 181, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (182, 182, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (183, 183, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (184, 184, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (185, 185, 58, CAST(1299000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (186, 186, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (187, 187, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (188, 188, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (189, 189, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (190, 190, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (191, 191, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (192, 192, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (193, 193, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (194, 194, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (195, 195, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (196, 196, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (197, 197, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (198, 198, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (199, 199, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (200, 200, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (201, 201, 60, CAST(7.6300 AS Decimal(18, 4)), 5)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (202, 202, 48, CAST(17.2600 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (203, 203, 48, CAST(17.2600 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (204, 204, 48, CAST(17.2600 AS Decimal(18, 4)), 6)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (205, 205, 55, CAST(499000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (206, 206, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (207, 207, 58, CAST(49.8200 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (208, 208, 60, CAST(7.6300 AS Decimal(18, 4)), 7)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (209, 209, 58, CAST(49.8200 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (210, 210, 60, CAST(199000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (211, 211, 60, CAST(199000.0000 AS Decimal(18, 4)), 8)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (212, 212, 55, CAST(499000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (213, 213, 55, CAST(499000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (214, 214, 55, CAST(499000.0000 AS Decimal(18, 4)), NULL)
GO
INSERT [dbo].[OrderItems] ([OrderItemID], [OrderID], [CourseID], [PriceAtOrder], [EnrollmentID]) VALUES (215, 215, 55, CAST(499000.0000 AS Decimal(18, 4)), NULL)
GO
SET IDENTITY_INSERT [dbo].[OrderItems] OFF
GO
SET IDENTITY_INSERT [dbo].[Orders] ON 
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (6, 2, CAST(N'2025-05-10T02:00:01.7700000' AS DateTime2), CAST(10.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(1.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (7, 2, CAST(N'2025-05-10T02:18:48.9233333' AS DateTime2), CAST(10.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(1.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (8, 2, CAST(N'2025-05-10T02:19:54.3833333' AS DateTime2), CAST(10.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(1.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (9, 2, CAST(N'2025-05-10T02:21:02.4366667' AS DateTime2), CAST(10.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(1.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (10, 2, CAST(N'2025-05-10T02:25:57.8166667' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (11, 2, CAST(N'2025-05-10T10:02:16.3933333' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (12, 2, CAST(N'2025-05-10T10:28:33.7466667' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (13, 2, CAST(N'2025-05-10T10:51:05.3300000' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (14, 2, CAST(N'2025-05-10T10:58:22.8100000' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (15, 2, CAST(N'2025-05-10T11:00:13.0600000' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (16, 2, CAST(N'2025-05-10T11:03:24.7633333' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (17, 2, CAST(N'2025-05-10T11:09:47.0733333' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (18, 2, CAST(N'2025-05-10T14:15:32.6000000' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (19, 2, CAST(N'2025-05-10T14:16:38.9533333' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (20, 2, CAST(N'2025-05-10T14:42:45.6500000' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (21, 2, CAST(N'2025-05-10T14:44:16.1000000' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (22, 2, CAST(N'2025-05-10T14:52:01.4500000' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (23, 2, CAST(N'2025-05-10T15:07:00.5633333' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (24, 2, CAST(N'2025-05-10T15:12:56.0000000' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (25, 2, CAST(N'2025-05-10T15:15:52.4500000' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (26, 2, CAST(N'2025-05-10T15:27:14.3200000' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (27, 2, CAST(N'2025-05-10T15:37:23.9800000' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (28, 2, CAST(N'2025-05-10T15:39:00.3466667' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (29, 2, CAST(N'2025-05-10T15:45:26.1533333' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (30, 2, CAST(N'2025-05-10T15:47:46.2366667' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (31, 2, CAST(N'2025-05-10T16:05:51.5300000' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (32, 2, CAST(N'2025-05-10T16:07:28.7566667' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (33, 2, CAST(N'2025-05-10T16:18:54.9400000' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (34, 2, CAST(N'2025-05-10T16:20:01.1366667' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (35, 2, CAST(N'2025-05-10T16:45:13.7400000' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (36, 2, CAST(N'2025-05-10T16:46:47.8733333' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (37, 2, CAST(N'2025-05-10T16:47:36.6300000' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (38, 2, CAST(N'2025-05-10T16:56:13.7133333' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (39, 2, CAST(N'2025-05-10T17:01:06.7266667' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (40, 2, CAST(N'2025-05-10T17:02:28.6500000' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (41, 2, CAST(N'2025-05-10T17:06:50.5900000' AS DateTime2), CAST(10000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7000.0000 AS Decimal(18, 4)), NULL, NULL, N'FAILED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (42, 2, CAST(N'2025-05-11T09:56:38.1500000' AS DateTime2), CAST(20000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(10000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (43, 2, CAST(N'2025-05-11T10:17:52.1066667' AS DateTime2), CAST(20000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(10000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (44, 2, CAST(N'2025-05-11T10:29:26.8000000' AS DateTime2), CAST(20000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(10000.0000 AS Decimal(18, 4)), NULL, NULL, N'FAILED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (45, 2, CAST(N'2025-05-11T10:40:20.3200000' AS DateTime2), CAST(20000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(10000.0000 AS Decimal(18, 4)), NULL, NULL, N'COMPLETED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (46, 2, CAST(N'2025-05-11T10:57:25.9966667' AS DateTime2), CAST(20000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(10000.0000 AS Decimal(18, 4)), NULL, NULL, N'COMPLETED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (47, 2, CAST(N'2025-05-11T11:09:18.8466667' AS DateTime2), CAST(20000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(10000.0000 AS Decimal(18, 4)), NULL, NULL, N'COMPLETED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (48, 3, CAST(N'2025-05-20T22:25:05.9700000' AS DateTime2), CAST(20000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(10000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (50, 19, CAST(N'2025-06-09T22:35:53.9000000' AS DateTime2), CAST(0.7700 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(0.3800 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (51, 19, CAST(N'2025-06-10T00:01:44.8133333' AS DateTime2), CAST(0.7700 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(0.3800 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (52, 19, CAST(N'2025-06-10T00:25:55.8500000' AS DateTime2), CAST(0.7700 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(0.3800 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (53, 19, CAST(N'2025-06-10T00:26:25.5233333' AS DateTime2), CAST(0.7700 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(0.3800 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (54, 19, CAST(N'2025-06-10T00:29:46.2700000' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (55, 19, CAST(N'2025-06-10T00:51:34.9833333' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (56, 19, CAST(N'2025-06-10T00:54:21.4066667' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (57, 19, CAST(N'2025-06-10T01:05:55.4133333' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (58, 19, CAST(N'2025-06-10T01:07:38.2800000' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (59, 19, CAST(N'2025-06-10T01:16:00.0933333' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'COMPLETED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (60, 3, CAST(N'2025-06-10T17:13:33.8466667' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (61, 3, CAST(N'2025-06-10T17:23:28.5033333' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (62, 3, CAST(N'2025-06-10T17:27:51.1866667' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (63, 3, CAST(N'2025-06-10T17:28:10.6933333' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (64, 3, CAST(N'2025-06-10T17:28:29.2633333' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (65, 3, CAST(N'2025-06-10T17:28:44.4033333' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (66, 3, CAST(N'2025-06-10T17:29:03.1100000' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (67, 3, CAST(N'2025-06-10T17:30:12.9300000' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (68, 3, CAST(N'2025-06-10T17:38:15.5966667' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (69, 3, CAST(N'2025-06-10T17:38:30.4500000' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (70, 3, CAST(N'2025-06-10T17:38:42.2133333' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (71, 3, CAST(N'2025-06-10T17:38:52.8100000' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (72, 3, CAST(N'2025-06-10T17:48:29.4700000' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (73, 3, CAST(N'2025-06-10T17:54:54.3800000' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (74, 3, CAST(N'2025-06-10T17:55:11.5400000' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (75, 3, CAST(N'2025-06-10T18:04:44.6133333' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (76, 3, CAST(N'2025-06-10T18:08:29.4633333' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (77, 3, CAST(N'2025-06-10T18:13:38.6966667' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (78, 3, CAST(N'2025-06-10T18:25:07.6133333' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (79, 3, CAST(N'2025-06-10T18:28:48.2400000' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (80, 3, CAST(N'2025-06-10T18:33:04.1066667' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (81, 3, CAST(N'2025-06-10T18:33:59.5133333' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (82, 3, CAST(N'2025-06-10T18:38:31.8300000' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (83, 3, CAST(N'2025-06-10T18:39:16.9833333' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (84, 3, CAST(N'2025-06-10T18:40:47.9400000' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (85, 3, CAST(N'2025-06-10T18:41:37.9066667' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (86, 3, CAST(N'2025-06-10T18:42:32.9700000' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (87, 3, CAST(N'2025-06-10T18:44:22.3866667' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (88, 3, CAST(N'2025-06-10T18:49:18.9266667' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (89, 3, CAST(N'2025-06-10T19:00:21.7200000' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (90, 3, CAST(N'2025-06-10T19:40:33.4833333' AS DateTime2), CAST(3.8400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(3.0700 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (91, 3, CAST(N'2025-06-10T19:40:50.9533333' AS DateTime2), CAST(100000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(80000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (92, 3, CAST(N'2025-06-10T19:41:49.0466667' AS DateTime2), CAST(100000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(80000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (93, 3, CAST(N'2025-06-10T19:43:04.6000000' AS DateTime2), CAST(100000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(80000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (94, 3, CAST(N'2025-06-10T19:56:32.5633333' AS DateTime2), CAST(100000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(80000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (95, 3, CAST(N'2025-06-10T19:56:56.2833333' AS DateTime2), CAST(100000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(80000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (96, 3, CAST(N'2025-06-10T19:57:11.5800000' AS DateTime2), CAST(100000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(80000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (97, 3, CAST(N'2025-06-10T20:00:49.3966667' AS DateTime2), CAST(100000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(80000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (98, 17, CAST(N'2025-06-11T21:33:45.1000000' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (99, 17, CAST(N'2025-06-11T21:45:26.6500000' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (100, 17, CAST(N'2025-06-11T21:51:35.9466667' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (101, 17, CAST(N'2025-06-11T23:58:14.6433333' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (102, 17, CAST(N'2025-06-12T00:01:12.8766667' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (103, 17, CAST(N'2025-06-12T00:17:34.4733333' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (104, 17, CAST(N'2025-06-12T00:18:34.2100000' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (105, 17, CAST(N'2025-06-12T00:21:33.8433333' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (106, 17, CAST(N'2025-06-12T00:23:03.2033333' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (107, 17, CAST(N'2025-06-12T00:23:41.9633333' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (108, 17, CAST(N'2025-06-12T00:45:17.2133333' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (109, 17, CAST(N'2025-06-12T00:52:38.2233333' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (110, 17, CAST(N'2025-06-12T00:56:02.6733333' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (111, 17, CAST(N'2025-06-12T01:05:14.9033333' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (112, 17, CAST(N'2025-06-12T01:08:08.6333333' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (113, 17, CAST(N'2025-06-12T01:20:57.8566667' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (114, 17, CAST(N'2025-06-12T01:21:26.2533333' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (115, 17, CAST(N'2025-06-12T01:25:28.0833333' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (116, 17, CAST(N'2025-06-12T01:27:22.0500000' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (117, 17, CAST(N'2025-06-12T01:33:20.3100000' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (118, 17, CAST(N'2025-06-12T01:33:50.1900000' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (119, 17, CAST(N'2025-06-12T01:34:35.2666667' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (120, 17, CAST(N'2025-06-12T01:35:03.0366667' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (121, 17, CAST(N'2025-06-12T01:37:47.5600000' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (122, 17, CAST(N'2025-06-12T01:40:19.7966667' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (123, 17, CAST(N'2025-06-12T01:42:51.6400000' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (124, 17, CAST(N'2025-06-12T01:43:19.9133333' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (125, 17, CAST(N'2025-06-12T01:44:07.7600000' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (126, 17, CAST(N'2025-06-12T01:48:18.0400000' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (127, 17, CAST(N'2025-06-12T01:48:50.2900000' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (128, 17, CAST(N'2025-06-12T02:02:53.7433333' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (129, 17, CAST(N'2025-06-12T02:04:55.8500000' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (130, 17, CAST(N'2025-06-12T02:07:58.9100000' AS DateTime2), CAST(11.5100 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (131, 17, CAST(N'2025-06-12T11:47:59.3033333' AS DateTime2), CAST(300000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(290000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (132, 17, CAST(N'2025-06-12T11:48:52.8433333' AS DateTime2), CAST(300000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(290000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (133, 17, CAST(N'2025-06-12T12:05:33.2333333' AS DateTime2), CAST(300000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(290000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (134, 17, CAST(N'2025-06-12T17:40:19.6133333' AS DateTime2), CAST(300000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(290000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (135, 17, CAST(N'2025-06-12T17:55:36.0300000' AS DateTime2), CAST(300000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(290000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (136, 17, CAST(N'2025-06-12T17:59:02.7333333' AS DateTime2), CAST(300000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(290000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (137, 17, CAST(N'2025-06-13T14:47:31.8133333' AS DateTime2), CAST(11.5400 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(11.1500 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (138, 20, CAST(N'2025-06-14T22:59:56.2000000' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(450000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (139, 20, CAST(N'2025-06-14T23:02:37.5066667' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(450000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (140, 20, CAST(N'2025-06-14T23:04:11.3233333' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(450000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (141, 20, CAST(N'2025-06-14T23:05:34.9700000' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(450000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (142, 20, CAST(N'2025-06-14T23:15:57.6066667' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(450000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (143, 2, CAST(N'2025-06-15T16:26:59.8666667' AS DateTime2), CAST(1.9200 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(1.5300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (144, 2, CAST(N'2025-06-15T16:30:55.4766667' AS DateTime2), CAST(1.9200 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(1.5300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (145, 2, CAST(N'2025-06-15T16:46:15.6000000' AS DateTime2), CAST(1.9200 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(1.5300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (146, 2, CAST(N'2025-06-15T16:51:19.5400000' AS DateTime2), CAST(1.9200 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(1.5300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (147, 2, CAST(N'2025-06-15T16:57:22.2600000' AS DateTime2), CAST(1.9200 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(1.5300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (148, 2, CAST(N'2025-06-15T16:57:41.0033333' AS DateTime2), CAST(1.9200 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(1.5300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (149, 2, CAST(N'2025-06-15T17:04:24.4566667' AS DateTime2), CAST(1.9200 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(1.5300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (150, 2, CAST(N'2025-06-15T17:05:26.3866667' AS DateTime2), CAST(1.9200 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(1.5300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (151, 2, CAST(N'2025-06-15T17:06:54.7500000' AS DateTime2), CAST(1.9200 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(1.5300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (152, 2, CAST(N'2025-06-15T17:12:38.8233333' AS DateTime2), CAST(1.9200 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(1.5300 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (153, 2, CAST(N'2025-06-15T17:16:27.7333333' AS DateTime2), CAST(1.9200 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(1.5300 AS Decimal(18, 4)), NULL, 68, N'COMPLETED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (154, 2, CAST(N'2025-06-15T17:18:52.2033333' AS DateTime2), CAST(1299000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(499000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (155, 2, CAST(N'2025-06-15T17:29:34.9233333' AS DateTime2), CAST(1299000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(499000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (156, 2, CAST(N'2025-06-15T17:46:06.9866667' AS DateTime2), CAST(1599000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(1299000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (157, 2, CAST(N'2025-06-15T17:51:35.7866667' AS DateTime2), CAST(1599000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(1299000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (158, 2, CAST(N'2025-06-15T17:52:03.0066667' AS DateTime2), CAST(1599000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(1299000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (159, 2, CAST(N'2025-06-15T17:53:33.3833333' AS DateTime2), CAST(1599000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(1299000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (160, 2, CAST(N'2025-06-15T18:06:18.0900000' AS DateTime2), CAST(1599000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(1299000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (161, 2, CAST(N'2025-06-15T18:14:37.4900000' AS DateTime2), CAST(1599000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(1299000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (162, 2, CAST(N'2025-06-15T18:35:39.3733333' AS DateTime2), CAST(1299000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(499000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (163, 2, CAST(N'2025-06-15T18:40:15.7633333' AS DateTime2), CAST(1599000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(1299000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (164, 2, CAST(N'2025-06-15T19:01:40.2800000' AS DateTime2), CAST(1599000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(1299000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (165, 2, CAST(N'2025-06-15T19:14:02.0366667' AS DateTime2), CAST(1599000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(1299000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (166, 21, CAST(N'2025-06-15T21:08:12.3600000' AS DateTime2), CAST(50000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(40000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (167, 21, CAST(N'2025-06-15T21:12:15.9433333' AS DateTime2), CAST(50000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(40000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (168, 21, CAST(N'2025-06-15T21:23:08.7500000' AS DateTime2), CAST(50000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(40000.0000 AS Decimal(18, 4)), NULL, 79, N'COMPLETED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (169, 21, CAST(N'2025-06-15T21:29:01.9333333' AS DateTime2), CAST(1599000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(1299000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (170, 21, CAST(N'2025-06-15T21:35:15.0800000' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (171, 21, CAST(N'2025-06-15T21:38:08.3733333' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (172, 21, CAST(N'2025-06-15T21:50:55.7266667' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (173, 21, CAST(N'2025-06-15T21:54:21.9833333' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (174, 21, CAST(N'2025-06-15T22:09:32.3066667' AS DateTime2), CAST(1299000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(499000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (175, 21, CAST(N'2025-06-15T22:11:08.8666667' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (176, 21, CAST(N'2025-06-15T22:16:34.1833333' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (177, 21, CAST(N'2025-06-15T22:19:13.1600000' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (178, 21, CAST(N'2025-06-15T22:21:26.0500000' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (179, 21, CAST(N'2025-06-15T22:23:09.9200000' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (180, 21, CAST(N'2025-06-15T22:34:20.3100000' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (181, 21, CAST(N'2025-06-15T22:39:20.0600000' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (182, 21, CAST(N'2025-06-15T22:40:43.0500000' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (183, 21, CAST(N'2025-06-15T22:49:48.2233333' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (184, 21, CAST(N'2025-06-15T22:59:48.3666667' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (185, 21, CAST(N'2025-06-16T00:05:05.1133333' AS DateTime2), CAST(1599000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(1299000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (186, 21, CAST(N'2025-06-16T00:07:30.7066667' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (187, 21, CAST(N'2025-06-16T00:10:40.6700000' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (188, 21, CAST(N'2025-06-16T00:14:22.7600000' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (189, 21, CAST(N'2025-06-16T00:17:05.6666667' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (190, 21, CAST(N'2025-06-16T00:24:50.0766667' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (191, 21, CAST(N'2025-06-16T00:27:47.8200000' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (192, 21, CAST(N'2025-06-16T00:28:36.5400000' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (193, 21, CAST(N'2025-06-16T00:29:05.8233333' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (194, 21, CAST(N'2025-06-16T00:30:48.1666667' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (195, 21, CAST(N'2025-06-16T00:32:16.7266667' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (196, 21, CAST(N'2025-06-16T00:33:54.7500000' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (197, 21, CAST(N'2025-06-16T00:39:22.8300000' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (198, 21, CAST(N'2025-06-16T00:40:18.0200000' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (199, 21, CAST(N'2025-06-16T00:45:09.4033333' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (200, 21, CAST(N'2025-06-16T00:51:34.7200000' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (201, 21, CAST(N'2025-06-16T01:04:14.2933333' AS DateTime2), CAST(19.1800 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7.6300 AS Decimal(18, 4)), NULL, 80, N'COMPLETED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (202, 21, CAST(N'2025-06-16T01:10:44.2200000' AS DateTime2), CAST(19.1800 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(17.2600 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (203, 21, CAST(N'2025-06-16T01:13:23.1733333' AS DateTime2), CAST(19.1800 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(17.2600 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (204, 21, CAST(N'2025-06-16T01:23:04.8933333' AS DateTime2), CAST(19.1800 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(17.2600 AS Decimal(18, 4)), NULL, 81, N'COMPLETED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (205, 21, CAST(N'2025-06-16T01:46:29.7633333' AS DateTime2), CAST(1299000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(499000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (206, 2, CAST(N'2025-06-16T10:31:54.3033333' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (207, 2, CAST(N'2025-06-16T10:34:02.2866667' AS DateTime2), CAST(61.3200 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(49.8200 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (208, 2, CAST(N'2025-06-16T10:36:33.7333333' AS DateTime2), CAST(19.1800 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(7.6300 AS Decimal(18, 4)), NULL, 84, N'COMPLETED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (209, 21, CAST(N'2025-06-16T10:51:19.6633333' AS DateTime2), CAST(61.3200 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(49.8200 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'USD')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (210, 19, CAST(N'2025-06-16T12:38:57.1033333' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (211, 19, CAST(N'2025-06-16T12:43:01.9166667' AS DateTime2), CAST(500000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(199000.0000 AS Decimal(18, 4)), NULL, 87, N'COMPLETED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (212, 21, CAST(N'2025-06-16T13:50:56.1300000' AS DateTime2), CAST(1299000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(499000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (213, 21, CAST(N'2025-06-16T13:51:17.9300000' AS DateTime2), CAST(1299000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(499000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (214, 21, CAST(N'2025-06-16T14:06:10.3233333' AS DateTime2), CAST(1299000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(499000.0000 AS Decimal(18, 4)), NULL, NULL, N'FAILED', N'VND')
GO
INSERT [dbo].[Orders] ([OrderID], [AccountID], [OrderDate], [OriginalTotalPrice], [DiscountAmount], [FinalAmount], [PromotionID], [PaymentID], [OrderStatus], [CurrencyID]) VALUES (215, 21, CAST(N'2025-06-17T13:10:29.4966667' AS DateTime2), CAST(1299000.0000 AS Decimal(18, 4)), CAST(0.0000 AS Decimal(18, 4)), CAST(499000.0000 AS Decimal(18, 4)), NULL, NULL, N'CANCELLED', N'VND')
GO
SET IDENTITY_INSERT [dbo].[Orders] OFF
GO
INSERT [dbo].[PaymentMethods] ([MethodID], [MethodName], [IconUrl], [Description]) VALUES (N'BANK_TRANSFER', N'Chuyển khoản ngân hàng', N'https://path.to/your/icons/bank_transfer.png', N'Chuyển khoản trực tiếp đến tài khoản ngân hàng của chúng tôi.')
GO
INSERT [dbo].[PaymentMethods] ([MethodID], [MethodName], [IconUrl], [Description]) VALUES (N'CRYPTO', N'Ti?n m? hóa (Crypto)', N'URL_ICON_CRYPTO_CUA_BAN', N'Thanh toán b?ng các lo?i ti?n m? hóa thông qua NOWPayments.')
GO
INSERT [dbo].[PaymentMethods] ([MethodID], [MethodName], [IconUrl], [Description]) VALUES (N'MOMO', N'Ví điện tử MoMo', N'https://path.to/your/icons/momo.png', N'Thanh toán an toàn và nhanh chóng qua ví điện tử MoMo.')
GO
INSERT [dbo].[PaymentMethods] ([MethodID], [MethodName], [IconUrl], [Description]) VALUES (N'PAYPAL', N'Ví điện tử PayPal', N'https://path.to/your/icons/paypal.png', N'Thanh toán an toàn bằng tài khoản PayPal của bạn.')
GO
INSERT [dbo].[PaymentMethods] ([MethodID], [MethodName], [IconUrl], [Description]) VALUES (N'STRIPE', N'Stripe (Th? qu?c t?)', N'https://js.stripe.com/v3/fingerprinted/img/stripe-logo-blurple-fedf5933a04a584a2736564e526d5526.svg', N'Thanh toán qua th? Visa, Mastercard, American Express,...')
GO
INSERT [dbo].[PaymentMethods] ([MethodID], [MethodName], [IconUrl], [Description]) VALUES (N'SYSTEM_CREDIT', N'Tín dụng hệ thống', N'https://path.to/your/icons/system_credit.png', N'Sử dụng số dư tín dụng có sẵn trong tài khoản của bạn.')
GO
INSERT [dbo].[PaymentMethods] ([MethodID], [MethodName], [IconUrl], [Description]) VALUES (N'VNPAY', N'Cổng thanh toán VNPAY', N'https://path.to/your/icons/vnpay.png', N'Hỗ trợ thẻ ATM nội địa, thẻ quốc tế (Visa, Master, JCB, Amex), và VNPAY-QR.')
GO
INSERT [dbo].[PaymentStatuses] ([StatusID], [StatusName]) VALUES (N'CANCELLED', N'Đã hủy')
GO
INSERT [dbo].[PaymentStatuses] ([StatusID], [StatusName]) VALUES (N'FAILED', N'Thất bại')
GO
INSERT [dbo].[PaymentStatuses] ([StatusID], [StatusName]) VALUES (N'PENDING', N'Chờ thanh toán')
GO
INSERT [dbo].[PaymentStatuses] ([StatusID], [StatusName]) VALUES (N'REFUNDED', N'Đã hoàn tiền')
GO
INSERT [dbo].[PaymentStatuses] ([StatusID], [StatusName]) VALUES (N'SUCCESS', N'Thành công')
GO
SET IDENTITY_INSERT [dbo].[Payouts] ON 
GO
INSERT [dbo].[Payouts] ([PayoutID], [InstructorID], [Amount], [CurrencyID], [ActualAmount], [ActualCurrencyID], [ExchangeRate], [PaymentMethodID], [PayoutDetails], [Fee], [PayoutStatusID], [RequestedAt], [ProcessedAt], [CompletedAt], [AdminID], [AdminNote], [CreatedAt], [UpdatedAt]) VALUES (2, 18, CAST(100000.0000 AS Decimal(18, 4)), N'VND', NULL, NULL, NULL, N'MOMO', N'{"phoneNumber":"0399038165","accountName":"Trần Nguyễn Sơn Thành"}', CAST(0.0000 AS Decimal(18, 4)), N'PAID', CAST(N'2025-06-16T11:03:26.4500000' AS DateTime2), CAST(N'2025-06-16T04:05:07.6010000' AS DateTime2), CAST(N'2025-06-16T04:05:07.5820000' AS DateTime2), 18, N'ok', CAST(N'2025-06-16T11:04:06.7666667' AS DateTime2), CAST(N'2025-06-16T04:05:07.6050000' AS DateTime2))
GO
SET IDENTITY_INSERT [dbo].[Payouts] OFF
GO
INSERT [dbo].[PayoutStatuses] ([StatusID], [StatusName]) VALUES (N'CANCELLED', N'Đã hủy')
GO
INSERT [dbo].[PayoutStatuses] ([StatusID], [StatusName]) VALUES (N'FAILED', N'Thất bại')
GO
INSERT [dbo].[PayoutStatuses] ([StatusID], [StatusName]) VALUES (N'PAID', N'Đã thanh toán')
GO
INSERT [dbo].[PayoutStatuses] ([StatusID], [StatusName]) VALUES (N'PENDING', N'Chờ xử lý')
GO
INSERT [dbo].[PayoutStatuses] ([StatusID], [StatusName]) VALUES (N'PROCESSING', N'Đang xử lý')
GO
SET IDENTITY_INSERT [dbo].[Promotions] ON 
GO
INSERT [dbo].[Promotions] ([PromotionID], [DiscountCode], [PromotionName], [Description], [DiscountType], [DiscountValue], [MinOrderValue], [MaxDiscountAmount], [StartDate], [EndDate], [MaxUsageLimit], [UsageCount], [Status], [CreatedAt], [UpdatedAt]) VALUES (1, N'SALE50', N'Giảm Giá 50%', N'sss', N'PERCENTAGE', CAST(50.0000 AS Decimal(18, 4)), NULL, NULL, CAST(N'2025-06-11T00:00:00.0000000' AS DateTime2), CAST(N'2025-07-11T00:00:00.0000000' AS DateTime2), 100, 0, N'ACTIVE', CAST(N'2025-06-11T00:45:54.7533333' AS DateTime2), CAST(N'2025-06-15T20:01:36.4700000' AS DateTime2))
GO
SET IDENTITY_INSERT [dbo].[Promotions] OFF
GO
SET IDENTITY_INSERT [dbo].[QuizAttemptAnswers] ON 
GO
INSERT [dbo].[QuizAttemptAnswers] ([AttemptAnswerID], [AttemptID], [QuestionID], [SelectedOptionID], [IsCorrect]) VALUES (37, 205, 12353, 9333, 1)
GO
INSERT [dbo].[QuizAttemptAnswers] ([AttemptAnswerID], [AttemptID], [QuestionID], [SelectedOptionID], [IsCorrect]) VALUES (38, 205, 12354, 9337, 1)
GO
INSERT [dbo].[QuizAttemptAnswers] ([AttemptAnswerID], [AttemptID], [QuestionID], [SelectedOptionID], [IsCorrect]) VALUES (39, 205, 12355, 9342, 1)
GO
INSERT [dbo].[QuizAttemptAnswers] ([AttemptAnswerID], [AttemptID], [QuestionID], [SelectedOptionID], [IsCorrect]) VALUES (40, 207, 12353, 9331, 0)
GO
INSERT [dbo].[QuizAttemptAnswers] ([AttemptAnswerID], [AttemptID], [QuestionID], [SelectedOptionID], [IsCorrect]) VALUES (41, 207, 12354, 9335, 0)
GO
INSERT [dbo].[QuizAttemptAnswers] ([AttemptAnswerID], [AttemptID], [QuestionID], [SelectedOptionID], [IsCorrect]) VALUES (42, 207, 12355, 9342, 1)
GO
SET IDENTITY_INSERT [dbo].[QuizAttemptAnswers] OFF
GO
SET IDENTITY_INSERT [dbo].[QuizAttempts] ON 
GO
INSERT [dbo].[QuizAttempts] ([AttemptID], [LessonID], [AccountID], [StartedAt], [CompletedAt], [Score], [IsPassed], [AttemptNumber]) VALUES (205, 183, 21, CAST(N'2025-06-16T01:47:41.2766667' AS DateTime2), CAST(N'2025-06-15T18:48:10.2840000' AS DateTime2), CAST(100.00 AS Decimal(5, 2)), 1, 1)
GO
INSERT [dbo].[QuizAttempts] ([AttemptID], [LessonID], [AccountID], [StartedAt], [CompletedAt], [Score], [IsPassed], [AttemptNumber]) VALUES (206, 183, 21, CAST(N'2025-06-16T10:42:19.3600000' AS DateTime2), NULL, NULL, NULL, 2)
GO
INSERT [dbo].[QuizAttempts] ([AttemptID], [LessonID], [AccountID], [StartedAt], [CompletedAt], [Score], [IsPassed], [AttemptNumber]) VALUES (207, 183, 21, CAST(N'2025-06-16T10:42:40.7633333' AS DateTime2), CAST(N'2025-06-16T03:42:54.5360000' AS DateTime2), CAST(33.33 AS Decimal(5, 2)), 0, 3)
GO
SET IDENTITY_INSERT [dbo].[QuizAttempts] OFF
GO
SET IDENTITY_INSERT [dbo].[QuizOptions] ON 
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9331, 12353, N'Thiết kế giao diện (UI)', 0, 0, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9332, 12353, N'Tạo hiệu ứng chuyển cảnh trong video', 0, 1, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9333, 12353, N'Tạo nội dung động và tương tác cho website', 1, 2, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9334, 12353, N'Quản lý cơ sở dữ liệu phía server', 0, 3, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9335, 12354, N'Chỉ ở server', 0, 0, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9336, 12354, N'Chỉ ở trình duyệt (browser)', 0, 1, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9337, 12354, N'Ở cả server và trình duyệt tùy ngữ cảnh', 1, 2, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9338, 12354, N'Trong Photoshop', 0, 3, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9339, 12355, N'Chrome', 0, 0, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9340, 12355, N'Firefox', 0, 1, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9341, 12355, N'Safari', 0, 2, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9342, 12355, N'Tất cả các trình duyệt phổ biến hiện nay đều hỗ trợ JavaScript', 1, 3, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9343, 12356, N'variable x = 10;', 0, 0, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9344, 12356, N'int x = 10;', 0, 1, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9345, 12356, N'let x = 10;', 1, 2, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9346, 12356, N'define x = 10;', 0, 3, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9347, 12357, N'const is for numbers, let is for strings', 0, 0, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9348, 12357, N'const cannot be reassigned, while let can', 1, 1, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9349, 12357, N'let creates global variables, const creates local ones', 0, 2, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9350, 12357, N'No difference at all', 0, 3, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9351, 12358, N'true', 1, 0, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9352, 12358, N'false', 0, 1, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9353, 12358, N'undefined', 0, 2, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9354, 12358, N'Error', 0, 3, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9355, 12359, N'It compares only values', 0, 0, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9356, 12359, N'It compares both values and types', 1, 1, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9357, 12359, N'It ignores types', 0, 2, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9358, 12359, N'It causes an error', 0, 3, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9359, 12360, N'unshift()', 0, 0, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9360, 12360, N'push()', 1, 1, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9361, 12360, N'append()', 0, 2, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9362, 12360, N'add()', 0, 3, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9363, 12361, N'undefined', 0, 0, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9364, 12361, N'John', 1, 1, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9365, 12361, N'"name"', 0, 2, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9366, 12361, N'Error', 0, 3, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9367, 12362, N'let newArr = oldArr;', 0, 0, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9368, 12362, N'let newArr = oldArr.copy();', 0, 1, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9369, 12362, N'let newArr = [...oldArr];', 1, 2, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9370, 12362, N'let newArr = oldArr.toArray();', 0, 3, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9379, 12363, N'Filters out unwanted values from an array', 0, 0, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9380, 12363, N'Transforms each element and returns a new array', 1, 1, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9381, 12363, N'Joins array elements into a string', 0, 2, 0)
GO
INSERT [dbo].[QuizOptions] ([OptionID], [QuestionID], [OptionText], [IsCorrectAnswer], [OptionOrder], [IsArchived]) VALUES (9382, 12363, N'Sorts the array in place', 0, 3, 0)
GO
SET IDENTITY_INSERT [dbo].[QuizOptions] OFF
GO
SET IDENTITY_INSERT [dbo].[QuizQuestions] ON 
GO
INSERT [dbo].[QuizQuestions] ([QuestionID], [LessonID], [QuestionText], [Explanation], [QuestionOrder], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (12353, 183, N'JavaScript được sử dụng chủ yếu để làm gì trên website?', N'JavaScript là ngôn ngữ lập trình chạy trên trình duyệt để xử lý các hành động tương tác (click, animation, xử lý form...), làm cho web sống động hơn.', 0, CAST(N'2025-06-14T19:38:37.5100000' AS DateTime2), CAST(N'2025-06-14T19:38:37.5100000' AS DateTime2), 0)
GO
INSERT [dbo].[QuizQuestions] ([QuestionID], [LessonID], [QuestionText], [Explanation], [QuestionOrder], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (12354, 183, N'JavaScript được chạy ở đâu trong kiến trúc web hiện đại?', N'JavaScript ban đầu chỉ chạy ở trình duyệt, nhưng hiện nay với Node.js thì nó cũng được chạy ở phía server.

', 1, CAST(N'2025-06-14T19:43:38.0433333' AS DateTime2), CAST(N'2025-06-14T19:43:38.0433333' AS DateTime2), 0)
GO
INSERT [dbo].[QuizQuestions] ([QuestionID], [LessonID], [QuestionText], [Explanation], [QuestionOrder], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (12355, 183, N'Trình duyệt nào sau đây không hỗ trợ JavaScript?', N'Các trình duyệt hiện đại đều tích hợp JavaScript Engine như V8 (Chrome), SpiderMonkey (Firefox), JavaScriptCore (Safari)...', 2, CAST(N'2025-06-14T19:44:39.4300000' AS DateTime2), CAST(N'2025-06-14T19:44:39.4300000' AS DateTime2), 0)
GO
INSERT [dbo].[QuizQuestions] ([QuestionID], [LessonID], [QuestionText], [Explanation], [QuestionOrder], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (12356, 193, N'Which of the following is the correct way to declare a variable in JavaScript?', N'let is the correct modern way to declare a variable in JavaScript. int and variable don’t exist in JS, and define is not a JS keyword.', 0, CAST(N'2025-06-14T20:19:28.2533333' AS DateTime2), CAST(N'2025-06-14T20:19:28.2533333' AS DateTime2), 0)
GO
INSERT [dbo].[QuizQuestions] ([QuestionID], [LessonID], [QuestionText], [Explanation], [QuestionOrder], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (12357, 193, N'What is the difference between let and const in JavaScript?', N'const declares a constant — it cannot be reassigned after it''s set. let allows reassignment.', 1, CAST(N'2025-06-14T20:20:09.4366667' AS DateTime2), CAST(N'2025-06-14T20:20:09.4366667' AS DateTime2), 0)
GO
INSERT [dbo].[QuizQuestions] ([QuestionID], [LessonID], [QuestionText], [Explanation], [QuestionOrder], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (12358, 193, N'What is the output of this code?

js
Copy code
let x = 5;
let y = "5";
console.log(x == y);', N'== is the loose equality operator, which converts types before comparing. 5 == "5" becomes true.', 2, CAST(N'2025-06-14T20:20:53.0700000' AS DateTime2), CAST(N'2025-06-14T20:20:53.0700000' AS DateTime2), 0)
GO
INSERT [dbo].[QuizQuestions] ([QuestionID], [LessonID], [QuestionText], [Explanation], [QuestionOrder], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (12359, 193, N'What is the result of using === instead of == in JavaScript?', NULL, 3, CAST(N'2025-06-14T20:21:15.6933333' AS DateTime2), CAST(N'2025-06-14T20:21:15.6933333' AS DateTime2), 0)
GO
INSERT [dbo].[QuizQuestions] ([QuestionID], [LessonID], [QuestionText], [Explanation], [QuestionOrder], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (12360, 195, N'Which method adds one or more elements to the end of an array in JavaScript?', N'push() is used to add elements to the end of an array.
Example:

let arr = [1, 2];
arr.push(3); // [1, 2, 3]', 0, CAST(N'2025-06-14T20:24:34.0100000' AS DateTime2), CAST(N'2025-06-14T20:24:34.0100000' AS DateTime2), 0)
GO
INSERT [dbo].[QuizQuestions] ([QuestionID], [LessonID], [QuestionText], [Explanation], [QuestionOrder], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (12361, 195, N'What does the following code output?', N'Object properties can be accessed using bracket notation (obj["key"]) or dot notation (obj.key). Both return the same value.', 1, CAST(N'2025-06-14T20:25:06.9233333' AS DateTime2), CAST(N'2025-06-14T20:25:06.9233333' AS DateTime2), 0)
GO
INSERT [dbo].[QuizQuestions] ([QuestionID], [LessonID], [QuestionText], [Explanation], [QuestionOrder], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (12362, 195, N'Which of the following will correctly create a copy of an array in JavaScript?', N'The spread operator [...] creates a shallow copy of the array. Option A just references the same array (not a real copy).', 2, CAST(N'2025-06-14T20:25:47.7300000' AS DateTime2), CAST(N'2025-06-14T20:25:47.7300000' AS DateTime2), 0)
GO
INSERT [dbo].[QuizQuestions] ([QuestionID], [LessonID], [QuestionText], [Explanation], [QuestionOrder], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (12363, 195, N'What does the .map() method do in JavaScript?', N'.map() loops through each item in an array and returns a new array with transformed values. It does not modify the original array.
let nums = [1, 2, 3];
let squared = nums.map(n => n * n); // [1, 4, 9]
', 3, CAST(N'2025-06-14T20:26:15.6166667' AS DateTime2), CAST(N'2025-06-14T13:26:49.8050000' AS DateTime2), 0)
GO
SET IDENTITY_INSERT [dbo].[QuizQuestions] OFF
GO
INSERT [dbo].[Roles] ([RoleID], [RoleName], [Description], [CreatedAt], [UpdatedAt]) VALUES (N'AD', N'Quản trị viên', N'Quản trị hệ thống (nội dung, người dùng)', CAST(N'2025-05-02T17:33:08.7100000' AS DateTime2), CAST(N'2025-05-02T17:33:08.7100000' AS DateTime2))
GO
INSERT [dbo].[Roles] ([RoleID], [RoleName], [Description], [CreatedAt], [UpdatedAt]) VALUES (N'GV', N'Giảng viên', N'Người dùng tạo và quản lý khóa học', CAST(N'2025-05-02T17:33:08.7100000' AS DateTime2), CAST(N'2025-05-02T17:33:08.7100000' AS DateTime2))
GO
INSERT [dbo].[Roles] ([RoleID], [RoleName], [Description], [CreatedAt], [UpdatedAt]) VALUES (N'NU', N'Người dùng (Học viên)', N'Người dùng đăng ký học các khóa học', CAST(N'2025-05-02T17:33:08.7100000' AS DateTime2), CAST(N'2025-05-02T17:33:08.7100000' AS DateTime2))
GO
INSERT [dbo].[Roles] ([RoleID], [RoleName], [Description], [CreatedAt], [UpdatedAt]) VALUES (N'SA', N'Super Admin', N'Quản trị cấp cao nhất', CAST(N'2025-05-02T17:33:08.7100000' AS DateTime2), CAST(N'2025-05-02T17:33:08.7100000' AS DateTime2))
GO
SET IDENTITY_INSERT [dbo].[Sections] ON 
GO
INSERT [dbo].[Sections] ([SectionID], [CourseID], [SectionName], [SectionOrder], [Description], [OriginalID], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (52, 48, N'Getting Started with JavaScript', 0, N'📝 Get familiar with JS, how it works, setup VS Code environment, DevTools, install Live Server…', NULL, CAST(N'2025-06-14T19:03:04.5133333' AS DateTime2), CAST(N'2025-06-14T13:17:36.7820000' AS DateTime2), 0)
GO
INSERT [dbo].[Sections] ([SectionID], [CourseID], [SectionName], [SectionOrder], [Description], [OriginalID], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (53, 48, N'JavaScript Basics', 1, N'📝 Basic syntax, how to declare variables (var, let, const), basic data types (string, number, boolean...).', NULL, CAST(N'2025-06-14T19:04:10.6266667' AS DateTime2), CAST(N'2025-06-14T13:17:41.9940000' AS DateTime2), 0)
GO
INSERT [dbo].[Sections] ([SectionID], [CourseID], [SectionName], [SectionOrder], [Description], [OriginalID], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (54, 48, N'Working with Data', 2, N'📝 Understand how JS does implicit casting, manual type conversion, uses logical operators, comparison operators, assignment operators...', NULL, CAST(N'2025-06-14T19:05:02.1000000' AS DateTime2), CAST(N'2025-06-14T13:17:46.5260000' AS DateTime2), 0)
GO
INSERT [dbo].[Sections] ([SectionID], [CourseID], [SectionName], [SectionOrder], [Description], [OriginalID], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (55, 48, N'Arrays & Data Structures', 3, N'📝 Introduce arrays, how to declare, access elements, and basic operations on arrays.
', NULL, CAST(N'2025-06-14T19:05:20.5966667' AS DateTime2), CAST(N'2025-06-14T13:17:51.6080000' AS DateTime2), 0)
GO
INSERT [dbo].[Sections] ([SectionID], [CourseID], [SectionName], [SectionOrder], [Description], [OriginalID], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (56, 48, N'Functions in JavaScript', 4, N'📝 What is the difference between function declaration and function expression, arrow function, how to use it correctly.
', NULL, CAST(N'2025-06-14T19:05:38.9366667' AS DateTime2), CAST(N'2025-06-14T13:17:56.1470000' AS DateTime2), 0)
GO
INSERT [dbo].[Sections] ([SectionID], [CourseID], [SectionName], [SectionOrder], [Description], [OriginalID], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (63, 55, N'Introduction to Node.js', 0, N'Giới thiệu tổng quan về Node.js và môi trường phát triển.', NULL, CAST(N'2025-06-15T01:21:22.6700000' AS DateTime2), CAST(N'2025-06-14T19:11:14.8420000' AS DateTime2), 0)
GO
INSERT [dbo].[Sections] ([SectionID], [CourseID], [SectionName], [SectionOrder], [Description], [OriginalID], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (64, 55, N'Getting Started with Node.js', 1, N'Làm quen với cú pháp, chạy thử code đầu tiên và hiểu cách Node hoạt động.', NULL, CAST(N'2025-06-15T01:22:17.1466667' AS DateTime2), CAST(N'2025-06-14T19:11:15.0280000' AS DateTime2), 0)
GO
INSERT [dbo].[Sections] ([SectionID], [CourseID], [SectionName], [SectionOrder], [Description], [OriginalID], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (65, 55, N'Modules in Node.js', 2, N'Học cách sử dụng các loại module, từ local đến built-in và exports/imports.', NULL, CAST(N'2025-06-15T01:22:54.0900000' AS DateTime2), CAST(N'2025-06-14T19:11:15.1170000' AS DateTime2), 0)
GO
INSERT [dbo].[Sections] ([SectionID], [CourseID], [SectionName], [SectionOrder], [Description], [OriginalID], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (69, 57, N'hello', 0, N'ssssssssss', NULL, CAST(N'2025-06-15T12:05:57.7266667' AS DateTime2), CAST(N'2025-06-15T12:05:57.7266667' AS DateTime2), 0)
GO
INSERT [dbo].[Sections] ([SectionID], [CourseID], [SectionName], [SectionOrder], [Description], [OriginalID], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (70, 58, N'Introduction to Python', 0, N'Giúp học viên hiểu rõ Python là gì, nó mạnh mẽ như thế nào, và tại sao nó lại là một trong những ngôn ngữ phổ biến nhất hiện nay.', NULL, CAST(N'2025-06-15T15:39:30.8233333' AS DateTime2), CAST(N'2025-06-15T09:25:46.0600000' AS DateTime2), 0)
GO
INSERT [dbo].[Sections] ([SectionID], [CourseID], [SectionName], [SectionOrder], [Description], [OriginalID], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (71, 58, N'Basic Syntax and Print Statements', 1, N'Làm quen với cú pháp cơ bản nhất trong Python – nền tảng cho mọi chương trình phức tạp hơn sau này.', NULL, CAST(N'2025-06-15T15:40:18.0133333' AS DateTime2), CAST(N'2025-06-15T09:25:46.2610000' AS DateTime2), 0)
GO
INSERT [dbo].[Sections] ([SectionID], [CourseID], [SectionName], [SectionOrder], [Description], [OriginalID], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (72, 58, N'Variables and Data Types', 2, N'Hiểu về cách lưu trữ dữ liệu và làm việc với các kiểu dữ liệu phổ biến trong Python.', NULL, CAST(N'2025-06-15T15:40:28.4800000' AS DateTime2), CAST(N'2025-06-15T09:25:46.3660000' AS DateTime2), 0)
GO
INSERT [dbo].[Sections] ([SectionID], [CourseID], [SectionName], [SectionOrder], [Description], [OriginalID], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (73, 58, N'Input and Typecasting', 3, N' Giúp bạn thu thập dữ liệu từ người dùng và xử lý dữ liệu linh hoạt bằng việc chuyển đổi kiểu dữ liệu.', NULL, CAST(N'2025-06-15T15:40:40.0100000' AS DateTime2), CAST(N'2025-06-15T09:25:46.4740000' AS DateTime2), 0)
GO
INSERT [dbo].[Sections] ([SectionID], [CourseID], [SectionName], [SectionOrder], [Description], [OriginalID], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (78, 60, N'Getting Started with TypeScript', 0, N'Giới thiệu tổng quan, setup môi trường và biên dịch code', NULL, CAST(N'2025-06-15T19:50:53.2733333' AS DateTime2), CAST(N'2025-06-16T04:02:00.7840000' AS DateTime2), 0)
GO
INSERT [dbo].[Sections] ([SectionID], [CourseID], [SectionName], [SectionOrder], [Description], [OriginalID], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (79, 60, N'Core TypeScript Basics', 1, N'Hiểu rõ kiểu dữ liệu cơ bản, cách dùng type trong TS', NULL, CAST(N'2025-06-15T19:51:37.2600000' AS DateTime2), CAST(N'2025-06-16T04:02:00.8910000' AS DateTime2), 0)
GO
INSERT [dbo].[Sections] ([SectionID], [CourseID], [SectionName], [SectionOrder], [Description], [OriginalID], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (80, 60, N'Workflow & Project Setup', 2, N'Cải thiện quy trình làm việc, dùng tsconfig.json', NULL, CAST(N'2025-06-15T19:53:21.1133333' AS DateTime2), CAST(N'2025-06-16T04:02:01.0270000' AS DateTime2), 0)
GO
INSERT [dbo].[Sections] ([SectionID], [CourseID], [SectionName], [SectionOrder], [Description], [OriginalID], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (81, 60, N'Functions in TypeScript', 3, N'Làm việc với function, khai báo, kiểu trả về,...', NULL, CAST(N'2025-06-15T19:53:56.7666667' AS DateTime2), CAST(N'2025-06-16T04:02:01.1030000' AS DateTime2), 0)
GO
INSERT [dbo].[Sections] ([SectionID], [CourseID], [SectionName], [SectionOrder], [Description], [OriginalID], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (90, 64, N'Overvieww', 0, N'dd', NULL, CAST(N'2025-06-16T13:54:29.2333333' AS DateTime2), CAST(N'2025-06-16T13:54:29.2333333' AS DateTime2), 0)
GO
INSERT [dbo].[Sections] ([SectionID], [CourseID], [SectionName], [SectionOrder], [Description], [OriginalID], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (91, 65, N'Getting Started with TypeScript', 0, N'Giới thiệu tổng quan, setup môi trường và biên dịch code', 78, CAST(N'2025-06-16T13:56:07.1733333' AS DateTime2), CAST(N'2025-06-16T13:56:07.1733333' AS DateTime2), 0)
GO
INSERT [dbo].[Sections] ([SectionID], [CourseID], [SectionName], [SectionOrder], [Description], [OriginalID], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (92, 65, N'Core TypeScript Basics', 1, N'Hiểu rõ kiểu dữ liệu cơ bản, cách dùng type trong TS', 79, CAST(N'2025-06-16T13:56:07.2333333' AS DateTime2), CAST(N'2025-06-16T13:56:07.2333333' AS DateTime2), 0)
GO
INSERT [dbo].[Sections] ([SectionID], [CourseID], [SectionName], [SectionOrder], [Description], [OriginalID], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (93, 65, N'Workflow & Project Setup', 2, N'Cải thiện quy trình làm việc, dùng tsconfig.json', 80, CAST(N'2025-06-16T13:56:07.2933333' AS DateTime2), CAST(N'2025-06-16T13:56:07.2933333' AS DateTime2), 0)
GO
INSERT [dbo].[Sections] ([SectionID], [CourseID], [SectionName], [SectionOrder], [Description], [OriginalID], [CreatedAt], [UpdatedAt], [IsArchived]) VALUES (94, 65, N'Functions in TypeScript', 3, N'Làm việc với function, khai báo, kiểu trả về,...', 81, CAST(N'2025-06-16T13:56:07.3166667' AS DateTime2), CAST(N'2025-06-16T13:56:07.3166667' AS DateTime2), 0)
GO
SET IDENTITY_INSERT [dbo].[Sections] OFF
GO
INSERT [dbo].[Settings] ([SettingKey], [SettingValue], [Description], [IsEditableByAdmin], [LastUpdated]) VALUES (N'AllowInstructorRegistration', N'false', N'Allow users to register directly as an instructor. (true/false)', 1, CAST(N'2025-06-12T10:33:01.2700000' AS DateTime2))
GO
INSERT [dbo].[Settings] ([SettingKey], [SettingValue], [Description], [IsEditableByAdmin], [LastUpdated]) VALUES (N'AllowUserRegistration', N'true', N'Allow new users to register an account. (true/false)', 1, CAST(N'2025-06-12T10:33:01.2690000' AS DateTime2))
GO
INSERT [dbo].[Settings] ([SettingKey], [SettingValue], [Description], [IsEditableByAdmin], [LastUpdated]) VALUES (N'DefaultCurrency', N'VND', N'Tiền tệ mặc định của hệ thống', 0, CAST(N'2025-04-28T22:25:25.7800000' AS DateTime2))
GO
INSERT [dbo].[Settings] ([SettingKey], [SettingValue], [Description], [IsEditableByAdmin], [LastUpdated]) VALUES (N'EnableCrypto', N'true', N'Enable or disable the Crypto (NOWPayments) gateway. (true/false)', 1, CAST(N'2025-06-15T19:58:19.4340000' AS DateTime2))
GO
INSERT [dbo].[Settings] ([SettingKey], [SettingValue], [Description], [IsEditableByAdmin], [LastUpdated]) VALUES (N'EnableMoMo', N'true', N'Enable or disable the MoMo payment gateway. (true/false)', 1, CAST(N'2025-06-14T09:01:36.0860000' AS DateTime2))
GO
INSERT [dbo].[Settings] ([SettingKey], [SettingValue], [Description], [IsEditableByAdmin], [LastUpdated]) VALUES (N'EnablePayPal', N'true', N'Enable or disable the PayPal payment gateway. (true/false)', 1, CAST(N'2025-06-14T09:01:36.0560000' AS DateTime2))
GO
INSERT [dbo].[Settings] ([SettingKey], [SettingValue], [Description], [IsEditableByAdmin], [LastUpdated]) VALUES (N'EnableStripe', N'true', N'Enable or disable the Stripe payment gateway. (true/false)', 1, CAST(N'2025-06-16T04:06:51.7290000' AS DateTime2))
GO
INSERT [dbo].[Settings] ([SettingKey], [SettingValue], [Description], [IsEditableByAdmin], [LastUpdated]) VALUES (N'EnableVnPay', N'true', N'Enable or disable the VNPay payment gateway. (true/false)', 1, CAST(N'2025-06-16T04:06:51.7020000' AS DateTime2))
GO
INSERT [dbo].[Settings] ([SettingKey], [SettingValue], [Description], [IsEditableByAdmin], [LastUpdated]) VALUES (N'InstructorSignupEnabled', N'1', N'Cho phép người dùng mới đăng ký làm giảng viên (1=Yes, 0=No)', 1, CAST(N'2025-04-28T22:25:25.7800000' AS DateTime2))
GO
INSERT [dbo].[Settings] ([SettingKey], [SettingValue], [Description], [IsEditableByAdmin], [LastUpdated]) VALUES (N'MinWithdrawalAmountUSD', N'10', N'Minimum withdrawal amount for USD currency.', 1, CAST(N'2025-06-12T16:53:18.6000000' AS DateTime2))
GO
INSERT [dbo].[Settings] ([SettingKey], [SettingValue], [Description], [IsEditableByAdmin], [LastUpdated]) VALUES (N'MinWithdrawalAmountVND', N'50000', N'Minimum withdrawal amount for VND currency.', 1, CAST(N'2025-06-12T10:39:01.2810000' AS DateTime2))
GO
INSERT [dbo].[Settings] ([SettingKey], [SettingValue], [Description], [IsEditableByAdmin], [LastUpdated]) VALUES (N'PlatformCommissionRate', N'30.00', N'The commission percentage the platform takes from each course sale (e.g., 30 for 30%).', 1, CAST(N'2025-06-12T16:58:34.5933333' AS DateTime2))
GO
INSERT [dbo].[Settings] ([SettingKey], [SettingValue], [Description], [IsEditableByAdmin], [LastUpdated]) VALUES (N'SiteLogoUrl', N'https://i.imgur.com/Fv9X0sX.jpeg', N'URL to the main logo of the site.', 1, CAST(N'2025-06-12T16:53:18.6000000' AS DateTime2))
GO
SET IDENTITY_INSERT [dbo].[Skills] ON 
GO
INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (1, N'Python', N'Ngôn ngữ lập trình đa năng, phổ biến trong khoa học dữ liệu, web và tự động hóa.', CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2), CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2))
GO
INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (2, N'JavaScript', N'Ngôn ngữ lập trình thiết yếu cho phát triển web frontend và backend (Node.js).', CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2), CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2))
GO
INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (3, N'React.js', N'Thư viện JavaScript phổ biến để xây dựng giao diện người dùng.', CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2), CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2))
GO
INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (4, N'Node.js', N'Môi trường chạy JavaScript phía máy chủ để xây dựng ứng dụng web backend.', CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2), CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2))
GO
INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (5, N'HTML', N'Ngôn ngữ đánh dấu siêu văn bản, cấu trúc cơ bản của trang web.', CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2), CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2))
GO
INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (6, N'CSS', N'Ngôn ngữ định dạng cho trang web, kiểm soát giao diện và bố cục.', CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2), CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2))
GO
INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (7, N'SQL', N'Ngôn ngữ truy vấn có cấu trúc để quản lý và thao tác cơ sở dữ liệu quan hệ.', CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2), CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2))
GO
INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (8, N'Java', N'Ngôn ngữ lập trình hướng đối tượng mạnh mẽ, dùng trong ứng dụng doanh nghiệp, Android.', CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2), CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2))
GO
INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (9, N'C#', N'Ngôn ngữ lập trình của Microsoft, phổ biến cho phát triển ứng dụng Windows và game (Unity).', CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2), CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2))
GO
INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (10, N'PHP', N'Ngôn ngữ kịch bản phía máy chủ phổ biến cho phát triển web.', CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2), CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2))
GO
INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (11, N'Machine Learning', N'Lĩnh vực trí tuệ nhân tạo tập trung vào việc xây dựng hệ thống học hỏi từ dữ liệu.', CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2), CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2))
GO
INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (12, N'Data Analysis', N'Quá trình kiểm tra, làm sạch, chuyển đổi và mô hình hóa dữ liệu để khám phá thông tin hữu ích.', CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2), CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2))
GO
INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (13, N'Data Visualization', N'Trực quan hóa dữ liệu bằng biểu đồ, đồ thị để truyền đạt thông tin hiệu quả.', CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2), CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2))
GO
INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (14, N'Deep Learning', N'Một nhánh của Machine Learning sử dụng mạng nơ-ron nhân tạo sâu.', CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2), CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2))
GO
INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (15, N'UI Design', N'Thiết kế giao diện người dùng, tập trung vào thẩm mỹ và tương tác hình ảnh.', CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2), CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2))
GO
INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (16, N'UX Design', N'Thiết kế trải nghiệm người dùng, tập trung vào sự dễ sử dụng và hài lòng của người dùng.', CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2), CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2))
GO
INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (17, N'Figma', N'Công cụ thiết kế giao diện và tạo mẫu cộng tác dựa trên nền tảng web.', CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2), CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2))
GO
INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (18, N'Adobe Photoshop', N'Phần mềm chỉnh sửa ảnh và thiết kế đồ họa raster hàng đầu.', CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2), CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2))
GO
INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (19, N'Graphic Design', N'Thiết kế đồ họa, tạo ra các yếu tố hình ảnh như logo, banner, ấn phẩm.', CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2), CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2))
GO
INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (20, N'Digital Marketing', N'Tiếp thị sản phẩm/dịch vụ sử dụng các kênh kỹ thuật số.', CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2), CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2))
GO
INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (21, N'SEO', N'Tối ưu hóa công cụ tìm kiếm để tăng thứ hạng và lưu lượng truy cập tự nhiên.', CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2), CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2))
GO
INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (22, N'Project Management', N'Quản lý dự án, lập kế hoạch, thực thi và giám sát để đạt được mục tiêu cụ thể.', CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2), CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2))
GO
INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (23, N'Business Analysis', N'Phân tích nghiệp vụ, xác định nhu cầu kinh doanh và đề xuất giải pháp.', CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2), CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2))
GO
INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (24, N'Amazon Web Services (AWS)', N'Nền tảng điện toán đám mây hàng đầu của Amazon.', CAST(N'2025-05-02T23:06:17.4200000' AS DateTime2), CAST(N'2025-05-02T23:06:17.4200000' AS DateTime2))
GO
INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (25, N'Microsoft Azure', N'Nền tảng điện toán đám mây của Microsoft.', CAST(N'2025-05-02T23:06:17.4200000' AS DateTime2), CAST(N'2025-05-02T23:06:17.4200000' AS DateTime2))
GO
INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (26, N'Docker', N'Nền tảng container hóa ứng dụng.', CAST(N'2025-05-02T23:06:17.4200000' AS DateTime2), CAST(N'2025-05-02T23:06:17.4200000' AS DateTime2))
GO
INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (27, N'DevOps', N'Triết lý và thực hành kết hợp phát triển phần mềm (Dev) và vận hành IT (Ops).', CAST(N'2025-05-02T23:06:17.4200000' AS DateTime2), CAST(N'2025-05-02T23:06:17.4200000' AS DateTime2))
GO
INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (28, N'Communication Skills', N'Kỹ năng giao tiếp hiệu quả trong môi trường làm việc và cá nhân.', CAST(N'2025-05-02T23:06:17.4200000' AS DateTime2), CAST(N'2025-05-02T23:06:17.4200000' AS DateTime2))
GO
INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (29, N'Leadership', N'Kỹ năng lãnh đạo, dẫn dắt và truyền cảm hứng cho đội nhóm.', CAST(N'2025-05-02T23:06:17.4200000' AS DateTime2), CAST(N'2025-05-02T23:06:17.4200000' AS DateTime2))
GO
SET IDENTITY_INSERT [dbo].[Skills] OFF
GO
INSERT [dbo].[UserProfiles] ([AccountID], [FullName], [AvatarUrl], [CoverImageUrl], [Gender], [BirthDate], [PhoneNumber], [Headline], [Location], [CreatedAt], [UpdatedAt], [AvatarPublicId]) VALUES (2, N'Trần Nguyễn Sơn Thành', NULL, NULL, NULL, NULL, NULL, NULL, NULL, CAST(N'2025-05-02T17:42:15.2266667' AS DateTime2), CAST(N'2025-05-02T17:42:15.2266667' AS DateTime2), NULL)
GO
INSERT [dbo].[UserProfiles] ([AccountID], [FullName], [AvatarUrl], [CoverImageUrl], [Gender], [BirthDate], [PhoneNumber], [Headline], [Location], [CreatedAt], [UpdatedAt], [AvatarPublicId]) VALUES (3, N'Trần Nguyễn Sơn Thành', NULL, NULL, NULL, NULL, NULL, NULL, NULL, CAST(N'2025-05-02T19:57:33.3966667' AS DateTime2), CAST(N'2025-05-02T19:57:33.3966667' AS DateTime2), NULL)
GO
INSERT [dbo].[UserProfiles] ([AccountID], [FullName], [AvatarUrl], [CoverImageUrl], [Gender], [BirthDate], [PhoneNumber], [Headline], [Location], [CreatedAt], [UpdatedAt], [AvatarPublicId]) VALUES (15, N'Trần Nguyễn Sơn Thành', N'https://i.imgur.com/d5p124y.png', NULL, NULL, NULL, NULL, NULL, NULL, CAST(N'2025-05-03T01:35:30.5266667' AS DateTime2), CAST(N'2025-05-03T01:35:30.5266667' AS DateTime2), NULL)
GO
INSERT [dbo].[UserProfiles] ([AccountID], [FullName], [AvatarUrl], [CoverImageUrl], [Gender], [BirthDate], [PhoneNumber], [Headline], [Location], [CreatedAt], [UpdatedAt], [AvatarPublicId]) VALUES (16, N'Trần Thanhh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, CAST(N'2025-05-03T14:20:00.9333333' AS DateTime2), CAST(N'2025-05-03T14:20:00.9333333' AS DateTime2), NULL)
GO
INSERT [dbo].[UserProfiles] ([AccountID], [FullName], [AvatarUrl], [CoverImageUrl], [Gender], [BirthDate], [PhoneNumber], [Headline], [Location], [CreatedAt], [UpdatedAt], [AvatarPublicId]) VALUES (17, N'Thành Sơn', NULL, NULL, NULL, NULL, NULL, NULL, NULL, CAST(N'2025-05-03T15:17:21.0466667' AS DateTime2), CAST(N'2025-05-03T15:17:21.0466667' AS DateTime2), NULL)
GO
INSERT [dbo].[UserProfiles] ([AccountID], [FullName], [AvatarUrl], [CoverImageUrl], [Gender], [BirthDate], [PhoneNumber], [Headline], [Location], [CreatedAt], [UpdatedAt], [AvatarPublicId]) VALUES (18, N'Super Admin 3T', N'https://res.cloudinary.com/dkuqtn6bp/image/upload/v1750016227/users/18/avatars/r8acogw0eswhghre24to.jpg', NULL, N'MALE', CAST(N'2004-03-05' AS Date), N'0399038165', N'dđ', N'93 Mỹ Xá, TP. Nam Định, Nam Định', CAST(N'2025-05-03T16:17:57.9866667' AS DateTime2), CAST(N'2025-06-16T03:55:05.0590000' AS DateTime2), NULL)
GO
INSERT [dbo].[UserProfiles] ([AccountID], [FullName], [AvatarUrl], [CoverImageUrl], [Gender], [BirthDate], [PhoneNumber], [Headline], [Location], [CreatedAt], [UpdatedAt], [AvatarPublicId]) VALUES (19, N'Thành Sơn', NULL, NULL, NULL, NULL, NULL, NULL, NULL, CAST(N'2025-06-09T21:58:19.0733333' AS DateTime2), CAST(N'2025-06-09T21:58:19.0733333' AS DateTime2), NULL)
GO
INSERT [dbo].[UserProfiles] ([AccountID], [FullName], [AvatarUrl], [CoverImageUrl], [Gender], [BirthDate], [PhoneNumber], [Headline], [Location], [CreatedAt], [UpdatedAt], [AvatarPublicId]) VALUES (20, N'T&T Exchange', NULL, NULL, NULL, NULL, NULL, NULL, NULL, CAST(N'2025-06-14T22:58:58.2300000' AS DateTime2), CAST(N'2025-06-14T22:58:58.2300000' AS DateTime2), NULL)
GO
INSERT [dbo].[UserProfiles] ([AccountID], [FullName], [AvatarUrl], [CoverImageUrl], [Gender], [BirthDate], [PhoneNumber], [Headline], [Location], [CreatedAt], [UpdatedAt], [AvatarPublicId]) VALUES (21, N'Roi Tran van', NULL, NULL, NULL, NULL, NULL, NULL, NULL, CAST(N'2025-06-15T20:52:52.5766667' AS DateTime2), CAST(N'2025-06-15T20:52:52.5766667' AS DateTime2), NULL)
GO
SET IDENTITY_INSERT [dbo].[WithdrawalRequests] ON 
GO
INSERT [dbo].[WithdrawalRequests] ([RequestID], [InstructorID], [RequestedAmount], [RequestedCurrencyID], [PaymentMethodID], [PayoutDetailsSnapshot], [Status], [InstructorNotes], [AdminID], [AdminNotes], [ProcessedAt], [PayoutID], [CreatedAt], [UpdatedAt]) VALUES (1, 18, CAST(100000.0000 AS Decimal(18, 4)), N'VND', N'MOMO', N'{"phoneNumber":"0399038165","accountName":"Trần Nguyễn Sơn Thành"}', N'COMPLETED', N'sss', 18, N'ò thì rút điiii', CAST(N'2025-06-12T12:15:33.7850000' AS DateTime2), NULL, CAST(N'2025-06-12T18:33:01.9233333' AS DateTime2), CAST(N'2025-06-12T12:32:03.4840000' AS DateTime2))
GO
INSERT [dbo].[WithdrawalRequests] ([RequestID], [InstructorID], [RequestedAmount], [RequestedCurrencyID], [PaymentMethodID], [PayoutDetailsSnapshot], [Status], [InstructorNotes], [AdminID], [AdminNotes], [ProcessedAt], [PayoutID], [CreatedAt], [UpdatedAt]) VALUES (2, 18, CAST(100000.0000 AS Decimal(18, 4)), N'VND', N'MOMO', N'{"phoneNumber":"0399038165","accountName":"Trần Nguyễn Sơn Thành"}', N'COMPLETED', N'ok', 18, N'ok', CAST(N'2025-06-16T04:04:06.7720000' AS DateTime2), 2, CAST(N'2025-06-16T11:03:26.4500000' AS DateTime2), CAST(N'2025-06-16T04:05:07.6240000' AS DateTime2))
GO
SET IDENTITY_INSERT [dbo].[WithdrawalRequests] OFF
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_Accounts_Email]    Script Date: 8/24/2026 10:41:04 AM ******/
ALTER TABLE [dbo].[Accounts] ADD  CONSTRAINT [UQ_Accounts_Email] UNIQUE NONCLUSTERED 
(
	[Email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Accounts_Email]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Accounts_Email] ON [dbo].[Accounts]
(
	[Email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Accounts_EmailVerificationToken]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Accounts_EmailVerificationToken] ON [dbo].[Accounts]
(
	[EmailVerificationToken] ASC
)
WHERE ([EmailVerificationToken] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Accounts_PasswordResetToken]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Accounts_PasswordResetToken] ON [dbo].[Accounts]
(
	[PasswordResetToken] ASC
)
WHERE ([PasswordResetToken] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Accounts_RoleID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Accounts_RoleID] ON [dbo].[Accounts]
(
	[RoleID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Accounts_Status]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Accounts_Status] ON [dbo].[Accounts]
(
	[Status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_AuthMethods_Account_LoginType]    Script Date: 8/24/2026 10:41:04 AM ******/
ALTER TABLE [dbo].[AuthMethods] ADD  CONSTRAINT [UQ_AuthMethods_Account_LoginType] UNIQUE NONCLUSTERED 
(
	[AccountID] ASC,
	[LoginType] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_AuthMethods_AccountID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_AuthMethods_AccountID] ON [dbo].[AuthMethods]
(
	[AccountID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_AuthMethods_ExternalID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_AuthMethods_ExternalID] ON [dbo].[AuthMethods]
(
	[ExternalID] ASC
)
WHERE ([ExternalID] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_AuthMethods_LoginType]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_AuthMethods_LoginType] ON [dbo].[AuthMethods]
(
	[LoginType] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_CartItems_Cart_Course]    Script Date: 8/24/2026 10:41:04 AM ******/
ALTER TABLE [dbo].[CartItems] ADD  CONSTRAINT [UQ_CartItems_Cart_Course] UNIQUE NONCLUSTERED 
(
	[CartID] ASC,
	[CourseID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_CartItems_CartID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_CartItems_CartID] ON [dbo].[CartItems]
(
	[CartID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_CartItems_CourseID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_CartItems_CourseID] ON [dbo].[CartItems]
(
	[CourseID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_Carts_AccountID]    Script Date: 8/24/2026 10:41:04 AM ******/
ALTER TABLE [dbo].[Carts] ADD  CONSTRAINT [UQ_Carts_AccountID] UNIQUE NONCLUSTERED 
(
	[AccountID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_Categories_CategoryName]    Script Date: 8/24/2026 10:41:04 AM ******/
ALTER TABLE [dbo].[Categories] ADD  CONSTRAINT [UQ_Categories_CategoryName] UNIQUE NONCLUSTERED 
(
	[CategoryName] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_Categories_Slug]    Script Date: 8/24/2026 10:41:04 AM ******/
ALTER TABLE [dbo].[Categories] ADD  CONSTRAINT [UQ_Categories_Slug] UNIQUE NONCLUSTERED 
(
	[Slug] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Categories_Slug]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Categories_Slug] ON [dbo].[Categories]
(
	[Slug] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_Certificates_Account_Course]    Script Date: 8/24/2026 10:41:04 AM ******/
ALTER TABLE [dbo].[Certificates] ADD  CONSTRAINT [UQ_Certificates_Account_Course] UNIQUE NONCLUSTERED 
(
	[AccountID] ASC,
	[CourseID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_Certificates_Code]    Script Date: 8/24/2026 10:41:04 AM ******/
ALTER TABLE [dbo].[Certificates] ADD  CONSTRAINT [UQ_Certificates_Code] UNIQUE NONCLUSTERED 
(
	[CertificateCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Certificates_AccountID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Certificates_AccountID] ON [dbo].[Certificates]
(
	[AccountID] ASC
)
INCLUDE([CourseID],[CertificateCode],[IssuedAt],[IsRevoked]) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Certificates_CourseID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Certificates_CourseID] ON [dbo].[Certificates]
(
	[CourseID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_CourseApprovalRequests_AdminID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_CourseApprovalRequests_AdminID] ON [dbo].[CourseApprovalRequests]
(
	[AdminID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_CourseApprovalRequests_CourseID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_CourseApprovalRequests_CourseID] ON [dbo].[CourseApprovalRequests]
(
	[CourseID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_CourseApprovalRequests_InstructorID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_CourseApprovalRequests_InstructorID] ON [dbo].[CourseApprovalRequests]
(
	[InstructorID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_CourseApprovalRequests_Status]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_CourseApprovalRequests_Status] ON [dbo].[CourseApprovalRequests]
(
	[Status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_CoursePayments_OrderID]    Script Date: 8/24/2026 10:41:04 AM ******/
ALTER TABLE [dbo].[CoursePayments] ADD  CONSTRAINT [UQ_CoursePayments_OrderID] UNIQUE NONCLUSTERED 
(
	[OrderID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_CoursePayments_ExternalTransactionID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_CoursePayments_ExternalTransactionID] ON [dbo].[CoursePayments]
(
	[ExternalTransactionID] ASC
)
WHERE ([ExternalTransactionID] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_CoursePayments_MethodID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_CoursePayments_MethodID] ON [dbo].[CoursePayments]
(
	[PaymentMethodID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_CoursePayments_OrderID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_CoursePayments_OrderID] ON [dbo].[CoursePayments]
(
	[OrderID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_CoursePayments_StatusID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_CoursePayments_StatusID] ON [dbo].[CoursePayments]
(
	[PaymentStatusID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_CourseReviews_Account_Course]    Script Date: 8/24/2026 10:41:04 AM ******/
ALTER TABLE [dbo].[CourseReviews] ADD  CONSTRAINT [UQ_CourseReviews_Account_Course] UNIQUE NONCLUSTERED 
(
	[AccountID] ASC,
	[CourseID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_CourseReviews_AccountID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_CourseReviews_AccountID] ON [dbo].[CourseReviews]
(
	[AccountID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_CourseReviews_Course_Rating]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_CourseReviews_Course_Rating] ON [dbo].[CourseReviews]
(
	[CourseID] ASC,
	[Rating] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_CourseReviews_CourseID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_CourseReviews_CourseID] ON [dbo].[CourseReviews]
(
	[CourseID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_Courses_Slug]    Script Date: 8/24/2026 10:41:04 AM ******/
ALTER TABLE [dbo].[Courses] ADD  CONSTRAINT [UQ_Courses_Slug] UNIQUE NONCLUSTERED 
(
	[Slug] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Courses_CategoryID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Courses_CategoryID] ON [dbo].[Courses]
(
	[CategoryID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Courses_CourseName]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Courses_CourseName] ON [dbo].[Courses]
(
	[CourseName] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Courses_InstructorID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Courses_InstructorID] ON [dbo].[Courses]
(
	[InstructorID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Courses_IsFeatured]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Courses_IsFeatured] ON [dbo].[Courses]
(
	[IsFeatured] ASC
)
INCLUDE([CourseName],[ThumbnailUrl],[OriginalPrice],[DiscountedPrice]) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Courses_IsLatestVersion_Filtered]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Courses_IsLatestVersion_Filtered] ON [dbo].[Courses]
(
	[StatusID] ASC,
	[CategoryID] ASC
)
INCLUDE([CourseName],[Slug],[OriginalPrice],[DiscountedPrice],[ThumbnailUrl]) 
WHERE ([IsLatestVersion]=(1))
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Courses_LevelID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Courses_LevelID] ON [dbo].[Courses]
(
	[LevelID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Courses_LiveCourseID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Courses_LiveCourseID] ON [dbo].[Courses]
(
	[LiveCourseID] ASC
)
WHERE ([LiveCourseID] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Courses_RootCourseID_Version]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Courses_RootCourseID_Version] ON [dbo].[Courses]
(
	[RootCourseID] ASC,
	[VersionNumber] DESC
)
INCLUDE([StatusID],[IsLatestVersion],[Slug],[CourseName]) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Courses_Slug]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Courses_Slug] ON [dbo].[Courses]
(
	[Slug] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Courses_StatusID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Courses_StatusID] ON [dbo].[Courses]
(
	[StatusID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_ChatMessages_Intent]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_ChatMessages_Intent] ON [dbo].[ChatMessages]
(
	[Intent] ASC,
	[CreatedAt] DESC
)
WHERE ([Intent] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_ChatMessages_Session]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_ChatMessages_Session] ON [dbo].[ChatMessages]
(
	[SessionID] ASC,
	[CreatedAt] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_ChatSessions_CourseID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_ChatSessions_CourseID] ON [dbo].[ChatSessions]
(
	[CourseID] ASC,
	[CreatedAt] DESC
)
WHERE ([CourseID] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_ChatSessions_Lookup]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_ChatSessions_Lookup] ON [dbo].[ChatSessions]
(
	[AccountID] ASC,
	[Scope] ASC,
	[CourseID] ASC,
	[LastMessageAt] DESC
)
INCLUDE([Title],[MessageCount],[IsArchived]) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_DiscussionPosts_Account]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_DiscussionPosts_Account] ON [dbo].[DiscussionPosts]
(
	[AccountID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_DiscussionPosts_ParentPost]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_DiscussionPosts_ParentPost] ON [dbo].[DiscussionPosts]
(
	[ParentPostID] ASC
)
WHERE ([ParentPostID] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_DiscussionPosts_ThreadCreatedAt]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_DiscussionPosts_ThreadCreatedAt] ON [dbo].[DiscussionPosts]
(
	[ThreadID] ASC,
	[CreatedAt] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_DiscussionThreads_CourseLesson]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_DiscussionThreads_CourseLesson] ON [dbo].[DiscussionThreads]
(
	[CourseID] ASC,
	[LessonID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_DiscussionThreads_CreatedBy]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_DiscussionThreads_CreatedBy] ON [dbo].[DiscussionThreads]
(
	[CreatedByAccountID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_Enrollments_Account_Course]    Script Date: 8/24/2026 10:41:04 AM ******/
ALTER TABLE [dbo].[Enrollments] ADD  CONSTRAINT [UQ_Enrollments_Account_Course] UNIQUE NONCLUSTERED 
(
	[AccountID] ASC,
	[CourseID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Enrollments_Account_IsCompleted]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Enrollments_Account_IsCompleted] ON [dbo].[Enrollments]
(
	[AccountID] ASC,
	[IsCompleted] ASC
)
INCLUDE([CourseID],[EnrolledAt],[CompletedAt]) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Enrollments_AccountID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Enrollments_AccountID] ON [dbo].[Enrollments]
(
	[AccountID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Enrollments_CourseID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Enrollments_CourseID] ON [dbo].[Enrollments]
(
	[CourseID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_ExchangeRates_From_To_Timestamp]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_ExchangeRates_From_To_Timestamp] ON [dbo].[ExchangeRates]
(
	[FromCurrencyID] ASC,
	[ToCurrencyID] ASC,
	[EffectiveTimestamp] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_InstructorBalanceTransactions_Account_Timestamp]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_InstructorBalanceTransactions_Account_Timestamp] ON [dbo].[InstructorBalanceTransactions]
(
	[AccountID] ASC,
	[TransactionTimestamp] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_InstructorBalanceTransactions_RelatedEntity]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_InstructorBalanceTransactions_RelatedEntity] ON [dbo].[InstructorBalanceTransactions]
(
	[RelatedEntityType] ASC,
	[RelatedEntityID] ASC
)
WHERE ([RelatedEntityType] IS NOT NULL AND [RelatedEntityID] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_InstructorPayoutMethod_Account_Method]    Script Date: 8/24/2026 10:41:04 AM ******/
ALTER TABLE [dbo].[InstructorPayoutMethods] ADD  CONSTRAINT [UQ_InstructorPayoutMethod_Account_Method] UNIQUE NONCLUSTERED 
(
	[AccountID] ASC,
	[MethodID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_InstructorPayoutMethods_AccountID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_InstructorPayoutMethods_AccountID] ON [dbo].[InstructorPayoutMethods]
(
	[AccountID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_InstructorPayoutMethods_MethodID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_InstructorPayoutMethods_MethodID] ON [dbo].[InstructorPayoutMethods]
(
	[MethodID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_InstructorSkills_Account_Skill]    Script Date: 8/24/2026 10:41:04 AM ******/
ALTER TABLE [dbo].[InstructorSkills] ADD  CONSTRAINT [UQ_InstructorSkills_Account_Skill] UNIQUE NONCLUSTERED 
(
	[AccountID] ASC,
	[SkillID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_InstructorSocialLinks_Account_Platform]    Script Date: 8/24/2026 10:41:04 AM ******/
ALTER TABLE [dbo].[InstructorSocialLinks] ADD  CONSTRAINT [UQ_InstructorSocialLinks_Account_Platform] UNIQUE NONCLUSTERED 
(
	[AccountID] ASC,
	[Platform] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_Languages_LanguageName]    Script Date: 8/24/2026 10:41:04 AM ******/
ALTER TABLE [dbo].[Languages] ADD  CONSTRAINT [UQ_Languages_LanguageName] UNIQUE NONCLUSTERED 
(
	[LanguageName] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_LessonAttachments_LessonID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_LessonAttachments_LessonID] ON [dbo].[LessonAttachments]
(
	[LessonID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_LessonProgress_Account_Lesson]    Script Date: 8/24/2026 10:41:04 AM ******/
ALTER TABLE [dbo].[LessonProgress] ADD  CONSTRAINT [UQ_LessonProgress_Account_Lesson] UNIQUE NONCLUSTERED 
(
	[AccountID] ASC,
	[LessonID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_LessonProgress_AccountID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_LessonProgress_AccountID] ON [dbo].[LessonProgress]
(
	[AccountID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_LessonProgress_Completion]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_LessonProgress_Completion] ON [dbo].[LessonProgress]
(
	[AccountID] ASC,
	[IsCompleted] ASC
)
INCLUDE([LessonID]) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_LessonProgress_LessonID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_LessonProgress_LessonID] ON [dbo].[LessonProgress]
(
	[LessonID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Lessons_LessonType]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Lessons_LessonType] ON [dbo].[Lessons]
(
	[LessonType] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Lessons_OriginalID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Lessons_OriginalID] ON [dbo].[Lessons]
(
	[OriginalID] ASC
)
WHERE ([OriginalID] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Lessons_SectionID_Order]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Lessons_SectionID_Order] ON [dbo].[Lessons]
(
	[SectionID] ASC,
	[LessonOrder] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_LessonSubtitles_Lesson_Lang]    Script Date: 8/24/2026 10:41:04 AM ******/
ALTER TABLE [dbo].[LessonSubtitles] ADD  CONSTRAINT [UQ_LessonSubtitles_Lesson_Lang] UNIQUE NONCLUSTERED 
(
	[LessonID] ASC,
	[LanguageCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_LessonSubtitles_LessonID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_LessonSubtitles_LessonID] ON [dbo].[LessonSubtitles]
(
	[LessonID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_Levels_LevelName]    Script Date: 8/24/2026 10:41:04 AM ******/
ALTER TABLE [dbo].[Levels] ADD  CONSTRAINT [UQ_Levels_LevelName] UNIQUE NONCLUSTERED 
(
	[LevelName] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Notifications_Recipient_IsRead_CreatedAt]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Notifications_Recipient_IsRead_CreatedAt] ON [dbo].[Notifications]
(
	[RecipientAccountID] ASC,
	[IsRead] ASC,
	[CreatedAt] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Notifications_RecipientAccountID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Notifications_RecipientAccountID] ON [dbo].[Notifications]
(
	[RecipientAccountID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_OrderItems_Order_Course]    Script Date: 8/24/2026 10:41:04 AM ******/
ALTER TABLE [dbo].[OrderItems] ADD  CONSTRAINT [UQ_OrderItems_Order_Course] UNIQUE NONCLUSTERED 
(
	[OrderID] ASC,
	[CourseID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_OrderItems_CourseID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_OrderItems_CourseID] ON [dbo].[OrderItems]
(
	[CourseID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_OrderItems_OrderID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_OrderItems_OrderID] ON [dbo].[OrderItems]
(
	[OrderID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_OrderItems_EnrollmentID_Filtered]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE UNIQUE NONCLUSTERED INDEX [UQ_OrderItems_EnrollmentID_Filtered] ON [dbo].[OrderItems]
(
	[EnrollmentID] ASC
)
WHERE ([EnrollmentID] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Orders_AccountID_Status]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Orders_AccountID_Status] ON [dbo].[Orders]
(
	[AccountID] ASC,
	[OrderStatus] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Orders_OrderDate]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Orders_OrderDate] ON [dbo].[Orders]
(
	[OrderDate] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_Orders_PaymentID_Filtered]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE UNIQUE NONCLUSTERED INDEX [UQ_Orders_PaymentID_Filtered] ON [dbo].[Orders]
(
	[PaymentID] ASC
)
WHERE ([PaymentID] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Payouts_AdminID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Payouts_AdminID] ON [dbo].[Payouts]
(
	[AdminID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Payouts_InstructorID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Payouts_InstructorID] ON [dbo].[Payouts]
(
	[InstructorID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Payouts_PayoutStatusID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Payouts_PayoutStatusID] ON [dbo].[Payouts]
(
	[PayoutStatusID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_Promotions_DiscountCode]    Script Date: 8/24/2026 10:41:04 AM ******/
ALTER TABLE [dbo].[Promotions] ADD  CONSTRAINT [UQ_Promotions_DiscountCode] UNIQUE NONCLUSTERED 
(
	[DiscountCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Promotions_DateRange]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Promotions_DateRange] ON [dbo].[Promotions]
(
	[StartDate] ASC,
	[EndDate] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Promotions_DiscountCode]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Promotions_DiscountCode] ON [dbo].[Promotions]
(
	[DiscountCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Promotions_Status]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Promotions_Status] ON [dbo].[Promotions]
(
	[Status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_QuizAttemptAnswers_AttemptID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_QuizAttemptAnswers_AttemptID] ON [dbo].[QuizAttemptAnswers]
(
	[AttemptID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_QuizAttemptAnswers_QuestionID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_QuizAttemptAnswers_QuestionID] ON [dbo].[QuizAttemptAnswers]
(
	[QuestionID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_QuizAttemptAnswers_SelectedOptionID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_QuizAttemptAnswers_SelectedOptionID] ON [dbo].[QuizAttemptAnswers]
(
	[SelectedOptionID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_QuizAttempts_Lesson_Account_Number]    Script Date: 8/24/2026 10:41:04 AM ******/
ALTER TABLE [dbo].[QuizAttempts] ADD  CONSTRAINT [UQ_QuizAttempts_Lesson_Account_Number] UNIQUE NONCLUSTERED 
(
	[LessonID] ASC,
	[AccountID] ASC,
	[AttemptNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_QuizAttempts_AccountID_LessonID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_QuizAttempts_AccountID_LessonID] ON [dbo].[QuizAttempts]
(
	[AccountID] ASC,
	[LessonID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_QuizOptions_QuestionID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_QuizOptions_QuestionID] ON [dbo].[QuizOptions]
(
	[QuestionID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_QuizQuestions_LessonID_Order]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_QuizQuestions_LessonID_Order] ON [dbo].[QuizQuestions]
(
	[LessonID] ASC,
	[QuestionOrder] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Sections_CourseID_Order]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Sections_CourseID_Order] ON [dbo].[Sections]
(
	[CourseID] ASC,
	[SectionOrder] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Sections_OriginalID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_Sections_OriginalID] ON [dbo].[Sections]
(
	[OriginalID] ASC
)
WHERE ([OriginalID] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_Skills_SkillName]    Script Date: 8/24/2026 10:41:04 AM ******/
ALTER TABLE [dbo].[Skills] ADD  CONSTRAINT [UQ_Skills_SkillName] UNIQUE NONCLUSTERED 
(
	[SkillName] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_UserProfiles_PhoneNumber_Filtered]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE UNIQUE NONCLUSTERED INDEX [UQ_UserProfiles_PhoneNumber_Filtered] ON [dbo].[UserProfiles]
(
	[PhoneNumber] ASC
)
WHERE ([PhoneNumber] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_WithdrawalRequests_AdminID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_WithdrawalRequests_AdminID] ON [dbo].[WithdrawalRequests]
(
	[AdminID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_WithdrawalRequests_InstructorID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_WithdrawalRequests_InstructorID] ON [dbo].[WithdrawalRequests]
(
	[InstructorID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_WithdrawalRequests_PayoutID]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_WithdrawalRequests_PayoutID] ON [dbo].[WithdrawalRequests]
(
	[PayoutID] ASC
)
WHERE ([PayoutID] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_WithdrawalRequests_Status]    Script Date: 8/24/2026 10:41:04 AM ******/
CREATE NONCLUSTERED INDEX [IX_WithdrawalRequests_Status] ON [dbo].[WithdrawalRequests]
(
	[Status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[Accounts] ADD  DEFAULT ('PENDING_VERIFICATION') FOR [Status]
GO
ALTER TABLE [dbo].[Accounts] ADD  DEFAULT ((0)) FOR [HasSocialLogin]
GO
ALTER TABLE [dbo].[Accounts] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Accounts] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[CartItems] ADD  DEFAULT (getdate()) FOR [AddedAt]
GO
ALTER TABLE [dbo].[Carts] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Carts] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[Categories] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Categories] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[Certificates] ADD  CONSTRAINT [DF_Certificates_Version]  DEFAULT ((1)) FOR [CourseVersionNumber]
GO
ALTER TABLE [dbo].[Certificates] ADD  CONSTRAINT [DF_Certificates_IssuedAt]  DEFAULT (getdate()) FOR [IssuedAt]
GO
ALTER TABLE [dbo].[Certificates] ADD  CONSTRAINT [DF_Certificates_IsRevoked]  DEFAULT ((0)) FOR [IsRevoked]
GO
ALTER TABLE [dbo].[CourseApprovalRequests] ADD  DEFAULT ('PENDING') FOR [Status]
GO
ALTER TABLE [dbo].[CourseApprovalRequests] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[CourseApprovalRequests] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[CoursePayments] ADD  DEFAULT ((0)) FOR [TransactionFee]
GO
ALTER TABLE [dbo].[CoursePayments] ADD  DEFAULT ('PENDING') FOR [PaymentStatusID]
GO
ALTER TABLE [dbo].[CoursePayments] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[CoursePayments] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[CourseReviews] ADD  DEFAULT (getdate()) FOR [ReviewedAt]
GO
ALTER TABLE [dbo].[Courses] ADD  DEFAULT ('vi') FOR [Language]
GO
ALTER TABLE [dbo].[Courses] ADD  DEFAULT ('DRAFT') FOR [StatusID]
GO
ALTER TABLE [dbo].[Courses] ADD  DEFAULT ((0)) FOR [IsFeatured]
GO
ALTER TABLE [dbo].[Courses] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Courses] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[Courses] ADD  DEFAULT ((0)) FOR [ReviewCount]
GO
ALTER TABLE [dbo].[Courses] ADD  CONSTRAINT [DF_Courses_VersionNumber]  DEFAULT ((1)) FOR [VersionNumber]
GO
ALTER TABLE [dbo].[Courses] ADD  CONSTRAINT [DF_Courses_IsLatestVersion]  DEFAULT ((1)) FOR [IsLatestVersion]
GO
ALTER TABLE [dbo].[ChatMessages] ADD  CONSTRAINT [DF_ChatMessages_CreatedAt]  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[ChatSessions] ADD  CONSTRAINT [DF_ChatSessions_MessageCount]  DEFAULT ((0)) FOR [MessageCount]
GO
ALTER TABLE [dbo].[ChatSessions] ADD  CONSTRAINT [DF_ChatSessions_CreatedAt]  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[ChatSessions] ADD  CONSTRAINT [DF_ChatSessions_LastMessage]  DEFAULT (getdate()) FOR [LastMessageAt]
GO
ALTER TABLE [dbo].[ChatSessions] ADD  CONSTRAINT [DF_ChatSessions_IsArchived]  DEFAULT ((0)) FOR [IsArchived]
GO
ALTER TABLE [dbo].[DiscussionPosts] ADD  DEFAULT ((0)) FOR [IsInstructorPost]
GO
ALTER TABLE [dbo].[DiscussionPosts] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[DiscussionPosts] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[DiscussionThreads] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[DiscussionThreads] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[DiscussionThreads] ADD  CONSTRAINT [DF_DiscussionThreads_IsClosed]  DEFAULT ((0)) FOR [IsClosed]
GO
ALTER TABLE [dbo].[Enrollments] ADD  DEFAULT (getdate()) FOR [EnrolledAt]
GO
ALTER TABLE [dbo].[Enrollments] ADD  CONSTRAINT [DF_Enrollments_IsCompleted]  DEFAULT ((0)) FOR [IsCompleted]
GO
ALTER TABLE [dbo].[ExchangeRates] ADD  DEFAULT (getdate()) FOR [EffectiveTimestamp]
GO
ALTER TABLE [dbo].[InstructorBalanceTransactions] ADD  DEFAULT (getdate()) FOR [TransactionTimestamp]
GO
ALTER TABLE [dbo].[InstructorPayoutMethods] ADD  DEFAULT ((0)) FOR [IsPrimary]
GO
ALTER TABLE [dbo].[InstructorPayoutMethods] ADD  DEFAULT ('ACTIVE') FOR [Status]
GO
ALTER TABLE [dbo].[InstructorPayoutMethods] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[InstructorPayoutMethods] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[InstructorProfiles] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[InstructorProfiles] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[Languages] ADD  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[Languages] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Languages] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[LessonAttachments] ADD  DEFAULT (getdate()) FOR [UploadedAt]
GO
ALTER TABLE [dbo].[LessonProgress] ADD  DEFAULT ((0)) FOR [IsCompleted]
GO
ALTER TABLE [dbo].[LessonProgress] ADD  DEFAULT ((0)) FOR [TotalTimeSpent]
GO
ALTER TABLE [dbo].[Lessons] ADD  DEFAULT ((0)) FOR [LessonOrder]
GO
ALTER TABLE [dbo].[Lessons] ADD  DEFAULT ((0)) FOR [IsFreePreview]
GO
ALTER TABLE [dbo].[Lessons] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Lessons] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[Lessons] ADD  CONSTRAINT [DF_Lessons_IsArchived]  DEFAULT ((0)) FOR [IsArchived]
GO
ALTER TABLE [dbo].[LessonSubtitles] ADD  DEFAULT ((0)) FOR [IsDefault]
GO
ALTER TABLE [dbo].[LessonSubtitles] ADD  DEFAULT (getdate()) FOR [UploadedAt]
GO
ALTER TABLE [dbo].[Levels] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Levels] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[Notifications] ADD  DEFAULT ((0)) FOR [IsRead]
GO
ALTER TABLE [dbo].[Notifications] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Orders] ADD  DEFAULT (getdate()) FOR [OrderDate]
GO
ALTER TABLE [dbo].[Orders] ADD  DEFAULT ((0)) FOR [DiscountAmount]
GO
ALTER TABLE [dbo].[Orders] ADD  DEFAULT ('PENDING_PAYMENT') FOR [OrderStatus]
GO
ALTER TABLE [dbo].[Orders] ADD  DEFAULT ('VND') FOR [CurrencyID]
GO
ALTER TABLE [dbo].[Payouts] ADD  DEFAULT ((0.0000)) FOR [Fee]
GO
ALTER TABLE [dbo].[Payouts] ADD  DEFAULT ('PENDING') FOR [PayoutStatusID]
GO
ALTER TABLE [dbo].[Payouts] ADD  DEFAULT (getdate()) FOR [RequestedAt]
GO
ALTER TABLE [dbo].[Payouts] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Payouts] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[Promotions] ADD  DEFAULT ((0)) FOR [UsageCount]
GO
ALTER TABLE [dbo].[Promotions] ADD  DEFAULT ('INACTIVE') FOR [Status]
GO
ALTER TABLE [dbo].[Promotions] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Promotions] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[QuizAttempts] ADD  DEFAULT (getdate()) FOR [StartedAt]
GO
ALTER TABLE [dbo].[QuizAttempts] ADD  DEFAULT ((1)) FOR [AttemptNumber]
GO
ALTER TABLE [dbo].[QuizOptions] ADD  DEFAULT ((0)) FOR [IsCorrectAnswer]
GO
ALTER TABLE [dbo].[QuizOptions] ADD  DEFAULT ((0)) FOR [OptionOrder]
GO
ALTER TABLE [dbo].[QuizOptions] ADD  CONSTRAINT [DF_QuizOptions_IsArchived]  DEFAULT ((0)) FOR [IsArchived]
GO
ALTER TABLE [dbo].[QuizQuestions] ADD  DEFAULT ((0)) FOR [QuestionOrder]
GO
ALTER TABLE [dbo].[QuizQuestions] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[QuizQuestions] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[QuizQuestions] ADD  CONSTRAINT [DF_QuizQuestions_IsArchived]  DEFAULT ((0)) FOR [IsArchived]
GO
ALTER TABLE [dbo].[Roles] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Roles] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[Sections] ADD  DEFAULT ((0)) FOR [SectionOrder]
GO
ALTER TABLE [dbo].[Sections] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Sections] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[Sections] ADD  CONSTRAINT [DF_Sections_IsArchived]  DEFAULT ((0)) FOR [IsArchived]
GO
ALTER TABLE [dbo].[Settings] ADD  DEFAULT ((1)) FOR [IsEditableByAdmin]
GO
ALTER TABLE [dbo].[Settings] ADD  DEFAULT (getdate()) FOR [LastUpdated]
GO
ALTER TABLE [dbo].[Skills] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Skills] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[UserProfiles] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[UserProfiles] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[WithdrawalRequests] ADD  DEFAULT ('PENDING') FOR [Status]
GO
ALTER TABLE [dbo].[WithdrawalRequests] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[WithdrawalRequests] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[Accounts]  WITH CHECK ADD  CONSTRAINT [FK_Accounts_RoleID] FOREIGN KEY([RoleID])
REFERENCES [dbo].[Roles] ([RoleID])
GO
ALTER TABLE [dbo].[Accounts] CHECK CONSTRAINT [FK_Accounts_RoleID]
GO
ALTER TABLE [dbo].[AuthMethods]  WITH CHECK ADD  CONSTRAINT [FK_AuthMethods_AccountID] FOREIGN KEY([AccountID])
REFERENCES [dbo].[Accounts] ([AccountID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[AuthMethods] CHECK CONSTRAINT [FK_AuthMethods_AccountID]
GO
ALTER TABLE [dbo].[CartItems]  WITH CHECK ADD  CONSTRAINT [FK_CartItems_CartID] FOREIGN KEY([CartID])
REFERENCES [dbo].[Carts] ([CartID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[CartItems] CHECK CONSTRAINT [FK_CartItems_CartID]
GO
ALTER TABLE [dbo].[CartItems]  WITH CHECK ADD  CONSTRAINT [FK_CartItems_CourseID] FOREIGN KEY([CourseID])
REFERENCES [dbo].[Courses] ([CourseID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[CartItems] CHECK CONSTRAINT [FK_CartItems_CourseID]
GO
ALTER TABLE [dbo].[Carts]  WITH CHECK ADD  CONSTRAINT [FK_Carts_AccountID] FOREIGN KEY([AccountID])
REFERENCES [dbo].[Accounts] ([AccountID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Carts] CHECK CONSTRAINT [FK_Carts_AccountID]
GO
ALTER TABLE [dbo].[Certificates]  WITH CHECK ADD  CONSTRAINT [FK_Certificates_AccountID] FOREIGN KEY([AccountID])
REFERENCES [dbo].[Accounts] ([AccountID])
GO
ALTER TABLE [dbo].[Certificates] CHECK CONSTRAINT [FK_Certificates_AccountID]
GO
ALTER TABLE [dbo].[Certificates]  WITH CHECK ADD  CONSTRAINT [FK_Certificates_CourseID] FOREIGN KEY([CourseID])
REFERENCES [dbo].[Courses] ([CourseID])
GO
ALTER TABLE [dbo].[Certificates] CHECK CONSTRAINT [FK_Certificates_CourseID]
GO
ALTER TABLE [dbo].[Certificates]  WITH CHECK ADD  CONSTRAINT [FK_Certificates_EnrollmentID] FOREIGN KEY([EnrollmentID])
REFERENCES [dbo].[Enrollments] ([EnrollmentID])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[Certificates] CHECK CONSTRAINT [FK_Certificates_EnrollmentID]
GO
ALTER TABLE [dbo].[Certificates]  WITH CHECK ADD  CONSTRAINT [FK_Certificates_RevokedByAdminID] FOREIGN KEY([RevokedByAdminID])
REFERENCES [dbo].[Accounts] ([AccountID])
GO
ALTER TABLE [dbo].[Certificates] CHECK CONSTRAINT [FK_Certificates_RevokedByAdminID]
GO
ALTER TABLE [dbo].[CourseApprovalRequests]  WITH CHECK ADD  CONSTRAINT [FK_CourseApprovalRequests_AdminID] FOREIGN KEY([AdminID])
REFERENCES [dbo].[Accounts] ([AccountID])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[CourseApprovalRequests] CHECK CONSTRAINT [FK_CourseApprovalRequests_AdminID]
GO
ALTER TABLE [dbo].[CourseApprovalRequests]  WITH CHECK ADD  CONSTRAINT [FK_CourseApprovalRequests_CourseID] FOREIGN KEY([CourseID])
REFERENCES [dbo].[Courses] ([CourseID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[CourseApprovalRequests] CHECK CONSTRAINT [FK_CourseApprovalRequests_CourseID]
GO
ALTER TABLE [dbo].[CourseApprovalRequests]  WITH CHECK ADD  CONSTRAINT [FK_CourseApprovalRequests_InstructorID] FOREIGN KEY([InstructorID])
REFERENCES [dbo].[Accounts] ([AccountID])
GO
ALTER TABLE [dbo].[CourseApprovalRequests] CHECK CONSTRAINT [FK_CourseApprovalRequests_InstructorID]
GO
ALTER TABLE [dbo].[CoursePayments]  WITH CHECK ADD  CONSTRAINT [FK_CoursePayments_ConvertedCurrencyID] FOREIGN KEY([ConvertedCurrencyID])
REFERENCES [dbo].[Currencies] ([CurrencyID])
GO
ALTER TABLE [dbo].[CoursePayments] CHECK CONSTRAINT [FK_CoursePayments_ConvertedCurrencyID]
GO
ALTER TABLE [dbo].[CoursePayments]  WITH CHECK ADD  CONSTRAINT [FK_CoursePayments_OrderID] FOREIGN KEY([OrderID])
REFERENCES [dbo].[Orders] ([OrderID])
GO
ALTER TABLE [dbo].[CoursePayments] CHECK CONSTRAINT [FK_CoursePayments_OrderID]
GO
ALTER TABLE [dbo].[CoursePayments]  WITH CHECK ADD  CONSTRAINT [FK_CoursePayments_OriginalCurrencyID] FOREIGN KEY([OriginalCurrencyID])
REFERENCES [dbo].[Currencies] ([CurrencyID])
GO
ALTER TABLE [dbo].[CoursePayments] CHECK CONSTRAINT [FK_CoursePayments_OriginalCurrencyID]
GO
ALTER TABLE [dbo].[CoursePayments]  WITH CHECK ADD  CONSTRAINT [FK_CoursePayments_PaymentMethodID] FOREIGN KEY([PaymentMethodID])
REFERENCES [dbo].[PaymentMethods] ([MethodID])
GO
ALTER TABLE [dbo].[CoursePayments] CHECK CONSTRAINT [FK_CoursePayments_PaymentMethodID]
GO
ALTER TABLE [dbo].[CoursePayments]  WITH CHECK ADD  CONSTRAINT [FK_CoursePayments_PaymentStatusID] FOREIGN KEY([PaymentStatusID])
REFERENCES [dbo].[PaymentStatuses] ([StatusID])
GO
ALTER TABLE [dbo].[CoursePayments] CHECK CONSTRAINT [FK_CoursePayments_PaymentStatusID]
GO
ALTER TABLE [dbo].[CourseReviews]  WITH CHECK ADD  CONSTRAINT [FK_CourseReviews_AccountID] FOREIGN KEY([AccountID])
REFERENCES [dbo].[Accounts] ([AccountID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[CourseReviews] CHECK CONSTRAINT [FK_CourseReviews_AccountID]
GO
ALTER TABLE [dbo].[CourseReviews]  WITH CHECK ADD  CONSTRAINT [FK_CourseReviews_CourseID] FOREIGN KEY([CourseID])
REFERENCES [dbo].[Courses] ([CourseID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[CourseReviews] CHECK CONSTRAINT [FK_CourseReviews_CourseID]
GO
ALTER TABLE [dbo].[Courses]  WITH CHECK ADD  CONSTRAINT [FK_Courses_CategoryID] FOREIGN KEY([CategoryID])
REFERENCES [dbo].[Categories] ([CategoryID])
GO
ALTER TABLE [dbo].[Courses] CHECK CONSTRAINT [FK_Courses_CategoryID]
GO
ALTER TABLE [dbo].[Courses]  WITH CHECK ADD  CONSTRAINT [FK_Courses_InstructorID] FOREIGN KEY([InstructorID])
REFERENCES [dbo].[Accounts] ([AccountID])
GO
ALTER TABLE [dbo].[Courses] CHECK CONSTRAINT [FK_Courses_InstructorID]
GO
ALTER TABLE [dbo].[Courses]  WITH CHECK ADD  CONSTRAINT [FK_Courses_LanguageCode] FOREIGN KEY([Language])
REFERENCES [dbo].[Languages] ([LanguageCode])
ON UPDATE CASCADE
GO
ALTER TABLE [dbo].[Courses] CHECK CONSTRAINT [FK_Courses_LanguageCode]
GO
ALTER TABLE [dbo].[Courses]  WITH CHECK ADD  CONSTRAINT [FK_Courses_LevelID] FOREIGN KEY([LevelID])
REFERENCES [dbo].[Levels] ([LevelID])
GO
ALTER TABLE [dbo].[Courses] CHECK CONSTRAINT [FK_Courses_LevelID]
GO
ALTER TABLE [dbo].[Courses]  WITH CHECK ADD  CONSTRAINT [FK_Courses_LiveCourseID] FOREIGN KEY([LiveCourseID])
REFERENCES [dbo].[Courses] ([CourseID])
GO
ALTER TABLE [dbo].[Courses] CHECK CONSTRAINT [FK_Courses_LiveCourseID]
GO
ALTER TABLE [dbo].[Courses]  WITH CHECK ADD  CONSTRAINT [FK_Courses_PreviousVersionID] FOREIGN KEY([PreviousVersionID])
REFERENCES [dbo].[Courses] ([CourseID])
GO
ALTER TABLE [dbo].[Courses] CHECK CONSTRAINT [FK_Courses_PreviousVersionID]
GO
ALTER TABLE [dbo].[Courses]  WITH CHECK ADD  CONSTRAINT [FK_Courses_RootCourseID] FOREIGN KEY([RootCourseID])
REFERENCES [dbo].[Courses] ([CourseID])
GO
ALTER TABLE [dbo].[Courses] CHECK CONSTRAINT [FK_Courses_RootCourseID]
GO
ALTER TABLE [dbo].[Courses]  WITH CHECK ADD  CONSTRAINT [FK_Courses_StatusID] FOREIGN KEY([StatusID])
REFERENCES [dbo].[CourseStatuses] ([StatusID])
GO
ALTER TABLE [dbo].[Courses] CHECK CONSTRAINT [FK_Courses_StatusID]
GO
ALTER TABLE [dbo].[ChatMessages]  WITH CHECK ADD  CONSTRAINT [FK_ChatMessages_SessionID] FOREIGN KEY([SessionID])
REFERENCES [dbo].[ChatSessions] ([SessionID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[ChatMessages] CHECK CONSTRAINT [FK_ChatMessages_SessionID]
GO
ALTER TABLE [dbo].[ChatSessions]  WITH CHECK ADD  CONSTRAINT [FK_ChatSessions_AccountID] FOREIGN KEY([AccountID])
REFERENCES [dbo].[Accounts] ([AccountID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[ChatSessions] CHECK CONSTRAINT [FK_ChatSessions_AccountID]
GO
ALTER TABLE [dbo].[ChatSessions]  WITH CHECK ADD  CONSTRAINT [FK_ChatSessions_CourseID] FOREIGN KEY([CourseID])
REFERENCES [dbo].[Courses] ([CourseID])
GO
ALTER TABLE [dbo].[ChatSessions] CHECK CONSTRAINT [FK_ChatSessions_CourseID]
GO
ALTER TABLE [dbo].[ChatSessions]  WITH CHECK ADD  CONSTRAINT [FK_ChatSessions_LessonID] FOREIGN KEY([LessonID])
REFERENCES [dbo].[Lessons] ([LessonID])
GO
ALTER TABLE [dbo].[ChatSessions] CHECK CONSTRAINT [FK_ChatSessions_LessonID]
GO
ALTER TABLE [dbo].[DiscussionPosts]  WITH CHECK ADD  CONSTRAINT [FK_DiscussionPosts_AccountID] FOREIGN KEY([AccountID])
REFERENCES [dbo].[Accounts] ([AccountID])
GO
ALTER TABLE [dbo].[DiscussionPosts] CHECK CONSTRAINT [FK_DiscussionPosts_AccountID]
GO
ALTER TABLE [dbo].[DiscussionPosts]  WITH CHECK ADD  CONSTRAINT [FK_DiscussionPosts_ParentPostID] FOREIGN KEY([ParentPostID])
REFERENCES [dbo].[DiscussionPosts] ([PostID])
GO
ALTER TABLE [dbo].[DiscussionPosts] CHECK CONSTRAINT [FK_DiscussionPosts_ParentPostID]
GO
ALTER TABLE [dbo].[DiscussionPosts]  WITH CHECK ADD  CONSTRAINT [FK_DiscussionPosts_ThreadID] FOREIGN KEY([ThreadID])
REFERENCES [dbo].[DiscussionThreads] ([ThreadID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[DiscussionPosts] CHECK CONSTRAINT [FK_DiscussionPosts_ThreadID]
GO
ALTER TABLE [dbo].[DiscussionThreads]  WITH CHECK ADD  CONSTRAINT [FK_DiscussionThreads_CourseID] FOREIGN KEY([CourseID])
REFERENCES [dbo].[Courses] ([CourseID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[DiscussionThreads] CHECK CONSTRAINT [FK_DiscussionThreads_CourseID]
GO
ALTER TABLE [dbo].[DiscussionThreads]  WITH CHECK ADD  CONSTRAINT [FK_DiscussionThreads_CreatedByAccountID] FOREIGN KEY([CreatedByAccountID])
REFERENCES [dbo].[Accounts] ([AccountID])
GO
ALTER TABLE [dbo].[DiscussionThreads] CHECK CONSTRAINT [FK_DiscussionThreads_CreatedByAccountID]
GO
ALTER TABLE [dbo].[DiscussionThreads]  WITH CHECK ADD  CONSTRAINT [FK_DiscussionThreads_LastReplier] FOREIGN KEY([LastReplierAccountID])
REFERENCES [dbo].[Accounts] ([AccountID])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[DiscussionThreads] CHECK CONSTRAINT [FK_DiscussionThreads_LastReplier]
GO
ALTER TABLE [dbo].[DiscussionThreads]  WITH CHECK ADD  CONSTRAINT [FK_DiscussionThreads_LessonID] FOREIGN KEY([LessonID])
REFERENCES [dbo].[Lessons] ([LessonID])
GO
ALTER TABLE [dbo].[DiscussionThreads] CHECK CONSTRAINT [FK_DiscussionThreads_LessonID]
GO
ALTER TABLE [dbo].[Enrollments]  WITH CHECK ADD  CONSTRAINT [FK_Enrollments_AccountID] FOREIGN KEY([AccountID])
REFERENCES [dbo].[Accounts] ([AccountID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Enrollments] CHECK CONSTRAINT [FK_Enrollments_AccountID]
GO
ALTER TABLE [dbo].[Enrollments]  WITH CHECK ADD  CONSTRAINT [FK_Enrollments_CourseID] FOREIGN KEY([CourseID])
REFERENCES [dbo].[Courses] ([CourseID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Enrollments] CHECK CONSTRAINT [FK_Enrollments_CourseID]
GO
ALTER TABLE [dbo].[ExchangeRates]  WITH CHECK ADD  CONSTRAINT [FK_ExchangeRates_FromCurrencyID] FOREIGN KEY([FromCurrencyID])
REFERENCES [dbo].[Currencies] ([CurrencyID])
GO
ALTER TABLE [dbo].[ExchangeRates] CHECK CONSTRAINT [FK_ExchangeRates_FromCurrencyID]
GO
ALTER TABLE [dbo].[ExchangeRates]  WITH CHECK ADD  CONSTRAINT [FK_ExchangeRates_ToCurrencyID] FOREIGN KEY([ToCurrencyID])
REFERENCES [dbo].[Currencies] ([CurrencyID])
GO
ALTER TABLE [dbo].[ExchangeRates] CHECK CONSTRAINT [FK_ExchangeRates_ToCurrencyID]
GO
ALTER TABLE [dbo].[InstructorBalanceTransactions]  WITH CHECK ADD  CONSTRAINT [FK_IBT_OrderItemID] FOREIGN KEY([OrderItemID])
REFERENCES [dbo].[OrderItems] ([OrderItemID])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[InstructorBalanceTransactions] CHECK CONSTRAINT [FK_IBT_OrderItemID]
GO
ALTER TABLE [dbo].[InstructorBalanceTransactions]  WITH CHECK ADD  CONSTRAINT [FK_IBT_PaymentID] FOREIGN KEY([PaymentID])
REFERENCES [dbo].[CoursePayments] ([PaymentID])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[InstructorBalanceTransactions] CHECK CONSTRAINT [FK_IBT_PaymentID]
GO
ALTER TABLE [dbo].[InstructorBalanceTransactions]  WITH CHECK ADD  CONSTRAINT [FK_InstructorBalanceTransactions_AccountID] FOREIGN KEY([AccountID])
REFERENCES [dbo].[Accounts] ([AccountID])
GO
ALTER TABLE [dbo].[InstructorBalanceTransactions] CHECK CONSTRAINT [FK_InstructorBalanceTransactions_AccountID]
GO
ALTER TABLE [dbo].[InstructorBalanceTransactions]  WITH CHECK ADD  CONSTRAINT [FK_InstructorBalanceTransactions_CurrencyID] FOREIGN KEY([CurrencyID])
REFERENCES [dbo].[Currencies] ([CurrencyID])
GO
ALTER TABLE [dbo].[InstructorBalanceTransactions] CHECK CONSTRAINT [FK_InstructorBalanceTransactions_CurrencyID]
GO
ALTER TABLE [dbo].[InstructorPayoutMethods]  WITH CHECK ADD  CONSTRAINT [FK_InstructorPayoutMethods_AccountID] FOREIGN KEY([AccountID])
REFERENCES [dbo].[Accounts] ([AccountID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[InstructorPayoutMethods] CHECK CONSTRAINT [FK_InstructorPayoutMethods_AccountID]
GO
ALTER TABLE [dbo].[InstructorPayoutMethods]  WITH CHECK ADD  CONSTRAINT [FK_InstructorPayoutMethods_MethodID] FOREIGN KEY([MethodID])
REFERENCES [dbo].[PaymentMethods] ([MethodID])
GO
ALTER TABLE [dbo].[InstructorPayoutMethods] CHECK CONSTRAINT [FK_InstructorPayoutMethods_MethodID]
GO
ALTER TABLE [dbo].[InstructorProfiles]  WITH CHECK ADD  CONSTRAINT [FK_InstructorProfiles_AccountID] FOREIGN KEY([AccountID])
REFERENCES [dbo].[Accounts] ([AccountID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[InstructorProfiles] CHECK CONSTRAINT [FK_InstructorProfiles_AccountID]
GO
ALTER TABLE [dbo].[InstructorSkills]  WITH CHECK ADD  CONSTRAINT [FK_InstructorSkills_AccountID] FOREIGN KEY([AccountID])
REFERENCES [dbo].[Accounts] ([AccountID])
GO
ALTER TABLE [dbo].[InstructorSkills] CHECK CONSTRAINT [FK_InstructorSkills_AccountID]
GO
ALTER TABLE [dbo].[InstructorSkills]  WITH CHECK ADD  CONSTRAINT [FK_InstructorSkills_SkillID] FOREIGN KEY([SkillID])
REFERENCES [dbo].[Skills] ([SkillID])
GO
ALTER TABLE [dbo].[InstructorSkills] CHECK CONSTRAINT [FK_InstructorSkills_SkillID]
GO
ALTER TABLE [dbo].[InstructorSocialLinks]  WITH CHECK ADD  CONSTRAINT [FK_InstructorSocialLinks_AccountID] FOREIGN KEY([AccountID])
REFERENCES [dbo].[Accounts] ([AccountID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[InstructorSocialLinks] CHECK CONSTRAINT [FK_InstructorSocialLinks_AccountID]
GO
ALTER TABLE [dbo].[LessonAttachments]  WITH CHECK ADD  CONSTRAINT [FK_LessonAttachments_LessonID] FOREIGN KEY([LessonID])
REFERENCES [dbo].[Lessons] ([LessonID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[LessonAttachments] CHECK CONSTRAINT [FK_LessonAttachments_LessonID]
GO
ALTER TABLE [dbo].[LessonProgress]  WITH CHECK ADD  CONSTRAINT [FK_LessonProgress_AccountID] FOREIGN KEY([AccountID])
REFERENCES [dbo].[Accounts] ([AccountID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[LessonProgress] CHECK CONSTRAINT [FK_LessonProgress_AccountID]
GO
ALTER TABLE [dbo].[LessonProgress]  WITH CHECK ADD  CONSTRAINT [FK_LessonProgress_LessonID] FOREIGN KEY([LessonID])
REFERENCES [dbo].[Lessons] ([LessonID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[LessonProgress] CHECK CONSTRAINT [FK_LessonProgress_LessonID]
GO
ALTER TABLE [dbo].[Lessons]  WITH CHECK ADD  CONSTRAINT [FK_Lessons_OriginalID] FOREIGN KEY([OriginalID])
REFERENCES [dbo].[Lessons] ([LessonID])
GO
ALTER TABLE [dbo].[Lessons] CHECK CONSTRAINT [FK_Lessons_OriginalID]
GO
ALTER TABLE [dbo].[Lessons]  WITH CHECK ADD  CONSTRAINT [FK_Lessons_SectionID] FOREIGN KEY([SectionID])
REFERENCES [dbo].[Sections] ([SectionID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Lessons] CHECK CONSTRAINT [FK_Lessons_SectionID]
GO
ALTER TABLE [dbo].[LessonSubtitles]  WITH CHECK ADD  CONSTRAINT [FK_LessonSubtitles_LanguageCode] FOREIGN KEY([LanguageCode])
REFERENCES [dbo].[Languages] ([LanguageCode])
ON UPDATE CASCADE
GO
ALTER TABLE [dbo].[LessonSubtitles] CHECK CONSTRAINT [FK_LessonSubtitles_LanguageCode]
GO
ALTER TABLE [dbo].[LessonSubtitles]  WITH CHECK ADD  CONSTRAINT [FK_LessonSubtitles_LessonID] FOREIGN KEY([LessonID])
REFERENCES [dbo].[Lessons] ([LessonID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[LessonSubtitles] CHECK CONSTRAINT [FK_LessonSubtitles_LessonID]
GO
ALTER TABLE [dbo].[Notifications]  WITH CHECK ADD  CONSTRAINT [FK_Notifications_RecipientAccountID] FOREIGN KEY([RecipientAccountID])
REFERENCES [dbo].[Accounts] ([AccountID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Notifications] CHECK CONSTRAINT [FK_Notifications_RecipientAccountID]
GO
ALTER TABLE [dbo].[OrderItems]  WITH CHECK ADD  CONSTRAINT [FK_OrderItems_CourseID] FOREIGN KEY([CourseID])
REFERENCES [dbo].[Courses] ([CourseID])
GO
ALTER TABLE [dbo].[OrderItems] CHECK CONSTRAINT [FK_OrderItems_CourseID]
GO
ALTER TABLE [dbo].[OrderItems]  WITH CHECK ADD  CONSTRAINT [FK_OrderItems_EnrollmentID] FOREIGN KEY([EnrollmentID])
REFERENCES [dbo].[Enrollments] ([EnrollmentID])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[OrderItems] CHECK CONSTRAINT [FK_OrderItems_EnrollmentID]
GO
ALTER TABLE [dbo].[OrderItems]  WITH CHECK ADD  CONSTRAINT [FK_OrderItems_OrderID] FOREIGN KEY([OrderID])
REFERENCES [dbo].[Orders] ([OrderID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[OrderItems] CHECK CONSTRAINT [FK_OrderItems_OrderID]
GO
ALTER TABLE [dbo].[Orders]  WITH CHECK ADD  CONSTRAINT [FK_Orders_AccountID] FOREIGN KEY([AccountID])
REFERENCES [dbo].[Accounts] ([AccountID])
GO
ALTER TABLE [dbo].[Orders] CHECK CONSTRAINT [FK_Orders_AccountID]
GO
ALTER TABLE [dbo].[Orders]  WITH CHECK ADD  CONSTRAINT [FK_Orders_CurrencyID] FOREIGN KEY([CurrencyID])
REFERENCES [dbo].[Currencies] ([CurrencyID])
GO
ALTER TABLE [dbo].[Orders] CHECK CONSTRAINT [FK_Orders_CurrencyID]
GO
ALTER TABLE [dbo].[Orders]  WITH CHECK ADD  CONSTRAINT [FK_Orders_PaymentID] FOREIGN KEY([PaymentID])
REFERENCES [dbo].[CoursePayments] ([PaymentID])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[Orders] CHECK CONSTRAINT [FK_Orders_PaymentID]
GO
ALTER TABLE [dbo].[Orders]  WITH CHECK ADD  CONSTRAINT [FK_Orders_PromotionID] FOREIGN KEY([PromotionID])
REFERENCES [dbo].[Promotions] ([PromotionID])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[Orders] CHECK CONSTRAINT [FK_Orders_PromotionID]
GO
ALTER TABLE [dbo].[Payouts]  WITH CHECK ADD  CONSTRAINT [FK_Payouts_ActualCurrencyID] FOREIGN KEY([ActualCurrencyID])
REFERENCES [dbo].[Currencies] ([CurrencyID])
GO
ALTER TABLE [dbo].[Payouts] CHECK CONSTRAINT [FK_Payouts_ActualCurrencyID]
GO
ALTER TABLE [dbo].[Payouts]  WITH CHECK ADD  CONSTRAINT [FK_Payouts_AdminID] FOREIGN KEY([AdminID])
REFERENCES [dbo].[Accounts] ([AccountID])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[Payouts] CHECK CONSTRAINT [FK_Payouts_AdminID]
GO
ALTER TABLE [dbo].[Payouts]  WITH CHECK ADD  CONSTRAINT [FK_Payouts_CurrencyID] FOREIGN KEY([CurrencyID])
REFERENCES [dbo].[Currencies] ([CurrencyID])
GO
ALTER TABLE [dbo].[Payouts] CHECK CONSTRAINT [FK_Payouts_CurrencyID]
GO
ALTER TABLE [dbo].[Payouts]  WITH CHECK ADD  CONSTRAINT [FK_Payouts_InstructorID] FOREIGN KEY([InstructorID])
REFERENCES [dbo].[Accounts] ([AccountID])
GO
ALTER TABLE [dbo].[Payouts] CHECK CONSTRAINT [FK_Payouts_InstructorID]
GO
ALTER TABLE [dbo].[Payouts]  WITH CHECK ADD  CONSTRAINT [FK_Payouts_PaymentMethodID] FOREIGN KEY([PaymentMethodID])
REFERENCES [dbo].[PaymentMethods] ([MethodID])
GO
ALTER TABLE [dbo].[Payouts] CHECK CONSTRAINT [FK_Payouts_PaymentMethodID]
GO
ALTER TABLE [dbo].[Payouts]  WITH CHECK ADD  CONSTRAINT [FK_Payouts_PayoutStatusID] FOREIGN KEY([PayoutStatusID])
REFERENCES [dbo].[PayoutStatuses] ([StatusID])
GO
ALTER TABLE [dbo].[Payouts] CHECK CONSTRAINT [FK_Payouts_PayoutStatusID]
GO
ALTER TABLE [dbo].[QuizAttemptAnswers]  WITH CHECK ADD  CONSTRAINT [FK_QuizAttemptAnswers_AttemptID] FOREIGN KEY([AttemptID])
REFERENCES [dbo].[QuizAttempts] ([AttemptID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[QuizAttemptAnswers] CHECK CONSTRAINT [FK_QuizAttemptAnswers_AttemptID]
GO
ALTER TABLE [dbo].[QuizAttemptAnswers]  WITH CHECK ADD  CONSTRAINT [FK_QuizAttemptAnswers_QuestionID] FOREIGN KEY([QuestionID])
REFERENCES [dbo].[QuizQuestions] ([QuestionID])
GO
ALTER TABLE [dbo].[QuizAttemptAnswers] CHECK CONSTRAINT [FK_QuizAttemptAnswers_QuestionID]
GO
ALTER TABLE [dbo].[QuizAttemptAnswers]  WITH CHECK ADD  CONSTRAINT [FK_QuizAttemptAnswers_SelectedOptionID] FOREIGN KEY([SelectedOptionID])
REFERENCES [dbo].[QuizOptions] ([OptionID])
GO
ALTER TABLE [dbo].[QuizAttemptAnswers] CHECK CONSTRAINT [FK_QuizAttemptAnswers_SelectedOptionID]
GO
ALTER TABLE [dbo].[QuizAttempts]  WITH CHECK ADD  CONSTRAINT [FK_QuizAttempts_AccountID] FOREIGN KEY([AccountID])
REFERENCES [dbo].[Accounts] ([AccountID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[QuizAttempts] CHECK CONSTRAINT [FK_QuizAttempts_AccountID]
GO
ALTER TABLE [dbo].[QuizAttempts]  WITH CHECK ADD  CONSTRAINT [FK_QuizAttempts_LessonID] FOREIGN KEY([LessonID])
REFERENCES [dbo].[Lessons] ([LessonID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[QuizAttempts] CHECK CONSTRAINT [FK_QuizAttempts_LessonID]
GO
ALTER TABLE [dbo].[QuizOptions]  WITH CHECK ADD  CONSTRAINT [FK_QuizOptions_QuestionID] FOREIGN KEY([QuestionID])
REFERENCES [dbo].[QuizQuestions] ([QuestionID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[QuizOptions] CHECK CONSTRAINT [FK_QuizOptions_QuestionID]
GO
ALTER TABLE [dbo].[QuizQuestions]  WITH CHECK ADD  CONSTRAINT [FK_QuizQuestions_LessonID] FOREIGN KEY([LessonID])
REFERENCES [dbo].[Lessons] ([LessonID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[QuizQuestions] CHECK CONSTRAINT [FK_QuizQuestions_LessonID]
GO
ALTER TABLE [dbo].[Sections]  WITH CHECK ADD  CONSTRAINT [FK_Sections_CourseID] FOREIGN KEY([CourseID])
REFERENCES [dbo].[Courses] ([CourseID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Sections] CHECK CONSTRAINT [FK_Sections_CourseID]
GO
ALTER TABLE [dbo].[Sections]  WITH CHECK ADD  CONSTRAINT [FK_Sections_OriginalID] FOREIGN KEY([OriginalID])
REFERENCES [dbo].[Sections] ([SectionID])
GO
ALTER TABLE [dbo].[Sections] CHECK CONSTRAINT [FK_Sections_OriginalID]
GO
ALTER TABLE [dbo].[UserProfiles]  WITH CHECK ADD  CONSTRAINT [FK_UserProfiles_AccountID] FOREIGN KEY([AccountID])
REFERENCES [dbo].[Accounts] ([AccountID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[UserProfiles] CHECK CONSTRAINT [FK_UserProfiles_AccountID]
GO
ALTER TABLE [dbo].[WithdrawalRequests]  WITH CHECK ADD  CONSTRAINT [FK_WithdrawalRequests_AdminID] FOREIGN KEY([AdminID])
REFERENCES [dbo].[Accounts] ([AccountID])
GO
ALTER TABLE [dbo].[WithdrawalRequests] CHECK CONSTRAINT [FK_WithdrawalRequests_AdminID]
GO
ALTER TABLE [dbo].[WithdrawalRequests]  WITH CHECK ADD  CONSTRAINT [FK_WithdrawalRequests_InstructorID] FOREIGN KEY([InstructorID])
REFERENCES [dbo].[Accounts] ([AccountID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[WithdrawalRequests] CHECK CONSTRAINT [FK_WithdrawalRequests_InstructorID]
GO
ALTER TABLE [dbo].[WithdrawalRequests]  WITH CHECK ADD  CONSTRAINT [FK_WithdrawalRequests_PaymentMethodID] FOREIGN KEY([PaymentMethodID])
REFERENCES [dbo].[PaymentMethods] ([MethodID])
GO
ALTER TABLE [dbo].[WithdrawalRequests] CHECK CONSTRAINT [FK_WithdrawalRequests_PaymentMethodID]
GO
ALTER TABLE [dbo].[WithdrawalRequests]  WITH CHECK ADD  CONSTRAINT [FK_WithdrawalRequests_PayoutID] FOREIGN KEY([PayoutID])
REFERENCES [dbo].[Payouts] ([PayoutID])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[WithdrawalRequests] CHECK CONSTRAINT [FK_WithdrawalRequests_PayoutID]
GO
ALTER TABLE [dbo].[WithdrawalRequests]  WITH CHECK ADD  CONSTRAINT [FK_WithdrawalRequests_RequestedCurrencyID] FOREIGN KEY([RequestedCurrencyID])
REFERENCES [dbo].[Currencies] ([CurrencyID])
GO
ALTER TABLE [dbo].[WithdrawalRequests] CHECK CONSTRAINT [FK_WithdrawalRequests_RequestedCurrencyID]
GO
ALTER TABLE [dbo].[Accounts]  WITH CHECK ADD  CONSTRAINT [CK_Accounts_Status] CHECK  (([Status]='PENDING_VERIFICATION' OR [Status]='BANNED' OR [Status]='INACTIVE' OR [Status]='ACTIVE'))
GO
ALTER TABLE [dbo].[Accounts] CHECK CONSTRAINT [CK_Accounts_Status]
GO
ALTER TABLE [dbo].[AuthMethods]  WITH CHECK ADD  CONSTRAINT [CK_AuthMethods_LoginType] CHECK  (([LoginType]='FACEBOOK' OR [LoginType]='GOOGLE' OR [LoginType]='EMAIL'))
GO
ALTER TABLE [dbo].[AuthMethods] CHECK CONSTRAINT [CK_AuthMethods_LoginType]
GO
ALTER TABLE [dbo].[CourseApprovalRequests]  WITH CHECK ADD  CONSTRAINT [CK_CourseApprovalRequests_RequestType] CHECK  (([RequestType]='ARCHIVE_SUBMISSION' OR [RequestType]='UPDATE_SUBMISSION' OR [RequestType]='RE_SUBMISSION' OR [RequestType]='INITIAL_SUBMISSION'))
GO
ALTER TABLE [dbo].[CourseApprovalRequests] CHECK CONSTRAINT [CK_CourseApprovalRequests_RequestType]
GO
ALTER TABLE [dbo].[CourseApprovalRequests]  WITH CHECK ADD  CONSTRAINT [CK_CourseApprovalRequests_Status] CHECK  (([Status]='NEEDS_REVISION' OR [Status]='REJECTED' OR [Status]='APPROVED' OR [Status]='PENDING'))
GO
ALTER TABLE [dbo].[CourseApprovalRequests] CHECK CONSTRAINT [CK_CourseApprovalRequests_Status]
GO
ALTER TABLE [dbo].[CourseReviews]  WITH CHECK ADD  CONSTRAINT [CK_CourseReviews_Rating] CHECK  (([Rating]>=(1) AND [Rating]<=(5)))
GO
ALTER TABLE [dbo].[CourseReviews] CHECK CONSTRAINT [CK_CourseReviews_Rating]
GO
ALTER TABLE [dbo].[Courses]  WITH CHECK ADD  CONSTRAINT [CK_Courses_DiscountedPrice] CHECK  (([DiscountedPrice] IS NULL OR [DiscountedPrice]>=(0) AND [DiscountedPrice]<=[OriginalPrice]))
GO
ALTER TABLE [dbo].[Courses] CHECK CONSTRAINT [CK_Courses_DiscountedPrice]
GO
ALTER TABLE [dbo].[Courses]  WITH CHECK ADD  CONSTRAINT [CK_Courses_OriginalPrice] CHECK  (([OriginalPrice]>=(0)))
GO
ALTER TABLE [dbo].[Courses] CHECK CONSTRAINT [CK_Courses_OriginalPrice]
GO
ALTER TABLE [dbo].[Currencies]  WITH CHECK ADD  CONSTRAINT [CK_Currencies_DecimalPlaces] CHECK  (([DecimalPlaces]>=(0)))
GO
ALTER TABLE [dbo].[Currencies] CHECK CONSTRAINT [CK_Currencies_DecimalPlaces]
GO
ALTER TABLE [dbo].[Currencies]  WITH CHECK ADD  CONSTRAINT [CK_Currencies_Type] CHECK  (([Type]='CRYPTO' OR [Type]='FIAT'))
GO
ALTER TABLE [dbo].[Currencies] CHECK CONSTRAINT [CK_Currencies_Type]
GO
ALTER TABLE [dbo].[ChatMessages]  WITH CHECK ADD  CONSTRAINT [CK_ChatMessages_Role] CHECK  (([Role]='assistant' OR [Role]='user'))
GO
ALTER TABLE [dbo].[ChatMessages] CHECK CONSTRAINT [CK_ChatMessages_Role]
GO
ALTER TABLE [dbo].[ChatSessions]  WITH CHECK ADD  CONSTRAINT [CK_ChatSessions_Scope] CHECK  (([Scope]='LESSON' OR [Scope]='COURSE' OR [Scope]='MASTER'))
GO
ALTER TABLE [dbo].[ChatSessions] CHECK CONSTRAINT [CK_ChatSessions_Scope]
GO
ALTER TABLE [dbo].[ChatSessions]  WITH CHECK ADD  CONSTRAINT [CK_ChatSessions_ScopeCourse] CHECK  (([Scope]='MASTER' AND [CourseID] IS NULL OR ([Scope]='LESSON' OR [Scope]='COURSE') AND [CourseID] IS NOT NULL))
GO
ALTER TABLE [dbo].[ChatSessions] CHECK CONSTRAINT [CK_ChatSessions_ScopeCourse]
GO
ALTER TABLE [dbo].[Enrollments]  WITH CHECK ADD  CONSTRAINT [CK_Enrollments_PurchasePrice] CHECK  (([PurchasePrice]>=(0)))
GO
ALTER TABLE [dbo].[Enrollments] CHECK CONSTRAINT [CK_Enrollments_PurchasePrice]
GO
ALTER TABLE [dbo].[ExchangeRates]  WITH CHECK ADD  CONSTRAINT [CK_ExchangeRates_Rate] CHECK  (([Rate]>(0)))
GO
ALTER TABLE [dbo].[ExchangeRates] CHECK CONSTRAINT [CK_ExchangeRates_Rate]
GO
ALTER TABLE [dbo].[InstructorBalanceTransactions]  WITH CHECK ADD  CONSTRAINT [CK_InstructorBalanceTransactions_Type] CHECK  (([Type]='ADJUSTMENT_SUB' OR [Type]='ADJUSTMENT_ADD' OR [Type]='DEBIT_FEE' OR [Type]='CREDIT_REFUND' OR [Type]='DEBIT_WITHDRAWAL' OR [Type]='CREDIT_SALE'))
GO
ALTER TABLE [dbo].[InstructorBalanceTransactions] CHECK CONSTRAINT [CK_InstructorBalanceTransactions_Type]
GO
ALTER TABLE [dbo].[InstructorBalanceTransactions]  WITH CHECK ADD  CONSTRAINT [CK_InstructorBalanceTransactions_Type_V2] CHECK  (([Type]='ADJUSTMENT_SUB' OR [Type]='ADJUSTMENT_ADD' OR [Type]='DEBIT_FEE' OR [Type]='CREDIT_REFUND' OR [Type]='DEBIT_WITHDRAWAL' OR [Type]='CREDIT_SALE'))
GO
ALTER TABLE [dbo].[InstructorBalanceTransactions] CHECK CONSTRAINT [CK_InstructorBalanceTransactions_Type_V2]
GO
ALTER TABLE [dbo].[InstructorPayoutMethods]  WITH CHECK ADD  CONSTRAINT [CK_InstructorPayoutMethods_Details_IsJson] CHECK  ((isjson([Details])=(1)))
GO
ALTER TABLE [dbo].[InstructorPayoutMethods] CHECK CONSTRAINT [CK_InstructorPayoutMethods_Details_IsJson]
GO
ALTER TABLE [dbo].[InstructorPayoutMethods]  WITH CHECK ADD  CONSTRAINT [CK_InstructorPayoutMethods_Status] CHECK  (([Status]='REQUIRES_VERIFICATION' OR [Status]='INACTIVE' OR [Status]='ACTIVE'))
GO
ALTER TABLE [dbo].[InstructorPayoutMethods] CHECK CONSTRAINT [CK_InstructorPayoutMethods_Status]
GO
ALTER TABLE [dbo].[LessonProgress]  WITH CHECK ADD  CONSTRAINT [CK_LessonProgress_LastWatchedPosition] CHECK  (([LastWatchedPosition] IS NULL OR [LastWatchedPosition]>=(0)))
GO
ALTER TABLE [dbo].[LessonProgress] CHECK CONSTRAINT [CK_LessonProgress_LastWatchedPosition]
GO
ALTER TABLE [dbo].[Lessons]  WITH CHECK ADD  CONSTRAINT [CK_Lessons_LessonType] CHECK  (([LessonType]='QUIZ' OR [LessonType]='TEXT' OR [LessonType]='VIDEO'))
GO
ALTER TABLE [dbo].[Lessons] CHECK CONSTRAINT [CK_Lessons_LessonType]
GO
ALTER TABLE [dbo].[Lessons]  WITH CHECK ADD  CONSTRAINT [CK_Lessons_VideoDurationSeconds] CHECK  (([VideoDurationSeconds] IS NULL OR [VideoDurationSeconds]>=(0)))
GO
ALTER TABLE [dbo].[Lessons] CHECK CONSTRAINT [CK_Lessons_VideoDurationSeconds]
GO
ALTER TABLE [dbo].[Lessons]  WITH CHECK ADD  CONSTRAINT [CK_Lessons_VideoSourceType] CHECK  (([VideoSourceType]='VIMEO' OR [VideoSourceType]='YOUTUBE' OR [VideoSourceType]='CLOUDINARY'))
GO
ALTER TABLE [dbo].[Lessons] CHECK CONSTRAINT [CK_Lessons_VideoSourceType]
GO
ALTER TABLE [dbo].[Orders]  WITH CHECK ADD  CONSTRAINT [CK_Orders_OrderStatus] CHECK  (([OrderStatus]='CANCELLED' OR [OrderStatus]='FAILED' OR [OrderStatus]='COMPLETED' OR [OrderStatus]='PROCESSING' OR [OrderStatus]='PENDING_PAYMENT'))
GO
ALTER TABLE [dbo].[Orders] CHECK CONSTRAINT [CK_Orders_OrderStatus]
GO
ALTER TABLE [dbo].[Promotions]  WITH CHECK ADD  CONSTRAINT [CK_Promotions_DiscountType] CHECK  (([DiscountType]='FIXED_AMOUNT' OR [DiscountType]='PERCENTAGE'))
GO
ALTER TABLE [dbo].[Promotions] CHECK CONSTRAINT [CK_Promotions_DiscountType]
GO
ALTER TABLE [dbo].[Promotions]  WITH CHECK ADD  CONSTRAINT [CK_Promotions_DiscountValue] CHECK  (([DiscountValue]>=(0)))
GO
ALTER TABLE [dbo].[Promotions] CHECK CONSTRAINT [CK_Promotions_DiscountValue]
GO
ALTER TABLE [dbo].[Promotions]  WITH CHECK ADD  CONSTRAINT [CK_Promotions_EndDate] CHECK  (([EndDate]>=[StartDate]))
GO
ALTER TABLE [dbo].[Promotions] CHECK CONSTRAINT [CK_Promotions_EndDate]
GO
ALTER TABLE [dbo].[Promotions]  WITH CHECK ADD  CONSTRAINT [CK_Promotions_MaxDiscountAmount] CHECK  (([MaxDiscountAmount] IS NULL OR [MaxDiscountAmount]>=(0)))
GO
ALTER TABLE [dbo].[Promotions] CHECK CONSTRAINT [CK_Promotions_MaxDiscountAmount]
GO
ALTER TABLE [dbo].[Promotions]  WITH CHECK ADD  CONSTRAINT [CK_Promotions_MinOrderValue] CHECK  (([MinOrderValue] IS NULL OR [MinOrderValue]>=(0)))
GO
ALTER TABLE [dbo].[Promotions] CHECK CONSTRAINT [CK_Promotions_MinOrderValue]
GO
ALTER TABLE [dbo].[Promotions]  WITH CHECK ADD  CONSTRAINT [CK_Promotions_Status] CHECK  (([Status]='EXPIRED' OR [Status]='INACTIVE' OR [Status]='ACTIVE'))
GO
ALTER TABLE [dbo].[Promotions] CHECK CONSTRAINT [CK_Promotions_Status]
GO
ALTER TABLE [dbo].[UserProfiles]  WITH CHECK ADD  CONSTRAINT [CK_UserProfiles_Gender] CHECK  (([Gender]='OTHER' OR [Gender]='FEMALE' OR [Gender]='MALE'))
GO
ALTER TABLE [dbo].[UserProfiles] CHECK CONSTRAINT [CK_UserProfiles_Gender]
GO
ALTER TABLE [dbo].[WithdrawalRequests]  WITH CHECK ADD  CONSTRAINT [CK_WithdrawalRequests_RequestedAmount] CHECK  (([RequestedAmount]>(0)))
GO
ALTER TABLE [dbo].[WithdrawalRequests] CHECK CONSTRAINT [CK_WithdrawalRequests_RequestedAmount]
GO
ALTER TABLE [dbo].[WithdrawalRequests]  WITH CHECK ADD  CONSTRAINT [CK_WithdrawalRequests_Status] CHECK  (([Status]='CANCELLED' OR [Status]='COMPLETED' OR [Status]='PROCESSING' OR [Status]='REJECTED' OR [Status]='APPROVED' OR [Status]='PENDING'))
GO
ALTER TABLE [dbo].[WithdrawalRequests] CHECK CONSTRAINT [CK_WithdrawalRequests_Status]
GO
USE [master]
GO
ALTER DATABASE [ThreeTEduTechLMS] SET  READ_WRITE 
GO
