/* =============================================================================
   V2__seed_reference_data.sql — Dữ liệu tham chiếu bắt buộc

   [THÊM 24/08/2026]

   ★ VÌ SAO TỆP NÀY TỒN TẠI

   `all_database_new.sql` được kết xuất bằng SSMS "Script Database as CREATE",
   và tùy chọn mặc định của nó là LƯỢC ĐỒ, KHÔNG KÈM DỮ LIỆU. Kết quả: các bảng
   tra cứu được tạo ra RỖNG.

   Đó không phải bất tiện nhỏ. `Courses` có khóa ngoại trỏ tới `CourseStatuses`;
   nếu bảng đó rỗng thì MỌI lệnh thêm khóa học đều hỏng với lỗi vi phạm khóa
   ngoại — và lỗi hiện ra ở tầng ứng dụng, xa chỗ gây ra nó.

   Bản V1__init.sql hiện tại cũng không có dữ liệu này (V1__init.bak.sql mới
   có). Nghĩa là chuỗi V1..V10 đang dùng CŨNG sẽ dựng lên một CSDL thiếu dữ
   liệu tham chiếu — chỉ chưa ai phát hiện vì máy dev còn dữ liệu cũ từ hồi
   bản .bak còn là V1.

   ★ CHỈ CHỨA DỮ LIỆU THAM CHIẾU, KHÔNG CHỨA DỮ LIỆU DEMO

   Không có Accounts, Courses, Orders, Lessons... Những thứ đó là dữ liệu thử
   nghiệm của máy dev, không nên nằm trên production. Muốn có dữ liệu demo cho
   buổi bảo vệ thì tạo qua giao diện, hoặc viết một migration R__ riêng và chỉ
   chạy ở môi trường demo.

   ★ CHẠY LẠI ĐƯỢC

   Mỗi khối có `IF NOT EXISTS (SELECT 1 FROM <bang>)` bao ngoài, nên chạy lại
   không nhân đôi dữ liệu. Bảng nào đã có hàng thì bỏ qua nguyên khối — cố ý
   như vậy, để nó không đè lên chỉnh sửa của người vận hành.

   Nguồn: trích tự động từ db-init/V1__init.bak.sql
   ============================================================================= */

PRINT N'== Nap du lieu tham chieu ==';
GO

/* --- Roles — Vai trò tài khoản — AD/GV/HV/... (4 hàng) --------------------------- */
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles])
BEGIN
    INSERT [dbo].[Roles] ([RoleID], [RoleName], [Description], [CreatedAt], [UpdatedAt]) VALUES (N'AD', N'Quản trị viên', N'Quản trị hệ thống (nội dung, người dùng)', CAST(N'2025-05-02T17:33:08.7100000' AS DateTime2), CAST(N'2025-05-02T17:33:08.7100000' AS DateTime2))
    INSERT [dbo].[Roles] ([RoleID], [RoleName], [Description], [CreatedAt], [UpdatedAt]) VALUES (N'GV', N'Giảng viên', N'Người dùng tạo và quản lý khóa học', CAST(N'2025-05-02T17:33:08.7100000' AS DateTime2), CAST(N'2025-05-02T17:33:08.7100000' AS DateTime2))
    INSERT [dbo].[Roles] ([RoleID], [RoleName], [Description], [CreatedAt], [UpdatedAt]) VALUES (N'NU', N'Người dùng (Học viên)', N'Người dùng đăng ký học các khóa học', CAST(N'2025-05-02T17:33:08.7100000' AS DateTime2), CAST(N'2025-05-02T17:33:08.7100000' AS DateTime2))
    INSERT [dbo].[Roles] ([RoleID], [RoleName], [Description], [CreatedAt], [UpdatedAt]) VALUES (N'SA', N'Super Admin', N'Quản trị cấp cao nhất', CAST(N'2025-05-02T17:33:08.7100000' AS DateTime2), CAST(N'2025-05-02T17:33:08.7100000' AS DateTime2))
    PRINT N'  [+] Roles: da nap 4 hang';
END
ELSE
    PRINT N'  [=] Roles: da co du lieu, bo qua';
GO

/* --- Currencies — Đơn vị tiền tệ (2 hàng) --------------------------- */
IF NOT EXISTS (SELECT 1 FROM [dbo].[Currencies])
BEGIN
    INSERT [dbo].[Currencies] ([CurrencyID], [CurrencyName], [Type], [DecimalPlaces]) VALUES (N'USD', N'Đô la Mỹ', N'FIAT', 2)
    INSERT [dbo].[Currencies] ([CurrencyID], [CurrencyName], [Type], [DecimalPlaces]) VALUES (N'VND', N'Việt Nam Đồng', N'FIAT', 0)
    PRINT N'  [+] Currencies: da nap 2 hang';
