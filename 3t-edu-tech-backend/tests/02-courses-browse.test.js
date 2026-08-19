/**
 * 02-courses-browse.test.js — Test duyệt khóa học public
 * ═══════════════════════════════════════════════════════════
 * Xem danh sách, lọc, phân trang, xem chi tiết, course statuses
 *
 * Response format: { courses: [...], totalResults, page, limit }
 */

const { get, state } = require('./helpers/api');

/** Helper: lấy mảng courses từ response (hỗ trợ cả `courses` và `results`) */
function getCourses(data) {
  return data.courses || data.results || [];
}

describe('📚 COURSES BROWSE — Duyệt khóa học', () => {
  let firstCourseSlug;

  test('Lấy danh sách khóa học (trang 1)', async () => {
    const res = await get('/courses', { query: { page: 1, limit: 5 } });
    expect(res.status).toBe(200);
    const courses = getCourses(res.data);
    expect(Array.isArray(courses)).toBe(true);
    if (courses.length > 0) {
      firstCourseSlug = courses[0].slug || courses[0].Slug;
    }
    console.log(`  ✅ Danh sách: ${courses.length} khóa học`);
  });

  test('Lấy khóa học với sortBy=studentCount_desc', async () => {
    const res = await get('/courses', {
      query: { page: 1, limit: 5, sortBy: 'studentCount_desc', userPage: true },
    });
    expect(res.status).toBe(200);
    console.log(`  ✅ Sort by student count: OK (${getCourses(res.data).length} kết quả)`);
  });

  test('Lấy khóa học với sortBy=createdAt_desc', async () => {
    const res = await get('/courses', {
      query: { page: 1, limit: 5, sortBy: 'createdAt_desc' },
    });
    expect(res.status).toBe(200);
    console.log(`  ✅ Sort by newest: OK`);
  });

  test('Lấy khóa học với sortBy=rating_desc', async () => {
    const res = await get('/courses', {
      query: { page: 1, limit: 5, sortBy: 'rating_desc' },
    });
    expect(res.status).toBe(200);
    console.log(`  ✅ Sort by rating: OK`);
  });

  test('Phân trang — trang 2', async () => {
    const res = await get('/courses', { query: { page: 2, limit: 3 } });
    expect(res.status).toBe(200);
    console.log(`  ✅ Trang 2: ${getCourses(res.data).length} kết quả`);
  });

  test('Tìm kiếm khóa học theo keyword', async () => {
    const res = await get('/courses', {
      query: { page: 1, limit: 5, search: 'python' },
    });
    expect(res.status).toBe(200);
    console.log(`  ✅ Search "python": ${getCourses(res.data).length} kết quả`);
  });

  test('Lọc khóa học theo categoryId', async () => {
    const catRes = await get('/categories');
    const cats = catRes.data.results || catRes.data.categories || catRes.data || [];
    const catList = Array.isArray(cats) ? cats : [];
    if (catList.length === 0) {
      console.log(`  ⏭️ Skip: Không có category nào`);
      return;
    }
    const catId = catList[0].CategoryID || catList[0].categoryId || catList[0].id;
    const res = await get('/courses', {
      query: { page: 1, limit: 5, categoryId: catId },
    });
    expect(res.status).toBe(200);
    console.log(`  ✅ Filter by category ${catId}: ${getCourses(res.data).length} kết quả`);
  });

  test('Xem chi tiết khóa học bằng slug', async () => {
    if (!firstCourseSlug) {
      console.log('  ⏭️ Skip: Không có khóa học nào để xem chi tiết');
      return;
    }
    const res = await get(`/courses/${firstCourseSlug}`);
    expect(res.status).toBe(200);
    const course = res.data;
    const name = course.courseName || course.CourseName;
    const id = course.courseId || course.CourseID;
    console.log(`  ✅ Chi tiết: "${name}" (ID: ${id})`);
    if (!state.cartCourseId) {
      state.cartCourseId = id;
    }
  });

  test('Xem chi tiết slug không tồn tại → 404', async () => {
    const res = await get('/courses/this-slug-definitely-does-not-exist-xyz');
    expect(res.status).toBe(404);
    console.log(`  ✅ Slug không tồn tại: 404 đúng`);
  });

  test('Lấy danh sách trạng thái khóa học', async () => {
    const res = await get('/courses/course-statuses/statuses');
    expect(res.status).toBe(200);
    console.log(`  ✅ Course statuses: OK`);
  });

  test('Lấy danh sách giảng viên (public)', async () => {
    const res = await get('/instructors');
    expect(res.status).toBe(200);
    console.log(`  ✅ Instructors: OK`);
  });
});
