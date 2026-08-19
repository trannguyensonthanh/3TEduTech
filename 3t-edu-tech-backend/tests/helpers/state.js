/* ============================================================================
 * helpers/state.js
 * [THÊM 19/08/2026]
 *
 * ── VÌ SAO TỆP NÀY PHẢI TỒN TẠI ────────────────────────────────────────────
 *
 * Trước đây `state` là một object thường nằm trong helpers/api.js. Ý tưởng là
 * 01-auth đăng nhập, gán `state.studentToken`, rồi 02…12 dùng lại.
 *
 * NHƯNG JEST KHÔNG LÀM VIỆC NHƯ VẬY. Mỗi TỆP test được chạy trong một
 * "module registry" riêng — kể cả khi bạn đặt `maxWorkers: 1` và
 * `--runInBand`, tức là chung một tiến trình. Cùng một `require('./api')` ở
 * hai tệp khác nhau sẽ chạy lại thân module và cho ra HAI object khác nhau.
 *
 * Hậu quả thực tế: `state.studentToken` ở tệp 05 LUÔN là null. Mà các tệp đó
 * mở đầu bằng `if (!token) { console.log('Skip'); return; }` — nên toàn bộ
 * test bỏ qua và Jest báo PASS. Bộ test xanh mướt trong khi không kiểm tra
 * một dòng nghiệp vụ nào.
 *
 * ── CÁCH CHỮA ─────────────────────────────────────────────────────────────
 *
 * Đẩy state ra ĐĨA (tests/.state.json). Object trả về là một Proxy: mỗi lần
 * gán một trường, nó ghi luôn xuống tệp; mỗi lần đọc, nó lấy từ bản nạp lúc
 * require. Nhờ vậy các tệp test cũ KHÔNG cần sửa một dòng nào mà vẫn thấy
 * nhau.
 *
 * ⚠️ Đây là state dùng chung có chủ đích, không phải "biến toàn cục cho tiện".
 * Nó tồn tại vì chuỗi test này cố ý phụ thuộc thứ tự (đăng ký → duyệt → mua →
 * học → cấp chứng nhận), đúng như một người dùng thật đi qua hệ thống.
 * ========================================================================== */

const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '..', '.state.json');

/* Tiền tố email tài khoản kiểm thử.
   Cố định (không kèm Date.now()) để chạy lại nhiều lần vẫn dùng ĐÚNG những
   tài khoản đó, thay vì mỗi lần chạy lại đẻ thêm một bộ tài khoản rác trong
   CSDL demo của bạn. Muốn tách riêng thì đặt biến môi trường TEST_PREFIX. */
const PREFIX = process.env.TEST_PREFIX || 'qa';

/* [SỬA 19/08/2026] 'edutest.local' -> 'qa.example.com'.
   `Joi.string().email()` mặc định KIỂM TRA TLD theo danh sách IANA, nên '.local'
   bị trả về 400 `"email" must be a valid email` — toàn bộ việc dựng tài khoản
   sập ngay từ bước đăng ký.
   `example.com` là tên miền IANA dành riêng cho tài liệu và kiểm thử: TLD hợp
   lệ nên Joi chấp nhận, mà thư gửi tới đó không bao giờ tới tay ai. Dùng
   subdomain 'qa.' để dữ liệu test dễ nhận ra trong CSDL. */
const DOMAIN = process.env.TEST_EMAIL_DOMAIN || 'qa.example.com';

/* Email DÙNG MỘT LẦN cho các phép thử "vừa đăng ký xong thì chưa đăng nhập
   được". Phải mới tinh mỗi lượt chạy: nếu dùng email cố định thì từ lượt chạy
   thứ hai tài khoản đó ĐÃ được kích hoạt, và phép thử "chưa verify → 401" sẽ
   nhận 200 rồi báo đỏ oan.
   globalSetup xóa .state.json mỗi lượt nên Date.now() ở đây luôn sinh giá trị
   mới. */
const MOI = Date.now();

const defaults = {
  throwawayEmail: `${PREFIX}.fresh.${MOI}@${DOMAIN}`,
  throwawayInstructorEmail: `${PREFIX}.fresh.gv.${MOI}@${DOMAIN}`,
  throwawayPassword: 'Test@12345678',

  // --- Tài khoản Student ---
  studentEmail: `${PREFIX}.student@${DOMAIN}`,
  studentPassword: 'Test@12345678',
  studentName: 'QA Student',
  studentToken: null,
  studentRefreshToken: null,
  studentAccountId: null,

  // --- Tài khoản Student thứ hai (dùng cho test phân quyền: A không được
  //     đụng vào dữ liệu của B) ---
  student2Email: `${PREFIX}.student2@${DOMAIN}`,
  student2Password: 'Test@12345678',
  student2Name: 'QA Student 2',
  student2Token: null,
  student2AccountId: null,

  // --- Tài khoản Instructor ---
  instructorEmail: `${PREFIX}.instructor@${DOMAIN}`,
  instructorPassword: 'Test@12345678',
  instructorName: 'QA Instructor',
  instructorToken: null,
  instructorRefreshToken: null,
  instructorAccountId: null,

  // --- Tài khoản Admin (PHẢI có sẵn — test không tự tạo được admin) ---
  adminEmail: null,
  adminPassword: null,
  adminToken: null,
  adminAccountId: null,

  // --- Thực thể sinh ra trong lúc chạy test ---
  createdCourseId: null,
  createdCourseSlug: null,
  createdSectionId: null,
  createdLessonId: null,
  createdQuizLessonId: null,
  approvalRequestId: null,
  orderId: null,
  enrollmentId: null,
  cartCourseId: null,

  // --- Cho các bộ test mới ---
  importJobId: null,
  newVersionCourseId: null,
  chatSessionId: null,
  faqDocumentId: null,
  certificateCode: null,
};

function load() {
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return { ...defaults };
  }
}

function persist(data) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    /* Không ghi được state chỉ làm mất liên kết giữa các tệp test, không phải
       lý do để đánh hỏng cả lượt chạy. Nhưng phải KÊU TO — im lặng ở đây
       chính là cái bẫy cũ. */
    console.error('[state] KHÔNG ghi được .state.json:', err.message);
  }
}

const data = load();

/** Xóa sạch state — globalSetup gọi hàm này ở đầu mỗi lượt chạy đầy đủ. */
function reset() {
  try {
    fs.unlinkSync(STATE_FILE);
  } catch {
    /* chưa có tệp thì thôi */
  }
}

const state = new Proxy(data, {
  set(target, prop, value) {
    target[prop] = value;
    persist(target);
    return true;
  },
});

module.exports = { state, reset, STATE_FILE };
