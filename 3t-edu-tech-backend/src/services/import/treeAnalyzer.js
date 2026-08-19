/* ============================================================================
 * treeAnalyzer.js
 * [THÊM 18/08/2026 — COURSE IMPORT, Giai đoạn A]
 *
 * ★ TIER 0 — SUY RA CẤU TRÚC KHÓA HỌC MÀ KHÔNG TỐN MỘT TOKEN NÀO.
 *
 * ----------------------------------------------------------------------------
 * Ý TƯỞNG CỐT LÕI: TÊN FILE LÀ MỎ VÀNG BỊ BỎ QUÊN
 *
 * Một tệp ZIP thật của giảng viên thường trông thế này:
 *
 *     Nhap-mon-Python/
 *     ├── 01 - Giới thiệu/
 *     │   ├── 01 - Python là gì.pdf
 *     │   └── 02 - Cài đặt môi trường.mp4
 *     └── 02 - Biến và kiểu dữ liệu/
 *         └── 01 - Biến.pptx
 *
 * Cấu trúc khóa học ĐÃ NẰM SẴN Ở ĐÓ. Tên thư mục = chương. Số đầu tên = thứ tự.
 * Đuôi tệp = loại bài học. Toàn bộ file này chỉ làm một việc: đọc ra thông tin
 * vốn đã có, thay vì trả tiền cho LLM đoán lại.
 *
 * ----------------------------------------------------------------------------
 * ĐIỂM TIN CẬY — CƠ CHẾ QUYẾT ĐỊNH KHI NÀO CẦN AI
 *
 * Không phải ZIP nào cũng gọn gàng. Hàm `analyzeTree` trả về kèm một điểm
 * 0..1 nói "tôi tin cấu trúc suy ra được đến mức nào":
 *
 *     ≥ 0,75  → dùng luôn kết quả Tier 0        (0 token)
 *     < 0,75  → để LLM nhóm lại ở Giai đoạn B   (tốn token, nhưng chỉ khi cần)
 *
 * Nhờ vậy quy ước đặt tên KHÔNG thay thế AI mà chỉ khiến AI không phải làm
 * phần việc dễ sai nhất — phần đoán mò.
 * ========================================================================== */

const path = require('path');

const { FileKind, isLessonCandidate } = require('./fileClassifier');
const { pairKey, stripLanguageSuffix } = require('../../utils/zipEncoding');

/** Ngưỡng để chấp nhận kết quả Tier 0 mà không cần LLM. */
const CONFIDENCE_THRESHOLD = 0.75;

/**
 * Nhận diện tiền tố thứ tự ở đầu tên: "01 - ", "02.", "Bai 3", "Chuong 2 -"...
 *
 * Ba nhóm mẫu, thử theo thứ tự cụ thể → tổng quát:
 *   1. "Bai 3", "Bài 3", "Chuong 2", "Chương 2", "Lesson 4", "Section 1"
 *   2. "01 - ", "02.", "03_", "04)"
 *   3. "1" đứng một mình ở đầu
 */
const ORDER_PATTERNS = [
  /^(?:b[àa]i|ch[uư][oơ]ng|ph[àa]n|lesson|section|chapter|part|unit)\s*[-_.)]?\s*(\d{1,3})\b/i,
  /^(\d{1,3})\s*[-_.)]\s*/,
  /^(\d{1,3})(?=\D|$)/,
];

/**
 * Tách số thứ tự khỏi tên, trả về cả số lẫn phần tên còn lại.
 * @returns {{order: number|null, label: string}}
 */
const parseOrderPrefix = (rawName) => {
  const name = String(rawName).trim();

  for (const re of ORDER_PATTERNS) {
    const m = name.match(re);
    if (m) {
      const order = parseInt(m[1], 10);
      // Bỏ phần đã khớp, rồi dọn dấu phân cách còn sót ở đầu.
      const label = name.slice(m[0].length).replace(/^[\s\-_.)]+/, '').trim();
      return { order, label: label || name };
    }
  }
  return { order: null, label: name };
};

/**
 * Làm sạch tên để hiển thị: bỏ đuôi tệp, đổi gạch/gạch dưới thành khoảng trắng,
 * viết hoa chữ đầu.
 *
 * KHÔNG đụng tới dấu tiếng Việt — chuỗi đã ở dạng NFC từ zipEncoding.
 */
