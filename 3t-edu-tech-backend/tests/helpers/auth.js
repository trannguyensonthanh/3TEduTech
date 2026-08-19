/* ============================================================================
 * helpers/auth.js
 * [THÊM 19/08/2026]
 *
 * Ba hàm bảo đảm có sẵn ba loại tài khoản THẬT, mỗi loại đúng vai trò của nó.
 *
 * ── VÌ SAO CẦN ─────────────────────────────────────────────────────────────
 *
 * Bộ test cũ dùng CHUNG một tài khoản SA cho cả student lẫn instructor, kèm
 * chú thích "SA có quyền tương đương". Điều đó làm hỏng chính thứ đáng test
 * nhất: PHÂN QUYỀN. Một lỗi kiểu "học viên xóa được khóa học của người khác"
 * sẽ không bao giờ lộ ra, vì test chạy bằng tài khoản có mọi quyền.
 *
 * ── RÀO CHẮN PHẢI VƯỢT ────────────────────────────────────────────────────
 *
 * Đăng ký xong tài khoản ở trạng thái PENDING_VERIFICATION và KHÔNG login
 * được (auth.service.js dòng 173). Token xác thực gửi qua email — test không
 * đọc được hộp thư.
 *
 * Lối đi hợp lệ, không đụng thẳng vào CSDL: admin gọi
 * `PATCH /users/:id/status { status: 'ACTIVE' }`. Đây là API có thật, có
 * kiểm quyền, nên test đi đúng cửa mà người thật đi.
 *
 * ── DÙNG LẠI TÀI KHOẢN, KHÔNG ĐẺ MỚI MỖI LƯỢT ─────────────────────────────
 *
 * Email cố định (xem helpers/state.js). Lượt chạy đầu tạo tài khoản, các lượt
 * sau chỉ đăng nhập. Nếu dùng Date.now() thì mỗi lần chạy test lại nhét thêm
 * vài tài khoản rác vào CSDL bạn sắp mang đi báo cáo.
 * ========================================================================== */

const { get, post, patch, state, why } = require('./api');

/** Danh sách tài khoản admin thử lần lượt. Ưu tiên biến môi trường. */
function adminCandidates() {
  const out = [];
  if (process.env.TEST_ADMIN_EMAIL && process.env.TEST_ADMIN_PASSWORD) {
    out.push({
      email: process.env.TEST_ADMIN_EMAIL,
      password: process.env.TEST_ADMIN_PASSWORD,
    });
  }
  out.push(
    { email: '3tedutech@gmail.com', password: 'sonthanh123' },
    { email: 'admin@3tedutech.com', password: 'Admin@12345678' },
    { email: 'sonthanh12345678910@gmail.com', password: 'Admin@12345678' }
  );
  return out;
}

/**
 * Token còn dùng được không — và nếu có yêu cầu vai trò, có ĐÚNG vai trò không?
 *
 * ⚠️ Vế "đúng vai trò" không thừa. Tệp 01-auth (bản cũ) khi không tìm được
 * giảng viên sẽ gán TOKEN ADMIN vào state.instructorToken làm phương án dự
 * phòng. Nếu ở đây chỉ hỏi "token còn sống không" thì ensureInstructor() sẽ
 * thấy sống, trả về luôn, và mọi test phân quyền phía sau lại chạy bằng quyền
 * admin — đúng cái bẫy mà bộ test này sinh ra để phá.
 */
async function tokenAlive(token, requiredRole) {
  if (!token) return false;
  const res = await get('/users/me', { token });
  if (res.status !== 200) return false;
  if (!requiredRole) return true;
  return (res.data?.role ?? res.data?.roleId) === requiredRole;
}

/**
 * Bảo đảm có admin token.
 * @throws nếu không đăng nhập được bằng bất kỳ tài khoản admin nào — đây là
 *   lỗi HẠ TẦNG, phải dừng hẳn chứ không "skip", vì mọi thứ phía sau phụ
 *   thuộc vào nó.
 */
async function ensureAdmin() {
  if (await tokenAlive(state.adminToken)) return state.adminToken;

  for (const cand of adminCandidates()) {
    const res = await post('/auth/login', { body: cand });
    if (res.status === 200 && res.data?.accessToken) {
      const role = res.data.user?.role;
      if (['AD', 'SA'].includes(role)) {
        state.adminToken = res.data.accessToken;
        state.adminAccountId = res.data.user.id ?? res.data.user.accountId;
        state.adminEmail = cand.email;
        state.adminPassword = cand.password;
        return state.adminToken;
      }
    }
  }

  throw new Error(
    'Không đăng nhập được tài khoản ADMIN nào.\n' +
      'Đặt biến môi trường TEST_ADMIN_EMAIL và TEST_ADMIN_PASSWORD rồi chạy lại.\n' +
      'Ví dụ (PowerShell):\n' +
      '  $env:TEST_ADMIN_EMAIL="3tedutech@gmail.com"; $env:TEST_ADMIN_PASSWORD="..."'
  );
}

/** Tìm accountId theo email (cần quyền admin). */
async function findAccountIdByEmail(adminToken, email) {
  const res = await get('/users', {
    token: adminToken,
    query: { searchTerm: email, limit: 20 },
  });
  if (res.status !== 200) return null;
  const list = res.data?.users || res.data?.results || res.data?.data || [];
  const hit = list.find(
    (u) => String(u.email || u.Email).toLowerCase() === email.toLowerCase()
  );
  return hit ? hit.accountId ?? hit.AccountID ?? hit.id : null;
}

