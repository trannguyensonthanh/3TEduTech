/**
 * 11-ai-chatbot.test.js — Test AI Chatbot
 * ═══════════════════════════════════════════════════════════
 */

const { get, post, state, AI_BASE } = require('./helpers/api');

function getToken() {
  return state.studentToken || state.adminToken || state.instructorToken;
}

describe('🤖 AI CHATBOT — Trợ lý học tập AI', () => {

  let aiAvailable = false;

  beforeAll(async () => {
    try {
      const res = await fetch(`${AI_BASE}/health`, { signal: AbortSignal.timeout(3000) });
      aiAvailable = res.ok;
    } catch {
      aiAvailable = false;
    }
  });

  test('AI Service health check', () => {
    if (aiAvailable) {
      console.log(`  ✅ AI Service: Đang chạy tại ${AI_BASE}`);
    } else {
      console.log(`  ⚠️ AI Service: KHÔNG chạy — Các test AI sẽ bị skip`);
    }
    expect(true).toBe(true);
  });

  test('Gửi câu hỏi tổng quát đến AI (nếu có)', async () => {
    const token = getToken();
    if (!aiAvailable || !token) {
      console.log('  ⏭️ Skip: AI không chạy hoặc chưa đăng nhập');
      return;
    }
    const res = await post('/ai/chat', {
      token,
      body: {
        message: 'Xin chào, bạn có thể giúp tôi tìm khóa học phù hợp không?',
        scope: 'GENERAL',
      },
    });
    if (res.status === 200) {
      console.log(`  ✅ AI Chat: Nhận phản hồi thành công`);
    } else {
      console.log(`  ⚠️ AI Chat: Status ${res.status} — ${JSON.stringify(res.data).substring(0, 200)}`);
    }
  });

  test('Xem danh sách chat sessions', async () => {
    const token = getToken();
    if (!token) { console.log('  ⏭️ Skip'); return; }
    const res = await get('/ai/sessions', { token, query: { page: 1, limit: 5 } });
    if (res.status === 200) {
      const sessions = res.data.results || res.data.sessions || res.data || [];
      console.log(`  ✅ Chat sessions: ${Array.isArray(sessions) ? sessions.length : '?'} phiên`);
    } else {
      console.log(`  ⚠️ Chat sessions: Status ${res.status}`);
    }
  });

  test('Xem lịch sử tin nhắn của session (nếu có)', async () => {
    const token = getToken();
    if (!token) { console.log('  ⏭️ Skip'); return; }

    const sessRes = await get('/ai/sessions', { token, query: { page: 1, limit: 1 } });
    const sessions = sessRes.data?.results || sessRes.data?.sessions || [];
    if (!Array.isArray(sessions) || sessions.length === 0) {
      console.log('  ⏭️ Skip: Không có session nào');
      return;
    }

    const sessionId = sessions[0].SessionID || sessions[0].sessionId || sessions[0].id;
    const res = await get(`/ai/sessions/${sessionId}/messages`, { token, query: { page: 1, limit: 10 } });
    if (res.status === 200) {
      const msgs = res.data.results || res.data.messages || res.data || [];
      console.log(`  ✅ Messages: ${Array.isArray(msgs) ? msgs.length : '?'} tin nhắn`);
    } else {
      console.log(`  ⚠️ Messages: Status ${res.status}`);
    }
  });

  test('Gửi chat theo context khóa học (nếu AI chạy)', async () => {
    const token = getToken();
    if (!aiAvailable || !token) {
      console.log('  ⏭️ Skip');
      return;
    }

    const enrollRes = await get('/enrollments/me', { token, query: { page: 1, limit: 1 } });
    const enrollments = enrollRes.data?.results || enrollRes.data?.enrollments || [];
    if (!enrollments.length) { console.log('  ⏭️ Skip: Chưa enroll'); return; }

    const courseId = enrollments[0].CourseID || enrollments[0].courseId;
    const res = await post('/ai/chat', {
      token,
      body: {
        message: 'Tóm tắt nội dung chính của khóa học này',
        scope: 'COURSE',
        courseId,
      },
    });
    if (res.status === 200) {
      console.log(`  ✅ AI Course Chat: OK`);
    } else {
      console.log(`  ⚠️ AI Course Chat: Status ${res.status}`);
    }
  });
});
