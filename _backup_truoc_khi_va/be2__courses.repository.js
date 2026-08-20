// File: src/api/courses/courses.repository.js
const httpStatus = require('http-status').status;
const ApiError = require('../../core/errors/ApiError');
const { getConnection, sql } = require('../../database/connection');
const logger = require('../../utils/logger');
const CourseStatus = require('../../core/enums/CourseStatus');
const sectionRepository = require('../sections/sections.repository');
const { toPascalCaseObject } = require('../../utils/caseConverter');

/**
 * Tạo khóa học mới (thường là bản nháp).
 */
const createCourse = async (courseData, transaction = null) => {
  const statusId = courseData.StatusID || CourseStatus.DRAFT;
  const executor = transaction
    ? transaction.request()
    : (await getConnection()).request();

  executor.input('CourseName', sql.NVarChar, courseData.CourseName);
  executor.input('Slug', sql.NVarChar, courseData.Slug);
  executor.input('ShortDescription', sql.NVarChar, courseData.ShortDescription);
  executor.input('FullDescription', sql.NVarChar, courseData.FullDescription);
  executor.input('Requirements', sql.NVarChar, courseData.Requirements);
  executor.input('LearningOutcomes', sql.NVarChar, courseData.LearningOutcomes);
  executor.input('ThumbnailUrl', sql.VarChar, courseData.ThumbnailUrl);
  executor.input('IntroVideoUrl', sql.VarChar, courseData.IntroVideoUrl);
  executor.input('OriginalPrice', sql.Decimal(18, 4), courseData.OriginalPrice);
  executor.input(
    'DiscountedPrice',
    sql.Decimal(18, 4),
    courseData.DiscountedPrice
  );
  executor.input('InstructorID', sql.BigInt, courseData.InstructorID);
  executor.input('CategoryID', sql.Int, courseData.CategoryID);
  executor.input('LevelID', sql.Int, courseData.LevelID);
  executor.input('Language', sql.VarChar, courseData.Language || 'vi');
  executor.input('StatusID', sql.VarChar, statusId);
  executor.input('IsFeatured', sql.Bit, courseData.IsFeatured || 0);

  try {
    const result = await executor.query(`
            INSERT INTO Courses (
                CourseName, Slug, ShortDescription, FullDescription, Requirements, LearningOutcomes,
                ThumbnailUrl, IntroVideoUrl, OriginalPrice, DiscountedPrice, InstructorID,
                CategoryID, LevelID, Language, StatusID, IsFeatured
            )
            OUTPUT Inserted.*
            VALUES (
                @CourseName, @Slug, @ShortDescription, @FullDescription, @Requirements, @LearningOutcomes,
                @ThumbnailUrl, @IntroVideoUrl, @OriginalPrice, @DiscountedPrice, @InstructorID,
                @CategoryID, @LevelID, @Language, @StatusID, @IsFeatured
            );
        `);
    return result.recordset[0];
  } catch (error) {
    logger.error('Error in createCourse repository:', error);
    throw error;
  }
};

/**
 * Tìm khóa học bằng ID.
 *
 * [SỬA 17/08/2026] Bổ sung tham số `transaction`. Trước đây hàm LUÔN mở một
 * kết nối riêng từ pool. Nếu người gọi đang ở giữa một transaction vừa UPDATE
 * đúng dòng Courses đó, dòng này đang bị giữ khóa ghi độc quyền; kết nối riêng
 * sẽ nằm chờ khóa, còn transaction thì chờ câu đọc — hai bên chờ nhau và
 * request treo cho tới khi hết lock timeout. Truyền transaction vào để câu đọc
 * đi CHUNG một kết nối, vừa hết kẹt vừa nhìn thấy thay đổi chưa commit.
 *
 * @param {number} courseId
 * @param {boolean} includeDraft - Cho phép trả về khóa chưa xuất bản.
 * @param {object} [transaction] - Transaction đang mở (tùy chọn).
 */
const findCourseById = async (courseId, includeDraft = false, transaction) => {
  try {
    const request = transaction
      ? transaction.request()
      : (await getConnection()).request();
    request.input('CourseID', sql.BigInt, courseId);

    let query = `
            SELECT c.*, cat.CategoryName, lvl.LevelName, cs.StatusName,
                   acc.Email as InstructorEmail, up.FullName as InstructorName, up.AvatarUrl as InstructorAvatar,
                   (SELECT COUNT(*) FROM Enrollments WHERE CourseID = c.CourseID) AS studentCount
            FROM Courses c
            JOIN Categories cat ON c.CategoryID = cat.CategoryID
            JOIN Levels lvl ON c.LevelID = lvl.LevelID
            JOIN CourseStatuses cs ON c.StatusID = cs.StatusID
            JOIN Accounts acc ON c.InstructorID = acc.AccountID
            JOIN UserProfiles up ON c.InstructorID = up.AccountID
            WHERE c.CourseID = @CourseID
        `;

    if (!includeDraft) {
      request.input('PublishedStatus', sql.VarChar, CourseStatus.PUBLISHED);
      query += ' AND c.StatusID = @PublishedStatus';
    }

    const result = await request.query(query);
    return result.recordset[0] || null;
  } catch (error) {
    logger.error(`Error in findCourseById (${courseId}):`, error);
    throw error;
  }
};

/**
 * Tìm khóa học bằng Slug.
 */
const findCourseBySlug = async (slug, includeDraft = false) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input('Slug', sql.NVarChar, slug);

    let query = `
            SELECT c.*, cat.CategoryName, lvl.LevelName, cs.StatusName,
                   acc.Email as InstructorEmail, up.FullName as InstructorName, up.AvatarUrl as InstructorAvatar,
                   (SELECT COUNT(*) FROM Enrollments WHERE CourseID = c.CourseID) AS studentCount
            FROM Courses c
            JOIN Categories cat ON c.CategoryID = cat.CategoryID
            JOIN Levels lvl ON c.LevelID = lvl.LevelID
            JOIN CourseStatuses cs ON c.StatusID = cs.StatusID
            JOIN Accounts acc ON c.InstructorID = acc.AccountID
            JOIN UserProfiles up ON c.InstructorID = up.AccountID
            WHERE c.Slug = @Slug
        `;

    if (!includeDraft) {
      request.input('PublishedStatus', sql.VarChar, CourseStatus.PUBLISHED);
      query += ' AND c.StatusID = @PublishedStatus';
    }

    const result = await request.query(query);
    return result.recordset[0] || null;
  } catch (error) {
    logger.error(`Error in findCourseBySlug (${slug}):`, error);
    throw error;
  }
};

/**
 * Tìm khóa học chỉ bằng Slug (kiểm tra tồn tại slug).
 */
const findCourseIdBySlug = async (slug) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input('Slug', sql.NVarChar, slug);
    const result = await request.query(
      'SELECT CourseID, Slug FROM Courses WHERE Slug = @Slug'
    );
    return result.recordset[0] || null;
  } catch (error) {
    logger.error(`Error in findCourseIdBySlug (${slug}):`, error);
    throw error;
  }
};

