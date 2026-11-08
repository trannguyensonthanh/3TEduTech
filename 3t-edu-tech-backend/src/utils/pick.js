/**
 * Tạo một object mới chỉ chứa các key được chỉ định từ object gốc.
 *
 * [SỬA] Trước đây dùng Object.prototype.hasOwnProperty.call(object, key).
 * Trong Express 5, `req.query` KHÔNG phải own property mà là một getter trên
 * prototype (`req.params` và `req.body` thì là own property). Hệ quả: mọi khối
 * `query: Joi.object()...` được biên dịch nhưng không bao giờ nhận được dữ liệu
 * — Joi validate một object rỗng và luôn báo hợp lệ.
 *
 * Bản gốc mà đoạn mã này được port sang dùng lodash `pick`, vốn đi theo cả
 * prototype chain; dùng `in` khôi phục đúng hành vi đó.
 *
 * @param {object} object - Object gốc.
 * @param {string[]} keys - Mảng các key muốn lấy.
 * @returns {object} - Object mới chỉ chứa các key đã chọn.
 */
const pick = (object, keys) => {
  return keys.reduce((obj, key) => {
    if (object && key in object) {
      obj[key] = object[key];
    }
    return obj;
  }, {});
};

module.exports = { pick };
