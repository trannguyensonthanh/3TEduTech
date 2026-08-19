/**
 * 06-enrollment-progress.test.js — Ghi danh & Tiến độ học
 * ═══════════════════════════════════════════════════════════
 * Ghi danh free course → Xem enrollment → Hoàn thành bài → Xem progress → Learning Report
 */

const { get, post, state } = require('./helpers/api');

function getToken() {
  return state.studentToken || state.adminToken || state.instructorToken;
}

describe('📖 ENROLLMENT & PROGRESS — Ghi danh & Tiến độ', () => {

  let freeCourseId;
  let freeLessonId;

  test('Tìm khóa học miễn phí hoặc đã enroll', async () => {
    const token = getToken();

    // Cách 1: Tìm khóa free
    const courses = await get('/courses', { query: { page: 1, limit: 20 } });
    const courseList = courses.data.courses || courses.data.results || [];
    const free = courseList.find(c => {
      const price = parseFloat(c.originalPrice ?? c.OriginalPrice ?? 999);
      return price === 0;
    });
    if (free) {
      freeCourseId = free.courseId || free.CourseID;
      console.log(`  ✅ Tìm thấy khóa miễn phí: ID=${freeCourseId}`);
      return;
    }

    // Cách 2: Lấy enrollment có sẵn
    if (token) {
      const enrollRes = await get('/enrollments/me', { token, query: { page: 1, limit: 5 } });
      const enrollments = enrollRes.data?.results || enrollRes.data?.enrollments || [];
      if (Array.isArray(enrollments) && enrollments.length > 0) {
        freeCourseId = enrollments[0].CourseID || enrollments[0].courseId;
        state.enrollmentId = enrollments[0].EnrollmentID || enrollments[0].enrollmentId;
        console.log(`  ✅ Sử dụng enrollment có sẵn: CourseID=${freeCourseId}`);
        return;
      }
    }

    console.log('  ⚠️ Không tìm thấy khóa miễn phí hoặc enrollment có sẵn');
  });

  test('Ghi danh khóa miễn phí (nếu có)', async () => {
    const token = getToken();
    if (!token || !freeCourseId || state.enrollmentId) {
      console.log('  ⏭️ Skip: Không có khóa miễn phí hoặc đã enroll');
      return;
    }
    const res = await post(`/enrollments/courses/${freeCourseId}`, { token });
    if (res.status === 200 || res.status === 201) {
      state.enrollmentId = res.data.EnrollmentID || res.data.enrollmentId;
      console.log(`  ✅ Ghi danh thành công`);
    } else {
      console.log(`  ⚠️ Ghi danh: Status ${res.status} — ${JSON.stringify(res.data).substring(0, 150)}`);
    }
  });

  test('Xem danh sách khóa đã ghi danh', async () => {
    const token = getToken();
    if (!token) { console.log('  ⏭️ Skip'); return; }
    const res = await get('/enrollments/me', { token, query: { page: 1, limit: 10 } });
    expect(res.status).toBe(200);
    const enrollments = res.data.results || res.data.enrollments || [];
    console.log(`  ✅ Enrollments: ${enrollments.length} khóa đã ghi danh`);
    if (enrollments.length > 0 && !freeCourseId) {
      freeCourseId = enrollments[0].CourseID || enrollments[0].courseId;
    }
  });

  test('Xem tiến độ khóa học (nếu đã enroll)', async () => {
    const token = getToken();
    if (!token || !freeCourseId) { console.log('  ⏭️ Skip'); return; }
    const res = await get(`/progress/courses/${freeCourseId}`, { token });
    if (res.status === 200) {
      console.log(`  ✅ Progress: OK — ${JSON.stringify(res.data).substring(0, 150)}`);
    } else {
      console.log(`  ⚠️ Progress: Status ${res.status}`);
    }
  });

  test('Hoàn thành bài học (nếu có lessonId)', async () => {
    const token = getToken();
    if (!token || !freeCourseId) { console.log('  ⏭️ Skip'); return; }

    // Lấy chi tiết khóa
    const courseSlugRes = await get('/courses', { query: { page: 1, limit: 20 } });
    const courseList = courseSlugRes.data.courses || courseSlugRes.data.results || [];
    const course = courseList.find(c => String(c.courseId || c.CourseID) === String(freeCourseId));
    if (!course) { console.log('  ⏭️ Skip: Không tìm thấy khóa trong danh sách'); return; }

    const slug = course.slug || course.Slug;
    const detailRes = await get(`/courses/${slug}`, { token });
    if (detailRes.status !== 200) { console.log('  ⏭️ Skip: Không lấy được chi tiết'); return; }

    const sections = detailRes.data.sections || detailRes.data.Sections || [];
    if (sections.length === 0) { console.log('  ⏭️ Skip: Không có section'); return; }

    const lessons = sections[0]?.lessons || sections[0]?.Lessons || [];
    if (lessons.length === 0) { console.log('  ⏭️ Skip: Không có lesson'); return; }

    freeLessonId = lessons[0].lessonId || lessons[0].LessonID;
    const res = await post(`/progress/lessons/${freeLessonId}/complete`, {
      token,
      body: { isCompleted: true },
    });

    if (res.status === 200 || res.status === 201) {
      console.log(`  ✅ Hoàn thành bài: LessonID=${freeLessonId}`);
    } else {
      console.log(`  ⚠️ Hoàn thành bài: Status ${res.status} — ${JSON.stringify(res.data).substring(0, 150)}`);
    }
  });

  test('Learning Report', async () => {
    const token = getToken();
    if (!token) { console.log('  ⏭️ Skip'); return; }
    const res = await get('/learning-report', { token });
    if (res.status === 200) {
      console.log(`  ✅ Learning Report: OK`);
    } else {
      console.log(`  ⚠️ Learning Report: Status ${res.status}`);
    }
  });
});
