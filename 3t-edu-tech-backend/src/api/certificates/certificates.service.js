/* ============================================================================
 * certificates.service.js
 * [THÊM 17/08/2026 — LEVEL 2, mục 2.1 + 2.2]
 *
 * VẤN ĐỀ CŨ: frontend tự ghép mã chứng chỉ ngay trên trình duyệt
 * (`CERT-${courseId}-${accountId}`). Mã đó KHÔNG lưu ở đâu, KHÔNG xác minh
 * được, và bất kỳ ai biết công thức cũng tự chế ra được một mã "hợp lệ" —
 * nghĩa là chứng chỉ hoàn toàn vô giá trị.
 *
 * CÁCH LÀM MỚI — ba lớp:
 *   1. Mã ngẫu nhiên (CertificateCode) do server sinh, lưu trong DB. Không
 *      đoán được, không tự chế được.
 *   2. Chữ ký HMAC-SHA256 (VerificationHash) trên nội dung cốt lõi. Kẻ tấn công
 *      dù ghi thẳng được vào DB cũng không tạo nổi chữ ký hợp lệ nếu không có
 *      CERTIFICATE_SECRET.
 *   3. Endpoint xác minh CÔNG KHAI — ai cầm tờ chứng chỉ (hoặc quét QR) cũng
 *      kiểm tra được, không cần tài khoản.
 * ========================================================================== */

const crypto = require('crypto');
const httpStatus = require('http-status').status;

const certificateRepository = require('./certificates.repository');
const enrollmentRepository = require('../enrollments/enrollments.repository');
const notificationService = require('../notifications/notifications.service');
const ApiError = require('../../core/errors/ApiError');
const logger = require('../../utils/logger');
const config = require('../../config');
const Roles = require('../../core/enums/Roles');
const { toCamelCaseObject } = require('../../utils/caseConverter');
const emailSender = require('../../utils/emailSender');

/* --------------------------------------------------------------------------
 * Khóa bí mật dùng để ký chứng chỉ
 * ------------------------------------------------------------------------ */

/**
 * Lấy khóa ký. Ưu tiên CERTIFICATE_SECRET riêng; nếu chưa cấu hình thì dùng
 * tạm JWT_SECRET và ghi CẢNH BÁO.
 *
 * Vì sao KHÔNG hardcode một giá trị mặc định: chữ ký chỉ có giá trị khi khóa
 * là bí mật. Một giá trị mặc định nằm trong mã nguồn công khai đồng nghĩa với
 * việc bất kỳ ai đọc repo cũng ký được chứng chỉ giả — tệ hơn cả không ký, vì
 * nó tạo ảo giác an toàn.
 *
 * Vì sao KHÔNG throw luôn: sẽ chặn cả hệ thống khởi động chỉ vì thiếu một biến
 * môi trường của tính năng phụ. Dùng tạm JWT_SECRET là an toàn (nó cũng là bí
 * mật thật, cũng đang bảo vệ toàn bộ phiên đăng nhập).
 */
let hasWarnedAboutSecret = false;
const getSigningSecret = () => {
  const dedicated = process.env.CERTIFICATE_SECRET;
  if (dedicated && dedicated.length >= 16) return dedicated;

  if (!hasWarnedAboutSecret) {
    hasWarnedAboutSecret = true;
    logger.warn(
      '[Certificates] Chưa cấu hình CERTIFICATE_SECRET (hoặc quá ngắn, cần >= 16 ký tự). ' +
        'Tạm dùng JWT_SECRET để ký chứng chỉ. Nên đặt một khóa riêng trong .env ' +
        'để khi cần xoay vòng JWT_SECRET thì các chứng chỉ đã cấp không bị mất hiệu lực.'
    );
  }
  return config.jwt.secret;
};

/* --------------------------------------------------------------------------
 * Sinh mã và chữ ký
 * ------------------------------------------------------------------------ */

/**
 * Sinh mã chứng chỉ công khai: 3TEDU-<năm>-<10 ký tự hex viết hoa>.
 *
 * 5 byte ngẫu nhiên = 2^40 ≈ 1,1 nghìn tỷ khả năng. Với quy mô vài nghìn chứng
 * chỉ, xác suất trùng gần như bằng 0; và nếu có trùng thật thì ràng buộc
 * UQ_Certificates_Code trong DB sẽ chặn lại (xem vòng thử lại ở issue()).
 *
 * Dùng crypto.randomBytes chứ KHÔNG dùng Math.random: Math.random không phải
 * nguồn ngẫu nhiên mật mã, có thể dự đoán được nếu biết trạng thái bộ sinh —
 * mà "không đoán được" chính là toàn bộ giá trị của mã này.
 */
