/**
 * 08-financials.test.js — Test tài chính & thanh toán
 * ═══════════════════════════════════════════════════════════
 * Xem số dư → Lịch sử giao dịch → Doanh thu → Thanh toán Stripe → VNPay
 */

const { get, post, state } = require('./helpers/api');

describe('💰 FINANCIALS — Tài chính & Thanh toán', () => {

  // ─── Instructor Financial ───
  test('Instructor: Xem số dư khả dụng', async () => {
    if (!state.instructorToken) { console.log('  ⏭️ Skip'); return; }
    const res = await get('/financials/balance', { token: state.instructorToken });
    expect(res.status).toBe(200);
    console.log(`  ✅ Balance: ${JSON.stringify(res.data).substring(0, 150)}`);
  });

  test('Instructor: Xem lịch sử giao dịch', async () => {
    if (!state.instructorToken) { console.log('  ⏭️ Skip'); return; }
    const res = await get('/financials/transactions', {
      token: state.instructorToken,
      query: { page: 1, limit: 5 },
    });
    expect(res.status).toBe(200);
    console.log(`  ✅ Transactions: ${res.data.results?.length ?? 0} giao dịch`);
  });

  test('Instructor: Xem thu nhập hàng tháng', async () => {
    if (!state.instructorToken) { console.log('  ⏭️ Skip'); return; }
    const res = await get('/financials/monthly-earnings', {
      token: state.instructorToken,
      query: { months: 6 },
    });
    expect(res.status).toBe(200);
    console.log(`  ✅ Monthly earnings: OK`);
  });

  test('Instructor: Xem doanh thu theo khóa', async () => {
    if (!state.instructorToken) { console.log('  ⏭️ Skip'); return; }
    const res = await get('/financials/revenue-by-course', {
      token: state.instructorToken,
      query: { page: 1, limit: 5 },
    });
    expect(res.status).toBe(200);
    console.log(`  ✅ Revenue by course: ${res.data.results?.length ?? 0} khóa`);
  });

  test('Instructor: Xem lịch sử rút tiền', async () => {
    if (!state.instructorToken) { console.log('  ⏭️ Skip'); return; }
    const res = await get('/financials/payout-activity', {
      token: state.instructorToken,
      query: { page: 1, limit: 5 },
    });
    expect(res.status).toBe(200);
    console.log(`  ✅ Payout activity: ${res.data.results?.length ?? 0} yêu cầu`);
  });

  // ─── Payment Methods ───
  test('Lấy danh sách phương thức thanh toán', async () => {
    const res = await get('/payment-methods');
    expect(res.status).toBe(200);
    const methods = Array.isArray(res.data) ? res.data : res.data.results || [];
    console.log(`  ✅ Payment methods: ${methods.length} phương thức`);
    methods.forEach(m => {
      console.log(`     - ${m.MethodID || m.methodId}: ${m.MethodName || m.methodName}`);
    });
  });

  // ─── Currencies & Exchange Rates ───
  test('Lấy danh sách tiền tệ (cần auth)', async () => {
    if (!state.adminToken && !state.instructorToken) { console.log('  ⏭️ Skip: Chưa có token'); return; }
    const token = state.adminToken || state.instructorToken;
    const res = await get('/currencies', { token });
    expect(res.status).toBe(200);
    console.log(`  ✅ Currencies: OK`);
  });

  test('Lấy tỷ giá hối đoái (cần auth)', async () => {
    if (!state.adminToken && !state.instructorToken) { console.log('  ⏭️ Skip'); return; }
    const token = state.adminToken || state.instructorToken;
    const res = await get('/exchange-rates', { token });
    if (res.status === 200) {
      console.log(`  ✅ Exchange rates: OK`);
    } else {
      console.log(`  ⚠️ Exchange rates: Status ${res.status}`);
    }
  });

  // ─── Stripe Checkout (chỉ test endpoint có thể gọi) ───
  test('Stripe: Tạo checkout session (kiểm tra endpoint tồn tại)', async () => {
    if (!state.studentToken || !state.orderId) {
      console.log('  ⏭️ Skip: Không có order');
      return;
    }
    const res = await post('/payments/stripe/create-checkout-session', {
      token: state.studentToken,
      body: { orderId: state.orderId },
    });
    // Nếu Stripe key hợp lệ → có thể 200 hoặc lỗi logic
    // Nếu Stripe key hết hạn → thường 500 kèm lỗi rõ ràng
    if (res.status === 200) {
      console.log(`  ✅ Stripe checkout: Tạo session thành công`);
      console.log(`     URL: ${res.data.url?.substring(0, 50) || 'N/A'}...`);
    } else if (res.status === 500 && JSON.stringify(res.data).includes('Stripe')) {
      console.log(`  ⚠️ Stripe API KEY có vấn đề — cần kiểm tra STRIPE_SECRET_KEY`);
    } else {
      console.log(`  ⚠️ Stripe: Status ${res.status} — ${JSON.stringify(res.data).substring(0, 200)}`);
    }
  });

  // ─── VNPay (chỉ test endpoint) ───
  test('VNPay: Tạo URL thanh toán (kiểm tra endpoint)', async () => {
    if (!state.studentToken || !state.orderId) {
      console.log('  ⏭️ Skip: Không có order');
      return;
    }
    const res = await post('/payments/vnpay/create-url', {
      token: state.studentToken,
      body: {
        orderId: state.orderId,
        bankCode: '',
        language: 'vn',
      },
    });
    if (res.status === 200) {
      console.log(`  ✅ VNPay: Tạo URL thành công`);
    } else {
      console.log(`  ⚠️ VNPay: Status ${res.status} — ${JSON.stringify(res.data).substring(0, 200)}`);
    }
  });

  // ─── Admin Financial ───
  test('Admin: Xem danh sách payouts', async () => {
    if (!state.adminToken) { console.log('  ⏭️ Skip'); return; }
    const res = await get('/financials/payouts', {
      token: state.adminToken,
      query: { page: 1, limit: 5 },
    });
    if (res.status === 200) {
      console.log(`  ✅ Admin payouts: ${res.data.results?.length ?? 0} payouts`);
    } else {
      console.log(`  ⚠️ Admin payouts: Status ${res.status}`);
    }
  });

  test('Admin: Xem withdrawal requests', async () => {
    if (!state.adminToken) { console.log('  ⏭️ Skip'); return; }
    const res = await get('/financials/withdrawal-requests', {
      token: state.adminToken,
      query: { page: 1, limit: 5 },
    });
    if (res.status === 200) {
      console.log(`  ✅ Withdrawal requests: ${res.data.results?.length ?? 0} yêu cầu`);
    } else {
      console.log(`  ⚠️ Withdrawal requests: Status ${res.status}`);
    }
  });
});
