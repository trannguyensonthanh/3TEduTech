# -*- coding: utf-8 -*-
import io, sys
ROOT = sys.argv[1]
def read(p): return io.open(ROOT + p, encoding='utf-8').read()
def write(p, s): io.open(ROOT + p, 'w', encoding='utf-8', newline='\n').write(s)
def sub(s, old, new, label):
    assert s.count(old) == 1, 'KHONG TIM THAY: ' + label
    return s.replace(old, new)

p = '/3t-edu-tech-backend/src/api/imports/imports.controller.js'
s = read(p)

s = sub(s, """  const result = await importService.generateQuiz(
    req.user,
    req.params.jobId,
    req.body?.questionsPerLesson
  );
  res.status(httpStatus.OK).send(result);
});""",
"""  const result = await importService.generateQuiz(
    req.user,
    req.params.jobId,
    req.body?.questionsPerLesson,
    req.body?.difficulty
  );
  res.status(httpStatus.OK).send(result);
});

/**
 * PUT /v1/imports/:jobId/quiz — lưu câu hỏi giảng viên đã sửa.
 *
 * [THÊM 20/08/2026] Trước đây câu hỏi do AI soạn là chỉ đọc: sai một chữ cũng
 * phải soạn lại toàn bộ đề (đốt thêm một lượt gọi mô hình và mất cả những câu
 * đang tốt) hoặc bỏ hết rồi gõ lại trong trang Sửa khóa học.
 */
const saveQuiz = catchAsync(async (req, res) => {
  const result = await importService.saveQuizEdits(
    req.user,
    req.params.jobId,
    req.body
  );
  res.status(httpStatus.OK).send(result);
});

/**
 * GET /v1/imports/:jobId/preview?path=... — phát một tệp trong bản nháp.
 *
 * [THÊM 20/08/2026] Để giảng viên XEM video (và ảnh bìa) trước khi bấm tạo
 * khóa học. Tệp đã nằm trên đĩa máy chủ sau khi giải nén nhưng chưa lên
 * Cloudinary, nên không có URL công khai nào trỏ tới nó.
 *
 * ── VÌ SAO PHẢI HỖ TRỢ HTTP RANGE ────────────────────────────────────────
 * Không có nó, thẻ <video> phải tải TRỌN tệp trước khi phát được khung hình
 * đầu tiên, và thanh tua kéo đi đâu cũng không nhảy được. Với video bài giảng
 * hàng trăm MB thì đó là không dùng được. Trình duyệt gửi `Range: bytes=0-` cho
 * yêu cầu đầu tiên và chỉ chấp nhận tua khi máy chủ đáp `Accept-Ranges: bytes`.
 *
 * Ba hàng rào an toàn nằm ở tầng service (`resolvePreviewFile`): kiểm quyền sở
 * hữu, tra đường dẫn tuyệt đối TỪ BẢN NHÁP chứ không từ tham số client, và
 * kiểm tra đường dẫn nằm trong thư mục của job.
 */
const previewFile = catchAsync(async (req, res) => {
  const { absolutePath, mimeType, fileName } =
    await importService.resolvePreviewFile(
      req.user,
      req.params.jobId,
      req.query.path
    );

  const stat = await fs.stat(absolutePath);
  const total = stat.size;

  /* `Content-Disposition: inline` + tên tệp đã mã hóa: trình duyệt hiển thị
     tại chỗ với các kiểu nó hiểu, và tải xuống với kiểu octet-stream. */
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader(
    'Content-Disposition',
    `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`
  );
  /* Nội dung riêng tư của một bản nháp — không cho proxy hay CDN nào giữ lại. */
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const range = req.headers.range;
  if (!range) {
    res.setHeader('Content-Length', total);
    fs.createReadStream(absolutePath).pipe(res);
    return;
  }

  const match = /^bytes=(\\d*)-(\\d*)$/.exec(range);
  if (!match) {
    res.status(416).setHeader('Content-Range', `bytes */${total}`).end();
    return;
  }

  let start = match[1] ? parseInt(match[1], 10) : 0;
  let end = match[2] ? parseInt(match[2], 10) : total - 1;

  if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= total) {
    res.status(416).setHeader('Content-Range', `bytes */${total}`).end();
    return;
  }
  if (end >= total) end = total - 1;

  res.status(206);
  res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
  res.setHeader('Content-Length', end - start + 1);
  fs.createReadStream(absolutePath, { start, end }).pipe(res);
});""", 'generateQuiz controller')

s = sub(s, """  generateQuiz,
  acceptImport,
  cancelImport,
};""",
"""  generateQuiz,
  saveQuiz,
  previewFile,
  acceptImport,
  cancelImport,
};""", 'exports controller')

# them import fs
first_require = s.index("const httpStatus = require('http-status').status;")
s = s[:first_require] + "const fs = require('fs');\n" + s[first_require:]
write(p, s)
print('imports.controller.js OK')
