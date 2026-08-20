/* ============================================================================
 * safeExtract.js
 * [THÊM 18/08/2026 — COURSE IMPORT, Giai đoạn A]
 *
 * Giải nén ZIP do NGƯỜI DÙNG tải lên — bề mặt tấn công kinh điển.
 *
 * ----------------------------------------------------------------------------
 * BỐN LỖ HỔNG BẮT BUỘC CHẶN
 *
 * 1. ZIP SLIP (path traversal)
 *    Entry tên "../../../../app/src/config/index.js" → ghi đè file hệ thống khi
 *    giải nén. Đây là lỗ hổng đã khiến hàng nghìn dự án dính CVE.
 *    → Chặn: resolve đường dẫn rồi kiểm tra nó có nằm trong thư mục đích không.
 *      Phải kiểm tra SAU khi resolve, vì "a/../../b" chỉ lộ ra sau chuẩn hóa.
 *
 * 2. ZIP BOMB
 *    File 42KB nở ra 4,5 petabyte → đầy ổ, sập máy chủ. Với ổ đĩa đang gần cạn
 *    của bạn thì chỉ cần vài trăm MB là đủ gây sự cố.
 *    → Chặn ba tầng: tỉ lệ nén từng entry, tổng dung lượng, số lượng file.
 *      Tất cả kiểm tra TRƯỚC khi ghi byte đầu tiên (nhờ đọc central directory).
 *
 * 3. SYMLINK ESCAPE
 *    Entry là symlink trỏ ra ngoài thư mục đích. Kín đáo hơn Zip Slip nhiều vì
 *    tên entry trông hoàn toàn bình thường.
 *    → Chặn: bỏ qua mọi entry không phải file thường (zipReader đã phát hiện).
 *
 * 4. ARCHIVE LỒNG NHAU
 *    ZIP trong ZIP trong ZIP... → bùng nổ đệ quy.
 *    → Chặn: KHÔNG giải nén đệ quy. Một tầng là đủ cho nghiệp vụ này.
 *
 * ----------------------------------------------------------------------------
 * [THÊM 18/08/2026] BỎ QUA NỘI DUNG VIDEO — `skipContentExtensions`
 *
 * Video KHÔNG còn được ghi ra đĩa. Ta chỉ lấy TÊN và KÍCH THƯỚC của chúng từ
 * thư mục trung tâm (central directory) của ZIP — đủ để dựng cây chương–bài và
 * để giao diện biết bài nào đang chờ video.
 *
 * ★ VÌ SAO
 *
 * Một khóa học thật nặng hàng GB, gần như toàn bộ là video. Nếu giải nén ra
 * đĩa thì một lần nhập cần gấp đôi dung lượng đó (tệp ZIP + phần đã giải nén),
 * trong khi máy chủ chỉ có ổ EBS 20–30GB dùng chung cho mọi thứ. Và cuối cùng
 * video vẫn phải rời máy chủ để lên Cloudinary — máy chủ chỉ làm trạm trung
 * chuyển tốn kém.
 *
 * Nay video đi thẳng từ trình duyệt lên Cloudinary ở bước 4, hoặc giảng viên
 * dán link YouTube. Máy chủ không chạm vào một byte video nào.
 *
 * ★ HỆ QUẢ CẦN BIẾT
 *
 * Byte của video KHÔNG được cộng vào `totalBytes`, nên `maxTotalBytes` giờ chỉ
 * áp cho tài liệu và phụ đề. Cố ý: giới hạn đó sinh ra để chặn zip bomb làm đầy
 * ổ, mà thứ không ghi ra đĩa thì không thể làm đầy ổ.
 *
 * Giới hạn `maxFileBytes` cũng không áp cho video vì lý do tương tự.
 * ========================================================================== */

const fs = require('fs/promises');
const path = require('path');

const { readCentralDirectory, extractEntryToFile, ZipError } = require('./zipReader');
const logger = require('../../utils/logger');

/* --------------------------------------------------------------------------
 * Ngưỡng an toàn
 * ------------------------------------------------------------------------ */

/**
 * Tỉ lệ nén tối đa cho một entry.
 *
 * Vì sao 200 chứ không phải 100: file .txt hoặc .srt toàn văn bản tiếng Việt
 * lặp lại có thể nén thật sự tới hơn 100 lần mà hoàn toàn lành tính. Zip bomb
 * thực tế có tỉ lệ hàng NGHÌN tới hàng TRIỆU lần, nên 200 vẫn chặn được thừa
 * sức mà không báo nhầm tài liệu thật.
 */
const MAX_COMPRESSION_RATIO = 200;

