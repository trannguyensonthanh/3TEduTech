import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Nút hành động đặt bên phải, ví dụ "Tạo khóa học". */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Đầu trang dùng chung cho mọi màn hình trong khu làm việc.
 *
 * Trước đây mỗi trang tự đặt cỡ chữ và khoảng cách cho tiêu đề, nên chuyển giữa
 * hai trang là thấy tiêu đề nhảy cỡ. Gom về một chỗ để mọi trang mở ra giống
 * nhau, và khi cần đổi thì đổi một lần.
 */
export const PageHeader = ({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) => (
  <div
    className={cn(
      'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
      className
    )}
  >
    <div className="min-w-0 space-y-1">
      <h1 className="truncate text-2xl font-semibold tracking-tight">{title}</h1>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
    {actions ? (
      <div className="flex shrink-0 items-center gap-2">{actions}</div>
    ) : null}
  </div>
);

export default PageHeader;
