import React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  /** Chú thích nhỏ dưới con số, ví dụ "so với tháng trước". */
  hint?: string;
  icon?: LucideIcon;
  /** Phần trăm thay đổi. Dương là tăng, âm là giảm, 0 hoặc bỏ trống là không đổi. */
  delta?: number;
  /** Với chỉ số mà giảm mới là tốt (ví dụ tỷ lệ bỏ học), đặt true. */
  invertDelta?: boolean;
  isLoading?: boolean;
  className?: string;
}

/**
 * Thẻ số liệu dùng chung cho bảng điều khiển của cả quản trị viên lẫn giảng viên.
 *
 * Trước đây hai khu vực có hai kiểu thẻ khác nhau, mỗi thẻ lại tự tô một màu nền
 * riêng nên một hàng bốn thẻ hiện ra bốn màu. Ở đây thẻ luôn trung tính; màu chỉ
 * xuất hiện ở phần chênh lệch, và luôn kèm mũi tên chứ không để màu gánh ý nghĩa
 * một mình.
 */
export const StatCard = ({
  label,
  value,
  hint,
  icon: Icon,
  delta,
  invertDelta = false,
  isLoading = false,
  className,
}: StatCardProps) => {
  const hasDelta = typeof delta === 'number' && Number.isFinite(delta);
  const isFlat = !hasDelta || Math.abs(delta as number) < 0.05;
  const isGood = hasDelta && (invertDelta ? (delta as number) < 0 : (delta as number) > 0);

  const DeltaIcon = isFlat ? Minus : (delta as number) > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-5 text-card-foreground',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>

      <div className="mt-3">
        {isLoading ? (
          <div className="h-8 w-24 animate-pulse rounded bg-muted" />
        ) : (
          <p className="text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
        )}
      </div>

      {(hasDelta || hint) && !isLoading ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {hasDelta ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 font-medium',
                isFlat
                  ? 'text-muted-foreground'
                  : isGood
                    ? 'text-success'
                    : 'text-danger'
              )}
            >
              <DeltaIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {isFlat ? 'Không đổi' : `${Math.abs(delta as number).toFixed(1)}%`}
            </span>
          ) : null}
          {hint ? <span className="text-muted-foreground">{hint}</span> : null}
        </div>
      ) : null}
    </div>
  );
};

export default StatCard;