END
ELSE
    PRINT N'  [=] Currencies: da co du lieu, bo qua';
GO

/* --- Languages — Ngôn ngữ giao diện và phụ đề (2 hàng) --------------------------- */
IF NOT EXISTS (SELECT 1 FROM [dbo].[Languages])
BEGIN
    INSERT [dbo].[Languages] ([LanguageCode], [LanguageName], [NativeName], [IsActive], [DisplayOrder], [CreatedAt], [UpdatedAt]) VALUES (N'en', N'English', N'English', 1, 2, CAST(N'2025-05-09T12:39:54.5500000' AS DateTime2), CAST(N'2025-05-09T12:39:54.5500000' AS DateTime2))
    INSERT [dbo].[Languages] ([LanguageCode], [LanguageName], [NativeName], [IsActive], [DisplayOrder], [CreatedAt], [UpdatedAt]) VALUES (N'vi', N'Tiếng Việt', N'Tiếng Việt', 1, 1, CAST(N'2025-05-09T12:39:54.5500000' AS DateTime2), CAST(N'2025-05-09T12:39:54.5500000' AS DateTime2))
    PRINT N'  [+] Languages: da nap 2 hang';
END
ELSE
    PRINT N'  [=] Languages: da co du lieu, bo qua';
GO

/* --- Levels — Trình độ khóa học (Cơ bản/Trung cấp/...) (4 hàng) --------------------------- */
IF NOT EXISTS (SELECT 1 FROM [dbo].[Levels])
BEGIN
    SET IDENTITY_INSERT [dbo].[Levels] ON;
    INSERT [dbo].[Levels] ([LevelID], [LevelName], [CreatedAt], [UpdatedAt]) VALUES (1, N'Cơ bản', CAST(N'2025-04-28T22:25:25.1633333' AS DateTime2), CAST(N'2025-05-04T06:16:30.7340000' AS DateTime2))
    INSERT [dbo].[Levels] ([LevelID], [LevelName], [CreatedAt], [UpdatedAt]) VALUES (2, N'Trung cấp', CAST(N'2025-04-28T22:25:25.1633333' AS DateTime2), CAST(N'2025-04-28T22:25:25.1633333' AS DateTime2))
    INSERT [dbo].[Levels] ([LevelID], [LevelName], [CreatedAt], [UpdatedAt]) VALUES (3, N'Nâng cao', CAST(N'2025-04-28T22:25:25.1633333' AS DateTime2), CAST(N'2025-04-28T22:25:25.1633333' AS DateTime2))
    INSERT [dbo].[Levels] ([LevelID], [LevelName], [CreatedAt], [UpdatedAt]) VALUES (4, N'Mọi cấp độ', CAST(N'2025-04-28T22:25:25.1633333' AS DateTime2), CAST(N'2025-04-28T22:25:25.1633333' AS DateTime2))
    SET IDENTITY_INSERT [dbo].[Levels] OFF;
    PRINT N'  [+] Levels: da nap 4 hang';
END
ELSE
    PRINT N'  [=] Levels: da co du lieu, bo qua';
GO

