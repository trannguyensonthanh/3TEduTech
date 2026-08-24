USE [master]
GO
/****** Object:  Database [ThreeTEduTechLMS]    Script Date: 8/19/2026 10:39:18 AM ******/
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
/****** Object:  User [ThreeTEduTechLMS_AppUser]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE USER [ThreeTEduTechLMS_AppUser] FOR LOGIN [ThreeTEduTechLMS_AppUser] WITH DEFAULT_SCHEMA=[dbo]
GO
ALTER ROLE [db_datareader] ADD MEMBER [ThreeTEduTechLMS_AppUser]
GO
ALTER ROLE [db_datawriter] ADD MEMBER [ThreeTEduTechLMS_AppUser]
GO
/****** Object:  Table [dbo].[Enrollments]    Script Date: 8/19/2026 10:39:19 AM ******/
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
 CONSTRAINT [PK_Enrollments] PRIMARY KEY CLUSTERED 
(
	[EnrollmentID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_Enrollments_Account_Course] UNIQUE NONCLUSTERED 
(
	[AccountID] ASC,
	[CourseID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Courses]    Script Date: 8/19/2026 10:39:19 AM ******/
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
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_Courses_Slug] UNIQUE NONCLUSTERED 
(
	[Slug] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET QUOTED_IDENTIFIER ON
GO

SET QUOTED_IDENTIFIER ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET QUOTED_IDENTIFIER ON
GO

/****** Object:  Table [dbo].[Accounts]    Script Date: 8/19/2026 10:39:19 AM ******/
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
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_Accounts_Email] UNIQUE NONCLUSTERED 
(
	[Email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[AuthMethods]    Script Date: 8/19/2026 10:39:19 AM ******/
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
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_AuthMethods_Account_LoginType] UNIQUE NONCLUSTERED 
(
	[AccountID] ASC,
	[LoginType] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CartItems]    Script Date: 8/19/2026 10:39:19 AM ******/
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
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_CartItems_Cart_Course] UNIQUE NONCLUSTERED 
(
	[CartID] ASC,
	[CourseID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Carts]    Script Date: 8/19/2026 10:39:19 AM ******/
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
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_Carts_AccountID] UNIQUE NONCLUSTERED 
(
	[AccountID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Categories]    Script Date: 8/19/2026 10:39:19 AM ******/
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
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_Categories_CategoryName] UNIQUE NONCLUSTERED 
(
	[CategoryName] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_Categories_Slug] UNIQUE NONCLUSTERED 
(
	[Slug] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
SET QUOTED_IDENTIFIER ON
GO
/****** Object:  Table [dbo].[CourseApprovalRequests]    Script Date: 8/19/2026 10:39:19 AM ******/
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
/****** Object:  Table [dbo].[CoursePayments]    Script Date: 8/19/2026 10:39:19 AM ******/
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
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_CoursePayments_OrderID] UNIQUE NONCLUSTERED 
(
	[OrderID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CourseReviews]    Script Date: 8/19/2026 10:39:19 AM ******/
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
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_CourseReviews_Account_Course] UNIQUE NONCLUSTERED 
(
	[AccountID] ASC,
	[CourseID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CourseStatuses]    Script Date: 8/19/2026 10:39:19 AM ******/
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
/****** Object:  Table [dbo].[Currencies]    Script Date: 8/19/2026 10:39:19 AM ******/
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
/****** Object:  Table [dbo].[DiscussionPosts]    Script Date: 8/19/2026 10:39:19 AM ******/
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
/****** Object:  Table [dbo].[DiscussionThreads]    Script Date: 8/19/2026 10:39:19 AM ******/
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
/****** Object:  Table [dbo].[ExchangeRates]    Script Date: 8/19/2026 10:39:19 AM ******/
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
/****** Object:  Table [dbo].[InstructorBalanceTransactions]    Script Date: 8/19/2026 10:39:19 AM ******/
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
/****** Object:  Table [dbo].[InstructorPayoutMethods]    Script Date: 8/19/2026 10:39:19 AM ******/
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
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_InstructorPayoutMethod_Account_Method] UNIQUE NONCLUSTERED 
(
	[AccountID] ASC,
	[MethodID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[InstructorProfiles]    Script Date: 8/19/2026 10:39:19 AM ******/
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
/****** Object:  Table [dbo].[InstructorSkills]    Script Date: 8/19/2026 10:39:19 AM ******/
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
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_InstructorSkills_Account_Skill] UNIQUE NONCLUSTERED 
(
	[AccountID] ASC,
	[SkillID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[InstructorSocialLinks]    Script Date: 8/19/2026 10:39:19 AM ******/
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
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_InstructorSocialLinks_Account_Platform] UNIQUE NONCLUSTERED 
(
	[AccountID] ASC,
	[Platform] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Languages]    Script Date: 8/19/2026 10:39:19 AM ******/
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
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_Languages_LanguageName] UNIQUE NONCLUSTERED 
(
	[LanguageName] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[LessonAttachments]    Script Date: 8/19/2026 10:39:19 AM ******/
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
/****** Object:  Table [dbo].[LessonProgress]    Script Date: 8/19/2026 10:39:19 AM ******/
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
 CONSTRAINT [PK_LessonProgress] PRIMARY KEY CLUSTERED 
(
	[ProgressID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_LessonProgress_Account_Lesson] UNIQUE NONCLUSTERED 
(
	[AccountID] ASC,
	[LessonID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Lessons]    Script Date: 8/19/2026 10:39:19 AM ******/
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
/****** Object:  Table [dbo].[LessonSubtitles]    Script Date: 8/19/2026 10:39:19 AM ******/
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
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_LessonSubtitles_Lesson_Lang] UNIQUE NONCLUSTERED 
(
	[LessonID] ASC,
	[LanguageCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Levels]    Script Date: 8/19/2026 10:39:19 AM ******/
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
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_Levels_LevelName] UNIQUE NONCLUSTERED 
(
	[LevelName] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Notifications]    Script Date: 8/19/2026 10:39:19 AM ******/
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
/****** Object:  Table [dbo].[OrderItems]    Script Date: 8/19/2026 10:39:19 AM ******/
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
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_OrderItems_Order_Course] UNIQUE NONCLUSTERED 
(
	[OrderID] ASC,
	[CourseID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Orders]    Script Date: 8/19/2026 10:39:19 AM ******/
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
/****** Object:  Table [dbo].[PaymentMethods]    Script Date: 8/19/2026 10:39:19 AM ******/
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
/****** Object:  Table [dbo].[PaymentStatuses]    Script Date: 8/19/2026 10:39:19 AM ******/
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
/****** Object:  Table [dbo].[Payouts]    Script Date: 8/19/2026 10:39:19 AM ******/
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
/****** Object:  Table [dbo].[PayoutStatuses]    Script Date: 8/19/2026 10:39:19 AM ******/
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
/****** Object:  Table [dbo].[Promotions]    Script Date: 8/19/2026 10:39:19 AM ******/
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
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_Promotions_DiscountCode] UNIQUE NONCLUSTERED 
(
	[DiscountCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[QuizAttemptAnswers]    Script Date: 8/19/2026 10:39:19 AM ******/
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
/****** Object:  Table [dbo].[QuizAttempts]    Script Date: 8/19/2026 10:39:19 AM ******/
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
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_QuizAttempts_Lesson_Account_Number] UNIQUE NONCLUSTERED 
(
	[LessonID] ASC,
	[AccountID] ASC,
	[AttemptNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[QuizOptions]    Script Date: 8/19/2026 10:39:19 AM ******/
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
/****** Object:  Table [dbo].[QuizQuestions]    Script Date: 8/19/2026 10:39:19 AM ******/
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
/****** Object:  Table [dbo].[Roles]    Script Date: 8/19/2026 10:39:19 AM ******/
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
/****** Object:  Table [dbo].[Sections]    Script Date: 8/19/2026 10:39:19 AM ******/
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
/****** Object:  Table [dbo].[Settings]    Script Date: 8/19/2026 10:39:19 AM ******/
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
/****** Object:  Table [dbo].[Skills]    Script Date: 8/19/2026 10:39:19 AM ******/
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
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_Skills_SkillName] UNIQUE NONCLUSTERED 
(
	[SkillName] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[UserProfiles]    Script Date: 8/19/2026 10:39:19 AM ******/
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
/****** Object:  Table [dbo].[WithdrawalRequests]    Script Date: 8/19/2026 10:39:19 AM ******/
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
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Accounts_Email]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Accounts_Email] ON [dbo].[Accounts]
(
	[Email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Accounts_EmailVerificationToken]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Accounts_EmailVerificationToken] ON [dbo].[Accounts]
(
	[EmailVerificationToken] ASC
)
WHERE ([EmailVerificationToken] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Accounts_PasswordResetToken]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Accounts_PasswordResetToken] ON [dbo].[Accounts]
(
	[PasswordResetToken] ASC
)
WHERE ([PasswordResetToken] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Accounts_RoleID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Accounts_RoleID] ON [dbo].[Accounts]
(
	[RoleID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Accounts_Status]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Accounts_Status] ON [dbo].[Accounts]
(
	[Status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_AuthMethods_AccountID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_AuthMethods_AccountID] ON [dbo].[AuthMethods]
(
	[AccountID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_AuthMethods_ExternalID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_AuthMethods_ExternalID] ON [dbo].[AuthMethods]
(
	[ExternalID] ASC
)
WHERE ([ExternalID] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_AuthMethods_LoginType]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_AuthMethods_LoginType] ON [dbo].[AuthMethods]
(
	[LoginType] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_CartItems_CartID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_CartItems_CartID] ON [dbo].[CartItems]
(
	[CartID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_CartItems_CourseID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_CartItems_CourseID] ON [dbo].[CartItems]
(
	[CourseID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Categories_Slug]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Categories_Slug] ON [dbo].[Categories]
(
	[Slug] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Certificates_AccountID]    Script Date: 8/19/2026 10:39:19 AM ******/
/****** Object:  Index [IX_Certificates_CourseID]    Script Date: 8/19/2026 10:39:19 AM ******/
/****** Object:  Index [IX_CourseApprovalRequests_AdminID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_CourseApprovalRequests_AdminID] ON [dbo].[CourseApprovalRequests]
(
	[AdminID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_CourseApprovalRequests_CourseID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_CourseApprovalRequests_CourseID] ON [dbo].[CourseApprovalRequests]
(
	[CourseID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_CourseApprovalRequests_InstructorID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_CourseApprovalRequests_InstructorID] ON [dbo].[CourseApprovalRequests]
(
	[InstructorID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_CourseApprovalRequests_Status]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_CourseApprovalRequests_Status] ON [dbo].[CourseApprovalRequests]
(
	[Status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_CoursePayments_ExternalTransactionID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_CoursePayments_ExternalTransactionID] ON [dbo].[CoursePayments]
(
	[ExternalTransactionID] ASC
)
WHERE ([ExternalTransactionID] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_CoursePayments_MethodID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_CoursePayments_MethodID] ON [dbo].[CoursePayments]
(
	[PaymentMethodID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_CoursePayments_OrderID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_CoursePayments_OrderID] ON [dbo].[CoursePayments]
(
	[OrderID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_CoursePayments_StatusID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_CoursePayments_StatusID] ON [dbo].[CoursePayments]
(
	[PaymentStatusID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_CourseReviews_AccountID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_CourseReviews_AccountID] ON [dbo].[CourseReviews]
(
	[AccountID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_CourseReviews_Course_Rating]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_CourseReviews_Course_Rating] ON [dbo].[CourseReviews]
(
	[CourseID] ASC,
	[Rating] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_CourseReviews_CourseID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_CourseReviews_CourseID] ON [dbo].[CourseReviews]
(
	[CourseID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Courses_CategoryID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Courses_CategoryID] ON [dbo].[Courses]
(
	[CategoryID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Courses_CourseName]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Courses_CourseName] ON [dbo].[Courses]
(
	[CourseName] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Courses_InstructorID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Courses_InstructorID] ON [dbo].[Courses]
(
	[InstructorID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Courses_IsFeatured]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Courses_IsFeatured] ON [dbo].[Courses]
(
	[IsFeatured] ASC
)
INCLUDE([CourseName],[ThumbnailUrl],[OriginalPrice],[DiscountedPrice]) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Courses_IsLatestVersion_Filtered]    Script Date: 8/19/2026 10:39:19 AM ******/
/****** Object:  Index [IX_Courses_LevelID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Courses_LevelID] ON [dbo].[Courses]
(
	[LevelID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Courses_LiveCourseID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Courses_LiveCourseID] ON [dbo].[Courses]
(
	[LiveCourseID] ASC
)
WHERE ([LiveCourseID] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Courses_RootCourseID_Version]    Script Date: 8/19/2026 10:39:19 AM ******/
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Courses_Slug]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Courses_Slug] ON [dbo].[Courses]
(
	[Slug] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Courses_StatusID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Courses_StatusID] ON [dbo].[Courses]
(
	[StatusID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_ChatMessages_Intent]    Script Date: 8/19/2026 10:39:19 AM ******/
/****** Object:  Index [IX_ChatMessages_Session]    Script Date: 8/19/2026 10:39:19 AM ******/
/****** Object:  Index [IX_ChatSessions_CourseID]    Script Date: 8/19/2026 10:39:19 AM ******/
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_ChatSessions_Lookup]    Script Date: 8/19/2026 10:39:19 AM ******/
/****** Object:  Index [IX_DiscussionPosts_Account]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_DiscussionPosts_Account] ON [dbo].[DiscussionPosts]
(
	[AccountID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_DiscussionPosts_ParentPost]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_DiscussionPosts_ParentPost] ON [dbo].[DiscussionPosts]
(
	[ParentPostID] ASC
)
WHERE ([ParentPostID] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_DiscussionPosts_ThreadCreatedAt]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_DiscussionPosts_ThreadCreatedAt] ON [dbo].[DiscussionPosts]
(
	[ThreadID] ASC,
	[CreatedAt] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_DiscussionThreads_CourseLesson]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_DiscussionThreads_CourseLesson] ON [dbo].[DiscussionThreads]
(
	[CourseID] ASC,
	[LessonID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_DiscussionThreads_CreatedBy]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_DiscussionThreads_CreatedBy] ON [dbo].[DiscussionThreads]
(
	[CreatedByAccountID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Enrollments_Account_IsCompleted]    Script Date: 8/19/2026 10:39:19 AM ******/
/****** Object:  Index [IX_Enrollments_AccountID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Enrollments_AccountID] ON [dbo].[Enrollments]
(
	[AccountID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Enrollments_CourseID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Enrollments_CourseID] ON [dbo].[Enrollments]
(
	[CourseID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_ExchangeRates_From_To_Timestamp]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_ExchangeRates_From_To_Timestamp] ON [dbo].[ExchangeRates]
(
	[FromCurrencyID] ASC,
	[ToCurrencyID] ASC,
	[EffectiveTimestamp] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_InstructorBalanceTransactions_Account_Timestamp]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_InstructorBalanceTransactions_Account_Timestamp] ON [dbo].[InstructorBalanceTransactions]
(
	[AccountID] ASC,
	[TransactionTimestamp] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_InstructorBalanceTransactions_RelatedEntity]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_InstructorBalanceTransactions_RelatedEntity] ON [dbo].[InstructorBalanceTransactions]
(
	[RelatedEntityType] ASC,
	[RelatedEntityID] ASC
)
WHERE ([RelatedEntityType] IS NOT NULL AND [RelatedEntityID] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_InstructorPayoutMethods_AccountID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_InstructorPayoutMethods_AccountID] ON [dbo].[InstructorPayoutMethods]
(
	[AccountID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_InstructorPayoutMethods_MethodID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_InstructorPayoutMethods_MethodID] ON [dbo].[InstructorPayoutMethods]
(
	[MethodID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_LessonAttachments_LessonID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_LessonAttachments_LessonID] ON [dbo].[LessonAttachments]
(
	[LessonID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_LessonProgress_AccountID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_LessonProgress_AccountID] ON [dbo].[LessonProgress]
(
	[AccountID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_LessonProgress_Completion]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_LessonProgress_Completion] ON [dbo].[LessonProgress]
(
	[AccountID] ASC,
	[IsCompleted] ASC
)
INCLUDE([LessonID]) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_LessonProgress_LessonID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_LessonProgress_LessonID] ON [dbo].[LessonProgress]
(
	[LessonID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Lessons_LessonType]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Lessons_LessonType] ON [dbo].[Lessons]
(
	[LessonType] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Lessons_OriginalID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Lessons_OriginalID] ON [dbo].[Lessons]
(
	[OriginalID] ASC
)
WHERE ([OriginalID] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Lessons_SectionID_Order]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Lessons_SectionID_Order] ON [dbo].[Lessons]
(
	[SectionID] ASC,
	[LessonOrder] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_LessonSubtitles_LessonID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_LessonSubtitles_LessonID] ON [dbo].[LessonSubtitles]
(
	[LessonID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Notifications_Recipient_IsRead_CreatedAt]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Notifications_Recipient_IsRead_CreatedAt] ON [dbo].[Notifications]
(
	[RecipientAccountID] ASC,
	[IsRead] ASC,
	[CreatedAt] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Notifications_RecipientAccountID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Notifications_RecipientAccountID] ON [dbo].[Notifications]
(
	[RecipientAccountID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_OrderItems_CourseID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_OrderItems_CourseID] ON [dbo].[OrderItems]
(
	[CourseID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_OrderItems_OrderID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_OrderItems_OrderID] ON [dbo].[OrderItems]
(
	[OrderID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_OrderItems_EnrollmentID_Filtered]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE UNIQUE NONCLUSTERED INDEX [UQ_OrderItems_EnrollmentID_Filtered] ON [dbo].[OrderItems]
(
	[EnrollmentID] ASC
)
WHERE ([EnrollmentID] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Orders_AccountID_Status]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Orders_AccountID_Status] ON [dbo].[Orders]
(
	[AccountID] ASC,
	[OrderStatus] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Orders_OrderDate]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Orders_OrderDate] ON [dbo].[Orders]
(
	[OrderDate] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_Orders_PaymentID_Filtered]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE UNIQUE NONCLUSTERED INDEX [UQ_Orders_PaymentID_Filtered] ON [dbo].[Orders]
(
	[PaymentID] ASC
)
WHERE ([PaymentID] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Payouts_AdminID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Payouts_AdminID] ON [dbo].[Payouts]
(
	[AdminID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Payouts_InstructorID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Payouts_InstructorID] ON [dbo].[Payouts]
(
	[InstructorID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Payouts_PayoutStatusID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Payouts_PayoutStatusID] ON [dbo].[Payouts]
(
	[PayoutStatusID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Promotions_DateRange]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Promotions_DateRange] ON [dbo].[Promotions]
(
	[StartDate] ASC,
	[EndDate] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Promotions_DiscountCode]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Promotions_DiscountCode] ON [dbo].[Promotions]
(
	[DiscountCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Promotions_Status]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Promotions_Status] ON [dbo].[Promotions]
(
	[Status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_QuizAttemptAnswers_AttemptID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_QuizAttemptAnswers_AttemptID] ON [dbo].[QuizAttemptAnswers]
(
	[AttemptID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_QuizAttemptAnswers_QuestionID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_QuizAttemptAnswers_QuestionID] ON [dbo].[QuizAttemptAnswers]
(
	[QuestionID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_QuizAttemptAnswers_SelectedOptionID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_QuizAttemptAnswers_SelectedOptionID] ON [dbo].[QuizAttemptAnswers]
(
	[SelectedOptionID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_QuizAttempts_AccountID_LessonID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_QuizAttempts_AccountID_LessonID] ON [dbo].[QuizAttempts]
(
	[AccountID] ASC,
	[LessonID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_QuizOptions_QuestionID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_QuizOptions_QuestionID] ON [dbo].[QuizOptions]
(
	[QuestionID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_QuizQuestions_LessonID_Order]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_QuizQuestions_LessonID_Order] ON [dbo].[QuizQuestions]
(
	[LessonID] ASC,
	[QuestionOrder] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Sections_CourseID_Order]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Sections_CourseID_Order] ON [dbo].[Sections]
(
	[CourseID] ASC,
	[SectionOrder] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Sections_OriginalID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_Sections_OriginalID] ON [dbo].[Sections]
(
	[OriginalID] ASC
)
WHERE ([OriginalID] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_UserProfiles_PhoneNumber_Filtered]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE UNIQUE NONCLUSTERED INDEX [UQ_UserProfiles_PhoneNumber_Filtered] ON [dbo].[UserProfiles]
(
	[PhoneNumber] ASC
)
WHERE ([PhoneNumber] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_WithdrawalRequests_AdminID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_WithdrawalRequests_AdminID] ON [dbo].[WithdrawalRequests]
(
	[AdminID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_WithdrawalRequests_InstructorID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_WithdrawalRequests_InstructorID] ON [dbo].[WithdrawalRequests]
(
	[InstructorID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_WithdrawalRequests_PayoutID]    Script Date: 8/19/2026 10:39:19 AM ******/
CREATE NONCLUSTERED INDEX [IX_WithdrawalRequests_PayoutID] ON [dbo].[WithdrawalRequests]
(
	[PayoutID] ASC
)
WHERE ([PayoutID] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_WithdrawalRequests_Status]    Script Date: 8/19/2026 10:39:19 AM ******/
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
ALTER TABLE [dbo].[Courses]  WITH CHECK ADD  CONSTRAINT [FK_Courses_StatusID] FOREIGN KEY([StatusID])
REFERENCES [dbo].[CourseStatuses] ([StatusID])
GO
ALTER TABLE [dbo].[Courses] CHECK CONSTRAINT [FK_Courses_StatusID]
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
ALTER TABLE [dbo].[CourseApprovalRequests]  WITH CHECK ADD  CONSTRAINT [CK_CourseApprovalRequests_RequestType] CHECK  (([RequestType]='UPDATE_SUBMISSION' OR [RequestType]='RE_SUBMISSION' OR [RequestType]='INITIAL_SUBMISSION'))
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
