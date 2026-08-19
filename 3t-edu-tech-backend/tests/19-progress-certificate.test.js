/**
 * 19-progress-certificate.test.js — Tiến độ học & chứng nhận
 * ═══════════════════════════════════════════════════════════════════════════
 * [THÊM 19/08/2026]
 *
 * Chứng nhận là thứ đi ra ngoài hệ thống: học viên đưa nó cho nhà tuyển dụng.
 * Nên hai câu hỏi quan trọng hơn "cấp được hay không" là:
 *
 *   1. Có cấp NHẦM cho người chưa học xong không?
 *   2. Có ai GIẢ được một mã chứng nhận không?
 *
 * Cả hai đều được thử ở đây, cùng với các đường biên của tiến độ học:
 * bài học không tồn tại, khóa chưa ghi danh, vị trí xem âm, tiến độ của
 * người khác.
 */

const { get, post, patch, state, expectStatus, why } = require('./helpers/api');
const {
  ensureAdmin,
  ensureInstructor,
  ensureStudent,
  ensureStudent2,
} = require('./helpers/auth');

let adminToken;
let gvToken;
let hvToken;
let hv2Token;

beforeAll(async () => {
  adminToken = await ensureAdmin();
  gvToken = await ensureInstructor();
  hvToken = await ensureStudent();
  hv2Token = await ensureStudent2();
});

describe('📈 TIẾN ĐỘ HỌC — đường biên', () => {
  test('Không token → 401', async () => {
    const res = await post('/progress/lessons/1/complete', { body: {} });
    expect(res.status).toBe(401);
  });

  test('Đánh dấu hoàn thành bài KHÔNG TỒN TẠI → 404, không phải 500', async () => {
    const res = await post('/progress/lessons/999999999/complete', {
      token: hvToken,
      body: {},
    });
    expect([400, 403, 404]).toContain(res.status);
    console.log(`  ✅ Bài không tồn tại: ${res.status}`);
  });

  test('lessonId không phải số → 400', async () => {
    const res = await post('/progress/lessons/abc/complete', {
      token: hvToken,
      body: {},
    });
    expect([400, 404]).toContain(res.status);
  });

  test('Đánh dấu hoàn thành bài của khóa CHƯA GHI DANH → bị chặn', async () => {
    if (!state.qaLessonId) {
      console.log('  ⏭️ Chưa có lessonId từ tệp 14');
      return;
    }
    const res = await post(`/progress/lessons/${state.qaLessonId}/complete`, {
      token: hv2Token,
      body: {},
    });
    /* Nếu cho qua, học viên chưa mua vẫn "học xong" được khóa học và tiến tới
       xin chứng nhận. */
    expect([400, 403, 404]).toContain(res.status);
    console.log(`  ✅ Chưa ghi danh không ghi được tiến độ (${res.status})`);
  });

  test('Vị trí xem ÂM → 400', async () => {
    if (!state.qaLessonId) return;
    const res = await patch(`/progress/lessons/${state.qaLessonId}/position`, {
      token: hvToken,
      body: { position: -100 },
    });
    expect([400, 403, 404]).toContain(res.status);
    console.log(`  ✅ Vị trí âm bị chặn (${res.status})`);
  });

  test('Vị trí xem KHỔNG LỒ (lớn hơn độ dài video) → không được 500', async () => {
    if (!state.qaLessonId) return;
    const res = await patch(`/progress/lessons/${state.qaLessonId}/position`, {
      token: hvToken,
      body: { position: 999999999 },
    });
    /* Không nhất thiết phải chặn — nhưng tuyệt đối không được nổ 500. */
    expect(res.status).not.toBe(500);
    console.log(`  ✅ Vị trí khổng lồ: ${res.status} (không nổ 500)`);
  });

  test('Xem tiến độ khóa CHƯA GHI DANH → không lộ dữ liệu', async () => {
    if (!state.qaCourseId) return;
    const res = await get(`/progress/courses/${state.qaCourseId}`, {
      token: hv2Token,
    });
    expect([200, 403, 404]).toContain(res.status);
    if (res.status === 200) {
      /* Trả 200 vẫn chấp nhận được NẾU nội dung rỗng — nghĩa là "bạn chưa học
         gì". Cái không chấp nhận được là trả về tiến độ của người khác. */
      const done = res.data?.completedLessons ?? 0;
      expect(Number(done)).toBe(0);
    }
    console.log(`  ✅ Tiến độ khóa chưa ghi danh: ${res.status}`);
  });
});

