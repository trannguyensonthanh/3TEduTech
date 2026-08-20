// src/components/courses/AICourseSearchBox.tsx
//
/* ============================================================================
   [VIẾT LẠI 20/08/2026] TRỢ LÝ TÌM KHÓA HỌC — MỘT NHIỆM VỤ DUY NHẤT

   Bản trước là một "trợ lý tư vấn lộ trình" nhận mọi loại câu hỏi. Hai vấn đề:

   1. TRÙNG CHỨC NĂNG. Nó nhận cả câu hỏi về chính sách, thanh toán, kiến thức
      chuyên môn — đúng những thứ chatbot tổng ở góc màn hình đã làm, và làm tốt
      hơn vì có ngữ cảnh hội thoại. Người dùng đứng giữa hai ô chat trên cùng
      một trang, không biết nên gõ vào đâu.

   2. TÌM ĐƯỢC NHƯNG KHÔNG DÙNG ĐƯỢC. Kết quả trả về chỉ là các đoạn văn bản
      trích từ kho tri thức: tên khóa học kèm 200 ký tự mô tả. Không giá, không
      ảnh bìa, không đường dẫn. Bấm vào chỉ đổ tên xuống ô tìm kiếm thường —
      tức là dùng mô hình ngôn ngữ để gợi ý một từ khóa, rồi bắt người dùng tự
      tìm lại từ đầu.

   Nay:
   • Phạm vi bị giới hạn cứng ở tầng dịch vụ AI. Câu hỏi ngoài phạm vi bị chặn
     ngay tại bộ định tuyến ý định, trả về `outOfScope` và KHÔNG gọi mô hình
     sinh văn bản. Giao diện hiện một thông báo nhắc nhở, chỉ đường sang chatbot
     tổng, chứ không vẽ ô kết quả rỗng trông như hệ thống hỏng.
   • Kết quả là THẺ KHÓA HỌC THẬT, dựng bằng đúng component `CourseCardv2` mà
     lưới bên dưới đang dùng — cùng giá, cùng ảnh, cùng đường dẫn, bấm vào là
     vào thẳng trang khóa học.
============================================================================ */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  searchCoursesWithAI,
  CourseSearchResponse,
} from '@/services/ai.service';
import CourseCardv2 from '@/components/courses/CourseCardv2';
import {
  ArrowRight,
  BookOpen,
  Info,
  Loader2,
  RefreshCw,
  Search,
  Send,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AICourseSearchBoxProps {
  /** Đổ một từ khóa xuống ô tìm kiếm thường của trang. */
  onSelectCourseKeyword?: (keyword: string) => void;
}

/* Gợi ý viết theo giọng "mô tả thứ mình muốn học" chứ không phải "hỏi trợ lý".
   Đây là cách rẻ nhất để dạy người dùng phạm vi của ô này mà không cần đọc chữ
   hướng dẫn: bốn ví dụ cùng một dạng câu thì dạng câu đó chính là hướng dẫn. */
const QUICK_SUGGESTIONS = [
  'Tôi muốn học lập trình web từ con số không',
  'Khóa nào dạy phân tích dữ liệu bằng Python',
  'Tôi muốn làm ứng dụng di động đa nền tảng',
  'Học thiết kế giao diện và trải nghiệm người dùng',
];

export const AICourseSearchBox: React.FC<AICourseSearchBoxProps> = ({
  onSelectCourseKeyword,
}) => {
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
         (chat.controller.js). Gửi `top_k` thì Joi bỏ qua trường lạ và số kết
         quả luôn rơi về mặc định — sai lặng lẽ, không báo lỗi. */
      const data = await searchCoursesWithAI({ query: targetQuery, topK: 6 });
      setResult(data);
    } catch (err) {
      setError(
        (err as Error)?.message ||
          'Không kết nối được tới trợ lý tìm kiếm. Vui lòng thử lại.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setQuery('');
    setResult(null);
    setError(null);
  };

  const courses = result?.courses ?? [];
  const isOutOfScope = result?.outOfScope === true;

  return (
    <div className="mb-8 w-full rounded-xl border border-border bg-card p-5 text-card-foreground">
      <div className="space-y-5">
        {/* ---------------------------------------------------- Tiêu đề --- */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="flex flex-wrap items-center gap-2 text-base font-semibold">
                Tìm khóa học bằng AI
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  Tìm theo ý nghĩa, không chỉ theo từ khóa
                </span>
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Mô tả thứ bạn muốn học bằng lời của mình, trợ lý sẽ tìm những
                khóa học sát nhất và hiển thị ngay bên dưới.
              </p>
            </div>
          </div>
          {result && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Tìm điều khác
            </Button>
          )}
        </div>

        {/* ------------------------------------------------------ Ô nhập --- */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-grow">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="text"
              placeholder="Ví dụ: tôi muốn tự học lập trình web từ con số không…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="h-12 pl-11 pr-4 text-sm"
              aria-label="Mô tả khóa học bạn muốn tìm"
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
                <span>Đang tìm…</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden="true" />
                <span>Tìm khóa học</span>
              </>
            )}
          </Button>
        </div>

        {/* -------------------------------------------------- Gợi ý nhanh --- */}
        {!result && !isLoading && (
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">
              Thử một trong các mô tả sau:
            </span>
            <div className="flex flex-wrap gap-2">
              {QUICK_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSearch(suggestion)}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <span>{suggestion}</span>
                  <ArrowRight
                    className="h-3 w-3 text-muted-foreground"
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --------------------------------------------------- Đang xử lý --- */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3 rounded-lg border border-border p-6 text-center"
            >
              <Loader2
                className="mx-auto h-7 w-7 animate-spin text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-sm text-muted-foreground">
                Đang đối chiếu mô tả của bạn với kho tri thức khóa học…
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* -------------------------------------------------------- Lỗi --- */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-danger-soft p-4 text-sm text-danger">
            <span className="font-semibold">Lỗi:</span>
            <span>{error}</span>
          </div>
        )}

        {/* ----------------------------------------------------- Kết quả --- */}
        <AnimatePresence>
          {result && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5 pt-1"
            >
              {/* Ngoài phạm vi — thông báo riêng, không phải thẻ trả lời.
                  Dùng tông thông tin chứ không phải tông lỗi: người dùng không
                  làm gì sai, chỉ là gõ nhầm ô. */}
              {isOutOfScope ? (
                <div className="flex items-start gap-3 rounded-lg border border-info/30 bg-info-soft p-4">
                  <Info
                    className="mt-0.5 h-5 w-5 shrink-0 text-info"
                    aria-hidden="true"
                  />
                  <div className="prose prose-sm dark:prose-invert max-w-none text-foreground [&_p]:my-1">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {result.answer}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <>
                  {/* Lời tư vấn ngắn */}
                  {result.answer && (
                    <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-5">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Sparkles
                          className="h-4 w-4 text-primary"
                          aria-hidden="true"
                        />
                        <span>Gợi ý từ trợ lý</span>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-foreground">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {result.answer}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {/* Thẻ khóa học thật */}
                  {courses.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-sm font-semibold">
                          <BookOpen className="h-4 w-4" aria-hidden="true" />
                          {courses.length} khóa học phù hợp nhất
                        </span>
                        {onSelectCourseKeyword && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSelectCourseKeyword(query)}
                          >
                            Lọc cả danh sách theo mô tả này
                            <ArrowRight
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {courses.map((course) => (
                          <CourseCardv2
                            key={course.courseId}
                            course={course}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Tìm được đoạn văn bản nhưng không khớp khóa học nào đang
                       xuất bản. Nói thẳng thay vì im lặng — trạng thái này
                       thường có nghĩa là kho tri thức đang lệch với CSDL (khóa
                       đã đổi tên hoặc đã gỡ xuất bản), và đó là thông tin quản
                       trị viên cần biết. */
                    <div className="rounded-lg border border-dashed border-border p-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        Chưa có khóa học nào đang mở khớp với mô tả này. Bạn thử
                        mô tả theo cách khác, hoặc dùng bộ lọc bên trái nhé.
                      </p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AICourseSearchBox;