const humanizeName = (rawName, { stripExtension = true } = {}) => {
  let name = String(rawName);
  if (stripExtension) name = name.replace(/\.[^.]+$/, '');

  /* Phân biệt hai kiểu đặt tên, vì gạch ngang mang hai ý nghĩa khác nhau:
   *
   *   "Nhap-mon-Python"        → dạng slug, gạch THAY CHO khoảng trắng
   *                              → "Nhap mon Python"
   *   "01 - Giới thiệu - Phần 2" → gạch là dấu phân tách CÓ CHỦ Ý
   *                              → giữ nguyên
   *
   * Dấu hiệu nhận biết: tên dạng slug thì KHÔNG có khoảng trắng nào.
   * Không phân biệt thì "Nhap-mon-Python" ra "Nhap - mon - Python" — sai. */
  const isSlugStyle = !/\s/.test(name) && /[-_]/.test(name);

  name = isSlugStyle
    ? name.replace(/[-_]+/g, ' ')
    : name.replace(/_+/g, ' ');

  name = name.replace(/\s{2,}/g, ' ').trim();

  if (!name) return name;
  return name.charAt(0).toLocaleUpperCase('vi-VN') + name.slice(1);
};

/**
 * Cắt chuỗi cho vừa giới hạn cột NVARCHAR.
 *
 * Cần thiết vì `Courses.CourseName` là NVARCHAR(500) còn `Lessons.LessonName`
 * chỉ NVARCHAR(255). Tên thư mục dài hơn thế là INSERT đổ — và mất cả job.
 */
const truncate = (s, max) => {
  const str = String(s || '').trim();
  return str.length <= max ? str : `${str.slice(0, max - 1)}…`;
};

/**
 * Ghép phụ đề với video.
 *
 * Ba phép chuẩn hóa (xem utils/zipEncoding.pairKey):
 *   NFC · chữ thường · bỏ đuôi
 * cộng thêm việc bỏ hậu tố ngôn ngữ cho riêng file phụ đề.
 *
 * ★ Cố ý ghép theo TÊN GỐC, không theo thư mục — rất nhiều giảng viên để phụ
 * đề trong thư mục `subs/` riêng. Ghép chéo thư mục là hành vi đúng ở đây.
 *
 * @returns {Map<string, object>} khóa ghép → tệp phụ đề
 */
/* ============================================================================
 * [SỬA 19/08/2026] PHỤ ĐỀ BỊ GHÉP NHẦM SANG CHƯƠNG KHÁC
 *
 * ★ LỖI CÓ SẴN TỪ TRƯỚC, phát hiện khi viết kiểm thử cho việc gộp tài liệu.
 *
 * Bản cũ đánh chỉ mục phụ đề bằng `pairKey()` — hàm này CHỈ lấy tên tệp và bỏ
 * hoàn toàn đường dẫn thư mục. Hậu quả với cấu trúc rất phổ biến sau:
 *
 *     01 - Nhập môn/01-gioi-thieu.mp4
 *     01 - Nhập môn/01-gioi-thieu.srt     ← phụ đề của chương 1
 *     02 - Biến/01-gioi-thieu.mp4         ← chương 2, TRÙNG TÊN, không có .srt
 *
 * Bài của chương 2 nhận phụ đề của chương 1. Học viên xem bài "Biến" mà phụ đề
 * chạy nội dung bài "Nhập môn" — sai lệch hoàn toàn, và KHÔNG có lỗi nào báo
 * ra. Đặt tên bài trùng nhau giữa các chương là chuyện rất thường gặp.
 *
 * ★ CÁCH SỬA: ưu tiên CÙNG THƯ MỤC, chỉ mở rộng khi thật sự cần
 *
 * Không thể chỉ đơn giản khóa cứng theo thư mục, vì có giảng viên để phụ đề
 * trong một thư mục riêng:
 *
 *     Chương 1/01-gioi-thieu.mp4
 *     phu-de/01-gioi-thieu.srt
 *
 * Nên dùng hai tầng:
 *   1. Cùng thư mục với video → khớp. Đây là trường hợp áp đảo.
 *   2. Không thấy → tìm trong các thư mục CHỈ CHỨA phụ đề (không có video
 *      nào). Một thư mục như vậy đúng là "kho phụ đề dùng chung"; còn thư mục
 *      có video thì phụ đề trong đó thuộc về video của chính nó, không được
 *      cho mượn sang chương khác.
 * ========================================================================== */
