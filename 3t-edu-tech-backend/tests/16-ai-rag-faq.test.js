/**
 * 16-ai-rag-faq.test.js — AI Service, RAG, chatbot, FAQ
 * ═══════════════════════════════════════════════════════════════════════════
 * [THÊM 19/08/2026]
 *
 * ── CHIA LÀM HAI HẠNG, CÓ LÝ DO ───────────────────────────────────────────
 *
 * (A) LUÔN CHẠY — không tốn một token LLM nào:
 *     sức khỏe dịch vụ, xác thực nội bộ, tạo/xóa phiên trò chuyện, phân
 *     quyền, danh sách FAQ. Đây là phần hay hỏng nhất khi triển khai (sai
 *     khóa, sai cổng, ChromaDB rỗng) và cũng là phần rẻ nhất để kiểm.
 *
 * (B) CHỈ CHẠY KHI ĐẶT TEST_AI_LIVE=1 — có gọi mô hình thật:
 *     hỏi đáp RAG, tìm khóa học bằng AI. Mỗi lượt đốt hạn mức Gemini miễn phí
 *     của TOÀN hệ thống, nên không để nó chạy trong mỗi lần `npm test`.
 *
 *     PowerShell:  $env:TEST_AI_LIVE="1"; npm test
 *
 * Chạy nhóm (B) MỘT LẦN trước buổi báo cáo là đủ để yên tâm.
 */

const {
  get,
  post,
  del,
  state,
  expectStatus,
  why,
  AI_BASE,
} = require('./helpers/api');
const {
  ensureAdmin,
  ensureStudent,
  ensureInstructor,
} = require('./helpers/auth');

const LIVE = process.env.TEST_AI_LIVE === '1';
const moTaLive = LIVE ? test : test.skip;

let adminToken;
let hvToken;
let gvToken;

beforeAll(async () => {
  adminToken = await ensureAdmin();
  hvToken = await ensureStudent();
  gvToken = await ensureInstructor();
  if (!LIVE) {
    console.log(
      '\n  ℹ️ Chưa đặt TEST_AI_LIVE=1 — bỏ qua các test có gọi mô hình thật.\n'
    );
  }
});

describe('🧠 AI SERVICE — Sức khỏe & xác thực nội bộ', () => {
  test('GET /health trả trạng thái đầy đủ', async () => {
    const res = await get('/health', { baseUrl: AI_BASE });
    expectStatus(res, 200, `gọi ${AI_BASE}/health`);

    expect(['healthy', 'degraded']).toContain(res.data.status);
    expect(res.data.collections).toBeDefined();
    expect(res.data.whisper).toBeDefined();
    expect(typeof res.data.whisper.available).toBe('boolean');

    const master = res.data.collections.master;
    const courses = res.data.collections.courses;
    console.log(
      `  ✅ AI ${res.data.status} · LLM=${res.data.llm_provider} · ` +
        `whisper=${res.data.whisper.available ? 'BẬT' : 'TẮT'}`
    );
    console.log(
      `     ChromaDB — master: ${JSON.stringify(master)} · courses: ${JSON.stringify(courses)}`
    );
    state.qaChromaMaster = master;
    state.qaChromaCourses = courses;
  });

  test('ChromaDB đã có dữ liệu để RAG trả lời được', async () => {
    const m = state.qaChromaMaster;
    const c = state.qaChromaCourses;
    const dem = (x) => (typeof x === 'object' && x ? x.count ?? x.Count ?? 0 : 0);

    /* Nếu cả hai collection đều rỗng thì chatbot sẽ trả lời chung chung hoặc
       "tôi không tìm thấy thông tin" trong lúc bạn đang demo. Đây là thứ đáng
       biết TRƯỚC 5 phút chứ không phải giữa buổi báo cáo. */
    const tong = dem(m) + dem(c);
    if (tong === 0) {
      throw new Error(
        'ChromaDB RỖNG (cả master lẫn courses). Chatbot sẽ không có gì để trích dẫn.\n' +
          'Chạy lại quá trình nạp dữ liệu (aiSync) hoặc tải tài liệu FAQ lên trước khi demo.'
      );
    }
    console.log(`  ✅ ChromaDB có tổng cộng ${tong} mẩu dữ liệu`);
  });

  test('🔒 Gọi /api/... KHÔNG kèm X-Internal-Api-Key → bị từ chối', async () => {
    const res = await post('/api/search/courses', {
      baseUrl: AI_BASE,
      body: { query: 'lập trình web', top_k: 3 },
    });

    /* Đây là hàng rào an ninh quan trọng nhất của AI Service: nếu nó mở, bất
       kỳ ai biết địa chỉ máy chủ đều gọi được mô hình bằng hạn mức của bạn.
       200 ở đây nghĩa là INTERNAL_API_KEY chưa được đặt — PHẢI sửa trước khi
       đưa lên EC2. */
    expect([401, 403]).toContain(res.status);
    console.log(`  ✅ AI Service chặn gọi thiếu khóa nội bộ (${res.status})`);
  });

  test('🔒 Sai khóa nội bộ → vẫn bị từ chối', async () => {
    const res = await post('/api/search/courses', {
      baseUrl: AI_BASE,
      headers: { 'X-Internal-Api-Key': 'khoa-sai-hoan-toan-12345' },
      body: { query: 'lập trình web', top_k: 3 },
    });
    expect([401, 403]).toContain(res.status);
  });
});

