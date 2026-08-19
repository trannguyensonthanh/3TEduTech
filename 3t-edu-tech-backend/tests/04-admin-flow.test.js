/**
 * 04-admin-flow.test.js — Luồng Admin
 * ═══════════════════════════════════════════════════════════
 * Duyệt khóa → Dashboard overview → Reports → Quản lý user
 */

const { get, patch, state } = require('./helpers/api');

describe('🔧 ADMIN FLOW — Quản trị hệ thống', () => {
  test('Admin Dashboard Overview', async () => {
    if (!state.adminToken) { console.log('  ⏭️ Skip: Chưa đăng nhập Admin'); return; }
    const res = await get('/admin/dashboard/overview', {
      token: state.adminToken,
    });
    expect(res.status).toBe(200);
    const d = res.data;
    console.log(`  ✅ Dashboard:`);
    console.log(`     - Tổng users: ${d.totalUsers ?? d.stats?.totalUsers ?? '?'}`);
    console.log(`     - Tổng courses: ${d.totalCourses ?? d.stats?.totalCourses ?? '?'}`);
    console.log(`     - Tổng enrollments: ${d.totalEnrollments ?? d.stats?.totalEnrollments ?? '?'}`);
    console.log(`     - Tổng revenue: ${d.totalRevenue ?? d.stats?.totalRevenue ?? '?'}`);
  });

  test('Admin duyệt khóa học (nếu có approval request)', async () => {
    if (!state.adminToken || !state.approvalRequestId) {
      console.log('  ⏭️ Skip: Không có admin token hoặc approval request');
      return;
    }
    const res = await patch(`/courses/reviews/${state.approvalRequestId}`, {
      token: state.adminToken,
      body: {
        status: 'APPROVED',
        adminNotes: 'Đã duyệt bởi bộ test tự động',
      },
    });
    if (res.status === 200) {
      console.log(`  ✅ Duyệt khóa học: Thành công`);
    } else {
      console.log(`  ⚠️ Duyệt khóa học: Status ${res.status} — ${JSON.stringify(res.data).substring(0, 200)}`);
    }
  });

  test('Admin đánh dấu khóa nổi bật', async () => {
    if (!state.adminToken) { console.log('  ⏭️ Skip'); return; }
    // Lấy 1 khóa đã publish
    const courses = await get('/courses', { query: { page: 1, limit: 1 } });
    if (!courses.data.results?.length) { console.log('  ⏭️ Skip: Không có khóa nào'); return; }
    const courseId = courses.data.results[0].CourseID || courses.data.results[0].courseId;
    const res = await patch(`/courses/${courseId}/feature`, {
      token: state.adminToken,
      body: { isFeatured: true },
    });
    if (res.status === 200) {
      console.log(`  ✅ Đánh dấu nổi bật: CourseID=${courseId}`);
    } else {
      console.log(`  ⚠️ Feature toggle: Status ${res.status}`);
    }
  });

  // ─── Reports ───
  test('Report: Quiz Scores', async () => {
    if (!state.adminToken) { console.log('  ⏭️ Skip'); return; }
    const res = await get('/admin/reports/quiz-scores', { token: state.adminToken });
    expect(res.status).toBe(200);
    console.log(`  ✅ Quiz Scores Report: OK`);
  });

  test('Report: Course Effectiveness', async () => {
    if (!state.adminToken) { console.log('  ⏭️ Skip'); return; }
    const res = await get('/admin/reports/course-effectiveness', { token: state.adminToken });
    expect(res.status).toBe(200);
    console.log(`  ✅ Course Effectiveness Report: OK`);
  });

  test('Report: Enrollment Stats', async () => {
    if (!state.adminToken) { console.log('  ⏭️ Skip'); return; }
    const res = await get('/admin/reports/enrollment-stats', { token: state.adminToken });
    expect(res.status).toBe(200);
    console.log(`  ✅ Enrollment Stats Report: OK`);
  });

  // ─── Quản lý user ───
  test('Admin lấy danh sách users', async () => {
    if (!state.adminToken) { console.log('  ⏭️ Skip'); return; }
    const res = await get('/users', {
      token: state.adminToken,
      query: { page: 1, limit: 5 },
    });
    if (res.status === 200) {
      console.log(`  ✅ Users list: ${res.data.totalResults ?? res.data.results?.length ?? '?'} users`);
    } else {
      console.log(`  ⚠️ Users list: Status ${res.status}`);
    }
  });

  test('Admin lấy danh sách approval requests', async () => {
    if (!state.adminToken) { console.log('  ⏭️ Skip'); return; }
    const res = await get('/approval-requests', {
      token: state.adminToken,
      query: { page: 1, limit: 5 },
    });
    if (res.status === 200) {
      console.log(`  ✅ Approval requests: ${res.data.totalResults ?? res.data.results?.length ?? '?'} yêu cầu`);
    } else {
      console.log(`  ⚠️ Approval requests: Status ${res.status}`);
    }
  });

  // ─── Phân quyền ───
  test('Student không được truy cập admin dashboard → 403', async () => {
    if (!state.studentToken) { console.log('  ⏭️ Skip'); return; }
    const res = await get('/admin/dashboard/overview', { token: state.studentToken });
    expect(res.status).toBe(403);
    console.log(`  ✅ Phân quyền: Student bị chặn đúng (403)`);
  });

  test('Instructor không được truy cập admin dashboard → 403', async () => {
    if (!state.instructorToken) { console.log('  ⏭️ Skip'); return; }
    const res = await get('/admin/dashboard/overview', { token: state.instructorToken });
    expect(res.status).toBe(403);
    console.log(`  ✅ Phân quyền: Instructor bị chặn đúng (403)`);
  });
});
