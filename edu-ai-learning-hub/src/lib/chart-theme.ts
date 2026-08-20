/**
 * Bảng màu và cấu hình dùng chung cho mọi biểu đồ.
 *
 * Vì sao cần tệp này: trước đây mỗi trang tự đặt mã màu cho biểu đồ của mình,
 * nên hai biểu đồ cạnh nhau dùng hai hệ màu khác hẳn và không trang nào đổi màu
 * đúng khi chuyển sang chế độ tối.
 *
 * Ba quy tắc bắt buộc khi dùng:
 *   1. Gán màu theo THỨ TỰ khe, không xoay vòng. Chuỗi thứ chín phải gộp vào
 *      nhóm "Khác" hoặc tách thành nhiều biểu đồ nhỏ.
 *   2. Màu đi theo THỰC THỂ, không đi theo thứ hạng. Bộ lọc làm giảm số chuỗi
 *      thì các chuỗi còn lại phải giữ nguyên màu cũ.
 *   3. Không dùng màu trạng thái (đạt / cảnh báo / lỗi) làm màu chuỗi dữ liệu.
 */

/** Tám khe màu cố định. Đọc từ biến CSS nên tự đúng ở cả hai chế độ sáng tối. */
export const SERIES = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
  'var(--chart-8)',
] as const;

export const MAX_SERIES = SERIES.length;

/** Lấy màu cho khe thứ i. Vượt quá tám khe là lỗi thiết kế, không phải lỗi màu. */
export const seriesColor = (index: number): string =>
  SERIES[index % SERIES.length];

/** Màu khung biểu đồ: lưới, trục, chữ. */
export const chartChrome = {
  grid: 'var(--chart-grid)',
  axis: 'var(--chart-axis)',
  ink: 'var(--chart-ink)',
  inkMuted: 'var(--chart-ink-muted)',
} as const;

/** Thuộc tính dùng lại cho trục của Recharts. Chữ trục luôn là màu chữ mờ,
 *  không bao giờ mang màu của chuỗi dữ liệu. */
export const axisProps = {
  stroke: chartChrome.axis,
  tickLine: false,
  axisLine: false,
  tick: { fill: chartChrome.inkMuted, fontSize: 12 },
} as const;

export const gridProps = {
  stroke: chartChrome.grid,
  strokeDasharray: '3 3',
  vertical: false,
} as const;

/** Hộp chú giải khi di chuột. Dùng token bề mặt để nổi đúng trên cả hai nền. */
export const tooltipProps = {
  contentStyle: {
    background: 'hsl(var(--popover))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '0.5rem',
    color: 'hsl(var(--popover-foreground))',
    fontSize: 12,
    boxShadow: '0 8px 24px -8px rgb(15 23 42 / 0.18)',
  },
  labelStyle: { color: 'hsl(var(--muted-foreground))', marginBottom: 4 },
  cursor: { fill: 'hsl(var(--muted))', opacity: 0.5 },
} as const;

/** Bo tròn đầu cột, neo vào đường cơ sở. */
export const barRadius: [number, number, number, number] = [4, 4, 0, 0];
export const barRadiusHorizontal: [number, number, number, number] = [0, 4, 4, 0];