const generateCertificateCode = () => {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(5).toString('hex').toUpperCase();
  return `3TEDU-${year}-${random}`;
};

/**
 * Tính chữ ký HMAC-SHA256 cho nội dung cốt lõi của chứng chỉ.
 *
 * Các trường đưa vào chữ ký được chọn theo nguyên tắc: đổi bất kỳ trường nào
 * trong số này thì tờ chứng chỉ trở thành một tờ KHÁC. Tên học viên và tên
 * khóa học nằm trong đó — nên không thể sửa DB để "chuyển" chứng chỉ sang tên
 * người khác mà vẫn qua được bước xác minh.
 *
 * Dấu `|` làm dải phân cách để tránh nhập nhằng nối chuỗi (ví dụ
 * "AB"+"C" và "A"+"BC" cho cùng một chuỗi nếu không có dải phân cách).
 */
const computeVerificationHash = ({
  code,
  accountId,
  courseId,
  issuedAt,
  studentName,
  courseName,
}) => {
  const payload = [
    code,
    String(accountId),
    String(courseId),
    new Date(issuedAt).toISOString(),
    studentName || '',
    courseName || '',
  ].join('|');

  return crypto
    .createHmac('sha256', getSigningSecret())
    .update(payload, 'utf8')
    .digest('hex');
};

/**
 * Kiểm tra chữ ký của một bản ghi chứng chỉ đọc từ DB.
 *
 * ⚠️ Dùng crypto.timingSafeEqual chứ không dùng `===`. So sánh chuỗi thường
 * thoát ra ngay tại byte đầu tiên khác nhau, nên thời gian thực thi tiết lộ
 * "đoán đúng được bao nhiêu ký tự" — kẻ tấn công dò từng byte một là ra chữ ký
 * (timing attack). timingSafeEqual luôn chạy hết độ dài.
 *
 * @param {object} certificate - Bản ghi thô từ DB (PascalCase).
 * @returns {boolean}
 */
const isSignatureValid = (certificate) => {
  if (!certificate || !certificate.VerificationHash) return false;

  const expected = computeVerificationHash({
    code: certificate.CertificateCode,
    accountId: certificate.AccountID,
    courseId: certificate.CourseID,
    issuedAt: certificate.IssuedAt,
    studentName: certificate.StudentNameSnapshot,
    courseName: certificate.CourseNameSnapshot,
  });

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(certificate.VerificationHash), 'utf8');
  // timingSafeEqual ném lỗi nếu hai buffer khác độ dài — chặn trước.
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

/* --------------------------------------------------------------------------
 * Cấp chứng chỉ
 * ------------------------------------------------------------------------ */

/**
 * Cấp chứng chỉ cho học viên đã hoàn thành một phiên bản khóa học.
 *
 * IDEMPOTENT: gọi bao nhiêu lần cũng chỉ có một chứng chỉ. Điều này BẮT BUỘC
 * chứ không phải cho đẹp — trong dự án này có tới ba đường dẫn cùng phát hiện
 * "đã hoàn thành":
 *     1. progress.service.markLessonCompletion  (bấm xong bài cuối)
 *     2. progress.service.getCourseProgress     (mở lại trang khóa học)
 *     3. học viên tự bấm nút "Nhận chứng chỉ"
 * Hai đường đầu có thể chạy song song trong cùng một giây.
 *
 * @param {number} accountId
 * @param {number} courseId
 * @param {object} [options]
 * @param {boolean} [options.silent=false] - true = không gửi thông báo/email
 *        (dùng khi gọi tự động trong nền để không làm chậm request của học viên).
 * @returns {Promise<object|null>} Chứng chỉ (camelCase), hoặc null nếu chưa đủ điều kiện.
 */
