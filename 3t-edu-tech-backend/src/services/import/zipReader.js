/* ============================================================================
 * zipReader.js
 * [THÊM 18/08/2026 — COURSE IMPORT, Giai đoạn A]
 *
 * Bộ đọc ZIP viết bằng Node built-in — KHÔNG dùng thư viện ngoài.
 *
 * ----------------------------------------------------------------------------
 * VÌ SAO TỰ VIẾT THAY VÌ DÙNG yauzl / adm-zip / unzipper
 *
 * 1. RÀNG BUỘC Ổ ĐĨA. Mỗi phụ thuộc mới là thêm dung lượng trong node_modules
 *    và trong ảnh Docker. Ở đây `zlib` (built-in) đã làm được toàn bộ phần
 *    giải nén, phần còn lại chỉ là đọc cấu trúc file.
 *
 * 2. CẦN BUFFER THÔ CỦA TÊN FILE. Phần lớn thư viện tự giải mã tên entry thành
 *    chuỗi rồi mới trả về — mà chúng đoán bảng mã theo cách riêng. Với ZIP
 *    tiếng Việt do 7-Zip nén (không đặt cờ UTF-8), thông tin byte gốc mất đi là
 *    KHÔNG cứu được nữa. Ta cần cả buffer thô lẫn bit cờ để tự quyết định
 *    (xem utils/zipEncoding.js).
 *
 * 3. CẦN CHẶN AN TOÀN TRƯỚC KHI GHI. Thư viện tiện dụng thường giải nén thẳng
 *    ra đĩa; muốn chặn zip bomb hay Zip Slip thì phải chặn TRƯỚC khi ghi byte
 *    đầu tiên. Tự đọc central directory cho ta toàn bộ danh sách entry kèm kích
 *    thước — quyết định từ chối trước khi chạm vào đĩa.
 *
 * ----------------------------------------------------------------------------
 * CẤU TRÚC FILE ZIP (PKWARE APPNOTE.TXT)
 *
 *   [Local header + data] × N        ← dữ liệu thực
 *   [Central directory header] × N   ← "mục lục", chứa đủ metadata
 *   [End of central directory]       ← trỏ tới mục lục
 *
 * Đọc từ CENTRAL DIRECTORY (không phải local header) vì:
 *   • Nó là mục lục đầy đủ, đọc một lượt là biết hết
 *   • Chỉ nó mới có `externalFileAttributes` — cần để phát hiện symlink
 *   • Local header có thể để size = 0 và ghi thật vào "data descriptor" phía
 *     sau (khi nén theo luồng), lúc đó không chặn zip bomb trước được
 * ========================================================================== */

const fs = require('fs/promises');
const fsSync = require('fs');
const zlib = require('zlib');
const { pipeline } = require('stream/promises');

const { decodeEntryName } = require('../../utils/zipEncoding');

// --- Chữ ký (signature) các cấu trúc trong file ZIP ---
const SIG_EOCD = 0x06054b50; // End of central directory
const SIG_EOCD64_LOCATOR = 0x07064b50; // ZIP64 EOCD locator
const SIG_EOCD64 = 0x06064b50; // ZIP64 EOCD
const SIG_CENTRAL = 0x02014b50; // Central directory file header
const SIG_LOCAL = 0x04034b50; // Local file header

// --- Phương thức nén ---
const METHOD_STORE = 0;
const METHOD_DEFLATE = 8;

/** Cờ bit 11 của general purpose flag: tên file mã hóa UTF-8 (EFS). */
const FLAG_UTF8 = 0x0800;
/** Cờ bit 0: entry được mã hóa bằng mật khẩu. */
const FLAG_ENCRYPTED = 0x0001;

/** Giá trị "tràn 32-bit" — báo hiệu giá trị thật nằm trong trường phụ ZIP64. */
const ZIP64_MARKER = 0xffffffff;

/** Comment của EOCD tối đa 65535 byte theo chuẩn. */
const MAX_EOCD_SEARCH = 65535 + 22;

class ZipError extends Error {
  constructor(message, code = 'ZIP_INVALID') {
    super(message);
    this.name = 'ZipError';
    this.code = code;
  }
}

