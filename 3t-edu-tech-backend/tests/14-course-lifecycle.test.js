/**
 * 14-course-lifecycle.test.js — Vòng đời khóa học, có kiểm soát quyền
 * ═══════════════════════════════════════════════════════════════════════════
 * [THÊM 19/08/2026]
 *
 * Giảng viên tạo → thêm chương/bài → gửi duyệt → admin duyệt → xuất bản →
 * tạo phiên bản cập nhật → hủy cập nhật.
 *
 * ── KHÁC GÌ TỆP 03 CŨ ─────────────────────────────────────────────────────
 *
 * Tệp 03 chạy bằng token admin (vì state không đi được giữa các tệp, nó rơi
 * về `state.adminToken`). Ở đây MỖI THAO TÁC dùng ĐÚNG vai trò của nó, và
 * xen giữa là các phép thử ngược: học viên gọi cùng endpoint đó thì phải bị
 * từ chối. Một API chỉ được coi là đúng khi nó vừa CHO người có quyền làm,
 * vừa CHẶN người không có quyền.
 */

const {
  get,
  post,
  patch,
  del,
  state,
  why,
  expectStatus,
} = require('./helpers/api');
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

describe('📚 COURSE LIFECYCLE — Tạo, duyệt, xuất bản', () => {
  test('Lấy được ít nhất một danh mục để gắn khóa học', async () => {
    const res = await get('/categories', { query: { limit: 5 } });
    expect(res.status).toBe(200);
    const list = res.data?.categories || res.data?.results || res.data || [];
    expect(Array.isArray(list) ? list.length : 0).toBeGreaterThan(0);
    state.qaCategoryId = list[0].categoryId ?? list[0].CategoryID ?? list[0].id;
    expect(state.qaCategoryId).toBeTruthy();
    console.log(`  ✅ Dùng categoryId=${state.qaCategoryId}`);
  });

  test('HỌC VIÊN tạo khóa học → phải bị từ chối 403', async () => {
    const res = await post('/courses', {
      token: hvToken,
      body: {
        courseName: 'Khóa học viên không được tạo',
        categoryId: state.qaCategoryId,
        language: 'vi',
      },
    });
    expect(res.status).toBe(403);
    console.log('  ✅ Học viên bị chặn tạo khóa học (403)');
  });

  test('Không có token → 401', async () => {
    const res = await post('/courses', {
      body: {
        courseName: 'X',
        categoryId: state.qaCategoryId,
        language: 'vi',
      },
    });
    expect(res.status).toBe(401);
  });

  test('Thiếu trường bắt buộc → 400, KHÔNG phải 500', async () => {
    const res = await post('/courses', {
      token: gvToken,
      body: { courseName: 'Thiếu categoryId' },
    });
    /* 400 chứ không phải 500: dữ liệu sai của người dùng phải bị chặn ở lớp
       kiểm tra đầu vào, không được rơi xuống tận CSDL rồi ném lỗi ra ngoài. */
    expect(res.status).toBe(400);
    console.log('  ✅ Thiếu trường: 400 (validation chặn đúng chỗ)');
  });

  test('GIẢNG VIÊN tạo khóa học → 201', async () => {
    const ten = `QA Khoa hoc tu dong ${Date.now()}`;
    state.qaCourseName = ten;
    const res = await post('/courses', {
      token: gvToken,
      body: {
        courseName: ten,
        categoryId: state.qaCategoryId,
        language: 'vi',
      },
    });
    expectStatus(res, 201, 'tạo khóa học');

    const c = res.data?.course || res.data;
    state.qaCourseId = c.courseId ?? c.CourseID;
    state.qaCourseSlug = c.slug ?? c.Slug;
    expect(state.qaCourseId).toBeTruthy();
    expect(state.qaCourseSlug).toBeTruthy();
    console.log(
      `  ✅ Tạo khóa: id=${state.qaCourseId} slug=${state.qaCourseSlug}`
    );
  });

  /* [SỬA 19/08/2026] Tìm theo TÊN khóa học, không theo slug.
     `searchTerm` ở courses.repository.js chỉ so khớp CourseName,
     ShortDescription và FullName của giảng viên — KHÔNG có Slug. Tìm bằng slug
     thì lúc nào cũng ra rỗng, nên phép thử "chưa duyệt thì không hiện" xanh
     một cách vô nghĩa còn phép thử "duyệt xong thì hiện" đỏ oan. */
  test('Khóa MỚI TẠO chưa được duyệt → KHÔNG hiện ở danh sách công khai', async () => {
    const res = await get('/courses', {
      query: { searchTerm: state.qaCourseName, limit: 50 },
    });
    expect(res.status).toBe(200);
    const list = res.data?.courses || res.data?.results || [];
    const thay = list.some(
      (c) => (c.courseId ?? c.CourseID) === state.qaCourseId
    );
    /* Đây là lỗ rò hay gặp nhất của LMS: bản nháp lọt ra trang chủ. Nếu test
       này đỏ, có nghĩa học viên nhìn thấy khóa học chưa ai duyệt. */
    expect(thay).toBe(false);
    console.log('  ✅ Bản nháp KHÔNG lọt ra danh sách công khai');
  });

  test('Giảng viên thêm chương (section)', async () => {
    const res = await post(`/courses/${state.qaCourseId}/sections`, {
      token: gvToken,
      body: { sectionName: 'Chương 1 — Nhập môn', description: 'Do QA tạo' },
    });
    expect([200, 201]).toContain(res.status);
    const s = res.data?.section || res.data;
    state.qaSectionId = s.sectionId ?? s.SectionID;
    expect(state.qaSectionId).toBeTruthy();
    console.log(`  ✅ Chương: id=${state.qaSectionId}`);
  });

  test('HỌC VIÊN thêm chương vào khóa của người khác → 403', async () => {
    const res = await post(`/courses/${state.qaCourseId}/sections`, {
      token: hvToken,
      body: { sectionName: 'Chương lậu' },
    });
    expect(res.status).toBe(403);
    console.log('  ✅ Học viên bị chặn thêm chương (403)');
  });

  test('Giảng viên thêm bài học dạng TEXT', async () => {
    const res = await post(
      `/courses/${state.qaCourseId}/sections/${state.qaSectionId}/lessons`,
      {
        token: gvToken,
        body: {
          lessonName: 'Bài 1 — Giới thiệu',
          lessonType: 'TEXT',
          textContent: 'Nội dung bài học do bộ test tự động tạo.',
          isFreePreview: true,
        },
      }
    );
    expectStatus(res, [200, 201]);
    const l = res.data?.lesson || res.data;
    state.qaLessonId = l.lessonId ?? l.LessonID;
    expect(state.qaLessonId).toBeTruthy();
    console.log(`  ✅ Bài học: id=${state.qaLessonId}`);
  });

  test('Giảng viên sở hữu SỬA ĐƯỢC khóa của mình khi còn DRAFT', async () => {
    const moi = `${state.qaCourseName} (da sua)`;
    const res = await patch(`/courses/${state.qaCourseId}`, {
      token: gvToken,
      body: { courseName: moi },
    });
    expectStatus(res, 200, 'giảng viên sửa khóa DRAFT');
    state.qaCourseName = moi;

    /* [SỬA 19/08/2026] Đổi courseName thì máy chủ SINH LẠI SLUG
       (courses.service.js ~dòng 364). Không cập nhật lại slug ở đây thì mọi
       lời gọi GET /courses/:slug phía sau đều 404 — và ba phép thử versioning
       sẽ đỏ vì một lý do chẳng liên quan gì tới versioning. */
    const slugMoi = res.data?.slug ?? res.data?.Slug ?? res.data?.course?.slug;
    expect(slugMoi).toBeTruthy();
    expect(slugMoi).not.toBe(state.qaCourseSlug);
    state.qaCourseSlug = slugMoi;
    console.log(`  ✅ Sửa được khi còn nháp; slug đổi thành ${slugMoi}`);
  });

  test('Giảng viên gửi khóa học đi duyệt', async () => {
    const res = await post(`/courses/${state.qaCourseId}/submit`, {
      token: gvToken,
      body: { notes: 'QA tự động gửi duyệt' },
    });
    expectStatus(res, [200, 201]);
    console.log(`  ✅ Gửi duyệt: ${res.status}`);
  });

  test('HỌC VIÊN duyệt khóa học → 403', async () => {
    /* Lọc thẳng theo courseId — API có hỗ trợ (courses.validation.js
       getApprovalRequests). Quét 20 bản ghi đầu như bản nháp trước sẽ trượt
       ngay khi hệ thống có sẵn vài chục yêu cầu đang chờ. */
    const ds = await get('/approval-requests', {
      token: adminToken,
      query: { courseId: state.qaCourseId, status: 'PENDING', limit: 20 },
    });
    expectStatus(ds, 200, 'lấy danh sách yêu cầu duyệt');
    const list = ds.data?.requests || ds.data?.results || [];
    const cua = list.find(
      (r) => (r.courseId ?? r.CourseID) === state.qaCourseId
    );
    if (cua) state.qaRequestId = cua.requestId ?? cua.RequestID ?? cua.id;

    if (!state.qaRequestId) {
      console.log('  ⚠️ Không tìm thấy yêu cầu duyệt — bỏ qua phép thử quyền');
      return;
    }
    const res = await patch(`/courses/reviews/${state.qaRequestId}`, {
      token: hvToken,
      body: { decision: 'APPROVED' },
    });
    expect(res.status).toBe(403);
    console.log('  ✅ Học viên bị chặn duyệt khóa học (403)');
  });

  test('GIẢNG VIÊN tự duyệt khóa của mình → 403', async () => {
    if (!state.qaRequestId) return;
    const res = await patch(`/courses/reviews/${state.qaRequestId}`, {
      token: gvToken,
      body: { decision: 'APPROVED' },
    });
    /* Giảng viên tự duyệt bài của chính mình là phá vỡ toàn bộ quy trình kiểm
       duyệt. Đây là loại lỗi hay bị bỏ sót vì "giảng viên là người có quyền
       với khóa học đó mà". */
    expect(res.status).toBe(403);
    console.log('  ✅ Giảng viên KHÔNG tự duyệt được khóa của mình (403)');
  });

  test('ADMIN duyệt → khóa học chuyển sang PUBLISHED', async () => {
    if (!state.qaRequestId) {
      throw new Error(
        'Không tìm được yêu cầu duyệt cho khóa vừa gửi. ' +
          'Kiểm tra POST /courses/:id/submit có thật sự tạo bản ghi không.'
      );
    }
    const res = await patch(`/courses/reviews/${state.qaRequestId}`, {
      token: adminToken,
      body: { decision: 'APPROVED', adminNotes: 'QA duyệt tự động' },
    });
    expectStatus(res, 200);

    const ct = await get(`/courses/${state.qaCourseSlug}`);
    expect(ct.status).toBe(200);
    const status = ct.data?.statusId ?? ct.data?.status ?? ct.data?.StatusID;
    expect(String(status).toUpperCase()).toBe('PUBLISHED');
    console.log('  ✅ Đã duyệt và xuất bản');
  });

  /* ★ PHÉP THỬ NÀY ĐÃ BẮT ĐƯỢC MỘT LỖI THẬT (19/08/2026).
     GET /courses được đệm 1800 giây. Trước đây `reviewCourseApproval` KHÔNG
     xóa bộ nhớ đệm, nên admin bấm duyệt xong khóa học vẫn vắng mặt ở trang
     danh sách tới 30 phút. Đã sửa ở courses.controller.js.
     Giữ phép thử này để lỗi đó không quay lại. */
  test('Sau khi duyệt, khóa học HIỆN ở danh sách công khai NGAY (không chờ hết đệm)', async () => {
    const res = await get('/courses', {
      query: { searchTerm: state.qaCourseName, limit: 50 },
    });
    expect(res.status).toBe(200);
    const list = res.data?.courses || res.data?.results || [];
    const thay = list.some(
      (c) => (c.courseId ?? c.CourseID) === state.qaCourseId
    );
    if (!thay) {
      throw new Error(
        'Khóa học đã PUBLISHED nhưng KHÔNG có trong danh sách công khai.\n' +
          'Nghi ngờ số một: bộ nhớ đệm Redis chưa bị xóa sau khi duyệt ' +
          '(reviewCourseApproval thiếu clearCache). Kiểm tra header X-Cache.'
      );
    }
    console.log('  ✅ Khóa học hiện công khai ngay sau khi duyệt');
  });
});

