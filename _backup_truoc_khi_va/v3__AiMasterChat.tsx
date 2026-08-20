// src/pages/AiMasterChat.tsx

import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MessageSquare,
  Plus,
  Trash2,
  Send,
  Sparkles,
  Bot,
  User,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  BookOpen,
  RefreshCw,
  Layers,
  ShieldCheck,
  Search,
  Copy,
  Check,
} from 'lucide-react';
import {
  getOrCreateChatSession,
  streamChatMessage,
  UIWidgetData,
} from '@/services/ai.service';
import {
  CourseCarouselWidget,
  ChatPaymentSelectorWidget,
  CheckoutRedirectWidget,
  EnrollmentSuccessWidget,
} from '@/components/chatbot/widgets/index';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useMyEnrollments } from '@/hooks/queries/enrollment.queries';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  sources?: { file_name: string; content: string }[];
  suggestedQuestions?: string[];
  uiWidget?: UIWidgetData | null;
  timestamp: number;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

const STORAGE_KEY_SESSIONS = 'agy_master_chat_sessions_v2';
const STORAGE_KEY_ACTIVE_ID = 'agy_master_chat_active_id_v2';

const initialWelcomeMessage: ChatMessage = {
  id: `welcome-${Date.now()}`,
  text: `Chào mừng bạn đến với **AI Learning Master Suite** – Trợ lý trí tuệ nhân tạo toàn diện thế hệ mới! 🌟\n\nTôi được gia cố sức mạnh xử lý luồng (SSE Real-time Token Streaming) và kết nối trực tiếp với cỗ máy Thanh toán, Lộ trình học và Kiến thức chuyên sâu.\n\n✨ *Bạn cần tôi hỗ trợ tìm khóa học, giải đáp bài tập hay đăng ký thanh toán ngay lập tức?*`,
  sender: 'bot',
  timestamp: Date.now(),
  suggestedQuestions: [
    'Khóa học nào phù hợp cho người mới bắt đầu lập trình web?',
    'Tôi muốn mua khóa học số 1 trong danh sách của bạn',
    'Hướng dẫn tôi thanh toán trực tiếp qua cổng MoMo hoặc VNPAY',
    'Giải đáp kỹ thuật và so sánh giữa React và Vue.js',
  ],
};