describe('🏆 CHỨNG NHẬN — cấp đúng người, đúng lúc', () => {
  test('Không token → 401', async () => {
    const res = await get('/certificates/eligibility/1');
    expect(res.status).toBe(401);
  });

  test('Xin cấp chứng nhận khi CHƯA HỌC XONG → bị từ chối', async () => {
    if (!state.qaCourseId) {
      console.log('  ⏭️ Chưa có courseId từ tệp 14');
      return;
    }
    const res = await post(`/certificates/issue/${state.qaCourseId}`, {
      token: hv2Token,
      body: {},
    });
    /* Đây là phép thử quan trọng nhất của cả tệp. Một hệ thống cấp chứng nhận
       cho người chưa học thì tấm chứng nhận đó vô giá trị. */
    expect(res.status).not.toBe(200);
    expect(res.status).not.toBe(201);
    console.log(`  ✅ Chưa học xong thì không có chứng nhận (${res.status})`);
  });

  test('Kiểm tra điều kiện cấp cho khóa chưa ghi danh', async () => {
    if (!state.qaCourseId) return;
    const res = await get(`/certificates/eligibility/${state.qaCourseId}`, {
      token: hv2Token,
    });
    expect([200, 403, 404]).toContain(res.status);
    if (res.status === 200) {
      const duDieuKien = res.data?.eligible ?? res.data?.isEligible;
      expect(duDieuKien).not.toBe(true);
    }
    console.log(`  ✅ Điều kiện cấp: ${res.status}`);
  });

  test('Xác minh mã chứng nhận BỊA → 404, và KHÔNG lộ thông tin nội bộ', async () => {
    const res = await get('/certificates/verify/MA-BIA-KHONG-CO-THAT-999');
    expect([400, 404]).toContain(res.status);

    /* Trang xác minh là endpoint CÔNG KHAI — ai cũng gọi được. Thông báo lỗi
       của nó tuyệt đối không được kèm stack trace hay tên bảng CSDL. */
    const body = JSON.stringify(res.data || {});
    expect(body).not.toMatch(/at Object\.|\/app\/src\//);
    expect(body.toLowerCase()).not.toMatch(/select |from certificates/);
    console.log(`  ✅ Mã bịa: ${res.status}, không rò rỉ nội bộ`);
  });

  test('Xác minh mã chứng nhận là CÔNG KHAI (không cần đăng nhập)', async () => {
    const res = await get('/certificates/verify/BAT-KY');
    /* Nhà tuyển dụng kiểm tra chứng nhận sẽ không có tài khoản. Nếu endpoint
       này đòi token thì tính năng xác minh vô dụng. */
    expect(res.status).not.toBe(401);
    console.log(`  ✅ Endpoint xác minh không đòi đăng nhập (${res.status})`);
  });

  test('Chuỗi mã chứng nhận có ký tự lạ → không nổ 500', async () => {
    for (const ma of [
      "'; DROP TABLE Certificates;--",
      '<script>alert(1)</script>',
      '../../etc/passwd',
      'A'.repeat(500),
    ]) {
      const res = await get(`/certificates/verify/${encodeURIComponent(ma)}`);
      expect(res.status).not.toBe(500);
    }
    console.log('  ✅ 4 chuỗi độc hại: không chuỗi nào làm nổ 500');
  });

  test('Học viên KHÔNG thu hồi được chứng nhận (chỉ admin)', async () => {
    const res = await post('/certificates/BAT-KY/revoke', {
      token: hvToken,
      body: { reason: 'thử quyền' },
    });
    expect([403, 404]).toContain(res.status);
    console.log(`  ✅ Thu hồi chứng nhận chỉ dành cho admin (${res.status})`);
  });
});

describe('📝 TRẮC NGHIỆM — đường biên', () => {
  test('Bắt đầu làm bài của bài học không tồn tại → không 500', async () => {
    const res = await post('/quizzes/lessons/999999999/start', {
      token: hvToken,
      body: {},
    });
    expect(res.status).not.toBe(500);
    expect([400, 403, 404]).toContain(res.status);
  });

  test('Nộp bài với attemptId không tồn tại → không 500', async () => {
    const res = await post('/quizzes/attempts/999999999/submit', {
      token: hvToken,
      body: { answers: [] },
    });
    expect(res.status).not.toBe(500);
  });

  test('Xem kết quả bài làm của NGƯỜI KHÁC → bị chặn', async () => {
    const res = await get('/quizzes/attempts/1/result', { token: hv2Token });
    /* Nếu attempt #1 tồn tại và thuộc về người khác, 200 ở đây là rò rỉ điểm
       số. 403/404 đều đúng. */
    expect([400, 403, 404]).toContain(res.status);
    console.log(`  ✅ Kết quả bài làm không xem chéo được (${res.status})`);
  });
});
