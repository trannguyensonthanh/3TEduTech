// src/pages/AiMasterChat.tsx

import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  Zap,
  BookOpen,
  Lock,
  RefreshCw,
  Layers,
  ShieldCheck,
  Search,
  CheckCircle,
  CreditCard,
  Volume2,
  Copy,
  Check,
  Terminal,
} from 'lucide-react';
import { streamAgentAI, UIWidgetData } from '@/services/ai.service';
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

    // Prepare history for RAG context
    const chat_history = [];
    for (let i = 0; i < messages.length - 1; i++) {
      if (messages[i].sender === 'user' && messages[i + 1]?.sender === 'bot') {
        chat_history.push({
          question: messages[i].text,
          answer: messages[i + 1].text,
        });
      }
    }

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

    streamAgentAI(
      {
        query: textToSend,
        chat_history: chat_history.slice(-6),
        use_general_knowledge: false,
        enrolled_courses: enrolledCourses,
      },
      {
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
      }
    );
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
      <div className={`flex flex-col md:flex-row bg-slate-950 text-slate-100 min-h-[calc(100vh-64px)] ${isFullScreen ? 'fixed inset-0 z-50 bg-slate-950 h-screen w-screen' : ''}`}>
        
        {/* --- LEFT SIDEBAR (SESSIONS) --- */}
        <div
          className={`${
            sidebarOpen ? 'w-full md:w-80 opacity-100' : 'w-0 opacity-0 pointer-events-none md:pointer-events-auto'
          } transition-all duration-300 ease-in-out bg-slate-900/90 border-r border-slate-800/80 backdrop-blur-xl flex flex-col shrink-0 relative overflow-hidden`}
        >
          {/* Header & New Chat Button */}
          <div className="p-4 border-b border-slate-800/80 flex flex-col gap-3">
            <Button
              onClick={handleNewSession}
              className="w-full h-11 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Hội Thoại Mới</span>
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse ml-1" />
            </Button>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Tìm kiếm đoạn chat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-slate-950/60 border-slate-800 text-xs rounded-lg text-slate-200 placeholder:text-slate-500 focus:border-indigo-500/50"
              />
            </div>
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
            <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wider px-2 py-1 flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-indigo-400" />
              <span>Lịch Sử Phên Chat ({sessions.length})</span>
            </div>

            {filteredSessions.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-6">Không tìm thấy đoạn chat phù hợp.</p>
            ) : (
              filteredSessions.map((s) => {
                const isActive = s.id === activeSession.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setActiveSessionId(s.id)}
                    className={`group p-3 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-between gap-2 border ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/50 border-indigo-500/50 text-white shadow-md shadow-indigo-500/10'
                        : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-semibold truncate leading-tight">{s.title}</h5>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {new Date(s.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {s.messages.length} tin nhắn
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteSession(s.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-opacity shrink-0"
                      title="Xóa phiên"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Info */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-semibold text-indigo-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Gemini 2.5 Pro SSE Engine</span>
            </div>
            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono">v3.2</span>
          </div>
        </div>

        {/* --- MAIN CHAT WORKSPACE --- */}
        <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
          
          {/* Top Navbar */}
          <div className="h-14 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md px-4 flex items-center justify-between gap-3 shrink-0 z-10 shadow-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                title="Đóng/Mở Lịch sử chat"
              >
                {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                <h3 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-md">
                  {activeSession.title}
                </h3>
              </div>
            </div>

            {/* Scale / Zoom & Fullscreen Controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="hidden sm:flex items-center gap-1 bg-slate-950/80 border border-slate-800 p-1 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-400 px-2">Scale:</span>
                {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setScaleFactor(size)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                      scaleFactor === size
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {size.toUpperCase()}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-2 rounded-lg bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                title={isFullScreen ? 'Thu nhỏ' : 'Toàn màn hình'}
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div ref={chatAreaRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 flex flex-col items-center scroll-smooth">
            <div className={`w-full ${getScaleClass()} space-y-6 transition-all duration-200`}>
              
              {messages.map((message, idx) => {
                const isUser = message.sender === 'user';
                return (
                  <div
                    key={message.id || idx}
                    className={`flex gap-3 sm:gap-4 items-start ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Avatar */}
                    {!isUser && (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0 border border-indigo-400/30">
                        <Bot className="w-5 h-5" />
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      className={`relative rounded-2xl p-4 sm:p-5 max-w-[90%] sm:max-w-[85%] leading-relaxed shadow-xl border ${
                        isUser
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none border-blue-500/50 shadow-blue-600/10'
                          : 'bg-slate-900/95 text-slate-100 rounded-bl-none border-slate-800 shadow-black/30 backdrop-blur-md'
                      }`}
                    >
                      {/* Bot Header Action Bar */}
                      {!isUser && (
                        <div className="flex items-center justify-between gap-4 pb-2.5 mb-3 border-b border-slate-800/80 text-xs text-slate-400 font-semibold">
                          <span className="flex items-center gap-1.5 text-indigo-400">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>AI Master Response</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyToClipboard(message.text, message.id)}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                              title="Sao chép nội dung"
                            >
                              {copiedMsgId === message.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">Đã chép</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Sao chép</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Content Text */}
                      <div className="whitespace-pre-wrap word-break sm:leading-7 tracking-wide font-normal">
                        {message.text || (isStreaming && idx === messages.length - 1 ? '🤖 Đang suy nghĩ và xử lý tín hiệu...' : '')}
                        {!isUser && isStreaming && idx === messages.length - 1 && (
                          <span className="inline-block w-2 h-4 bg-indigo-400 ml-1 animate-pulse align-middle" />
                        )}
                      </div>

                      {/* --- WIDGET RENDERER IN DEDICATED MASTER PAGE (Hiển thị sau khi AI viết xong text) --- */}
                      {message.uiWidget && !(isStreaming && idx === messages.length - 1) && (
                        <div className="mt-4 pt-2 border-t border-slate-800">
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

                      {/* Sources / RAG Citations */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-4 bg-slate-950/60 p-3 rounded-xl border border-indigo-900/40 text-xs">
                          <span className="text-indigo-400 font-bold flex items-center gap-1.5 mb-1.5">
                            <BookOpen className="w-3.5 h-3.5" />
                            Nguồn Trích Xuất & Tri Thức Khóa Học:
                          </span>
                          <div className="space-y-1">
                            {message.sources.map((src, i) => (
                              <div key={i} className="text-slate-300 truncate font-mono text-[11px] bg-slate-900 px-2 py-1 rounded">
                                • {src.file_name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggested Questions */}
                      {message.suggestedQuestions && message.suggestedQuestions.length > 0 && !isStreaming && (
                        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                          <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">
                            💡 Câu hỏi gợi ý tiếp tục:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {message.suggestedQuestions.map((q, qIndex) => (
                              <button
                                key={qIndex}
                                onClick={() => handleSendMessage(q)}
                                className="text-xs text-left px-3 py-1.5 rounded-xl bg-indigo-950/50 hover:bg-indigo-900/80 text-indigo-200 border border-indigo-500/30 transition-all shadow-sm hover:scale-[1.02] active:scale-95"
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Timestamp */}
                      <span className={`text-[10px] block mt-2 text-right opacity-70 ${isUser ? 'text-indigo-200' : 'text-slate-500'}`}>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* User Avatar */}
                    {isUser && (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0 border border-blue-400/30">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Footer Area */}
          <div className="border-t border-slate-800 bg-slate-900/90 backdrop-blur-xl p-3 sm:p-4 shrink-0 flex flex-col items-center">
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
                  placeholder="Gợi ý: 'Tư vấn lộ trình React', 'Khóa học số 1 giá bao nhiêu', 'Thanh toán MoMo'..."
                  disabled={isStreaming}
                  className="w-full pl-4 pr-24 py-3.5 sm:py-4 bg-slate-950 border border-slate-700/80 rounded-2xl text-sm sm:text-base text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
                />

                <div className="absolute right-2 flex items-center gap-1.5">
                  <Button
                    type="submit"
                    disabled={!inputText.trim() || isStreaming}
                    className="h-10 px-4 sm:px-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-transform active:scale-95 flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isStreaming ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span className="hidden sm:inline">Gửi</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>

              <div className="flex items-center justify-between px-2 text-[11px] text-slate-400">
                <span>🛡️ AI tự động chuyển đổi tỷ giá và hỗ trợ 5 cổng thanh toán toàn cầu.</span>
                <span className="hidden md:inline text-indigo-400">Google Deepmind Engine</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AiMasterChat;
