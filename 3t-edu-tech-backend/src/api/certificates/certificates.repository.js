/* ============================================================================
 * certificates.repository.js
 * [THÊM 17/08/2026 — LEVEL 2, mục 2.1]
 *
 * Tầng truy cập dữ liệu cho bảng Certificates (tạo bởi V6__certificates.sql).
 *
 * NGUYÊN TẮC BẤT BIẾN: bảng này KHÔNG có hàm UPDATE nội dung và KHÔNG có hàm
 * DELETE. Chứng chỉ đã cấp là giấy tờ — sửa được thì mất hết giá trị pháp lý.
 * Thao tác duy nhất làm thay đổi một chứng chỉ là THU HỒI (revoke), và thao tác
 * đó chỉ ghi thêm dấu vết (IsRevoked / RevokedAt / RevokedReason / RevokedBy)
 * chứ không xóa hay sửa nội dung gốc.
 * ========================================================================== */

const { getConnection, sql } = require('../../database/connection');
const logger = require('../../utils/logger');

/** Mã lỗi SQL Server khi vi phạm ràng buộc UNIQUE / PRIMARY KEY. */
const SQL_ERR_UNIQUE_VIOLATION = 2627;
const SQL_ERR_DUPLICATE_KEY_INDEX = 2601;

/**
 * Các cột dùng chung cho mọi truy vấn đọc chứng chỉ.
 * Gom vào một hằng số để 4 câu SELECT bên dưới không bị lệch nhau theo thời
 * gian — lệch cột là nguồn gốc kinh điển của lỗi "chỗ này có QR, chỗ kia không".
 */
const CERTIFICATE_SELECT_COLUMNS = `
    c.CertificateID,
    c.CertificateCode,
    c.AccountID,
    c.CourseID,
    c.EnrollmentID,
    c.StudentNameSnapshot,
    c.CourseNameSnapshot,
    c.InstructorNameSnapshot,
    c.CourseVersionNumber,
    c.TotalLessonsSnapshot,
    c.FinalQuizAverage,
    c.CompletedAt,
    c.VerificationHash,
    c.IssuedAt,
    c.IsRevoked,
    c.RevokedAt,
    c.RevokedReason`;

/**
 * Tạo mới một chứng chỉ.
 *
 * ⚠️ Hàm này CÓ THỂ ném lỗi trùng khóa (UNIQUE AccountID+CourseID) khi hai
 * request cùng phát hiện học viên hoàn thành khóa học trong cùng một khoảnh
 * khắc — tình huống hoàn toàn có thật vì `markLessonCompletion` và
 * `getCourseProgress` đều tự động khóa hoàn thành. Người gọi PHẢI xử lý bằng
 * `isDuplicateCertificateError()` rồi đọc lại bản ghi đã có, thay vì trả lỗi
 * 500 cho học viên vừa tốt nghiệp.
 *
 * @param {object} data - Dữ liệu chứng chỉ (đặt tên theo cột DB).
 * @returns {Promise<object>} Bản ghi vừa tạo.
 */
const createCertificate = async (data) => {
  const pool = await getConnection();
  const request = pool.request();

  request.input('CertificateCode', sql.VarChar(50), data.CertificateCode);
  request.input('AccountID', sql.BigInt, data.AccountID);
  request.input('CourseID', sql.BigInt, data.CourseID);
  request.input('EnrollmentID', sql.BigInt, data.EnrollmentID ?? null);
  request.input(
    'StudentNameSnapshot',
    sql.NVarChar(150),
    data.StudentNameSnapshot
  );
  request.input(
    'CourseNameSnapshot',
    sql.NVarChar(500),
    data.CourseNameSnapshot
  );
  request.input(
    'InstructorNameSnapshot',
    sql.NVarChar(150),
    data.InstructorNameSnapshot ?? null
  );
  request.input('CourseVersionNumber', sql.Int, data.CourseVersionNumber ?? 1);
  request.input(
    'TotalLessonsSnapshot',
    sql.Int,
    data.TotalLessonsSnapshot ?? null
  );
  request.input(
    'FinalQuizAverage',
    sql.Decimal(5, 2),
    data.FinalQuizAverage ?? null
  );
  request.input('CompletedAt', sql.DateTime2, data.CompletedAt ?? null);
  request.input('VerificationHash', sql.VarChar(128), data.VerificationHash);
  request.input('IssuedAt', sql.DateTime2, data.IssuedAt);

  const result = await request.query(`
    INSERT INTO Certificates (
      CertificateCode, AccountID, CourseID, EnrollmentID,
      StudentNameSnapshot, CourseNameSnapshot, InstructorNameSnapshot,
      CourseVersionNumber, TotalLessonsSnapshot,
      FinalQuizAverage, CompletedAt, VerificationHash, IssuedAt
    )
    OUTPUT INSERTED.*
    VALUES (
      @CertificateCode, @AccountID, @CourseID, @EnrollmentID,
      @StudentNameSnapshot, @CourseNameSnapshot, @InstructorNameSnapshot,
      @CourseVersionNumber, @TotalLessonsSnapshot,
      @FinalQuizAverage, @CompletedAt, @VerificationHash, @IssuedAt
    );
  `);

  return result.recordset[0];
};

