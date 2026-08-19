/* ============================================================================
 * helpers/zip.js
 * [THÊM 19/08/2026]
 *
 * Tạo tệp ZIP ngay trong bộ nhớ, không cần thư viện ngoài.
 *
 * ── VÌ SAO TỰ VIẾT ─────────────────────────────────────────────────────────
 *
 * Dự án không có `archiver` hay `jszip` trong devDependencies, và cài thêm
 * một phụ thuộc chỉ để chạy test là cái giá không đáng — nhất là khi ZIP dạng
 * đơn giản (không mã hóa, không zip64) chỉ gồm ba khối có cấu trúc cố định.
 *
 * Quan trọng hơn: chính vì tự dựng từng byte nên bộ test KIỂM SOÁT được
 * `uncompressedSize` ghi trong central directory — đúng con số mà
 * `safeExtract.js` đọc để quyết định bỏ qua tệp video. Dùng thư viện thì
 * không chạm tới chỗ đó được.
 *
 * Hỗ trợ hai phương thức: 0 = store (giữ nguyên), 8 = deflate. Dùng deflate
 * cho "video giả" để một tệp 20MB toàn số 0 chỉ chiếm vài chục KB khi truyền
 * lên — test chạy nhanh mà kích thước khai báo vẫn thật.
 * ========================================================================== */

const zlib = require('zlib');

/** Bảng CRC32 chuẩn (đa thức 0xEDB88320) — tính một lần rồi dùng lại. */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i += 1) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ -1) >>> 0;
}

/**
 * @param {Array<{name: string, data: Buffer|string, deflate?: boolean}>} entries
 *   `name` dùng dấu '/' kể cả trên Windows — đặc tả ZIP quy định vậy.
 * @returns {Buffer}
 */
function taoZip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const e of entries) {
    const nameBuf = Buffer.from(e.name, 'utf8');
    const raw = Buffer.isBuffer(e.data) ? e.data : Buffer.from(e.data, 'utf8');
    const method = e.deflate ? 8 : 0;
    const body = e.deflate ? zlib.deflateRawSync(raw, { level: 9 }) : raw;
    const crc = crc32(raw);

    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); // chữ ký local file header
    lh.writeUInt16LE(20, 4); // version cần để giải nén
    lh.writeUInt16LE(0x0800, 6); // cờ: tên tệp mã hóa UTF-8
    lh.writeUInt16LE(method, 8);
    lh.writeUInt16LE(0, 10); // giờ sửa
    lh.writeUInt16LE(0x21, 12); // ngày sửa (1980-01-01, hợp lệ là đủ)
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(body.length, 18); // kích thước sau nén
    lh.writeUInt32LE(raw.length, 22); // kích thước gốc
    lh.writeUInt16LE(nameBuf.length, 26);
    lh.writeUInt16LE(0, 28); // extra field
    locals.push(lh, nameBuf, body);

    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); // chữ ký central directory
    ch.writeUInt16LE(20, 4); // version tạo bởi
    ch.writeUInt16LE(20, 6); // version cần
    ch.writeUInt16LE(0x0800, 8);
    ch.writeUInt16LE(method, 10);
    ch.writeUInt16LE(0, 12);
    ch.writeUInt16LE(0x21, 14);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(body.length, 20);
    ch.writeUInt32LE(raw.length, 24);
    ch.writeUInt16LE(nameBuf.length, 28);
    ch.writeUInt16LE(0, 30); // extra
    ch.writeUInt16LE(0, 32); // comment
    ch.writeUInt16LE(0, 34); // số đĩa
    ch.writeUInt16LE(0, 36); // thuộc tính nội bộ
    ch.writeUInt32LE(0, 38); // thuộc tính ngoài
    ch.writeUInt32LE(offset, 42); // vị trí local header
    centrals.push(ch, nameBuf);

    offset += lh.length + nameBuf.length + body.length;
  }

  const localBuf = Buffer.concat(locals);
  const centralBuf = Buffer.concat(centrals);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4); // đĩa hiện tại
  eocd.writeUInt16LE(0, 6); // đĩa chứa central directory
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(localBuf.length, 16);
  eocd.writeUInt16LE(0, 20); // độ dài chú thích

  return Buffer.concat([localBuf, centralBuf, eocd]);
}

/** Buffer toàn số 0, kích thước tùy ý — deflate xuống gần như không tốn gì. */
const videoGia = (mb) => Buffer.alloc(Math.round(mb * 1024 * 1024), 0);

module.exports = { taoZip, crc32, videoGia };