/**
 * Lấy danh sách khóa học với bộ lọc và phân trang.
 */
const findAllCourses = async (filters = {}, options = {}) => {
  const {
    categoryId,
    levelId,
    instructorId,
    statusId = CourseStatus.PUBLISHED,
    isFeatured,
    searchTerm,
    language,
  } = filters;
  const { page = 1, limit = 10, sortBy = 'CreatedAt:desc' } = options;
  const offset = (page - 1) * limit;
  try {
    const pool = await getConnection();
    const request = pool.request();

    let query = `
      SELECT
        c.CourseID,
        c.CourseName,
        c.Slug,
        c.ShortDescription,
        c.FullDescription,
        c.Requirements,
        c.LearningOutcomes,
        c.ThumbnailUrl,
        c.IntroVideoUrl,
        c.OriginalPrice,
        c.DiscountedPrice,
        c.Language,
        c.StatusID,
        c.PublishedAt,
        c.IsFeatured,
        c.CreatedAt,
        c.UpdatedAt,
        c.AverageRating,
        c.ReviewCount,
        cat.CategoryName,
        lvl.LevelName,
        cs.StatusName,
        up.AccountID AS InstructorAccountID,
        up.FullName AS InstructorName,
        up.AvatarUrl AS InstructorAvatar,
        COUNT(e.EnrollmentID) AS StudentCount
      FROM Courses c
      JOIN Categories cat ON c.CategoryID = cat.CategoryID
      JOIN Levels lvl ON c.LevelID = lvl.LevelID
      JOIN CourseStatuses cs ON c.StatusID = cs.StatusID
      JOIN UserProfiles up ON c.InstructorID = up.AccountID
      LEFT JOIN Enrollments e ON c.CourseID = e.CourseID
    `;

    let countQuery = `
      SELECT COUNT(DISTINCT c.CourseID) AS total
      FROM Courses c
      JOIN Categories cat ON c.CategoryID = cat.CategoryID
      JOIN Levels lvl ON c.LevelID = lvl.LevelID
      JOIN CourseStatuses cs ON c.StatusID = cs.StatusID
      JOIN UserProfiles up ON c.InstructorID = up.AccountID
    `;

    const whereClauses = [];

    /* ======================================================================
       [THÊM 17/08/2026 — Course Versioning]
       Luôn loại BẢN NHÁP ĐANG SOẠN khỏi mọi danh sách.
       Bản nháp cập nhật là một dòng Courses thật (StatusID = DRAFT, có
       LiveCourseID trỏ về bản đang chạy). Nếu không loại, giảng viên sẽ thấy
       khóa học của mình bị nhân đôi trong dashboard, và bộ đếm khóa học ở
       trang quản trị cũng bị thổi phồng.
       ====================================================================== */
    whereClauses.push('c.LiveCourseID IS NULL');

    /* Chỉ hiển thị PHIÊN BẢN MỚI NHẤT trên các danh sách công khai.
       Không áp dụng khi caller chủ động yêu cầu statusId = 'ALL' (dashboard
       của giảng viên / admin), vì ở đó họ cần thấy cả các phiên bản cũ.

       ⚠️ Điều kiện viết dạng `ISNULL(c.IsLatestVersion, 1) = 1` để hệ thống
       vẫn chạy đúng ngay cả khi migration V5 chưa được áp dụng (cột chưa tồn
       tại thì câu lệnh sẽ lỗi rõ ràng; còn nếu tồn tại mà dữ liệu cũ NULL thì
       vẫn được coi là bản mới nhất). */
    if (statusId && statusId.toUpperCase() !== 'ALL') {
      request.input('StatusID', sql.VarChar, statusId);
      whereClauses.push('c.StatusID = @StatusID');
      whereClauses.push('ISNULL(c.IsLatestVersion, 1) = 1');
    }
    if (categoryId) {
      request.input('CategoryID', sql.Int, categoryId);
      whereClauses.push('c.CategoryID = @CategoryID');
    }
    if (levelId) {
      request.input('LevelID', sql.Int, levelId);
      whereClauses.push('c.LevelID = @LevelID');
    }
    if (instructorId) {
      request.input('InstructorID', sql.BigInt, instructorId);
      whereClauses.push('c.InstructorID = @InstructorID');
    }
    if (isFeatured !== undefined) {
      request.input('IsFeatured', sql.Bit, Number(isFeatured));
      whereClauses.push('c.IsFeatured = @IsFeatured');
    }
    if (searchTerm) {
      request.input('Search', sql.NVarChar, `%${searchTerm}%`);
      whereClauses.push(
        '(c.CourseName LIKE @Search OR c.ShortDescription LIKE @Search OR up.FullName LIKE @Search)'
      );
    }
    if (language) {
      request.input('Language', sql.VarChar, language);
      whereClauses.push('c.Language = @Language');
    }

    const whereCondition =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    query += whereCondition;
    countQuery += whereCondition;

    query += `
      GROUP BY
        c.CourseID, c.CourseName, c.Slug, c.ShortDescription, c.FullDescription,
        c.Requirements, c.LearningOutcomes, c.ThumbnailUrl, c.IntroVideoUrl,
        c.OriginalPrice, c.DiscountedPrice, c.Language, c.StatusID, c.PublishedAt,
        c.IsFeatured, c.CreatedAt, c.UpdatedAt, c.AverageRating, c.ReviewCount,
        cat.CategoryName, lvl.LevelName, cs.StatusName, up.AccountID, up.FullName, up.AvatarUrl
    `;

    let orderByClause = 'ORDER BY c.CreatedAt DESC';
    if (sortBy) {
      const [sortField, sortOrder] = sortBy.split(':');
      const allowedSortFields = {
        CreatedAt: 'c.CreatedAt',
        PublishedAt: 'c.PublishedAt',
        Price: 'ISNULL(c.DiscountedPrice, c.OriginalPrice)',
        Name: 'c.CourseName',
      };
      const orderDirection =
        sortOrder?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

      if (allowedSortFields[sortField]) {
        orderByClause = `ORDER BY ${allowedSortFields[sortField]} ${orderDirection}`;
      }
    }
    query += ` ${orderByClause}`;

    if (limit > 0) {
      request.input('Limit', sql.Int, limit);
      request.input('Offset', sql.Int, offset);
      query += ' OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY';
    }

    const countResult = await request.query(countQuery);
    const { total } = countResult.recordset[0];

    const dataResult = await request.query(query);
    const courses = dataResult.recordset;
    return { courses, total };
  } catch (error) {
    logger.error('Error in findAllCourses repository:', error);
    throw error;
  }
};

/**
 * Cập nhật khóa học bằng ID.
 */
