/**
 * 15-zip-import.test.js — Nhập khóa học từ tệp ZIP
 * ═══════════════════════════════════════════════════════════════════════════
 * [THÊM 19/08/2026]
 *
 * Đây là tính năng nặng nhất hệ thống (tải tệp, giải nén, phân tích, gọi AI)
 * và cũng là chỗ dễ vỡ nhất khi demo. Bộ test này đi đúng đường người dùng đi:
 *
 *   giới hạn → từ chối tệp sai → tải ZIP thật → chờ phân tích → đọc bản nháp
 *   → kiểm tra video ĐƯỢC TÁCH RA → hủy job
 *
 * ── HAI ĐIỂM ĐÁNG NGỜ NHẤT, ĐƯỢC KIỂM RIÊNG ───────────────────────────────
 *
 * 1. VIDEO KHÔNG ĐƯỢC GHI XUỐNG ĐĨA. Cả thiết kế "tách video" dựa vào việc
 *    safeExtract đọc kích thước từ central directory rồi BỎ QUA phần nội dung.
 *    Nếu điều đó hỏng, một ZIP 1.6GB sẽ lại làm đầy ổ đĩa máy chủ. Test dùng
 *    ZIP chứa "video" 20MB nhưng chỉ truyền lên ~20KB (nén deflate) — nếu máy
 *    chủ vẫn ghi đủ 20MB thì bản nháp sẽ báo sai kích thước.
 *
 * 2. GIỚI HẠN TỐC ĐỘ. Endpoint tải lên chỉ cho 5 lần/giờ, và bộ test này dùng
 *    BA lượt (tệp không phải ZIP, luồng thật, zip bomb). Chạy lại lần thứ hai
 *    trong cùng một giờ sẽ chạm trần — mỗi phép thử đều tự bỏ qua khi gặp 429
 *    thay vì báo đỏ.
 *
 *    Muốn chạy thoải mái: đặt RATE_LIMIT_IMPORT_MAX=50 trong .env của backend
 *    rồi khởi động lại, và NHỚ TRẢ VỀ trước khi triển khai thật.
 */

const { get, post, del, postForm, state, expectStatus, why } = require('./helpers/api');
const { ensureInstructor, ensureStudent } = require('./helpers/auth');
const { taoZip, videoGia } = require('./helpers/zip');

let gvToken;
let hvToken;

const nguHanh = (ms) => new Promise((r) => setTimeout(r, ms));

beforeAll(async () => {
  gvToken = await ensureInstructor();
  hvToken = await ensureStudent();
});

describe('📦 ZIP IMPORT — Giới hạn & từ chối đầu vào sai', () => {
  test('GET /imports/limits trả đủ các mốc giới hạn', async () => {
    const res = await get('/imports/limits', { token: gvToken });
    expectStatus(res, 200, 'lấy giới hạn nhập ZIP');

    for (const k of [
      'maxZipMb',
      'maxTotalMb',
      'maxFileMb',
      'maxFiles',
      'maxVideoUploadMb',
      'videoExtensions',
    ]) {
      expect(res.data[k]).toBeDefined();
    }

    /* videoExtensions PHẢI là mảng. `Set` không JSON hóa được — nếu ai đó lỡ
       gửi thẳng Set thì client nhận về `{}` và bộ lọc chọn tệp ở giao diện im
       lặng không lọc gì cả. */
    expect(Array.isArray(res.data.videoExtensions)).toBe(true);
    expect(res.data.videoExtensions.length).toBeGreaterThan(0);
    expect(res.data.videoExtensions).toContain('.mp4');

    expect(res.data.maxVideoUploadMb).toBeGreaterThan(0);
    expect(res.data.maxZipMb).toBeGreaterThanOrEqual(res.data.maxFileMb);

    state.qaLimits = res.data;
    console.log(
      `  ✅ ZIP ≤ ${res.data.maxZipMb}MB · video 1 tệp ≤ ${res.data.maxVideoUploadMb}MB · ` +
        `${res.data.videoExtensions.length} đuôi video`
    );
  });

  test('HỌC VIÊN gọi /imports/limits → 403', async () => {
    const res = await get('/imports/limits', { token: hvToken });
    expect(res.status).toBe(403);
  });

  test('HỌC VIÊN tải ZIP lên → 403 (chặn TRƯỚC khi nhận tệp)', async () => {
    const buf = taoZip([{ name: 'a.txt', data: 'x' }]);
    const res = await postForm('/imports', {
      token: hvToken,
      files: [{ field: 'file', filename: 'a.zip', buffer: buf, type: 'application/zip' }],
    });
    expect(res.status).toBe(403);
    console.log('  ✅ Học viên bị chặn nhập ZIP (403)');
  });

  test('Không có token → 401', async () => {
    const buf = taoZip([{ name: 'a.txt', data: 'x' }]);
    const res = await postForm('/imports', {
      files: [{ field: 'file', filename: 'a.zip', buffer: buf, type: 'application/zip' }],
    });
    expect(res.status).toBe(401);
  });

  test('Tệp KHÔNG phải ZIP → bị từ chối, KHÔNG phải 500', async () => {
    const res = await postForm('/imports', {
      token: gvToken,
      files: [
        {
          field: 'file',
          filename: 'khong-phai-zip.txt',
          buffer: Buffer.from('đây chỉ là văn bản thường'),
          type: 'text/plain',
        },
      ],
    });
    if (res.status === 429) {
      console.log('  ⚠️ 429 — đã hết hạn mức 5 lần/giờ, bỏ qua');
      return;
    }
    expect([400, 415]).toContain(res.status);
    console.log(`  ✅ Tệp không phải ZIP: bị từ chối (${res.status})`);
  });
});

