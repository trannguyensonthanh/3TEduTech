// src/components/common/LiveNotification.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Icons } from './Icons'; // Đảm bảo có icon Bell và X

interface LiveNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: React.ReactNode; // Cho phép truyền cả component vào message
  actionText?: string;
  onActionClick?: () => void;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.3, delay: 0.2 } },
};

const modalVariants = {
  hidden: { y: '100vh', opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      type: 'spring',
      damping: 25,
      stiffness: 150,
    },
  },
  exit: {
    y: '100vh',
    opacity: 0,
    transition: {
      duration: 0.4,
      ease: 'anticipate',
    },
  },
};

export const LiveNotification: React.FC<LiveNotificationProps> = ({
  isOpen,
  onClose,
  title,
  message,
  actionText,
  onActionClick,
}) => {
  const handleAction = () => {
    onActionClick?.();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key='notification-backdrop'
          variants={backdropVariants}
          initial='hidden'
          animate='visible'
          exit='exit'
          onClick={onClose} // Cho phép đóng khi click ra ngoài
          className='fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4'
        >
          <motion.div
            key='notification-modal'
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()} // Ngăn click xuyên qua modal
            className='w-full max-w-md overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-lg'
          >
            <div className='p-6'>
              <div className='flex items-center gap-4 mb-3'>
                <div className='flex-shrink-0 w-12 h-12 bg-accent text-primary rounded-full flex items-center justify-center'>
                  <Icons.bell className='w-6 h-6' />
                </div>
                <h2 className='text-xl font-bold'>{title}</h2>
                <Button
                  variant='ghost'
                  size='icon'
                  className='ml-auto -mr-2 -mt-2'
                  onClick={onClose}
                >
                  <Icons.x className='h-5 w-5' />
                </Button>
              </div>
              <div className='ml-16 border-l-2 border-border py-1 pl-4 text-sm text-muted-foreground'>
                {message}
              </div>
            </div>

            {actionText && onActionClick && (
              <div className='flex justify-end border-t border-border bg-muted/50 px-6 py-4'>
                <Button onClick={handleAction}>{actionText}</Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
