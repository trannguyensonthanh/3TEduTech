import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

/* Nhãn nhỏ dùng trong khu quản trị. Màu nền và màu chữ do nơi gọi truyền qua
   `className` bằng token (ví dụ `bg-success-soft text-success`), thành phần này
   không tự đặt màu cứng. */
const Badge = ({ children, className, ...props }: BadgeProps) => {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground ${className ?? ''}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