/** Đọc `length` byte tại `position`. */
const readAt = async (handle, position, length) => {
  if (length <= 0) return Buffer.alloc(0);
  const buffer = Buffer.alloc(length);
  const { bytesRead } = await handle.read(buffer, 0, length, position);
  return buffer.subarray(0, bytesRead);
};

/**
 * Tìm End Of Central Directory bằng cách quét NGƯỢC từ cuối file.
 *
 * Phải quét ngược vì EOCD có thể theo sau bởi comment dài tới 65535 byte, nên
 * vị trí của nó không cố định.
 */
const findEocd = async (handle, fileSize) => {
  const searchLength = Math.min(MAX_EOCD_SEARCH, fileSize);
  const start = fileSize - searchLength;
  const buf = await readAt(handle, start, searchLength);

  for (let i = buf.length - 22; i >= 0; i -= 1) {
    if (buf.readUInt32LE(i) === SIG_EOCD) {
      return {
        offsetInFile: start + i,
        entryCount: buf.readUInt16LE(i + 10),
        centralSize: buf.readUInt32LE(i + 12),
        centralOffset: buf.readUInt32LE(i + 16),
      };
    }
  }
  throw new ZipError(
    'Không tìm thấy cấu trúc ZIP hợp lệ. Tệp có thể bị hỏng hoặc không phải tệp .zip.',
    'ZIP_NOT_A_ZIP'
  );
};

/**
 * Nếu EOCD báo giá trị tràn 32-bit thì đọc bản ZIP64 để lấy số thật.
 * Cần cho ZIP > 4GB hoặc > 65535 entry.
 */
const resolveZip64 = async (handle, eocd) => {
  const needsZip64 =
    eocd.entryCount === 0xffff ||
    eocd.centralOffset === ZIP64_MARKER ||
    eocd.centralSize === ZIP64_MARKER;
  if (!needsZip64) return eocd;

  // ZIP64 EOCD locator nằm ngay TRƯỚC EOCD, dài đúng 20 byte.
  const locator = await readAt(handle, eocd.offsetInFile - 20, 20);
  if (locator.length < 20 || locator.readUInt32LE(0) !== SIG_EOCD64_LOCATOR) {
    throw new ZipError('Tệp ZIP64 không hợp lệ (thiếu locator).', 'ZIP_BAD_ZIP64');
  }

  const eocd64Offset = Number(locator.readBigUInt64LE(8));
  const eocd64 = await readAt(handle, eocd64Offset, 56);
  if (eocd64.length < 56 || eocd64.readUInt32LE(0) !== SIG_EOCD64) {
    throw new ZipError('Tệp ZIP64 không hợp lệ (thiếu EOCD64).', 'ZIP_BAD_ZIP64');
  }

  return {
    ...eocd,
    entryCount: Number(eocd64.readBigUInt64LE(32)),
    centralSize: Number(eocd64.readBigUInt64LE(40)),
    centralOffset: Number(eocd64.readBigUInt64LE(48)),
  };
};

/**
 * Đọc trường phụ ZIP64 (header ID 0x0001) để lấy kích thước/offset 64-bit.
 *
 * ⚠️ Thứ tự các trường trong khối này KHÔNG cố định — chúng chỉ xuất hiện khi
 * trường 32-bit tương ứng bằng 0xFFFFFFFF, và theo đúng thứ tự:
 * uncompressed, compressed, localHeaderOffset, diskStart.
 */
const parseZip64Extra = (extraBuf, needs) => {
  const result = {};
  let offset = 0;

  while (offset + 4 <= extraBuf.length) {
    const headerId = extraBuf.readUInt16LE(offset);
    const dataSize = extraBuf.readUInt16LE(offset + 2);
    const dataStart = offset + 4;

    if (headerId === 0x0001) {
      let p = dataStart;
      if (needs.uncompressedSize && p + 8 <= dataStart + dataSize) {
        result.uncompressedSize = Number(extraBuf.readBigUInt64LE(p));
        p += 8;
      }
      if (needs.compressedSize && p + 8 <= dataStart + dataSize) {
        result.compressedSize = Number(extraBuf.readBigUInt64LE(p));
        p += 8;
      }
      if (needs.localHeaderOffset && p + 8 <= dataStart + dataSize) {
        result.localHeaderOffset = Number(extraBuf.readBigUInt64LE(p));
        p += 8;
      }
      break;
    }
    offset = dataStart + dataSize;
  }
  return result;
};

