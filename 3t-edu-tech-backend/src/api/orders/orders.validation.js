const Joi = require('joi');
const OrderStatus = require('../../core/enums/OrderStatus');

// Body có thể chứa promotionCode
const createOrder = {
  body: Joi.object().keys({
    promotionCode: Joi.string().trim().uppercase().allow(null, ''),
  }),
};

// Lấy danh sách đơn hàng của tôi
const getMyOrders = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(50),
    status: Joi.string()
      .valid(...Object.values(OrderStatus))
      .allow(null, ''),
  }),
};

// Lấy chi tiết đơn hàng của tôi
const getMyOrderDetails = {
  params: Joi.object().keys({
    orderId: Joi.number().integer().required(),
  }),
};

// [THÊM] Thanh toán mô phỏng (chỉ dùng cho demo). Trước đây route này không có
// schema nào, nên `status` có thể là bất cứ giá trị gì và mọi giá trị khác
// 'success' đều rơi vào nhánh hủy đơn.
const mockPayment = {
  params: Joi.object().keys({
    orderId: Joi.number().integer().required(),
  }),
  body: Joi.object().keys({
    status: Joi.string().valid('success', 'failed').required(),
  }),
};

module.exports = {
  createOrder,
  getMyOrders,
  getMyOrderDetails,
  cancelOrder: getMyOrderDetails,
  mockPayment,
};
