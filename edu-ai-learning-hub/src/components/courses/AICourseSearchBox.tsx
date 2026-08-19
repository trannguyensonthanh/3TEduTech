// src/components/courses/AICourseSearchBox.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { searchCoursesWithAI, CourseSearchResponse } from '@/services/ai.service';
import { Sparkles, Bot, Send, Loader2, BookOpen, ArrowRight, CheckCircle2, RefreshCw, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AICourseSearchBoxProps {
  onSelectCourseKeyword?: (keyword: string) => void;
}

const QUICK_SUGGESTIONS = [
  '🧑‍💻 Lộ trình học lập trình Web Fullstack cho người mới bắt đầu',
  '🤖 Kỹ năng cần thiết để làm nghề AI & Machine Learning',
  '📱 Học lập trình ứng dụng di động đa nền tảng (Mobile App)',
  '🎨 Quản trị cơ sở dữ liệu & Thiết kế UI/UX chuyên nghiệp',
];

export const AICourseSearchBox: React.FC<AICourseSearchBoxProps> = ({ onSelectCourseKeyword }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CourseSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (searchQuery?: string) => {
    const targetQuery = searchQuery || query;
    if (!targetQuery.trim()) return;

    if (searchQuery) setQuery(searchQuery);
    setIsLoading(true);
    setError(null);

    try {
      /* [SỬA 19/08/2026] `top_k` -> `topK`. Backend nhận `topK`
         (chat.validation.js) rồi mới tự đổi sang `top_k` khi gọi AI Service
         (chat.controller.js dòng 93). Gửi `top_k` thì Joi bỏ qua trường lạ và
         số kết quả luôn rơi về mặc định — sai lặng lẽ, không báo lỗi. */
      const data = await searchCoursesWithAI({ query: targetQuery, topK: 5 });
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Không thể kết nối đến Trợ lý AI. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setQuery('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="w-full mb-8 relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-slate-900/95 via-purple-950/40 to-slate-900/95 p-6 shadow-2xl backdrop-blur-xl text-white">
      {/* Background ambient light effects */}
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 space-y-5">
        {/* Header Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-cyan-500 shadow-lg shadow-purple-500/30 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent flex items-center gap-2">
                AI Learning Advisor <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40">Powered by Gemini & RAG</span>
              </h3>
              <p className="text-xs text-slate-300">
                Hãy nhập mong muốn nghề nghiệp hoặc mục tiêu của bạn, Trợ lý AI sẽ tư vấn lộ trình và đề xuất khóa học phù hợp nhất!
              </p>
            </div>
          </div>
          {result && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-slate-400 hover:text-white hover:bg-white/5 text-xs h-8 px-3 gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Hỏi mục tiêu khác
            </Button>
          )}
        </div>

        {/* Search Bar Input */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <Bot className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-violet-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Ví dụ: Tôi muốn tự học lập trình trang web cho người chưa có nền tảng..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-11 pr-4 h-12 text-sm bg-slate-950/60 border-white/15 rounded-xl text-white placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-violet-500/50 shadow-inner"
            />
          </div>
          <Button
            onClick={() => handleSearch()}
            disabled={isLoading || !query.trim()}
            className="h-12 px-6 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-violet-500/20 flex items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Đang phân tích...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Tư Vấn Ngay</span>
              </>
            )}
          </Button>
        </div>

        {/* Quick Suggestion Chips */}
        {!result && !isLoading && (
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" /> Gợi ý mong muốn phổ biến:
            </span>
            <div className="flex flex-wrap gap-2">
              {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSearch(suggestion)}
                  className="text-xs text-left px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <span>{suggestion}</span>
                  <ArrowRight className="w-3 h-3 opacity-60" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 rounded-xl bg-slate-950/60 border border-violet-500/30 text-center space-y-3"
            >
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto" />
              <p className="text-sm text-violet-200 font-medium animate-pulse">
                🧠 Trợ lý AI đang rà soát kho dữ liệu Vector ChromaDB và tổng hợp lộ trình dành riêng cho bạn...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
            <span className="font-bold">⚠️ Lỗi:</span> {error}
          </div>
        )}

        {/* AI Recommendations Result Display */}
        <AnimatePresence>
          {result && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5 pt-2"
            >
              <div className="p-5 rounded-xl bg-slate-950/70 border border-white/10 shadow-inner space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-cyan-400 pb-2 border-b border-white/10">
                  <Bot className="w-5 h-5" />
                  <span>LỜI KHUYÊN & TRỢ HẢO TỪ GIÁO TRÌNH AI</span>
                </div>
                <div className="prose prose-invert max-w-none text-sm text-slate-200 leading-relaxed space-y-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {result.answer}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Matched Courses (Sources) */}
              {result.sources && result.sources.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-emerald-400" />
                      Khóa học liên quan trong hệ thống ({result.sources.length}):
                    </span>
                    {onSelectCourseKeyword && (
                      <span className="text-[11px] text-slate-400 font-normal">Bấm vào tên để tìm kiếm ngay</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {result.sources.map((src, index) => (
                      <div
                        key={index}
                        onClick={() => onSelectCourseKeyword && onSelectCourseKeyword(src.file_name)}
                        className={`p-3.5 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800/80 border border-white/10 hover:border-violet-500/50 transition-all ${onSelectCourseKeyword ? 'cursor-pointer hover:shadow-lg hover:shadow-violet-500/10 transform hover:-translate-y-0.5' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h4 className="text-sm font-bold text-violet-300 truncate flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            {src.file_name}
                          </h4>
                          <span className="text-[10px] uppercase font-bold bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded">
                            Matched
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {src.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
export default AICourseSearchBox;
