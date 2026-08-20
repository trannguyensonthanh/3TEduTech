import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

const Badge = ({ children, className, ...props }: BadgeProps) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