const issueCertificate = async (accountId, courseId, options = {}) => {
  // 1. Đã có rồi thì trả về luôn — đường tắt rẻ nhất, chạy hầu hết các lần gọi.
  const existing = await certificateRepository.findCertificateByAccountAndCourse(
    accountId,
    courseId
  );
  if (existing) return toCamelCaseObject(existing);

  // 2. Gom dữ liệu và kiểm tra điều kiện.
  const snapshot = await certificateRepository.findIssuanceDataSnapshot(
    accountId,
    courseId
  );
  if (!snapshot) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Bạn chưa ghi danh khóa học này nên chưa thể cấp chứng chỉ.'
    );
  }
  if (!snapshot.IsCompleted) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Bạn cần hoàn thành 100% khóa học trước khi nhận chứng chỉ.'
    );
  }

  const issuedAt = new Date();
  const studentName = snapshot.StudentName;
  const courseName = snapshot.CourseName;

  /* 3. Chèn, có vòng thử lại.
        Hai loại đụng độ hoàn toàn khác nhau nhưng cùng ném lỗi trùng khóa:
          a) Trùng CertificateCode  → sinh mã khác rồi thử lại.
          b) Trùng (AccountID, CourseID) → một request song song đã cấp xong
             trước ta; đọc lại bản ghi của nó và trả về, KHÔNG báo lỗi cho học
             viên vừa tốt nghiệp.
        Phân biệt bằng cách đọc lại theo (account, course) sau mỗi lần lỗi. */
  const MAX_ATTEMPTS = 3;
  let created = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS && !created; attempt += 1) {
    const code = generateCertificateCode();
    const verificationHash = computeVerificationHash({
      code,
      accountId,
      courseId,
      issuedAt,
      studentName,
      courseName,
    });

    try {
      created = await certificateRepository.createCertificate({
        CertificateCode: code,
        AccountID: accountId,
        CourseID: courseId,
        EnrollmentID: snapshot.EnrollmentID,
        StudentNameSnapshot: studentName,
        CourseNameSnapshot: courseName,
        InstructorNameSnapshot: snapshot.InstructorName,
        CourseVersionNumber: snapshot.CourseVersionNumber,
        TotalLessonsSnapshot: snapshot.TotalLessons,
        FinalQuizAverage: snapshot.FinalQuizAverage,
        CompletedAt: snapshot.CompletedAt,
        VerificationHash: verificationHash,
        IssuedAt: issuedAt,
      });
    } catch (error) {
      if (!certificateRepository.isDuplicateCertificateError(error)) throw error;

      const raced =
        await certificateRepository.findCertificateByAccountAndCourse(
          accountId,
          courseId
        );
      if (raced) {
        logger.info(
          `[Certificates] Một tiến trình song song đã cấp chứng chỉ cho account ${accountId}, course ${courseId}. Dùng lại bản ghi đó.`
        );
        return toCamelCaseObject(raced);
      }
      // Không phải đụng độ (account, course) → chắc chắn là trùng mã. Thử lại.
      logger.warn(
        `[Certificates] Mã ${code} bị trùng, sinh mã mới (lần thử ${attempt}/${MAX_ATTEMPTS}).`
      );
    }
  }

  if (!created) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Không sinh được mã chứng chỉ duy nhất. Vui lòng thử lại.'
    );
  }

  logger.info(
    `🎓 [Certificates] Đã cấp chứng chỉ ${created.CertificateCode} cho account ${accountId} — khóa "${courseName}" (v${snapshot.CourseVersionNumber}).`
  );

  // 4. Thông báo + email. Thất bại ở đây KHÔNG được làm hỏng việc đã cấp.
  if (!options.silent) {
    notifyCertificateIssued(created, snapshot).catch((err) =>
      logger.error(
        `[Certificates] Đã cấp chứng chỉ nhưng gửi thông báo thất bại: ${err.message}`
      )
    );
  }

  return toCamelCaseObject(created);
};

/**
 * Gửi thông báo in-app + email chúc mừng. Tách hàm riêng và luôn được gọi kiểu
 * "bắn rồi quên" (không await ở luồng chính) vì gửi mail qua SMTP có thể mất
 * vài giây — không có lý do gì để học viên phải ngồi chờ màn hình quay.
 */
const notifyCertificateIssued = async (certificate, snapshot) => {
  const verifyUrl = buildVerificationUrl(certificate.CertificateCode);

  await notificationService.createNotification(
    certificate.AccountID,
    'SYSTEM',
    `🎓 Chúc mừng! Bạn đã nhận chứng chỉ hoàn thành khóa học "${certificate.CourseNameSnapshot}". ` +
      `Mã chứng chỉ: ${certificate.CertificateCode}`,
    { type: 'Course', id: certificate.CourseID }
  );

  if (snapshot?.StudentEmail) {
    await emailSender.sendEmailWithTemplate(
      snapshot.StudentEmail,
      `🎓 Chứng chỉ hoàn thành khóa học "${certificate.CourseNameSnapshot}"`,
      'certificateIssued',
      {
        fullNameOrDefault: certificate.StudentNameSnapshot || 'bạn',
        courseName: certificate.CourseNameSnapshot,
        certificateCode: certificate.CertificateCode,
        instructorName: certificate.InstructorNameSnapshot || '',
        issuedDate: new Date(certificate.IssuedAt).toLocaleDateString('vi-VN'),
        verifyUrl,
        certificatesUrl: `${config.frontendUrl}/certificates`,
      }
    );
  }
};