/* --- Categories — Danh mục khóa học (8 hàng) --------------------------- */
IF NOT EXISTS (SELECT 1 FROM [dbo].[Categories])
BEGIN
    SET IDENTITY_INSERT [dbo].[Categories] ON;
    INSERT [dbo].[Categories] ([CategoryID], [CategoryName], [Slug], [Description], [IconUrl], [CreatedAt], [UpdatedAt]) VALUES (1, N'sonthanhh', N'sonthanhhhh', N'uuu', N'https://i.imgur.com/Fv9X0sX.jpeg', CAST(N'2025-05-04T12:01:48.6400000' AS DateTime2), CAST(N'2025-05-07T06:52:21.4820000' AS DateTime2))
    INSERT [dbo].[Categories] ([CategoryID], [CategoryName], [Slug], [Description], [IconUrl], [CreatedAt], [UpdatedAt]) VALUES (2, N'Phát triển Di động', N'phat-trien-di-dong', NULL, N'', CAST(N'2025-05-07T13:57:39.4566667' AS DateTime2), CAST(N'2025-06-14T18:41:08.1720000' AS DateTime2))
    INSERT [dbo].[Categories] ([CategoryID], [CategoryName], [Slug], [Description], [IconUrl], [CreatedAt], [UpdatedAt]) VALUES (8, N'Web Development', N'web-development', N'Courses on front-end and back-end web development, including HTML, CSS, JavaScript, React, Angular, Node.js, PHP, Laravel, and more.', N'https://i.imgur.com/d5p124y.png', CAST(N'2025-06-13T15:39:56.4766667' AS DateTime2), CAST(N'2025-06-14T13:46:09.6850000' AS DateTime2))
    INSERT [dbo].[Categories] ([CategoryID], [CategoryName], [Slug], [Description], [IconUrl], [CreatedAt], [UpdatedAt]) VALUES (9, N'Data Science', N'data-science', N'Explore the world of data with Python, R, Machine Learning, Deep Learning, and powerful data analysis tools.', N'https://i.imgur.com/d5p124y.png', CAST(N'2025-06-13T15:39:56.4766667' AS DateTime2), CAST(N'2025-06-14T13:45:51.7710000' AS DateTime2))
    INSERT [dbo].[Categories] ([CategoryID], [CategoryName], [Slug], [Description], [IconUrl], [CreatedAt], [UpdatedAt]) VALUES (10, N'Graphic Design', N'graphic-design', N'Learn how to use Photoshop, Illustrator, and Figma to create stunning designs for web, mobile, and print.', N'https://i.imgur.com/d5p124y.png', CAST(N'2025-06-13T15:39:56.4766667' AS DateTime2), CAST(N'2025-06-14T13:46:01.8770000' AS DateTime2))
    INSERT [dbo].[Categories] ([CategoryID], [CategoryName], [Slug], [Description], [IconUrl], [CreatedAt], [UpdatedAt]) VALUES (11, N'Digital Marketing', N'digital-marketing', N'Master essential skills in SEO, SEM, Content Marketing, and Social Media Marketing to promote products and services effectively.', N'https://i.imgur.com/d5p124y.png', CAST(N'2025-06-13T15:39:56.4766667' AS DateTime2), CAST(N'2025-06-14T13:45:58.3630000' AS DateTime2))
    INSERT [dbo].[Categories] ([CategoryID], [CategoryName], [Slug], [Description], [IconUrl], [CreatedAt], [UpdatedAt]) VALUES (12, N'Languages', N'languages', N'Improve your English, Japanese, Korean, and other popular languages for work and communication.', N'https://i.imgur.com/d5p124y.png', CAST(N'2025-06-13T15:39:56.4766667' AS DateTime2), CAST(N'2025-06-14T13:46:04.7010000' AS DateTime2))
    INSERT [dbo].[Categories] ([CategoryID], [CategoryName], [Slug], [Description], [IconUrl], [CreatedAt], [UpdatedAt]) VALUES (13, N'Backend Development', N'backend-development', N'Learn how to build powerful, scalable server-side applications using Node.js. This course covers APIs, databases, authentication, and everything you need to master backend development.', N'https://i.imgur.com/d5p124y.png', CAST(N'2025-06-15T01:42:22.0500000' AS DateTime2), CAST(N'2025-06-15T01:42:22.0500000' AS DateTime2))
    SET IDENTITY_INSERT [dbo].[Categories] OFF;
    PRINT N'  [+] Categories: da nap 8 hang';
END
ELSE
    PRINT N'  [=] Categories: da co du lieu, bo qua';
GO