/**
 * Tạo (nếu chưa có) → kích hoạt → đăng nhập một tài khoản.
 * @param {object} cfg
 * @param {string} cfg.email
 * @param {string} cfg.password
 * @param {string} cfg.fullName
 * @param {'NU'|'GV'} cfg.role — mã vai trò trong src/core/enums/Roles.js
 *   (NU = học viên, GV = giảng viên, AD = quản trị, SA = quản trị tối cao)
 * @param {object} [cfg.extra] — body thêm khi đăng ký instructor
 */
async function ensureAccount(cfg) {
  const adminToken = await ensureAdmin();

  // 1) Thử đăng nhập trước — lượt chạy thứ hai trở đi sẽ dừng ngay ở đây.
  let login = await post('/auth/login', {
    body: { email: cfg.email, password: cfg.password },
  });
  if (login.status === 200 && login.data?.accessToken) {
    return {
      token: login.data.accessToken,
      accountId: login.data.user?.id ?? login.data.user?.accountId,
      role: login.data.user?.role,
    };
  }

  // 2) Chưa có (hoặc chưa kích hoạt) → đăng ký.
  const duong = cfg.role === 'GV' ? '/auth/register/instructor' : '/auth/register';
  let reg = await post(duong, {
    body: {
      email: cfg.email,
      password: cfg.password,
      fullName: cfg.fullName,
      ...(cfg.extra || {}),
    },
  });

  /* Một số cấu hình chỉ cho ADMIN tạo giảng viên (đăng ký công khai trả 403).
     Trong trường hợp đó, đi đường vòng hợp lệ: đăng ký như học viên bình
     thường rồi để admin nâng vai trò ở bước 5. Không làm vậy thì bộ test tự
     chặn chính mình trên một hệ thống hoàn toàn đúng. */
  if (cfg.role === 'GV' && reg.status === 403) {
    reg = await post('/auth/register', {
      body: {
        email: cfg.email,
        password: cfg.password,
        fullName: cfg.fullName,
      },
    });
  }

  let accountId = reg.data?.user?.accountId ?? null;

  /* Đăng ký trả 400 nghĩa là email đã tồn tại — không phải lỗi, chỉ là tài
     khoản còn kẹt ở PENDING_VERIFICATION từ lượt chạy trước. Đi tìm id. */
  if (!accountId) {
    accountId = await findAccountIdByEmail(adminToken, cfg.email);
  }
  if (!accountId) {
    throw new Error(
      `Không tạo và cũng không tìm được tài khoản ${cfg.email}. ` +
        `Phản hồi đăng ký: ${why(reg)}`
    );
  }

  // 3) Admin kích hoạt (thay cho việc bấm link trong email).
  const act = await patch(`/users/${accountId}/status`, {
    token: adminToken,
    body: { status: 'ACTIVE' },
  });
  if (act.status !== 200 && act.status !== 204) {
    throw new Error(`Không kích hoạt được ${cfg.email}: ${why(act)}`);
  }

  // 4) Đăng nhập lại.
  login = await post('/auth/login', {
    body: { email: cfg.email, password: cfg.password },
  });
  if (login.status !== 200 || !login.data?.accessToken) {
    throw new Error(
      `Kích hoạt xong vẫn không đăng nhập được ${cfg.email}: ${why(login)}`
    );
  }

  let role = login.data.user?.role;

  // 5) Đúng vai trò chưa? Nếu chưa, admin đổi rồi đăng nhập lại.
  if (cfg.role && role !== cfg.role) {
    const rr = await patch(`/users/${accountId}/role`, {
      token: adminToken,
      body: { roleId: cfg.role },
    });
    if (rr.status === 200 || rr.status === 204) {
      login = await post('/auth/login', {
        body: { email: cfg.email, password: cfg.password },
      });
      role = login.data?.user?.role;
    }
  }

  return {
    token: login.data.accessToken,
    accountId: login.data.user?.id ?? login.data.user?.accountId ?? accountId,
    role,
  };
}

async function ensureStudent() {
  if (await tokenAlive(state.studentToken, 'NU')) return state.studentToken;
  const r = await ensureAccount({
    email: state.studentEmail,
    password: state.studentPassword,
    fullName: state.studentName,
    role: 'NU',
  });
  state.studentToken = r.token;
  state.studentAccountId = r.accountId;
  return r.token;
}

async function ensureStudent2() {
  if (await tokenAlive(state.student2Token, 'NU')) return state.student2Token;
  const r = await ensureAccount({
    email: state.student2Email,
    password: state.student2Password,
    fullName: state.student2Name,
    role: 'NU',
  });
  state.student2Token = r.token;
  state.student2AccountId = r.accountId;
  return r.token;
}

async function ensureInstructor() {
  if (await tokenAlive(state.instructorToken, 'GV')) return state.instructorToken;
  const r = await ensureAccount({
    email: state.instructorEmail,
    password: state.instructorPassword,
    fullName: state.instructorName,
    role: 'GV',
    extra: {
      professionalTitle: 'Senior Developer',
      bio: 'Giảng viên do bộ test tự động tạo.',
    },
  });
  state.instructorToken = r.token;
  state.instructorAccountId = r.accountId;
  return r.token;
}

module.exports = {
  ensureAdmin,
  ensureStudent,
  ensureStudent2,
  ensureInstructor,
  findAccountIdByEmail,
  tokenAlive,
};
