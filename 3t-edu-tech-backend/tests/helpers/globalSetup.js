/**
 * helpers/globalSetup.js
 * ─────────────────────────────────────────────────────────
 * Chạy 1 lần trước khi toàn bộ test suite bắt đầu.
 *
 * [SỬA 19/08/2026] Thêm hai việc:
 *   1. Xóa tests/.state.json — token của lượt chạy trước đã hết hạn, và state
 *      cũ lẫn vào lượt mới sẽ tạo ra những thất bại vô nghĩa rất khó lần.
 *   2. Thăm dò AI Service. KHÔNG dừng nếu nó tắt: phần lớn test không cần AI.
 *      Nhưng phải nói rõ ngay từ đầu, để lúc thấy 17-ai-* đỏ thì biết là do
 *      dịch vụ chưa bật chứ không phải code hỏng.
 */

const { reset } = require('./state');

module.exports = async function globalSetup() {
  const BASE = process.env.API_BASE_URL || 'http://localhost:5000/v1';
  const AI_BASE = process.env.AI_BASE_URL || 'http://localhost:2111';

  reset();
  console.log('\n🧼 Đã xóa tests/.state.json (bắt đầu lượt chạy sạch)');

  console.log('🔍 Kiểm tra kết nối đến backend...');
  try {
    const res = await fetch(`${BASE}/categories`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    console.log('✅ Backend đang chạy tại', BASE);
  } catch (err) {
    console.error('❌ Không kết nối được backend tại', BASE);
    console.error('   Hãy bật hệ thống trước: .\\start.bat (hoặc npm run dev)');
    console.error('   Chi tiết:', err.message);
    process.exit(1);
  }

  console.log('🔍 Thăm dò AI Service...');
  try {
    const res = await fetch(`${AI_BASE}/health`, {
      signal: AbortSignal.timeout(8000),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      const whisper = body?.whisper?.available;
      console.log(
        `✅ AI Service sống tại ${AI_BASE}` +
          (whisper === undefined ? '' : ` (whisper: ${whisper ? 'BẬT' : 'TẮT'})`)
      );
      process.env.__AI_UP = '1';
    } else {
      console.warn(`⚠️  AI Service trả ${res.status} — các test AI sẽ báo lỗi.`);
    }
  } catch (err) {
    console.warn(
      `⚠️  Không gọi được AI Service tại ${AI_BASE} (${err.message}).\n` +
        '    Các test nhóm 17-ai-* sẽ thất bại — đó là do dịch vụ chưa bật,\n' +
        '    không phải do backend hỏng.'
    );
  }

  if (!process.env.TEST_ADMIN_EMAIL) {
    console.log(
      'ℹ️  Chưa đặt TEST_ADMIN_EMAIL — sẽ thử lần lượt các tài khoản admin mặc định.'
    );
  }
  console.log('');
};
