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
// [SỬA 17/08/2026 — LEVEL 3] Không còn gọi thẳng AI Service nữa; useChatbot
// tự quản lý phiên qua backend /v1/ai/*.
import { 
  CourseCarouselWidget, 
  ChatPaymentSelectorWidget, 
  CheckoutRedirectWidget,
  EnrollmentSuccessWidget
} from './widgets';
import { Trash2 } from 'lucide-react';

const ChatbotUI: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  /* [GỠ 17/08/2026 — LEVEL 3] Đã bỏ khối lấy `enrolledCourses`.
     Nó chỉ tồn tại để nhét vào `queryContext: { enrolled_courses }` gửi kèm
     request AI. Nhưng schema AgentRequest phía AI Service chỉ nhận
     query/chat_history/top_k, và Pydantic mặc định LƯỢC BỎ mọi khóa lạ — nghĩa
     là trường đó chưa bao giờ tới được mô hình. Giữ lại chỉ tốn thêm một lượt
     gọi API danh sách ghi danh mỗi lần mở trang chủ mà không đem lại gì.
     (Nếu sau này muốn AI thật sự biết học viên đã mua khóa nào, phải bổ sung
      trường vào AgentRequest ở ai-service và cho backend tự truy vấn — client
      không được phép tự khai, vì đó lại là một dạng dữ liệu giả mạo được.) */

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

  /* [SỬA 17/08/2026 — LEVEL 3]
     scope='MASTER' → chatbot tổng ở trang chủ có phiên RIÊNG, tách hẳn khỏi
     trợ lý AI bên trong khóa học (scope='COURSE'). Trước đây cả hai dùng chung
     một khóa localStorage nên lịch sử lẫn vào nhau.

     Đã bỏ `queryFn` và `queryContext`:
       - queryFn: hook nay tự gọi backend, không cần truyền hàm gọi API vào.
       - queryContext ({ enrolled_courses }): trường này VỐN ĐÃ bị bỏ qua —
         schema AgentRequest phía AI Service chỉ nhận query/chat_history/top_k
         và Pydantic mặc định lược bỏ khóa lạ. Nên gỡ đi không làm mất tính
         năng nào; giữ lại thì nay còn bị Joi ở backend từ chối thẳng. */
  const { messages, isTyping, addUserMessage, confirmFallback, pushBotMessage, clearChatHistory } = useChatbot({
    initialMessages: [initialMessage],
    scope: 'MASTER',
    // Chỉ khởi tạo phiên khi người dùng thực sự mở khung chat — tránh tạo phiên
    // rỗng cho mọi lượt truy cập trang chủ.
    enabled: isOpen,
  });
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages.length]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('chatbot_payment') === 'success') {
      setIsOpen(true);
      pushBotMessage('🎉 Chúc mừng bạn đã đăng ký khóa học thành công!', { 
        type: 'ENROLLMENT_SUCCESS', 
        data: {} 
      });
      // Clean URL query param
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }
  }, [pushBotMessage]);

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
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={cn(
              'fixed z-[99] bg-card/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-[0_20px_70px_-10px_rgba(0,0,0,0.45)] border border-primary/20 flex flex-col transition-all duration-300 overflow-hidden',
              isMaximized
                ? 'bottom-2 sm:bottom-6 right-2 sm:right-6 md:right-10 w-[calc(100vw-1rem)] sm:w-[820px] md:w-[960px] max-w-[98vw] h-[92vh] max-h-[940px] rounded-2xl sm:rounded-3xl'
                : 'bottom-24 right-4 sm:right-6 md:right-8 w-[calc(100vw-1.5rem)] sm:w-[500px] md:w-[540px] max-w-[92vw] h-[78vh] max-h-[720px] rounded-xl sm:rounded-2xl'
            )}
          >
            {/* Header */}
            <div className='p-3.5 sm:p-4 rounded-t-xl sm:rounded-t-2xl flex justify-between items-center border-b border-border/60 bg-gradient-to-r from-primary/15 via-background to-background/90 backdrop-blur-md shadow-sm shrink-0'>
              <div className='flex items-center gap-3'>
                <div className='relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-primary to-blue-600 shadow-md text-white shrink-0'>
                  <Icons.bot className='h-5 w-5 sm:h-6 sm:w-6 animate-pulse' />
                  <span className='absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-card rounded-full' />
                </div>
                <div>
                  <h3 className='font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent'>
                    3TEdu AI Assistant
                  </h3>
                  <span className='text-[11px] text-green-600 dark:text-green-400 font-medium flex items-center gap-1.5'>
                    <span className='w-1.5 h-1.5 rounded-full bg-green-500 animate-ping inline-block' />
                    Trợ lý học tập & Lộ trình 24/7
                  </span>
                </div>
              </div>
              
              <div className='flex items-center gap-1 sm:gap-1.5'>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 rounded-full hover:bg-red-500/10 hover:text-red-500 text-muted-foreground transition-colors'
                  onClick={() => {
                    if (window.confirm('Bạn có chắc chắn muốn xoá lịch sử đoạn chat này?')) {
                      clearChatHistory();
                    }
                  }}
                  title='Xoá lịch sử chat'
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors'
                  onClick={() => setIsMaximized(!isMaximized)}
                  title={isMaximized ? 'Thu nhỏ khung chat' : 'Phóng to khung chat'}
                >
                  {isMaximized ? <Icons.minimize className='h-4 w-4' /> : <Icons.maximize className='h-4 w-4' />}
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors'
                  onClick={() => setIsOpen(false)}
                  title='Đóng'
                >
                  <Icons.close className='h-5 w-5' />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className='flex-1 bg-gradient-to-b from-background/30 via-background/60 to-muted/20 w-full max-w-full overflow-hidden'>
              <div className='p-3.5 sm:p-5 space-y-5 pb-4 w-full max-w-full min-w-0 overflow-x-hidden'>
                {messages.map((message, idx) => (
                  <motion.div
                    key={message.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'flex items-end gap-2 sm:gap-2.5 w-full max-w-full min-w-0 overflow-x-hidden',
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.sender === 'bot' && (
                      <Avatar className='h-8 w-8 sm:h-8 sm:w-8 border-2 border-primary/30 shadow-md flex-shrink-0 bg-background'>
                        <AvatarImage src='/3telogo-icon.png' alt='AI' />
                        <AvatarFallback className='bg-primary/10 text-primary font-bold text-xs'>AI</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        'relative max-w-[calc(100%-2.75rem)] sm:max-w-[calc(100%-3.25rem)] w-fit rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 shadow-md text-xs sm:text-sm leading-relaxed break-words min-w-0 overflow-hidden flex flex-col gap-2.5 transition-all duration-200',
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-blue-600 via-primary to-indigo-600 text-white font-medium rounded-br-none shadow-primary/25 shadow-lg'
                          : 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 text-foreground rounded-bl-none shadow-lg',
                        message.isFallbackPrompt && 'border-2 border-amber-500/70 bg-amber-500/10'
                      )}
                    >
                      {message.sender === 'user' ? (
                        <div className="text-white font-medium text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap max-w-full min-w-0 [&_*]:!text-white">
                          {message.text}
                        </div>
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-full w-full min-w-0 break-words whitespace-normal leading-relaxed text-slate-800 dark:text-slate-100 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1.5 [&_ul]:my-1.5 [&_ul]:pl-4 [&_ol]:my-1.5 [&_ol]:pl-4 [&_li]:my-0.5 [&_strong]:font-bold [&_strong]:text-blue-600 dark:[&_strong]:text-blue-400 [&_a]:text-blue-500 [&_a]:underline">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.text}
                          </ReactMarkdown>
                        </div>
                      )}
                      
                      {/* --- RENDER UI WIDGETS (Hiển thị sau khi AI hoàn tất trả lời text để không che text) --- */}
                      {message.uiWidget && !(isTyping && idx === messages.length - 1) && (
                        <div className="mt-2 w-full max-w-full overflow-hidden min-w-0">
                          {message.uiWidget.type === 'COURSE_CAROUSEL' && (
                            <CourseCarouselWidget 
                              data={message.uiWidget.data as any}
                              onSelectCourse={(msg) => addUserMessage(msg)} 
                            />
                          )}
                          {message.uiWidget.type === 'PAYMENT_SELECTOR' && (
                            <ChatPaymentSelectorWidget 
                              data={message.uiWidget.data as any} 
                              onSelectPayment={(method) => {
                                const cName = (message.uiWidget?.data as any)?.courseName || 'đã chọn';
                                addUserMessage(`Tôi chọn thanh toán bằng ${method} cho khóa học: ${cName}`);
                              }} 
                            />
                          )}
                          {message.uiWidget.type === 'CHECKOUT_REDIRECT' && (
                            <CheckoutRedirectWidget data={message.uiWidget.data as any} />
                          )}
                          {message.uiWidget.type === 'ENROLLMENT_SUCCESS' && (
                            <EnrollmentSuccessWidget data={message.uiWidget.data as any} />
                          )}
                        </div>
                      )}

                      {message.isFallbackPrompt && message.originalQuery && (
                        <div className="mt-3 flex gap-2">
                          <Button 
                            size="sm" 
                            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white w-full shadow-md font-semibold text-xs py-2"
                            onClick={() => confirmFallback(message.originalQuery!)}
                          >
                            💡 Đồng ý dùng kiến thức chung
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className='flex items-end gap-2.5 justify-start w-full min-w-0'
                  >
                    <Avatar className='h-8 w-8 border-2 border-primary/30 shadow-md flex-shrink-0 bg-background'>
                      <AvatarImage src='/3telogo-icon.png' />
                      <AvatarFallback className='bg-primary/10 text-primary font-bold text-xs'>AI</AvatarFallback>
                    </Avatar>
                    <div className='bg-card/95 dark:bg-slate-900/90 border border-border/70 rounded-2xl rounded-bl-none px-4 py-3 shadow-lg flex items-center gap-2'>
                      <span className='text-xs font-medium text-muted-foreground mr-1'>AI đang suy nghĩ</span>
                      <div className='w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]'></div>
                      <div className='w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]'></div>
                      <div className='w-2 h-2 rounded-full bg-primary animate-bounce'></div>
                    </div>
                  </motion.div>
                )}
                {/* Suggested Questions */}
                {!isTyping && suggestedQuestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='pt-4 flex flex-col items-start gap-2 max-w-full'
                  >
                    <p className='text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider'>
                      <span className='w-1.5 h-1.5 rounded-full bg-blue-500'></span>
                      Câu hỏi gợi ý cho bạn:
                    </p>
                    <div className='flex flex-wrap gap-1.5 max-w-full'>
                      {suggestedQuestions.map((q, i) => (
                        <Button
                          key={i}
                          variant='outline'
                          size='sm'
                          className='text-xs h-auto py-1 px-2.5 rounded-xl bg-card hover:bg-primary/10 hover:text-primary hover:border-primary/40 shadow-sm transition-all text-left font-normal break-words max-w-full'
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
            <div className='p-3 sm:p-4 border-t border-border/60 bg-background/95 backdrop-blur-md shrink-0'>
              <div className='flex items-center space-x-2.5'>
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('chatbot.inputPlaceholder', 'Hỏi bất cứ điều gì về bài học, công thức hoặc lộ trình...')}
                  className='flex-1 h-11 sm:h-12 rounded-xl px-4 bg-muted/40 hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-primary/40 transition-all text-sm sm:text-base border-border/70 shadow-inner'
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSendMessage}
                  size='icon'
                  className='h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-tr from-primary to-blue-600 hover:from-primary/90 hover:to-blue-500 text-white shadow-lg shadow-primary/25 shrink-0 transition-transform hover:scale-105 active:scale-95'
                  disabled={isTyping || !inputMessage.trim()}
                  title='Gửi tin nhắn'
                >
                  <Icons.sendHorizonal className='h-5 w-5' />
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
