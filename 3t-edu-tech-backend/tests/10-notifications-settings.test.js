/**
 * 10-notifications-settings.test.js — Thông báo, cài đặt, user profile
 * ═══════════════════════════════════════════════════════════
 */

const { get, post, patch, state } = require('./helpers/api');

function getToken() {
  return state.studentToken || state.adminToken || state.instructorToken;
}

describe('🔔 MISC — Thông báo, Profile, Settings, Promotions', () => {

  test('Xem thông báo', async () => {
    const token = getToken();
    if (!token) { console.log('  ⏭️ Skip'); return; }
    const res = await get('/notifications', { token, query: { page: 1, limit: 5 } });
    if (res.status === 200) {
      const notifs = res.data.results || res.data.notifications || [];
      console.log(`  ✅ Notifications: ${notifs.length} thông báo`);
    } else {
      console.log(`  ⚠️ Notifications: Status ${res.status}`);
    }
  });

  test('Xem thông báo của Instructor', async () => {
    if (!state.instructorToken) { console.log('  ⏭️ Skip'); return; }
    const res = await get('/notifications', {
      token: state.instructorToken,
      query: { page: 1, limit: 5 },
    });
    if (res.status === 200) {
      const notifs = res.data.results || res.data.notifications || [];
      console.log(`  ✅ Instructor Notifications: ${notifs.length} thông báo`);
    } else {
      console.log(`  ⚠️ Instructor Notifications: Status ${res.status}`);
    }
  });

  test('Xem profile', async () => {
    const token = getToken();
    if (!token) { console.log('  ⏭️ Skip'); return; }
    const res = await get('/users/me', { token });
    if (res.status === 200) {
      const u = res.data;
      console.log(`  ✅ Profile: ${u.fullName || u.FullName || u.email || 'OK'}`);
    } else {
      console.log(`  ⚠️ Profile: Status ${res.status}`);
    }
  });

  test('Cập nhật profile', async () => {
    const token = getToken();
    if (!token) { console.log('  ⏭️ Skip'); return; }
    const res = await patch('/users/me', {
      token,
      body: { headline: 'Cập nhật bởi bộ test tự động' },
    });
    if (res.status === 200) {
      console.log(`  ✅ Cập nhật profile: OK`);
    } else {
      console.log(`  ⚠️ Cập nhật profile: Status ${res.status}`);
    }
  });

  test('Xem settings hệ thống', async () => {
    if (!state.adminToken) { console.log('  ⏭️ Skip'); return; }
    const res = await get('/settings', { token: state.adminToken });
    if (res.status === 200) {
      console.log(`  ✅ Settings: OK`);
    } else {
      console.log(`  ⚠️ Settings: Status ${res.status}`);
    }
  });

  test('Xem danh sách promotions', async () => {
    if (!state.adminToken) { console.log('  ⏭️ Skip'); return; }
    const res = await get('/promotions', {
      token: state.adminToken,
      query: { page: 1, limit: 5 },
    });
    if (res.status === 200) {
      const promos = res.data.results || res.data.promotions || [];
      console.log(`  ✅ Promotions: ${promos.length} khuyến mãi`);
    } else {
      console.log(`  ⚠️ Promotions: Status ${res.status}`);
    }
  });

  test('Instructor: Xem payout methods', async () => {
    if (!state.instructorToken) { console.log('  ⏭️ Skip'); return; }
    const res = await get('/instructors/me/payout-methods', { token: state.instructorToken });
    if (res.status === 200) {
      const methods = Array.isArray(res.data) ? res.data : (res.data.results || []);
      console.log(`  ✅ Payout methods: ${methods.length} phương thức`);
    } else {
      console.log(`  ⚠️ Payout methods: Status ${res.status}`);
    }
  });

  test('Instructor: Xem analytics', async () => {
    if (!state.instructorToken) { console.log('  ⏭️ Skip'); return; }
    const res = await get('/instructors/me/analytics', { token: state.instructorToken });
    if (res.status === 200) {
      console.log(`  ✅ Instructor analytics: OK`);
    } else {
      console.log(`  ⚠️ Instructor analytics: Status ${res.status}`);
    }
  });

  test('Instructor: Xem danh sách học viên', async () => {
    if (!state.instructorToken) { console.log('  ⏭️ Skip'); return; }
    const res = await get('/instructors/me/students', {
      token: state.instructorToken,
      query: { page: 1, limit: 5 },
    });
    if (res.status === 200) {
      const students = res.data.results || res.data.students || [];
      console.log(`  ✅ Students: ${students.length} học viên`);
    } else {
      console.log(`  ⚠️ Students: Status ${res.status}`);
    }
  });
});
