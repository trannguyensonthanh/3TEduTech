const httpStatus = require('http-status').status;
const orderService = require('./orders.service');
const { catchAsync } = require('../../utils/catchAsync');
const { pick } = require('../../utils/pick');
const OrderStatus = require('../../core/enums/OrderStatus');
const paymentService = require('../payments/payments.service');
const logger = require('../../utils/logger');
const config = require('../../config');
const stripe = require('../../config/stripe');

// Tạo đơn hàng từ giỏ hàng
const createOrder = catchAsync(async (req, res) => {
  const accountId = req.user.id;
  const options = {
    promotionCode: req.body.promotionCode,
    currency: req.targetCurrency,
  };
  const order = await orderService.createOrderFromCart(accountId, options);
  res.status(httpStatus.CREATED).send(order);
});

// Lấy danh sách đơn hàng của tôi
const getMyOrders = catchAsync(async (req, res) => {
  const accountId = req.user.id;
  const options = pick(req.query, ['limit', 'page', 'status']);
  const result = await orderService.getMyOrders(accountId, options);
  res.status(httpStatus.OK).send(result);
});

// Lấy chi tiết đơn hàng của tôi
const getMyOrderDetails = catchAsync(async (req, res) => {
  const accountId = req.user.id;
  const { orderId } = req.params;
  const orderDetails = await orderService.getMyOrderDetails(accountId, orderId);
  res.status(httpStatus.OK).send(orderDetails);
});

// Callback/Webhook (Ví dụ - Sẽ cần điều chỉnh theo cổng thanh toán)
const handlePaymentWebhook = catchAsync(async (req, res) => {
  /* [SỬA] Tuyến này được đăng ký cho CẢ GET lẫn POST (xem orders.routes.js),
     nhưng trước đây chỉ đọc req.query — nhánh POST luôn nhận object rỗng nên
     luôn trượt bước kiểm tra chữ ký. VNPay gửi IPN bằng GET, còn trình duyệt
     quay về có thể là POST tùy cấu hình, nên gộp cả hai nguồn. */
  const vnpParams = { ...req.query, ...req.body };
  /* Chỉ ghi lại mã đơn và mã phản hồi; payload IPN chứa mã giao dịch và số tiền
     nên không in nguyên văn ra nhật ký. */
  logger.info(
    `Received VNPay IPN for order ${vnpParams.vnp_TxnRef || 'N/A'} (code ${vnpParams.vnp_ResponseCode || 'N/A'}).`
  );
  const result = await paymentService.processVnpayIpn(vnpParams);
  res.status(httpStatus.OK).json({
    RspCode: result.RspCode,
    Message: result.Message,
  });
});

const handleStripeWebhook = catchAsync(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  console.log(
    'Webhook Raw Body Type:',
    Buffer.isBuffer(req.body) ? 'Buffer' : typeof req.body
  );
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripe.webhookSecret
    );
  } catch (err) {
    logger.error(`⚠️  Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  await paymentService.processStripeWebhook(event);
  res.json({ received: true });
});

const cancelOrder = catchAsync(async (req, res) => {
  const accountId = req.user.id;
  const { orderId } = req.params;
  const order = await orderService.cancelPendingOrder(accountId, orderId);
  res.status(httpStatus.OK).send({ message: 'Đã hủy đơn hàng thành công.', order });
});

const mockPayment = catchAsync(async (req, res) => {
  const accountId = req.user.id;
  const { orderId } = req.params;
  const { status } = req.body; // 'success' | 'failed' — đã được Joi kiểm tra
  await orderService.processMockPayment(accountId, orderId, status);
  res.status(httpStatus.OK).send({
    message:
      status === 'success'
        ? 'Đã ghi nhận thanh toán mô phỏng thành công.'
        : 'Đã hủy đơn hàng theo thanh toán mô phỏng thất bại.',
  });
});

module.exports = {
  createOrder,
  getMyOrders,
  getMyOrderDetails,
  cancelOrder,
  handlePaymentWebhook,
  handleStripeWebhook,
  mockPayment,
};