/* --- Skills — Kỹ năng gắn cho giảng viên/khóa học (29 hàng) --------------------------- */
IF NOT EXISTS (SELECT 1 FROM [dbo].[Skills])
BEGIN
    SET IDENTITY_INSERT [dbo].[Skills] ON;
    INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (1, N'Python', N'Ngôn ngữ lập trình đa năng, phổ biến trong khoa học dữ liệu, web và tự động hóa.', CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2), CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2))
    INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (2, N'JavaScript', N'Ngôn ngữ lập trình thiết yếu cho phát triển web frontend và backend (Node.js).', CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2), CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2))
    INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (3, N'React.js', N'Thư viện JavaScript phổ biến để xây dựng giao diện người dùng.', CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2), CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2))
    INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (4, N'Node.js', N'Môi trường chạy JavaScript phía máy chủ để xây dựng ứng dụng web backend.', CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2), CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2))
    INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (5, N'HTML', N'Ngôn ngữ đánh dấu siêu văn bản, cấu trúc cơ bản của trang web.', CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2), CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2))
    INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (6, N'CSS', N'Ngôn ngữ định dạng cho trang web, kiểm soát giao diện và bố cục.', CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2), CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2))
    INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (7, N'SQL', N'Ngôn ngữ truy vấn có cấu trúc để quản lý và thao tác cơ sở dữ liệu quan hệ.', CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2), CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2))
    INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (8, N'Java', N'Ngôn ngữ lập trình hướng đối tượng mạnh mẽ, dùng trong ứng dụng doanh nghiệp, Android.', CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2), CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2))
    INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (9, N'C#', N'Ngôn ngữ lập trình của Microsoft, phổ biến cho phát triển ứng dụng Windows và game (Unity).', CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2), CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2))
    INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (10, N'PHP', N'Ngôn ngữ kịch bản phía máy chủ phổ biến cho phát triển web.', CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2), CAST(N'2025-05-02T23:06:17.3900000' AS DateTime2))
    INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (11, N'Machine Learning', N'Lĩnh vực trí tuệ nhân tạo tập trung vào việc xây dựng hệ thống học hỏi từ dữ liệu.', CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2), CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2))
    INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (12, N'Data Analysis', N'Quá trình kiểm tra, làm sạch, chuyển đổi và mô hình hóa dữ liệu để khám phá thông tin hữu ích.', CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2), CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2))
    INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (13, N'Data Visualization', N'Trực quan hóa dữ liệu bằng biểu đồ, đồ thị để truyền đạt thông tin hiệu quả.', CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2), CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2))
    INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (14, N'Deep Learning', N'Một nhánh của Machine Learning sử dụng mạng nơ-ron nhân tạo sâu.', CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2), CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2))
    INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (15, N'UI Design', N'Thiết kế giao diện người dùng, tập trung vào thẩm mỹ và tương tác hình ảnh.', CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2), CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2))
    INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (16, N'UX Design', N'Thiết kế trải nghiệm người dùng, tập trung vào sự dễ sử dụng và hài lòng của người dùng.', CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2), CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2))
    INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (17, N'Figma', N'Công cụ thiết kế giao diện và tạo mẫu cộng tác dựa trên nền tảng web.', CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2), CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2))
    INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (18, N'Adobe Photoshop', N'Phần mềm chỉnh sửa ảnh và thiết kế đồ họa raster hàng đầu.', CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2), CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2))
    INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (19, N'Graphic Design', N'Thiết kế đồ họa, tạo ra các yếu tố hình ảnh như logo, banner, ấn phẩm.', CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2), CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2))
    INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (20, N'Digital Marketing', N'Tiếp thị sản phẩm/dịch vụ sử dụng các kênh kỹ thuật số.', CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2), CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2))
    INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (21, N'SEO', N'Tối ưu hóa công cụ tìm kiếm để tăng thứ hạng và lưu lượng truy cập tự nhiên.', CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2), CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2))
    INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (22, N'Project Management', N'Quản lý dự án, lập kế hoạch, thực thi và giám sát để đạt được mục tiêu cụ thể.', CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2), CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2))
    INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (23, N'Business Analysis', N'Phân tích nghiệp vụ, xác định nhu cầu kinh doanh và đề xuất giải pháp.', CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2), CAST(N'2025-05-02T23:06:17.4166667' AS DateTime2))
    INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (24, N'Amazon Web Services (AWS)', N'Nền tảng điện toán đám mây hàng đầu của Amazon.', CAST(N'2025-05-02T23:06:17.4200000' AS DateTime2), CAST(N'2025-05-02T23:06:17.4200000' AS DateTime2))
    INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (25, N'Microsoft Azure', N'Nền tảng điện toán đám mây của Microsoft.', CAST(N'2025-05-02T23:06:17.4200000' AS DateTime2), CAST(N'2025-05-02T23:06:17.4200000' AS DateTime2))
    INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (26, N'Docker', N'Nền tảng container hóa ứng dụng.', CAST(N'2025-05-02T23:06:17.4200000' AS DateTime2), CAST(N'2025-05-02T23:06:17.4200000' AS DateTime2))
    INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (27, N'DevOps', N'Triết lý và thực hành kết hợp phát triển phần mềm (Dev) và vận hành IT (Ops).', CAST(N'2025-05-02T23:06:17.4200000' AS DateTime2), CAST(N'2025-05-02T23:06:17.4200000' AS DateTime2))
    INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (28, N'Communication Skills', N'Kỹ năng giao tiếp hiệu quả trong môi trường làm việc và cá nhân.', CAST(N'2025-05-02T23:06:17.4200000' AS DateTime2), CAST(N'2025-05-02T23:06:17.4200000' AS DateTime2))
    INSERT [dbo].[Skills] ([SkillID], [SkillName], [Description], [CreatedAt], [UpdatedAt]) VALUES (29, N'Leadership', N'Kỹ năng lãnh đạo, dẫn dắt và truyền cảm hứng cho đội nhóm.', CAST(N'2025-05-02T23:06:17.4200000' AS DateTime2), CAST(N'2025-05-02T23:06:17.4200000' AS DateTime2))
    SET IDENTITY_INSERT [dbo].[Skills] OFF;
    PRINT N'  [+] Skills: da nap 29 hang';
