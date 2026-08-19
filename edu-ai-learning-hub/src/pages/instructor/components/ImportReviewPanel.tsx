// src/pages/instructor/components/ImportReviewPanel.tsx
// [THÊM 18/08/2026 — COURSE IMPORT, Giai đoạn A]
//
// Màn hình DUYỆT bản nháp — chốt chặn cuối cùng trước khi bất cứ thứ gì được
// ghi vào cơ sở dữ liệu.
//
// ─────────────────────────────────────────────────────────────────────────────
// ⚠️ HAI ĐIỀU CẦN BIẾT VỀ THỨ ĐƯỢC GỬI LÊN
//
// 1. Chỉ gửi những trường ĐƯỢC PHÉP SỬA: tên, mô tả, chọn/bỏ chọn. Máy chủ
//    dùng schema Joi từ chối mọi khóa lạ (`imports.validation.js`), nên gửi dư
//    một trường là hỏng CẢ request. Đường dẫn tệp, loại bài học... đều do máy
//    chủ tự quyết định từ bản nháp của chính nó.
//
// 2. `sourceDir` và `sourcePath` là KHÓA ĐỐI CHIẾU, không phải dữ liệu. Máy chủ
//    dùng chúng để tìm lại đúng chương/bài trong bản nháp gốc — nên tuyệt đối
//    không được sửa.
//
// ─────────────────────────────────────────────────────────────────────────────
// KHÔNG CÓ CHỨC NĂNG ĐỔI THỨ TỰ — VÀ ĐÓ LÀ CHỦ Ý
//
// Máy chủ tạo chương/bài theo thứ tự trong bản nháp của nó (đã sắp theo số ở
// đầu tên tệp). Nếu ở đây cho kéo thả đổi thứ tự, thay đổi đó sẽ bị BỎ QUA
// hoàn toàn mà không có lỗi nào báo — kiểu hỏng tệ nhất: người dùng tin là đã
// lưu. Cần đổi thứ tự thì dùng trang Sửa khóa học sau khi tạo xong.

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Icons } from '@/components/common/Icons';

import { getCategories } from '@/services/category.service';
import { getLevels } from '@/services/level.service';
import { useQuery } from '@tanstack/react-query';

import {
  acceptImport,
  type AcceptImportResult,
  enrichImport,
  generateQuiz,
  formatBytes,
  formatDuration,
  type ImportProposal,
  type ProposedQuizQuestion,
} from '@/services/import.service';

/* ───────────────────────────── Kiểu nội bộ ───────────────────────────── */

interface EditableLesson {
  sourcePath: string;
  lessonName: string;
  /** Mô tả bài học. Hiện chỉ do AI điền — sửa chi tiết ở trang Sửa khóa học. */
  description: string;
  selected: boolean;
  // Chỉ để hiển thị — không gửi lên.
  lessonType: 'VIDEO' | 'TEXT';
  ext: string;
  sizeBytes: number;
  durationSeconds: number | null;
  hasSubtitle: boolean;
  hasText: boolean;
  note: string | null;
  /** Câu hỏi trắc nghiệm do AI soạn — chỉ hiển thị, không sửa ở màn hình này. */
  quiz: ProposedQuizQuestion[];
}

interface EditableSection {
  sourceDir: string;
  sectionName: string;
  description: string;
  selected: boolean;
  lessons: EditableLesson[];
}

interface Props {
  jobId: string;
  proposal: ImportProposal;
  /** `videosPending` = số video máy chủ ĐÃ xếp hàng tải lên (đã trừ bài bỏ tick). */
  /* [SỬA 18/08/2026] Truyền NGUYÊN kết quả thay vì hai con số rời.

     Trang cha nay cần thêm `lessonsNeedingVideo` để dựng bước "Gắn video" —
     video không còn được giải nén ra máy chủ nên giảng viên phải tự gắn nguồn
     cho từng bài.

     Bóc sẵn vài trường rồi truyền lẻ nghĩa là mỗi lần máy chủ trả thêm thứ gì
     lại phải sửa chữ ký hàm ở CẢ HAI nơi — và quên một nơi thì TypeScript báo
     lỗi ở chỗ chẳng liên quan gì tới thay đổi vừa làm. */
  onAccepted: (result: AcceptImportResult) => void;
  onCancel: () => void;
}

/* ───────────────────────────── Thẻ thống kê ───────────────────────────── */

/* Nhận thẳng COMPONENT icon, không nhận tên khóa — xem ghi chú cùng vấn đề ở
   CourseImport.tsx (tra `Icons[key]` buộc TS suy ra hợp của MỌI icon). */
type IconComponent = React.ComponentType<{ className?: string }>;

