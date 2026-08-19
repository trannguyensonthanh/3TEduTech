const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

// Production: load .env.production nếu NODE_ENV=production, fallback .env
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
const envPath = path.join(__dirname, '../../', envFile);
dotenv.config({ path: envPath });
// Luôn load .env làm fallback cho các biến chưa định nghĩa trong .env.production
dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = Joi.object()
  .keys({
    FRONTEND_URL: Joi.string()
      .uri()
      .description('Base URL of the frontend application'),
    NODE_ENV: Joi.string()
      .valid('production', 'development', 'test')
      .required(),
    PORT: Joi.number().default(5000),
    DB_HOST: Joi.string().required().description('Database host'),
    DB_PORT: Joi.number().default(1433).description('Database port'),
    DB_USER: Joi.string().required().description('Database username'),
    DB_PASSWORD: Joi.string().required().description('Database password'),
    DB_NAME: Joi.string().required().description('Database name'),
    DB_ENCRYPT: Joi.boolean()
      .default(true)
      .description('Enable DB connection encryption'),
    DB_TRUST_SERVER_CERTIFICATE: Joi.boolean()
      .default(false)
      .description('Trust server certificate'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number()
      .default(60)
      .description('Minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number()
      .default(30)
      .description('Days after which refresh tokens expire'),
    MAIL_HOST: Joi.string().description('Server for sending emails'),
    MAIL_PORT: Joi.number().description('Port for email server'),
    MAIL_USER: Joi.string().description('Username for email server'),
    MAIL_PASSWORD: Joi.string().description('Password for email server'),
    MAIL_FROM: Joi.string().description(
      'Email address from which emails are sent'
    ),
    MAIL_ENCRYPTION: Joi.string()
      .valid('none', 'tls', 'ssl')
      .default('tls')
      .description('Email encryption method'),
    CLOUDINARY_CLOUD_NAME: Joi.string().description('Cloudinary Cloud Name'),
    CLOUDINARY_API_KEY: Joi.string().description('Cloudinary API Key'),
    CLOUDINARY_API_SECRET: Joi.string().description('Cloudinary API Secret'),
    VNP_TMNCODE: Joi.string().description('VNPay Terminal Code'),
    VNP_HASHSECRET: Joi.string().description('VNPay Hash Secret'),
    VNP_URL: Joi.string().uri().description('VNPay Payment Gateway URL'),
    VNP_API_URL: Joi.string().uri().description('VNPay API URL'),
    VNP_RETURN_URL: Joi.string().uri().description('VNPay Return URL'),
    VNP_IPN_URL: Joi.string().uri().description('VNPay IPN URL'),
    GOOGLE_CLIENT_ID: Joi.string().description('Google OAuth Client ID'),
    GOOGLE_CLIENT_SECRET: Joi.string().description(
      'Google OAuth Client Secret'
    ),
    GOOGLE_CALLBACK_URL: Joi.string()
      .uri()
      .description('Google OAuth Callback URL'),
    FACEBOOK_APP_ID: Joi.string().description('Facebook App ID'),
    FACEBOOK_APP_SECRET: Joi.string().description('Facebook App Secret'),
    FACEBOOK_CALLBACK_URL: Joi.string()
      .uri({ scheme: ['https'] })
      .description('Facebook OAuth Callback URL (HTTPS)'),
    NOWPAYMENTS_API_KEY: Joi.string().description('NOWPayments API Key'),
    NOWPAYMENTS_IPN_SECRET: Joi.string().description('NOWPayments IPN Secret'),
    NOWPAYMENTS_API_URL: Joi.string()
      .uri()
      .default('https://api.nowpayments.io/v1'),
    PAYPAL_CLIENT_ID: Joi.string().description('PayPal Client ID'),
    PAYPAL_CLIENT_SECRET: Joi.string().description('PayPal Client Secret'),
    PAYPAL_API_URL: Joi.string().uri().description('PayPal API Base URL'),
    // MOMO Payment Config
    MOMO_PARTNER_CODE: Joi.string().description('MoMo Partner Code'),
    MOMO_ACCESS_KEY: Joi.string().description('MoMo Access Key'),
    MOMO_SECRET_KEY: Joi.string().description('MoMo Secret Key'),
    MOMO_API_URL: Joi.string().uri().description('MoMo API Base URL'),
    // Production Deployment Config
    AI_SERVICE_URL: Joi.string()
      .uri()
      .description('Full URL of AI Service on GPU EC2 (e.g. http://10.0.1.50:2111)'),
    AI_SERVICE_PORT: Joi.number()
      .default(2111)
      .description('AI Service port (fallback when AI_SERVICE_URL not set)'),
    REDIS_URL: Joi.string()
      .description('Redis connection URL (e.g. redis://:password@host:port)'),
    SERVER_URL: Joi.string()
      .uri()
      .description('Public URL of this backend server'),
    CORS_ALLOWED_ORIGINS: Joi.string()
      .description('Comma-separated list of allowed CORS origins'),
    /* [THÊM 17/08/2026 — LEVEL 2] Khóa ký chứng chỉ.
       CỐ Ý không đặt .required(): thiếu biến này thì certificates.service tự
       dùng tạm JWT_SECRET và ghi cảnh báo, thay vì chặn cả hệ thống khởi động
       chỉ vì một tính năng phụ chưa được cấu hình.
       Ràng buộc min(16) để chặn kiểu đặt cho có ("secret", "123456") — khóa quá
       ngắn thì chữ ký HMAC mất phần lớn giá trị chống giả mạo. */
    CERTIFICATE_SECRET: Joi.string()
      .min(16)
      .description(
        'Secret key ký HMAC cho chứng chỉ (nên đặt KHÁC JWT_SECRET để xoay vòng JWT không làm hỏng chứng chỉ đã cấp)'
      ),
    /* [THÊM 17/08/2026 — LEVEL 3] Khóa chia sẻ giữa backend và AI Service.
       Phải TRÙNG KHỚP với INTERNAL_API_KEY trong ai-service/.env.
       Bỏ trống ở cả hai phía = AI Service chạy không xác thực như trước. */
    AI_SERVICE_INTERNAL_KEY: Joi.string()
      .min(16)
      .description('Khóa nội bộ để backend gọi AI Service (khớp INTERNAL_API_KEY của ai-service)'),

    /* ========================================================================
       [THÊM 18/08/2026 — COURSE IMPORT] Nhập khóa học từ tệp ZIP.

       ★ IMPORT_TEMP_DIR là điểm mấu chốt để cùng một mã nguồn chạy được ở CẢ
       local lẫn server: đường dẫn là CẤU HÌNH, không phải hằng số trong code.
           .env             → /app/.tmp/imports
           .env.production  → /var/lib/3tedu/imports
       Nhờ vậy không có một dòng `if (isProduction)` nào trong toàn bộ tính năng.

       ⚠️ Thư mục này PHẢI là Docker volume, không được nằm trong bind mount mã
       nguồn — ổ Windows (NTFS) không phân biệt hoa/thường còn ext4 thì có, dẫn
       tới local ra 20 bài mà server ra 21 bài.
       ======================================================================== */
    IMPORT_TEMP_DIR: Joi.string()
      .default('/var/lib/3tedu/imports')
      .description('Thư mục tạm giải nén ZIP'),
    IMPORT_TTL_HOURS: Joi.number()
      .default(48)
      .description('Số giờ giữ bản nháp và thư mục tạm'),
    IMPORT_MAX_ZIP_MB: Joi.number().default(200),
    IMPORT_MAX_TOTAL_MB: Joi.number()
      .default(500)
      .description('Tổng dung lượng tối đa SAU khi giải nén (chống zip bomb)'),
    IMPORT_MAX_FILE_MB: Joi.number()
      .default(200)
      .description('Kích thước tối đa của một tệp bên trong ZIP'),
    IMPORT_MAX_FILES: Joi.number().default(1000),
    IMPORT_MIN_FREE_DISK_GB: Joi.number()
      .default(5)
      .description('Từ chối nhận tệp khi đĩa trống dưới mức này'),
    IMPORT_MAX_CONCURRENT_PER_USER: Joi.number().default(1),
    IMPORT_JOB_TIMEOUT_MINUTES: Joi.number().default(30),

    /* [THÊM 18/08/2026] Trần dung lượng MỘT tệp video khi giảng viên tải thẳng
       lên Cloudinary từ trình duyệt.

       ⚠️ 100MB KHÔNG phải con số ta tự chọn — đó là giới hạn cứng của gói
       Cloudinary miễn phí ("Max video file size: 100 MB"). Vượt qua là
       Cloudinary từ chối, không có cách nào lách bằng cấu hình phía ta.

       Đặt thành biến môi trường để khi nâng gói Cloudinary thì chỉ sửa một
       dòng, không phải đi tìm con số ghi cứng rải rác trong mã nguồn và giao
       diện. Với gói trả phí, giá trị này có thể nâng lên vài GB. */
    IMPORT_MAX_VIDEO_UPLOAD_MB: Joi.number()
      .default(100)
      .description('Trần dung lượng một tệp video tải thẳng lên Cloudinary'),

    /* ========================================================================
       [THÊM 18/08/2026 — TÀI LIỆU CHÍNH SÁCH FAQ]

       Quản trị viên tải lên PDF chính sách (điều khoản, quy chế hoàn tiền...).
       Hệ thống bóc text → nạp vào ChromaDB cho chatbot, còn TỆP GỐC vẫn xem
       được ở trang quản lý FAQ.

       ★ KHÔNG có bảng CSDL nào cho việc này. Siêu dữ liệu (tên tệp, đường dẫn
       Cloudinary, thời điểm tải lên) nằm trong MỘT tệp JSON ở
       FAQ_DOCS_DIR/manifest.json. Vài chục bản ghi không đáng một bảng, một bộ
       migration và một lớp repository.

       ⚠️ Mặc định trỏ vào cùng volume với IMPORT_TEMP_DIR nhưng thư mục khác.
       Nếu đặt vào thư mục KHÔNG PHẢI volume, mỗi lần `docker compose up` thay
       container là mất sạch danh mục tài liệu — tệp gốc vẫn nằm trên Cloudinary
       nhưng hệ thống không còn biết chúng tồn tại, và cũng không xóa được
       vector tương ứng trong ChromaDB nữa.
       ======================================================================== */
    FAQ_DOCS_DIR: Joi.string()
      .default('/var/lib/3tedu/faq-docs')
      .description('Thư mục chứa manifest.json của tài liệu chính sách FAQ'),
    FAQ_DOC_MAX_MB: Joi.number()
      .default(10)
      .description('Kích thước tối đa một tệp tài liệu chính sách'),
    FAQ_DOC_MAX_COUNT: Joi.number()
      .default(50)
      .description('Số tài liệu tối đa — chặn manifest phình vô hạn'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: 'key' } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  serverUrl: envVars.SERVER_URL,
  frontendUrl: envVars.FRONTEND_URL,
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  // AI Service URL — ưu tiên AI_SERVICE_URL, fallback http://127.0.0.1:PORT
  aiServiceUrl:
    envVars.AI_SERVICE_URL ||
    `http://127.0.0.1:${envVars.AI_SERVICE_PORT || 2111}`,
  // Redis URL — ưu tiên REDIS_URL, fallback localhost
  redisUrl: envVars.REDIS_URL || 'redis://localhost:6379',
  // [THÊM 17/08/2026 — LEVEL 3] Cấu hình gọi AI Service
  aiService: {
    internalKey: envVars.AI_SERVICE_INTERNAL_KEY || '',
  },
  // [THÊM 18/08/2026 — COURSE IMPORT] Quy đổi sang byte ngay tại đây để phần
  // còn lại của mã nguồn không phải nhân chia MB lặp đi lặp lại (và không có
  // chỗ nào nhân nhầm 1000 thay vì 1024).
  import: {
    tempDir: envVars.IMPORT_TEMP_DIR,
    ttlHours: envVars.IMPORT_TTL_HOURS,
    maxZipBytes: envVars.IMPORT_MAX_ZIP_MB * 1024 * 1024,
    maxTotalBytes: envVars.IMPORT_MAX_TOTAL_MB * 1024 * 1024,
    maxFileBytes: envVars.IMPORT_MAX_FILE_MB * 1024 * 1024,
    maxFiles: envVars.IMPORT_MAX_FILES,
    minFreeDiskBytes: envVars.IMPORT_MIN_FREE_DISK_GB * 1024 * 1024 * 1024,
    maxConcurrentPerUser: envVars.IMPORT_MAX_CONCURRENT_PER_USER,
    jobTimeoutMinutes: envVars.IMPORT_JOB_TIMEOUT_MINUTES,
    maxVideoUploadMb: envVars.IMPORT_MAX_VIDEO_UPLOAD_MB,
  },
  // [THÊM 18/08/2026] Tài liệu chính sách FAQ (PDF → RAG).
  faqDocs: {
    dir: envVars.FAQ_DOCS_DIR,
    maxBytes: envVars.FAQ_DOC_MAX_MB * 1024 * 1024,
    maxCount: envVars.FAQ_DOC_MAX_COUNT,
  },
  // CORS allowed origins — parse từ comma-separated string
  corsAllowedOrigins: envVars.CORS_ALLOWED_ORIGINS
    ? envVars.CORS_ALLOWED_ORIGINS.split(',').map((s) => s.trim())
    : [
        'http://localhost:5173',
        'https://localhost:5173',
        'http://localhost:8080',
        'https://localhost:8080',
      ],
  db: {
    host: envVars.DB_HOST,
    port: envVars.DB_PORT,
    user: envVars.DB_USER,
    password: envVars.DB_PASSWORD,
    database: envVars.DB_NAME,
    options: {
      encrypt: envVars.DB_ENCRYPT,
      trustServerCertificate: envVars.DB_TRUST_SERVER_CERTIFICATE,
    },
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    emailVerificationTokenExpiresMinutes: 60 * 24,
  },
  mailer: {
    host: envVars.MAIL_HOST,
    port: envVars.MAIL_PORT,
    auth: {
      user: envVars.MAIL_USER,
      pass: envVars.MAIL_PASSWORD,
    },
    from: envVars.MAIL_FROM,
    secure: envVars.MAIL_ENCRYPTION === 'ssl',
    requireTLS: envVars.MAIL_ENCRYPTION === 'tls',
  },
  cloudinary: {
    cloud_name: envVars.CLOUDINARY_CLOUD_NAME,
    api_key: envVars.CLOUDINARY_API_KEY,
    api_secret: envVars.CLOUDINARY_API_SECRET,
  },
  vnpay: {
    tmnCode: envVars.VNP_TMNCODE,
    hashSecret: envVars.VNP_HASHSECRET,
    url: envVars.VNP_URL,
    apiUrl: envVars.VNP_API_URL,
    returnUrl: envVars.VNP_RETURN_URL,
    ipnUrl: envVars.VNP_IPN_URL,
  },
  googleAuth: {
    clientID: envVars.GOOGLE_CLIENT_ID?.trim(),
    clientSecret: envVars.GOOGLE_CLIENT_SECRET?.trim(),
    callbackURL: envVars.GOOGLE_CALLBACK_URL?.trim(),
  },
  facebookAuth: {
    clientID: envVars.FACEBOOK_APP_ID?.trim(),
    clientSecret: envVars.FACEBOOK_APP_SECRET?.trim(),
    callbackURL: envVars.FACEBOOK_CALLBACK_URL?.trim(),
  },
  youtubeApiKey: process.env.YOUTUBE_API_KEY,
  appName: '3TEduTech',
  settings: {
    baseCurrency: 'VND',
  },
  stripe: {
    publicKey: envVars.STRIPE_PUBLIC_KEY,
    secretKey: envVars.STRIPE_SECRET_KEY,
    webhookSecret: envVars.STRIPE_WEBHOOK_SECRET,
  },
  exchangeRateApiKey: envVars.EXCHANGE_RATE_API_KEY,
  nowPayments: {
    apiKey: envVars.NOWPAYMENTS_API_KEY,
    ipnSecret: envVars.NOWPAYMENTS_IPN_SECRET,
    apiUrl: envVars.NOWPAYMENTS_API_URL,
  },
  paypal: {
    clientId: envVars.PAYPAL_CLIENT_ID,
    clientSecret: envVars.PAYPAL_CLIENT_SECRET,
    apiUrl: envVars.PAYPAL_API_URL,
  },
  momo: {
    partnerCode: envVars.MOMO_PARTNER_CODE,
    accessKey: envVars.MOMO_ACCESS_KEY,
    secretKey: envVars.MOMO_SECRET_KEY,
    apiUrl: envVars.MOMO_API_URL,
  },
};
