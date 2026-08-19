// File: src/api/certificates/certificates.validation.js
// [THÊM 17/08/2026 — LEVEL 2, mục 2.1]

const Joi = require('joi');

/**
 * Khuôn dạng mã chứng chỉ: 3TEDU-<4 chữ số năm>-<10 ký tự hex viết hoa>.
 *
 * Vì sao ràng buộc chặt ngay ở tầng validation thay vì để service tra DB:
 * endpoint xác minh là CÔNG KHAI, ai cũng gọi được. Chặn sớm mọi chuỗi rác
 * giúp không phải mở kết nối CSDL cho từng lượt dò bừa — một dạng giảm tải
 * đơn giản mà hiệu quả trước kiểu tấn công quét mã hàng loạt.
 */
const certificateCode = Joi.string()
  .pattern(/^3TEDU-\d{4}-[0-9A-F]{10}$/)
  .required()
  .messages({
    'string.pattern.base':
      'Mã chứng chỉ không đúng định dạng (ví dụ hợp lệ: 3TEDU-2026-A1B2C3D4E5).',
  });

const issueCertificate = {
  params: Joi.object().keys({
    courseId: Joi.number().integer().required(),
  }),
};

const getEligibility = {
  params: Joi.object().keys({
    courseId: Joi.number().integer().required(),
  }),
};

const verifyCertificate = {
  params: Joi.object().keys({
    code: certificateCode,
  }),
};

const getCertificateDetail = {
  params: Joi.object().keys({
    code: certificateCode,
  }),
};

const revokeCertificate = {
  params: Joi.object().keys({
    code: certificateCode,
  }),
  body: Joi.object().keys({
    // Bắt buộc có lý do: thu hồi chứng chỉ là hành động ảnh hưởng trực tiếp tới
    // hồ sơ của một con người. Không cho phép thu hồi mà không để lại lý do.
    reason: Joi.string().trim().min(10).max(500).required().messages({
      'string.min': 'Lý do thu hồi phải mô tả rõ ràng (ít nhất 10 ký tự).',
      'any.required': 'Bắt buộc nhập lý do thu hồi.',
    }),
  }),
};

module.exports = {
  issueCertificate,
  getEligibility,
  verifyCertificate,
  getCertificateDetail,
  revokeCertificate,
};