const buildSubtitleIndex = (files) => {
  /* Thư mục nào có video → phụ đề trong đó là "của riêng" thư mục ấy. */
  const dirsCoVideo = new Set();
  for (const f of files) {
    if (f.kind === FileKind.VIDEO) dirsCoVideo.add(path.dirname(f.relativePath));
  }

  const theoThuMuc = new Map(); // "<thư mục>|<tên>" → tệp phụ đề
  const dungChung = new Map(); // "<tên>" → tệp phụ đề, từ thư mục kho phụ đề

  for (const file of files) {
    if (file.kind !== FileKind.SUBTITLE) continue;
    const ten = stripLanguageSuffix(pairKey(file.relativePath));
    const thuMuc = path.dirname(file.relativePath);

    // Trùng khóa: giữ tệp ĐẦU TIÊN. Đổi ngược lại thì "bai1.en.srt" sẽ ghi đè
    // "bai1.vi.srt" chỉ vì thứ tự duyệt — và người Việt sẽ nhận phụ đề tiếng Anh.
    const khoaThuMuc = `${thuMuc}|${ten}`;
    if (!theoThuMuc.has(khoaThuMuc)) theoThuMuc.set(khoaThuMuc, file);

    if (!dirsCoVideo.has(thuMuc) && !dungChung.has(ten)) {
      dungChung.set(ten, file);
    }
  }

  /* Trả về một đối tượng có `get()` để chỗ gọi không phải đổi.
     Tham số là ĐƯỜNG DẪN TƯƠNG ĐỐI của video, không phải khóa đã dựng sẵn —
     vì chỉ ở đây mới biết cần tra theo hai tầng. */
  return {
    get(videoRelativePath) {
      const ten = stripLanguageSuffix(pairKey(videoRelativePath));
      const thuMuc = path.dirname(videoRelativePath);
      return theoThuMuc.get(`${thuMuc}|${ten}`) || dungChung.get(ten) || null;
    },
  };
};

/**
 * Sắp xếp: có số thứ tự thì theo số; không có thì theo tên, dùng so sánh
 * "tự nhiên" để "Bai2" đứng trước "Bai10" (so sánh chuỗi thường cho ngược lại).
 */
const naturalCompare = (a, b) => {
  if (a.order !== null && b.order !== null && a.order !== b.order) {
    return a.order - b.order;
  }
  if (a.order !== null && b.order === null) return -1;
  if (a.order === null && b.order !== null) return 1;
  return String(a.label).localeCompare(String(b.label), 'vi', { numeric: true });
};

/**
 * Tìm thư mục gốc chung.
 *
 * Người dùng thường nén CẢ thư mục khóa học, nên mọi đường dẫn đều bắt đầu
 * bằng "Ten-Khoa-Hoc/". Nếu không bóc lớp này ra thì toàn bộ khóa học chỉ có
 * đúng MỘT chương tên "Ten-Khoa-Hoc" — sai hoàn toàn.
 *
 * @returns {string} tiền tố chung (kèm '/'), hoặc '' nếu không có
 */
const findCommonRoot = (files) => {
  const tops = new Set();
  let hasRootLevelFile = false;

  for (const f of files) {
    const parts = f.relativePath.split('/');
    if (parts.length === 1) {
      hasRootLevelFile = true;
      break;
    }
    tops.add(parts[0]);
  }

  // Có tệp nằm ngay gốc, hoặc có nhiều thư mục cấp 1 → không có gốc chung.
  if (hasRootLevelFile || tops.size !== 1) return '';
  return `${[...tops][0]}/`;
};

/**
 * ★ HÀM CHÍNH — dựng cấu trúc khóa học từ cây thư mục.
 *
 * @param {Array} files - đã qua classifyAll()
 * @param {object} options - { zipFileName }
 * @returns {object} bản nháp đề xuất + điểm tin cậy
 */