describe('🛡️ COURSE — Ai được sửa, ai không', () => {
  test('HỌC VIÊN sửa khóa học → 403', async () => {
    const res = await patch(`/courses/${state.qaCourseId}`, {
      token: hvToken,
      body: { courseName: 'Tên bị đổi trộm' },
    });
    expect(res.status).toBe(403);
  });

  test('HỌC VIÊN xóa khóa học → 403', async () => {
    const res = await del(`/courses/${state.qaCourseId}`, { token: hvToken });
    expect(res.status).toBe(403);
    console.log('  ✅ Học viên không sửa/xóa được khóa học (403)');
  });

  test('HỌC VIÊN gắn nổi bật (feature) → 403 (chỉ admin)', async () => {
    const res = await patch(`/courses/${state.qaCourseId}/feature`, {
      token: hvToken,
      body: { isFeatured: true },
    });
    expect(res.status).toBe(403);
  });

  test('GIẢNG VIÊN gắn nổi bật → 403 (chỉ admin)', async () => {
    const res = await patch(`/courses/${state.qaCourseId}/feature`, {
      token: gvToken,
      body: { isFeatured: true },
    });
    expect(res.status).toBe(403);
    console.log('  ✅ Chỉ admin mới gắn được khóa học nổi bật');
  });

  /* [SỬA 19/08/2026] Trước đây phép thử này cố sửa khóa ĐÃ XUẤT BẢN và báo
     đỏ. Hóa ra máy chủ đúng, test sai: courses.service.js chặn sửa trực tiếp
     khóa PUBLISHED — muốn đổi thì phải qua luồng tạo phiên bản. Đó là hành vi
     ĐÁNG CÓ (học viên đã mua không được thấy nội dung đổi dưới chân mình), nên
     nay khẳng định đúng điều đó thay vì đòi ngược lại. */
  test('Sửa khóa ĐÃ XUẤT BẢN → 400, buộc đi qua luồng phiên bản', async () => {
    const res = await patch(`/courses/${state.qaCourseId}`, {
      token: gvToken,
      body: { courseName: 'Doi ten khoa da xuat ban' },
    });
    expect(res.status).toBe(400);
    expect(String(res.data?.message || '')).toMatch(/DRAFT|REJECTED/i);
    console.log(`  ✅ Khóa đã xuất bản không sửa thẳng được: "${res.data?.message}"`);
  });
});