describe('💬 CHATBOT — Phiên trò chuyện (không gọi mô hình)', () => {
  test('Không đăng nhập → 401', async () => {
    const res = await post('/ai/sessions', { body: { scope: 'MASTER' } });
    expect(res.status).toBe(401);
  });

  test('Học viên tạo phiên MASTER', async () => {
    const res = await post('/ai/sessions', {
      token: hvToken,
      body: { scope: 'MASTER' },
    });
    expectStatus(res, [200, 201], 'tạo phiên chat MASTER');
    state.qaSessionId = res.data?.sessionId ?? res.data?.session?.sessionId;
    expect(state.qaSessionId).toBeTruthy();
    console.log(`  ✅ Phiên MASTER: ${state.qaSessionId}`);
  });

  test('Gọi lại lần hai trả về ĐÚNG phiên cũ, không đẻ phiên mới', async () => {
    const res = await post('/ai/sessions', {
      token: hvToken,
      body: { scope: 'MASTER' },
    });
    expectStatus(res, [200, 201]);
    const lai = res.data?.sessionId ?? res.data?.session?.sessionId;
    /* "getOrCreate" mà lần nào cũng tạo mới thì lịch sử hội thoại của học viên
       vỡ vụn thành hàng chục phiên một tin nhắn. */
    expect(lai).toBe(state.qaSessionId);
    console.log('  ✅ getOrCreate trả đúng phiên cũ');
  });

  test('Phiên của học viên A — học viên B không đọc được', async () => {
    const res = await get(`/ai/sessions/${state.qaSessionId}/messages`, {
      token: gvToken,
    });
    /* Nội dung trò chuyện là dữ liệu riêng tư. 200 ở đây là rò rỉ. */
    expect([403, 404]).toContain(res.status);
    console.log(`  ✅ Không đọc trộm được hội thoại người khác (${res.status})`);
  });

  test('Danh sách phiên của chính mình', async () => {
    const res = await get('/ai/sessions', { token: hvToken });
    expectStatus(res, 200, 'liệt kê phiên chat');
    const list = res.data?.sessions || res.data?.results || [];
    expect(Array.isArray(list)).toBe(true);
    expect(list.some((s) => (s.sessionId ?? s.SessionID) === state.qaSessionId)).toBe(true);
    console.log(`  ✅ Có ${list.length} phiên`);
  });

  test('Tạo phiên COURSE cho khóa CHƯA ghi danh → bị từ chối', async () => {
    if (!state.qaCourseId) {
      console.log('  ⏭️ Chưa có khóa học từ tệp 14 — bỏ qua');
      return;
    }
    const res = await post('/ai/sessions', {
      token: hvToken,
      body: { scope: 'COURSE', courseId: state.qaCourseId },
    });
    /* Chat trong khóa học được nạp nội dung bài giảng vào ngữ cảnh. Cho người
       chưa mua truy cập nghĩa là phát không toàn bộ nội dung khóa học qua
       đường chatbot. */
    expect([403, 404]).toContain(res.status);
    console.log(`  ✅ Chưa ghi danh thì không mở được chat khóa học (${res.status})`);
  });
});