/* ============================================================================
 * [THÊM 19/08/2026] Gộp tài liệu cùng tên vào bài học video
 *
 * ★ VẤN ĐỀ
 *
 * Thư mục bài giảng thường có cặp tệp đi liền nhau:
 *
 *     01-gioi-thieu.mp4      ← video bài giảng
 *     01-gioi-thieu.txt      ← nội dung/ghi chú của CHÍNH bài đó
 *
 * Cả hai đều là "ứng viên bài học", nên bản cũ tạo ra HAI bài học trùng tên:
 * một VIDEO và một TEXT. Giảng viên nhìn vào bản nháp thấy khóa học phình gấp
 * đôi số bài, và phải ngồi bỏ tick từng cái.
 *
 * ★ CÁCH GIẢI
 *
 * Dùng đúng cơ chế mà PHỤ ĐỀ đã dùng từ đầu: khớp theo tên tệp bỏ phần mở rộng.
 * Tài liệu nào trùng tên với một video thì không thành bài học riêng nữa — nó
 * trở thành NỘI DUNG của bài video đó (`textContent`).
 *
 * ★ VÌ SAO KHÓA CÓ KÈM THƯ MỤC, KHÁC VỚI PHỤ ĐỀ
 *
 * `pairKey()` chỉ lấy tên tệp, bỏ qua đường dẫn. Với phụ đề thì chấp nhận
 * được, nhưng ở đây thì không: hai chương khác nhau rất hay có cùng một tên
 * bài ("01-gioi-thieu"), và gộp nhầm thì tài liệu của Chương 2 biến mất vào
 * bài video của Chương 1 — mất nội dung mà không có lỗi nào báo ra.
 *
 * Vì vậy khóa ở đây là `<thư mục>|<tên không đuôi>`.
 * ========================================================================== */

/** Khóa ghép cặp CÓ PHẠM VI THƯ MỤC. */
const scopedPairKey = (relativePath) =>
  `${path.dirname(relativePath)}|${pairKey(relativePath)}`;

/**
 * Tìm các tệp tài liệu là "bạn đồng hành" của một video cùng tên.
 *
 * @returns {{companionByVideo: Map<string, object>, companionPaths: Set<string>}}
 *   `companionByVideo`  : khóa phạm vi của video → tệp tài liệu đi kèm
 *   `companionPaths`    : đường dẫn các tệp KHÔNG được tính là bài học riêng
 */
const buildCompanionIndex = (lessonFiles) => {
  const videoKeys = new Set();
  for (const f of lessonFiles) {
    if (f.kind === FileKind.VIDEO) videoKeys.add(scopedPairKey(f.relativePath));
  }

  const companionByVideo = new Map();
  const companionPaths = new Set();

  for (const f of lessonFiles) {
    if (f.kind === FileKind.VIDEO) continue;
    const key = scopedPairKey(f.relativePath);
    if (!videoKeys.has(key)) continue;

    /* Trùng khóa: giữ tệp ĐẦU TIÊN — cùng quy tắc với buildSubtitleIndex, để
       hành vi của hai cơ chế ghép cặp không khác nhau một cách khó đoán.
       (Ví dụ có cả "bai1.txt" lẫn "bai1.pdf" cạnh "bai1.mp4".) */
    if (!companionByVideo.has(key)) companionByVideo.set(key, f);
    companionPaths.add(f.relativePath);
  }

  return { companionByVideo, companionPaths };
};

