// src/pages/instructor/components/StatCard.tsx
import React from 'react';
import type { LucideIcon } from 'lucide-react';
import CommonStatCard from '@/components/common/StatCard';

/**
 * Lớp bọc mỏng quanh thẻ số liệu dùng chung.
 *
 * Trước đây tệp này tự vẽ một thẻ riêng cho khu giảng viên: nền chuyển sắc, quầng
 * sáng, chữ đổ màu, năm biến thể màu khác nhau. Hậu quả là một hàng bốn thẻ hiện
 * ra bốn hệ màu, và khu giảng viên trông như một sản phẩm khác hẳn khu quản trị.
 *
 * Phần tự vẽ đã bị xóa. Tệp chỉ còn nhiệm vụ chuyển tên props cũ sang props của
 * `@/components/common/StatCard`, để những nơi đang import nó vẫn chạy nguyên vẹn
 * mà không phải sửa lời gọi.
 */
export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  isLoading: boolean;
  className?: string;
  /**
   * Giữ lại cho tương thích ngược nhưng KHÔNG còn tác dụng.
   * Thẻ số liệu nay luôn trung tính; màu chỉ dành cho trạng thái, không dành cho
   * việc phân biệt thẻ này với thẻ kia.
   */
  variant?: 'cyan' | 'fuchsia' | 'amber' | 'emerald' | 'default';
}

/**
 * Lời gọi cũ truyền icon dưới dạng phần tử JSX đã dựng sẵn (ví dụ
 * `<Users className="h-6 w-6" />`), trong khi thẻ dùng chung nhận vào chính
 * component icon để tự quyết định cỡ. Ở đây rút lấy component từ phần tử đó,
 * nhờ vậy mọi icon trong khu giảng viên có cùng một cỡ.
 */
const resolveIcon = (icon: React.ReactNode): LucideIcon | undefined =>
  React.isValidElement(icon) ? (icon.type as unknown as LucideIcon) : undefined;

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  isLoading,
  className,
}) => (
  <CommonStatCard
    label={title}
    value={value}
    hint={description}
    icon={resolveIcon(icon)}
    isLoading={isLoading}
    className={className}
  />
);

export default StatCard;