END
ELSE
    PRINT N'  [=] Skills: da co du lieu, bo qua';
GO

/* --- CourseStatuses — Trạng thái khóa học — Courses có FK trỏ tới (6 hàng) --------------------------- */
IF NOT EXISTS (SELECT 1 FROM [dbo].[CourseStatuses])
BEGIN
    INSERT [dbo].[CourseStatuses] ([StatusID], [StatusName], [Description]) VALUES (N'ARCHIVED', N'Đã lưu trữ', N'Khóa học không còn hiển thị công khai nhưng vẫn được lưu trữ')
    INSERT [dbo].[CourseStatuses] ([StatusID], [StatusName], [Description]) VALUES (N'DRAFT', N'Bản nháp', N'Khóa học đang được soạn thảo, chưa gửi duyệt')
    INSERT [dbo].[CourseStatuses] ([StatusID], [StatusName], [Description]) VALUES (N'PENDING', N'Chờ duyệt', N'Khóa học đã được gửi và đang chờ quản trị viên phê duyệt')
    INSERT [dbo].[CourseStatuses] ([StatusID], [StatusName], [Description]) VALUES (N'PUBLISHED', N'Đã xuất bản', N'Khóa học đã được phê duyệt và hiển thị công khai')
    INSERT [dbo].[CourseStatuses] ([StatusID], [StatusName], [Description]) VALUES (N'REJECTED', N'Bị từ chối', N'Khóa học bị từ chối phê duyệt')
    INSERT [dbo].[CourseStatuses] ([StatusID], [StatusName], [Description]) VALUES (N'UPDATING', N'Updating', N'A new version of this published course is being drafted for review.')
    PRINT N'  [+] CourseStatuses: da nap 6 hang';
END
ELSE
    PRINT N'  [=] CourseStatuses: da co du lieu, bo qua';
GO

/* --- PaymentStatuses — Trạng thái thanh toán (5 hàng) --------------------------- */
IF NOT EXISTS (SELECT 1 FROM [dbo].[PaymentStatuses])
BEGIN
    INSERT [dbo].[PaymentStatuses] ([StatusID], [StatusName]) VALUES (N'CANCELLED', N'Đã hủy')
    INSERT [dbo].[PaymentStatuses] ([StatusID], [StatusName]) VALUES (N'FAILED', N'Thất bại')
    INSERT [dbo].[PaymentStatuses] ([StatusID], [StatusName]) VALUES (N'PENDING', N'Chờ thanh toán')
    INSERT [dbo].[PaymentStatuses] ([StatusID], [StatusName]) VALUES (N'REFUNDED', N'Đã hoàn tiền')
    INSERT [dbo].[PaymentStatuses] ([StatusID], [StatusName]) VALUES (N'SUCCESS', N'Thành công')
    PRINT N'  [+] PaymentStatuses: da nap 5 hang';
END
ELSE
    PRINT N'  [=] PaymentStatuses: da co du lieu, bo qua';
GO

/* --- PayoutStatuses — Trạng thái chi trả cho giảng viên (5 hàng) --------------------------- */
IF NOT EXISTS (SELECT 1 FROM [dbo].[PayoutStatuses])
BEGIN
    INSERT [dbo].[PayoutStatuses] ([StatusID], [StatusName]) VALUES (N'CANCELLED', N'Đã hủy')
    INSERT [dbo].[PayoutStatuses] ([StatusID], [StatusName]) VALUES (N'FAILED', N'Thất bại')
    INSERT [dbo].[PayoutStatuses] ([StatusID], [StatusName]) VALUES (N'PAID', N'Đã thanh toán')
    INSERT [dbo].[PayoutStatuses] ([StatusID], [StatusName]) VALUES (N'PENDING', N'Chờ xử lý')
    INSERT [dbo].[PayoutStatuses] ([StatusID], [StatusName]) VALUES (N'PROCESSING', N'Đang xử lý')
    PRINT N'  [+] PayoutStatuses: da nap 5 hang';
END
ELSE
    PRINT N'  [=] PayoutStatuses: da co du lieu, bo qua';
GO

