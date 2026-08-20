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
  const {
    messages,
    isTyping,
    isLoadingHistory,
    sessionId,
    addUserMessage,
    confirmFallback,
    pushBotMessage,
    clearChatHistory,
  } = useChatbot({
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

  /* ------------------------------------------------------------------------
     Quay về từ cổng thanh toán.

     [SỬA 20/08/2026] Bản cũ đẩy tin nhắn chúc mừng NGAY trong hiệu ứng này,
     và tin nhắn đó luôn bị cuốn trôi vài trăm mili giây sau. Lý do:
     `setIsOpen(true)` làm `enabled` của useChatbot đổi từ false sang true, kích
     hoạt lại hiệu ứng khởi tạo phiên; hiệu ứng đó kết thúc bằng
     `setMessages(...)` THAY THẾ CẢ MẢNG bằng lịch sử đọc từ CSDL — cuốn theo
     luôn tin nhắn vừa đẩy vào. Vì đây là nơi DUY NHẤT trong hệ thống sinh ra
     widget ENROLLMENT_SUCCESS (AI Service không hề sinh loại này), widget đó
     thực tế chưa bao giờ tồn tại quá một nhịp render.

     Nay tách làm hai bước: hiệu ứng thứ nhất chỉ ghi nhận "có thanh toán thành
     công" và mở khung chat; hiệu ứng thứ hai chờ phiên nạp xong rồi mới đẩy
     tin nhắn. `hasCelebratedRef` để không đẩy lại khi component render lại. */
  const [pendingCelebration, setPendingCelebration] = useState(false);
  const hasCelebratedRef = useRef(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('chatbot_payment') === 'success') {
      setIsOpen(true);
      setPendingCelebration(true);
      // Dọn tham số khỏi URL để bấm F5 không chúc mừng lại lần nữa.
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  useEffect(() => {
    if (!pendingCelebration) return;
    if (isLoadingHistory || !sessionId) return;
    if (hasCelebratedRef.current) return;
    hasCelebratedRef.current = true;
    setPendingCelebration(false);
    pushBotMessage('🎉 Chúc mừng bạn đã đăng ký khóa học thành công!', {
      type: 'ENROLLMENT_SUCCESS',
      data: {},
    });
  }, [pendingCelebration, isLoadingHistory, sessionId, pushBotMessage]);

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
                ? 'bottom-2 sm:bottom-6 right-2 sm:right-6 md:right-10 w-[calc(100vw-1rem)] sm:w-[820px] md:w-[960px] max-w-[98vw] h-[92vh] max-h-[940px] rounded-2xl'
                : 'bottom-24 right-4 sm:right-6 md:right-8 w-[calc(100vw-1.5rem)] sm:w-[500px] md:w-[540px] max-w-[92vw] h-[78vh] max-h-[720px] rounded-xl'
            )}
          >
            {/* Đầu khung */}
            <div className='flex shrink-0 items-center justify-between border-b border-border p-3.5 sm:p-4'>
              <div className='flex items-center gap-3'>
                <div className='relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground sm:h-10 sm:w-10'>
                  <Icons.bot className='h-5 w-5 sm:h-6 sm:w-6' />
                  <span className='absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-success' />
                </div>
                <div>
                  <h3 className='text-sm font-semibold tracking-tight sm:text-base'>
                    Trợ lý AI 3T EduTech
                  </h3>
                  <span className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                    <span className='inline-block h-1.5 w-1.5 rounded-full bg-success' />
                    Hỗ trợ học tập và lộ trình 24/7
                  </span>
                </div>
              </div>

              <div className='flex items-center gap-1 sm:gap-1.5'>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 rounded-full text-muted-foreground'
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
                  className='h-8 w-8 rounded-full text-muted-foreground'
                  onClick={() => setIsMaximized(!isMaximized)}
                  title={isMaximized ? 'Thu nhỏ khung chat' : 'Phóng to khung chat'}
                >
                  {isMaximized ? <Icons.minimize className='h-4 w-4' /> : <Icons.maximize className='h-4 w-4' />}
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 rounded-full text-muted-foreground'
                  onClick={() => setIsOpen(false)}
                  title='Đóng'
                >
                  <Icons.close className='h-5 w-5' />
                </Button>
              </div>
            </div>

            {/* Vùng tin nhắn */}
            <ScrollArea className='w-full max-w-full flex-1 overflow-hidden bg-background'>
              <div className='w-full min-w-0 max-w-full space-y-5 overflow-x-hidden p-3.5 pb-4 sm:p-5'>
                {messages.map((message, idx) => (
                  <motion.div
                    key={message.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'flex w-full min-w-0 max-w-full items-end gap-2 overflow-x-hidden sm:gap-2.5',
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.sender === 'bot' && (
                      <Avatar className='h-8 w-8 flex-shrink-0 border border-border bg-background'>
                        <AvatarImage src='/3telogo-icon.png' alt='Trợ lý AI' />
                        <AvatarFallback className='bg-muted text-xs font-semibold text-muted-foreground'>AI</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        'relative flex w-fit min-w-0 max-w-[calc(100%-2.75rem)] flex-col gap-2.5 overflow-hidden break-words rounded-xl px-3.5 py-2.5 text-xs leading-relaxed sm:max-w-[calc(100%-3.25rem)] sm:px-4 sm:py-3 sm:text-sm',
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground',
                        message.isFallbackPrompt && 'border border-warning bg-warning-soft text-foreground'
                      )}
                    >
                      {message.sender === 'user' ? (
                        <div className='min-w-0 max-w-full whitespace-pre-wrap break-words leading-relaxed'>
                          {message.text}
                        </div>
                      ) : (
                        <div className='prose prose-sm dark:prose-invert w-full min-w-0 max-w-full whitespace-normal break-words leading-relaxed text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_a]:text-primary [&_a]:underline [&_li]:my-0.5 [&_ol]:my-1.5 [&_ol]:pl-4 [&_p]:my-1.5 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:my-1.5 [&_ul]:pl-4'>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.text}
                          </ReactMarkdown>
                        </div>
                      )}

                      {/* --- Widget đi kèm (hiện sau khi trợ lý viết xong để không che chữ) --- */}
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
                        <div className='mt-2 flex gap-2'>
                          <Button
                            size='sm'
                            className='w-full text-xs'
                            onClick={() => confirmFallback(message.originalQuery!)}
                          >
                            Đồng ý dùng kiến thức chung
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
                    className='flex w-full min-w-0 items-end justify-start gap-2.5'
                  >
                    <Avatar className='h-8 w-8 flex-shrink-0 border border-border bg-background'>
                      <AvatarImage src='/3telogo-icon.png' alt='Trợ lý AI' />
                      <AvatarFallback className='bg-muted text-xs font-semibold text-muted-foreground'>AI</AvatarFallback>
                    </Avatar>
                    <div className='flex items-center gap-2 rounded-xl bg-muted px-4 py-3'>
                      <span className='mr-1 text-xs text-muted-foreground'>Trợ lý đang soạn câu trả lời</span>
                      <div className='h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]'></div>
                      <div className='h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]'></div>
                      <div className='h-2 w-2 rounded-full bg-primary animate-bounce'></div>
                    </div>
                  </motion.div>
                )}
                {/* Câu hỏi gợi ý */}
                {!isTyping && suggestedQuestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='flex max-w-full flex-col items-start gap-2 pt-4'
                  >
                    <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                      Câu hỏi gợi ý cho bạn
                    </p>
                    <div className='flex max-w-full flex-wrap gap-1.5'>
                      {suggestedQuestions.map((q, i) => (
                        <Button
                          key={i}
                          variant='outline'
                          size='sm'
                          className='h-auto max-w-full break-words rounded-lg px-2.5 py-1 text-left text-xs font-normal'
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

            {/* Ô nhập */}
            <div className='shrink-0 border-t border-border bg-card p-3 sm:p-4'>
              <div className='flex items-center gap-2.5'>
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('chatbot.inputPlaceholder', 'Hỏi bất cứ điều gì về bài học, công thức hoặc lộ trình...')}
                  className='h-11 flex-1 rounded-lg px-4 text-sm sm:h-12 sm:text-base'
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSendMessage}
                  size='icon'
                  className='h-11 w-11 shrink-0 rounded-lg sm:h-12 sm:w-12'
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