const AiMasterChat: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  // Fetch student's enrolled courses to sync knowledge & widget badges
  const { data: enrollmentData } = useMyEnrollments({}, { placeholderData: (prev) => prev });
  const enrolledCourses = (enrollmentData?.enrollments || []).map((e: any) => ({
    courseId: e.courseId,
    courseName: e.courseName,
    slug: e.slug
  }));

  // Typewriter Token Buffer refs for silky smooth SSE streaming
  const tokenQueueRef = useRef<string[]>([]);
  const typewriterTimerRef = useRef<any>(null);
  const streamDoneDataRef = useRef<{ isDone: boolean; suggestedQuestions?: string[] }>({ isDone: false });

  /* [THÊM 19/08/2026] Phiên trò chuyện phía MÁY CHỦ.

     Danh sách hội thoại ở thanh bên là của riêng trình duyệt (localStorage,
     id kiểu chuỗi) — nó chỉ để người dùng xem lại. Còn muốn gọi luồng
     streaming mới thì phải có sessionId THẬT trong CSDL, vì đường dẫn là
     /ai/sessions/:sessionId/chat/stream và lịch sử hội thoại nay do backend
     giữ chứ không gửi kèm từ trình duyệt nữa.

     Tạo lười (chỉ khi gửi tin đầu tiên) để mở trang không kèm một lần gọi API
     thừa. Backend trả về đúng phiên MASTER đang mở nếu đã có. */
  const serverSessionIdRef = useRef<number | null>(null);
  const ensureServerSession = async (): Promise<number> => {
    if (serverSessionIdRef.current !== null) return serverSessionIdRef.current;
    const session = await getOrCreateChatSession({ scope: 'MASTER' });
    serverSessionIdRef.current = session.sessionId;
    return session.sessionId;
  };
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // UI Scale / Zoom state
  const [scaleFactor, setScaleFactor] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  
  // Sessions state
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading chat sessions:', e);
    }
    const initialSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'Trợ Lý Trí Tuệ AI Master',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [initialWelcomeMessage],
    };
    return [initialSession];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const savedId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
    return savedId || (sessions[0]?.id ?? '');
  });

  const [inputText, setInputText] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Current Active Session
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const messages = activeSession ? activeSession.messages : [];

  // Save to LocalStorage whenever sessions change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error('Error saving sessions:', e);
    }
  }, [sessions]);

  useEffect(() => {
    // Tự động lướt lên đầu trang khi component mount
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (activeSessionId) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activeSessionId);
    }
    // Tự động lướt lên đầu màn hình & khung chat khi chọn/chuyển trang hội thoại
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeSessionId]);

  // Scroll to bottom ONLY when a new message is initiated, eliminating jitter & giving users freedom to scroll during streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
    };
  }, []);

  // Handlers for Session Management
  const handleNewSession = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: `Hội thoại #${sessions.length + 1}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [{ ...initialWelcomeMessage, id: `welcome-${Date.now()}`, timestamp: Date.now() }],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    toast({
      title: '✨ Tạo phiên chat mới',
      description: 'Không gian làm việc mới đã sẵn sàng!',
    });
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      toast({
        title: 'Cảnh báo',
        description: 'Bạn phải giữ lại ít nhất một phiên đàm thoại AI!',
        variant: 'destructive',
      });
      return;
    }
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    if (activeSessionId === id) {
      setActiveSessionId(remaining[0].id);
    }
    toast({
      title: '🗑️ Đã xóa phiên',
      description: 'Lịch sử cuộc hội thoại đã được loại bỏ.',
    });
  };

  // Send message with SSE real-time token streaming
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText ?? inputText).trim();
    if (!textToSend || isStreaming) return;

    if (!customText) {
      setInputText('');
    }

    const userMsgId = `user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      text: textToSend,
      sender: 'user',
      timestamp: Date.now(),
    };

    const botMsgId = `bot-${Date.now()}`;
    const placeholderBotMessage: ChatMessage = {
      id: botMsgId,
      text: '',
      sender: 'bot',
      timestamp: Date.now() + 1,
    };

    // Update active session with user message + bot placeholder and auto-title if it's the first user inquiry
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeSession.id) return s;
        const updatedMessages = [...s.messages, userMessage, placeholderBotMessage];
        // Generate automatic session title from first user message
        const newTitle =
          s.title.startsWith('Hội thoại #') || s.title === 'Trợ Lý Trí Tuệ AI Master'
            ? textToSend.slice(0, 28) + (textToSend.length > 28 ? '...' : '')
            : s.title;
        return {
          ...s,
          title: newTitle,
          updatedAt: Date.now(),
          messages: updatedMessages,
        };
      })
    );

    setIsStreaming(true);

    /* [BỎ 19/08/2026] Khối dựng `chat_history` ở đây đã được gỡ.
       Lịch sử hội thoại nay do backend đọc từ CSDL theo sessionId — gửi kèm từ
       trình duyệt vừa thừa vừa để người dùng tự bịa được lịch sử. */

    // Reset typewriter buffer queue
    tokenQueueRef.current = [];
    if (typewriterTimerRef.current) {
      clearInterval(typewriterTimerRef.current);
      typewriterTimerRef.current = null;
    }
    streamDoneDataRef.current = { isDone: false };

    // Luồng gõ chữ nhịp nhàng mượt mà (~60 FPS)
    typewriterTimerRef.current = setInterval(() => {
      if (tokenQueueRef.current.length > 0) {
        const count = tokenQueueRef.current.length > 80 ? 8 : tokenQueueRef.current.length > 30 ? 4 : 2;
        const chunk = tokenQueueRef.current.splice(0, count).join('');
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSession.id
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === botMsgId
                      ? { ...m, text: (m.text || '') + chunk }
                      : m
                  ),
                }
              : s
          )
        );
      } else if (streamDoneDataRef.current.isDone) {
        if (typewriterTimerRef.current) {
          clearInterval(typewriterTimerRef.current);
          typewriterTimerRef.current = null;
        }
        setIsStreaming(false);
        const suggestions = streamDoneDataRef.current.suggestedQuestions || [];
        if (suggestions.length > 0) {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === activeSession.id
                ? {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === botMsgId
                        ? { ...m, suggestedQuestions: suggestions }
                        : m
                    ),
                  }
                : s
            )
          );
        }
      }
    }, 16);

    /* [SỬA 19/08/2026] `streamAgentAI` đã bị xóa khỏi ai.service.ts vì nó gọi
       THẲNG từ trình duyệt sang AI Service kèm MASTER_API_KEY nhúng cứng —
       ai mở DevTools cũng lấy được khóa. Tệp này là chỗ duy nhất còn sót lại
       chưa chuyển, nên trang chat đang hỏng ngay từ lúc nạp mô-đun.

       Hai thứ không còn được gửi kèm và LÝ DO:
         - chat_history      : backend đọc từ CSDL theo sessionId
         - enrolled_courses  : trình duyệt không được tự khai mình học khóa nào;
                               nếu muốn AI biết, backend phải tự tra (xem
                               enrollmentRepository trong chat.service.js). */
    try {
      const sessionId = await ensureServerSession();
      await streamChatMessage(sessionId, textToSend, {
        onMetadata: (data) => {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === activeSession.id
                ? {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === botMsgId
                        ? {
                            ...m,
                            sources: data.sources,
                            uiWidget: data.ui_widget as any,
                          }
                        : m
                    ),
                  }
                : s
            )
          );
        },
        onToken: (tokenText) => {
          tokenQueueRef.current.push(...Array.from(tokenText));
        },
        onDone: (data) => {
          streamDoneDataRef.current = {
            isDone: true,
            suggestedQuestions: data.suggested_questions || [],
          };
        },
        onError: (err) => {
          streamDoneDataRef.current = { isDone: true };
          if (typewriterTimerRef.current) {
            clearInterval(typewriterTimerRef.current);
            typewriterTimerRef.current = null;
          }
          setIsStreaming(false);
          setSessions((prev) =>
            prev.map((s) =>
              s.id === activeSession.id
                ? {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === botMsgId
                        ? {
                            ...m,
                            text: (m.text || '') + `\n\n⚠️ *[Lỗi kết nối bộ xử lý AI: ${err}]*`,
                          }
                        : m
                    ),
                  }
                : s
            )
          );
        },
      });
    } catch (err) {
      /* Lỗi ở ĐÂY là lỗi trước khi luồng chạy — chủ yếu là không tạo được phiên
         (mất mạng, hết hạn đăng nhập). Lỗi giữa luồng đã có onError lo. */
      streamDoneDataRef.current = { isDone: true };
      if (typewriterTimerRef.current) {
        clearInterval(typewriterTimerRef.current);
        typewriterTimerRef.current = null;
      }
      setIsStreaming(false);
      toast({
        title: 'Không mở được phiên trò chuyện',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dynamic Scale Classes
  const getScaleClass = () => {
    switch (scaleFactor) {
      case 'sm': return 'text-xs max-w-4xl';
      case 'lg': return 'text-base max-w-6xl';
      case 'xl': return 'text-lg max-w-full px-6';
      default: return 'text-sm max-w-5xl';
    }
  };

  return (
    <Layout>
      <div
        className={`flex min-h-[calc(100vh-64px)] flex-col bg-background text-foreground md:flex-row ${
          isFullScreen ? 'fixed inset-0 z-50 h-screen w-screen' : ''
        }`}
      >
        {/* --- Thanh bên: danh sách hội thoại --- */}
        <div
          className={`${
            sidebarOpen
              ? 'w-full opacity-100 md:w-80'
              : 'pointer-events-none w-0 opacity-0 md:pointer-events-auto'
          } relative flex shrink-0 flex-col overflow-hidden border-b border-border bg-card transition-all duration-300 ease-in-out md:border-b-0 md:border-r`}
        >
          {/* Nút tạo hội thoại mới + ô tìm kiếm */}
          <div className="flex flex-col gap-3 border-b border-border p-4">
            <Button onClick={handleNewSession} className="h-10 w-full gap-2">
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Hội thoại mới</span>
            </Button>

            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                placeholder="Tìm trong lịch sử hội thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 text-sm"
              />
            </div>
          </div>

          {/* Danh sách phiên */}
          <div className="flex-1 space-y-1 overflow-y-auto p-2 sm:p-3">
            <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Layers className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Lịch sử hội thoại ({sessions.length})</span>
            </div>

            {filteredSessions.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Không tìm thấy hội thoại phù hợp.
              </p>
            ) : (
              filteredSessions.map((s) => {
                const isActive = s.id === activeSession.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setActiveSessionId(s.id)}
                    className={`group flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2.5 transition-colors ${
                      isActive
                        ? 'border-border bg-accent text-accent-foreground'
                        : 'border-transparent text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <MessageSquare className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h5 className="truncate text-sm font-medium leading-tight text-foreground">
                          {s.title}
                        </h5>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {new Date(s.updatedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          · {s.messages.length} tin nhắn
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteSession(s.id, e)}
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-danger group-hover:opacity-100"
                      title="Xóa hội thoại"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Chân thanh bên */}
          <div className="flex items-center justify-between border-t border-border px-3 py-2.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Trợ lý học tập 3T EduTech
            </span>
            <span className="rounded bg-muted px-2 py-0.5 font-mono">v3.2</span>
          </div>
        </div>

        {/* --- Khu làm việc chính --- */}
        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
          {/* Thanh trên cùng */}
          <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4">
            <div className="flex min-w-0 items-center gap-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Đóng/mở lịch sử hội thoại"
              >
                {sidebarOpen ? (
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
              <h3 className="truncate text-sm font-semibold">
                {activeSession.title}
              </h3>
            </div>

            {/* Cỡ chữ và toàn màn hình */}
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="hidden items-center gap-1 rounded-lg border border-border p-1 sm:flex">
                <span className="px-2 text-xs text-muted-foreground">
                  Cỡ chữ
                </span>
                {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setScaleFactor(size)}
                    className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
                      scaleFactor === size
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {size.toUpperCase()}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title={isFullScreen ? 'Thu nhỏ' : 'Toàn màn hình'}
              >
                {isFullScreen ? (
                  <Minimize2 className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Maximize2 className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Khung hội thoại */}
          <div
            ref={chatAreaRef}
            className="flex flex-1 flex-col items-center overflow-y-auto scroll-smooth p-4 sm:p-6"
          >
            <div
              className={`w-full ${getScaleClass()} space-y-6 rounded-xl border border-border bg-card p-4 sm:p-6`}
            >
              {messages.map((message, idx) => {
                const isUser = message.sender === 'user';
                return (
                  <div
                    key={message.id || idx}
                    className={`flex items-start gap-3 sm:gap-4 ${
                      isUser ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {/* Ảnh đại diện trợ lý */}
                    {!isUser && (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Bot className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}

                    {/* Bong bóng tin nhắn */}
                    <div
                      className={`max-w-[90%] rounded-xl p-4 leading-relaxed sm:max-w-[85%] sm:p-5 ${
                        isUser
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {/* Thanh thao tác của tin nhắn trợ lý */}
                      {!isUser && (
                        <div className="mb-3 flex items-center justify-between gap-4 border-b border-border pb-2.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Trả lời từ trợ lý</span>
                          </span>
                          <button
                            onClick={() => copyToClipboard(message.text, message.id)}
                            className="flex items-center gap-1 rounded px-1.5 py-1 transition-colors hover:bg-background hover:text-foreground"
                            title="Sao chép nội dung"
                          >
                            {copiedMsgId === message.id ? (
                              <>
                                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Đã chép</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Sao chép</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Nội dung */}
                      <div className="whitespace-pre-wrap break-words">
                        {message.text ||
                          (isStreaming && idx === messages.length - 1
                            ? 'Trợ lý đang soạn câu trả lời...'
                            : '')}
                        {!isUser && isStreaming && idx === messages.length - 1 && (
                          <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-muted-foreground align-middle" />
                        )}
                      </div>

                      {/* --- Widget đi kèm câu trả lời (hiện sau khi viết xong) --- */}
                      {message.uiWidget && !(isStreaming && idx === messages.length - 1) && (
                        <div className="mt-4 border-t border-border pt-3">
                          {message.uiWidget.type === 'COURSE_CAROUSEL' && (
                            <CourseCarouselWidget
                              data={message.uiWidget.data as any}
                              onSelectCourse={(msg) => handleSendMessage(msg)}
                            />
                          )}
                          {message.uiWidget.type === 'PAYMENT_SELECTOR' && (
                            <ChatPaymentSelectorWidget
                              data={message.uiWidget.data as any}
                              onSelectPayment={(method) => {
                                const cName = (message.uiWidget?.data as any)?.courseName || 'đã chọn';
                                handleSendMessage(`Tôi chọn thanh toán bằng ${method} cho khóa học: ${cName}`);
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

                      {/* Nguồn trích dẫn */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-4 rounded-lg border border-border bg-background p-3 text-xs">
                          <span className="mb-1.5 flex items-center gap-1.5 font-medium text-foreground">
                            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                            Nguồn trích từ tài liệu khóa học
                          </span>
                          <div className="space-y-1">
                            {message.sources.map((src, i) => (
                              <div
                                key={i}
                                className="truncate rounded bg-muted px-2 py-1 font-mono text-muted-foreground"
                              >
                                {src.file_name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Câu hỏi gợi ý */}
                      {message.suggestedQuestions && message.suggestedQuestions.length > 0 && !isStreaming && (
                        <div className="mt-4 space-y-2 border-t border-border pt-3">
                          <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Câu hỏi gợi ý
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {message.suggestedQuestions.map((q, qIndex) => (
                              <button
                                key={qIndex}
                                onClick={() => handleSendMessage(q)}
                                className="rounded-lg border border-border bg-background px-3 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Giờ gửi */}
                      <span
                        className={`mt-2 block text-right text-xs ${
                          isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Ảnh đại diện người dùng */}
                    {isUser && (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <User className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Ô nhập tin nhắn */}
          <div className="flex shrink-0 flex-col items-center border-t border-border bg-card p-3 sm:p-4">
            <div className={`w-full ${getScaleClass()} flex flex-col gap-2`}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ví dụ: tư vấn lộ trình React, khóa học số 1 giá bao nhiêu, thanh toán MoMo..."
                  disabled={isStreaming}
                  className="w-full rounded-lg border border-input bg-background py-3 pl-4 pr-28 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-60"
                />

                <div className="absolute right-2 flex items-center gap-1.5">
                  <Button
                    type="submit"
                    disabled={!inputText.trim() || isStreaming}
                    className="h-9 gap-1.5 px-4"
                  >
                    {isStreaming ? (
                      <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <>
                        <span className="hidden sm:inline">Gửi</span>
                        <Send className="h-4 w-4" aria-hidden="true" />
                      </>
                    )}
                  </Button>
                </div>
              </form>

              <p className="px-1 text-xs text-muted-foreground">
                Trợ lý hỗ trợ tìm khóa học, giải đáp bài học và mở cổng thanh toán.
                Thông tin do trợ lý đưa ra chỉ mang tính tham khảo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AiMasterChat;
