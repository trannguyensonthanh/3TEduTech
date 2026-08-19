/* ============================================================================
 * zipEncoding.js
 * [THÊM 18/08/2026 — COURSE IMPORT, Giai đoạn A]
 *
 * ★ FILE QUAN TRỌNG NHẤT CỦA TOÀN BỘ TÍNH NĂNG NHẬP KHÓA HỌC.
 *
 * Sai ở đây thì MỌI thứ phía sau đều sai — tên chương sai, ghép phụ đề thất
 * bại, AI nhận vào ký tự rác — mà triệu chứng lại rất khó lần ra.
 *
 * ----------------------------------------------------------------------------
 * VẤN ĐỀ 1 — BẢNG MÃ TÊN FILE
 *
 * Chuẩn ZIP (APPNOTE.TXT, mục 4.4.4) có bit 11 trong "general purpose bit flag"
 * gọi là EFS — báo rằng tên file được mã hóa UTF-8. Nhiều công cụ nén KHÔNG đặt
 * bit này và ghi tên theo bảng mã hệ thống:
 *
 *   • Windows "Send to → Compressed folder"  : thường KHÔNG đặt cờ
 *   • 7-Zip (mặc định)                        : KHÔNG đặt cờ, dùng bảng mã OEM
 *   • WinRAR                                  : tùy phiên bản
 *   • macOS "Compress"                        : có đặt, nhưng dạng NFD (vấn đề 2)
 *   • zip trên Linux                          : thường có đặt
 *
 * Hậu quả với tiếng Việt: thư mục "Bài 1 - Giới thiệu/" đọc trên Linux thành
 * "B└i 1 - Gi╗ыi thi╠єu/". Và điều nguy hiểm là ở máy Windows của bạn nó có thể
 * chạy đúng, chỉ vỡ khi lên server.
 *
 * ----------------------------------------------------------------------------
 * VẤN ĐỀ 2 — CHUẨN HÓA UNICODE (NFC vs NFD)
 *
 * Chữ "Bài" có HAI cách biểu diễn hợp lệ:
 *   NFC (dựng sẵn) : B à i          — 3 ký tự — Windows, Linux
 *   NFD (tách rời) : B a ◌̀ i        — 4 ký tự — macOS
 *
 * Hai chuỗi HIỂN THỊ Y HỆT nhau nhưng `===` trả về false. Nếu "Bài-1.mp4" là
 * NFD còn "Bài-1.srt" là NFC thì phụ đề KHÔNG BAO GIỜ ghép được, và nhìn bằng
 * mắt thì hai cái tên giống hệt nhau.
 *
 * ----------------------------------------------------------------------------
 * VẤN ĐỀ 3 — DẤU PHÂN CÁCH ĐƯỜNG DẪN
 *
 * Chuẩn ZIP quy định dùng '/'. Một số công cụ Windows cũ ghi '\'. Trên Linux
 * '\' KHÔNG phải dấu phân cách, nên "Chuong1\Bai1.pdf" bị coi là MỘT tên file
 * duy nhất → mất sạch cấu trúc thư mục.
 *
 * ----------------------------------------------------------------------------
 * GIẢI PHÁP: mọi tên entry đi qua đúng MỘT hàm `decodeEntryName()`, trả về
 * chuỗi đã chuẩn hóa NFC, dùng '/', đã đoán đúng bảng mã.
 * ========================================================================== */

const logger = require('./logger');

/* ----------------------------------------------------------------------------
 * KHÔNG DÙNG THƯ VIỆN NGOÀI (đổi so với kế hoạch v4)
 *
 * Kế hoạch ban đầu định dùng `iconv-lite`. Nhưng Node 20+ đi kèm full-ICU, và
 * TextDecoder có sẵn đã hỗ trợ 'windows-1258' (bảng mã tiếng Việt trên Windows
 * — chính là thứ quan trọng nhất ở đây) lẫn 'windows-1252'.
 *
 * Riêng CP437 (mặc định theo chuẩn ZIP) thì ICU không có, nên nhúng thẳng bảng
 * tra 128 ký tự vùng cao bên dưới — đúng 128 phần tử, không đáng kể.
 *
 * Đổi lại: 0 phụ thuộc mới, 0 MB thêm vào ảnh Docker.
 * -------------------------------------------------------------------------- */

/** CP437 vùng 0x80–0xFF. Vùng 0x00–0x7F trùng ASCII nên không cần liệt kê. */
const CP437_HIGH =
  'ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒ' +
  'áíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐' +
  '└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀' +
  'αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ';