/* --- PaymentMethods — Cổng thanh toán — VNPAY/MOMO/... (7 hàng) --------------------------- */
IF NOT EXISTS (SELECT 1 FROM [dbo].[PaymentMethods])
BEGIN
    INSERT [dbo].[PaymentMethods] ([MethodID], [MethodName], [IconUrl], [Description]) VALUES (N'BANK_TRANSFER', N'Chuyển khoản ngân hàng', N'https://path.to/your/icons/bank_transfer.png', N'Chuyển khoản trực tiếp đến tài khoản ngân hàng của chúng tôi.')
    INSERT [dbo].[PaymentMethods] ([MethodID], [MethodName], [IconUrl], [Description]) VALUES (N'CRYPTO', N'Ti?n m? hóa (Crypto)', N'URL_ICON_CRYPTO_CUA_BAN', N'Thanh toán b?ng các lo?i ti?n m? hóa thông qua NOWPayments.')
    INSERT [dbo].[PaymentMethods] ([MethodID], [MethodName], [IconUrl], [Description]) VALUES (N'MOMO', N'Ví điện tử MoMo', N'https://path.to/your/icons/momo.png', N'Thanh toán an toàn và nhanh chóng qua ví điện tử MoMo.')
    INSERT [dbo].[PaymentMethods] ([MethodID], [MethodName], [IconUrl], [Description]) VALUES (N'PAYPAL', N'Ví điện tử PayPal', N'https://path.to/your/icons/paypal.png', N'Thanh toán an toàn bằng tài khoản PayPal của bạn.')
    INSERT [dbo].[PaymentMethods] ([MethodID], [MethodName], [IconUrl], [Description]) VALUES (N'STRIPE', N'Stripe (Th? qu?c t?)', N'https://js.stripe.com/v3/fingerprinted/img/stripe-logo-blurple-fedf5933a04a584a2736564e526d5526.svg', N'Thanh toán qua th? Visa, Mastercard, American Express,...')
    INSERT [dbo].[PaymentMethods] ([MethodID], [MethodName], [IconUrl], [Description]) VALUES (N'SYSTEM_CREDIT', N'Tín dụng hệ thống', N'https://path.to/your/icons/system_credit.png', N'Sử dụng số dư tín dụng có sẵn trong tài khoản của bạn.')
    INSERT [dbo].[PaymentMethods] ([MethodID], [MethodName], [IconUrl], [Description]) VALUES (N'VNPAY', N'Cổng thanh toán VNPAY', N'https://path.to/your/icons/vnpay.png', N'Hỗ trợ thẻ ATM nội địa, thẻ quốc tế (Visa, Master, JCB, Amex), và VNPAY-QR.')
    PRINT N'  [+] PaymentMethods: da nap 7 hang';
END
ELSE
    PRINT N'  [=] PaymentMethods: da co du lieu, bo qua';
GO

