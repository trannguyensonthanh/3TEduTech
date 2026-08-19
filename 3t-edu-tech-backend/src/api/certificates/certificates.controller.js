// File: src/api/certificates/certificates.controller.js
// [THÊM 17/08/2026 — LEVEL 2, mục 2.1]

const httpStatus = require('http-status').status;
const certificateService = require('./certificates.service');
const { catchAsync } = require('../../utils/catchAsync');

/**
 * GET /v1/certificates/me
 * Danh sách chứng chỉ của học viên đang đăng nhập.
 */
const getMyCertificates = catchAsync(async (req, res) => {
  const certificates = await certificateService.getMyCertificates(req.user.id);
  res.status(httpStatus.OK).send({ certificates, total: certificates.length });
});

/**
 * POST /v1/certificates/issue/:courseId
 * Học viên tự bấm nhận chứng chỉ sau khi hoàn thành khóa học.
 *
 * Bình thường chứng chỉ đã được cấp tự động ngay khi học viên đánh dấu xong bài
 * cuối cùng. Endpoint này là đường dự phòng cho các trường hợp: học viên hoàn
 * thành từ trước khi tính năng ra đời, hoặc lần cấp tự động gặp trục trặc.
 */
const issueCertificate = catchAsync(async (req, res) => {
  const certificate = await certificateService.issueCertificate(
    req.user.id,
    req.params.courseId
  );
  res.status(httpStatus.CREATED).send(certificate);
});

/**
 * GET /v1/certificates/eligibility/:courseId
 * Học viên đã đủ điều kiện nhận chứng chỉ chưa, và đã cấp chưa.
 */
const getEligibility = catchAsync(async (req, res) => {
  const result = await certificateService.getEligibility(
    req.user.id,
    req.params.courseId
  );
  res.status(httpStatus.OK).send(result);
});

/**
 * GET /v1/certificates/verify/:code
 * ⚠️ CÔNG KHAI — không qua `authenticate`.
 *
 * Đây là chủ đích, không phải sơ suất: giá trị của một tấm chứng chỉ nằm ở chỗ
 * NGƯỜI NGOÀI kiểm chứng được. Nhà tuyển dụng quét mã QR trên tờ chứng chỉ sẽ
 * không có (và không nên cần) tài khoản 3TEduTech.
 *
 * Bù lại, service chỉ trả về đúng phần thông tin công khai của tấm chứng chỉ —
 * không có email, không có AccountID, không có chữ ký.
 */
const verifyCertificate = catchAsync(async (req, res) => {
  const result = await certificateService.verifyCertificate(req.params.code);
  // Luôn trả 200, kể cả khi không hợp lệ: "mã này không hợp lệ" là một câu trả
  // lời THÀNH CÔNG của việc tra cứu, không phải lỗi máy chủ. Trả 404 sẽ khiến
  // giao diện phải phân biệt "lỗi mạng" với "chứng chỉ giả" — hai thứ rất khác
  // nhau nhưng lại rơi vào cùng một nhánh catch.
  res.status(httpStatus.OK).send(result);
});

/**
 * GET /v1/certificates/:code
 * Dữ liệu đầy đủ để dựng file PDF. Chỉ chủ sở hữu hoặc Admin.
 */
const getCertificateDetail = catchAsync(async (req, res) => {
  const certificate = await certificateService.getCertificateForOwner(
    req.params.code,
    req.user
  );
  res.status(httpStatus.OK).send(certificate);
});

/**
 * PATCH /v1/certificates/:code/revoke
 * Thu hồi chứng chỉ — chỉ Admin.
 */
const revokeCertificate = catchAsync(async (req, res) => {
  const certificate = await certificateService.revokeCertificate(
    req.params.code,
    req.user,
    req.body.reason
  );
  res.status(httpStatus.OK).send(certificate);
});

module.exports = {
  getMyCertificates,
  issueCertificate,
  getEligibility,
  verifyCertificate,
  getCertificateDetail,
  revokeCertificate,
};