const updateCourseById = async (courseId, updateData, transaction = null) => {
  const executor = transaction
    ? transaction.request()
    : (await getConnection()).request();
  executor.input('CourseID', sql.BigInt, courseId);
  executor.input('UpdatedAt', sql.DateTime2, new Date());
  console.log(`Updating course ${courseId} with data:`, updateData);
  const setClauses = ['UpdatedAt = @UpdatedAt'];
  const pascalUpdateData = toPascalCaseObject(updateData);
  const keys = Object.keys(pascalUpdateData);

  keys.forEach((key) => {
    if (key !== 'CourseID' && key !== 'InstructorID' && key !== 'CreatedAt') {
      const value = pascalUpdateData[key];
      logger.info(`Updating ${key} to ${value}`);
      let sqlType;
      if (
        [
          'CourseName',
          'Slug',
          'ShortDescription',
          'FullDescription',
          'Requirements',
          'LearningOutcomes',
        ].includes(key)
      )
        sqlType = sql.NVarChar;
      else if (
        ['ThumbnailUrl', 'IntroVideoUrl', 'Language', 'StatusID'].includes(key)
      )
        sqlType = sql.VarChar;
      else if (['OriginalPrice', 'DiscountedPrice'].includes(key))
        sqlType = sql.Decimal(18, 4);
      else if (['CategoryID', 'LevelID'].includes(key)) sqlType = sql.Int;
      else if (['PublishedAt'].includes(key)) sqlType = sql.DateTime2;
      else if (['IsFeatured'].includes(key)) sqlType = sql.Bit;
      else if (['LiveCourseID'].includes(key)) sqlType = sql.BigInt;
      else return;

      executor.input(key, sqlType, value);
      setClauses.push(`${key} = @${key}`);
    }
  });

  if (setClauses.length === 1) return null;

  const query = `
        UPDATE Courses
        SET ${setClauses.join(', ')}
        OUTPUT Inserted.*
        WHERE CourseID = @CourseID;
    `;

  try {
    const result = await executor.query(query);
    return result.recordset[0];
  } catch (error) {
    logger.error(`Error updating course ${courseId}:`, error);
    throw error;
  }
};

/**
 * Xóa khóa học bằng ID (Cân nhắc xóa mềm).
 */
const deleteCourseById = async (courseId, transaction = null) => {
  try {
    const executor = transaction
      ? transaction.request()
      : (await getConnection()).request();
    executor.input('CourseID', sql.BigInt, courseId);
    console.log(`Deleting course with CourseID: ${courseId}`);
    const result = await executor.query(
      'DELETE FROM Courses WHERE CourseID = @CourseID'
    );
    console.log(
      `Rows affected when deleting course ${courseId}:`,
      result.rowsAffected[0]
    );
    return result.rowsAffected[0];
  } catch (error) {
    logger.error(`Error deleting course ${courseId}:`, error);
    if (error.number === 547) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Không thể xóa khóa học vì có dữ liệu liên quan (học viên đăng ký, bài học,...). Cân nhắc lưu trữ khóa học thay vì xóa.'
      );
    }
    throw error;
  }
};

/**
 * Tạo yêu cầu phê duyệt khóa học.
 */
const createCourseApprovalRequest = async ({
  courseId,
  instructorId,
  requestType,
  instructorNotes,
}) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input('CourseID', sql.BigInt, courseId);
    request.input('InstructorID', sql.BigInt, instructorId);
    request.input('RequestType', sql.VarChar, requestType);
    request.input('InstructorNotes', sql.NVarChar, instructorNotes);

    const result = await request.query(`
            INSERT INTO CourseApprovalRequests (CourseID, InstructorID, RequestType, InstructorNotes)
            OUTPUT Inserted.*
            VALUES (@CourseID, @InstructorID, @RequestType, @InstructorNotes);
        `);
    return result.recordset[0];
  } catch (error) {
    logger.error('Error creating course approval request:', error);
    throw error;
  }
};

/**
 * Tìm yêu cầu phê duyệt đang chờ xử lý theo CourseID.
 */
const findPendingApprovalRequestByCourseId = async (courseId) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input('CourseID', sql.BigInt, courseId);
    request.input('PendingStatus', sql.VarChar, 'PENDING');
    const result = await request.query(`
            SELECT *
            FROM CourseApprovalRequests
            WHERE CourseID = @CourseID AND Status = @PendingStatus
            ORDER BY CreatedAt DESC
        `);
    return result.recordset[0] || null;
  } catch (error) {
    logger.error(
      `Error finding pending approval for course ${courseId}:`,
      error
    );
    throw error;
  }
};

/**
 * Cập nhật trạng thái yêu cầu phê duyệt.
 */
const updateApprovalRequestStatus = async (
  requestId,
  { status, adminId, adminNotes }
) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input('RequestID', sql.BigInt, requestId);
    request.input('Status', sql.VarChar, status);
    request.input('AdminID', sql.BigInt, adminId);
    request.input('AdminNotes', sql.NVarChar, adminNotes);
    request.input('ReviewedAt', sql.DateTime2, new Date());
    request.input('UpdatedAt', sql.DateTime2, new Date());

    const result = await request.query(`
            UPDATE CourseApprovalRequests
            SET Status = @Status,
                AdminID = @AdminID,
                AdminNotes = @AdminNotes,
                ReviewedAt = @ReviewedAt,
                UpdatedAt = @UpdatedAt
            OUTPUT Inserted.*
            WHERE RequestID = @RequestID;
        `);
    return result.recordset[0];
  } catch (error) {
    logger.error(`Error updating approval request ${requestId}:`, error);
    throw error;
  }
};

/**
 * Lấy danh sách các yêu cầu phê duyệt khóa học.
 */
const findCourseApprovalRequests = async (filters = {}, options = {}) => {
  const { status, instructorId, courseId, searchTerm } = filters;
  const { page = 1, limit = 10, sortBy = 'CreatedAt:desc' } = options;
  const offset = (page - 1) * limit;

  try {
    const pool = await getConnection();
    const request = pool.request();

    const whereClauses = [];
    if (status) {
      request.input('Status', sql.VarChar, status);
      whereClauses.push('car.Status = @Status');
    }
    if (instructorId) {
      request.input('InstructorID', sql.BigInt, instructorId);
      whereClauses.push('car.InstructorID = @InstructorID');
    }
    if (courseId) {
      request.input('CourseID', sql.BigInt, courseId);
      whereClauses.push('car.CourseID = @CourseID');
    }
    if (searchTerm) {
      request.input('Search', sql.NVarChar, `%${searchTerm}%`);
      whereClauses.push(`
        (
          c.CourseName LIKE @Search OR
          instructor_up.FullName LIKE @Search OR
          car.InstructorNotes LIKE @Search OR
          car.AdminNotes LIKE @Search
        )
      `);
    }

    const whereCondition =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const commonJoins = `
          FROM CourseApprovalRequests car
          JOIN Courses c ON car.CourseID = c.CourseID
          JOIN UserProfiles instructor_up ON car.InstructorID = instructor_up.AccountID
          LEFT JOIN UserProfiles admin_up ON car.AdminID = admin_up.AccountID
      `;
    const commonQuery = `${commonJoins} ${whereCondition}`;

    const countResult = await request.query(
      `SELECT COUNT(car.RequestID) as total ${commonQuery}`
    );
    const { total } = countResult.recordset[0];

    let orderByClause = 'ORDER BY car.CreatedAt DESC';
    if (sortBy === 'CreatedAt:asc') {
      orderByClause = 'ORDER BY car.CreatedAt ASC';
    } else if (sortBy === 'ReviewedAt:desc') {
      orderByClause = 'ORDER BY car.ReviewedAt DESC, car.CreatedAt DESC';
    } else if (sortBy === 'ReviewedAt:asc') {
      orderByClause = 'ORDER BY car.ReviewedAt ASC, car.CreatedAt ASC';
    }

    request.input('Limit', sql.Int, limit);
    request.input('Offset', sql.Int, offset);
    const dataResult = await request.query(`
          SELECT
              car.RequestID, car.Status, car.RequestType, car.CreatedAt as RequestDate, car.ReviewedAt,
              car.InstructorNotes, car.AdminNotes,
              c.CourseID, c.CourseName, c.Slug as CourseSlug,
              instructor_up.FullName as InstructorName, car.InstructorID,
              admin_up.FullName as AdminName, car.AdminID
          ${commonQuery}
          ${orderByClause}
          OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
      `);

    return { requests: dataResult.recordset, total };
  } catch (error) {
    logger.error('Error finding course approval requests:', error);
    throw error;
  }
};

