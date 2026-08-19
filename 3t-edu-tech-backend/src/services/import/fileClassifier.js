/* ============================================================================
 * fileClassifier.js
 * [THÊM 18/08/2026 — COURSE IMPORT, Giai đoạn A]
 *
 * Phân loại tệp: đây là VIDEO, TÀI LIỆU, PHỤ ĐỀ, ẢNH hay SIÊU DỮ LIỆU?
 *
 * ----------------------------------------------------------------------------
 * ★ VIỆC NÀY TUYỆT ĐỐI KHÔNG DÙNG LLM
 *
 * Trong các bản kế hoạch có thảo luận việc để Qwen quyết định "file nào là
 * video, cần gọi API nào". Ở đây tách bạch rõ:
 *
 *   • "File này là video hay PDF?"        → BẢNG TRA. Chắc chắn, 0 token, tức thì.
 *   • "Nhóm 50 tệp này thành chương nào?" → mới là việc của LLM (treeAnalyzer).
 *
 * Dùng LLM cho câu hỏi thứ nhất vừa tốn token cho thứ đã biết chắc, vừa CÓ THỂ
 * SAI — mà sai ở bước phân loại thì mọi bước sau đều hỏng theo.
 *
 * ----------------------------------------------------------------------------
 * KIỂM TRA MAGIC BYTES
 *
 * Không chỉ tin phần mở rộng. Giảng viên hay đổi tên file, và một tệp .exe đổi
 * đuôi thành .pdf mà lọt vào bộ bóc text là chuyện không nên xảy ra. Đọc 8 byte
 * đầu để đối chiếu — chi phí không đáng kể vì file đã nằm sẵn trên đĩa.
 * ========================================================================== */

const fs = require('fs/promises');
const path = require('path');

const { isVideoExtension } = require('../../utils/mediaProbe');

/** Loại tệp trong ngữ cảnh nhập khóa học. */
const FileKind = Object.freeze({
  VIDEO: 'VIDEO',
  DOCUMENT: 'DOCUMENT', // pdf, docx, pptx — cần bóc text
  TEXT: 'TEXT', // md, txt — đọc thẳng
  CODE: 'CODE', // py, js, java... — đọc thẳng, giữ nguyên định dạng
  SUBTITLE: 'SUBTITLE', // srt, vtt
  IMAGE: 'IMAGE', // dùng làm ảnh bìa
  METADATA: 'METADATA', // _khoa-hoc.md, _chuong.md
  AUDIO: 'AUDIO',
  UNKNOWN: 'UNKNOWN',
});

const DOCUMENT_EXT = new Set(['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.odt', '.odp']);
const TEXT_EXT = new Set(['.md', '.txt', '.markdown', '.rst']);
const CODE_EXT = new Set([
  '.py', '.js', '.jsx', '.ts', '.tsx', '.java', '.c', '.cpp', '.h', '.cs',
  '.php', '.rb', '.go', '.rs', '.sql', '.html', '.css', '.scss', '.json',
  '.xml', '.yml', '.yaml', '.sh', '.bat', '.ipynb',
]);
const SUBTITLE_EXT = new Set(['.srt', '.vtt', '.ass', '.ssa']);
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg']);
const AUDIO_EXT = new Set(['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac']);

/**
 * Tệp bắt đầu bằng '_' là SIÊU DỮ LIỆU, không phải bài học.
 * Theo quy ước: `_khoa-hoc.md` mô tả khóa, `_chuong.md` mô tả chương.
 */
const METADATA_PREFIX = '_';

/** Chữ ký magic bytes → nhóm định dạng. */
const MAGIC_SIGNATURES = [
  { bytes: [0x25, 0x50, 0x44, 0x46], group: 'pdf' }, // %PDF
  { bytes: [0x50, 0x4b, 0x03, 0x04], group: 'zip' }, // docx/pptx/xlsx đều là ZIP
  { bytes: [0x50, 0x4b, 0x05, 0x06], group: 'zip' }, // ZIP rỗng
  { bytes: [0x89, 0x50, 0x4e, 0x47], group: 'png' },
  { bytes: [0xff, 0xd8, 0xff], group: 'jpeg' },
  { bytes: [0x47, 0x49, 0x46, 0x38], group: 'gif' },
  { bytes: [0x52, 0x49, 0x46, 0x46], group: 'riff' }, // wav / avi / webp
  { bytes: [0x1a, 0x45, 0xdf, 0xa3], group: 'matroska' }, // mkv / webm
  { bytes: [0x49, 0x44, 0x33], group: 'mp3' },
];

/** Nhóm magic hợp lệ cho từng phần mở rộng — dùng để phát hiện đuôi giả. */
const EXPECTED_MAGIC = {
  '.pdf': ['pdf'],
  '.docx': ['zip'],
  '.pptx': ['zip'],
  '.xlsx': ['zip'],
  '.png': ['png'],
  '.jpg': ['jpeg'],
  '.jpeg': ['jpeg'],
  '.gif': ['gif'],
  '.mp4': ['mp4'],
  '.m4v': ['mp4'],
  '.mov': ['mp4'],
  '.mkv': ['matroska'],
  '.webm': ['matroska'],
  '.mp3': ['mp3', 'riff'],
};

