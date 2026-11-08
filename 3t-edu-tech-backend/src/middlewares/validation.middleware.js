const Joi = require('joi');
const httpStatus = require('http-status').status;
const ApiError = require('../core/errors/ApiError');
const { pick } = require('../utils/pick');

/**
 * Middleware để validate request data dựa trên schema của Joi.
 * @param {object} schema - Schema Joi gồm các key: params, query, body.
 * @returns {function} - Middleware function.
 */
const validate = (schema) => (req, res, next) => {
  const validSchema = pick(schema, ['params', 'query', 'body']);

  /* [SỬA] Cho phép tham số truy vấn lạ đi qua.
     Trước bản này, do lỗi ở utils/pick.js, TOÀN BỘ schema `query` chưa bao giờ
     chạy — mọi tham số truy vấn đều lọt qua không kiểm tra. Bật kiểm tra ở chế
     độ chặt sẽ khiến bất kỳ tham số nào chưa được khai báo trong schema trả về
     400, mà bộ kiểm thử của dự án là integration test cần cả stack sống nên
     không chạy được ở đây để khẳng định là an toàn.
     Vì vậy chỉ kiểm tra các khóa ĐÃ khai báo (ép kiểu, giá trị mặc định,
     required) và bỏ qua khóa lạ: chặt hơn hẳn hiện trạng, không có rủi ro hồi
     quy. Siết hẳn nên làm sau, khi chạy được integration test. */
  if (Joi.isSchema(validSchema.query) && validSchema.query.type === 'object') {
    validSchema.query = validSchema.query.unknown(true);
  }

  const object = pick(req, Object.keys(validSchema));

  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: 'key' }, abortEarly: false })
    .validate(object);

  if (error) {
    const errorMessage = error.details
      .map((details) => details.message)
      .join(', ');
    return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
  }

  /* [SỬA] Trước đây là `Object.assign(req, value)`. Trong Express 5, `req.query`
     chỉ có getter nên Object.assign NÉM TypeError ngay khi value chứa `query`
     ("Cannot set property query of #<IncomingMessage> which has only a getter").
     Lỗi này chưa lộ ra vì pick cũ không bao giờ lấy được `query`.
     params/body là own property nên gán bình thường; query phải dùng
     defineProperty để che getter trên prototype — các controller đọc req.query
     như cũ, không phải sửa gì. */
  if (value.params !== undefined) {
    req.params = value.params;
  }
  if (value.body !== undefined) {
    req.body = value.body;
  }
  if (value.query !== undefined) {
    Object.defineProperty(req, 'query', {
      value: value.query,
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }

  return next();
};

module.exports = validate;