/**
 * Tìm một yêu cầu phê duyệt cụ thể bằng ID.
 */
const findCourseApprovalRequestById = async (requestId) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input('RequestID', sql.BigInt, requestId);

    const commonJoins = `
          FROM CourseApprovalRequests car
          JOIN Courses c ON car.CourseID = c.CourseID
          JOIN UserProfiles instructor_up ON car.InstructorID = instructor_up.AccountID
          LEFT JOIN UserProfiles admin_up ON car.AdminID = admin_up.AccountID
      `;
    const result = await request.query(`
         SELECT
          car.*,
          c.CourseName, c.Slug as CourseSlug, c.StatusID as CourseCurrentStatus,
          instructor_up.FullName as InstructorName,
          admin_up.FullName as AdminName
        ${commonJoins}
        WHERE car.RequestID = @RequestID;
      `);
    return result.recordset[0] || null;
  } catch (error) {
    logger.error(
      `Error finding course approval request by ID ${requestId}:`,
      error
    );
    throw error;
  }
};

/**
 * Tìm khóa học bằng Slug, bao gồm TOÀN BỘ chi tiết curriculum lồng nhau.
 */
const findCourseWithFullDetailsBySlug = async (
  slug,
  includeNonPublished = false,
  viewerAccountId = null
) => {
  logger.debug(
    `Fetching full course details for slug: ${slug}, includeNonPublished: ${includeNonPublished}`
  );
  const pool = await getConnection();
  const request = pool.request();
  request.input('Slug', sql.NVarChar, slug);

  try {
    let courseQuery = `
          SELECT c.*, cat.CategoryName, lvl.LevelName, cs.StatusName,
                 acc.Email as InstructorEmail, up.FullName as InstructorName, up.AvatarUrl as InstructorAvatar
          FROM Courses c
          JOIN Categories cat ON c.CategoryID = cat.CategoryID
          JOIN Levels lvl ON c.LevelID = lvl.LevelID
          JOIN CourseStatuses cs ON c.StatusID = cs.StatusID
          JOIN Accounts acc ON c.InstructorID = acc.AccountID
          JOIN UserProfiles up ON c.InstructorID = up.AccountID
          WHERE c.Slug = @Slug
      `;

    /* ======================================================================
       [SỬA 17/08/2026 — ĐIỀU KIỆN TIÊN QUYẾT CỦA COURSE VERSIONING]

       Trước đây: người dùng không phải admin/giảng viên chỉ xem được khóa có
       StatusID = 'PUBLISHED'. Điều này KHÔNG còn đúng khi có phiên bản:

         Học viên mua v1 → admin duyệt v2 → v1 chuyển sang SUPERSEDED
         → học viên vẫn thấy khóa trong "Khóa học của tôi" nhưng bấm vào bị 404.

       Nay bổ sung ngoại lệ: nếu người xem ĐÃ GHI DANH vào chính khóa học đó,
       họ được vào bất kể trạng thái. Đây chính là lời hứa cốt lõi của mô hình
       versioning — "đã mua v1 thì học v1 mãi mãi".

       Ngoại lệ này cũng đồng thời sửa luôn tình huống tương tự với ARCHIVED
       (giảng viên chủ động ngừng xuất bản).
       ====================================================================== */
    if (!includeNonPublished) {
      request.input('PublishedStatus', sql.VarChar, CourseStatus.PUBLISHED);

      if (viewerAccountId) {
        request.input('ViewerAccountID', sql.BigInt, viewerAccountId);
        courseQuery += `
          AND (
                c.StatusID = @PublishedStatus
             OR EXISTS (
                  SELECT 1 FROM Enrollments e
                   WHERE e.AccountID = @ViewerAccountID
                     AND e.CourseID  = c.CourseID
                )
          )`;
      } else {
        courseQuery += ' AND c.StatusID = @PublishedStatus';
      }
    }

    const courseResult = await request.query(courseQuery);
    const course = courseResult.recordset[0];

    if (!course) {
      logger.warn(`Course with slug "${slug}" not found or not accessible.`);
      return null;
    }

    course.sections = await sectionRepository.findAllSectionsWithDetails(
      course.CourseID
    );
    /* [SỬA 17/08/2026] Bổ sung lọc IsArchived cho cả thời lượng lẫn số bài học.
       Trước đây hai con số hiển thị trên trang bán khóa học ("Khóa học gồm N bài,
       tổng M giờ") bị THỔI PHỒNG vì tính cả bài/chương đã lưu trữ — những nội dung
       mà người mua sẽ không bao giờ nhìn thấy trong giáo trình. */
    const durationQuery = `
      SELECT SUM(ISNULL(l.VideoDurationSeconds, 0)) AS TotalDuration
      FROM Lessons l
      JOIN Sections s ON l.SectionID = s.SectionID
      WHERE s.CourseID = @CourseID
        AND l.IsArchived = 0 AND s.IsArchived = 0
    `;
    request.input('CourseID', sql.BigInt, course.CourseID);
    const durationResult = await request.query(durationQuery);
    course.totalDuration = durationResult.recordset[0]?.TotalDuration || 0;

    const lessonCountQuery = `
      SELECT COUNT(*) AS TotalLessons
      FROM Lessons l
      JOIN Sections s ON l.SectionID = s.SectionID
      WHERE s.CourseID = @CourseID
        AND l.IsArchived = 0 AND s.IsArchived = 0
    `;
    const lessonCountResult = await request.query(lessonCountQuery);
    course.totalLessons = lessonCountResult.recordset[0]?.TotalLessons || 0;

    const studentCountQuery = `
      SELECT COUNT(*) AS StudentCount
      FROM Enrollments
      WHERE CourseID = @CourseID
    `;
    const studentCountResult = await request.query(studentCountQuery);
    course.studentCount = studentCountResult.recordset[0]?.StudentCount || 0;

    logger.info(
      `Successfully fetched full details for course ${course.CourseID} (Slug: ${slug})`
    );
    return course;
  } catch (error) {
    logger.error(`Error fetching full course details for slug ${slug}:`, error);
    throw error;
  }
};