const StatTile: React.FC<{
  Icon: IconComponent;
  label: string;
  value: React.ReactNode;
  tone?: 'default' | 'good' | 'warn';
}> = ({ Icon, label, value, tone = 'default' }) => {
  const toneClass =
    tone === 'good'
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
      : tone === 'warn'
        ? 'text-amber-400 bg-amber-500/10 border-amber-500/25'
        : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25';

  return (
    <div className='rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm'>
      <div
        className={`mb-2.5 inline-flex h-9 w-9 items-center justify-center rounded-xl border ${toneClass}`}
      >
        <Icon className='h-4 w-4' />
      </div>
      <p className='text-2xl font-extrabold leading-none tabular-nums'>
        {value}
      </p>
      <p className='mt-1.5 text-xs text-muted-foreground'>{label}</p>
    </div>
  );
};

/* ───────────────────────────── Thành phần chính ───────────────────────── */

const ImportReviewPanel: React.FC<Props> = ({
  jobId,
  proposal,
  onAccepted,
  onCancel,
}) => {
  /* --- Thông tin khóa học --- */
  const [courseName, setCourseName] = useState(proposal.courseName || '');
  /* Khởi tạo từ bản nháp chứ không phải chuỗi rỗng: nếu giảng viên đã bấm AI
     rồi tải lại trang, mô tả đã lưu trên Redis phải hiện lại — nếu không họ sẽ
     tưởng mất và bấm AI thêm lần nữa, tiêu token vô ích. */
  const [shortDescription, setShortDescription] = useState(
    proposal.courseShortDescription || ''
  );
  const [fullDescription, setFullDescription] = useState(
    proposal.courseDescription || ''
  );
  const [categoryId, setCategoryId] = useState<string>('');
  const [levelId, setLevelId] = useState<string>('');
  const [originalPrice, setOriginalPrice] = useState<string>('0');

  const [submitting, setSubmitting] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  /* --- Trạng thái của lượt nhờ AI --- */
  const [enriching, setEnriching] = useState(false);
  const [aiInfo, setAiInfo] = useState<{
    sections: number;
    lessons: number;
    warnings: string[];
  } | null>(null);
  /* Ảnh chụp TRƯỚC khi áp kết quả AI, để có nút "Hoàn tác".
     Không có nó thì một lượt AI không ưng ý sẽ xóa sạch những gì giảng viên đã
     gõ tay — mà họ không có cách nào lấy lại ngoài việc nhập lại tệp ZIP. */
  const [beforeAi, setBeforeAi] = useState<{
    short: string;
    full: string;
    sections: EditableSection[];
  } | null>(null);

  /* --- Trạng thái của lượt soạn trắc nghiệm --- */
  const [quizzing, setQuizzing] = useState(false);
  const [includeQuiz, setIncludeQuiz] = useState(false);
  const [quizInfo, setQuizInfo] = useState<{
    total: number;
    lessons: number;
    warnings: string[];
  } | null>(null);
  const [openQuiz, setOpenQuiz] = useState<Record<string, boolean>>({});

  /* --- Bản sao có thể sửa của cấu trúc --- */
  const [sections, setSections] = useState<EditableSection[]>(() =>
    (proposal.sections || []).map((section) => ({
      sourceDir: section.sourceDir ?? '',
      sectionName: section.sectionName || '',
      description: section.description || '',
      selected: true,
      lessons: (section.lessons || []).map((lesson) => ({
        sourcePath: lesson.sourcePath,
        lessonName: lesson.lessonName || '',
        description: lesson.description || '',
        selected: lesson.selected !== false,
        lessonType: lesson.lessonType,
        ext: lesson.ext,
        sizeBytes: lesson.sizeBytes,
        durationSeconds: lesson.durationSeconds,
        hasSubtitle: Boolean(lesson.hasSubtitle ?? lesson.subtitlePath),
        hasText: Boolean(lesson.textContent),
        note: lesson.extractError || lesson.extractWarning || null,
        quiz: lesson.quizQuestions || [],
      })),
    }))
  );

  /* --- Danh mục & cấp độ --- */
  const { data: categoryData } = useQuery({
    queryKey: ['categories', 'all-for-import'],
    queryFn: () => getCategories({ limit: 0 }),
  });
  const { data: levelData } = useQuery({
    queryKey: ['levels', 'all-for-import'],
    queryFn: () => getLevels(),
  });

  const categories = categoryData?.categories || [];
  const levels = levelData?.levels || [];

  /* --- Số liệu sống, cập nhật theo tick chọn --- */
  const counts = useMemo(() => {
    let lessons = 0;
    let videos = 0;
    let sectionsSelected = 0;
    let questions = 0;

    for (const section of sections) {
      if (!section.selected) continue;
      const picked = section.lessons.filter((l) => l.selected);
      if (picked.length === 0) continue;
      sectionsSelected += 1;
      lessons += picked.length;
      videos += picked.filter((l) => l.lessonType === 'VIDEO').length;
      questions += picked.reduce((n, l) => n + l.quiz.length, 0);
    }
    return { sections: sectionsSelected, lessons, videos, questions };
  }, [sections]);

  /* --- Thao tác sửa --- */
  const patchSection = (index: number, patch: Partial<EditableSection>) =>
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );

  const patchLesson = (
    sectionIndex: number,
    lessonIndex: number,
    patch: Partial<EditableLesson>
  ) =>
    setSections((prev) =>
      prev.map((s, i) =>
        i !== sectionIndex
          ? s
          : {
              ...s,
              lessons: s.lessons.map((l, j) =>
                j === lessonIndex ? { ...l, ...patch } : l
              ),
            }
      )
    );

  /* --- Nhờ AI viết mô tả --- */
  const handleEnrich = async () => {
    if (enriching) return;

    setBeforeAi({ short: shortDescription, full: fullDescription, sections });
    setEnriching(true);

    try {
      const result = await enrichImport(jobId);

      /* TRỘN theo khóa, không thay thế cả cấu trúc.
         Máy chủ trả về bản nháp đầy đủ, nhưng nếu lấy nguyên si thì mọi thứ
         giảng viên đã sửa (đổi tên chương, bỏ tick bài) sẽ bị xóa sạch. Ở đây
         chỉ lấy đúng phần MÔ TẢ, giữ nguyên tên và lựa chọn của họ. */
      const sectionDesc = new Map<string, string>();
      const lessonDesc = new Map<string, string>();

      for (const s of result.proposal?.sections || []) {
        if (s.description) sectionDesc.set(s.sourceDir ?? '', s.description);
        for (const l of s.lessons || []) {
          if (l.description) lessonDesc.set(l.sourcePath, l.description);
        }
      }

      setSections((prev) =>
        prev.map((s) => ({
          ...s,
          description: sectionDesc.get(s.sourceDir) ?? s.description,
          lessons: s.lessons.map((l) => ({
            ...l,
            description: lessonDesc.get(l.sourcePath) ?? l.description,
          })),
        }))
      );

      if (result.shortDescription) setShortDescription(result.shortDescription);
      if (result.proposal?.courseDescription) {
        setFullDescription(result.proposal.courseDescription);
      }

      setAiInfo({
        sections: result.sectionsWritten,
        lessons: result.lessonsWritten,
        warnings: result.warnings || [],
      });
      toast.success(
        `AI đã viết mô tả cho ${result.sectionsWritten} chương và ${result.lessonsWritten} bài học.`
      );
    } catch (error: any) {
      setBeforeAi(null); // Không có gì thay đổi thì cũng không có gì để hoàn tác
      toast.error(error?.message || 'Không nhờ được AI viết mô tả.');
    } finally {
      setEnriching(false);
    }
  };

  const handleUndoAi = () => {
    if (!beforeAi) return;
    setShortDescription(beforeAi.short);
    setFullDescription(beforeAi.full);
    setSections(beforeAi.sections);
    setBeforeAi(null);
    setAiInfo(null);
    toast.info('Đã hoàn tác nội dung do AI viết.');
  };

  /* --- Nhờ AI soạn câu hỏi trắc nghiệm --- */
  const handleGenerateQuiz = async () => {
    if (quizzing) return;
    setQuizzing(true);

    try {
      const result = await generateQuiz(jobId, 3);

      /* Trộn theo `sourcePath`, giống hệt cách làm với mô tả: giữ nguyên tên
         và lựa chọn giảng viên đã sửa, chỉ nhận thêm phần câu hỏi. */
      const quizByPath = new Map<string, ProposedQuizQuestion[]>();
      for (const s of result.proposal?.sections || []) {
        for (const l of s.lessons || []) {
          if (l.quizQuestions?.length) quizByPath.set(l.sourcePath, l.quizQuestions);
        }
      }

      setSections((prev) =>
        prev.map((s) => ({
          ...s,
          /* Gán `?? []` chứ không phải `?? l.quiz`: máy chủ đã xóa sạch đề cũ
             khi soạn lại, giao diện phải phản ánh đúng như vậy. Nếu giữ lại đề
             cũ ở đây, giảng viên sẽ thấy nhiều câu hơn số máy chủ thật sự có. */
          lessons: s.lessons.map((l) => ({
            ...l,
            quiz: quizByPath.get(l.sourcePath) ?? [],
          })),
        }))
      );

      setQuizInfo({
        total: result.totalQuestions,
        lessons: result.lessonsWithQuiz,
        warnings: result.warnings || [],
      });
      // Soạn xong thì bật sẵn — người ta bấm nút này là đã muốn dùng rồi.
      setIncludeQuiz(true);
      toast.success(
        `AI đã soạn ${result.totalQuestions} câu hỏi cho ${result.lessonsWithQuiz} bài học.`
      );
    } catch (error: any) {
      toast.error(error?.message || 'Không soạn được câu hỏi.');
    } finally {
      setQuizzing(false);
    }
  };

  /* --- Gửi lên --- */
  const handleSubmit = async () => {
    if (submitting) return;

    if (courseName.trim().length < 3) {
      toast.error('Tên khóa học phải có ít nhất 3 ký tự.');
      return;
    }
    if (!categoryId || !levelId) {
      toast.error('Vui lòng chọn Danh mục và Cấp độ.');
      return;
    }
    if (counts.lessons === 0) {
      toast.error('Bạn chưa chọn bài học nào.');
      return;
    }

    setSubmitting(true);
    try {
      /* ⚠️ Chỉ đưa vào những khóa mà schema Joi phía máy chủ chấp nhận.
         Và BỎ HẲN trường rỗng thay vì gửi chuỗi '': với `Joi.string().max(255)`
         (không có `.allow('')`), một chuỗi rỗng làm hỏng cả request. */
      const payload = {
        courseName: courseName.trim(),
        categoryId: Number(categoryId),
        levelId: Number(levelId),
        shortDescription: shortDescription.trim() || null,
        fullDescription: fullDescription.trim() || null,
        originalPrice: Number(originalPrice) || 0,
        language: 'vi',
        /* Chỉ gửi cờ. Nội dung câu hỏi KHÔNG gửi từ client — máy chủ đọc từ
           bản nháp của chính nó, nếu không thì ai cũng tự soạn được đề và đáp
           án tùy ý cho khóa học của mình. */
        includeQuiz,
        sections: sections.map((section) => {
          const name = section.sectionName.trim();
          return {
            sourceDir: section.sourceDir,
            ...(name ? { sectionName: name } : {}),
            description: section.description.trim() || null,
            selected: section.selected,
            lessons: section.lessons.map((lesson) => {
              const lessonName = lesson.lessonName.trim();
              return {
                sourcePath: lesson.sourcePath,
                ...(lessonName ? { lessonName } : {}),
                description: lesson.description.trim() || null,
                selected: lesson.selected,
              };
            }),
          };
        }),
      };

      const result = await acceptImport(jobId, payload);
      /* Dùng con số MÁY CHỦ trả về, không dùng `counts.videos` tính ở client.
         Hai con số có thể lệch nhau (ví dụ một video bị bỏ qua vì tệp hỏng), và
         nếu lấy số của client thì thanh tiến độ ở bước sau sẽ không bao giờ
         chạy hết. */
      onAccepted(result);
    } catch (error: any) {
      toast.error(error?.message || 'Không tạo được khóa học.');
      // Chỉ mở khóa nút khi THẤT BẠI. Thành công thì component sắp bị gỡ khỏi
      // cây — gọi setState ở đó là cảnh báo "update on unmounted component".
      setSubmitting(false);
    }
  };

  const confidencePercent = Math.round((proposal.confidence || 0) * 100);
  const lowConfidence = proposal.needsAiGrouping;

  return (
    <div className='space-y-6'>
      {/* ── SỐ LIỆU ── */}
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        <StatTile
          Icon={Icons.layers}
          label='Chương sẽ tạo'
          value={counts.sections}
        />
        <StatTile
          Icon={Icons.lessons}
          label='Bài học sẽ tạo'
          value={counts.lessons}
        />
        <StatTile
          Icon={Icons.video}
          label='Video (tải lên sau)'
          value={counts.videos}
        />
        <StatTile
          Icon={Icons.captions}
          label='Phụ đề ghép được'
          value={proposal.stats?.subtitleMatched ?? 0}
          tone='good'
        />
      </div>

      {/* ── CẢNH BÁO ĐỘ TIN CẬY ── */}
      {lowConfidence && (
        <div className='flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm'>
          <Icons.alertTriangle className='mt-0.5 h-4 w-4 shrink-0 text-amber-400' />
          <div className='space-y-1'>
            <p className='font-semibold text-amber-300'>
              Cấu trúc thư mục hơi khó đoán (độ tin cậy {confidencePercent}%)
            </p>
            <p className='text-muted-foreground'>
              Thường là do các tệp nằm dồn trong một thư mục, hoặc tên tệp không
              có số thứ tự. Bản nháp bên dưới vẫn dùng được — bạn chỉ cần rà lại
              tên chương và bỏ tick những bài không muốn tạo.
            </p>
          </div>
        </div>
      )}

      {/* ── NHỜ AI VIẾT MÔ TẢ ── */}
      <section className='overflow-hidden rounded-3xl border border-violet-500/25 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/5 to-transparent p-5'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div className='flex items-start gap-3'>
            <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-fuchsia-500/25'>
              <Icons.sparkles className='h-5 w-5 text-white' />
            </div>
            <div className='space-y-1'>
              <p className='font-bold'>Để AI viết mô tả giúp bạn</p>
              <p className='max-w-xl text-xs text-muted-foreground'>
                AI đọc nội dung đã bóc từ tài liệu rồi viết mô tả cho khóa học,
                từng chương và từng bài. Bạn xem lại và sửa thoải mái trước khi
                tạo — không có gì được lưu tự động.
              </p>
            </div>
          </div>

          <div className='flex shrink-0 gap-2'>
            {beforeAi && (
              <Button
                variant='ghost'
                onClick={handleUndoAi}
                disabled={enriching}
                className='rounded-xl'
              >
                <Icons.refresh className='mr-2 h-4 w-4' />
                Hoàn tác
              </Button>
            )}

            <Button
              variant='outline'
              onClick={handleGenerateQuiz}
              disabled={quizzing || enriching}
              className='h-11 rounded-xl border-violet-400/40 px-5 font-bold'
            >
              {quizzing ? (
                <>
                  <Icons.loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Đang soạn đề...
                </>
              ) : (
                <>
                  <Icons.listChecks className='mr-2 h-4 w-4' />
                  {quizInfo ? 'Soạn đề lại' : 'Tạo câu hỏi trắc nghiệm'}
                </>
              )}
            </Button>

            <Button
              onClick={handleEnrich}
              disabled={enriching || quizzing}
              className='h-11 rounded-xl border border-white/20 bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 font-bold text-white shadow-lg shadow-fuchsia-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:from-violet-500 hover:to-fuchsia-500 disabled:translate-y-0 disabled:opacity-60'
            >
              {enriching ? (
                <>
                  <Icons.loader2 className='mr-2 h-4 w-4 animate-spin' />
                  AI đang viết...
                </>
              ) : (
                <>
                  <Icons.wand className='mr-2 h-4 w-4' />
                  {aiInfo ? 'Viết lại' : 'Dùng AI viết mô tả'}
                </>
              )}
            </Button>
          </div>
        </div>

        {enriching && (
          <p className='mt-4 border-t border-violet-500/20 pt-3 text-xs text-muted-foreground'>
            Có thể mất tới vài phút với khóa học nhiều bài. Đừng đóng trang này.
          </p>
        )}

        {quizzing && (
          <p className='mt-4 border-t border-violet-500/20 pt-3 text-xs text-muted-foreground'>
            Đang soạn đề từ nội dung tài liệu. Bài video chưa có phụ đề sẽ được
            bỏ qua vì không có gì để ra đề.
          </p>
        )}

        {(aiInfo || quizInfo) && !enriching && !quizzing && (
          <div className='mt-4 space-y-2 border-t border-violet-500/20 pt-3 text-xs'>
            {aiInfo && (
              <p className='flex items-center gap-2 text-emerald-400'>
                <Icons.checkCircle2 className='h-3.5 w-3.5 shrink-0' />
                Đã viết mô tả cho {aiInfo.sections} chương và {aiInfo.lessons}{' '}
                bài học.
              </p>
            )}

            {quizInfo && (
              <p className='flex items-center gap-2 text-emerald-400'>
                <Icons.checkCircle2 className='h-3.5 w-3.5 shrink-0' />
                Đã soạn {quizInfo.total} câu hỏi cho {quizInfo.lessons} bài học.
                Bấm vào nhãn "N câu hỏi" ở mỗi bài để xem.
              </p>
            )}

            <p className='flex items-start gap-2 text-muted-foreground'>
              <Icons.info className='mt-0.5 h-3.5 w-3.5 shrink-0' />
              Hãy đọc lại trước khi tạo — AI có thể hiểu sai ý bạn. Riêng câu hỏi
              trắc nghiệm, sửa hoặc xóa từng câu ở trang Sửa khóa học sau khi tạo
              xong.
            </p>

            {[...(aiInfo?.warnings || []), ...(quizInfo?.warnings || [])].map(
              (w) => (
                <p key={w} className='flex items-start gap-2 text-amber-400'>
                  <Icons.alertTriangle className='mt-0.5 h-3.5 w-3.5 shrink-0' />
                  {w}
                </p>
              )
            )}
          </div>
        )}
      </section>

      {/* ── THÔNG TIN KHÓA HỌC ── */}
      <section className='space-y-5 rounded-3xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm'>
        <h2 className='flex items-center gap-2 text-lg font-bold'>
          <Icons.bookOpen className='h-5 w-5 text-indigo-400' />
          Thông tin khóa học
        </h2>

        <div className='space-y-2'>
          <Label htmlFor='import-course-name'>
            Tên khóa học <span className='text-rose-400'>*</span>
          </Label>
          <Input
            id='import-course-name'
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder='VD: Lập trình Python từ con số 0'
            className='h-11 rounded-xl'
          />
        </div>

        <div className='grid gap-4 sm:grid-cols-3'>
          <div className='space-y-2'>
            <Label>
              Danh mục <span className='text-rose-400'>*</span>
            </Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className='h-11 rounded-xl'>
                <SelectValue placeholder='Chọn danh mục' />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c: any) => (
                  <SelectItem
                    key={c.categoryId}
                    value={String(c.categoryId)}
                  >
                    {c.categoryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>
              Cấp độ <span className='text-rose-400'>*</span>
            </Label>
            <Select value={levelId} onValueChange={setLevelId}>
              <SelectTrigger className='h-11 rounded-xl'>
                <SelectValue placeholder='Chọn cấp độ' />
              </SelectTrigger>
              <SelectContent>
                {levels.map((l: any) => (
                  <SelectItem key={l.levelId} value={String(l.levelId)}>
                    {l.levelName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='import-price'>Giá gốc (VND)</Label>
            <Input
              id='import-price'
              type='number'
              min={0}
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              className='h-11 rounded-xl'
            />
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='import-short-desc'>Mô tả ngắn</Label>
          <Input
            id='import-short-desc'
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            maxLength={500}
            placeholder='Một câu tóm tắt hiện ở thẻ khóa học'
            className='h-11 rounded-xl'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='import-full-desc'>
            Mô tả đầy đủ
            {proposal.courseDescription && (
              <span className='ml-2 text-xs font-normal text-emerald-400'>
                (đã lấy sẵn từ tệp _khoa-hoc.md)
              </span>
            )}
          </Label>
          <Textarea
            id='import-full-desc'
            value={fullDescription}
            onChange={(e) => setFullDescription(e.target.value)}
            rows={5}
            className='rounded-xl'
          />
        </div>
      </section>

      {/* ── CẤU TRÚC ── */}
      <section className='space-y-4'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <h2 className='flex items-center gap-2 text-lg font-bold'>
            <Icons.layers className='h-5 w-5 text-purple-400' />
            Cấu trúc đề xuất
          </h2>
          <p className='text-xs text-muted-foreground'>
            Bỏ tick những mục không muốn tạo. Thứ tự lấy theo tên tệp — đổi được
            ở trang Sửa khóa học sau khi tạo xong.
          </p>
        </div>

        {sections.map((section, sIndex) => {
          const isCollapsed = collapsed[section.sourceDir] ?? false;
          const pickedCount = section.lessons.filter((l) => l.selected).length;

          return (
            <div
              key={section.sourceDir || `root-${sIndex}`}
              className={[
                'overflow-hidden rounded-2xl border transition-all duration-200',
                section.selected
                  ? 'border-border/60 bg-card/60'
                  : 'border-border/40 bg-muted/20 opacity-60',
              ].join(' ')}
            >
              {/* Đầu chương */}
              <div className='flex flex-wrap items-center gap-3 border-b border-border/50 p-4'>
                <Checkbox
                  checked={section.selected}
                  onCheckedChange={(v) =>
                    patchSection(sIndex, { selected: v === true })
                  }
                  className='shrink-0'
                />

                <Input
                  value={section.sectionName}
                  onChange={(e) =>
                    patchSection(sIndex, { sectionName: e.target.value })
                  }
                  disabled={!section.selected}
                  className='h-10 min-w-[200px] flex-1 rounded-xl border-transparent bg-transparent text-base font-bold focus-visible:border-input focus-visible:bg-background'
                />

                <span className='shrink-0 rounded-full bg-indigo-500/15 px-2.5 py-1 text-xs font-semibold text-indigo-300'>
                  {pickedCount}/{section.lessons.length} bài
                </span>

                <button
                  type='button'
                  onClick={() =>
                    setCollapsed((prev) => ({
                      ...prev,
                      [section.sourceDir]: !isCollapsed,
                    }))
                  }
                  className='shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted'
                  aria-label={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
                >
                  {isCollapsed ? (
                    <Icons.chevronDown className='h-4 w-4' />
                  ) : (
                    <Icons.chevronUp className='h-4 w-4' />
                  )}
                </button>
              </div>

              {/* Mô tả chương — chỉ hiện khi CÓ nội dung.
                  Trước khi bấm AI thì gần như luôn rỗng, nên hiện sẵn một ô
                  trống chỉ làm màn hình rối thêm mà chẳng ai dùng tới. */}
              {section.description && (
                <div className='border-b border-border/40 px-4 py-3'>
                  <Textarea
                    value={section.description}
                    onChange={(e) =>
                      patchSection(sIndex, { description: e.target.value })
                    }
                    disabled={!section.selected}
                    rows={2}
                    className='rounded-lg border-transparent bg-muted/30 text-xs focus-visible:border-input focus-visible:bg-background'
                  />
                </div>
              )}

              {/* Danh sách bài */}
              {!isCollapsed && (
                <div className='divide-y divide-border/40'>
                  {section.lessons.map((lesson, lIndex) => (
                    <div
                      key={lesson.sourcePath}
                      className={`px-4 py-3 ${lesson.selected ? '' : 'opacity-50'}`}
                    >
                     <div className='flex flex-wrap items-center gap-3'>
                      <Checkbox
                        checked={lesson.selected}
                        disabled={!section.selected}
                        onCheckedChange={(v) =>
                          patchLesson(sIndex, lIndex, { selected: v === true })
                        }
                        className='shrink-0'
                      />

                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          lesson.lessonType === 'VIDEO'
                            ? 'bg-rose-500/15 text-rose-400'
                            : 'bg-sky-500/15 text-sky-400'
                        }`}
                      >
                        {lesson.lessonType === 'VIDEO' ? (
                          <Icons.video className='h-4 w-4' />
                        ) : (
                          <Icons.fileText className='h-4 w-4' />
                        )}
                      </div>

                      <Input
                        value={lesson.lessonName}
                        onChange={(e) =>
                          patchLesson(sIndex, lIndex, {
                            lessonName: e.target.value,
                          })
                        }
                        disabled={!section.selected || !lesson.selected}
                        className='h-9 min-w-[180px] flex-1 rounded-lg border-transparent bg-transparent text-sm focus-visible:border-input focus-visible:bg-background'
                      />

                      {/* Nhãn thông tin */}
                      <div className='flex shrink-0 flex-wrap items-center gap-1.5 text-[11px]'>
                        <span className='rounded-md bg-muted px-1.5 py-0.5 font-mono text-muted-foreground'>
                          {lesson.ext}
                        </span>

                        {lesson.lessonType === 'VIDEO' &&
                          lesson.durationSeconds !== null && (
                            <span className='flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground'>
                              <Icons.clock className='h-3 w-3' />
                              {formatDuration(lesson.durationSeconds)}
                            </span>
                          )}

                        <span className='rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground'>
                          {formatBytes(lesson.sizeBytes)}
                        </span>

                        {lesson.hasSubtitle && (
                          <span
                            className='flex items-center gap-1 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-emerald-400'
                            title='Đã ghép được tệp phụ đề trùng tên'
                          >
                            <Icons.captions className='h-3 w-3' />
                            phụ đề
                          </span>
                        )}

                        {lesson.hasText && (
                          <span
                            className='flex items-center gap-1 rounded-md bg-sky-500/15 px-1.5 py-0.5 text-sky-400'
                            title='Đã đọc được nội dung văn bản của tệp'
                          >
                            <Icons.fileSearch className='h-3 w-3' />
                            có nội dung
                          </span>
                        )}

                        {lesson.note && (
                          <span
                            className='flex items-center gap-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-amber-400'
                            title={lesson.note}
                          >
                            <Icons.info className='h-3 w-3' />
                            lưu ý
                          </span>
                        )}

                        {lesson.quiz.length > 0 && (
                          <button
                            type='button'
                            onClick={() =>
                              setOpenQuiz((prev) => ({
                                ...prev,
                                [lesson.sourcePath]: !prev[lesson.sourcePath],
                              }))
                            }
                            className='flex items-center gap-1 rounded-md bg-violet-500/15 px-1.5 py-0.5 text-violet-300 transition-colors hover:bg-violet-500/25'
                          >
                            <Icons.listChecks className='h-3 w-3' />
                            {lesson.quiz.length} câu hỏi
                          </button>
                        )}
                      </div>
                     </div>

                      {/* Mô tả do AI viết. Để READ-ONLY ở màn hình này có chủ
                          đích: nhét 40 ô nhập liệu vào đây thì màn hình không
                          còn đọc được nữa. Sửa chi tiết ở trang Sửa khóa học. */}
                      {lesson.description && (
                        <p className='mt-2 pl-11 text-xs leading-relaxed text-muted-foreground'>
                          {lesson.description}
                        </p>
                      )}

                      {/* Câu hỏi trắc nghiệm — mặc định thu gọn.
                          Bung sẵn hết thì một khóa 30 bài × 3 câu × 4 lựa chọn
                          sẽ thành 360 dòng, không ai đọc nổi. */}
                      {lesson.quiz.length > 0 && openQuiz[lesson.sourcePath] && (
                        <div className='mt-3 space-y-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 pl-4'>
                          {lesson.quiz.map((q, qIndex) => (
                            <div key={`${lesson.sourcePath}-q${qIndex}`} className='space-y-1.5'>
                              <p className='text-xs font-semibold'>
                                {qIndex + 1}. {q.question}
                              </p>

                              <ul className='space-y-1'>
                                {q.options.map((opt, oIndex) => {
                                  const isCorrect = oIndex === q.correctIndex;
                                  return (
                                    <li
                                      key={`${lesson.sourcePath}-q${qIndex}-o${oIndex}`}
                                      className={`flex items-start gap-2 text-xs ${
                                        isCorrect
                                          ? 'font-semibold text-emerald-400'
                                          : 'text-muted-foreground'
                                      }`}
                                    >
                                      <span className='mt-0.5 w-4 shrink-0'>
                                        {isCorrect ? (
                                          <Icons.check className='h-3 w-3 stroke-[3]' />
                                        ) : (
                                          <span className='opacity-40'>
                                            {String.fromCharCode(65 + oIndex)}.
                                          </span>
                                        )}
                                      </span>
                                      {opt}
                                    </li>
                                  );
                                })}
                              </ul>

                              {q.explanation && (
                                <p className='pl-6 text-[11px] italic text-muted-foreground'>
                                  {q.explanation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {section.lessons.length === 0 && (
                    <p className='px-4 py-3 text-sm text-muted-foreground'>
                      Chương này không có bài học nào.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* ── HÀNH ĐỘNG ── */}
      <div className='sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card/95 p-4 shadow-2xl backdrop-blur-xl'>
        <div className='space-y-2'>
          <p className='text-sm text-muted-foreground'>
            Sẽ tạo{' '}
            <strong className='text-foreground'>{counts.sections} chương</strong>{' '}
            và{' '}
            <strong className='text-foreground'>{counts.lessons} bài học</strong>
            {includeQuiz && counts.questions > 0 && (
              <>
                {' '}
                cùng{' '}
                <strong className='text-violet-300'>
                  {counts.questions} câu hỏi
                </strong>
              </>
            )}{' '}
            ở trạng thái <strong className='text-amber-400'>NHÁP</strong>.
          </p>

          {counts.questions > 0 && (
            <label className='flex cursor-pointer items-center gap-2 text-xs text-muted-foreground'>
              <Checkbox
                checked={includeQuiz}
                onCheckedChange={(v) => setIncludeQuiz(v === true)}
              />
              Tạo kèm {counts.questions} câu hỏi trắc nghiệm do AI soạn
            </label>
          )}
        </div>

        <div className='flex gap-3'>
          <Button
            variant='outline'
            onClick={onCancel}
            disabled={submitting}
            className='rounded-xl'
          >
            <Icons.x className='mr-2 h-4 w-4' />
            Hủy bỏ
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className='h-11 rounded-xl border border-white/20 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 font-extrabold text-white shadow-xl shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 disabled:translate-y-0 disabled:opacity-60'
          >
            {submitting ? (
              <>
                <Icons.loader2 className='mr-2 h-4 w-4 animate-spin' />
                Đang tạo...
              </>
            ) : (
              <>
                <Icons.checkCircle2 className='mr-2 h-4 w-4 stroke-[3]' />
                Tạo khóa học nháp
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── GHI CHÚ VIDEO ── */}
      {counts.videos > 0 && (
        <div className='flex items-start gap-3 rounded-2xl border border-sky-500/25 bg-sky-500/10 p-4 text-sm'>
          <Icons.info className='mt-0.5 h-4 w-4 shrink-0 text-sky-400' />
          <p className='text-muted-foreground'>
            <strong className='text-sky-300'>
              {counts.videos} video chưa được tải lên Cloudinary.
            </strong>{' '}
            Chúng vẫn nằm trên máy chủ và chỉ được tải lên sau khi bạn tạo khóa
            học — làm vậy để nếu bạn đổi ý và hủy, không có tệp rác nào bị bỏ
            lại trên Cloudinary.
          </p>
        </div>
      )}
    </div>
  );
};

export default ImportReviewPanel;
