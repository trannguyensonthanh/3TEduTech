const Joi = require('joi');

// Tạo URL thanh toán VNPay
const createVnpayUrl = {
  body: Joi.object().keys({
    orderId: Joi.number().integer().required(),
    bankCode: Joi.string().allow(null, ''),
    locale: Joi.string().valid('vn', 'en').default('vn'),
  }),
};

// Xử lý trả về từ VNPay
const vnpayReturn = {
  query: Joi.object().unknown(true),
};

// Xử lý IPN từ VNPay
const vnpayIpn = {
  query: Joi.object().unknown(true),
};

// Tạo hóa đơn thanh toán Crypto
const createCryptoInvoice = {
  body: Joi.object().keys({
    orderId: Joi.number().integer().required(),
    cryptoCurrency: Joi.string().required().trim().lowercase(),
  }),
};

// Tạo đơn hàng PayPal
const createPayPalOrder = {
  body: Joi.object().keys({
    orderId: Joi.number().integer().required(),
  }),
};

// Xác nhận thanh toán PayPal
const capturePayPalOrder = {
  body: Joi.object().keys({
    orderId: Joi.string().required(),
    internalOrderId: Joi.number().integer().required(),
  }),
};

/* [THÊM 19/08/2026] Schema này TỪNG KHÔNG TỒN TẠI.

   payments.routes.js dòng 32 gọi `validate(paymentValidation.createStripeSession)`
   — nhưng `createStripeSession` chưa bao giờ được định nghĩa ở tệp này. Kết quả:
   `validate(undefined)` → `pick(undefined, [...])` trả về {} → `Joi.compile({})`
   chấp nhận MỌI thứ.

   Route không sập, không ai thấy gì bất thường, nhưng thân request của
   POST /v1/payments/stripe/create-checkout-session KHÔNG hề được kiểm tra —
   trong khi tất cả các cổng thanh toán còn lại đều có. Lỗi loại này không lộ ra
   khi chạy, chỉ lộ ra khi đọc kỹ hoặc khi có người cố tình gửi rác vào. */
const createStripeSession = {
  body: Joi.object().keys({
    orderId: Joi.number().integer().required(),
  }),
};

// Tạo URL thanh toán Momo
const createMomoUrl = {
  body: Joi.object().keys({
    orderId: Joi.number().integer().required(),
  }),
};

module.exports = {
  createVnpayUrl,
  vnpayReturn,
  vnpayIpn,
  createStripeSession,
  createCryptoInvoice,
  createPayPalOrder,
  capturePayPalOrder,
  createMomoUrl,
};
