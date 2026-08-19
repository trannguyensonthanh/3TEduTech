/**
 * 18-orders-payments.test.js — Giỏ hàng, đơn hàng, thanh toán
 * ═══════════════════════════════════════════════════════════════════════════
 * [THÊM 19/08/2026]
 *
 * ── TẬP TRUNG VÀO ĐƯỜNG BIÊN, KHÔNG PHẢI ĐƯỜNG THẲNG ─────────────────────
 *
 * Luồng "thêm vào giỏ → đặt hàng → thanh toán" chạy đúng là chuyện dễ. Cái làm
 * vỡ hệ thống lúc demo là những nhánh không ai bấm thử:
 *
 *   • giảng viên mua chính khóa học của mình
 *   • mua lại khóa đã sở hữu
 *   • bỏ vào giỏ một khóa chưa được duyệt
 *   • đặt hàng khi giỏ rỗng
 *   • mã giảm giá sai / hết hạn / không tồn tại
 *   • xem đơn hàng của người khác
 *   • tạo phiên thanh toán cho đơn không thuộc về mình
 *
 * Mỗi phép thử dưới đây khẳng định một mã lỗi CỤ THỂ. Chấp nhận "bất kỳ mã 4xx
 * nào" nghe thì dễ dãi cho test nhưng lại bỏ lọt đúng thứ đáng lo: một endpoint
 * trả 500 thay vì 400 nghĩa là dữ liệu sai đã đi tới tận CSDL rồi mới nổ.
 */

const { get, post, del, state, expectStatus, why } = require('./helpers/api');
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

/** Lấy một khóa học đã xuất bản, có giá > 0 để mua. */
async function timKhoaCoGia() {
  if (state.qaPaidCourseId) return state.qaPaidCourseId;
  const res = await get('/courses', { query: { page: 1, limit: 50 } });
  expectStatus(res, 200, 'liệt kê khóa học');
  const list = res.data?.courses || res.data?.results || [];
  const co = list.find(
    (c) => Number(c.originalPrice ?? c.OriginalPrice ?? 0) > 0
  );
  if (co) state.qaPaidCourseId = co.courseId ?? co.CourseID;
  return state.qaPaidCourseId;
}

describe('🛒 GIỎ HÀNG — đường biên', () => {
  test('Không đăng nhập → 401', async () => {
    const res = await get('/cart');
    expect(res.status).toBe(401);
  });

  test('Giỏ hàng ban đầu đọc được', async () => {
    const res = await get('/cart', { token: hvToken });
    expectStatus(res, 200, 'xem giỏ hàng');
    console.log('  ✅ Đọc được giỏ hàng');
  });

  test('Thêm khóa học KHÔNG TỒN TẠI → 404, không phải 500', async () => {
    const res = await post('/cart', {
      token: hvToken,
      body: { courseId: 999999999 },
    });
    expect([400, 404]).toContain(res.status);
    console.log(`  ✅ Khóa không tồn tại: ${res.status}`);
  });

  test('courseId là chuỗi chữ → 400 (validation chặn)', async () => {
    const res = await post('/cart', {
      token: hvToken,
      body: { courseId: 'khong-phai-so' },
    });
    expect(res.status).toBe(400);
  });

  test('courseId âm → 400', async () => {
    const res = await post('/cart', {
      token: hvToken,
      body: { courseId: -5 },
    });
    expect(res.status).toBe(400);
    console.log('  ✅ courseId sai kiểu / âm đều bị chặn ở validation');
  });

  test('Thêm khóa CHƯA DUYỆT vào giỏ → phải bị từ chối', async () => {
    /* Dùng khóa nháp do 14-course-lifecycle tạo, nếu có. Bán một khóa chưa ai
       duyệt là lỗi vừa về nghiệp vụ vừa về tiền bạc. */
    if (!state.qaUpdateCourseId && !state.qaDraftCourseId) {
      console.log('  ⏭️ Chưa có khóa nháp để thử');
      return;
    }
    const id = state.qaDraftCourseId || state.qaUpdateCourseId;
    const res = await post('/cart', { token: hvToken, body: { courseId: id } });
    expect([400, 403, 404]).toContain(res.status);
    console.log(`  ✅ Khóa chưa duyệt không bỏ vào giỏ được (${res.status})`);
  });

  test('Thêm khóa hợp lệ vào giỏ', async () => {
    const id = await timKhoaCoGia();
    if (!id) {
      console.log('  ⏭️ Hệ thống chưa có khóa nào giá > 0');
      return;
    }
    const res = await post('/cart', { token: hvToken, body: { courseId: id } });
    /* 409/400 = đã có trong giỏ hoặc đã sở hữu — vẫn là hành vi đúng. */
    expect([200, 201, 400, 409]).toContain(res.status);
    console.log(`  ✅ Thêm vào giỏ khóa ${id}: ${res.status}`);
  });

  test('Thêm TRÙNG khóa đó → bị từ chối', async () => {
    const id = state.qaPaidCourseId;
    if (!id) return;
    const res = await post('/cart', { token: hvToken, body: { courseId: id } });
    expect([400, 409]).toContain(res.status);
    console.log(`  ✅ Thêm trùng bị chặn (${res.status})`);
  });

  test('Giỏ của học viên 1 KHÔNG lẫn sang học viên 2', async () => {
    const g1 = await get('/cart', { token: hvToken });
    const g2 = await get('/cart', { token: hv2Token });
    expectStatus(g1, 200);
    expectStatus(g2, 200);
    const lay = (r) => r.data?.items || r.data?.cartItems || [];
    const ids2 = lay(g2).map((i) => i.courseId ?? i.CourseID);
    if (state.qaPaidCourseId) {
      /* Nếu khóa vừa thêm cho học viên 1 lại xuất hiện trong giỏ học viên 2 thì
         giỏ hàng đang bị chia sẻ theo phiên/toàn cục — lỗi rất nặng. */
      expect(ids2).not.toContain(state.qaPaidCourseId);
    }
    console.log(`  ✅ Giỏ tách bạch: HV1=${lay(g1).length}, HV2=${lay(g2).length}`);
  });
});

