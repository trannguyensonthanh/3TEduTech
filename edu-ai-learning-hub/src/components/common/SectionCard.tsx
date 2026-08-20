import React from 'react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

/**
 * Khối nội dung chuẩn: nền thẻ, viền mảnh, không đổ bóng.
 *
 * Đổ bóng cố tình không dùng ở đây. Bóng là tín hiệu "lớp nổi lên trên", dành
 * cho hộp thoại và menu; rải bóng lên mọi thẻ làm giao diện trông đục và mất
 * đi thứ bậc thị giác.
 */
export const SectionCard = ({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: SectionCardProps) => (
  <section
    className={cn(
      'rounded-xl border border-border bg-card text-card-foreground',
      className
    )}
  >
    {(title || actions) && (
      <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0 space-y-0.5">
          {title ? (
            <h2 className="truncate text-base font-semibold">{title}</h2>
          ) : null}
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </header>
    )}
    <div className={cn('p-5', bodyClassName)}>{children}</div>
  </section>
);

export default SectionCard;
