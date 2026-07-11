// src/utils/formatter.util.ts

/**
 * Formats duration from seconds to a short string like "Xh Ym" or "Ym Zs".
 * @param totalSeconds The total duration in seconds.
 * @returns A formatted duration string.
 */
export const formatDurationShort = (totalSeconds?: number | null): string => {
  if (
    totalSeconds === null ||
    totalSeconds === undefined ||
    totalSeconds <= 0
  ) {
    return '-';
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60); // Làm tròn giây

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  // Chỉ hiển thị giây nếu tổng thời gian dưới 1 giờ và có giây
  if (hours === 0 && minutes < 60 && seconds > 0 && parts.length < 2) {
    // Chỉ thêm giây nếu chưa có giờ hoặc phút
    if (minutes === 0 && hours === 0) {
      // Nếu chỉ có giây
      parts.push(`${seconds}s`);
    } else if (minutes > 0 && parts.length < 2) {
      // Nếu có phút, không cần hiển thị giây nữa để ngắn gọn
      // không làm gì, để hiển thị Xm là đủ
    }
  }
  // Nếu quá ngắn (chỉ có giây và ít hơn 1 phút), có thể hiển thị "X s"
  if (parts.length === 0 && seconds > 0) {
    parts.push(`${seconds}s`);
  }

  return parts.length > 0 ? parts.join(' ') : totalSeconds > 0 ? '~1m' : '-'; // Mặc định tối thiểu là ~1m nếu có thời gian
};