/**
 * Tìm khóa học bằng ID, bao gồm TOÀN BỘ chi tiết curriculum lồng nhau.
 */
const findCourseWithFullDetailsById = async (
  courseId,
  includeNonPublished = false
) => {
  logger.debug(
    `Fetching full course details for ID: ${courseId}, includeNonPublished: ${includeNonPublished}`
  );
  const pool = await getConnection();
  const request = pool.request();
  request.input('CourseID', sql.BigInt, courseId);

  try {
    let courseQuery = `
           SELECT c.*, cat.CategoryName, lvl.LevelName, cs.StatusName,
                  acc.Email as InstructorEmail, up.FullName as InstructorName, up.AvatarUrl as InstructorAvatar
           FROM Courses c
           JOIN Categories cat ON c.CategoryID = cat.CategoryID
           JOIN Levels lvl ON c.LevelID = lvl.LevelID
           JOIN CourseStatuses cs ON c.StatusID = cs.StatusID
           JOIN Accounts acc ON c.InstructorID = acc.AccountID
           JOIN UserProfiles up ON c.InstructorID = up.AccountID
           WHERE c.CourseID = @CourseID
       `;
    if (!includeNonPublished) {
      request.input('PublishedStatus', sql.VarChar, CourseStatus.PUBLISHED);
      courseQuery += ' AND c.StatusID = @PublishedStatus';
    }
    const courseResult = await request.query(courseQuery);
    const course = courseResult.recordset[0];
    if (!course) return null;

    course.sections = await sectionRepository.findAllSectionsWithDetails(
      course.CourseID
    );

    logger.info(
      `Successfully fetched full details for course ${course.CourseID}`
    );
    return course;
  } catch (error) {
    logger.error(
      `Error fetching full course details for ID ${courseId}:`,
      error
    );
    throw error;
  }
};

/**
 * Lấy tất cả trạng thái khóa học.
 */
const getAllCourseStatuses = async () => {
  try {
    const pool = await getConnection();
    const request = pool.request();

    const result = await request.query(`
      SELECT StatusID, StatusName, Description
      FROM CourseStatuses
      ORDER BY StatusName ASC
    `);

    return result.recordset;
  } catch (error) {
    logger.error('Error fetching course statuses:', error);
    throw error;
  }
};

/**
 * Tìm một khóa học cập nhật đang chờ xử lý (draft) cho một khóa học gốc (live).
 * @param {number} liveCourseId - ID của khóa học gốc (đã published).
 * @returns {Promise<object|null>} - Khóa học bản sao hoặc null.
 */
const findExistingUpdateDraft = async (liveCourseId) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input('LiveCourseID', sql.BigInt, liveCourseId);

    // Tìm khóa học có LiveCourseID trỏ đến khóa học gốc và không phải là ARCHIVED
    const result = await request.query(`
      SELECT * FROM Courses 
      WHERE LiveCourseID = @LiveCourseID AND StatusID != 'ARCHIVED';
    `);
    return result.recordset[0] || null;
  } catch (error) {
    logger.error(
      `Error finding existing update draft for live course ${liveCourseId}:`,
      error
    );
    throw error;
  }
};

/**
 * Clone một khóa học (không bao gồm sections/lessons).
 * @param {number} originalCourseId - ID khóa học gốc.
 * @param {object} overrides - Các giá trị cần ghi đè (vd: StatusID, LiveCourseID).
 * @param {object} transaction
 * @returns {Promise<object>} - Khóa học bản sao đã tạo.
 */
/**
 * [THÊM 17/08/2026 — Course Versioning]
 * Bảng ánh xạ kiểu dữ liệu cho các cột được phép ghi đè khi clone.
 *
 * Trước đây hàm này chỉ nhận biết 2 cột (LiveCourseID, StatusID), còn lại mặc
 * định là NVarChar. Khi bổ sung các cột phiên bản kiểu số/bit, nếu vẫn để mặc
 * định NVarChar thì driver mssql sẽ gửi chuỗi vào cột INT/BIT — SQL Server có
 * thể ép kiểu ngầm được nhưng cũng có thể ném lỗi chuyển đổi tùy giá trị.
 * Khai báo tường minh để tránh hành vi không xác định.
 */
const CLONE_OVERRIDE_SQL_TYPES = {
  StatusID: sql.VarChar,
  LiveCourseID: sql.BigInt,
  RootCourseID: sql.BigInt,
  PreviousVersionID: sql.BigInt,
  VersionNumber: sql.Int,
  IsLatestVersion: sql.Bit,
  VersionNotes: sql.NVarChar,
};

const cloneCourseRecord = async (originalCourseId, overrides, transaction) => {
  const request = transaction.request();
  request.input('OriginalCourseID', sql.BigInt, originalCourseId);

  // Ghi đè các giá trị cần thiết, với kiểu dữ liệu tường minh
  Object.entries(overrides).forEach(([key, value]) => {
    const sqlType = CLONE_OVERRIDE_SQL_TYPES[key];
    if (!sqlType) {
      // Chặn sớm thay vì âm thầm dùng sai kiểu — nếu cần ghi đè cột mới,
      // hãy khai báo kiểu của nó trong CLONE_OVERRIDE_SQL_TYPES ở trên.
      throw new Error(
        `cloneCourseRecord: chưa khai báo kiểu SQL cho cột ghi đè "${key}". ` +
          `Bổ sung vào CLONE_OVERRIDE_SQL_TYPES trước khi dùng.`
      );
    }
    request.input(key, sqlType, value);
  });

  const overrideKeys = Object.keys(overrides);
  const overrideColumns = overrideKeys.join(', ');
  const overrideValues = overrideKeys.map((key) => `@${key}`).join(', ');

  const query = `
    INSERT INTO Courses (
        CourseName, Slug, ShortDescription, FullDescription, Requirements, LearningOutcomes,
        ThumbnailUrl, IntroVideoUrl, OriginalPrice, DiscountedPrice, InstructorID,
        CategoryID, LevelID, Language, IsFeatured, ThumbnailPublicId, IntroVideoPublicId,
        ${overrideColumns}
    )
    OUTPUT Inserted.*
    SELECT
        CourseName, 
        CONCAT(Slug, '-update-', LOWER(SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 8))), -- Tạo slug mới duy nhất
        ShortDescription, FullDescription, Requirements, LearningOutcomes,
        ThumbnailUrl, IntroVideoUrl, OriginalPrice, DiscountedPrice, InstructorID,
        CategoryID, LevelID, Language, IsFeatured, ThumbnailPublicId, IntroVideoPublicId,
        ${overrideValues}
    FROM Courses
    WHERE CourseID = @OriginalCourseID;
  `;

  try {
    const result = await request.query(query);
    return result.recordset[0];
  } catch (error) {
    logger.error(`Error cloning course record for ${originalCourseId}:`, error);
    throw error;
  }
};

