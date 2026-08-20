const express = require('express');
const validate = require('../../middlewares/validation.middleware');
const orderValidation = require('./orders.validation');
const orderController = require('./orders.controller');
const paymentController = require('../payments/payments.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();

// Các route thao tác với đơn hàng của user hiện tại
router.use(authenticate);

router.post(
  '/',
  validate(orderValidation.createOrder),
  orderController.createOrder
);

router.get(
  '/',
  validate(orderValidation.getMyOrders),
  orderController.getMyOrders
);

router.get(
  '/:orderId',
  validate(orderValidation.getMyOrderDetails),
  orderController.getMyOrderDetails
);

router.patch(
  '/:orderId/cancel',
  validate(orderValidation.cancelOrder),
  orderController.cancelOrder
);

// [ADD] Route for Mock Payment
router.post(
  '/:orderId/mock-payment',
  orderController.mockPayment
);

// Route cho Webhook từ cổng thanh toán
const webhookRouter = express.Router();

webhookRouter.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  orderController.handleStripeWebhook
);

const nowPaymentsRawBody = (req, res, next) => {
  let data = '';
  req.on('data', (chunk) => {
    data += chunk;
  });
  req.on('end', () => {
    req.rawBody = data;
    next();
  });
};

/* [SỬA 19/08/2026] express.raw() đã đọc cạn luồng dữ liệu của request và đặt
   sẵn thân thô vào req.body dưới dạng Buffer. Middleware nowPaymentsRawBody
   phía sau mới đăng ký req.on('data'/'end') nên sự kiện 'end' không bao giờ
   bắn, next() không được gọi và request treo tới hết thời gian chờ -- webhook
   tiền mã hóa vì vậy chưa bao giờ ghi nhận được thanh toán.
   Nay chỉ chuyển Buffer thành chuỗi để giữ nguyên hợp đồng req.rawBody. */
webhookRouter.post(
  '/crypto',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    req.rawBody = Buffer.isBuffer(req.body)
      ? req.body.toString('utf8')
      : req.body;
    next();
  },
  paymentController.handleCryptoWebhook
);

webhookRouter.use(express.json());
webhookRouter.use(express.urlencoded({ extended: true }));

webhookRouter.post('/payment-callback', orderController.handlePaymentWebhook);
webhookRouter.get('/payment-callback', orderController.handlePaymentWebhook);

webhookRouter.post('/momo', paymentController.handleMomoWebhook);

module.exports = {
  orderRouter: router,
  webhookRouter,
};