describe('❓ FAQ — Danh sách công khai & quản trị tài liệu', () => {
  test('GET /faqs công khai trả 200 (KHÔNG 500)', async () => {
    const res = await get('/faqs');
    /* Endpoint này từng trả 500 vì gọi một hàm không tồn tại
       (toCamelCaseArray). Lỗi kiểu đó không lộ ra cho tới khi có người mở
       trang FAQ — giữ lại phép thử này để nó không tái diễn. */
    expectStatus(res, 200, 'lấy danh sách FAQ công khai');
    const list = res.data?.faqs || res.data?.results || res.data || [];
    expect(Array.isArray(list)).toBe(true);
    console.log(`  ✅ FAQ công khai: ${list.length} mục`);
  });

  test('Trường trả về dùng camelCase (faqId chứ không phải FAQID)', async () => {
    const res = await get('/faqs');
    const list = res.data?.faqs || res.data?.results || res.data || [];
    if (!list.length) {
      console.log('  ⏭️ Chưa có FAQ nào để kiểm tra tên trường');
      return;
    }
    const f = list[0];
    /* Giao diện đọc `faqId`. Nếu máy chủ đổi sang FAQID thì React mất key,
       danh sách nhảy lung tung và không ai hiểu vì sao. */
    expect(Object.keys(f).some((k) => k === 'faqId' || k === 'id')).toBe(true);
    console.log(`  ✅ Tên trường: ${Object.keys(f).slice(0, 6).join(', ')}`);
  });

  test('Học viên xem danh sách tài liệu FAQ → 403', async () => {
    const res = await get('/faqs/documents', { token: hvToken });
    expect(res.status).toBe(403);
  });

  test('Admin xem danh sách tài liệu FAQ → 200', async () => {
    const res = await get('/faqs/documents', { token: adminToken });
    expectStatus(res, 200, 'admin liệt kê tài liệu FAQ');
    const list = res.data?.documents || res.data?.results || res.data || [];
    expect(Array.isArray(list)).toBe(true);
    console.log(`  ✅ Tài liệu FAQ đã nạp: ${list.length}`);
  });
});

describe('🔥 AI THẬT — chỉ chạy khi TEST_AI_LIVE=1', () => {
  moTaLive('Tìm khóa học bằng AI trả về câu trả lời có nguồn', async () => {
    const res = await post('/ai/search-courses', {
      token: hvToken,
      body: { query: 'Tôi muốn học lập trình web từ đầu', topK: 3 },
      timeoutMs: 90000,
    });
    expectStatus(res, 200, 'tìm khóa học bằng AI');
    expect(typeof res.data.answer).toBe('string');
    expect(res.data.answer.length).toBeGreaterThan(10);
    expect(Array.isArray(res.data.sources)).toBe(true);
    console.log(
      `  ✅ AI trả lời ${res.data.answer.length} ký tự, ${res.data.sources.length} nguồn`
    );
    console.log(`     "${res.data.answer.slice(0, 160)}..."`);
  }, 120000);

  moTaLive('Hỏi đáp trong phiên MASTER', async () => {
    const res = await post(`/ai/sessions/${state.qaSessionId}/chat`, {
      token: hvToken,
      body: { query: 'Hệ thống này có những khóa học nào?' },
      timeoutMs: 120000,
    });
    expectStatus(res, 200, 'hỏi đáp MASTER');
    expect(typeof res.data.answer).toBe('string');
    expect(res.data.answer.length).toBeGreaterThan(10);
    console.log(`  ✅ Trả lời: "${res.data.answer.slice(0, 160)}..."`);
  }, 150000);

  moTaLive('Lịch sử hội thoại được LƯU LẠI phía máy chủ', async () => {
    const res = await get(`/ai/sessions/${state.qaSessionId}/messages`, {
      token: hvToken,
    });
    expectStatus(res, 200);
    const msgs = res.data?.messages || [];
    /* Ít nhất 1 câu hỏi + 1 câu trả lời. Nếu rỗng thì lịch sử chỉ nằm trong
       localStorage của trình duyệt — đổi máy là mất, và bản chat streaming
       mới (dựa vào sessionId) sẽ không có ngữ cảnh. */
    expect(msgs.length).toBeGreaterThanOrEqual(2);
    console.log(`  ✅ Đã lưu ${msgs.length} tin nhắn`);
  });
});

afterAll(async () => {
  if (state.qaSessionId && hvToken) {
    await del(`/ai/sessions/${state.qaSessionId}`, { token: hvToken }).catch(
      () => {}
    );
  }
});