/**
 * Đọc toàn bộ central directory.
 *
 * KHÔNG đọc nội dung file nào — chỉ metadata. Nhờ vậy có thể áp dụng mọi kiểm
 * tra an toàn (zip bomb, Zip Slip, symlink) TRƯỚC khi ghi một byte nào ra đĩa.
 *
 * @param {string} zipPath
 * @returns {Promise<{entries: Array, totalUncompressed: number, hasEncrypted: boolean}>}
 */
const readCentralDirectory = async (zipPath) => {
  const handle = await fs.open(zipPath, 'r');
  try {
    const { size: fileSize } = await handle.stat();
    if (fileSize < 22) {
      throw new ZipError('Tệp quá nhỏ để là một tệp ZIP hợp lệ.', 'ZIP_NOT_A_ZIP');
    }

    const eocd = await resolveZip64(handle, await findEocd(handle, fileSize));
    const central = await readAt(handle, eocd.centralOffset, eocd.centralSize);

    const entries = [];
    let totalUncompressed = 0;
    let hasEncrypted = false;
    let offset = 0;

    for (let i = 0; i < eocd.entryCount; i += 1) {
      if (offset + 46 > central.length) break;
      if (central.readUInt32LE(offset) !== SIG_CENTRAL) break;

      const flags = central.readUInt16LE(offset + 8);
      const method = central.readUInt16LE(offset + 10);
      const crc32 = central.readUInt32LE(offset + 16);
      let compressedSize = central.readUInt32LE(offset + 20);
      let uncompressedSize = central.readUInt32LE(offset + 24);
      const nameLength = central.readUInt16LE(offset + 28);
      const extraLength = central.readUInt16LE(offset + 30);
      const commentLength = central.readUInt16LE(offset + 32);
      const externalAttrs = central.readUInt32LE(offset + 38);
      let localHeaderOffset = central.readUInt32LE(offset + 42);

      const nameStart = offset + 46;
      // ★ Giữ nguyên BUFFER THÔ — đây là lý do chính phải tự viết bộ đọc này.
      const rawNameBuffer = central.subarray(nameStart, nameStart + nameLength);
      const extraBuf = central.subarray(
        nameStart + nameLength,
        nameStart + nameLength + extraLength
      );

      // Giải quyết ZIP64 nếu có trường nào bị tràn.
      const needs = {
        uncompressedSize: uncompressedSize === ZIP64_MARKER,
        compressedSize: compressedSize === ZIP64_MARKER,
        localHeaderOffset: localHeaderOffset === ZIP64_MARKER,
      };
      if (needs.uncompressedSize || needs.compressedSize || needs.localHeaderOffset) {
        const z64 = parseZip64Extra(extraBuf, needs);
        if (z64.uncompressedSize !== undefined) uncompressedSize = z64.uncompressedSize;
        if (z64.compressedSize !== undefined) compressedSize = z64.compressedSize;
        if (z64.localHeaderOffset !== undefined) localHeaderOffset = z64.localHeaderOffset;
      }

      const decoded = decodeEntryName(rawNameBuffer, (flags & FLAG_UTF8) !== 0);
      const isEncrypted = (flags & FLAG_ENCRYPTED) !== 0;
      if (isEncrypted) hasEncrypted = true;

      /* Phát hiện thư mục: theo chuẩn, entry thư mục kết thúc bằng '/'.
         Một số công cụ còn đặt bit 0x10 (FILE_ATTRIBUTE_DIRECTORY) ở byte thấp
         của externalAttrs — kiểm tra cả hai cho chắc. */
      const isDirectory =
        decoded.name.endsWith('/') || (externalAttrs & 0x10) !== 0;

      /* Phát hiện symlink: ZIP do Unix tạo lưu st_mode ở 16 bit CAO của
         externalAttrs. S_IFLNK = 0xA000. Symlink là đường thoát khỏi thư mục
         đích rất kín đáo — chuẩn bảo mật bắt buộc phải bỏ qua. */
      const unixMode = (externalAttrs >>> 16) & 0xffff;
      const isSymlink = (unixMode & 0xf000) === 0xa000;

      if (!isDirectory && !isSymlink) totalUncompressed += uncompressedSize;

      entries.push({
        name: decoded.name,
        encoding: decoded.encoding,
        suspiciousName: decoded.suspicious,
        isDirectory,
        isSymlink,
        isEncrypted,
        method,
        crc32,
        compressedSize,
        uncompressedSize,
        localHeaderOffset,
        unixMode,
      });

      offset = nameStart + nameLength + extraLength + commentLength;
    }

    return { entries, totalUncompressed, hasEncrypted };
  } finally {
    await handle.close().catch(() => {});
  }
};

