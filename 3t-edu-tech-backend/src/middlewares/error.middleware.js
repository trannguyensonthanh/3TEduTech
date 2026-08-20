const httpStatus = require('http-status').status;
const sql = require('mssql');
const config = require('../config');
const logger = require('../utils/logger');
const ApiError = require('../core/errors/ApiError');

// Middleware chuyển đổi lỗi không phải ApiError thành ApiError
const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    let statusCode = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    let message = error.message || httpStatus[statusCode];

    if (error instanceof sql.RequestError) {
      if (error.number === 2627 || error.number === 2601) {
        statusCode = httpStatus.CONFLICT;
        message = `Duplicate entry detected. ${error.message}`;
      } else if (error.number === 547) {
        statusCode = httpStatus.BAD_REQUEST;
        message = `Foreign key constraint violation. ${error.message}`;
      } else {
        statusCode = httpStatus.INTERNAL_SERVER_ERROR;
        message = `Database request error: ${error.message}`;
      }
      logger.error(`SQL Request Error [${error.number}]: ${error.message}`);
    } else if (error instanceof sql.ConnectionError) {
      statusCode = httpStatus.SERVICE_UNAVAILABLE;
      message = `Database connection error: ${error.message}`;
      logger.error(`SQL Connection Error: ${error.message}`);
    } else if (error.isJoi === true) {
      statusCode = httpStatus.BAD_REQUEST;
      message = error.details.map((detail) => detail.message).join(', ');
    } else {
      statusCode = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
      message = error.message || httpStatus[statusCode];
    }

    /* [SỬA 19/08/2026] Trước đây luôn truyền isOperational = false, khiến
       errorHandler ở môi trường sản xuất ghi đè MỌI mã trạng thái thành 500 --
       kể cả lỗi kiểm tra dữ liệu đầu vào (400), trùng khóa (409) hay vi phạm
       khóa ngoại. Giao diện vì vậy không phân biệt được "người dùng nhập sai"
       với "máy chủ hỏng". Nay các lỗi thuộc nhóm 4xx được coi là lỗi nghiệp vụ
       và giữ nguyên mã, chỉ nhóm 5xx mới bị che chi tiết. */
    const isClientError = statusCode >= 400 && statusCode < 500;
    error = new ApiError(statusCode, message, isClientError, err.stack);
  }
  next(error);
};

// Middleware xử lý lỗi cuối cùng, gửi response về client
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  if (config.env === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  if (config.env === 'development' || err.isOperational === false) {
    logger.error(
      `[${statusCode}] ${message} - ${req.originalUrl} - ${req.method} - ${
        req.ip
      }\n${err.stack || ''}`
    );
  } else {
    logger.warn(
      `[${statusCode}] ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
  }

  res.status(statusCode).send(response);
};

module.exports = {
  errorConverter,
  errorHandler,
};
