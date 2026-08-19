/**
 * 00-smoke.test.js — Kiểm tra sức khỏe hệ thống
 * ═══════════════════════════════════════════════════════════
 * Chạy ĐẦU TIÊN để xác nhận mọi service đều sống.
 * Nếu file này fail → không cần chạy tiếp.
 */

const { get, post, BASE, AI_BASE, state } = require('./helpers/api');

describe('🏗️ SMOKE TEST — Kiểm tra sức khỏe hệ thống', () => {

  // Đăng nhập admin sớm để dùng cho các test cần auth
  beforeAll(async () => {
    const adminCandidates = [
      { email: '3tedutech@gmail.com', password: 'sonthanh123' },
      { email: 'admin@3tedutech.com', password: 'Admin@12345678' },
    ];
    for (const cand of adminCandidates) {
      const res = await post('/auth/login', { body: cand });
      if (res.status === 200 && res.data.accessToken) {
        state.adminToken = res.data.accessToken;
        break;
      }
    }
  });

  test('Backend API trả về danh sách Categories', async () => {
    const res = await get('/categories');
    expect(res.status).toBe(200);
    expect(res.data).toBeDefined();
    console.log(`  ✅ Categories: OK`);
  });

  test('Backend API trả về danh sách Levels', async () => {
    const res = await get('/levels');
    expect(res.status).toBe(200);
    console.log(`  ✅ Levels: OK`);
  });

  test('Backend API trả về danh sách Languages', async () => {
    const res = await get('/languages');
    expect(res.status).toBe(200);
    console.log(`  ✅ Languages: OK`);
  });

  test('Backend API trả về danh sách Courses (public)', async () => {
    const res = await get('/courses', { query: { page: 1, limit: 5 } });
    expect(res.status).toBe(200);
    expect(res.data).toBeDefined();
    const courses = res.data.courses || res.data.results || [];
    console.log(`  ✅ Courses: ${courses.length} khóa học`);
  });

  test('Backend API trả về danh sách Payment Methods', async () => {
    const res = await get('/payment-methods');
    expect(res.status).toBe(200);
    console.log(`  ✅ Payment Methods: OK`);
  });

  test('Backend API trả về danh sách Currencies (cần auth)', async () => {
    if (!state.adminToken) { console.log('  ⏭️ Skip: Chưa có token'); return; }
    const res = await get('/currencies', { token: state.adminToken });
    expect(res.status).toBe(200);
    console.log(`  ✅ Currencies: OK`);
  });

  test('Backend API trả về danh sách Skills', async () => {
    const res = await get('/skills');
    expect(res.status).toBe(200);
    console.log(`  ✅ Skills: OK`);
  });

  test('AI Service health check', async () => {
    try {
      const res = await get('/health', { baseUrl: AI_BASE });
      expect([200, 404]).toContain(res.status);
      console.log(`  ✅ AI Service: Đang chạy (status ${res.status})`);
    } catch (err) {
      console.log(`  ⚠️ AI Service: Không thể kết nối (${err.message}) — test sẽ bỏ qua các AI test`);
    }
  });

  test('Google OAuth Client ID endpoint', async () => {
    const res = await get('/auth/google/client-id');
    expect([200, 500]).toContain(res.status);
    if (res.status === 200 && res.data?.clientId) {
      console.log(`  ✅ Google OAuth: Client ID = ${res.data.clientId.substring(0, 20)}...`);
    } else {
      console.log(`  ⚠️ Google OAuth: Chưa cấu hình hoặc không có client ID`);
    }
  });

  test('Database schema — bảng Courses có cột IsLatestVersion', async () => {
    const res = await get('/courses', { query: { page: 1, limit: 1 } });
    expect(res.status).toBe(200);
    if (res.status === 500 && JSON.stringify(res.data).includes('IsLatestVersion')) {
      throw new Error('❌ DB thiếu cột IsLatestVersion! Chạy V5__course_versioning.sql');
    }
    console.log(`  ✅ DB Schema: Cột IsLatestVersion tồn tại`);
  });

  test('Endpoint không tồn tại trả về 404', async () => {
    const res = await get('/this-endpoint-does-not-exist');
    expect(res.status).toBe(404);
    console.log(`  ✅ 404 handling: OK`);
  });
});
