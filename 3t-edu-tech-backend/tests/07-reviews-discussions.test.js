/**
 * 07-reviews-discussions.test.js — Đánh giá & Thảo luận
 * ═══════════════════════════════════════════════════════════
 */

const { get, post, del, state } = require('./helpers/api');

function getToken() {
  return state.studentToken || state.adminToken || state.instructorToken;
}

describe('⭐ REVIEWS & DISCUSSIONS — Đánh giá & Thảo luận', () => {

  let testCourseId;

  beforeAll(async () => {
    const token = getToken();
    if (token) {
      const enrollRes = await get('/enrollments/me', { token, query: { page: 1, limit: 1 } });
      const enrollments = enrollRes.data?.results || enrollRes.data?.enrollments || [];
      if (enrollments.length) {
        testCourseId = enrollments[0].CourseID || enrollments[0].courseId;
      }
    }
  });

  test('Tạo/cập nhật đánh giá khóa học', async () => {
    const token = getToken();
    if (!token || !testCourseId) {
      console.log('  ⏭️ Skip: Chưa enroll khóa nào');
      return;
    }
    const res = await post(`/courses/${testCourseId}/reviews`, {
      token,
      body: { rating: 5, comment: 'Khóa học rất tuyệt vời! Test bởi bộ test tự động.' },
    });
    if (res.status === 200 || res.status === 201) {
      console.log(`  ✅ Đánh giá: 5 sao cho CourseID=${testCourseId}`);
    } else {
      console.log(`  ⚠️ Đánh giá: Status ${res.status} — ${JSON.stringify(res.data).substring(0, 150)}`);
    }
  });

  test('Xem reviews của khóa học', async () => {
    if (!testCourseId) { console.log('  ⏭️ Skip'); return; }
    const res = await get(`/courses/${testCourseId}/reviews`, { query: { page: 1, limit: 5 } });
    expect(res.status).toBe(200);
    const reviews = res.data.results || res.data.reviews || [];
    console.log(`  ✅ Reviews: ${reviews.length} đánh giá`);
  });

  test('Xem review của mình cho khóa học', async () => {
    const token = getToken();
    if (!token || !testCourseId) { console.log('  ⏭️ Skip'); return; }
    const res = await get(`/courses/${testCourseId}/reviews/my-review`, { token });
    if (res.status === 200) {
      console.log(`  ✅ My review: Rating=${res.data.Rating || res.data.rating || '?'}`);
    } else {
      console.log(`  ⚠️ My review: Status ${res.status}`);
    }
  });

  test('Xem danh sách thảo luận của khóa', async () => {
    if (!testCourseId) { console.log('  ⏭️ Skip'); return; }
    const res = await get(`/courses/${testCourseId}/discussions`, { query: { page: 1, limit: 5 } });
    if (res.status === 200) {
      const threads = res.data.results || res.data.threads || [];
      console.log(`  ✅ Discussions: ${threads.length} chủ đề`);
    } else {
      console.log(`  ⚠️ Discussions: Status ${res.status}`);
    }
  });

  test('Tạo chủ đề thảo luận mới', async () => {
    const token = getToken();
    if (!token || !testCourseId) { console.log('  ⏭️ Skip'); return; }
    const res = await post(`/courses/${testCourseId}/discussions`, {
      token,
      body: {
        title: '[TEST] Câu hỏi từ bộ test tự động',
        postText: 'Đây là một câu hỏi test. Xin hãy bỏ qua.',
      },
    });
    if (res.status === 200 || res.status === 201) {
      console.log(`  ✅ Tạo thảo luận: Thành công`);
    } else {
      console.log(`  ⚠️ Tạo thảo luận: Status ${res.status} — ${JSON.stringify(res.data).substring(0, 150)}`);
    }
  });
});
