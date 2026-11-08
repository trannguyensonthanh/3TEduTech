const express = require('express');
const validate = require('../../middlewares/validation.middleware');
const exchangeRateValidation = require('./exchangeRates.validation');
const exchangeRateController = require('./exchangeRates.controller');
const {
  authenticate,
  authorize,
} = require('../../middlewares/auth.middleware');
const Roles = require('../../core/enums/Roles');

const router = express.Router();

// [SỬA] Trước đây router.use cấp quyền INSTRUCTOR cho TOÀN BỘ router, gồm cả
// POST /, PATCH /:rateId, DELETE /:rateId và POST /update-now. Tỷ giá được dùng
// để quy đổi doanh thu trong orders.service.js, nên giảng viên có thể tự đặt hệ
// số nhân áp lên chính tiền của mình. Nay tách rõ: đọc thì giảng viên được,
// ghi thì chỉ quản trị.
router.use(authenticate);

const canRead = authorize([Roles.ADMIN, Roles.SUPERADMIN, Roles.INSTRUCTOR]);
const canWrite = authorize([Roles.ADMIN, Roles.SUPERADMIN]);

router.post('/update-now', canWrite, exchangeRateController.updateRatesNow);
router.get(
  '/latest',
  canRead,
  validate(exchangeRateValidation.getLatestRate),
  exchangeRateController.getLatestRate
);
router
  .route('/')
  .get(
    canRead,
    validate(exchangeRateValidation.getExchangeRates),
    exchangeRateController.getHistory
  )
  .post(
    canWrite,
    validate(exchangeRateValidation.createExchangeRate),
    exchangeRateController.createExchangeRate
  );

router
  .route('/:rateId')
  .patch(
    canWrite,
    validate(exchangeRateValidation.updateExchangeRate),
    exchangeRateController.updateExchangeRate
  )
  .delete(
    canWrite,
    validate(exchangeRateValidation.deleteExchangeRate),
    exchangeRateController.deleteExchangeRate
  );

router.get(
  '/fetch-external-rate',
  validate(exchangeRateValidation.fetchExternalRate),
  exchangeRateController.fetchExternalRate
);

module.exports = router;