/**
 * Đường dẫn trang xác minh công khai — cũng chính là nội dung mã QR in trên
 * chứng chỉ. Gom vào một hàm để trang xác minh, mã QR và email không bao giờ
 * trỏ về ba địa chỉ khác nhau.
 */
const buildVerificationUrl = (code) =>
  `${config.frontendUrl}/verify-certificate/${encodeURIComponent(code)}`;

/**
 * Cấp chứng chỉ TỰ ĐỘNG trong nền khi hệ thống phát hiện học viên vừa hoàn
 * thành khóa học. Được gọi từ progress.service.
 *
 * Hàm này KHÔNG BAO GIỜ ném lỗi. Lý do: nó nằm trên đường đi của thao tác
 * "đánh dấu hoàn thành bài học". Một trục trặc khi cấp chứng chỉ mà làm hỏng
 * việc lưu tiến độ thì thiệt hại lớn hơn nhiều so với việc chậm cấp chứng chỉ
 * — huống hồ học viên vẫn còn nút "Nhận chứng chỉ" để thử lại.
 *
 * @returns {Promise<object|null>}
 */
const tryIssueCertificateSilently = async (accountId, courseId) => {
  try {
    return await issueCertificate(accountId, courseId);
  } catch (error) {
    logger.warn(
      `[Certificates] Bỏ qua cấp tự động cho account ${accountId}, course ${courseId}: ${error.message}`
    );
    return null;
  }
};

/* --------------------------------------------------------------------------
 * Đọc / xác minh
 * ------------------------------------------------------------------------ */

/**
 * Danh sách chứng chỉ của học viên đang đăng nhập, kèm URL xác minh.
 */
const getMyCertificates = async (accountId) => {
  const rows = await certificateRepository.findCertificatesByAccountId(
    accountId
  );
  return rows.map((row) => ({
    ...toCamelCaseObject(row),
    verifyUrl: buildVerificationUrl(row.CertificateCode),
    isValid: !row.IsRevoked && isSignatureValid(row),
  }));
};

/**
 * XÁC MINH CÔNG KHAI — không cần đăng nhập.
 *
 * ⚠️ Nguyên tắc lộ thông tin tối thiểu: người quét QR có thể là nhà tuyển dụng
 * hoàn toàn xa lạ. Họ cần biết "tờ này thật không, của ai, khóa nào" — và
 * KHÔNG cần biết email, AccountID hay điểm chi tiết của học viên. Vì vậy hàm
 * này dựng thủ công object trả về thay vì `toCamelCaseObject(row)`; trả cả bản
 * ghi ra ngoài sẽ vô tình lộ AccountID và cả VerificationHash.
 *
 * @param {string} code
 * @returns {Promise<object>}
 */
const verifyCertificate = async (code) => {
  const row = await certificateRepository.findCertificateByCode(code);

  if (!row) {
    return {
      isValid: false,
      status: 'NOT_FOUND',
      message:
        'Không tìm thấy chứng chỉ với mã này. Mã có thể bị nhập sai hoặc chứng chỉ không do 3TEduTech cấp.',
    };
  }

  if (!isSignatureValid(row)) {
    // Bản ghi có tồn tại nhưng chữ ký không khớp → nội dung đã bị can thiệp
    // trực tiếp trong CSDL. Đây là sự cố an ninh, phải ghi log ở mức error.
    logger.error(
      `[Certificates] ⚠️ CHỮ KÝ KHÔNG HỢP LỆ cho chứng chỉ ${code}. Nội dung có thể đã bị sửa trực tiếp trong CSDL.`
    );
    return {
      isValid: false,
      status: 'TAMPERED',
      message:
        'Chứng chỉ này không vượt qua được bước kiểm tra tính toàn vẹn. Vui lòng liên hệ 3TEduTech.',
    };
  }

  if (row.IsRevoked) {
    return {
      isValid: false,
      status: 'REVOKED',
      message: 'Chứng chỉ này đã bị thu hồi.',
      revokedAt: row.RevokedAt,
      revokedReason: row.RevokedReason,
      certificate: buildPublicCertificateView(row),
    };
  }

  return {
    isValid: true,
    status: 'VALID',
    message: 'Chứng chỉ hợp lệ và do 3TEduTech cấp.',
    certificate: buildPublicCertificateView(row),
  };
};

