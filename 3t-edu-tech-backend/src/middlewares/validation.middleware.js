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

  /* [SỬA] Cho phép khóa lạ đi qua ở CẢ params, query và body.

     Trước bản này, do lỗi ở utils/pick.js (xem ghi chú ở đó), KHÔNG schema nào
     thực sự nhận được dữ liệu — toàn bộ tầng kiểm tra đầu vào là hình thức.
     Dựng lại stack thật rồi chạy bộ integration test cho thấy điều đó đã kéo
     dài đủ lâu để cả bộ test lẫn một số lời gọi gửi những khóa mà schema không
     khai báo (ví dụ test tạo khóa học gửi kèm shortDescription/originalPrice,
     trong khi schema — và chính frontend — chỉ dùng 4 trường).

     Bật kiểm tra ở chế độ CHẶT sẽ biến mọi khóa thừa thành lỗi 400. Đó là thay
     đổi hành vi rộng mà không có cách nào kiểm chứng hết từng tuyến, nên ở đây
     chỉ kiểm tra những khóa ĐÃ KHAI BÁO: ép kiểu, giá trị mặc định, required,
     khoảng giá trị, mẫu chuỗi. Khóa lạ được bỏ qua như trước.

     Vẫn chặt hơn hẳn hiện trạng (trước đó KHÔNG kiểm tra gì), và không có rủi ro
     hồi quy. Siết hẳn là việc nên làm sau, từng tuyến một, có test đi kèm. */
  ['params', 'query', 'body'].forEach((key) => {
    if (Joi.isSchema(validSchema[key]) && validSchema[key].type === 'object') {
      validSchema[key] = validSchema[key].unknown(true);
    }
  });

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