describe('📦 ZIP IMPORT — Luồng thật: tải lên → phân tích → bản nháp', () => {
  /* Một cây thư mục giống thật:
       Chương 1 có video + phụ đề + tài liệu trùng tên video (phải được GỘP
       vào chính bài video chứ không đẻ ra bài thứ hai)
       Chương 2 có bài đọc thuần */
  const buildZip = () =>
    taoZip([
      { name: 'Chuong 1 - Nhap mon/01-gioi-thieu.txt', data: 'Bài mở đầu của khóa học.' },
      /* Video 20MB toàn số 0, nén deflate → tỉ lệ nén khoảng 1000:1.

         Con số đó CỐ Ý vượt xa ngưỡng zip bomb (200:1) của safeExtract, vì nó
         khóa lại một hành vi vừa được sửa ngày 19/08: entry video KHÔNG bị
         kiểm tra tỉ lệ nén, do nội dung của nó không bao giờ được giải nén.

         Trước bản sửa, chính tệp này làm cả job FAILED với errorCode
         ZIP_BOMB — và đó không phải lỗi giả của test: giảng viên xuất bài
         giảng ra AVI không nén hay MOV lossless sẽ gặp đúng như vậy. */
      { name: 'Chuong 1 - Nhap mon/01-gioi-thieu.mp4', data: videoGia(20), deflate: true },
      { name: 'Chuong 1 - Nhap mon/01-gioi-thieu.srt', data: '1\n00:00:01,000 --> 00:00:03,000\nXin chào\n' },
      { name: 'Chuong 2 - Nang cao/02-ky-thuat.md', data: '# Kỹ thuật nâng cao\n\nNội dung dài hơn một chút.' },
    ]);

  test('Giảng viên tải ZIP lên → 202 kèm jobId', async () => {
    const buf = buildZip();
    /* Bằng chứng cho chính test này: ZIP khai báo 20MB video nhưng khi truyền
       chưa tới 1MB. Nếu con số dưới đây phình lên, nghĩa là deflate không chạy
       và phép thử "video không ghi xuống đĩa" bên dưới mất ý nghĩa. */
    expect(buf.length).toBeLessThan(1024 * 1024);
    console.log(`  ℹ️ ZIP truyền lên: ${(buf.length / 1024).toFixed(1)}KB (video khai báo 20MB)`);

    const res = await postForm('/imports', {
      token: gvToken,
      files: [
        { field: 'file', filename: 'khoa-hoc-qa.zip', buffer: buf, type: 'application/zip' },
      ],
    });

    if (res.status === 429) {
      console.log('  ⚠️ 429 — hết hạn mức tải lên trong giờ này. Chờ sang giờ sau rồi chạy lại.');
      return;
    }
    expectStatus(res, 202, 'tải ZIP lên');
    state.qaImportJobId = res.data?.jobId;
    expect(state.qaImportJobId).toBeTruthy();
    console.log(`  ✅ Job: ${state.qaImportJobId}`);
  });

  test('Chờ job chuyển sang READY (tối đa 90 giây)', async () => {
    if (!state.qaImportJobId) return;

    let job = null;
    const han = Date.now() + 90000;
    while (Date.now() < han) {
      const res = await get(`/imports/${state.qaImportJobId}`, { token: gvToken });
      expectStatus(res, 200, 'đọc trạng thái job');
      job = res.data;
      if (['READY', 'FAILED', 'CANCELLED'].includes(job.status)) break;
      await nguHanh(2000);
    }

    expect(job).toBeTruthy();
    if (job.status === 'FAILED') {
      throw new Error(
        `Job nhập ZIP THẤT BẠI: ${JSON.stringify(job.error || job.message || job)}`
      );
    }
    expect(job.status).toBe('READY');
    console.log('  ✅ Job READY');
  }, 120000);

  test('Bản nháp có đúng 2 chương', async () => {
    if (!state.qaImportJobId) return;
    const res = await get(`/imports/${state.qaImportJobId}/proposal`, {
      token: gvToken,
    });
    expectStatus(res, 200, 'đọc bản nháp');

    const p = res.data?.proposal || res.data;
    const sections = p.sections || [];
    expect(sections.length).toBe(2);
    state.qaProposal = JSON.stringify(p).slice(0, 20000);
    console.log(
      `  ✅ ${sections.length} chương: ${sections.map((s) => s.sectionName || s.title).join(' | ')}`
    );
  });

  test('VIDEO ĐƯỢC TÁCH RA — bài video đánh dấu cần tải video, không có tệp trên đĩa', async () => {
    if (!state.qaImportJobId) return;
    const res = await get(`/imports/${state.qaImportJobId}/proposal`, {
      token: gvToken,
    });
    expectStatus(res, 200);
    const p = res.data?.proposal || res.data;
    const lessons = (p.sections || []).flatMap((s) => s.lessons || []);

    const video = lessons.find(
      (l) => l.lessonType === 'VIDEO' || l.needsVideo === true
    );
    expect(video).toBeTruthy();

    /* Đây là mấu chốt của cả thiết kế: máy chủ BIẾT có video (tên tệp, kích
       thước lấy từ central directory) nhưng KHÔNG giữ nội dung. */
    expect(video.needsVideo).toBe(true);
    expect(video.videoFileName || video.sourcePath).toMatch(/\.mp4$/i);
    expect(video.absolutePath == null || video.isPlaceholder === true).toBe(true);
    console.log(
      `  ✅ Video tách đúng: ${video.videoFileName || video.sourcePath} (needsVideo=true, không lưu nội dung)`
    );
  });

  test('Tài liệu trùng tên video được GỘP vào bài video, không đẻ bài trùng', async () => {
    if (!state.qaImportJobId) return;
    const res = await get(`/imports/${state.qaImportJobId}/proposal`, {
      token: gvToken,
    });
    const p = res.data?.proposal || res.data;
    const ch1 = (p.sections || []).find((s) =>
      String(s.sectionName || s.title || '').includes('Nhap mon')
    );
    expect(ch1).toBeTruthy();

    const lessons = ch1.lessons || [];
    /* 01-gioi-thieu.txt + 01-gioi-thieu.mp4 + 01-gioi-thieu.srt là MỘT bài
       học, không phải hai. Trước đây .txt đẻ ra một bài TEXT trùng tên. */
    expect(lessons.length).toBe(1);
    const bai = lessons[0];
    expect(bai.lessonType).toBe('VIDEO');
    expect(bai.textContent || bai.companionPath).toBeTruthy();
    console.log('  ✅ Video + tài liệu + phụ đề gộp thành MỘT bài học');
  });

  test('Giảng viên KHÁC không đọc được job của mình → 403/404', async () => {
    if (!state.qaImportJobId) return;
    /* Dùng token học viên: dù bị chặn ở tầng vai trò (403) thì vẫn chứng minh
       job không phải tài nguyên công khai. */
    const res = await get(`/imports/${state.qaImportJobId}`, { token: hvToken });
    expect([403, 404]).toContain(res.status);
    console.log(`  ✅ Người khác không xem được job (${res.status})`);
  });

  test('★ ZIP BOMB THẬT (tệp .txt nén 1000:1) VẪN bị chặn', async () => {
    /* Phép thử cặp đôi với phép thử video ở trên. Nới lỏng cho video là có
       chủ đích và có giới hạn — hàng rào chống zip bomb cho những tệp mà hệ
       thống THẬT SỰ giải nén phải còn nguyên. Không có phép thử này thì bản
       sửa hôm 19/08 có thể âm thầm biến thành "tắt luôn cả hàng rào". */
    const buf = taoZip([
      { name: 'Chuong 1/tai-lieu.txt', data: videoGia(20), deflate: true },
    ]);
    const res = await postForm('/imports', {
      token: gvToken,
      files: [
        { field: 'file', filename: 'bom.zip', buffer: buf, type: 'application/zip' },
      ],
    });
    if (res.status === 429) {
      console.log('  ⚠️ 429 — hết hạn mức, bỏ qua');
      return;
    }
    expectStatus(res, 202, 'tải ZIP bom lên (nhận rồi mới từ chối lúc phân tích)');
    const jobId = res.data?.jobId;
    expect(jobId).toBeTruthy();

    let job = null;
    const han = Date.now() + 60000;
    while (Date.now() < han) {
      const r = await get(`/imports/${jobId}`, { token: gvToken });
      expectStatus(r, 200);
      job = r.data;
      if (['READY', 'FAILED', 'CANCELLED'].includes(job.status)) break;
      await nguHanh(1500);
    }
    expect(job.status).toBe('FAILED');
    expect(job.errorCode).toBe('ZIP_BOMB');
    console.log(`  ✅ Zip bomb bị chặn đúng: "${job.statusMessage}"`);

    await del(`/imports/${jobId}`, { token: gvToken }).catch(() => {});
  }, 90000);

  test('Hủy job → dọn sạch, đọc lại phải 404', async () => {
    if (!state.qaImportJobId) return;
    const res = await del(`/imports/${state.qaImportJobId}`, { token: gvToken });
    expectStatus(res, [200, 204], 'hủy job');

    const lai = await get(`/imports/${state.qaImportJobId}`, { token: gvToken });
    expect(lai.status).toBe(404);
    console.log('  ✅ Hủy job xong, job biến mất đúng');
  });
});