/** Bản trình bày công khai của một chứng chỉ — đã lược bỏ dữ liệu nhạy cảm. */
const buildPublicCertificateView = (row) => ({
  certificateCode: row.CertificateCode,
  studentName: row.StudentNameSnapshot,
  courseName: row.CourseNameSnapshot,
  instructorName: row.InstructorNameSnapshot,
  courseVersionNumber: row.CourseVersionNumber,
  totalLessons: row.TotalLessonsSnapshot,
  finalQuizAverage: row.FinalQuizAverage,
  completedAt: row.CompletedAt,
  issuedAt: row.IssuedAt,
  categoryName: row.CategoryName,
  levelName: row.LevelName,
  courseSlug: row.CourseSlug,
  courseThumbnailUrl: row.CourseThumbnailUrl,
  studentAvatarUrl: row.StudentAvatarUrl,
  verifyUrl: buildVerificationUrl(row.CertificateCode),
});

/**
 * Lấy đầy đủ dữ liệu một chứng chỉ để dựng file PDF.
 * Chỉ chủ sở hữu hoặc Admin được gọi.
 */
const getCertificateForOwner = async (code, user) => {
  const row = await certificateRepository.findCertificateByCode(code);
  if (!row) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy chứng chỉ.');
  }

  const isAdmin =
    user.role === Roles.ADMIN || user.role === Roles.SUPERADMIN;
  // So sánh bằng String: AccountID từ mssql là number/string tùy driver, còn
  // user.id đến từ payload JWT. So sánh `!==` trực tiếp giữa 12 và "12" sẽ
  // chặn nhầm chính chủ.
  const isOwner = String(row.AccountID) === String(user.id);

  if (!isAdmin && !isOwner) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Bạn không có quyền tải chứng chỉ này.'
    );
  }

  return {
    ...toCamelCaseObject(row),
    verifyUrl: buildVerificationUrl(row.CertificateCode),
    isValid: !row.IsRevoked && isSignatureValid(row),
  };
};

/**
 * Thu hồi chứng chỉ — chỉ Admin. Dùng khi phát hiện gian lận thi cử.
 */
const revokeCertificate = async (code, admin, reason) => {
  const row = await certificateRepository.findCertificateByCode(code);
  if (!row) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy chứng chỉ.');
  }
  if (row.IsRevoked) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Chứng chỉ này đã bị thu hồi trước đó.'
    );
  }

  const revoked = await certificateRepository.revokeCertificateByCode(
    code,
    admin.id,
    reason
  );
  if (!revoked) {
    // Có người khác vừa thu hồi xong giữa hai câu lệnh của ta.
    throw new ApiError(
      httpStatus.CONFLICT,
      'Chứng chỉ vừa được thu hồi bởi một thao tác khác.'
    );
  }

  logger.warn(
    `[Certificates] Chứng chỉ ${code} bị Admin ${admin.id} thu hồi. Lý do: ${reason}`
  );

  notificationService
    .createNotification(
      revoked.AccountID,
      'SYSTEM',
      `Chứng chỉ khóa học "${revoked.CourseNameSnapshot}" của bạn đã bị thu hồi. Lý do: ${reason}`,
      { type: 'Course', id: revoked.CourseID }
    )
    .catch((err) =>
      logger.error(
        `[Certificates] Không gửi được thông báo thu hồi: ${err.message}`
      )
    );

  return toCamelCaseObject(revoked);
};

/**
 * Trạng thái đủ điều kiện nhận chứng chỉ của học viên với một khóa học.
 * Dùng cho nút "Nhận chứng chỉ" trên giao diện học tập.
 */
const getEligibility = async (accountId, courseId) => {
  const existing = await certificateRepository.findCertificateByAccountAndCourse(
    accountId,
    courseId
  );
  if (existing) {
    return {
      eligible: true,
      alreadyIssued: true,
      certificate: {
        ...toCamelCaseObject(existing),
        verifyUrl: buildVerificationUrl(existing.CertificateCode),
      },
    };
  }

  const enrollment = await enrollmentRepository.findEnrollmentByUserAndCourse(
    accountId,
    courseId
  );
  if (!enrollment) {
    return { eligible: false, alreadyIssued: false, reason: 'NOT_ENROLLED' };
  }
  if (!enrollment.IsCompleted) {
    return { eligible: false, alreadyIssued: false, reason: 'NOT_COMPLETED' };
  }
  return { eligible: true, alreadyIssued: false };
};

module.exports = {
  issueCertificate,
  tryIssueCertificateSilently,
  getMyCertificates,
  verifyCertificate,
  getCertificateForOwner,
  revokeCertificate,
  getEligibility,
  buildVerificationUrl,
  // Xuất ra để có thể viết unit test cho phần mật mã mà không cần chạm DB.
  generateCertificateCode,
  computeVerificationHash,
  isSignatureValid,
};
