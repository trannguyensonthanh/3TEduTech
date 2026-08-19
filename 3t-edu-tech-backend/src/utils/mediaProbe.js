/* ============================================================================
 * mediaProbe.js
 * [THÊM 18/08/2026 — COURSE IMPORT, Giai đoạn A]
 *
 * Đọc THỜI LƯỢNG video mà KHÔNG cần cài ffmpeg.
 *
 * ----------------------------------------------------------------------------
 * VÌ SAO KHÔNG DÙNG ffprobe (đổi so với kế hoạch v4)
 *
 * Kế hoạch ban đầu là thêm `apt-get install ffmpeg` vào Dockerfile backend.
 * Nhưng gói ffmpeg trên Debian kéo theo hàng trăm MB thư viện codec — trong
 * khi ta chỉ cần đúng MỘT con số: thời lượng tính bằng giây.
 *
 * Với ràng buộc ổ đĩa hiện tại, đánh đổi đó không hợp lý. File này đọc thẳng
 * cấu trúc container MP4 bằng JavaScript thuần:
 *     • 0 phụ thuộc mới          • 0 MB thêm vào ảnh Docker
 *     • Chỉ đọc vài trăm byte    • Chạy trong vài mili-giây kể cả file 2GB
 *
 * ẢNH THUMBNAIL: cũng bỏ ffmpeg. Cloudinary sinh thumbnail MIỄN PHÍ bằng URL
 * transformation sau khi upload:
 *     https://res.cloudinary.com/<cloud>/video/upload/so_3,w_400/<public_id>.jpg
 * Ở màn hình duyệt (trước khi upload) chỉ cần biểu tượng video + tên + thời
 * lượng là đủ để giảng viên nhận ra tài liệu của chính họ.
 *
 * ----------------------------------------------------------------------------
 * CẤU TRÚC MP4 (ISO/IEC 14496-12) — phần cần biết
 *
 * File là chuỗi các "box" nối tiếp nhau:
 *     [4 byte: size][4 byte: type][payload...]
 *
 *   size = 0  → box kéo dài tới hết file
 *   size = 1  → 8 byte tiếp theo mới là size thật (box lớn hơn 4GB)
 *
 * Ta cần box `moov`, bên trong có `mvhd` chứa:
 *     timescale (số đơn vị mỗi giây)  và  duration (số đơn vị)
 *     → thời lượng giây = duration / timescale
 *
 * ⚠️ `moov` có thể nằm CUỐI file (sau `mdat` chứa dữ liệu hình ảnh) — đó là
 * cách ghi mặc định của phần lớn phần mềm dựng phim. Vì vậy phải duyệt theo
 * offset và nhảy qua từng box, KHÔNG được đọc tuần tự cả file.
 * ========================================================================== */

const fs = require('fs/promises');
const path = require('path');
const logger = require('./logger');

/** Phần mở rộng được coi là video. */
const VIDEO_EXTENSIONS = new Set([
  '.mp4',
  '.m4v',
  '.mov',
  '.mkv',
  '.webm',
  '.avi',
  '.wmv',
  '.flv',
]);

/** Định dạng đọc được thời lượng bằng bộ phân tích trong file này. */
const MP4_FAMILY = new Set(['.mp4', '.m4v', '.mov']);

/** Giới hạn số box duyệt qua — chặn vòng lặp vô hạn khi file hỏng. */
const MAX_BOXES = 512;

/** Đọc `length` byte tại vị trí `position`. Trả về buffer thực đọc được. */
const readAt = async (handle, position, length) => {
  const buffer = Buffer.alloc(length);
  const { bytesRead } = await handle.read(buffer, 0, length, position);
  return buffer.subarray(0, bytesRead);
};

/**
 * Đọc header của một box tại `offset`.
 * @returns {Promise<{type: string, size: number, headerSize: number}|null>}
 */
const readBoxHeader = async (handle, offset, fileSize) => {
  const head = await readAt(handle, offset, 8);
  if (head.length < 8) return null;

  let size = head.readUInt32BE(0);
  const type = head.toString('latin1', 4, 8);
  let headerSize = 8;

  if (size === 1) {
    // Box lớn: 8 byte tiếp theo là size 64-bit.
    const ext = await readAt(handle, offset + 8, 8);
    if (ext.length < 8) return null;
    // readBigUInt64BE trả về BigInt; Number là an toàn vì file video thực tế
    // không bao giờ vượt Number.MAX_SAFE_INTEGER (~9 petabyte).
    size = Number(ext.readBigUInt64BE(0));
    headerSize = 16;
  } else if (size === 0) {
    // Box kéo dài tới hết file.
    size = fileSize - offset;
  }

  // Box nhỏ hơn cả header của chính nó → file hỏng, dừng lại.
  if (size < headerSize) return null;

  return { type, size, headerSize };
};

