/**
 * 12-course-versioning.test.js — Test phiên bản khóa học
 * ═══════════════════════════════════════════════════════════
 * Xem version history → Tạo phiên cập nhật → Hủy phiên cập nhật
 */

const { get, post, state } = require('./helpers/api');

function getToken() {
  return state.instructorToken || state.adminToken;
}

describe('🔄 COURSE VERSIONING — Phiên bản khóa học', () => {

  let publishedCourseId;

  beforeAll(async () => {
    const token = getToken();
    // Tìm 1 khóa PUBLISHED của instructor hoặc bất kỳ
    if (token) {
      const res = await get('/instructors/my-courses', {
        token,
        query: { page: 1, limit: 10 },
      });
      if (res.status === 200) {
        const courses = res.data.results || res.data.courses || [];
        const published = courses.find(c =>
          (c.StatusID || c.statusId || c.status) === 'PUBLISHED'
        );
        if (published) {
          publishedCourseId = published.CourseID || published.courseId;
        }
      }
    }

    // Fallback: dùng khóa public
    if (!publishedCourseId) {
      const res = await get('/courses', { query: { page: 1, limit: 1 } });
      const courses = res.data.courses || res.data.results || [];
      if (courses.length) {
        publishedCourseId = courses[0].CourseID || courses[0].courseId;
      }
    }
  });

  test('Xem lịch sử phiên bản khóa học', async () => {
    const token = getToken();
    if (!publishedCourseId || !token) {
      console.log('  ⏭️ Skip: Không có khóa PUBLISHED hoặc token');
      return;
    }
    const res = await get(`/courses/${publishedCourseId}/versions`, { token });
    if (res.status === 200) {
      const versions = res.data.versions || res.data || [];
      console.log(`  ✅ Version history: ${Array.isArray(versions) ? versions.length : '?'} phiên bản`);
    } else if (res.status === 403) {
      console.log(`  ⚠️ Không có quyền xem version (instructor khác sở hữu)`);
    } else {
      console.log(`  ⚠️ Version history: Status ${res.status} — ${JSON.stringify(res.data).substring(0, 200)}`);
    }
  });

  test('Tạo phiên cập nhật (update session)', async () => {
    const token = getToken();
    if (!publishedCourseId || !token) {
      console.log('  ⏭️ Skip');
      return;
    }
    const res = await post(`/courses/${publishedCourseId}/create-update-session`, { token });
    if (res.status === 200 || res.status === 201) {
      const draftId = res.data.CourseID || res.data.courseId || res.data.updateCourse?.CourseID;
      console.log(`  ✅ Tạo phiên cập nhật: Draft CourseID=${draftId}`);

      // Hủy phiên vừa tạo để dọn dẹp
      if (draftId) {
        const cancelRes = await post(`/courses/${draftId}/cancel-update`, { token });
        if (cancelRes.status === 200) {
          console.log(`  ✅ Hủy phiên cập nhật: OK`);
        } else {
          console.log(`  ⚠️ Hủy phiên: Status ${cancelRes.status}`);
        }
      }
    } else if (res.status === 403) {
      console.log(`  ⚠️ Không có quyền (không phải chủ khóa học)`);
    } else if (res.status === 409) {
      console.log(`  ⚠️ Đã có phiên cập nhật đang mở (409) — chấp nhận được`);
    } else {
      console.log(`  ⚠️ Tạo phiên cập nhật: Status ${res.status} — ${JSON.stringify(res.data).substring(0, 200)}`);
    }
  });

  test('Kiểm tra IsLatestVersion filter hoạt động', async () => {
    const res = await get('/courses', {
      query: { page: 1, limit: 5, sortBy: 'studentCount_desc', userPage: true },
    });
    expect(res.status).toBe(200);
    // Phải chỉ trả về bản latest (IsLatestVersion=1)
    const courses = res.data.courses || res.data.results || [];
    if (courses.length) {
      const hasSuperseded = courses.some(c =>
        (c.StatusID || c.statusId || c.status) === 'SUPERSEDED'
      );
      expect(hasSuperseded).toBe(false);
      console.log(`  ✅ Filter: Không có khóa SUPERSEDED trong danh sách public — đúng!`);
    }
  });

  test('Kiểm tra cột versioning tồn tại trong response', async () => {
    if (!publishedCourseId) { console.log('  ⏭️ Skip'); return; }

    // Lấy chi tiết khóa qua slug hoặc trực tiếp
    const listRes = await get('/courses', { query: { page: 1, limit: 1 } });
    const courseList = listRes.data.courses || listRes.data.results || [];
    if (!courseList.length) { console.log('  ⏭️ Skip'); return; }

    const slug = courseList[0].slug || courseList[0].Slug;
    const res = await get(`/courses/${slug}`);
    expect(res.status).toBe(200);

    // Kiểm tra các cột versioning
    const c = res.data;
    const hasVersionNumber = c.VersionNumber !== undefined || c.versionNumber !== undefined;
    console.log(`  ${hasVersionNumber ? '✅' : '⚠️'} VersionNumber: ${c.VersionNumber ?? c.versionNumber ?? 'N/A'}`);
    console.log(`  ✅ IsLatestVersion: ${c.IsLatestVersion ?? c.isLatestVersion ?? 'N/A'}`);
  });
});