const analyzeTree = (files, options = {}) => {
  const allLessonCandidates = files.filter(isLessonCandidate);

  /* [THÊM 19/08/2026] Loại tài liệu trùng tên với video ra khỏi danh sách bài
     học — chúng sẽ được gắn vào chính bài video đó ở vòng lặp bên dưới. */
  const { companionByVideo, companionPaths } =
    buildCompanionIndex(allLessonCandidates);
  const lessonFiles = allLessonCandidates.filter(
    (f) => !companionPaths.has(f.relativePath)
  );

  const subtitleIndex = buildSubtitleIndex(files);
  const commonRoot = findCommonRoot(files);

  // --- Siêu dữ liệu do giảng viên cung cấp (_khoa-hoc.md / _chuong.md) ---
  const courseMeta = files.find(
    (f) =>
      f.kind === FileKind.METADATA &&
      /^_?(khoa-hoc|khoahoc|course|_course)/i.test(f.baseName)
  );
  const sectionMetaByDir = new Map();
  for (const f of files) {
    if (f.kind !== FileKind.METADATA || f === courseMeta) continue;
    sectionMetaByDir.set(path.dirname(f.relativePath), f);
  }

  // --- Gom bài học theo thư mục cha ---
  const groups = new Map();
  for (const file of lessonFiles) {
    const relative = commonRoot
      ? file.relativePath.slice(commonRoot.length)
      : file.relativePath;
    const dir = path.dirname(relative);
    const dirKey = dir === '.' ? '' : dir;

    if (!groups.has(dirKey)) groups.set(dirKey, []);
    groups.get(dirKey).push({ ...file, relativeInRoot: relative });
  }

  // --- Dựng chương ---
  const sections = [];
  for (const [dirKey, groupFiles] of groups) {
    // Thư mục lồng nhiều cấp → lấy đoạn ĐẦU làm tên chương, các cấp sâu hơn
    // gộp vào cùng chương đó. Khóa học 3 cấp là hiếm và gộp lại vẫn hợp lý hơn
    // là tạo ra hàng chục chương một-bài.
    const topDir = dirKey ? dirKey.split('/')[0] : '';
    const parsedDir = parseOrderPrefix(topDir || 'Nội dung khóa học');

    let section = sections.find((s) => s.sourceDir === topDir);
    if (!section) {
      const meta = sectionMetaByDir.get(
        commonRoot ? `${commonRoot}${topDir}` : topDir
      );
      section = {
        sourceDir: topDir,
        order: parsedDir.order,
        sectionName: truncate(humanizeName(parsedDir.label, { stripExtension: false }), 255),
        description: meta ? { fromFile: meta.relativePath } : null,
        lessons: [],
      };
      sections.push(section);
    }

    for (const file of groupFiles) {
      /* ⚠️ Bỏ đuôi tệp TRƯỚC khi tách số thứ tự.
         Nếu để nguyên "Bai1.MP4", mẫu nhận diện coi dấu '.' là dấu phân tách
         sau số và trả về label = "MP4" — tên bài học thành "MP4". */
      const baseNoExt = path.basename(file.relativePath).replace(/\.[^.]+$/, '');
      const parsedFile = parseOrderPrefix(baseNoExt);
      /* [SỬA 19/08/2026] Truyền ĐƯỜNG DẪN, không phải khóa đã dựng sẵn.
         Chỉ mục phụ đề nay tra theo hai tầng (cùng thư mục trước, kho phụ đề
         dùng chung sau) nên nó cần biết cả thư mục — xem buildSubtitleIndex. */
      const subtitle = subtitleIndex.get(file.relativePath);
      const companion =
        file.kind === FileKind.VIDEO
          ? companionByVideo.get(scopedPairKey(file.relativePath)) || null
          : null;

      section.lessons.push({
        order: parsedFile.order,
        label: parsedFile.label,
        lessonName: truncate(humanizeName(parsedFile.label, { stripExtension: false }), 255),
        lessonType: file.kind === FileKind.VIDEO ? 'VIDEO' : 'TEXT',
        sourcePath: file.relativePath,
        absolutePath: file.absolutePath,
        sizeBytes: file.sizeBytes,
        fileKind: file.kind,
        ext: file.ext,
        subtitlePath: subtitle ? subtitle.relativePath : null,
        subtitleAbsolutePath: subtitle ? subtitle.absolutePath : null,
        /* [THÊM 18/08/2026] Bài học video đang CHỜ giảng viên gắn nguồn video.
           Nội dung video không còn được giải nén ra máy chủ (xem safeExtract.js),
           nên `absolutePath` của chúng luôn là null. Giao diện dùng cờ này để
           dựng danh sách "cần gắn video" ở bước 4. */
        needsVideo: file.kind === FileKind.VIDEO && !file.absolutePath,
        /* Tên tệp video gốc — dùng để KHỚP TỰ ĐỘNG khi giảng viên chọn một lượt
           nhiều tệp video ở bước 4, để họ không phải chỉ định thủ công tệp nào
           ứng với bài nào. Chỉ giữ phần tên tệp, bỏ đường dẫn: trình duyệt chỉ
           cho biết `file.name`, không cho biết thư mục chứa nó. */
        videoFileName:
          file.kind === FileKind.VIDEO
            ? path.basename(file.relativePath)
            : null,
        /* [THÊM 19/08/2026] Tệp tài liệu trùng tên với video này.
           Bộ bóc text sẽ đọc nó và đổ vào `textContent` của CHÍNH bài video —
           thay vì tạo thêm một bài học riêng trùng tên (xem buildCompanionIndex).
           `null` khi bài không phải video, hoặc video không có tài liệu đi kèm. */
        companionPath: companion ? companion.relativePath : null,
        companionAbsolutePath: companion ? companion.absolutePath : null,
        durationSeconds: null, // mediaProbe điền sau
        textContent: null, // bộ bóc text điền sau
        selected: true, // giảng viên có thể bỏ tick
      });
    }
  }

  // --- Sắp thứ tự ---
  sections.sort(naturalCompare);
  sections.forEach((section, sIdx) => {
    section.lessons.sort(naturalCompare);
    // ⚠️ SectionOrder bắt đầu từ 0 — khớp với ràng buộc trong
    // sections.service.updateSectionsOrder ("phải liên tục và bắt đầu từ 0").
    section.sectionOrder = sIdx;
    section.lessons.forEach((lesson, lIdx) => {
      lesson.lessonOrder = lIdx;
    });
  });

  // --- Tên khóa học ---
  const rawCourseName =
    (commonRoot && commonRoot.slice(0, -1)) ||
    (options.zipFileName || '').replace(/\.zip$/i, '') ||
    'Khóa học mới';

  const confidence = scoreStructure({
    sections,
    lessonFiles,
    hasCommonRoot: Boolean(commonRoot),
  });

  return {
    courseName: truncate(humanizeName(rawCourseName, { stripExtension: false }), 500),
    courseMetaPath: courseMeta ? courseMeta.relativePath : null,
    sections,
    confidence: confidence.score,
    confidenceDetail: confidence.detail,
    needsAiGrouping: confidence.score < CONFIDENCE_THRESHOLD,
    stats: {
      totalLessons: sections.reduce((n, s) => n + s.lessons.length, 0),
      totalSections: sections.length,
      videoCount: lessonFiles.filter((f) => f.kind === FileKind.VIDEO).length,
      subtitleMatched: sections.reduce(
        (n, s) => n + s.lessons.filter((l) => l.subtitlePath).length,
        0
      ),
      /* [THÊM 19/08/2026] Số tài liệu đã được gộp vào bài video cùng tên thay
         vì tạo thành bài học riêng. Đưa vào thống kê để giảng viên thấy được
         việc gộp đã xảy ra — một thay đổi âm thầm làm số bài học ít đi so với
         số tệp trong ZIP sẽ khiến người ta tưởng hệ thống bỏ sót tệp. */
      companionsMerged: companionPaths.size,
    },
  };
};

