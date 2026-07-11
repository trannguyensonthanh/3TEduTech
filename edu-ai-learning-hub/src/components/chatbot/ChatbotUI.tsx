// src/components/chatbot/ChatbotUI.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '../common/Icons';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';
import { useChatbot, ChatMessage } from '@/hooks/useChatbot'; // <-- IMPORT HOOK MỚI
import ReactMarkdown from 'react-markdown'; // Cần cài đặt: npm install react-markdown
import remarkGfm from 'remark-gfm'; // Cần cài đặt: npm install remark-gfm (để hỗ trợ table, strikethrough...)
import { queryMasterAI } from '@/services/ai.service';

const ChatbotUI: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const initialMessage: ChatMessage = {
    id: 'init-bot-msg',
    text: t('chatbot.greeting', { lesson: 'your learning' }),
    sender: 'bot',
    suggestedQuestions: [
      'Bạn có thể hỏi gì?',
      'Bạn có thể giúp tôi với bài tập này không?',
      'Tôi cần giải thích về một khái niệm',
      'Bạn có thể tóm tắt nội dung bài học không?',
      'Bạn có thể gợi ý các tài liệu học tập không?',
      'Bạn có thể giúp tôi với câu hỏi này?',
      'Bạn có thể giải thích thuật ngữ này không?',
      'Bạn có thể giúp tôi tìm kiếm thông tin không?',
    ],
    voice: '', // Dữ liệu audio base64 nếu có
  };

  const { messages, isTyping, addUserMessage } = useChatbot({
    initialMessages: [initialMessage],
    queryFn: queryMasterAI, // Hàm query từ AI service
    queryContext: {}, // Context bổ sung nếu cần
  });
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isTyping]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    addUserMessage(inputMessage);
    setInputMessage('');
  };

  const handleSuggestedQuestionClick = (question: string) => {
    addUserMessage(question);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  // Lấy danh sách câu hỏi gợi ý từ tin nhắn cuối cùng trong mảng messages
  const lastMessage = messages[messages.length - 1];
  const suggestedQuestions = (lastMessage?.sender === 'bot' &&
    lastMessage.suggestedQuestions) || ['Bạn có thể hỏi gì?'];

  console.log('Suggested Questions:', suggestedQuestions);

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
          className='h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white transition-all transform hover:scale-110'
          aria-label='Toggle Chat'
        >
          <AnimatePresence mode='wait'>
            {isOpen ? (
              <motion.div
                key='close'
                initial={{ rotate: -90, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                exit={{ rotate: 90, scale: 0 }}
              >
                <Icons.close className='h-7 w-7' />
              </motion.div>
            ) : (
              <motion.div
                key='chat'
                initial={{ rotate: 90, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                exit={{ rotate: -90, scale: 0 }}
              >
                <Icons.bot className='h-7 w-7' />
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
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className='fixed bottom-24 right-6 md:right-8 z-[99] bg-card rounded-xl shadow-2xl w-[calc(100vw-3rem)] max-w-md flex flex-col h-[70vh] max-h-[600px] border'
          >
            {/* Header */}
            <div className='p-4 rounded-t-xl flex justify-between items-center border-b'>
              <div className='flex items-center gap-3'>
                <Icons.bot className='h-6 w-6 text-primary' />
                <span className='font-semibold text-lg'>
                  3TEdu AI Assistant
                </span>
              </div>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 text-muted-foreground'
                onClick={() => setIsOpen(false)}
              >
                <Icons.chevronDown className='h-5 w-5' />
              </Button>
            </div>

            {/* Messages Area */}
            <ScrollArea className='flex-1 p-4 bg-background/50'>
              <div className='space-y-5 pb-2'>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-end gap-2.5 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.sender === 'bot' && (
                      <Avatar className='h-8 w-8 border-2 border-primary/20 flex-shrink-0'>
                        <AvatarImage src='/3telogo-icon.png' />
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-full',
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-none'
                          : 'bg-muted text-card-foreground rounded-bl-none'
                      )}
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.text}
                      </ReactMarkdown>
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className='flex items-end gap-2.5 justify-start'
                  >
                    <Avatar className='h-8 w-8 border-2 border-primary/20'>
                      <AvatarImage src='/3telogo-icon.png' />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <div className='bg-muted rounded-2xl rounded-bl-none px-4 py-3 shadow-sm'>
                      <div className='flex space-x-1.5 items-center h-4'>
                        <div className='w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]'></div>
                        <div className='w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]'></div>
                        <div className='w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce'></div>
                      </div>
                    </div>
                  </motion.div>
                )}
                {/* Suggested Questions */}
                {!isTyping && suggestedQuestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='pt-4 flex flex-col items-start gap-2'
                  >
                    <p className='text-xs font-semibold text-muted-foreground'>
                      Suggestions:
                    </p>
                    <div className='flex flex-wrap gap-2'>
                      {suggestedQuestions.map((q, i) => (
                        <Button
                          key={i}
                          variant='outline'
                          size='sm'
                          className='text-xs h-auto py-1 px-2.5'
                          onClick={() => addUserMessage(q)}
                        >
                          {q}
                        </Button>
                      ))}
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className='p-3 sm:p-4 border-t bg-background/80'>
              <div className='flex items-center space-x-2'>
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('chatbot.inputPlaceholder')}
                  className='flex-1 h-11'
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSendMessage}
                  size='icon'
                  className='h-11 w-11 shrink-0'
                  disabled={isTyping || !inputMessage.trim()}
                >
                  <Icons.send className='h-5 w-5' />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatbotUI;