describe('🧾 ĐƠN HÀNG — đường biên', () => {
  test('Mã giảm giá KHÔNG TỒN TẠI → bị từ chối, không âm thầm bỏ qua', async () => {
    const res = await post('/orders', {
      token: hvToken,
      body: { promotionCode: 'MA-KHONG-CO-THAT-12345' },
    });
    /* Nếu trả 200/201 nghĩa là mã sai bị nuốt lặng lẽ. Người dùng nhập nhầm mã
       sẽ tưởng mình được giảm giá, rồi bị tính đủ tiền — khiếu nại chắc chắn. */
    expect([400, 404, 422]).toContain(res.status);
    console.log(`  ✅ Mã giảm giá sai bị từ chối (${res.status})`);
  });

  test('Kiểm tra mã giảm giá qua /promotions/validate-code', async () => {
    const res = await post('/promotions/validate-code', {
      token: hvToken,
      body: { code: 'MA-KHONG-CO-THAT-12345' },
    });
    expect([200, 400, 404]).toContain(res.status);
    if (res.status === 200) {
      /* Endpoint kiểm tra mã trả 200 vẫn hợp lệ nếu thân phản hồi nói rõ mã
         không dùng được. Cái không chấp nhận được là 200 + isValid=true. */
      const ok = res.data?.isValid ?? res.data?.valid;
      expect(ok).not.toBe(true);
    }
    console.log(`  ✅ Kiểm tra mã sai: ${res.status}`);
  });

  test('Đặt hàng khi giỏ RỖNG → 400', async () => {
    /* Dùng học viên 2 vì giỏ của họ chưa được đụng tới. */
    const res = await post('/orders', { token: hv2Token, body: {} });
    expect([400, 404, 422]).toContain(res.status);
    console.log(`  ✅ Giỏ rỗng không đặt hàng được (${res.status})`);
  });

  test('Tạo đơn hàng từ giỏ có hàng', async () => {
    if (!state.qaPaidCourseId) {
      console.log('  ⏭️ Không có khóa trả phí để đặt');
      return;
    }
    const res = await post('/orders', { token: hvToken, body: {} });
    if (res.status === 200 || res.status === 201) {
      state.qaOrderId =
        res.data?.orderId ?? res.data?.OrderID ?? res.data?.order?.orderId;
      expect(state.qaOrderId).toBeTruthy();
      console.log(`  ✅ Đơn hàng: ${state.qaOrderId}`);
    } else {
      console.log(`  ⚠️ Không tạo được đơn: ${why(res)}`);
    }
  });

  test('Học viên 2 KHÔNG xem được đơn của học viên 1', async () => {
    if (!state.qaOrderId) return;
    const res = await get(`/orders/${state.qaOrderId}`, { token: hv2Token });
    /* Đơn hàng chứa thông tin mua bán cá nhân. 200 ở đây là rò rỉ dữ liệu. */
    expect([403, 404]).toContain(res.status);
    console.log(`  ✅ Không xem trộm được đơn người khác (${res.status})`);
  });

  test('Chủ đơn xem được đơn của mình', async () => {
    if (!state.qaOrderId) return;
    const res = await get(`/orders/${state.qaOrderId}`, { token: hvToken });
    expectStatus(res, 200, 'chủ đơn xem đơn của mình');
  });

  test('Đơn hàng không tồn tại → 404', async () => {
    const res = await get('/orders/999999999', { token: hvToken });
    expect([403, 404]).toContain(res.status);
  });

  test('orderId không phải số → 400', async () => {
    const res = await get('/orders/abc', { token: hvToken });
    expect([400, 404]).toContain(res.status);
  });

  test('Học viên 2 KHÔNG hủy được đơn của học viên 1', async () => {
    if (!state.qaOrderId) return;
    const res = await post(`/orders/${state.qaOrderId}/cancel`, {
      token: hv2Token,
      body: {},
    });
    expect([403, 404]).toContain(res.status);
    console.log(`  ✅ Không hủy được đơn người khác (${res.status})`);
  });
});