/* --- Settings — Cấu hình chạy của ứng dụng (13 hàng) --------------------------- */
IF NOT EXISTS (SELECT 1 FROM [dbo].[Settings])
BEGIN
    INSERT [dbo].[Settings] ([SettingKey], [SettingValue], [Description], [IsEditableByAdmin], [LastUpdated]) VALUES (N'AllowInstructorRegistration', N'false', N'Allow users to register directly as an instructor. (true/false)', 1, CAST(N'2025-06-12T10:33:01.2700000' AS DateTime2))
    INSERT [dbo].[Settings] ([SettingKey], [SettingValue], [Description], [IsEditableByAdmin], [LastUpdated]) VALUES (N'AllowUserRegistration', N'true', N'Allow new users to register an account. (true/false)', 1, CAST(N'2025-06-12T10:33:01.2690000' AS DateTime2))
    INSERT [dbo].[Settings] ([SettingKey], [SettingValue], [Description], [IsEditableByAdmin], [LastUpdated]) VALUES (N'DefaultCurrency', N'VND', N'Tiền tệ mặc định của hệ thống', 0, CAST(N'2025-04-28T22:25:25.7800000' AS DateTime2))
    INSERT [dbo].[Settings] ([SettingKey], [SettingValue], [Description], [IsEditableByAdmin], [LastUpdated]) VALUES (N'EnableCrypto', N'true', N'Enable or disable the Crypto (NOWPayments) gateway. (true/false)', 1, CAST(N'2025-06-15T19:58:19.4340000' AS DateTime2))
    INSERT [dbo].[Settings] ([SettingKey], [SettingValue], [Description], [IsEditableByAdmin], [LastUpdated]) VALUES (N'EnableMoMo', N'true', N'Enable or disable the MoMo payment gateway. (true/false)', 1, CAST(N'2025-06-14T09:01:36.0860000' AS DateTime2))
    INSERT [dbo].[Settings] ([SettingKey], [SettingValue], [Description], [IsEditableByAdmin], [LastUpdated]) VALUES (N'EnablePayPal', N'true', N'Enable or disable the PayPal payment gateway. (true/false)', 1, CAST(N'2025-06-14T09:01:36.0560000' AS DateTime2))
    INSERT [dbo].[Settings] ([SettingKey], [SettingValue], [Description], [IsEditableByAdmin], [LastUpdated]) VALUES (N'EnableStripe', N'true', N'Enable or disable the Stripe payment gateway. (true/false)', 1, CAST(N'2025-06-16T04:06:51.7290000' AS DateTime2))
    INSERT [dbo].[Settings] ([SettingKey], [SettingValue], [Description], [IsEditableByAdmin], [LastUpdated]) VALUES (N'EnableVnPay', N'true', N'Enable or disable the VNPay payment gateway. (true/false)', 1, CAST(N'2025-06-16T04:06:51.7020000' AS DateTime2))
    INSERT [dbo].[Settings] ([SettingKey], [SettingValue], [Description], [IsEditableByAdmin], [LastUpdated]) VALUES (N'InstructorSignupEnabled', N'1', N'Cho phép người dùng mới đăng ký làm giảng viên (1=Yes, 0=No)', 1, CAST(N'2025-04-28T22:25:25.7800000' AS DateTime2))
    INSERT [dbo].[Settings] ([SettingKey], [SettingValue], [Description], [IsEditableByAdmin], [LastUpdated]) VALUES (N'MinWithdrawalAmountUSD', N'10', N'Minimum withdrawal amount for USD currency.', 1, CAST(N'2025-06-12T16:53:18.6000000' AS DateTime2))
    INSERT [dbo].[Settings] ([SettingKey], [SettingValue], [Description], [IsEditableByAdmin], [LastUpdated]) VALUES (N'MinWithdrawalAmountVND', N'50000', N'Minimum withdrawal amount for VND currency.', 1, CAST(N'2025-06-12T10:39:01.2810000' AS DateTime2))
    INSERT [dbo].[Settings] ([SettingKey], [SettingValue], [Description], [IsEditableByAdmin], [LastUpdated]) VALUES (N'PlatformCommissionRate', N'30.00', N'The commission percentage the platform takes from each course sale (e.g., 30 for 30%).', 1, CAST(N'2025-06-12T16:58:34.5933333' AS DateTime2))
    INSERT [dbo].[Settings] ([SettingKey], [SettingValue], [Description], [IsEditableByAdmin], [LastUpdated]) VALUES (N'SiteLogoUrl', N'https://i.imgur.com/Fv9X0sX.jpeg', N'URL to the main logo of the site.', 1, CAST(N'2025-06-12T16:53:18.6000000' AS DateTime2))
    PRINT N'  [+] Settings: da nap 13 hang';
END
ELSE
    PRINT N'  [=] Settings: da co du lieu, bo qua';
GO