/* ==========================================================================
 * COURSE VERSIONING — các hàm repository phục vụ mô hình phiên bản
 * [THÊM 17/08/2026]
 * ========================================================================== */

/**
 * Thăng cấp một bản nháp thành phiên bản chính thức, đồng thời cho phiên bản
 * đang chạy "về hưu". Thực hiện TRỌN VẸN trong một transaction duy nhất.
 *
 * ⚠️ Nguyên tắc cốt lõi của mô hình versioning: hàm này TUYỆT ĐỐI KHÔNG chạm
 * vào Sections / Lessons / LessonProgress của phiên bản cũ. Dữ liệu học viên
 * an toàn không nhờ một cơ chế bảo vệ nào cả, mà đơn giản vì không có câu lệnh
 * nào tác động tới nó.
 *
 * @param {number} draftCourseId - Bản nháp sắp trở thành phiên bản mới.
 * @param {number} liveCourseId  - Phiên bản đang chạy, sắp chuyển sang SUPERSEDED.
 * @param {object} transaction   - Transaction đang mở.
 * @returns {Promise<{newSlug: string, retiredSlug: string, versionNumber: number}>}
 */
const promoteDraftToLiveVersion = async (
  draftCourseId,
  liveCourseId,
  transaction
) => {
  // --- 1. Đọc trạng thái hiện tại của cả hai bản ghi ---
  const readReq = transaction.request();
  readReq.input('DraftID', sql.BigInt, draftCourseId);
  readReq.input('LiveID', sql.BigInt, liveCourseId);
  const readResult = await readReq.query(`
    SELECT CourseID, Slug, VersionNumber, RootCourseID
    FROM Courses
    WHERE CourseID IN (@DraftID, @LiveID);
  `);

  const rows = readResult.recordset;
  const live = rows.find((r) => String(r.CourseID) === String(liveCourseId));
  const draft = rows.find((r) => String(r.CourseID) === String(draftCourseId));

  if (!live || !draft) {
    throw new Error(
      `promoteDraftToLiveVersion: không tìm thấy bản nháp (${draftCourseId}) hoặc bản live (${liveCourseId}).`
    );
  }

  const publicSlug = live.Slug; // Slug "đẹp" cần chuyển giao cho phiên bản mới
  const newVersionNumber = (live.VersionNumber || 1) + 1;
  const rootCourseId = live.RootCourseID || live.CourseID;

  /* Slug về hưu: gắn hậu tố phiên bản + CourseID.
     - Hậu tố CourseID đảm bảo DUY NHẤT tuyệt đối, kể cả khi có ai đó vô tình
       đặt tay một slug trùng dạng "abc--v1".
     - Courses.Slug là nvarchar(500): phải cắt phần gốc trước khi nối hậu tố,
       nếu không một slug dài sát trần sẽ làm câu UPDATE ném lỗi tràn chuỗi và
       kéo sập cả transaction duyệt. */
  const SLUG_MAX = 500;
  const suffix = `--v${live.VersionNumber || 1}-${live.CourseID}`;
  const retiredSlug = `${publicSlug.slice(0, SLUG_MAX - suffix.length)}${suffix}`;

  /* --- 2. Nhường slug: PHẢI đổi bản cũ TRƯỚC ---
     Ràng buộc UQ_Courses_Slug là UNIQUE. Nếu gán slug đẹp cho bản mới trước khi
     giải phóng nó khỏi bản cũ, câu lệnh sẽ vi phạm ràng buộc duy nhất và cả
     transaction bị rollback. Thứ tự ở đây là bắt buộc, không phải tùy chọn. */
  const retireReq = transaction.request();
  retireReq.input('LiveID', sql.BigInt, liveCourseId);
  retireReq.input('RetiredSlug', sql.NVarChar, retiredSlug);
  retireReq.input('SupersededStatus', sql.VarChar, 'SUPERSEDED');
  await retireReq.query(`
    UPDATE Courses
       SET Slug            = @RetiredSlug,
           StatusID        = @SupersededStatus,
           IsLatestVersion = 0,
           ArchivedAt      = GETDATE(),
           UpdatedAt       = GETDATE()
     WHERE CourseID = @LiveID;
  `);

  // --- 3. Bản nháp tiếp quản slug đẹp và trở thành phiên bản chính thức ---
  const promoteReq = transaction.request();
  promoteReq.input('DraftID', sql.BigInt, draftCourseId);
  promoteReq.input('PublicSlug', sql.NVarChar, publicSlug);
  promoteReq.input('PublishedStatus', sql.VarChar, 'PUBLISHED');
  promoteReq.input('VersionNumber', sql.Int, newVersionNumber);
  promoteReq.input('RootCourseID', sql.BigInt, rootCourseId);
  promoteReq.input('PreviousVersionID', sql.BigInt, liveCourseId);
  await promoteReq.query(`
    UPDATE Courses
       SET Slug              = @PublicSlug,
           StatusID          = @PublishedStatus,
           IsLatestVersion   = 1,
           VersionNumber     = @VersionNumber,
           RootCourseID      = @RootCourseID,
           PreviousVersionID = @PreviousVersionID,
           LiveCourseID      = NULL,   -- Không còn là bản nháp của ai nữa
           PublishedAt       = GETDATE(),
           UpdatedAt         = GETDATE()
     WHERE CourseID = @DraftID;
  `);

  return { newSlug: publicSlug, retiredSlug, versionNumber: newVersionNumber };
};

/**
 * Lấy toàn bộ các phiên bản thuộc cùng một "dòng" khóa học, mới nhất trước.
 * Dùng cho màn hình "Lịch sử phiên bản" và cho việc gom nhóm báo cáo.
 * @param {number} rootCourseId
 * @returns {Promise<object[]>}
 */
const findVersionsByRootId = async (rootCourseId) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input('RootCourseID', sql.BigInt, rootCourseId);
    const result = await request.query(`
      SELECT CourseID, CourseName, Slug, StatusID, VersionNumber,
             PreviousVersionID, IsLatestVersion, VersionNotes,
             PublishedAt, ArchivedAt, CreatedAt,
             (SELECT COUNT(*) FROM Enrollments e WHERE e.CourseID = c.CourseID) AS StudentCount,
             (SELECT COUNT(*) FROM Lessons l
                JOIN Sections s ON l.SectionID = s.SectionID
               WHERE s.CourseID = c.CourseID
                 AND l.IsArchived = 0 AND s.IsArchived = 0)               AS TotalLessons
      FROM Courses c
      /* [SỬA 19/08/2026] Thêm vế: OR CourseID = @RootCourseID

         createCourse KHÔNG gán RootCourseID cho khóa mới — cột đó để NULL, và
         chỉ được điền khi createUpdateSession sinh ra bản sao đời sau (xem
         courses.service.js ~dòng 1675). Nghĩa là hàng GỐC không bao giờ khớp
         điều kiện RootCourseID = @RootCourseID.

         ⚠️ Chú thích này nằm TRONG một template literal của JavaScript, nên
         tuyệt đối không dùng dấu backtick ở đây — nó sẽ đóng chuỗi giữa chừng
         và làm cả tệp không nạp được.

         Hậu quả: mọi khóa học chưa từng lên đời đều có lịch sử phiên bản RỖNG,
         và ngay cả khóa đã lên đời cũng mất hàng v1 — đúng thứ mà bảng "Lịch
         sử phiên bản" sinh ra để hiển thị.

         Vế LiveCourseID IS NULL giữ nguyên: bản nháp đang soạn dở chưa phải
         một phiên bản, không nên nằm trong lịch sử. */
      WHERE (RootCourseID = @RootCourseID OR CourseID = @RootCourseID)
        AND LiveCourseID IS NULL          -- loại bản nháp đang soạn dở
      ORDER BY VersionNumber DESC;
    `);
    return result.recordset;
  } catch (error) {
    logger.error(`Error finding versions for root course ${rootCourseId}:`, error);
    throw error;
  }
};