/**
 * Giải mã một buffer theo tên bảng mã.
 * Ném lỗi thì trả về null để vòng lặp chọn ứng viên bỏ qua ứng viên đó.
 */
const decodeWith = (buffer, encoding) => {
  try {
    if (encoding === 'cp437') {
      let out = '';
      for (const byte of buffer) {
        out += byte < 0x80 ? String.fromCharCode(byte) : CP437_HIGH[byte - 0x80];
      }
      return out;
    }
    return new TextDecoder(encoding, { fatal: false }).decode(buffer);
  } catch {
    return null;
  }
};

/** Ký tự thay thế U+FFFD — dấu hiệu giải mã UTF-8 thất bại. */
const REPLACEMENT_CHAR = '�';

/**
 * Các bảng mã ứng viên khi ZIP không đặt cờ UTF-8, xếp theo thứ tự khả năng.
 *
 * cp1258 (Windows Vietnamese) đứng trước cp437 (mặc định theo chuẩn ZIP) vì
 * người dùng của hệ thống này gần như chắc chắn dùng Windows tiếng Việt.
 */
const CANDIDATE_ENCODINGS = ['windows-1258', 'cp437', 'windows-1252'];

/**
 * Dải ký tự tiếng Việt có dấu (Latin-1 Supplement, Latin Extended-A/B,
 * Combining Diacritics, và Latin Extended Additional U+1EA0–U+1EF9 — nơi chứa
 * phần lớn nguyên âm tiếng Việt như ạ, ả, ấ, ầ...).
 */
const VIETNAMESE_RANGE =
  /[À-ɏ̀-ͯẠ-ỹƠơƯư]/;

/** Ký tự điều khiển hoặc ký tự vẽ khung — dấu hiệu giải mã SAI bảng mã. */
const GARBAGE_RANGE =
  /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\u2500-\u257F\u2580-\u259F]/;

/**
 * Chấm điểm "trông có giống tiếng Việt / tên file hợp lệ không".
 *
 * Không có cách nào chắc chắn 100% để đoán bảng mã của một chuỗi byte — đây là
 * heuristic. Nhưng nó đủ tốt vì ta chỉ phải phân biệt giữa 3 ứng viên, và một
 * lựa chọn sai thường tạo ra ký tự vẽ khung (░▒▓└╗) rất dễ nhận ra.
 *
 * @param {string} s
 * @returns {number} điểm càng cao càng đáng tin
 */
const scoreDecoded = (s) => {
  if (!s) return -Infinity;
  let score = 0;

  // Có ký tự rác → gần như chắc chắn sai bảng mã. Phạt rất nặng.
  const garbageMatches = s.match(new RegExp(GARBAGE_RANGE, 'g'));
  if (garbageMatches) score -= garbageMatches.length * 10;

  // Có ký tự tiếng Việt hợp lệ → dấu hiệu tốt.
  const vnMatches = s.match(new RegExp(VIETNAMESE_RANGE, 'g'));
  if (vnMatches) score += vnMatches.length * 2;

  // Ký tự ASCII thông thường (chữ, số, dấu chấm, gạch) → trung tính nhưng an toàn.
  const asciiMatches = s.match(/[A-Za-z0-9._\-/ ]/g);
  if (asciiMatches) score += asciiMatches.length * 0.1;

  return score;
};

/**
 * Chuẩn hóa cuối cùng, áp cho MỌI tên file bất kể giải mã kiểu gì.
 *
 * Thứ tự các bước ở đây quan trọng:
 *   1. Đổi '\' → '/' TRƯỚC, để bước tách đoạn đường dẫn phía sau làm đúng.
 *   2. NFC — phải làm ở đây, một lần duy nhất, để toàn hệ thống chỉ còn một
 *      dạng biểu diễn. Làm rải rác ở nhiều nơi thì sớm muộn sẽ sót một chỗ.
 *   3. Bỏ '/' thừa ở đầu — entry tên "/etc/passwd" là dấu hiệu tấn công, và
 *      safeExtract sẽ chặn, nhưng chuẩn hóa trước cho sạch.
 */
const normalizePath = (name) =>
  String(name)
    .replace(/\\/g, '/')
    .normalize('NFC')
    .replace(/^\/+/, '')
    .replace(/\/{2,}/g, '/');

/**
 * Giải mã tên entry trong ZIP.
 *
 * @param {Buffer} rawNameBuffer - Buffer THÔ của tên file lấy từ yauzl.
 *        Bắt buộc phải là buffer thô: nếu thư viện đã tự giải mã thành chuỗi
 *        thì thông tin byte gốc đã mất và không cứu được nữa.
 * @param {boolean} hasUtf8Flag - Bit 11 của general purpose flag.
 * @returns {{ name: string, encoding: string, suspicious: boolean }}
 */