describe('🔀 COURSE VERSIONING — Phiên bản cập nhật', () => {
  test('Tạo phiên bản cập nhật từ khóa đã xuất bản', async () => {
    const res = await post(
      `/courses/${state.qaCourseId}/create-update-session`,
      { token: gvToken, body: {} }
    );
    if (res.status === 404) {
      console.log('  ⚠️ Endpoint tạo phiên bản không tồn tại — bỏ qua nhóm này');
      return;
    }
    expectStatus(res, [200, 201], 'tạo phiên bản cập nhật');
    /* [SỬA 19/08/2026] Máy chủ trả về { message, updateCourse } — KHÔNG phải
       { course } cũng không phải khóa học ở gốc phản hồi (xem
       courses.controller.js → createUpdateSession). */
    const c = res.data?.updateCourse || res.data?.course || res.data;
    state.qaUpdateCourseId = c?.courseId ?? c?.CourseID;
    expect(state.qaUpdateCourseId).toBeTruthy();
    expect(state.qaUpdateCourseId).not.toBe(state.qaCourseId);
    console.log(`  ✅ Bản cập nhật: id=${state.qaUpdateCourseId}`);
  });

  test('Bản GỐC vẫn PUBLISHED trong lúc bản mới đang sửa', async () => {
    if (!state.qaUpdateCourseId) return;
    const ct = await get(`/courses/${state.qaCourseSlug}`);
    expect(ct.status).toBe(200);
    const status = ct.data?.statusId ?? ct.data?.status;
    /* Học viên đã mua bản cũ KHÔNG được mất quyền học chỉ vì giảng viên bấm
       "tạo bản cập nhật". */
    expect(String(status).toUpperCase()).toBe('PUBLISHED');
    console.log('  ✅ Bản gốc không bị ảnh hưởng');
  });

  /* ★ PHÉP THỬ NÀY ĐÃ BẮT ĐƯỢC MỘT LỖI THẬT (19/08/2026): lịch sử phiên bản
     trả về RỖNG. Nguyên nhân ở findVersionsByRootId — nó chỉ tìm
     `RootCourseID = @rootId`, mà khóa gốc lại có RootCourseID = NULL. Đã sửa
     ở courses.repository.js.

     Kỳ vọng là ≥ 1 chứ không phải ≥ 2: bản sao đang soạn dở CỐ Ý bị loại khỏi
     lịch sử (`LiveCourseID IS NULL`) — nó chưa phải một phiên bản. */
  test('Lịch sử phiên bản có chứa bản gốc (không được rỗng)', async () => {
    const res = await get(`/courses/${state.qaCourseId}/versions`, {
      token: gvToken,
    });
    expectStatus(res, 200, 'lịch sử phiên bản');
    const list = res.data?.versions || [];
    expect(Array.isArray(list)).toBe(true);
    if (list.length === 0) {
      throw new Error(
        'Lịch sử phiên bản RỖNG cho một khóa học đang tồn tại.\n' +
          'Nghi ngờ: findVersionsByRootId bỏ sót chính hàng gốc ' +
          '(khóa v1 có RootCourseID = NULL).'
      );
    }
    const coGoc = list.some((v) => (v.courseId ?? v.CourseID) === state.qaCourseId);
    expect(coGoc).toBe(true);
    console.log(
      `  ✅ ${list.length} phiên bản, có bản gốc: ` +
        list.map((v) => `v${v.versionNumber}/${v.statusId}`).join(', ')
    );
  });

  test('Hủy bản cập nhật → bản gốc vẫn còn nguyên', async () => {
    if (!state.qaUpdateCourseId) return;
    const res = await post(
      `/courses/${state.qaUpdateCourseId}/cancel-update`,
      { token: gvToken, body: {} }
    );
    expectStatus(res, [200, 204]);

    const ct = await get(`/courses/${state.qaCourseSlug}`);
    expect(ct.status).toBe(200);
    console.log('  ✅ Hủy bản cập nhật xong, bản gốc còn nguyên');
  });
});
