const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const httpStatus = require('http-status').status;
const cookieParser = require('cookie-parser');
const { webhookRouter } = require('./api/orders/orders.routes');
const config = require('./config');
const logger = require('./utils/logger');
const {
  errorConverter,
  errorHandler,
} = require('./middlewares/error.middleware');
const ApiError = require('./core/errors/ApiError');
const currencyHandler = require('./middlewares/currency.middleware');
// [THÊM 17/08/2026] Phục vụ Deep Healthcheck tại GET /v1/
const { getConnection } = require('./database/connection');
const redisClient = require('./database/redis');

const app = express();

if (config.env === 'development') {
  app.use(
    morgan('dev', {
      stream: { write: (message) => logger.http(message.trim()) },
    })
  );
} else {
  app.use(
    morgan('combined', {
      stream: { write: (message) => logger.http(message.trim()) },
    })
  );
}

app.use(helmet());

// CORS: Production đọc từ env CORS_ALLOWED_ORIGINS, dev cho phép tất cả
const corsOptions = {
  origin: (origin, callback) => {
    // Cho phép requests không có origin (server-to-server, curl, mobile apps)
    if (!origin) {
      return callback(null, true);
    }
    // Development mode: cho phép tất cả origins
    if (config.env === 'development') {
      return callback(null, true);
    }
    // Production mode: chỉ cho phép origins trong danh sách
    if (config.corsAllowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    logger.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Currency',
  ],
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(currencyHandler);
app.use('/webhooks', webhookRouter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const apiV1Router = express.Router();

/* ============================================================================
 * DEEP HEALTHCHECK — GET /v1/
 * ----------------------------------------------------------------------------
 * [NÂNG CẤP 17/08/2026] Trước đây endpoint này chỉ trả về một chuỗi tĩnh
 * "API V1 is running smoothly!", luôn 200 kể cả khi kết nối tới AWS RDS đã đứt
 * hoàn toàn. Nghĩa là khối healthcheck trong docker-compose.cpu-ec2.yml không
 * phát hiện được bất kỳ lỗi ngầm nào — đúng loại "điểm mù vận hành".
 *
 * Nay kiểm tra sâu 2 phụ thuộc cốt lõi: SQL Server và Redis.
 *
 * ⚠️ KHÁC BIỆT CÓ CHỦ ĐÍCH so với thiết kế mô tả trong tài liệu:
 *    Tài liệu đề xuất trả 503 khi BẤT KỲ phụ thuộc nào hỏng (kể cả Redis).
 *    Ở đây chia hai mức, vì hai phụ thuộc có vai trò rất khác nhau:
 *
 *      • SQL Server hỏng → 503 "unhealthy". Không có DB thì không API nào phục
 *        vụ được; Nginx cần ngắt lưu lượng khỏi container này.
 *
 *      • Redis hỏng      → 200 "degraded". Redis ở dự án này chỉ dùng cho cache
 *        (cache.middleware.js đã tự rơi xuống DB khi Redis lỗi) và hàng đợi
 *        BullMQ. Hệ thống vẫn phục vụ được, chỉ chậm hơn. Nếu trả 503 ở đây thì
 *        `depends_on: condition: service_healthy` sẽ chặn luôn frontend khởi
 *        động — biến một sự cố nhỏ thành sập toàn hệ thống.
 *
 *    Đây chính là "Degraded Status Pattern" mà tài liệu đã áp dụng cho AI
 *    Service; ta áp dụng nhất quán cho cả Backend.
 *
 * ⚠️ Endpoint này CÔNG KHAI (không qua xác thực) nên tuyệt đối không trả ra
 *    thông điệp lỗi gốc — chuỗi kết nối / endpoint RDS có thể lọt ra ngoài.
 *    Chi tiết lỗi chỉ ghi vào log nội bộ.
 * ========================================================================== */
const HEALTH_DB_TIMEOUT_MS = 3000;
const HEALTH_REDIS_TIMEOUT_MS = 2000;

/** Bọc promise với thời gian chờ tối đa, tránh healthcheck bị treo vô hạn
 *  (quan trọng: nếu handler treo lâu hơn `timeout` trong compose thì Docker
 *  đánh dấu thất bại mà ta không biết nguyên nhân). */
const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} quá hạn ${ms}ms`)), ms)
    ),
  ]);

apiV1Router.get('/', async (req, res) => {
  const startedAt = Date.now();
  const services = { database: 'unknown', redis: 'unknown' };
  let isDatabaseUp = false;
  let isRedisUp = false;

  // --- 1. SQL Server: truy vấn siêu nhẹ SELECT 1 ---
  try {
    const pool = await withTimeout(
      getConnection(),
      HEALTH_DB_TIMEOUT_MS,
      'Kết nối DB'
    );
    await withTimeout(
      pool.request().query('SELECT 1 AS ok'),
      HEALTH_DB_TIMEOUT_MS,
      'Truy vấn DB'
    );
    isDatabaseUp = true;
    services.database = 'connected';
  } catch (error) {
    services.database = 'disconnected';
    logger.error(`[Healthcheck] Kiểm tra Database thất bại: ${error.message}`);
  }

  // --- 2. Redis: lệnh PING ---
  try {
    // database/redis.js có cơ chế dự phòng: khi khởi tạo lỗi nó tạo một client
    // giả chỉ gồm get/setex/del/keys/quit — KHÔNG có ping(). Phải kiểm tra
    // trước, nếu không sẽ ném TypeError thay vì báo đúng trạng thái.
    if (typeof redisClient.ping !== 'function') {
      throw new Error('Redis đang dùng client dự phòng (khởi tạo thất bại)');
    }
    const pong = await withTimeout(
      redisClient.ping(),
      HEALTH_REDIS_TIMEOUT_MS,
      'Redis PING'
    );
    isRedisUp = pong === 'PONG';
    services.redis = isRedisUp ? 'connected' : 'disconnected';
  } catch (error) {
    services.redis = 'disconnected';
    logger.warn(`[Healthcheck] Kiểm tra Redis thất bại: ${error.message}`);
  }

  // --- 3. Kết luận trạng thái ---
  let status;
  let httpCode;
  if (!isDatabaseUp) {
    status = 'unhealthy';
    httpCode = httpStatus.SERVICE_UNAVAILABLE; // 503 → Docker/Nginx ngắt lưu lượng
  } else if (!isRedisUp) {
    status = 'degraded'; // Vẫn 200: cache hỏng nhưng API vẫn phục vụ được
    httpCode = httpStatus.OK;
  } else {
    status = 'healthy';
    httpCode = httpStatus.OK;
  }

  return res.status(httpCode).send({
    status,
    message: `API V1 — Environment: ${config.env}`,
    services,
    uptimeSeconds: Math.floor(process.uptime()),
    checkDurationMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  });
});

const authRoutes = require('./api/auth/auth.routes');
const userRoutes = require('./api/users/users.routes');
const categoryRoutes = require('./api/categories/categories.routes');
const levelRoutes = require('./api/levels/levels.routes');
const courseRoutes = require('./api/courses/courses.routes');
const enrollmentRoutes = require('./api/enrollments/enrollments.routes');
const progressRoutes = require('./api/progress/progress.routes');
const { lessonRouter } = require('./api/lessons/lessons.routes');
const quizRoutes = require('./api/quizzes/quizzes.routes');
const { questionRouter } = require('./api/lessons/lessons.routes');
const cartRoutes = require('./api/carts/carts.routes');
const { orderRouter } = require('./api/orders/orders.routes');
const paymentRoutes = require('./api/payments/payments.routes');
const financialsRoutes = require('./api/financials/financials.routes');
const promotionRoutes = require('./api/promotions/promotions.routes');
const { reviewRouter } = require('./api/reviews/reviews.routes');
const { discussionRouter } = require('./api/discussions/discussions.routes');
const instructorRoutes = require('./api/instructors/instructors.routes');
const skillsRoutes = require('./api/skills/skills.routes');
const settingsRoutes = require('./api/settings/settings.routes');
const notificationRoutes = require('./api/notifications/notifications.routes');
const approvalRequestRoutes = require('./api/approvalRequests/approvalRequests.routes');
const languageRoutes = require('./api/languages/languages.routes');
const currencyRoutes = require('./api/currencies/currencies.routes');
const exchangeRateRoutes = require('./api/exchangeRates/exchangeRates.routes');
const paymentMethodRoutes = require('./api/payments/paymentMethod.routes');
const adminRoutes = require('./api/admin/admin.routes');
const eventRoutes = require('./api/events/events.routes');
const faqRoutes = require('./api/faqs/faqs.routes');
const learningReportRoutes = require('./api/learningReport/learningReport.routes');
// [THÊM 17/08/2026 — LEVEL 2] Module Chứng chỉ (yêu cầu đã chạy V6__certificates.sql)
const certificateRoutes = require('./api/certificates/certificates.routes');
// [THÊM 17/08/2026 — LEVEL 3] Chat AI có lịch sử (yêu cầu đã chạy V7__chat_history.sql)
const aiChatRoutes = require('./api/ai/chat.routes');
// [THÊM 18/08/2026 — COURSE IMPORT] Nhập khóa học từ tệp ZIP.
const importRoutes = require('./api/imports/imports.routes');

apiV1Router.use('/auth', authRoutes);
apiV1Router.use('/users', userRoutes);
apiV1Router.use('/categories', categoryRoutes);
apiV1Router.use('/levels', levelRoutes);
apiV1Router.use('/courses', courseRoutes);
apiV1Router.use('/lessons', lessonRouter);
apiV1Router.use('/enrollments', enrollmentRoutes);
apiV1Router.use('/progress', progressRoutes);
apiV1Router.use('/quizzes', quizRoutes);
apiV1Router.use('/quiz-questions', questionRouter);
apiV1Router.use('/cart', cartRoutes);
apiV1Router.use('/orders', orderRouter);
apiV1Router.use('/payments', paymentRoutes);
apiV1Router.use('/financials', financialsRoutes);
apiV1Router.use('/promotions', promotionRoutes);
apiV1Router.use('/reviews', reviewRouter);
apiV1Router.use('/discussions', discussionRouter);
apiV1Router.use('/instructors', instructorRoutes);
apiV1Router.use('/skills', skillsRoutes);
apiV1Router.use('/settings', settingsRoutes);
apiV1Router.use('/notifications', notificationRoutes);
apiV1Router.use('/approval-requests', approvalRequestRoutes);
apiV1Router.use('/languages', languageRoutes);
apiV1Router.use('/currencies', currencyRoutes);
apiV1Router.use('/exchange-rates', exchangeRateRoutes);
apiV1Router.use('/payment-methods', paymentMethodRoutes);
apiV1Router.use('/admin', adminRoutes);
apiV1Router.use('/events', eventRoutes);
apiV1Router.use('/faqs', faqRoutes);
apiV1Router.use('/learning-report', learningReportRoutes);
apiV1Router.use('/certificates', certificateRoutes);
apiV1Router.use('/ai', aiChatRoutes);
apiV1Router.use('/imports', importRoutes);
app.use('/v1', apiV1Router);

app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, `Not Found - ${req.originalUrl}`));
});

app.use(errorConverter);
app.use(errorHandler);

module.exports = app;
