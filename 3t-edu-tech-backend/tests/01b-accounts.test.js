/**
 * 01b-accounts.test.js — Dựng tài khoản thật cho toàn bộ chuỗi test
 * ═══════════════════════════════════════════════════════════════════════════
 * [THÊM 19/08/2026]
 *
 * Tệp này phải chạy NGAY SAU 01-auth và TRƯỚC mọi tệp khác (bộ sắp xếp trong
 * helpers/testSequencer.js sắp theo tên tệp, "01b" nằm giữa "01" và "02").
 *
 * ── NÓ SỬA ĐIỀU GÌ ────────────────────────────────────────────────────────
 *
 * Bộ test cũ dùng CHUNG tài khoản SA cho cả học viên lẫn giảng viên, kèm chú
 * thích "SA có quyền tương đương". Nghe thì tiện, nhưng nó vô hiệu hóa đúng
 * thứ đáng kiểm tra nhất — PHÂN QUYỀN. Chạy mọi thứ bằng tài khoản có toàn
 * quyền thì một lỗi kiểu "học viên gọi được API xóa khóa học" sẽ không bao
 * giờ lộ ra.
 *
 * Sau tệp này, state có BỐN danh tính riêng biệt:
 *   adminToken     — AD hoặc SA (tài khoản có sẵn của bạn)
 *   instructorToken— GV thật
 *   studentToken   — HV thật
 *   student2Token  — HV thứ hai, để kiểm tra "A không đụng được dữ liệu của B"
 */

const {
  ensureAdmin,
  ensureInstructor,
  ensureStudent,
  ensureStudent2,
} = require('./helpers/auth');
const { get, state, why } = require('./helpers/api');

describe('👥 ACCOUNTS — Dựng bốn danh tính riêng biệt', () => {
  test('Admin đăng nhập được', async () => {
    const token = await ensureAdmin();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);

    const me = await get('/users/me', { token });
    expect(me.status).toBe(200);
    expect(['AD', 'SA']).toContain(me.data.role ?? me.data.roleId);
    console.log(`  ✅ Admin: ${state.adminEmail} (id=${state.adminAccountId})`);
  });

  test('Giảng viên: tạo → kích hoạt → đăng nhập, vai trò đúng GV', async () => {
    const token = await ensureInstructor();
    const me = await get('/users/me', { token });
    expect(me.status).toBe(200);
    expect(me.data.role ?? me.data.roleId).toBe('GV');
    console.log(
      `  ✅ Giảng viên: ${state.instructorEmail} (id=${state.instructorAccountId})`
    );
  });

  /* [SỬA 19/08/2026] Mã vai trò học viên là 'NU', KHÔNG phải 'HV'.
     Xem src/core/enums/Roles.js: STUDENT='NU', INSTRUCTOR='GV', ADMIN='AD',
     SUPERADMIN='SA'. Tôi đã đoán 'HV' theo chữ "học viên" mà không mở tệp
     enum ra kiểm — đúng loại lỗi mà bộ test này sinh ra để bắt. */
  test('Học viên 1: tạo → kích hoạt → đăng nhập, vai trò đúng NU', async () => {
    const token = await ensureStudent();
    const me = await get('/users/me', { token });
    expect(me.status).toBe(200);
    expect(me.data.role ?? me.data.roleId).toBe('NU');
    console.log(
      `  ✅ Học viên 1: ${state.studentEmail} (id=${state.studentAccountId})`
    );
  });

  test('Học viên 2 (dùng cho test phân quyền chéo)', async () => {
    const token = await ensureStudent2();
    const me = await get('/users/me', { token });
    expect(me.status).toBe(200);
    expect(me.data.role ?? me.data.roleId).toBe('NU');
    console.log(`  ✅ Học viên 2: ${state.student2Email}`);
  });

  test('Bốn tài khoản là BỐN người khác nhau', async () => {
    const ids = [
      state.adminAccountId,
      state.instructorAccountId,
      state.studentAccountId,
      state.student2AccountId,
    ];
    expect(ids.every((i) => i !== null && i !== undefined)).toBe(true);
    /* Nếu bốn id này trùng nhau thì mọi test phân quyền phía sau đều vô nghĩa
       — chính là cái bẫy của bộ test cũ. Chặn ngay tại đây. */
    expect(new Set(ids).size).toBe(4);
    console.log(`  ✅ AccountID: ${ids.join(', ')}`);
  });

  test('State ĐÃ được chia sẻ xuống đĩa (chứng minh harness hoạt động)', async () => {
    const fs = require('fs');
    const { STATE_FILE } = require('./helpers/state');
    expect(fs.existsSync(STATE_FILE)).toBe(true);
    const onDisk = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    expect(onDisk.studentToken).toBeTruthy();
    expect(onDisk.instructorToken).toBeTruthy();
    console.log('  ✅ tests/.state.json có token — các tệp sau sẽ đọc được');
  });
});

describe('🔐 ACCOUNTS — Đổi mật khẩu (trên tài khoản test, KHÔNG đụng admin)', () => {
  test('Đổi mật khẩu học viên 2 rồi khôi phục', async () => {
    const { post } = require('./helpers/api');
    const token = await ensureStudent2();
    const cur = state.student2Password;
    const tmp = 'Tmp@Pass123456';

    const doi = await post('/auth/change-password', {
      token,
      body: { currentPassword: cur, newPassword: tmp },
    });
    expect(doi.status).toBe(200);

    /* Đăng nhập bằng mật khẩu CŨ phải thất bại — nếu vẫn vào được thì việc
       "đổi mật khẩu" chỉ là ghi vào một cột không ai đọc. */
    const cuMaVaoDuoc = await post('/auth/login', {
      body: { email: state.student2Email, password: cur },
    });
    expect(cuMaVaoDuoc.status).toBe(401);

    const moi = await post('/auth/login', {
      body: { email: state.student2Email, password: tmp },
    });
    expect(moi.status).toBe(200);

    // Khôi phục
    const tra = await post('/auth/change-password', {
      token: moi.data.accessToken,
      body: { currentPassword: tmp, newPassword: cur },
    });
    expect(tra.status).toBe(200);

    const cuoi = await post('/auth/login', {
      body: { email: state.student2Email, password: cur },
    });
    expect(cuoi.status).toBe(200);
    state.student2Token = cuoi.data.accessToken;
    console.log('  ✅ Đổi mật khẩu: đổi được, mật khẩu cũ bị vô hiệu, khôi phục xong');
  });

  test('Đổi mật khẩu sai mật khẩu hiện tại → bị từ chối', async () => {
    const { post } = require('./helpers/api');
    const token = await ensureStudent2();
    const res = await post('/auth/change-password', {
      token,
      body: { currentPassword: 'sai_hoan_toan_123', newPassword: 'Khac@123456' },
    });
    expect([400, 401]).toContain(res.status);
    console.log(`  ✅ Sai mật khẩu hiện tại: bị chặn (${res.status})`);
  });
});