const decodeEntryName = (rawNameBuffer, hasUtf8Flag) => {
  if (!Buffer.isBuffer(rawNameBuffer)) {
    // Người gọi đưa sẵn chuỗi — vẫn chuẩn hóa để không bỏ sót NFC.
    return {
      name: normalizePath(rawNameBuffer),
      encoding: 'utf8',
      suspicious: false,
    };
  }

  // --- 1. Có cờ UTF-8 → tin tưởng. Đây là trường hợp phổ biến nhất hiện nay.
  if (hasUtf8Flag) {
    return {
      name: normalizePath(rawNameBuffer.toString('utf8')),
      encoding: 'utf8',
      suspicious: false,
    };
  }

  // --- 2. Không có cờ, nhưng rất nhiều công cụ vẫn ghi UTF-8 mà quên đặt cờ.
  //        Thử UTF-8 trước; không có ký tự thay thế nghĩa là chuỗi byte hợp lệ
  //        theo UTF-8 — xác suất trùng ngẫu nhiên với bảng mã 1 byte rất thấp.
  const asUtf8 = rawNameBuffer.toString('utf8');
  if (!asUtf8.includes(REPLACEMENT_CHAR)) {
    return { name: normalizePath(asUtf8), encoding: 'utf8', suspicious: false };
  }

  // --- 3. Bảng mã cũ. Thử từng ứng viên, chọn cái điểm cao nhất.
  let best = { text: asUtf8, encoding: 'utf8', score: scoreDecoded(asUtf8) };

  for (const enc of CANDIDATE_ENCODINGS) {
    const decoded = decodeWith(rawNameBuffer, enc);
    if (decoded === null) continue;
    const score = scoreDecoded(decoded);
    if (score > best.score) {
      best = { text: decoded, encoding: enc, score };
    }
  }

  // Điểm âm nghĩa là ứng viên tốt nhất vẫn còn ký tự rác → báo để giao diện
  // nhắc giảng viên đổi tên file, thay vì âm thầm tạo ra một khóa học tên rác.
  const suspicious = best.score < 0;
  if (suspicious) {
    logger.warn(
      `[ZipEncoding] Không đoán chắc được bảng mã cho một tên tệp (đã thử ${CANDIDATE_ENCODINGS.join(', ')}). ` +
        `Kết quả tạm dùng: "${best.text}"`
    );
  }

  return {
    name: normalizePath(best.text),
    encoding: best.encoding,
    suspicious,
  };
};

/**
 * Khóa dùng để ghép cặp file (ví dụ bai1.mp4 ↔ Bai1.SRT).
 *
 * Ba phép chuẩn hóa, mỗi phép chống một kiểu lệch:
 *   • NFC        → chống lệch macOS (NFD) vs Windows/Linux (NFC)
 *   • toLowerCase→ chống lệch hoa/thường (NTFS không phân biệt, ext4 có)
 *   • bỏ đuôi    → để "bai1.mp4" và "bai1.srt" ra cùng một khóa
 *
 * @param {string} relativePath
 * @returns {string}
 */
const pairKey = (relativePath) => {
  const base = String(relativePath).split('/').pop() || '';
  const withoutExt = base.replace(/\.[^.]+$/, '');
  return withoutExt.normalize('NFC').toLowerCase().trim();
};

/**
 * Bỏ hậu tố ngôn ngữ khỏi tên phụ đề: "bai1.vi" → "bai1", "bai1.en" → "bai1".
 *
 * Tách riêng khỏi pairKey vì chỉ áp cho FILE PHỤ ĐỀ. Áp nhầm cho video sẽ làm
 * hỏng những tên hợp lệ như "chuong1.phan2.mp4" → "chuong1".
 *
 * @param {string} subtitleKey - kết quả của pairKey()
 * @returns {string}
 */
const stripLanguageSuffix = (subtitleKey) =>
  subtitleKey.replace(
    /\.(vi|en|vie|eng|vn|us|jp|ja|ko|zh|fr|de)$/i,
    ''
  );

module.exports = {
  decodeEntryName,
  normalizePath,
  pairKey,
  stripLanguageSuffix,
  // Xuất ra để viết unit test cho phần đoán bảng mã mà không cần file ZIP thật.
  scoreDecoded,
  decodeWith,
  CANDIDATE_ENCODINGS,
};
