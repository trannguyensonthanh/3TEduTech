// src/components/courses/AICourseSearchBox.tsx
//
/* [VIẾT LẠI GIAO DIỆN 20/08/2026 — theo src/DESIGN-SYSTEM.md]
   Hộp này trước đây tự đặt một mảng nền tối tím than ngay giữa trang danh sách
   khóa học đang sáng, kèm hai khối mờ phát sáng và chữ chuyển sắc. Nay nó là
   một thẻ bình thường: viền mảnh, nền thẻ, chữ theo token — nên hòa vào trang
   ở cả chế độ sáng lẫn tối. Logic tìm kiếm giữ nguyên hoàn toàn. */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { searchCoursesWithAI, CourseSearchResponse } from '@/services/ai.service';
import {
  ArrowRight,
  Bot,
  BookOpen,
  CheckCircle2,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
} from 'lucide-react';
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
    <div className="mb-8 w-full rounded-xl border border-border bg-card p-5 text-card-foreground">
      <div className="space-y-5">
        {/* Tiêu đề */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="flex flex-wrap items-center gap-2 text-base font-semibold">
                Trợ lý tư vấn lộ trình học
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  Dựa trên kho tri thức khóa học
                </span>
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Nhập mục tiêu nghề nghiệp của bạn, trợ lý sẽ gợi ý lộ trình và
                các khóa học phù hợp nhất.
              </p>
            </div>
          </div>
          {result && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Hỏi mục tiêu khác
            </Button>
          )}
        </div>

        {/* Ô nhập */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-grow">
            <Bot
              className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="text"
              placeholder="Ví dụ: tôi muốn tự học lập trình web từ con số không..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="h-12 pl-11 pr-4 text-sm"
            />
          </div>
          <Button
            onClick={() => handleSearch()}
            disabled={isLoading || !query.trim()}
            className="h-12 px-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Đang phân tích...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden="true" />
                <span>Tư vấn ngay</span>
              </>
            )}
          </Button>
        </div>

        {/* Gợi ý nhanh */}
        {!result && !isLoading && (
          <div className="space-y-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" /> Gợi ý mong muốn phổ biến:
            </span>
            <div className="flex flex-wrap gap-2">
              {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSearch(suggestion)}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <span>{suggestion}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Đang xử lý */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3 rounded-lg border border-border p-6 text-center"
            >
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                Trợ lý đang rà soát kho dữ liệu khóa học và tổng hợp lộ trình dành riêng cho bạn...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lỗi */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-danger-soft p-4 text-sm text-danger">
            <span className="font-semibold">Lỗi:</span> {error}
          </div>
        )}

        {/* Kết quả */}
        <AnimatePresence>
          {result && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5 pt-2"
            >
              <div className="space-y-4 rounded-lg border border-border p-5">
                <div className="flex items-center gap-2 border-b border-border pb-2 text-sm font-semibold">
                  <Bot className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span>Lời khuyên từ trợ lý</span>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {result.answer}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Khóa học khớp với câu hỏi */}
              {result.sources && result.sources.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4" aria-hidden="true" />
                      Khóa học liên quan trong hệ thống ({result.sources.length})
                    </span>
                    {onSelectCourseKeyword && (
                      <span className="font-normal normal-case">Bấm vào tên để tìm kiếm ngay</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {result.sources.map((src, index) => (
                      <div
                        key={index}
                        onClick={() => onSelectCourseKeyword && onSelectCourseKeyword(src.file_name)}
                        className={`rounded-lg border border-border p-3.5 transition-colors ${
                          onSelectCourseKeyword ? 'cursor-pointer hover:bg-muted' : ''
                        }`}
                      >
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <h4 className="flex min-w-0 items-center gap-1.5 truncate text-sm font-medium">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                            {src.file_name}
                          </h4>
                          <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            Khớp
                          </span>
                        </div>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
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