/** Bỏ qua kiểm tra tỉ lệ với file nhỏ — tỉ lệ ở kích thước này không có ý nghĩa. */
const RATIO_CHECK_MIN_SIZE = 1024 * 1024; // 1MB

/** Tên thư mục/tệp rác sinh bởi hệ điều hành, luôn bỏ qua. */
const JUNK_PATTERNS = [
  /^__MACOSX\//,
  /(^|\/)\.DS_Store$/,
  /(^|\/)Thumbs\.db$/i,
  /(^|\/)desktop\.ini$/i,
  /(^|\/)\._[^/]*$/, // AppleDouble
  /(^|\/)\.git\//,
  /(^|\/)node_modules\//,
  /(^|\/)\.idea\//,
  /(^|\/)\.vscode\//,
  /(^|\/)~\$[^/]*$/, // file tạm của Microsoft Office
];

/** Archive lồng nhau — chấp nhận nhưng KHÔNG giải nén tiếp. */
const NESTED_ARCHIVE = /\.(zip|rar|7z|tar|gz|bz2|xz)$/i;

class ImportRejectedError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'ImportRejectedError';
    this.code = code;
  }
}

const isJunk = (name) => JUNK_PATTERNS.some((re) => re.test(name));

/**
 * Kiểm tra đường dẫn đích có nằm gọn trong thư mục đích không.
 *
 * `path.resolve` chuẩn hóa mọi ".." và "." trước khi so sánh — đây là mấu chốt.
 * Phép so sánh phải kèm `path.sep` ở cuối để "/tmp/import-evil" không lọt qua
 * khi thư mục đích là "/tmp/import".
 */
const isInsideDir = (destDir, targetPath) => {
  const resolvedDir = path.resolve(destDir);
  const resolvedTarget = path.resolve(targetPath);
  return (
    resolvedTarget === resolvedDir ||
    resolvedTarget.startsWith(resolvedDir + path.sep)
  );
};

/**
 * Kiểm tra toàn bộ ZIP TRƯỚC khi ghi ra đĩa.
 *
 * Tách riêng khỏi bước ghi là có chủ đích: mọi quyết định từ chối đều xảy ra
 * khi chưa có một byte nào chạm vào ổ cứng. Nếu vừa ghi vừa kiểm tra thì một
 * zip bomb đã kịp làm đầy ổ trước khi ta phát hiện.
 *
 * @returns {{accepted: Array, skipped: Array, totalBytes: number}}
 */
