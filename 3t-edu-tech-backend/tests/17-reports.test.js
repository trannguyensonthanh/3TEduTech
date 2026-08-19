/**
 * 17-reports.test.js — Module báo cáo & thống kê
 * ═══════════════════════════════════════════════════════════════════════════
 * [THÊM 19/08/2026]
 *
 * Phủ đúng những mục bạn nêu trong đề tài:
 *   • Báo cáo theo điểm số của từng khóa học   → /admin/reports/quiz-scores
 *   • Phân tích hiệu quả khóa học              → /admin/reports/course-effectiveness
 *   • Thống kê số lượng học viên theo khóa học → /admin/reports/enrollment-stats
 *   • Bảng điều khiển giảng viên               → /instructors/me/analytics
 *
 * ── ĐIỀU ĐÁNG KIỂM NHẤT KHÔNG PHẢI "CÓ TRẢ 200 KHÔNG" ─────────────────────
 *
 * Mà là HÌNH DẠNG dữ liệu trả về có khớp với thứ giao diện đang đọc không.
 * Ngày 19/08 vừa rồi tìm ra `InstructorAnalyticsData` ở frontend thiếu hẳn ba
 * khối `quizStats`, `dropoutBottlenecks`, `sentiment` mà backend vẫn trả đều —
 * biểu đồ im lặng rơi về số liệu dự phòng ghi cứng trong mã nguồn, và không
 * ai biết mình đang nhìn số liệu giả. Các phép thử dưới đây khóa hợp đồng đó
 * lại: máy chủ đổi tên trường là test đỏ ngay.
 */

const { get, state, expectStatus } = require('./helpers/api');
const {
  ensureAdmin,
  ensureInstructor,
  ensureStudent,
} = require('./helpers/auth');

let adminToken;
let gvToken;
let hvToken;

beforeAll(async () => {
  adminToken = await ensureAdmin();
  gvToken = await ensureInstructor();
  hvToken = await ensureStudent();
});

describe('📊 BÁO CÁO GIẢNG VIÊN — /instructors/me/analytics', () => {
  test('Không đăng nhập → 401', async () => {
    const res = await get('/instructors/me/analytics');
    expect(res.status).toBe(401);
  });

  test('Học viên gọi báo cáo giảng viên → 403', async () => {
    const res = await get('/instructors/me/analytics', { token: hvToken });
    expect(res.status).toBe(403);
    console.log('  ✅ Học viên không xem được báo cáo giảng viên');
  });

  test('Giảng viên xem được, và trả ĐỦ các khối giao diện cần', async () => {
    const res = await get('/instructors/me/analytics', {
      token: gvToken,
      query: { period: 'monthly' },
    });
    expectStatus(res, 200, 'báo cáo giảng viên');
    const d = res.data;

    // --- Ba khối cũ ---
    expect(d.stats).toBeDefined();
    for (const k of ['totalRevenue', 'totalStudents', 'totalCourses', 'avgRating']) {
      expect(typeof d.stats[k]).toBe('number');
    }
    expect(Array.isArray(d.timeSeries)).toBe(true);
    expect(Array.isArray(d.coursePerformance)).toBe(true);

    // --- Ba khối mà frontend từng KHÔNG khai báo kiểu ---
    expect(d.quizStats).toBeDefined();
    expect(Array.isArray(d.quizStats.hardestQuestions)).toBe(true);
    expect(Array.isArray(d.dropoutBottlenecks)).toBe(true);
    expect(d.sentiment).toBeDefined();
    expect(Array.isArray(d.sentiment.stars)).toBe(true);
    expect(Array.isArray(d.sentiment.recentTopics)).toBe(true);

    console.log(
      `  ✅ Đủ 6 khối · ${d.timeSeries.length} mốc thời gian · ` +
        `${d.coursePerformance.length} khóa · ` +
        `${d.quizStats.hardestQuestions.length} câu hỏi khó`
    );
  });

  test('period=weekly cũng chạy được', async () => {
    const res = await get('/instructors/me/analytics', {
      token: gvToken,
      query: { period: 'weekly' },
    });
    expectStatus(res, 200, 'báo cáo giảng viên theo tuần');
    expect(res.data.stats).toBeDefined();
  });

  test('Bảng điều khiển giảng viên', async () => {
    const res = await get('/instructors/me/dashboard-overview', {
      token: gvToken,
    });
    expectStatus(res, 200, 'dashboard giảng viên');
    console.log(`  ✅ Dashboard: ${Object.keys(res.data).slice(0, 8).join(', ')}`);
  });

  test('Tổng quan tài chính giảng viên', async () => {
    const res = await get('/instructors/me/financial-overview', {
      token: gvToken,
    });
    expectStatus(res, 200, 'tài chính giảng viên');
  });
});

