// src/components/chatbot/ChatbotUI.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '../common/Icons';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import AiMasterChatUI from '@/components/chatbot/AiMasterChatUI';

const ChatbotUI: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className='fixed bottom-6 right-6 z-[100]'
      >
        <Button
          onClick={() => setIsOpen((prev) => !prev)}
          className='h-14 w-14 rounded-full shadow-lg'
          aria-label='Mở hoặc đóng khung trò chuyện'
        >
          <AnimatePresence mode='wait'>
            {isOpen ? (
              <motion.div
                key='close'
                initial={{ rotate: -90, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                exit={{ rotate: 90, scale: 0 }}
              >
                <Icons.close className='h-6 w-6' />
              </motion.div>
            ) : (
              <motion.div
                key='chat'
                initial={{ rotate: 90, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                exit={{ rotate: -90, scale: 0 }}
              >
                <Icons.bot className='h-6 w-6' />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={cn(
              /* Khung nổi lên trên nội dung trang nên ĐƯỢC đổ bóng — đây là
                 ngoại lệ mà quy ước cho phép, khác với thẻ nằm trong luồng. */
              'fixed z-[99] flex flex-col overflow-hidden border border-border bg-card text-card-foreground shadow-xl transition-all duration-300',
              isMaximized
                ? 'bottom-2 sm:bottom-6 right-2 sm:right-6 md:right-10 w-[calc(100vw-1rem)] sm:w-[920px] md:w-[1024px] max-w-[98vw] h-[92vh] max-h-[940px] rounded-2xl'
                : 'bottom-24 right-4 sm:right-6 md:right-8 w-[calc(100vw-1.5rem)] sm:w-[540px] md:w-[600px] max-w-[92vw] h-[78vh] max-h-[720px] rounded-xl'
            )}
          >
            <AiMasterChatUI 
              layoutMode="floating" 
              onClose={() => setIsOpen(false)} 
              isMaximized={isMaximized}
              onToggleMaximize={() => setIsMaximized(!isMaximized)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatbotUI;
