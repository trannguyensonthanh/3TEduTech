// src/components/common/FullScreenLoader.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Icons } from './Icons'; // Giả sử bạn có Icons.logo

interface FullScreenLoaderProps {
  text?: string;
  // Thêm prop `show` để có thể kiểm soát nó từ bên ngoài nếu cần,
  // nhưng thường nó sẽ được render có điều kiện
  // show?: boolean;
}

const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({ text }) => {
  const { t } = useTranslation();

  // Định nghĩa các variant cho animation của backdrop và content
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3, ease: 'easeInOut' } },
    exit: { opacity: 0, transition: { duration: 0.3, ease: 'easeInOut' } },
  };

  const contentVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
        delay: 0.1,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: -20,
      transition: {
        duration: 0.3,
        ease: 'easeIn',
      },
    },
  };

  return (
    // AnimatePresence sẽ xử lý animation khi component bị xóa khỏi cây DOM
    <AnimatePresence>
      <motion.div
        key='loader-backdrop'
        variants={backdropVariants}
        initial='hidden'
        animate='visible'
        exit='exit'
        className='fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm'
      >
        <motion.div
          key='loader-content'
          variants={contentVariants}
          className='flex flex-col items-center justify-center gap-4 p-8 bg-card rounded-2xl shadow-2xl'
        >
          {/* Bạn có thể thay bằng logo của mình */}
          {/* <Icons.logo className="h-10 w-10 text-primary animate-pulse" /> */}
          <div className='h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent'></div>

          <p className='mt-2 text-card-foreground text-base font-medium tracking-wide'>
            {text || t('fullScreenLoader.processing')}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FullScreenLoader;
