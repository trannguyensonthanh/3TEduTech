# -*- coding: utf-8 -*-
import io, sys
ROOT = sys.argv[1]
def read(p): return io.open(ROOT + p, encoding='utf-8').read()
def write(p, s): io.open(ROOT + p, 'w', encoding='utf-8', newline='\n').write(s)
def sub(s, old, new, label):
    assert s.count(old) == 1, 'KHONG TIM THAY: ' + label
    return s.replace(old, new)

p = '/3t-edu-tech-backend/src/api/imports/imports.service.js'
s = read(p)

s = sub(s, "const generateQuiz = async (user, jobId, questionsPerLesson = 3) => {",
        "const generateQuiz = async (\n"
        "  user,\n"
        "  jobId,\n"
        "  questionsPerLesson = 3,\n"
        "  difficulty = 'mixed'\n"
        ") => {", 'chu ky generateQuiz')

s = sub(s, """        course_name: proposal.courseName || 'Khóa học',
        lessons: payloadLessons,
        questions_per_lesson: Math.max(1, Math.min(5, questionsPerLesson)),
      },""",
"""        course_name: proposal.courseName || 'Khóa học',
        lessons: payloadLessons,
        questions_per_lesson: Math.max(1, Math.min(5, questionsPerLesson)),
        /* [THÊM 20/08/2026] Độ khó do giảng viên chọn.
           Kẹp lại ở đây thay vì tin thẳng giá trị đi qua: Joi đã kiểm rồi,
           nhưng hàm này còn được gọi từ nơi khác trong tương lai, và một chuỗi
           lạ lọt vào prompt là một đường tiêm chỉ dẫn cho mô hình. */
        difficulty: ['easy', 'medium', 'hard', 'mixed'].includes(difficulty)
          ? difficulty
          : 'mixed',
      },""", 'payload difficulty')

# --- Them ham luu cau hoi da sua + ham xem truoc media ---
ANCHOR = """module.exports = {
  createImportJob,
  getJobStatus,
  getProposal,
  listMyJobs,
  cancelJob,
  enrichProposal,
  generateQuiz,
  acceptProposal,
};"""