/**
 * Lỗi vừa bắt được có phải do trùng chứng chỉ (đã cấp rồi) hay không?
 * Tách thành hàm riêng để tầng service không phải nhớ mã lỗi của SQL Server.
 * @param {Error} error
 * @returns {boolean}
 */
const isDuplicateCertificateError = (error) =>
  error &&
  (error.number === SQL_ERR_UNIQUE_VIOLATION ||
    error.number === SQL_ERR_DUPLICATE_KEY_INDEX);

/**
 * Tìm chứng chỉ theo mã công khai. Dùng cho trang xác minh /verify/:code.
 *
 * Join thêm Courses/UserProfiles để lấy dữ liệu HIỆN TẠI phục vụ hiển thị phụ
 * (ảnh đại diện, slug khóa học). Nội dung chính thức của chứng chỉ vẫn lấy từ
 * các cột *Snapshot — đó mới là thứ được ký bằng VerificationHash.
 *
 * @param {string} code
 * @returns {Promise<object|null>}
 */
const findCertificateByCode = async (code) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input('CertificateCode', sql.VarChar(50), code);
    const result = await request.query(`
      SELECT ${CERTIFICATE_SELECT_COLUMNS},
             co.Slug            AS CourseSlug,
             co.ThumbnailUrl    AS CourseThumbnailUrl,
             up.AvatarUrl       AS StudentAvatarUrl,
             cat.CategoryName   AS CategoryName,
             lvl.LevelName      AS LevelName
        FROM Certificates c
        JOIN Courses co       ON c.CourseID = co.CourseID
        LEFT JOIN UserProfiles up  ON c.AccountID = up.AccountID
        LEFT JOIN Categories cat   ON co.CategoryID = cat.CategoryID
        LEFT JOIN Levels lvl       ON co.LevelID = lvl.LevelID
       WHERE c.CertificateCode = @CertificateCode;
    `);
    return result.recordset[0] || null;
  } catch (error) {
    logger.error(`Error finding certificate by code ${code}:`, error);
    throw error;
  }
};

/**
 * Tìm chứng chỉ của một học viên cho một phiên bản khóa học cụ thể.
 * Đây là hàm kiểm tra "đã cấp chưa" trước khi cấp mới.
 * @param {number} accountId
 * @param {number} courseId
 * @returns {Promise<object|null>}
 */
const findCertificateByAccountAndCourse = async (accountId, courseId) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input('AccountID', sql.BigInt, accountId);
    request.input('CourseID', sql.BigInt, courseId);
    const result = await request.query(`
      SELECT ${CERTIFICATE_SELECT_COLUMNS}
        FROM Certificates c
       WHERE c.AccountID = @AccountID AND c.CourseID = @CourseID;
    `);
    return result.recordset[0] || null;
  } catch (error) {
    logger.error(
      `Error finding certificate for account ${accountId}, course ${courseId}:`,
      error
    );
    throw error;
  }
};

/**
 * Danh sách toàn bộ chứng chỉ của một học viên, mới nhất trước.
 * @param {number} accountId
 * @returns {Promise<object[]>}
 */
const findCertificatesByAccountId = async (accountId) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input('AccountID', sql.BigInt, accountId);
    const result = await request.query(`
      SELECT ${CERTIFICATE_SELECT_COLUMNS},
             co.Slug          AS CourseSlug,
             co.ThumbnailUrl  AS CourseThumbnailUrl,
             cat.CategoryName AS CategoryName,
             lvl.LevelName    AS LevelName
        FROM Certificates c
        JOIN Courses co     ON c.CourseID = co.CourseID
        LEFT JOIN Categories cat ON co.CategoryID = cat.CategoryID
        LEFT JOIN Levels lvl     ON co.LevelID = lvl.LevelID
       WHERE c.AccountID = @AccountID
       ORDER BY c.IssuedAt DESC;
    `);
    return result.recordset;
  } catch (error) {
    logger.error(`Error listing certificates for account ${accountId}:`, error);
    throw error;
  }
};

/**
 * Thu hồi một chứng chỉ. Chỉ ghi thêm dấu vết, KHÔNG sửa nội dung gốc.
 *
 * Điều kiện `AND IsRevoked = 0` khiến thao tác trở nên idempotent: bấm thu hồi
 * hai lần thì lần thứ hai trả về null thay vì ghi đè mất thời điểm/người thu
 * hồi ban đầu — chính là thông tin cần cho kiểm toán.
 *
 * @param {string} code
 * @param {number} adminId
 * @param {string} reason
 * @returns {Promise<object|null>} Bản ghi sau thu hồi, hoặc null nếu đã bị thu hồi trước đó.
 */