/**
 * Tìm box `mvhd` bên trong `moov` và trích thời lượng.
 * @returns {Promise<number|null>} số giây, hoặc null
 */
const readDurationFromMoov = async (handle, moovStart, moovEnd) => {
  let offset = moovStart;
  let guard = 0;

  while (offset < moovEnd && guard < MAX_BOXES) {
    guard += 1;
    const box = await readBoxHeader(handle, offset, moovEnd);
    if (!box) return null;

    if (box.type === 'mvhd') {
      const payload = await readAt(handle, offset + box.headerSize, 32);
      if (payload.length < 20) return null;

      const version = payload.readUInt8(0);
      let timescale;
      let duration;

      if (version === 1) {
        // v1: creation(8) modification(8) timescale(4) duration(8)
        if (payload.length < 32) return null;
        timescale = payload.readUInt32BE(20);
        duration = Number(payload.readBigUInt64BE(24));
      } else {
        // v0: creation(4) modification(4) timescale(4) duration(4)
        timescale = payload.readUInt32BE(12);
        duration = payload.readUInt32BE(16);
      }

      if (!timescale || !Number.isFinite(duration)) return null;

      // duration = 0xFFFFFFFF là quy ước "không xác định" (live stream, file
      // đang ghi dở). Trả null chứ đừng trả ra con số vô nghĩa 49710 ngày.
      if (version === 0 && duration === 0xffffffff) return null;

      return duration / timescale;
    }

    offset += box.size;
  }

  return null;
};

/**
 * Đọc thời lượng video (giây).
 *
 * @param {string} filePath
 * @returns {Promise<number|null>} Số giây làm tròn, hoặc null nếu không đọc được.
 *
 * Trả về `null` là kết quả HỢP LỆ, không phải lỗi: định dạng .mkv/.webm/.avi
 * không được hỗ trợ ở đây. Khi đó `VideoDurationSeconds` để trống và Cloudinary
 * sẽ điền vào lúc upload (response của Cloudinary có sẵn trường `duration`).
 */
const getVideoDurationSeconds = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (!MP4_FAMILY.has(ext)) return null;

  let handle;
  try {
    handle = await fs.open(filePath, 'r');
    const { size: fileSize } = await handle.stat();

    let offset = 0;
    let guard = 0;

    // Duyệt các box cấp cao nhất, nhảy qua từng box bằng offset.
    // `mdat` (dữ liệu hình ảnh, có thể vài GB) chỉ bị CỘNG OFFSET, không đọc.
    while (offset < fileSize && guard < MAX_BOXES) {
      guard += 1;
      const box = await readBoxHeader(handle, offset, fileSize);
      if (!box) break;

      if (box.type === 'moov') {
        const seconds = await readDurationFromMoov(
          handle,
          offset + box.headerSize,
          offset + box.size
        );
        return seconds === null ? null : Math.round(seconds);
      }

      offset += box.size;
    }

    return null;
  } catch (error) {
    // Không đọc được thời lượng KHÔNG phải lỗi nghiêm trọng — chỉ ghi debug.
    // Nếu ném lỗi ở đây thì một file video hỏng sẽ làm chết cả job nhập.
    logger.debug(
      `[MediaProbe] Không đọc được thời lượng của ${path.basename(filePath)}: ${error.message}`
    );
    return null;
  } finally {
    if (handle) await handle.close().catch(() => {});
  }
};

/**
 * Ước tính thời lượng từ kích thước file, dùng khi không parse được container.
 *
 * Rất thô — chỉ để hiển thị "ước tính thời gian tạo phụ đề", tuyệt đối KHÔNG
 * ghi vào cột VideoDurationSeconds (thà để trống còn hơn ghi số sai).
 *
 * Hệ số 8 Mbps là mức trung bình của video bài giảng 720p–1080p.
 *
 * @param {number} sizeBytes
 * @returns {number} số giây ước tính
 */
const estimateDurationFromSize = (sizeBytes) => {
  const BITS_PER_SECOND = 8 * 1024 * 1024;
  return Math.round((sizeBytes * 8) / BITS_PER_SECOND);
};

const isVideoExtension = (ext) => VIDEO_EXTENSIONS.has(String(ext).toLowerCase());

module.exports = {
  getVideoDurationSeconds,
  estimateDurationFromSize,
  isVideoExtension,
  VIDEO_EXTENSIONS,
  MP4_FAMILY,
};
