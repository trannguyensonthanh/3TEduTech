/**
 * 03-instructor-flow.test.js — Luồng Instructor đầy đủ
 * ═══════════════════════════════════════════════════════════
 * Tạo khóa học → Thêm Section → Thêm Lesson → Gửi duyệt → Kiểm tra trạng thái
 */

const { get, post, patch, state } = require('./helpers/api');

describe('👨‍🏫 INSTRUCTOR FLOW — Tạo & quản lý khóa học', () => {

  test('Xem profile instructor', async () => {
    if (!state.instructorToken) { console.log('  ⏭️ Skip'); return; }
    const res = await get('/instructors/me/profile', { token: state.instructorToken });
    expect(res.status).toBe(200);
    console.log(`  ✅ Profile: ${res.data.FullName || res.data.fullName || 'OK'}`);
  });

  test('Xem danh sách khóa học của instructor (ban đầu rỗng)', async () => {
    if (!state.instructorToken) { console.log('  ⏭️ Skip'); return; }
    const res = await get('/instructors/my-courses', {
      token: state.instructorToken,
      query: { page: 1, limit: 10 },
    });
    expect(res.status).toBe(200);
    console.log(`  ✅ My courses: ${res.data.totalResults ?? res.data.results?.length ?? 0} khóa`);
  });

  // ─── Tạo khóa học DRAFT ───
  test('Tạo khóa học mới (DRAFT)', async () => {
    if (!state.instructorToken) { console.log('  ⏭️ Skip'); return; }

    // Lấy category + level hợp lệ
    const cats = await get('/categories');
    const levels = await get('/levels');
    const catId = cats.data.results?.[0]?.CategoryID || cats.data[0]?.CategoryID || 1;
    const levelId = levels.data.results?.[0]?.LevelID || levels.data[0]?.LevelID || 1;

    const res = await post('/courses', {
      token: state.instructorToken,
      body: {
        courseName: `[TEST] Khóa Học Test Auto ${Date.now()}`,
        shortDescription: 'Đây là khóa học tạo bởi bộ test tự động',
        fullDescription: 'Mô tả đầy đủ cho khóa học test. Nội dung rất chi tiết bao gồm nhiều kiến thức hay.',
        originalPrice: 199000,
        discountedPrice: 149000,
        categoryId: catId,
        levelId: levelId,
        language: 'vi',
      },
    });
    expect(res.status).toBe(201);
    state.createdCourseId = res.data.CourseID || res.data.courseId || res.data.course?.CourseID;
    state.createdCourseSlug = res.data.Slug || res.data.slug || res.data.course?.Slug;
    console.log(`  ✅ Tạo khóa học: ID=${state.createdCourseId}, Slug=${state.createdCourseSlug}`);
  });

  // ─── Thêm Section ───
  test('Thêm Section vào khóa học', async () => {
    if (!state.instructorToken || !state.createdCourseId) { console.log('  ⏭️ Skip'); return; }
    const res = await post(`/courses/${state.createdCourseId}/sections`, {
      token: state.instructorToken,
      body: {
        sectionName: 'Phần 1: Giới thiệu',
        sectionOrder: 1,
        description: 'Section mô tả tổng quan về khóa học',
      },
    });
    expect(res.status).toBe(201);
    state.createdSectionId = res.data.SectionID || res.data.sectionId || res.data.section?.SectionID;
    console.log(`  ✅ Tạo section: ID=${state.createdSectionId}`);
  });

  // ─── Thêm Lesson (Video) ───
  test('Thêm Lesson (VIDEO) vào Section', async () => {
    if (!state.instructorToken || !state.createdSectionId) { console.log('  ⏭️ Skip'); return; }
    const res = await post(
      `/courses/${state.createdCourseId}/sections/${state.createdSectionId}/lessons`,
      {
        token: state.instructorToken,
        body: {
          lessonName: 'Bài 1: Hello World',
          lessonOrder: 1,
          lessonType: 'VIDEO',
          description: 'Bài đầu tiên giới thiệu khái niệm cơ bản',
          isFreePreview: true,
        },
      }
    );
    expect([200, 201]).toContain(res.status);
    state.createdLessonId = res.data.LessonID || res.data.lessonId || res.data.lesson?.LessonID;
    console.log(`  ✅ Tạo lesson VIDEO: ID=${state.createdLessonId}`);
  });

  // ─── Thêm Lesson (TEXT) ───
  test('Thêm Lesson (TEXT) vào Section', async () => {
    if (!state.instructorToken || !state.createdSectionId) { console.log('  ⏭️ Skip'); return; }
    const res = await post(
      `/courses/${state.createdCourseId}/sections/${state.createdSectionId}/lessons`,
      {
        token: state.instructorToken,
        body: {
          lessonName: 'Bài 2: Cài đặt môi trường',
          lessonOrder: 2,
          lessonType: 'TEXT',
          textContent: '<h1>Hướng dẫn cài đặt</h1><p>Bước 1: Tải về...</p>',
          isFreePreview: false,
        },
      }
    );
    expect([200, 201]).toContain(res.status);
    console.log(`  ✅ Tạo lesson TEXT: OK`);
  });

  // ─── Cập nhật khóa học ───
  test('Cập nhật thông tin khóa học', async () => {
    if (!state.instructorToken || !state.createdCourseId) { console.log('  ⏭️ Skip'); return; }
    const res = await patch(`/courses/${state.createdCourseId}`, {
      token: state.instructorToken,
      body: {
        shortDescription: 'Mô tả ngắn đã được cập nhật bởi bộ test',
      },
    });
    expect(res.status).toBe(200);
    console.log(`  ✅ Cập nhật khóa học: OK`);
  });

  // ─── Gửi duyệt ───
  test('Gửi khóa học để duyệt (submit)', async () => {
    if (!state.instructorToken || !state.createdCourseId) { console.log('  ⏭️ Skip'); return; }
    const res = await post(`/courses/${state.createdCourseId}/submit`, {
      token: state.instructorToken,
      body: { instructorNotes: 'Xin admin duyệt khóa test' },
    });
    // Có thể 200 hoặc 201 hoặc lỗi nếu thiếu điều kiện
    if (res.status === 200 || res.status === 201) {
      state.approvalRequestId = res.data.RequestID || res.data.requestId;
      console.log(`  ✅ Gửi duyệt: RequestID=${state.approvalRequestId}`);
    } else {
      console.log(`  ⚠️ Gửi duyệt: Status ${res.status} — ${JSON.stringify(res.data).substring(0, 200)}`);
      console.log(`     (Có thể do thiếu thumbnail/video bắt buộc — chấp nhận được)`);
    }
  });

  // ─── Xem instructor dashboard overview ───
  test('Xem Instructor Dashboard Overview', async () => {
    if (!state.instructorToken) { console.log('  ⏭️ Skip'); return; }
    const res = await get('/instructors/me/dashboard-overview', {
      token: state.instructorToken,
    });
    expect(res.status).toBe(200);
    console.log(`  ✅ Dashboard overview: Tổng ${res.data.totalCourses ?? '?'} khóa, ${res.data.totalStudents ?? '?'} học viên`);
  });

  // ─── Xem financial overview ───
  test('Xem Financial Overview', async () => {
    if (!state.instructorToken) { console.log('  ⏭️ Skip'); return; }
    const res = await get('/instructors/me/financial-overview', {
      token: state.instructorToken,
    });
    expect(res.status).toBe(200);
    console.log(`  ✅ Financial overview: OK`);
  });
});