/* --- ExchangeRates — Tỉ giá — phụ thuộc Currencies (15 hàng) --------------------------- */
IF NOT EXISTS (SELECT 1 FROM [dbo].[ExchangeRates])
BEGIN
    SET IDENTITY_INSERT [dbo].[ExchangeRates] ON;
    INSERT [dbo].[ExchangeRates] ([RateID], [FromCurrencyID], [ToCurrencyID], [Rate], [EffectiveTimestamp], [Source]) VALUES (1, N'VND', N'USD', CAST(0.000038380000000000 AS Decimal(36, 18)), CAST(N'2025-06-09T21:03:00.5233333' AS DateTime2), N'exchangerate-api.com')
    INSERT [dbo].[ExchangeRates] ([RateID], [FromCurrencyID], [ToCurrencyID], [Rate], [EffectiveTimestamp], [Source]) VALUES (3, N'VND', N'USD', CAST(0.000038380000000000 AS Decimal(36, 18)), CAST(N'2025-06-10T21:03:00.5466667' AS DateTime2), N'exchangerate-api.com')
    INSERT [dbo].[ExchangeRates] ([RateID], [FromCurrencyID], [ToCurrencyID], [Rate], [EffectiveTimestamp], [Source]) VALUES (4, N'VND', N'USD', CAST(0.000038380000000000 AS Decimal(36, 18)), CAST(N'2025-06-11T00:11:00.9333333' AS DateTime2), N'exchangerate-api.com')
    INSERT [dbo].[ExchangeRates] ([RateID], [FromCurrencyID], [ToCurrencyID], [Rate], [EffectiveTimestamp], [Source]) VALUES (5, N'VND', N'USD', CAST(0.000038380000000000 AS Decimal(36, 18)), CAST(N'2025-06-11T00:12:00.6333333' AS DateTime2), N'exchangerate-api.com')
    INSERT [dbo].[ExchangeRates] ([RateID], [FromCurrencyID], [ToCurrencyID], [Rate], [EffectiveTimestamp], [Source]) VALUES (6, N'VND', N'USD', CAST(0.000038380000000000 AS Decimal(36, 18)), CAST(N'2025-06-11T00:13:02.8133333' AS DateTime2), N'exchangerate-api.com')
    INSERT [dbo].[ExchangeRates] ([RateID], [FromCurrencyID], [ToCurrencyID], [Rate], [EffectiveTimestamp], [Source]) VALUES (7, N'VND', N'USD', CAST(0.000038380000000000 AS Decimal(36, 18)), CAST(N'2025-06-11T00:17:00.6000000' AS DateTime2), N'exchangerate-api.com')
    INSERT [dbo].[ExchangeRates] ([RateID], [FromCurrencyID], [ToCurrencyID], [Rate], [EffectiveTimestamp], [Source]) VALUES (8, N'USD', N'VND', CAST(25995.240300000000000000 AS Decimal(36, 18)), CAST(N'2025-06-11T18:20:00.0000000' AS DateTime2), N'exchangerate-api.com')
    INSERT [dbo].[ExchangeRates] ([RateID], [FromCurrencyID], [ToCurrencyID], [Rate], [EffectiveTimestamp], [Source]) VALUES (9, N'VND', N'USD', CAST(0.000038460000000000 AS Decimal(36, 18)), CAST(N'2025-06-12T17:17:00.7230000' AS DateTime2), N'exchangerate-api.com')
    INSERT [dbo].[ExchangeRates] ([RateID], [FromCurrencyID], [ToCurrencyID], [Rate], [EffectiveTimestamp], [Source]) VALUES (10, N'USD', N'VND', CAST(26001.040041602000000000 AS Decimal(36, 18)), CAST(N'2025-06-12T17:17:00.8250000' AS DateTime2), N'Calculated Inverse')
    INSERT [dbo].[ExchangeRates] ([RateID], [FromCurrencyID], [ToCurrencyID], [Rate], [EffectiveTimestamp], [Source]) VALUES (11, N'VND', N'USD', CAST(0.000038410000000000 AS Decimal(36, 18)), CAST(N'2025-06-13T17:17:01.7770000' AS DateTime2), N'exchangerate-api.com')
    INSERT [dbo].[ExchangeRates] ([RateID], [FromCurrencyID], [ToCurrencyID], [Rate], [EffectiveTimestamp], [Source]) VALUES (12, N'USD', N'VND', CAST(26034.886748243000000000 AS Decimal(36, 18)), CAST(N'2025-06-13T17:17:01.8560000' AS DateTime2), N'Calculated Inverse')
    INSERT [dbo].[ExchangeRates] ([RateID], [FromCurrencyID], [ToCurrencyID], [Rate], [EffectiveTimestamp], [Source]) VALUES (13, N'VND', N'USD', CAST(0.000038340000000000 AS Decimal(36, 18)), CAST(N'2025-06-14T17:17:00.5600000' AS DateTime2), N'exchangerate-api.com')
    INSERT [dbo].[ExchangeRates] ([RateID], [FromCurrencyID], [ToCurrencyID], [Rate], [EffectiveTimestamp], [Source]) VALUES (14, N'USD', N'VND', CAST(26082.420448618000000000 AS Decimal(36, 18)), CAST(N'2025-06-14T17:17:00.6570000' AS DateTime2), N'Calculated Inverse')
    INSERT [dbo].[ExchangeRates] ([RateID], [FromCurrencyID], [ToCurrencyID], [Rate], [EffectiveTimestamp], [Source]) VALUES (15, N'VND', N'USD', CAST(0.000038350000000000 AS Decimal(36, 18)), CAST(N'2025-06-15T17:17:00.6240000' AS DateTime2), N'exchangerate-api.com')
    INSERT [dbo].[ExchangeRates] ([RateID], [FromCurrencyID], [ToCurrencyID], [Rate], [EffectiveTimestamp], [Source]) VALUES (16, N'USD', N'VND', CAST(26075.619295958000000000 AS Decimal(36, 18)), CAST(N'2025-06-15T17:17:00.6870000' AS DateTime2), N'Calculated Inverse')
    SET IDENTITY_INSERT [dbo].[ExchangeRates] OFF;
    PRINT N'  [+] ExchangeRates: da nap 15 hang';
END
ELSE
    PRINT N'  [=] ExchangeRates: da co du lieu, bo qua';
GO