const auditEntries = (entries, destDir, limits) => {
  const accepted = [];
  const skipped = [];
  let totalBytes = 0;

  /* Phần mở rộng mà ta CHỈ đọc tên + kích thước, không ghi nội dung ra đĩa.
     Truyền vào từ importPipeline (lấy từ fileClassifier) chứ không ghi cứng ở
     đây — safeExtract không nên biết gì về nghiệp vụ "thế nào là video". */
  const ratioExemptExt =
    limits.ratioExemptExtensions instanceof Set
      ? limits.ratioExemptExtensions
      : new Set();

  const extOf = (name) => {
    const i = name.lastIndexOf('.');
    return i === -1 ? '' : name.slice(i).toLowerCase();
  };

  for (const entry of entries) {
    const reject = (reason) => skipped.push({ name: entry.name, reason });

    // --- Bỏ qua (không phải lỗi) ---
    if (entry.isDirectory) continue;
    if (isJunk(entry.name)) {
      reject('Tệp rác của hệ điều hành');
      continue;
    }

    // --- Chặn cứng (dấu hiệu tấn công) ---
    if (entry.isSymlink) {
      // Ghi log mức warn: đây có thể là dấu hiệu tấn công thật sự, không phải
      // chuyện thường ngày như tệp .DS_Store.
      logger.warn(
        `[SafeExtract] Bỏ qua symlink trong tệp ZIP: ${entry.name} → có thể là mưu toan thoát khỏi thư mục đích.`
      );
      reject('Liên kết tượng trưng (symlink) không được phép');
      continue;
    }

    if (path.isAbsolute(entry.name) || entry.name.includes('..')) {
      const target = path.join(destDir, entry.name);
      if (!isInsideDir(destDir, target)) {
        logger.error(
          `[SafeExtract] 🚫 PHÁT HIỆN ZIP SLIP: "${entry.name}" cố ghi ra ngoài thư mục đích.`
        );
        throw new ImportRejectedError(
          'Tệp ZIP chứa đường dẫn không hợp lệ (cố ghi ra ngoài thư mục cho phép). ' +
            'Tệp này bị từ chối vì lý do an toàn.',
          'ZIP_SLIP'
        );
      }
    }

    if (entry.isEncrypted) {
      reject('Tệp được bảo vệ bằng mật khẩu');
      continue;
    }

    if (NESTED_ARCHIVE.test(entry.name)) {
      // Không ném lỗi — chỉ bỏ qua. Giảng viên có thể vô tình để lẫn một file
      // .zip tài liệu tham khảo, không nên vì thế mà hỏng cả lần nhập.
      reject('Tệp nén lồng nhau (không giải nén tiếp)');
      continue;
    }

    /* [THÊM 18/08/2026] Video: nhận entry nhưng KHÔNG ghi nội dung.
       Đặt cờ ngay tại đây rồi `continue` sớm, để các phép kiểm tra bên dưới
       không áp lên nó — chúng đều nói về chỗ chiếm trên đĩa, mà thứ không được
       ghi ra đĩa thì không chiếm gì cả.

       [SỬA 19/08/2026] Khối này đã được CHUYỂN LÊN TRÊN phép kiểm tra tỉ lệ nén.

       Vì sao: zip bomb chỉ nguy hiểm khi ta GIẢI NÉN nó. Một entry mà ta không
       bao giờ đọc nội dung thì tỉ lệ nén của nó là chuyện của người gửi, không
       phải rủi ro của ta.

       Trường hợp thật bị chặn oan trước đây: giảng viên xuất bài giảng ra AVI
       không nén hoặc MOV lossless — loại tệp đó nén lại rất tốt, thừa sức vượt
       ngưỡng 200:1 nếu bài giảng là màn hình tĩnh. Cả tệp ZIP bị từ chối kèm
       thông báo "phát hiện zip bomb", trong khi hệ thống còn chẳng định đọc
       một byte nào của nó.

       Hàng rào SỐ LƯỢNG tệp vẫn giữ nguyên ở đây, vì nó có thật với entry bị
       bỏ qua nội dung: mỗi entry vẫn tốn một mục trong danh sách. */
    /* --- Zip bomb: tỉ lệ nén của TỪNG entry ---
       Miễn trừ cho các phần mở rộng nằm trong ratioExemptExtensions (video).
       Lý do: tệp video không nén hoặc nén lossless của bài giảng màn hình tĩnh
       có tỉ lệ nén rất cao và từng bị chặn oan là zip bomb. Các hàng rào dung
       lượng bên dưới VẪN áp dụng đầy đủ cho chúng. */
    if (
      !ratioExemptExt.has(extOf(entry.name)) &&
      entry.uncompressedSize > RATIO_CHECK_MIN_SIZE &&
      entry.compressedSize > 0
    ) {
      const ratio = entry.uncompressedSize / entry.compressedSize;
      if (ratio > MAX_COMPRESSION_RATIO) {
        logger.error(
          `[SafeExtract] 🚫 PHÁT HIỆN ZIP BOMB: "${entry.name}" tỉ lệ nén ${Math.round(ratio)}:1.`
        );
        throw new ImportRejectedError(
          `Tệp "${entry.name}" có tỉ lệ nén bất thường (${Math.round(ratio)}:1). ` +
            'Tệp ZIP bị từ chối vì lý do an toàn.',
          'ZIP_BOMB'
        );
      }
    }

    // --- Zip bomb: TỔNG dung lượng, cộng dồn TRƯỚC khi ghi ---
    totalBytes += entry.uncompressedSize;
    if (totalBytes > limits.maxTotalBytes) {
      throw new ImportRejectedError(
        `Tổng dung lượng tài liệu sau giải nén vượt quá ${Math.round(limits.maxTotalBytes / 1024 / 1024)}MB cho phép.`,
        'ZIP_TOO_LARGE'
      );
    }

    // --- Một file quá lớn ---
    if (entry.uncompressedSize > limits.maxFileBytes) {
      reject(
        `Tệp quá lớn (${Math.round(entry.uncompressedSize / 1024 / 1024)}MB, tối đa ${Math.round(limits.maxFileBytes / 1024 / 1024)}MB)`
      );
      continue;
    }

    accepted.push(entry);

    if (accepted.length > limits.maxFiles) {
      throw new ImportRejectedError(
        `Tệp ZIP chứa quá nhiều tệp (tối đa ${limits.maxFiles}).`,
        'ZIP_TOO_MANY_FILES'
      );
    }
  }

  return { accepted, skipped, totalBytes };
};

/**
 * Giải nén an toàn.
 *
 * @param {string} zipPath - Đường dẫn tệp .zip
 * @param {string} destDir - Thư mục đích (sẽ được tạo nếu chưa có)
 * @param {object} limits
 * @param {number} limits.maxFiles
 * @param {number} limits.maxTotalBytes
 * @param {number} limits.maxFileBytes
 * @param {function} [onProgress] - (done, total) → báo tiến độ
 * @returns {Promise<{files: Array, skipped: Array, totalBytes: number, encodingWarnings: number}>}
 */