/**
 * Giải nén MỘT entry ra đường dẫn đích.
 *
 * ⚠️ Dùng STREAM chứ không đọc cả file vào bộ nhớ. Với ràng buộc RAM của máy
 * bạn (`mem_limit` của container backend), đọc trọn một PDF 200MB vào Buffer là
 * đủ để container bị OOM kill — và điều tệ nhất là job biến mất KHÔNG một dòng
 * log nào, vì tiến trình bị hạ ngay lập tức.
 *
 * @param {string} zipPath
 * @param {object} entry - phần tử từ readCentralDirectory()
 * @param {string} destPath - đường dẫn tuyệt đối để ghi ra
 * @returns {Promise<number>} số byte đã ghi
 */
const extractEntryToFile = async (zipPath, entry, destPath) => {
  if (entry.isEncrypted) {
    throw new ZipError(
      `Tệp "${entry.name}" được bảo vệ bằng mật khẩu nên không thể đọc.`,
      'ZIP_ENCRYPTED'
    );
  }
  if (entry.method !== METHOD_STORE && entry.method !== METHOD_DEFLATE) {
    throw new ZipError(
      `Tệp "${entry.name}" dùng phương thức nén không hỗ trợ (mã ${entry.method}). ` +
        'Hãy nén lại bằng định dạng ZIP chuẩn (Deflate).',
      'ZIP_UNSUPPORTED_METHOD'
    );
  }

  const handle = await fs.open(zipPath, 'r');
  let dataStart;
  try {
    /* Kích thước phần tên + trường phụ ở LOCAL header có thể KHÁC với ở central
       directory (chuẩn cho phép). Vì vậy bắt buộc phải đọc lại local header để
       biết dữ liệu bắt đầu ở đâu — dùng số liệu của central directory sẽ lệch
       vài byte và file giải ra bị hỏng. */
    const local = await readAt(handle, entry.localHeaderOffset, 30);
    if (local.length < 30 || local.readUInt32LE(0) !== SIG_LOCAL) {
      throw new ZipError(
        `Cấu trúc tệp "${entry.name}" bị hỏng.`,
        'ZIP_BAD_LOCAL_HEADER'
      );
    }
    const localNameLen = local.readUInt16LE(26);
    const localExtraLen = local.readUInt16LE(28);
    dataStart = entry.localHeaderOffset + 30 + localNameLen + localExtraLen;
  } finally {
    await handle.close().catch(() => {});
  }

  const readStream = fsSync.createReadStream(zipPath, {
    start: dataStart,
    end: dataStart + entry.compressedSize - 1,
    highWaterMark: 256 * 1024, // 256KB — nhỏ để giữ bộ nhớ thấp
  });
  const writeStream = fsSync.createWriteStream(destPath);

  if (entry.method === METHOD_STORE) {
    await pipeline(readStream, writeStream);
  } else {
    await pipeline(readStream, zlib.createInflateRaw(), writeStream);
  }

  const { size } = await fs.stat(destPath);
  return size;
};

module.exports = {
  readCentralDirectory,
  extractEntryToFile,
  ZipError,
  METHOD_STORE,
  METHOD_DEFLATE,
};