describe('📈 BÁO CÁO QUẢN TRỊ — /admin/reports/*', () => {
  const bangBaoCao = [
    ['/admin/dashboard/overview', 'Tổng quan hệ thống'],
    ['/admin/reports/quiz-scores', 'Điểm số theo khóa học'],
    ['/admin/reports/course-effectiveness', 'Hiệu quả khóa học'],
    ['/admin/reports/enrollment-stats', 'Số lượng học viên'],
  ];

  test.each(bangBaoCao)('%s — không token → 401', async (path) => {
    const res = await get(path);
    expect(res.status).toBe(401);
  });

  test.each(bangBaoCao)('%s — học viên → 403', async (path) => {
    const res = await get(path, { token: hvToken });
    expect(res.status).toBe(403);
  });

  test.each(bangBaoCao)('%s — giảng viên → 403', async (path) => {
    const res = await get(path, { token: gvToken });
    /* Giảng viên có báo cáo riêng của mình; báo cáo TOÀN hệ thống (doanh thu
       tổng, hiệu quả của khóa người khác) không thuộc quyền họ. */
    expect(res.status).toBe(403);
  });

  test.each(bangBaoCao)('%s — admin → 200', async (path, ten) => {
    const res = await get(path, { token: adminToken });
    expectStatus(res, 200, ten);
    expect(res.data).toBeTruthy();
    console.log(`  ✅ ${ten}: OK`);
  });

  test('Thống kê ghi danh có xu hướng và top khóa học', async () => {
    const res = await get('/admin/reports/enrollment-stats', {
      token: adminToken,
    });
    expectStatus(res, 200);
    expect(Array.isArray(res.data.trend)).toBe(true);
    expect(Array.isArray(res.data.topCoursesByEnrollment)).toBe(true);
    console.log(
      `  ✅ ${res.data.trend.length} mốc xu hướng · ` +
        `${res.data.topCoursesByEnrollment.length} khóa dẫn đầu`
    );
  });

  test('Báo cáo điểm số trả về mảng theo khóa học', async () => {
    const res = await get('/admin/reports/quiz-scores', { token: adminToken });
    expectStatus(res, 200);
    const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
    expect(Array.isArray(list)).toBe(true);
    console.log(`  ✅ ${list.length} khóa có dữ liệu điểm số`);
  });

  test('Hiệu quả khóa học trả về mảng', async () => {
    const res = await get('/admin/reports/course-effectiveness', {
      token: adminToken,
    });
    expectStatus(res, 200);
    const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
    expect(Array.isArray(list)).toBe(true);
    console.log(`  ✅ ${list.length} khóa trong báo cáo hiệu quả`);
  });
});

describe('👤 QUẢN LÝ NGƯỜI DÙNG — chỉ admin', () => {
  test('Học viên liệt kê toàn bộ người dùng → 403', async () => {
    const res = await get('/users', { token: hvToken, query: { limit: 5 } });
    expect(res.status).toBe(403);
  });

  test('Giảng viên liệt kê toàn bộ người dùng → 403', async () => {
    const res = await get('/users', { token: gvToken, query: { limit: 5 } });
    expect(res.status).toBe(403);
    console.log('  ✅ Danh sách người dùng chỉ admin xem được');
  });

  test('Admin liệt kê được, và lọc theo vai trò', async () => {
    const res = await get('/users', {
      token: adminToken,
      query: { role: 'GV', limit: 10 },
    });
    expectStatus(res, 200, 'liệt kê giảng viên');
    const list = res.data?.users || res.data?.results || [];
    expect(Array.isArray(list)).toBe(true);
    if (list.length) {
      /* Bộ lọc phải LỌC THẬT. Nếu backend bỏ qua tham số role thì danh sách
         "giảng viên" trong trang quản trị thực ra là toàn bộ người dùng. */
      const sai = list.filter((u) => (u.roleId ?? u.role ?? u.RoleID) !== 'GV');
      expect(sai.length).toBe(0);
    }
    console.log(`  ✅ Lọc role=GV: ${list.length} tài khoản, không lẫn vai trò khác`);
  });

  test('Học viên xem hồ sơ người khác qua /users/:id → 403', async () => {
    const res = await get(`/users/${state.instructorAccountId}`, {
      token: hvToken,
    });
    expect(res.status).toBe(403);
  });
});