NEW_FUNCS = '''/* ============================================================================
 * [THÊM 20/08/2026] LƯU CÂU HỎI GIẢNG VIÊN ĐÃ SỬA
 *
 * Ghi bản đã sửa vào chính bản nháp trên Redis. Nguyên tắc "nội dung câu hỏi
 * KHÔNG nhận từ payload chấp nhận" vẫn giữ nguyên: `acceptProposal` tiếp tục
 * đọc `job.proposed` phía máy chủ. Khác biệt là bản nháp ấy nay phản ánh đúng
 * thứ giảng viên nhìn thấy trên màn hình, thay vì đóng băng ở bản AI vừa sinh.
 *
 * Đối chiếu theo `sourcePath` — cùng khóa mà `acceptProposal` dùng. Bài học nào
 * client gửi lên mà không có trong bản nháp thì BỎ QUA, không tạo mới: nếu chấp
 * nhận khóa lạ, client tự thêm được câu hỏi cho những bài không tồn tại và
 * `acceptProposal` sẽ đọc phải rác.
 *
 * @param {object} user
 * @param {string} jobId
 * @param {object} body - { lessons: [{ sourcePath, questions: [...] }] }
 */
const saveQuizEdits = async (user, jobId, body) => {
  const job = await getOwnedJob(user, jobId);

  if (job.status !== importStore.ImportStatus.READY) {
    throw new ApiError(
      httpStatus.CONFLICT,
      `Bản nháp không ở trạng thái sửa được (hiện tại: ${job.status}).`
    );
  }

  const proposal = job.proposed;
  if (!proposal || !Array.isArray(proposal.sections)) {
    throw new ApiError(httpStatus.CONFLICT, 'Bản nháp không hợp lệ.');
  }

  // Lập chỉ mục bài học theo sourcePath để tra một lượt thay vì lồng hai vòng.
  const lessonByPath = new Map();
  proposal.sections.forEach((section) => {
    (section.lessons || []).forEach((lesson) => {
      if (lesson.sourcePath) lessonByPath.set(lesson.sourcePath, lesson);
    });
  });

  let totalQuestions = 0;
  let lessonsWithQuiz = 0;
  let boQua = 0;

  for (const item of body.lessons || []) {
    const lesson = lessonByPath.get(item.sourcePath);
    if (!lesson) {
      boQua += 1;
      continue;
    }

    const questions = Array.isArray(item.questions) ? item.questions : [];
    if (questions.length === 0) {
      /* Mảng rỗng = giảng viên đã xóa hết câu hỏi của bài này. Đó là một lựa
         chọn hợp lệ, nên phải XÓA thật chứ không bỏ qua — bỏ qua thì đề cũ
         vẫn nằm nguyên trong bản nháp và quay lại lúc tạo khóa học. */
      delete lesson.quizQuestions;
      continue;
    }

    lesson.quizQuestions = questions.map((q) => ({
      question: String(q.question).trim(),
      options: q.options.map((o) => String(o).trim()),
      correctIndex: q.correctIndex,
      explanation: typeof q.explanation === 'string' ? q.explanation.trim() : '',
    }));

    totalQuestions += questions.length;
    lessonsWithQuiz += 1;
  }

  if (boQua > 0) {
    logger.warn(
      `[Import] Bỏ qua ${boQua} bài học không có trong bản nháp khi lưu câu hỏi (job ${jobId}).`
    );
  }

  await importStore.patch(jobId, { proposed: proposal });

  logger.info(
    `[Import] Giảng viên lưu ${totalQuestions} câu hỏi cho ${lessonsWithQuiz} bài (job ${jobId}).`
  );

  return {
    proposal: sanitizeProposalForClient(proposal),
    totalQuestions,
    lessonsWithQuiz,
  };
};

/* ============================================================================
 * [THÊM 20/08/2026] XEM TRƯỚC TỆP TRONG BẢN NHÁP
 *
 * Giảng viên cần XEM video trước khi bấm tạo khóa học. Trước đây không có
 * đường nào: video đã nằm trên đĩa máy chủ sau khi giải nén, nhưng chưa lên
 * Cloudinary nên không có URL công khai, và bản nháp cố ý giấu `absolutePath`.
 * Kết quả là giảng viên duyệt một khóa học mà chưa từng nhìn thấy nội dung của
 * nó — đúng thứ bước duyệt sinh ra để tránh.
 *
 * ── BA HÀNG RÀO, VÌ ĐÂY LÀ TUYẾN ĐỌC TỆP TỪ ĐĨA MÁY CHỦ ──────────────────
 *
 * 1. QUYỀN SỞ HỮU — `getOwnedJob` đã chặn người khác đọc job không phải của
 *    mình (trả 404 chứ không phải 403, để không xác nhận job có tồn tại).
 *
 * 2. CHỈ TRA TRONG BẢN NHÁP — đường dẫn tuyệt đối KHÔNG lấy từ tham số client
 *    gửi lên. Client gửi `sourcePath`, máy chủ tra ngược trong `job.proposed`
 *    để lấy `absolutePath`. Client không có cách nào trỏ tới một tệp không nằm
 *    trong bản nháp của chính họ.
 *
 * 3. KIỂM TRA CHỨA — dù đã tra qua bản nháp, vẫn xác nhận đường dẫn thật sự
 *    nằm trong thư mục của job. Đây là lớp phòng vệ thừa một cách có chủ đích:
 *    nếu sau này ai đó đổi cách dựng bản nháp và để lọt một đường dẫn ngoài,
 *    hàng rào này vẫn đứng.
 *
 * @returns {Promise<{absolutePath: string, mimeType: string, fileName: string}>}
 */
const resolvePreviewFile = async (user, jobId, sourcePath) => {
  const job = await getOwnedJob(user, jobId);

  if (!job.proposed) {
    throw new ApiError(httpStatus.CONFLICT, 'Bản nháp chưa sẵn sàng.');
  }

  const duong = String(sourcePath || '').trim();
  if (!duong) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Thiếu đường dẫn tệp.');
  }

  let absolutePath = null;
  let fileName = null;

  // Ảnh bìa là trường hợp riêng: nó không nằm trong danh sách bài học.
  const cover = job.proposed.coverImage;
  if (cover && cover.relativePath === duong && cover.absolutePath) {
    absolutePath = cover.absolutePath;
    fileName = path.basename(cover.relativePath);
  } else {
    for (const section of job.proposed.sections || []) {
      for (const lesson of section.lessons || []) {
        if (lesson.sourcePath === duong && lesson.absolutePath) {
          absolutePath = lesson.absolutePath;
          fileName = path.basename(lesson.sourcePath);
          break;
        }
      }
      if (absolutePath) break;
    }
  }

  if (!absolutePath) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Không tìm thấy tệp này trong bản nháp, hoặc tệp không được giải nén ra đĩa.'
    );
  }

  // Hàng rào 3 — kiểm tra chứa.
  const thuMucJob = path.resolve(jobDir(jobId));
  const duongThat = path.resolve(absolutePath);
  if (
    duongThat !== thuMucJob &&
    !duongThat.startsWith(thuMucJob + path.sep)
  ) {
    logger.error(
      `[Import] CHẶN đọc tệp ngoài thư mục job ${jobId}: ${duongThat}`
    );
    throw new ApiError(httpStatus.FORBIDDEN, 'Đường dẫn tệp không hợp lệ.');
  }

  try {
    await fs.access(duongThat);
  } catch {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Tệp đã bị dọn khỏi máy chủ. Bản nháp có thể đã quá hạn.'
    );
  }

  return {
    absolutePath: duongThat,
    fileName: fileName || path.basename(duongThat),
    mimeType: doanKieuNoiDung(duongThat),
  };
};

/** Đoán Content-Type từ phần mở rộng — chỉ cho các định dạng xem trước được. */
const doanKieuNoiDung = (duong) => {
  const ext = path.extname(duong).toLowerCase();
  const bang = {
    '.mp4': 'video/mp4',
    '.m4v': 'video/mp4',
    '.mov': 'video/quicktime',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    '.avi': 'video/x-msvideo',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.srt': 'text/plain; charset=utf-8',
    '.vtt': 'text/vtt; charset=utf-8',
    '.pdf': 'application/pdf',
  };
  /* Mặc định `application/octet-stream` để trình duyệt TẢI XUỐNG thay vì hiển
     thị. Đoán đại một kiểu nội dung cho tệp lạ nghĩa là để trình duyệt tự diễn
     giải nội dung do người ngoài tải lên — đường đi kinh điển của XSS lưu trữ. */
  return bang[ext] || 'application/octet-stream';
};

''' + ANCHOR.replace("""  acceptProposal,
};""", """  acceptProposal,
  saveQuizEdits,
  resolvePreviewFile,
};""")

s = sub(s, ANCHOR, NEW_FUNCS, 'module.exports')
write(p, s)
print('OK')