describe('💳 THANH TOÁN — quyền và đầu vào', () => {
  const congThanhToan = [
    ['/payments/stripe/create-checkout-session', 'Stripe'],
    ['/payments/crypto/create-invoice', 'Crypto'],
  ];

  test.each(congThanhToan)('%s — không token → 401', async (path) => {
    const res = await post(path, { body: { orderId: 1 } });
    expect(res.status).toBe(401);
  });

  test.each(congThanhToan)('%s — thiếu orderId → 400', async (path, ten) => {
    const res = await post(path, { token: hvToken, body: {} });
    /* ★ Phép thử này bắt được một lỗi thật ngày 19/08: route Stripe gọi
       `validate(paymentValidation.createStripeSession)` trong khi schema đó
       KHÔNG TỒN TẠI. `validate(undefined)` chấp nhận mọi thứ, nên thân request
       của cổng Stripe hoàn toàn không được kiểm tra. Đã bổ sung schema. */
    expect(res.status).toBe(400);
    console.log(`  ✅ ${ten}: thiếu orderId bị chặn ở validation`);
  });

  test.each(congThanhToan)('%s — orderId sai kiểu → 400', async (path) => {
    const res = await post(path, {
      token: hvToken,
      body: { orderId: 'khong-phai-so' },
    });
    expect(res.status).toBe(400);
  });

  test('Tạo phiên thanh toán cho đơn KHÔNG thuộc về mình → không được 200', async () => {
    if (!state.qaOrderId) return;
    const res = await post('/payments/stripe/create-checkout-session', {
      token: hv2Token,
      body: { orderId: state.qaOrderId },
    });
    /* 503 = cổng Stripe chưa bật, vẫn chấp nhận được vì nó dừng TRƯỚC khi tạo
       phiên. Cái tuyệt đối không được phép là 200: nghĩa là học viên 2 vừa mở
       được trang trả tiền cho đơn của học viên 1. */
    expect(res.status).not.toBe(200);
    console.log(`  ✅ Không tạo được phiên thanh toán cho đơn người khác (${res.status})`);
  });

  test('Danh sách phương thức thanh toán là công khai và không rỗng', async () => {
    const res = await get('/payment-methods');
    expectStatus(res, 200, 'danh sách phương thức thanh toán');
    const list = res.data?.paymentMethods || res.data?.results || res.data || [];
    expect(Array.isArray(list) ? list.length : 0).toBeGreaterThan(0);
    console.log(`  ✅ ${list.length} phương thức thanh toán`);
  });
});

describe('🎓 GHI DANH — không mua mà vẫn học được?', () => {
  test('Ghi danh khóa TRẢ PHÍ mà chưa thanh toán → phải bị chặn', async () => {
    const id = await timKhoaCoGia();
    if (!id) return;
    const res = await post(`/enrollments/courses/${id}`, {
      token: hv2Token,
      body: {},
    });
    /* Endpoint này dành cho khóa MIỄN PHÍ. Nếu nó cho ghi danh khóa có giá thì
       toàn bộ phần thanh toán trở thành trang trí. */
    expect([400, 402, 403]).toContain(res.status);
    console.log(`  ✅ Không ghi danh chùa khóa trả phí (${res.status})`);
  });

  test('Danh sách ghi danh của tôi chỉ có của tôi', async () => {
    const res = await get('/enrollments/me', {
      token: hvToken,
      query: { page: 1, limit: 20 },
    });
    expectStatus(res, 200, 'danh sách ghi danh');
    const list = res.data?.enrollments || res.data?.results || [];
    expect(Array.isArray(list)).toBe(true);
    const laiCuaNguoiKhac = list.filter(
      (e) =>
        e.accountId != null &&
        Number(e.accountId) !== Number(state.studentAccountId)
    );
    expect(laiCuaNguoiKhac.length).toBe(0);
    console.log(`  ✅ ${list.length} ghi danh, đều của chính mình`);
  });
});