/**
 * Đọc 12 byte đầu và đoán nhóm định dạng.
 * @returns {Promise<string|null>}
 */
const detectMagicGroup = async (absolutePath) => {
  let handle;
  try {
    handle = await fs.open(absolutePath, 'r');
    const buf = Buffer.alloc(12);
    const { bytesRead } = await handle.read(buf, 0, 12, 0);
    if (bytesRead < 4) return null;

    for (const sig of MAGIC_SIGNATURES) {
      if (sig.bytes.every((b, i) => buf[i] === b)) return sig.group;
    }

    // MP4/MOV: chữ ký 'ftyp' nằm ở offset 4, không phải offset 0.
    if (buf.toString('latin1', 4, 8) === 'ftyp') return 'mp4';

    return null;
  } catch {
    return null;
  } finally {
    if (handle) await handle.close().catch(() => {});
  }
};

/**
 * Phân loại một tệp.
 *
 * @param {object} file - { relativePath, absolutePath, sizeBytes }
 * @returns {Promise<object>} file kèm { kind, ext, baseName, magicGroup, extMismatch }
 */
const classifyFile = async (file) => {
  const ext = path.extname(file.relativePath).toLowerCase();
  const baseName = path.basename(file.relativePath);

  let kind = FileKind.UNKNOWN;

  if (baseName.startsWith(METADATA_PREFIX) && TEXT_EXT.has(ext)) {
    kind = FileKind.METADATA;
  } else if (isVideoExtension(ext)) {
    kind = FileKind.VIDEO;
  } else if (SUBTITLE_EXT.has(ext)) {
    kind = FileKind.SUBTITLE;
  } else if (DOCUMENT_EXT.has(ext)) {
    kind = FileKind.DOCUMENT;
  } else if (TEXT_EXT.has(ext)) {
    kind = FileKind.TEXT;
  } else if (CODE_EXT.has(ext)) {
    kind = FileKind.CODE;
  } else if (IMAGE_EXT.has(ext)) {
    kind = FileKind.IMAGE;
  } else if (AUDIO_EXT.has(ext)) {
    kind = FileKind.AUDIO;
  }

  /* Chỉ soi magic bytes với các loại sẽ được XỬ LÝ THẬT (bóc text, đọc thời
     lượng). Với .txt/.md thì không có magic bytes cố định nào để so, và soi
     mọi file chỉ tốn thêm lượt I/O vô ích. */
  let magicGroup = null;
  let extMismatch = false;

  /* [SỬA 18/08/2026] Thêm điều kiện `file.absolutePath`.
     Từ nay video KHÔNG được giải nén ra đĩa (xem safeExtract.js), nên
     `absolutePath` của chúng là `null`. Gọi `detectMagicGroup(null)` sẽ ném lỗi
     ngay ở `fs.open` và làm hỏng cả lần nhập.

     Không soi được magic bytes của video cũng không mất mát gì: tệp đã không
     nằm trên máy chủ thì cũng chẳng có thư viện nào của ta đọc nó — rủi ro
     "đổi đuôi tệp" mà phép kiểm tra này sinh ra để chặn đã biến mất cùng với
     tệp. Việc kiểm tra định dạng thật chuyển sang Cloudinary lúc tải lên. */
  if (
    file.absolutePath &&
    (kind === FileKind.VIDEO || kind === FileKind.DOCUMENT || kind === FileKind.IMAGE)
  ) {
    magicGroup = await detectMagicGroup(file.absolutePath);
    const expected = EXPECTED_MAGIC[ext];
    if (expected && magicGroup && !expected.includes(magicGroup)) {
      extMismatch = true;
      // Hạ về UNKNOWN để không đưa vào bộ bóc text. Một tệp đổi đuôi có thể
      // làm thư viện phân tích tài liệu hành xử bất thường.
      kind = FileKind.UNKNOWN;
    }
  }

  return { ...file, ext, baseName, kind, magicGroup, extMismatch };
};

/** Phân loại cả danh sách, TUẦN TỰ để không mở quá nhiều file cùng lúc. */
const classifyAll = async (files) => {
  const out = [];
  for (const file of files) {
    out.push(await classifyFile(file));
  }
  return out;
};

/** Loại tệp có thể trở thành một BÀI HỌC. */
const LESSON_KINDS = new Set([
  FileKind.VIDEO,
  FileKind.DOCUMENT,
  FileKind.TEXT,
  FileKind.CODE,
]);

const isLessonCandidate = (file) => LESSON_KINDS.has(file.kind);

module.exports = {
  FileKind,
  classifyFile,
  classifyAll,
  detectMagicGroup,
  isLessonCandidate,
  LESSON_KINDS,
  METADATA_PREFIX,
};