/**
 * Kiểm tra một tài khoản đã ghi danh vào khóa học cụ thể chưa.
 * Đặt tại repository của courses (thay vì gọi chéo sang enrollments.service)
 * để dùng được ngay trong tầng truy vấn mà không tạo phụ thuộc vòng.
 * @param {number} accountId
 * @param {number} courseId
 * @returns {Promise<boolean>}
 */
const hasEnrollment = async (accountId, courseId) => {
  if (!accountId || !courseId) return false;
  const pool = await getConnection();
  const request = pool.request();
  request.input('AccountID', sql.BigInt, accountId);
  request.input('CourseID', sql.BigInt, courseId);
  const result = await request.query(`
    SELECT TOP 1 1 AS Found FROM Enrollments
     WHERE AccountID = @AccountID AND CourseID = @CourseID;
  `);
  return result.recordset.length > 0;
};

/**
 * Kiểm tra học viên có ghi danh vào BẤT KỲ phiên bản nào cùng một dòng khóa học.
 *
 * Vì sao cần riêng một hàm: học viên mua v1, nay hệ thống đã lên v2. Khi họ mở
 * màn hình "Lịch sử phiên bản" từ trang khóa học công khai, ID gửi lên là v2 —
 * phiên bản họ CHƯA mua. Nếu chỉ so khớp đúng một CourseID thì chính chủ sở hữu
 * v1 lại bị từ chối xem lịch sử dòng khóa học của mình. Đối chiếu theo
 * RootCourseID mới phản ánh đúng quyền.
 *
 * @param {number} accountId
 * @param {number} rootCourseId - Gốc của dòng khóa học.
 * @returns {Promise<boolean>}
 */
const hasEnrollmentInCourseFamily = async (accountId, rootCourseId) => {
  if (!accountId || !rootCourseId) return false;
  const pool = await getConnection();
  const request = pool.request();
  request.input('AccountID', sql.BigInt, accountId);
  request.input('RootCourseID', sql.BigInt, rootCourseId);
  const result = await request.query(`
    SELECT TOP 1 1 AS Found
      FROM Enrollments e
      JOIN Courses c ON e.CourseID = c.CourseID
     WHERE e.AccountID = @AccountID
       AND ISNULL(c.RootCourseID, c.CourseID) = @RootCourseID;
  `);
  return result.recordset.length > 0;
};

/**
 * Clone tất cả sections và các thành phần con từ khóa học này sang khóa học khác.
 * Chỉ clone những mục có IsArchived = 0.
 * @param {number} fromCourseId - ID khóa học gốc.
 * @param {number} toCourseId - ID khóa học bản sao.
 * @param {object} transaction - DB Transaction đang hoạt động.
 * @returns {Promise<void>}
 */
