// src/components/common/GlobalLoader.tsx
import React from 'react';
import { motion } from 'framer-motion';

// SVG Logo của bạn. Bạn có thể thay thế bằng component Icon hoặc file SVG thật.
// Ở đây tôi tạo một logo "3T" đơn giản bằng SVG để làm ví dụ.
const LogoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 200 200'
    width='80'
    height='80'
    {...props}
  >
    <rect width='200' height='200' rx='30' fill='currentColor' />
    <path
      d='M60 40 L60 160 M40 40 L80 40 M40 100 L80 100'
      stroke='#FFFFFF'
      strokeWidth='15'
      strokeLinecap='round'
    />
    <path
      d='M140 40 L140 160 M120 40 L160 40 M120 100 L160 100'
      stroke='#FFFFFF'
      strokeWidth='15'
      strokeLinecap='round'
    />
  </svg>
);

interface GlobalLoaderProps {
  /** Hiển thị toàn màn hình hay chỉ là một spinner nhỏ */
  fullscreen?: boolean;
  /** Thông điệp hiển thị dưới loader */
  message?: string;
  /** Kích thước của loader */
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-24 h-24',
};

export const GlobalLoader: React.FC<GlobalLoaderProps> = ({
  fullscreen = false,
  message,
  size = 'md',
}) => {
  const loaderVariants = {
    initial: {
      opacity: 0,
      scale: 0.8,
    },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.3,
        ease: 'easeIn',
      },
    },
  };

  const logoPulseVariants = {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [1, 0.8, 1],
      transition: {
        duration: 1.5,
        ease: 'easeInOut',
        repeat: Infinity,
      },
    },
  };

  const LoaderContent = () => (
    <>
      <motion.div
        variants={logoPulseVariants}
        initial='initial'
        animate='animate'
      >
        <LogoIcon className='text-primary' />
      </motion.div>
      {message && (
        <p className='mt-4 text-sm text-muted-foreground animate-pulse'>
          {message}
        </p>
      )}
    </>
  );

  if (fullscreen) {
    return (
      <motion.div
        key='global-loader'
        variants={loaderVariants}
        initial='initial'
        animate='animate'
        exit='exit'
        className='fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm'
      >
        <LoaderContent />
      </motion.div>
    );
  }

  // Loader inline
  return (
    <div
      className={`flex flex-col items-center justify-center ${sizeClasses[size]}`}
    >
      <LoaderContent />
    </div>
  );
};