const revokeCertificateByCode = async (code, adminId, reason) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input('CertificateCode', sql.VarChar(50), code);
    request.input('RevokedByAdminID', sql.BigInt, adminId);
    request.input('RevokedReason', sql.NVarChar(500), reason);
    const result = await request.query(`
      UPDATE Certificates
         SET IsRevoked        = 1,
             RevokedAt        = GETDATE(),
             RevokedReason    = @RevokedReason,
             RevokedByAdminID = @RevokedByAdminID
      OUTPUT INSERTED.*
       WHERE CertificateCode = @CertificateCode
         AND IsRevoked = 0;
    `);
    return result.recordset[0] || null;
  } catch (error) {
    logger.error(`Error revoking certificate ${code}:`, error);
    throw error;
  }
};

/**
 * Gom dữ liệu cần thiết để cấp chứng chỉ, bằng MỘT truy vấn duy nhất.
 *
 * Vì sao gộp: cấp chứng chỉ chạy ngay trong luồng "học viên bấm hoàn thành bài
 * cuối". Tách thành 4-5 truy vấn nhỏ sẽ cộng thêm độ trễ vào đúng thao tác mà
 * người dùng đang chờ màn hình phản hồi.
 *
 * Điểm quan trọng về COURSE VERSIONING: mọi thứ ở đây đều lấy theo `CourseID`
 * mà học viên thực sự ghi danh — tức đúng PHIÊN BẢN họ đã học. Nếu khóa học đã
 * lên v2, chứng chỉ vẫn ghi tên và số bài của v1.
 *
 * @param {number} accountId
 * @param {number} courseId
 * @returns {Promise<object|null>}
 */
const findIssuanceDataSnapshot = async (accountId, courseId) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input('AccountID', sql.BigInt, accountId);
    request.input('CourseID', sql.BigInt, courseId);
    const result = await request.query(`
      SELECT
          e.EnrollmentID,
          e.IsCompleted,
          e.CompletedAt,
          acc.Email                     AS StudentEmail,
          ISNULL(up.FullName, N'Học viên') AS StudentName,
          co.CourseName,
          co.Slug                       AS CourseSlug,
          ISNULL(co.VersionNumber, 1)   AS CourseVersionNumber,
          iup.FullName                  AS InstructorName,
          (
            SELECT COUNT(*)
              FROM Lessons l
              JOIN Sections s ON l.SectionID = s.SectionID
             WHERE s.CourseID = co.CourseID
               AND l.IsArchived = 0 AND s.IsArchived = 0
          )                             AS TotalLessons,
          /* Điểm trung bình bài kiểm tra: lấy LẦN THỬ CAO NHẤT của mỗi bài quiz
             rồi mới trung bình. Nếu trung bình thẳng mọi lần thử thì học viên
             làm lại nhiều lần để cải thiện sẽ bị điểm THẤP hơn người làm một
             lần — vô lý và ngược với mục đích cho phép làm lại.

             ⚠️ Bên trong dùng @AccountID/@CourseID chứ KHÔNG dùng e.AccountID/
             co.CourseID. SQL Server không cho bảng dẫn xuất trong FROM (...)
             tham chiếu cột của truy vấn ngoài — sẽ báo "The multi-part
             identifier could not be bound". Hai tham số mang đúng giá trị đó
             nên kết quả tương đương mà vẫn hợp lệ. */
          (
            SELECT AVG(x.BestScore)
              FROM (
                SELECT MAX(qa.Score) AS BestScore
                  FROM QuizAttempts qa
                  JOIN Lessons l2  ON qa.LessonID = l2.LessonID
                  JOIN Sections s2 ON l2.SectionID = s2.SectionID
                 WHERE qa.AccountID = @AccountID
                   AND s2.CourseID  = @CourseID
                   AND qa.Score IS NOT NULL
                 GROUP BY qa.LessonID
              ) x
          )                             AS FinalQuizAverage
        FROM Enrollments e
        JOIN Courses co        ON e.CourseID = co.CourseID
        JOIN Accounts acc      ON e.AccountID = acc.AccountID
        LEFT JOIN UserProfiles up  ON e.AccountID = up.AccountID
        LEFT JOIN UserProfiles iup ON co.InstructorID = iup.AccountID
       WHERE e.AccountID = @AccountID
         AND e.CourseID  = @CourseID;
    `);
    return result.recordset[0] || null;
  } catch (error) {
    logger.error(
      `Error gathering certificate issuance data (account ${accountId}, course ${courseId}):`,
      error
    );
    throw error;
  }
};

module.exports = {
  createCertificate,
  isDuplicateCertificateError,
  findCertificateByCode,
  findCertificateByAccountAndCourse,
  findCertificatesByAccountId,
  revokeCertificateByCode,
  findIssuanceDataSnapshot,
};