const cloneCurriculum = async (fromCourseId, toCourseId, transaction) => {
  // 1. Lấy tất cả sections hợp lệ của khóa học gốc
  const getSectionsRequest = transaction.request();
  getSectionsRequest.input('FromCourseID', sql.BigInt, fromCourseId);
  const sectionsResult = await getSectionsRequest.query(`
        SELECT SectionID, SectionName, SectionOrder, Description 
        FROM Sections 
        WHERE CourseID = @FromCourseID AND IsArchived = 0
        ORDER BY SectionOrder ASC;
    `);

  // Lặp qua từng section để clone
  for (const section of sectionsResult.recordset) {
    // 2. TẠO SECTION MỚI
    const insertSectionRequest = transaction.request();
    insertSectionRequest.input('ToCourseID', sql.BigInt, toCourseId);
    insertSectionRequest.input(
      'SectionName',
      sql.NVarChar,
      section.SectionName
    );
    insertSectionRequest.input('SectionOrder', sql.Int, section.SectionOrder);
    insertSectionRequest.input(
      'Description',
      sql.NVarChar,
      section.Description
    );
    insertSectionRequest.input('OriginalID', sql.BigInt, section.SectionID); // Lưu ID gốc

    const newSectionResult = await insertSectionRequest.query(`
            INSERT INTO Sections (CourseID, SectionName, SectionOrder, Description, OriginalID)
            OUTPUT Inserted.SectionID
            VALUES (@ToCourseID, @SectionName, @SectionOrder, @Description, @OriginalID);
        `);
    const newSectionId = newSectionResult.recordset[0].SectionID;

    // 3. LẤY TẤT CẢ LESSONS HỢP LỆ CỦA SECTION GỐC
    const getLessonsRequest = transaction.request();
    getLessonsRequest.input('OriginalSectionID', sql.BigInt, section.SectionID);
    const lessonsResult = await getLessonsRequest.query(`
            SELECT * FROM Lessons WHERE SectionID = @OriginalSectionID AND IsArchived = 0;
        `);

    // Lặp qua từng lesson để clone
    for (const lesson of lessonsResult.recordset) {
      // 4. TẠO LESSON MỚI
      const insertLessonRequest = transaction.request();
      // Map tất cả các cột từ lesson cũ sang lesson mới
      insertLessonRequest.input('NewSectionID', sql.BigInt, newSectionId);
      insertLessonRequest.input('LessonName', sql.NVarChar, lesson.LessonName);
      insertLessonRequest.input(
        'Description',
        sql.NVarChar,
        lesson.Description
      );
      insertLessonRequest.input('LessonOrder', sql.Int, lesson.LessonOrder);
      insertLessonRequest.input('LessonType', sql.VarChar, lesson.LessonType);
      insertLessonRequest.input(
        'ExternalVideoID',
        sql.VarChar,
        lesson.ExternalVideoID
      );
      insertLessonRequest.input(
        'ThumbnailUrl',
        sql.VarChar,
        lesson.ThumbnailUrl
      );
      insertLessonRequest.input(
        'VideoDurationSeconds',
        sql.Int,
        lesson.VideoDurationSeconds
      );
      insertLessonRequest.input(
        'TextContent',
        sql.NVarChar,
        lesson.TextContent
      );
      insertLessonRequest.input('IsFreePreview', sql.Bit, lesson.IsFreePreview);
      insertLessonRequest.input(
        'VideoSourceType',
        sql.VarChar,
        lesson.VideoSourceType
      );
      insertLessonRequest.input('OriginalID', sql.BigInt, lesson.LessonID); // Lưu ID gốc

      const newLessonResult = await insertLessonRequest.query(`
                INSERT INTO Lessons (
                    SectionID, LessonName, Description, LessonOrder, LessonType, 
                    ExternalVideoID, ThumbnailUrl, VideoDurationSeconds, TextContent, 
                    IsFreePreview, VideoSourceType, OriginalID
                )
                OUTPUT Inserted.LessonID
                VALUES (
                    @NewSectionID, @LessonName, @Description, @LessonOrder, @LessonType,
                    @ExternalVideoID, @ThumbnailUrl, @VideoDurationSeconds, @TextContent,
                    @IsFreePreview, @VideoSourceType, @OriginalID
                );
            `);
      const newLessonId = newLessonResult.recordset[0].LessonID;

      // 5. CLONE CÁC THÀNH PHẦN CON CỦA LESSON

      // 5.1. CLONE QUIZ QUESTIONS & OPTIONS
      if (lesson.LessonType === 'QUIZ') {
        const getQuestionsRequest = transaction.request();
        getQuestionsRequest.input(
          'OriginalLessonID_Q',
          sql.BigInt,
          lesson.LessonID
        );
        const questionsResult = await getQuestionsRequest.query(`
                    SELECT * FROM QuizQuestions WHERE LessonID = @OriginalLessonID_Q;
                `);

        for (const question of questionsResult.recordset) {
          const insertQuestionRequest = transaction.request();
          insertQuestionRequest.input('NewLessonID_Q', sql.BigInt, newLessonId);
          insertQuestionRequest.input(
            'QuestionText',
            sql.NVarChar,
            question.QuestionText
          );
          insertQuestionRequest.input(
            'Explanation',
            sql.NVarChar,
            question.Explanation
          );
          insertQuestionRequest.input(
            'QuestionOrder',
            sql.Int,
            question.QuestionOrder
          );
          const newQuestionResult = await insertQuestionRequest.query(`
                        INSERT INTO QuizQuestions (LessonID, QuestionText, Explanation, QuestionOrder)
                        OUTPUT Inserted.QuestionID
                        VALUES (@NewLessonID_Q, @QuestionText, @Explanation, @QuestionOrder);
                    `);
          const newQuestionId = newQuestionResult.recordset[0].QuestionID;

          // Clone options for this question
          const getOptionsRequest = transaction.request();
          getOptionsRequest.input(
            'OriginalQuestionID',
            sql.Int,
            question.QuestionID
          );
          const optionsResult = await getOptionsRequest.query(`
                        SELECT * FROM QuizOptions WHERE QuestionID = @OriginalQuestionID;
                    `);
          for (const option of optionsResult.recordset) {
            const insertOptionRequest = transaction.request();
            insertOptionRequest.input('NewQuestionID', sql.Int, newQuestionId);
            insertOptionRequest.input(
              'OptionText',
              sql.NVarChar,
              option.OptionText
            );
            insertOptionRequest.input(
              'IsCorrectAnswer',
              sql.Bit,
              option.IsCorrectAnswer
            );
            insertOptionRequest.input(
              'OptionOrder',
              sql.Int,
              option.OptionOrder
            );
            await insertOptionRequest.query(`
                            INSERT INTO QuizOptions (QuestionID, OptionText, IsCorrectAnswer, OptionOrder)
                            VALUES (@NewQuestionID, @OptionText, @IsCorrectAnswer, @OptionOrder);
                        `);
          }
        }
      }

      // 5.2. CLONE ATTACHMENTS
      const getAttachmentsRequest = transaction.request();
      getAttachmentsRequest.input(
        'OriginalLessonID_A',
        sql.BigInt,
        lesson.LessonID
      );
      const attachmentsResult = await getAttachmentsRequest.query(`
                SELECT * FROM LessonAttachments WHERE LessonID = @OriginalLessonID_A;
            `);
      for (const attachment of attachmentsResult.recordset) {
        const insertAttachmentRequest = transaction.request();
        insertAttachmentRequest.input('NewLessonID_A', sql.BigInt, newLessonId);
        insertAttachmentRequest.input(
          'FileName',
          sql.NVarChar,
          attachment.FileName
        );
        insertAttachmentRequest.input(
          'FileURL',
          sql.VarChar,
          attachment.FileURL
        );
        insertAttachmentRequest.input(
          'FileType',
          sql.VarChar,
          attachment.FileType
        );
        insertAttachmentRequest.input(
          'FileSize',
          sql.BigInt,
          attachment.FileSize
        );
        insertAttachmentRequest.input(
          'CloudStorageID',
          sql.VarChar,
          attachment.CloudStorageID
        );
        await insertAttachmentRequest.query(`
                    INSERT INTO LessonAttachments (LessonID, FileName, FileURL, FileType, FileSize, CloudStorageID)
                    VALUES (@NewLessonID_A, @FileName, @FileURL, @FileType, @FileSize, @CloudStorageID);
                `);
      }

      // 5.3. CLONE SUBTITLES
      const getSubtitlesRequest = transaction.request();
      getSubtitlesRequest.input(
        'OriginalLessonID_S',
        sql.BigInt,
        lesson.LessonID
      );
      const subtitlesResult = await getSubtitlesRequest.query(`
                SELECT * FROM LessonSubtitles WHERE LessonID = @OriginalLessonID_S;
            `);
      for (const subtitle of subtitlesResult.recordset) {
        const insertSubtitleRequest = transaction.request();
        insertSubtitleRequest.input('NewLessonID_S', sql.BigInt, newLessonId);
        insertSubtitleRequest.input(
          'LanguageCode',
          sql.VarChar,
          subtitle.LanguageCode
        );
        insertSubtitleRequest.input(
          'SubtitleUrl',
          sql.VarChar,
          subtitle.SubtitleUrl
        );
        insertSubtitleRequest.input('IsDefault', sql.Bit, subtitle.IsDefault);
        await insertSubtitleRequest.query(`
                    INSERT INTO LessonSubtitles (LessonID, LanguageCode, SubtitleUrl, IsDefault)
                    VALUES (@NewLessonID_S, @LanguageCode, @SubtitleUrl, @IsDefault);
                `);
      }
    }
  }
};

module.exports = {
  createCourse,
  findCourseById,
  findCourseBySlug,
  findCourseIdBySlug,
  findAllCourses,
  updateCourseById,
  deleteCourseById,
  createCourseApprovalRequest,
  findPendingApprovalRequestByCourseId,
  updateApprovalRequestStatus,
  findCourseApprovalRequests,
  findCourseApprovalRequestById,
  findCourseWithFullDetailsBySlug,
  findCourseWithFullDetailsById,
  getAllCourseStatuses,
  findExistingUpdateDraft,
  cloneCourseRecord,
  cloneCurriculum,
  // --- Course Versioning (thêm 17/08/2026) ---
  promoteDraftToLiveVersion,
  findVersionsByRootId,
  hasEnrollment,
  hasEnrollmentInCourseFamily,
};
