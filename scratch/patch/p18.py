# -*- coding: utf-8 -*-
import io, sys
ROOT = sys.argv[1]
def read(p): return io.open(ROOT + p, encoding='utf-8').read()
def write(p, s): io.open(ROOT + p, 'w', encoding='utf-8', newline='\n').write(s)
def sub(s, old, new, label):
    assert s.count(old) == 1, 'KHONG TIM THAY: ' + label
    return s.replace(old, new)

p = '/3t-edu-tech-backend/tests/helpers/zip.js'
s = read(p)

s = sub(s, """/**
 * @param {Array<{name: string, data: Buffer|string, deflate?: boolean}>} entries
 *   `name` dùng dấu '/' kể cả trên Windows — đặc tả ZIP quy định vậy.
 * @returns {Buffer}
 */
function taoZip(entries) {""",
"""/**
 * @param {Array<object>} entries Mỗi phần tử:
 *   - `name`     {string}  đường dẫn trong ZIP; dùng dấu '/' kể cả trên
 *                          Windows — đặc tả ZIP quy định vậy.
 *   - `data`     {Buffer|string}
 *   - `deflate`  {boolean} nén bằng deflate thay vì lưu nguyên.
 *
 *   [THÊM 20/08/2026] Ba trường dưới đây phục vụ các phép thử HÀNG RÀO AN
 *   TOÀN. Chúng cố ý tạo ra tệp ZIP KHÔNG hợp lệ hoặc độc hại — thư viện đóng
 *   gói bình thường không cho phép làm vậy, và đó chính là lý do bộ test tự
 *   dựng từng byte thay vì cài `archiver`.
 *
 *   - `method`     {number}  ghi đè mã phương thức nén trong header. Dùng 12
 *                            (BZIP2) hoặc 14 (LZMA) để thử nhánh "phương thức
 *                            không hỗ trợ". Dữ liệu vẫn được lưu nguyên.
 *   - `encrypted`  {boolean} bật bit 0 của cờ chung — báo tệp có mật khẩu.
 *   - `externalAttrs` {number} thuộc tính ngoài. Đặt `0xA1FF0000` để entry
 *                            được nhận là liên kết tượng trưng (S_IFLNK).
 * @returns {Buffer}
 */
function taoZip(entries) {""", 'jsdoc taoZip')

s = sub(s, """    const method = e.deflate ? 8 : 0;
    const body = e.deflate ? zlib.deflateRawSync(raw, { level: 9 }) : raw;
    const crc = crc32(raw);""",
"""    /* `method` khai báo trong header có thể KHÁC cách dữ liệu thực sự được
       ghi: đó là điểm mấu chốt của phép thử "phương thức nén không hỗ trợ" —
       máy chủ phải từ chối dựa trên mã khai báo, trước khi thử giải nén. */
    const methodThat = e.deflate ? 8 : 0;
    const method = e.method !== undefined ? e.method : methodThat;
    const body = e.deflate ? zlib.deflateRawSync(raw, { level: 9 }) : raw;
    const crc = crc32(raw);
    const flags = 0x0800 | (e.encrypted ? 0x0001 : 0); // 0x0800 = tên tệp UTF-8
    const externalAttrs = e.externalAttrs || 0;""", 'khoi method')

s = sub(s, """    lh.writeUInt16LE(0x0800, 6); // cờ: tên tệp mã hóa UTF-8""",
"""    lh.writeUInt16LE(flags, 6); // cờ: UTF-8 (+ bit mật khẩu nếu có)""", 'flags local')
s = sub(s, """    ch.writeUInt16LE(0x0800, 8);""",
"""    ch.writeUInt16LE(flags, 8);""", 'flags central')
s = sub(s, """    ch.writeUInt32LE(0, 38); // thuộc tính ngoài""",
"""    ch.writeUInt32LE(externalAttrs, 38); // thuộc tính ngoài (0xA1FF0000 = symlink)""", 'external attrs')

s = sub(s, """module.exports = { taoZip, crc32, videoGia };""",
"""/** Thuộc tính ngoài đánh dấu entry là liên kết tượng trưng (S_IFLNK 0xA000). */
const ATTR_SYMLINK = 0xa1ff0000;

module.exports = { taoZip, crc32, videoGia, ATTR_SYMLINK };""", 'module.exports zip helper')
write(p, s)
print('helpers/zip.js OK')