/**
 * Chấm điểm độ tin cậy của cấu trúc suy ra được.
 *
 * Ba tín hiệu, cộng lại tối đa 1,0:
 *   0,45 — có thư mục con (mỗi thư mục là một chương)
 *   0,40 — tỉ lệ tệp có tiền tố số (thứ tự rõ ràng)
 *   0,15 — tên tệp có nghĩa (không phải "final_v2.pdf", "IMG_1234.pdf")
 *
 * Trọng số đặt theo mức độ tin cậy thực tế: có thư mục con là tín hiệu mạnh
 * nhất về ý định phân chương của giảng viên.
 */
const scoreStructure = ({ sections, lessonFiles, hasCommonRoot }) => {
  const detail = {};
  let score = 0;

  // 1. Có thư mục con thật sự (không tính thư mục gốc chung)
  const realSections = sections.filter((s) => s.sourceDir !== '');
  detail.hasSubdirectories = realSections.length > 0;
  if (realSections.length > 0) {
    // Nhiều chương → tin hơn. 1 chương thì chỉ được nửa điểm.
    score += realSections.length >= 2 ? 0.45 : 0.25;
  }

  // 2. Tỉ lệ tệp có tiền tố số
  const numbered = lessonFiles.filter(
    (f) => parseOrderPrefix(path.basename(f.relativePath)).order !== null
  ).length;
  const numberedRatio = lessonFiles.length ? numbered / lessonFiles.length : 0;
  detail.numberedRatio = Number(numberedRatio.toFixed(2));
  score += 0.4 * numberedRatio;

  // 3. Tên tệp có nghĩa: dài hơn 4 ký tự và không phải mẫu máy sinh
  const MACHINE_NAME = /^(img|dsc|image|video|scan|untitled|new|doc|file)[\s_-]?\d*$/i;
  const meaningful = lessonFiles.filter((f) => {
    const base = path.basename(f.relativePath).replace(/\.[^.]+$/, '');
    const { label } = parseOrderPrefix(base);
    return label.length > 4 && !MACHINE_NAME.test(label);
  }).length;
  const meaningfulRatio = lessonFiles.length ? meaningful / lessonFiles.length : 0;
  detail.meaningfulNameRatio = Number(meaningfulRatio.toFixed(2));
  score += 0.15 * meaningfulRatio;

  detail.hasCommonRoot = hasCommonRoot;

  return { score: Number(Math.min(1, score).toFixed(2)), detail };
};

module.exports = {
  analyzeTree,
  parseOrderPrefix,
  humanizeName,
  buildSubtitleIndex,
  findCommonRoot,
  scoreStructure,
  truncate,
  CONFIDENCE_THRESHOLD,
};
