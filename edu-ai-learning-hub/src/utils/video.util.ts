/* eslint-disable @typescript-eslint/no-explicit-any */
// src/utils/video.util.ts (Hoặc .js nếu bạn không dùng TypeScript)

/**
 * Logger đơn giản cho frontend (có thể thay thế bằng thư viện logger phức tạp hơn)
 */
const logger = {
  warn: (message: string, ...optionalParams: any[]) =>
    console.warn(`[VideoUtil] ${message}`, ...optionalParams),
  error: (message: string, ...optionalParams: any[]) =>
    console.error(`[VideoUtil] ${message}`, ...optionalParams),
  info: (message: string, ...optionalParams: any[]) =>
    console.log(`[VideoUtil] ${message}`, ...optionalParams),
};

/**
 * Trích xuất YouTube Video ID từ các dạng URL khác nhau.
 * @param url - URL của video YouTube.
 * @returns Video ID (string) hoặc null nếu không tìm thấy hoặc URL không hợp lệ.
 */
export const extractYoutubeId = (
  url: string | null | undefined
): string | null => {
  if (!url || typeof url !== 'string') return null;

  // Regex để tìm ID YouTube (11 ký tự chữ/số/gạch nối/gạch dưới)
  // Bao gồm các trường hợp:
  // - youtube.com/watch?v=ID
  // - youtu.be/ID
  // - youtube.com/embed/ID
  // - youtube.com/v/ID
  // - youtube.com/shorts/ID
  // - youtube.com/live/ID
  // - music.youtube.com/watch?v=ID
  // Kiểm tra nếu đầu vào đã là một YouTube Video ID hợp lệ (11 ký tự chữ/số/gạch nối/gạch dưới)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  // Regex để trích xuất YouTube Video ID từ URL
  const youtubeRegex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
  const match = url.match(youtubeRegex);
  if (match && match[1]) {
    return match[1];
  }

  // Thử phân tích bằng URL API như một fallback (ít hiệu quả hơn regex cho việc trích xuất ID)
  try {
    const urlObj = new URL(url);
    // Ưu tiên tham số 'v'
    const videoIdParam = urlObj.searchParams.get('v');
    if (videoIdParam && videoIdParam.length === 11) {
      return videoIdParam;
    }
    // Xử lý youtu.be và /shorts/, /live/, /embed/ từ pathname
    if (urlObj.hostname === 'youtu.be') {
      const pathId = urlObj.pathname.split('/')[1];
      if (pathId && pathId.length === 11) return pathId;
    }
    const pathSegments = urlObj.pathname.split('/');
    const potentialIdIndex = pathSegments.findIndex((segment) =>
      ['embed', 'live', 'shorts', 'v'].includes(segment)
    );
    if (
      potentialIdIndex !== -1 &&
      pathSegments[potentialIdIndex + 1] &&
      pathSegments[potentialIdIndex + 1].length === 11
    ) {
      return pathSegments[potentialIdIndex + 1].split(/[?#]/)[0]; // Lấy ID trước dấu ? hoặc #
    }
  } catch (error) {
    // Bỏ qua lỗi phân tích URL nếu regex không khớp
    // logger.warn(`Could not parse URL with new URL(): ${url}`, error);
  }

  logger.warn(`Could not extract YouTube ID from URL: ${url}`);
  return null;
};

/**
 * Trích xuất Vimeo Video ID từ các dạng URL khác nhau.
 * @param url - URL của video Vimeo.
 * @returns Video ID (string dạng số) hoặc null nếu không tìm thấy hoặc URL không hợp lệ.
 */
export const extractVimeoId = (
  url: string | null | undefined
): string | null => {
  if (!url || typeof url !== 'string') return null;

  // Regex cho Vimeo ID (chuỗi số)
  // Bao gồm:
  // - vimeo.com/ID
  // - vimeo.com/channels/.../ID
  // - vimeo.com/groups/.../videos/ID
  // - player.vimeo.com/video/ID
  // - Có thể có các tham số khác (?h=...)
  const vimeoRegex =
    /(?:vimeo\.com\/(?:[^\/]+\/(?:videos|video)\/)?|player\.vimeo\.com\/video\/)([0-9]+)/;
  const match = url.match(vimeoRegex);

  if (match && match[1]) {
    return match[1];
  }

  // Thử phân tích bằng URL API như fallback
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('vimeo.com')) {
      const pathParts = urlObj.pathname.split('/');
      // Tìm phần tử cuối cùng là chuỗi số
      for (let i = pathParts.length - 1; i >= 0; i--) {
        if (pathParts[i] && /^\d+$/.test(pathParts[i])) {
          return pathParts[i];
        }
      }
    }
  } catch (error) {
    // logger.warn(`Could not parse URL with new URL(): ${url}`, error);
  }

  logger.warn(`Could not extract Vimeo ID from URL: ${url}`);
  return null;
};

// Có thể thêm các hàm tiện ích khác liên quan đến video ở đây
// ví dụ: tạo URL nhúng từ ID
export const getYoutubeEmbedUrl = (videoId: string | null): string | null => {
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}`;
};

export const getVimeoEmbedUrl = (videoId: string | null): string | null => {
  if (!videoId) return null;
  return `https://player.vimeo.com/video/${videoId}`;
};
