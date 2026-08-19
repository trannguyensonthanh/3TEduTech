/**
 * 01-auth.test.js — Test luồng xác thực
 * ═══════════════════════════════════════════════════════════
 * Register (chỉ tạo tài khoản, chưa verify) → Login admin → Các kiểm tra auth
 *
 * LƯU Ý: Hệ thống yêu cầu verify email trước khi login.
 * Nên test register chỉ kiểm tra 201, không có tokens.
 * Test flow chính dùng tài khoản admin/instructor CÓ SẴN.
 */

const { get, post, patch, state } = require('./helpers/api');

describe('🔑 AUTH — Đăng ký & Đăng nhập', () => {

  // ─── Đăng ký Student (chỉ kiểm tra tạo account, chưa login được) ───
  /* [SỬA 19/08/2026] Ba phép thử dưới đây dùng email DÙNG MỘT LẦN
     (state.throwawayEmail), không dùng state.studentEmail nữa.

     Lý do: state.studentEmail là tài khoản CỐ ĐỊNH mà 01b-accounts sẽ kích
     hoạt để cả chuỗi test dùng chung. Từ lượt chạy thứ hai, nó đã ACTIVE — khi
     đó "đăng ký → 201" thành 400 (trùng email) và "chưa verify → 401" thành
     200. Cả hai đỏ oan, trong khi hệ thống hoàn toàn đúng. */
  test('Đăng ký tài khoản Student mới → 201 + message', async () => {
    const res = await post('/auth/register', {
      body: {
        email: state.throwawayEmail,
        password: state.throwawayPassword,
        fullName: 'QA Throwaway',
      },
    });
    // Backend trả { message, user } — KHÔNG có tokens (cần verify email)
    expect(res.status).toBe(201);
    expect(res.data.message).toBeDefined();
    console.log(`  ✅ Student đăng ký: ${res.data.message}`);
  });

  test('Đăng ký trùng email → phải bị từ chối', async () => {
    const res = await post('/auth/register', {
      body: {
        email: '3tedutech@gmail.com', // Dùng email admin đã active để test
        password: 'any_password123',
        fullName: 'Duplicate Account',
      },
    });
    // Trùng email active phải trả về 400 (BAD REQUEST)
    expect([400, 409]).toContain(res.status);
    console.log(`  ✅ Trùng email: Bị từ chối đúng (${res.status})`);
  });

  test('Đăng ký thiếu email → validation error 400', async () => {
    const res = await post('/auth/register', {
      body: { password: 'test12345', fullName: 'No Email' },
    });
    expect(res.status).toBe(400);
    console.log(`  ✅ Thiếu email: Validation error đúng (${res.status})`);
  });

  test('Đăng ký mật khẩu quá ngắn → validation error 400', async () => {
    const res = await post('/auth/register', {
      body: { email: 'shortpw@test.com', password: '123', fullName: 'Short PW' },
    });
    expect(res.status).toBe(400);
    console.log(`  ✅ MK ngắn: Validation error đúng (${res.status})`);
  });

  // ─── Đăng ký Instructor ───
  test('Đăng ký tài khoản Instructor mới → 201 hoặc 403', async () => {
    const res = await post('/auth/register/instructor', {
      body: {
        email: state.throwawayInstructorEmail,
        password: state.throwawayPassword,
        fullName: 'QA Throwaway GV',
        professionalTitle: 'Senior Developer',
        bio: 'Giảng viên test tự động',
      },
    });
    // 201 = thành công, 403 = endpoint bị hạn chế (chỉ admin tạo instructor)
    if (res.status === 201) {
      console.log(`  ✅ Instructor đăng ký: Thành công (cần verify email)`);
    } else if (res.status === 403) {
      console.log(`  ⚠️ Instructor đăng ký: 403 — Endpoint yêu cầu quyền admin (hợp lý)`);
    } else {
      console.log(`  ⚠️ Instructor đăng ký: Status ${res.status}`);
    }
    expect([201, 403]).toContain(res.status);
  });

  // ─── Đăng nhập ───
  test('Đăng nhập Student (chưa verify email) → 401 hoặc 403', async () => {
    const res = await post('/auth/login', {
      body: {
        email: state.throwawayEmail,
        password: state.throwawayPassword,
      },
    });
    // Tài khoản vừa đăng ký, chưa ai kích hoạt → không login được
    expect([401, 403]).toContain(res.status);
    console.log(`  ✅ Student chưa verify: Login bị chặn đúng (${res.status})`);
  });

  test('Đăng nhập sai mật khẩu → 401', async () => {
    const res = await post('/auth/login', {
      body: {
        email: '3tedutech@gmail.com',
        password: 'wrong_password_123',
      },
    });
    expect(res.status).toBe(401);
    console.log(`  ✅ Sai MK: Trả về 401 đúng`);
  });

  test('Đăng nhập email không tồn tại → 401', async () => {
    const res = await post('/auth/login', {
      body: {
        email: 'nonexistent@test.com',
        password: 'whatever123',
      },
    });
    expect(res.status).toBe(401);
    console.log(`  ✅ Email không tồn tại: Trả về 401 đúng`);
  });

  // ─── Truy cập cần xác thực mà không có token ───
  test('Truy cập protected route không có token → 401', async () => {
    const res = await get('/cart');
    expect(res.status).toBe(401);
    console.log(`  ✅ Protected route: 401 khi không có token`);
  });

  // ─── Đăng nhập Admin (dùng tài khoản có sẵn) ───
  test('Đăng nhập Admin (SA hoặc AD)', async () => {
    const adminCandidates = [
      { email: '3tedutech@gmail.com', password: 'sonthanh123' },
      { email: 'admin@3tedutech.com', password: 'Admin@12345678' },
      { email: 'sonthanh12345678910@gmail.com', password: 'Admin@12345678' },
    ];

    let found = false;
    for (const cand of adminCandidates) {
      const res = await post('/auth/login', { body: cand });
      if (res.status === 200 && res.data.accessToken) {
        const user = res.data.user;
        if (['AD', 'SA'].includes(user.role)) {
          state.adminToken = res.data.accessToken;
          state.adminAccountId = user.id;
          state.adminEmail = cand.email;
          state.adminPassword = cand.password;
          found = true;
          console.log(`  ✅ Admin đăng nhập: ${cand.email} (Role: ${user.role})`);
          break;
        }
      }
    }
    expect(found).toBe(true);
  });

  // ─── Đăng nhập Instructor (tìm instructor có sẵn) ───
  test('Đăng nhập Instructor (GV)', async () => {
    // Dùng admin token để tìm instructor có sẵn trong hệ thống
    // Hoặc thử đăng nhập bằng các tài khoản có thể
    const instructorCandidates = [
      { email: '3tedutech@gmail.com', password: 'sonthanh123' }, // SA cũng có quyền instructor
    ];

    let found = false;
    for (const cand of instructorCandidates) {
      const res = await post('/auth/login', { body: cand });
      if (res.status === 200 && res.data.accessToken) {
        const user = res.data.user;
        // SA có quyền làm mọi thứ instructor làm
        if (['GV', 'SA'].includes(user.role)) {
          state.instructorToken = res.data.accessToken;
          state.instructorAccountId = user.id;
          found = true;
          console.log(`  ✅ Instructor đăng nhập: ${cand.email} (Role: ${user.role})`);
          break;
        }
      }
    }

    if (!found) {
      console.log('  ⚠️ Không tìm được tài khoản Instructor. Dùng admin token thay thế.');
      if (state.adminToken) {
        state.instructorToken = state.adminToken;
        state.instructorAccountId = state.adminAccountId;
      }
    }
  });

  // ─── Đổi mật khẩu ───
  /* [SỬA 19/08/2026] Test cũ ở đây đổi mật khẩu của TÀI KHOẢN ADMIN THẬT rồi
     đổi ngược lại. Nếu lượt đổi ngược thất bại — mạng chớp, server restart,
     assertion ở giữa ném lỗi — thì tài khoản admin của bạn nằm lại với mật
     khẩu 'NewPass@123456' mà không ai biết. Trước buổi báo cáo, đó là rủi ro
     không đáng đánh đổi lấy một test.
     Phép thử tương đương nay nằm ở 01b-accounts, chạy trên tài khoản học viên
     do chính bộ test tạo ra. */
  test('Đổi mật khẩu không kèm token → 401', async () => {
    const res = await post('/auth/change-password', {
      body: { currentPassword: 'a', newPassword: 'b' },
    });
    expect(res.status).toBe(401);
    console.log('  ✅ Đổi MK không token: 401 đúng');
  });

  // ─── Phân quyền ───
  test('Student token (chưa verify) không dùng được → 401', async () => {
    const res = await get('/cart', { token: 'fake-invalid-token-12345' });
    expect(res.status).toBe(401);
    console.log(`  ✅ Fake token: 401 đúng`);
  });
});