const safeExtract = async (zipPath, destDir, limits, onProgress) => {
  let central;
  try {
    central = await readCentralDirectory(zipPath);
  } catch (error) {
    if (error instanceof ZipError) {
      throw new ImportRejectedError(error.message, error.code);
    }
    throw error;
  }

  if (central.entries.length === 0) {
    throw new ImportRejectedError('Tệp ZIP rỗng.', 'ZIP_EMPTY');
  }

  const { accepted, skipped, totalBytes } = auditEntries(
    central.entries,
    destDir,
    limits
  );

  if (accepted.length === 0) {
    throw new ImportRejectedError(
      'Tệp ZIP không chứa tài liệu nào có thể sử dụng.',
      'ZIP_NO_USABLE_FILES'
    );
  }

  await fs.mkdir(destDir, { recursive: true });

  const files = [];
  let encodingWarnings = 0;

  /* Ghi TUẦN TỰ, không song song.
     Với `mem_limit` thấp của container, giải nén song song nhiều file lớn dễ
     chạm trần bộ nhớ. Import vốn chạy nền nên chậm hơn chút không ảnh hưởng ai,
     còn OOM thì mất trắng cả job. */
  for (let i = 0; i < accepted.length; i += 1) {
    const entry = accepted[i];

    /* [THÊM 18/08/2026] Video: ghi nhận nhưng KHÔNG chạm vào đĩa.
       `absolutePath: null` là tín hiệu đi xuyên suốt phần còn lại của đường
       ống — treeAnalyzer dựa vào đó để đánh dấu bài học "chờ video", và
       acceptProposal dựa vào đó để KHÔNG đưa vào hàng đợi tải lên
       (`if (lesson.lessonType === 'VIDEO' && lesson.absolutePath)`).
       Nhờ vậy không phải sửa gì ở tầng chấp nhận. */
    if (entry.skipContent) {
      files.push({
        relativePath: entry.name,
        absolutePath: null,
        // Kích thước lấy từ thư mục trung tâm của ZIP — chính xác, và có được
        // mà không cần giải nén một byte nào.
        sizeBytes: entry.uncompressedSize,
        encoding: entry.encoding,
        suspiciousName: entry.suspiciousName,
        isPlaceholder: true,
      });
      if (entry.suspiciousName) encodingWarnings += 1;
      if (onProgress) onProgress(i + 1, accepted.length);
      continue;
    }

    const destPath = path.join(destDir, entry.name);

    // Kiểm tra Zip Slip LẦN NỮA ngay trước khi ghi — phòng thủ theo lớp.
    // auditEntries đã chặn rồi, nhưng đây là lần cuối trước khi chạm đĩa,
    // và chi phí gần như bằng 0.
    if (!isInsideDir(destDir, destPath)) {
      throw new ImportRejectedError(
        'Phát hiện đường dẫn không hợp lệ khi ghi tệp.',
        'ZIP_SLIP'
      );
    }

    await fs.mkdir(path.dirname(destPath), { recursive: true });

    try {
      const written = await extractEntryToFile(zipPath, entry, destPath);
      if (entry.suspiciousName) encodingWarnings += 1;

      files.push({
        relativePath: entry.name,
        absolutePath: destPath,
        sizeBytes: written,
        encoding: entry.encoding,
        suspiciousName: entry.suspiciousName,
      });
    } catch (error) {
      // Một file hỏng không được làm chết cả lần nhập — ghi nhận rồi đi tiếp.
      logger.warn(
        `[SafeExtract] Không giải nén được "${entry.name}": ${error.message}`
      );
      skipped.push({ name: entry.name, reason: 'Tệp bị lỗi khi giải nén' });
      await fs.rm(destPath, { force: true }).catch(() => {});
    }

    if (onProgress) onProgress(i + 1, accepted.length);
  }

  if (files.length === 0) {
    throw new ImportRejectedError(
      'Không giải nén được tệp nào. Tệp ZIP có thể bị hỏng.',
      'ZIP_ALL_FAILED'
    );
  }

  logger.info(
    `[SafeExtract] Đã giải nén ${files.length} tệp (${Math.round(totalBytes / 1024 / 1024)}MB), ` +
      `bỏ qua ${skipped.length}, cảnh báo bảng mã ${encodingWarnings}.`
  );

  return { files, skipped, totalBytes, encodingWarnings };
};

module.exports = {
  safeExtract,
  ImportRejectedError,
  isInsideDir,
  isJunk,
  MAX_COMPRESSION_RATIO,
};
