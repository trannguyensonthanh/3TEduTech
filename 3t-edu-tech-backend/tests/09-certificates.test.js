/**
 * 09-certificates.test.js — Test chứng chỉ
 * ═══════════════════════════════════════════════════════════
 */

const { get, post, patch, state } = require('./helpers/api');

function getToken() {
  return state.studentToken || state.adminToken || state.instructorToken;
}

describe('🏆 CERTIFICATES — Chứng chỉ', () => {

  let testCourseId;
  let certificateCode;

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

  test('Xem danh sách chứng chỉ của tôi', async () => {
    const token = getToken();
    if (!token) { console.log('  ⏭️ Skip'); return; }
    const res = await get('/certificates/me', { token });
    expect(res.status).toBe(200);
    const certs = Array.isArray(res.data) ? res.data : (res.data.results || res.data.certificates || []);
    console.log(`  ✅ My certificates: ${certs.length} chứng chỉ`);
    if (certs.length > 0) {
      certificateCode = certs[0].CertificateCode || certs[0].certificateCode;
    }
  });

  test('Kiểm tra đủ điều kiện nhận chứng chỉ', async () => {
    const token = getToken();
    if (!token || !testCourseId) { console.log('  ⏭️ Skip'); return; }
    const res = await get(`/certificates/eligibility/${testCourseId}`, { token });
    if (res.status === 200) {
      console.log(`  ✅ Eligibility: ${res.data.eligible ? 'Đủ điều kiện' : 'Chưa đủ'}`);
    } else {
      console.log(`  ⚠️ Eligibility: Status ${res.status}`);
    }
  });

  test('Cấp chứng chỉ (nếu đủ điều kiện)', async () => {
    const token = getToken();
    if (!token || !testCourseId) { console.log('  ⏭️ Skip'); return; }
    const res = await post(`/certificates/issue/${testCourseId}`, { token });
    if (res.status === 200 || res.status === 201) {
      certificateCode = res.data.CertificateCode || res.data.certificateCode;
      console.log(`  ✅ Cấp chứng chỉ: Code=${certificateCode}`);
    } else {
      console.log(`  ⚠️ Cấp chứng chỉ: ${res.status} — chưa đủ điều kiện hoặc đã cấp`);
    }
  });

  test('Xác minh chứng chỉ (public)', async () => {
    if (!certificateCode) { console.log('  ⏭️ Skip: Không có certificate code'); return; }
    const res = await get(`/certificates/verify/${certificateCode}`);
    if (res.status === 200) {
      console.log(`  ✅ Xác minh: Chứng chỉ hợp lệ`);
    } else {
      console.log(`  ⚠️ Xác minh: Status ${res.status}`);
    }
  });

  test('Xác minh mã không tồn tại → 400/404', async () => {
    const res = await get('/certificates/verify/FAKE-CODE-XYZ-12345');
    expect([400, 404]).toContain(res.status);
    console.log(`  ✅ Mã giả: Trả về ${res.status} đúng`);
  });
});
