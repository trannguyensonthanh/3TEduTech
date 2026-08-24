// src/pages/instructor/components/ImportReviewPanel.tsx
//
/* ============================================================================
   MÀN HÌNH DUYỆT BẢN NHÁP — chốt chặn cuối cùng trước khi bất cứ thứ gì được
   ghi vào cơ sở dữ liệu.

   ── [VIẾT LẠI 20/08/2026] VÌ SAO ────────────────────────────────────────

   Bản trước chỉ cho sửa 5 trường: tên khóa học, danh mục, cấp độ, giá gốc và
   hai ô mô tả. Trong khi bảng `Courses` có 14 trường do giảng viên nhập, và
   trang tạo khóa học thủ công cho nhập đủ cả 14. Hệ quả với MỌI khóa học nhập
   từ tệp nén:

     • `Requirements` và `LearningOutcomes` luôn NULL — dù schema Joi phía máy
       chủ đã nhận hai trường này từ lâu, chỉ là giao diện không bao giờ gửi.
       "Bạn sẽ học được gì" là khối thuyết phục người mua mạnh nhất trên trang
       chi tiết khóa học, và nó trống rỗng.
     • `ThumbnailUrl` luôn NULL — thẻ khóa học hiện một ô xám ở trang chủ và
       trang danh sách, đúng thứ đầu tiên người mua nhìn thấy.
     • `IntroVideoUrl` luôn NULL.
     • `DiscountedPrice` luôn NULL — không đặt được giá khuyến mãi.
     • `Language` bị ghi cứng 'vi' ngay trong mã, nên khóa học tiếng Anh nhập
       từ ZIP bị gán sai ngôn ngữ.

   Cộng thêm hai chỗ đứt về nội dung:
     • Video KHÔNG xem trước được — giảng viên duyệt một khóa học mà chưa từng
       nhìn thấy nội dung của nó.
     • Câu hỏi trắc nghiệm CHỈ ĐỌC, số câu ghi cứng 3, không có khái niệm độ
       khó, và (nghiêm trọng nhất) câu hỏi được gắn vào bài TEXT/VIDEO nên sau
       khi tạo xong thì không ai xem được.

   ── BỐ CỤC CHIA TAB ─────────────────────────────────────────────────────

   Nhét ~15 trường vào một trang cuốn thì phần quan trọng nhất — cấu trúc
   chương trình học — bị đẩy xuống dưới ba màn hình. Chia tab theo NHÓM VIỆC:
   nội dung bán hàng, nội dung giảng dạy, và phần kiểm tra.

   ── HAI ĐIỀU CẦN BIẾT VỀ THỨ ĐƯỢC GỬI LÊN ───────────────────────────────

   1. Chỉ gửi những trường ĐƯỢC PHÉP SỬA. Máy chủ dùng Joi từ chối mọi khóa lạ,
      nên gửi dư một trường là hỏng CẢ request. Đường dẫn tệp, loại bài học,
      trạng thái khóa học... đều do máy chủ tự quyết định.

   2. `sourceDir` và `sourcePath` là KHÓA ĐỐI CHIẾU, không phải dữ liệu. Máy chủ
      dùng chúng để tìm lại đúng chương/bài trong bản nháp gốc — tuyệt đối không
      được sửa.

   ── KHÔNG CÓ CHỨC NĂNG ĐỔI THỨ TỰ, VÀ ĐÓ LÀ CHỦ Ý ───────────────────────

   Máy chủ tạo chương/bài theo thứ tự trong bản nháp của nó (đã sắp theo số ở
   đầu tên tệp). Nếu ở đây cho kéo thả, thay đổi đó bị BỎ QUA hoàn toàn mà không
   có lỗi nào báo — kiểu hỏng tệ nhất: người dùng tin là đã lưu.
============================================================================ */

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatCard from '@/components/common/StatCard';
import TiptapEditor from '@/components/editor/TiptapEditor';
import ImportMediaPreview from './ImportMediaPreview';
import ImportQuizEditor, { type QuizLessonRef } from './ImportQuizEditor';

import {
  AlertTriangle,
  BookOpen,
  Captions,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Image as ImageIcon,
  Info,
  Layers,
  ListChecks,
  Loader2,
  RefreshCw,
  Sparkles,
  Video,
  Wand,
} from 'lucide-react';

import { getCategories } from '@/services/category.service';
import { getLevels } from '@/services/level.service';
import { useQuery } from '@tanstack/react-query';

import {
  acceptImport,
  type AcceptImportResult,
  enrichImport,
  formatBytes,
  formatDuration,
  type ImportProposal,
  type ProposedQuizQuestion,
} from '@/services/import.service';

/* ───────────────────────────── Kiểu nội bộ ───────────────────────────── */

interface EditableLesson {
  sourcePath: string;
  lessonName: string;
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
  onAccepted: (result: AcceptImportResult) => void;
  onCancel: () => void;
}

/* Sinh slug xem trước — GIỐNG HỆT cách trang sửa khóa học làm, và cũng chỉ để
   xem. Máy chủ tự sinh slug thật kèm hậu tố ngẫu nhiên, vì hai giảng viên đặt
   trùng tên khóa học là chuyện bình thường mà `UQ_Courses_Slug` là ràng buộc
   duy nhất toàn hệ thống. Hiện ra ở đây để giảng viên biết đường dẫn khóa học
   sẽ trông thế nào, không phải để họ sửa. */
const slugXemTruoc = (ten: string): string =>
  ten
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

/* ───────────────────────────── Thành phần chính ───────────────────────── */

const ImportReviewPanel: React.FC<Props> = ({
  jobId,
  proposal,
  onAccepted,
  onCancel,
}) => {
  const [tab, setTab] = useState('thong-tin');

  /* --- Thông tin khóa học ---
     Khởi tạo từ bản nháp chứ không phải chuỗi rỗng: nếu giảng viên đã bấm AI
     rồi tải lại trang, nội dung đã lưu trên Redis phải hiện lại — nếu không họ
     sẽ tưởng mất và bấm AI thêm lần nữa, tiêu token vô ích. */
  const [courseName, setCourseName] = useState(proposal.courseName || '');
  const [categoryId, setCategoryId] = useState<string>('');
  const [levelId, setLevelId] = useState<string>('');
  const [language, setLanguage] = useState<string>('vi');

  const [shortDescription, setShortDescription] = useState(
    proposal.courseShortDescription || ''
  );
  const [fullDescription, setFullDescription] = useState(
    proposal.courseDescription || ''
  );
  const [requirements, setRequirements] = useState(
    proposal.courseRequirements || ''
  );
  const [learningOutcomes, setLearningOutcomes] = useState(
    proposal.courseLearningOutcomes || ''
  );

  const [originalPrice, setOriginalPrice] = useState<string>('0');
  const [discountedPrice, setDiscountedPrice] = useState<string>('');
  const [introVideoUrl, setIntroVideoUrl] = useState<string>('');
  const [useCoverImage, setUseCoverImage] = useState(
    Boolean(proposal.coverImage)
  );

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
    requirements: string;
    outcomes: string;
    sections: EditableSection[];
  } | null>(null);

  const [includeQuiz, setIncludeQuiz] = useState(false);

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

  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: () => getCategories({ limit: 200 }),
    staleTime: 5 * 60 * 1000,
  });
  const { data: levelsData } = useQuery({
    queryKey: ['levels', 'all'],
    queryFn: () => getLevels(),
    staleTime: 5 * 60 * 1000,
  });

  /* ─────────────────────── Số liệu tổng hợp ─────────────────────── */

  const counts = useMemo(() => {
    let lessons = 0;
    let videos = 0;
    let subtitles = 0;
    let questions = 0;
    let sectionsWithQuiz = 0;

    for (const section of sections) {
      if (!section.selected) continue;
      let cauChuong = 0;
      for (const lesson of section.lessons) {
        if (!lesson.selected) continue;
        lessons += 1;
        if (lesson.lessonType === 'VIDEO') videos += 1;
        if (lesson.hasSubtitle) subtitles += 1;
        cauChuong += lesson.quiz.length;
      }
      questions += cauChuong;
      if (cauChuong > 0) sectionsWithQuiz += 1;
    }

    return {
      sections: sections.filter((s) => s.selected).length,
      lessons,
      videos,
      subtitles,
      questions,
      sectionsWithQuiz,
    };
  }, [sections]);

  /* Danh sách phẳng cho trình soạn trắc nghiệm. */
  const quizLessons: QuizLessonRef[] = useMemo(
    () =>
      sections
        .filter((s) => s.selected)
        .flatMap((s) =>
          s.lessons
            .filter((l) => l.selected)
            .map((l) => ({
              sourcePath: l.sourcePath,
              lessonName: l.lessonName || 'Bài học',
              sectionName: s.sectionName || 'Chương chưa đặt tên',
              raDeDuoc: l.hasText,
              questions: l.quiz,
            }))
        ),
    [sections]
  );

  const apDungQuiz = (
    capNhat: Array<{ sourcePath: string; questions: ProposedQuizQuestion[] }>
  ) => {
    const theoDuong = new Map(capNhat.map((c) => [c.sourcePath, c.questions]));
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        lessons: s.lessons.map((l) =>
          theoDuong.has(l.sourcePath)
            ? { ...l, quiz: theoDuong.get(l.sourcePath) as ProposedQuizQuestion[] }
            : l
        ),
      }))
    );
  };

  /* ─────────────────────── Sửa cấu trúc ─────────────────────── */

  const toggleSection = (sourceDir: string, value: boolean) => {
    setSections((prev) =>
      prev.map((s) =>
        s.sourceDir === sourceDir
          ? {
              ...s,
              selected: value,
              // Bỏ chọn cả chương thì bỏ chọn luôn mọi bài bên trong: để lệch
              // nhau sẽ khiến số liệu ở đầu trang không khớp với thứ nhìn thấy.
              lessons: s.lessons.map((l) => ({ ...l, selected: value })),
            }
          : s
      )
    );
  };

  const toggleLesson = (sourceDir: string, sourcePath: string, value: boolean) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.sourceDir !== sourceDir) return s;
        const lessons = s.lessons.map((l) =>
          l.sourcePath === sourcePath ? { ...l, selected: value } : l
        );
        return {
          ...s,
          lessons,
          // Chọn lại một bài trong chương đang tắt thì bật lại chương.
          selected: value ? true : s.selected && lessons.some((l) => l.selected),
        };
      })
    );
  };

  const suaSection = (sourceDir: string, thayDoi: Partial<EditableSection>) => {
    setSections((prev) =>
      prev.map((s) => (s.sourceDir === sourceDir ? { ...s, ...thayDoi } : s))
    );
  };

  const suaLesson = (
    sourceDir: string,
    sourcePath: string,
    thayDoi: Partial<EditableLesson>
  ) => {
    setSections((prev) =>
      prev.map((s) =>
        s.sourceDir === sourceDir
          ? {
              ...s,
              lessons: s.lessons.map((l) =>
                l.sourcePath === sourcePath ? { ...l, ...thayDoi } : l
              ),
            }
          : s
      )
    );
  };

  /* ─────────────────────── Nhờ AI viết nội dung ─────────────────────── */

  const handleEnrich = async () => {
    if (enriching) return;
    setEnriching(true);
    try {
      setBeforeAi({
        short: shortDescription,
        full: fullDescription,
        requirements,
        outcomes: learningOutcomes,
        sections,
      });

      const kq = await enrichImport(jobId);
      const p = kq.proposal;

      if (p.courseShortDescription) setShortDescription(p.courseShortDescription);
      if (p.courseDescription) setFullDescription(p.courseDescription);
      if (p.courseRequirements) setRequirements(p.courseRequirements);
      if (p.courseLearningOutcomes) setLearningOutcomes(p.courseLearningOutcomes);

      // Trộn mô tả chương/bài vào cấu trúc đang sửa, GIỮ NGUYÊN phần chọn/bỏ
      // chọn và tên đã đổi tay của giảng viên.
      const secTheoDir = new Map(
        (p.sections || []).map((s) => [s.sourceDir ?? '', s])
      );
      setSections((prev) =>
        prev.map((s) => {
          const moi = secTheoDir.get(s.sourceDir);
          if (!moi) return s;
          const baiTheoDuong = new Map(
            (moi.lessons || []).map((l) => [l.sourcePath, l])
          );
          return {
            ...s,
            description: moi.description || s.description,
            lessons: s.lessons.map((l) => {
              const lm = baiTheoDuong.get(l.sourcePath);
              return lm?.description ? { ...l, description: lm.description } : l;
            }),
          };
        })
      );

      setAiInfo({
        sections: kq.sectionsWritten,
        lessons: kq.lessonsWritten,
        warnings: kq.warnings || [],
      });
      toast.success('AI đã viết xong phần giới thiệu khóa học.');
    } catch (error: any) {
      toast.error(error?.message || 'AI không viết được mô tả.');
      setBeforeAi(null);
    } finally {
      setEnriching(false);
    }
  };

  const hoanTacAi = () => {
    if (!beforeAi) return;
    setShortDescription(beforeAi.short);
    setFullDescription(beforeAi.full);
    setRequirements(beforeAi.requirements);
    setLearningOutcomes(beforeAi.outcomes);
    setSections(beforeAi.sections);
    setBeforeAi(null);
    setAiInfo(null);
    toast.info('Đã khôi phục nội dung trước khi nhờ AI.');
  };

  /* ─────────────────────── Gửi lên ─────────────────────── */

  const handleSubmit = async () => {
    if (submitting) return;

    if (courseName.trim().length < 3) {
      toast.error('Tên khóa học phải có ít nhất 3 ký tự.');
      setTab('thong-tin');
      return;
    }
    if (!categoryId || !levelId) {
      toast.error('Vui lòng chọn Danh mục và Cấp độ.');
      setTab('thong-tin');
      return;
    }
    if (counts.lessons === 0) {
      toast.error('Bạn chưa chọn bài học nào.');
      setTab('chuong-trinh');
      return;
    }

    const giaGoc = Number(originalPrice) || 0;
    const giaKM = discountedPrice.trim() === '' ? null : Number(discountedPrice);
    if (giaKM !== null && (Number.isNaN(giaKM) || giaKM < 0)) {
      toast.error('Giá khuyến mãi không hợp lệ.');
      setTab('media-gia');
      return;
    }
    if (giaKM !== null && giaKM > giaGoc) {
      // Máy chủ cũng chặn, nhưng bắt ở đây thì giảng viên không mất một vòng
      // gọi mạng chỉ để nhận lại đúng câu này.
      toast.error('Giá khuyến mãi không được lớn hơn giá gốc.');
      setTab('media-gia');
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
        language,
        shortDescription: shortDescription.trim() || null,
        fullDescription: fullDescription.trim() || null,
        requirements: requirements.trim() || null,
        learningOutcomes: learningOutcomes.trim() || null,
        originalPrice: giaGoc,
        discountedPrice: giaKM,
        ...(introVideoUrl.trim() ? { introVideoUrl: introVideoUrl.trim() } : {}),
        useCoverImage,
        /* Chỉ gửi cờ. Nội dung câu hỏi KHÔNG gửi ở đây — máy chủ đọc từ bản
           nháp của chính nó (đã được cập nhật qua tuyến PUT /quiz khi giảng
           viên bấm Lưu), nếu không thì ai cũng tự soạn được đề và đáp án tùy ý
           cho khóa học của mình. */
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
      onAccepted(result);
    } catch (error: any) {
      toast.error(error?.message || 'Không tạo được khóa học.');
      // Chỉ mở khóa nút khi THẤT BẠI. Thành công thì component sắp bị gỡ khỏi
      // cây — gọi setState ở đó là cảnh báo "update on unmounted component".
      setSubmitting(false);
    }
  };

  const lowConfidence = proposal.needsAiGrouping;

  /* ─────────────────────── Giao diện ─────────────────────── */

  return (
    <div className='space-y-6'>
      {/* ── SỐ LIỆU ── */}
      <div className='grid grid-cols-2 gap-4 lg:grid-cols-5'>
        <StatCard label='Chương sẽ tạo' value={counts.sections} icon={Layers} />
        <StatCard label='Bài học sẽ tạo' value={counts.lessons} icon={BookOpen} />
        <StatCard label='Video' value={counts.videos} icon={Video} />
        <StatCard label='Phụ đề ghép được' value={counts.subtitles} icon={Captions} />
        <StatCard
          label='Câu hỏi'
          value={counts.questions}
          icon={ListChecks}
          hint={
            counts.questions > 0
              ? `gom thành ${counts.sectionsWithQuiz} bài kiểm tra`
              : 'chưa soạn đề'
          }
        />
      </div>

      {lowConfidence && (
        <div className='flex items-start gap-3 rounded-lg border border-warning/30 bg-warning-soft p-4'>
          <AlertTriangle
            className='mt-0.5 h-5 w-5 shrink-0 text-warning'
            aria-hidden='true'
          />
          <div className='text-sm'>
            <p className='font-medium text-foreground'>
              Cấu trúc thư mục không rõ ràng
            </p>
            <p className='mt-0.5 text-muted-foreground'>
              Hệ thống không chắc chắn về cách chia chương. Bạn hãy xem kỹ tab{' '}
              <strong>Chương trình học</strong> và sửa lại tên nếu cần.
            </p>
          </div>
        </div>
      )}

      {/* ── TAB ── */}
      <Tabs value={tab} onValueChange={setTab} className='w-full'>
        <TabsList className='grid w-full grid-cols-2 lg:grid-cols-5'>
          <TabsTrigger value='thong-tin'>Thông tin</TabsTrigger>
          <TabsTrigger value='chi-tiet'>Nội dung bán hàng</TabsTrigger>
          <TabsTrigger value='media-gia'>Ảnh &amp; giá</TabsTrigger>
          <TabsTrigger value='chuong-trinh'>
            Chương trình học
            {counts.lessons > 0 && (
              <span className='ml-1.5 rounded-full bg-muted px-1.5 text-xs text-muted-foreground'>
                {counts.lessons}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value='trac-nghiem'>
            Trắc nghiệm
            {counts.questions > 0 && (
              <span className='ml-1.5 rounded-full bg-muted px-1.5 text-xs text-muted-foreground'>
                {counts.questions}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════ TAB 1 — THÔNG TIN ═══════════════ */}
        <TabsContent value='thong-tin' className='mt-5 space-y-5'>
          <div className='space-y-1.5'>
            <Label htmlFor='ten-khoa-hoc'>
              Tên khóa học <span className='text-danger'>*</span>
            </Label>
            <Input
              id='ten-khoa-hoc'
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              maxLength={500}
              placeholder='Ví dụ: Lập trình Web toàn diện cho người mới'
            />
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='slug'>Đường dẫn (tự sinh)</Label>
            <Input
              id='slug'
              value={courseName.trim() ? `${slugXemTruoc(courseName)}-xxxxxxxx` : ''}
              disabled
              className='font-mono text-xs'
              placeholder='sẽ sinh từ tên khóa học'
            />
            <p className='text-xs text-muted-foreground'>
              Hệ thống tự sinh đường dẫn từ tên khóa học và thêm một hậu tố ngẫu
              nhiên, vì hai khóa học trùng tên là chuyện bình thường. Sửa được ở
              trang Sửa khóa học sau khi tạo.
            </p>
          </div>

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
            <div className='space-y-1.5'>
              <Label>
                Danh mục <span className='text-danger'>*</span>
              </Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder='Chọn danh mục' />
                </SelectTrigger>
                <SelectContent>
                  {(categoriesData?.categories || []).map((c: any) => (
                    <SelectItem key={c.categoryId} value={String(c.categoryId)}>
                      {c.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1.5'>
              <Label>
                Cấp độ <span className='text-danger'>*</span>
              </Label>
              <Select value={levelId} onValueChange={setLevelId}>
                <SelectTrigger>
                  <SelectValue placeholder='Chọn cấp độ' />
                </SelectTrigger>
                <SelectContent>
                  {(levelsData?.levels || []).map((l: any) => (
                    <SelectItem key={l.levelId} value={String(l.levelId)}>
                      {l.levelName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1.5'>
              <Label>Ngôn ngữ giảng dạy</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='vi'>Tiếng Việt</SelectItem>
                  <SelectItem value='en'>English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-1.5'>
            <Label>Mô tả ngắn</Label>
            <p className='text-xs text-muted-foreground'>
              Một câu tóm tắt, hiện dưới tên khóa học ở trang danh sách. Tối đa
              500 ký tự.
            </p>
            <div className='rounded-lg border border-border'>
              <TiptapEditor
                key={`short-${shortDescription.slice(0, 20)}`}
                initialContent={shortDescription}
                onContentChange={setShortDescription}
              />
            </div>
          </div>
        </TabsContent>

        {/* ═══════════════ TAB 2 — NỘI DUNG BÁN HÀNG ═══════════════ */}
        <TabsContent value='chi-tiet' className='mt-5 space-y-5'>
          {/* Khối AI */}
          <div className='rounded-lg border border-border bg-muted/40 p-4'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <div className='flex items-start gap-2'>
                <Sparkles
                  className='mt-0.5 h-4 w-4 shrink-0 text-primary'
                  aria-hidden='true'
                />
                <div>
                  <p className='text-sm font-semibold'>Nhờ AI viết giúp</p>
                  <p className='mt-0.5 text-xs text-muted-foreground'>
                    AI đọc nội dung tài liệu bạn vừa tải lên và viết mô tả ngắn,
                    mô tả đầy đủ, yêu cầu đầu vào, kết quả đạt được, cùng mô tả
                    cho từng chương và từng bài.
                  </p>
                </div>
              </div>
              <div className='flex gap-2'>
                {beforeAi && (
                  <Button type='button' variant='ghost' onClick={hoanTacAi}>
                    <RefreshCw className='h-4 w-4' aria-hidden='true' />
                    Hoàn tác
                  </Button>
                )}
                <Button type='button' onClick={handleEnrich} disabled={enriching}>
                  {enriching ? (
                    <>
                      <Loader2 className='h-4 w-4 animate-spin' aria-hidden='true' />
                      Đang viết…
                    </>
                  ) : (
                    <>
                      <Wand className='h-4 w-4' aria-hidden='true' />
                      {aiInfo ? 'Viết lại' : 'Dùng AI viết mô tả'}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {aiInfo && (
              <div className='mt-3 border-t border-border pt-3 text-xs text-muted-foreground'>
                Đã viết mô tả cho {aiInfo.sections} chương và {aiInfo.lessons} bài
                học.
                {aiInfo.warnings.length > 0 && (
                  <ul className='mt-1 space-y-0.5'>
                    {aiInfo.warnings.map((w, i) => (
                      <li key={i}>• {w}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className='space-y-1.5'>
            <Label>Mô tả đầy đủ</Label>
            <p className='text-xs text-muted-foreground'>
              Phần giới thiệu chi tiết, hiện ở đầu trang khóa học.
            </p>
            <div className='rounded-lg border border-border'>
              <TiptapEditor
                key={`full-${fullDescription.slice(0, 20)}`}
                initialContent={fullDescription}
                onContentChange={setFullDescription}
              />
            </div>
          </div>

          <div className='space-y-1.5'>
            <Label>Yêu cầu đầu vào</Label>
            <p className='text-xs text-muted-foreground'>
              Kiến thức, kỹ năng hoặc công cụ người học cần có trước khi bắt đầu.
            </p>
            <div className='rounded-lg border border-border'>
              <TiptapEditor
                key={`req-${requirements.slice(0, 20)}`}
                initialContent={requirements}
                onContentChange={setRequirements}
              />
            </div>
          </div>

          <div className='space-y-1.5'>
            <Label>Bạn sẽ học được gì</Label>
            <p className='text-xs text-muted-foreground'>
              Những việc người học <strong>làm được</strong> sau khóa học. Đây là
              khối được đọc nhiều nhất trên trang bán khóa học.
            </p>
            <div className='rounded-lg border border-border'>
              <TiptapEditor
                key={`out-${learningOutcomes.slice(0, 20)}`}
                initialContent={learningOutcomes}
                onContentChange={setLearningOutcomes}
              />
            </div>
          </div>
        </TabsContent>

        {/* ═══════════════ TAB 3 — ẢNH & GIÁ ═══════════════ */}
        <TabsContent value='media-gia' className='mt-5 space-y-5'>
          <div className='space-y-2'>
            <Label>Ảnh bìa khóa học</Label>
            {proposal.coverImage ? (
              <div className='flex flex-wrap items-center gap-4 rounded-lg border border-border p-4'>
                <div className='flex items-start gap-3'>
                  <Checkbox
                    id='dung-anh-bia'
                    checked={useCoverImage}
                    onCheckedChange={(v) => setUseCoverImage(v === true)}
                  />
                  <div>
                    <Label
                      htmlFor='dung-anh-bia'
                      className='cursor-pointer text-sm font-medium'
                    >
                      Dùng ảnh tìm được trong tệp nén
                    </Label>
                    <p className='mt-0.5 font-mono text-xs text-muted-foreground'>
                      {proposal.coverImage.relativePath}
                    </p>
                  </div>
                </div>
                <ImportMediaPreview
                  jobId={jobId}
                  sourcePath={proposal.coverImage.relativePath}
                  title='Ảnh bìa khóa học'
                  kind='image'
                  compact={false}
                />
              </div>
            ) : (
              <div className='flex items-start gap-3 rounded-lg border border-dashed border-border p-4'>
                <ImageIcon
                  className='mt-0.5 h-5 w-5 shrink-0 text-muted-foreground'
                  aria-hidden='true'
                />
                <div className='text-sm'>
                  <p className='font-medium'>Không tìm thấy ảnh bìa trong tệp nén</p>
                  <p className='mt-0.5 text-muted-foreground'>
                    Lần sau bạn có thể đặt một tệp ảnh tên{' '}
                    <code className='rounded bg-muted px-1'>cover.jpg</code> hoặc{' '}
                    <code className='rounded bg-muted px-1'>bia.png</code> ở thư
                    mục gốc. Bây giờ thì tải ảnh bìa lên ở trang Sửa khóa học sau
                    khi tạo xong.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='intro-video'>Video giới thiệu (YouTube)</Label>
            <Input
              id='intro-video'
              value={introVideoUrl}
              onChange={(e) => setIntroVideoUrl(e.target.value)}
              placeholder='https://www.youtube.com/watch?v=...'
              maxLength={1000}
            />
            <p className='text-xs text-muted-foreground'>
              Đoạn video ngắn giới thiệu khóa học, phát ngay trên trang bán hàng.
              Để trống nếu chưa có.
            </p>
          </div>

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div className='space-y-1.5'>
              <Label htmlFor='gia-goc'>Giá gốc (VND)</Label>
              <Input
                id='gia-goc'
                type='number'
                min={0}
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
              />
              <p className='text-xs text-muted-foreground'>
                Để 0 nếu đây là khóa học miễn phí.
              </p>
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='gia-km'>Giá khuyến mãi (VND)</Label>
              <Input
                id='gia-km'
                type='number'
                min={0}
                value={discountedPrice}
                onChange={(e) => setDiscountedPrice(e.target.value)}
                placeholder='Để trống nếu không giảm giá'
              />
              <p className='text-xs text-muted-foreground'>
                Phải nhỏ hơn hoặc bằng giá gốc.
              </p>
            </div>
          </div>

          <div className='flex items-start gap-2 rounded-lg border border-info/30 bg-info-soft p-3'>
            <Info className='mt-0.5 h-4 w-4 shrink-0 text-info' aria-hidden='true' />
            <p className='text-sm text-foreground'>
              Khóa học được tạo ở trạng thái <strong>nháp</strong>. Bạn xem lại
              và chỉnh sửa thoải mái trước khi gửi duyệt để xuất bản.
            </p>
          </div>
        </TabsContent>

        {/* ═══════════════ TAB 4 — CHƯƠNG TRÌNH HỌC ═══════════════ */}
        <TabsContent value='chuong-trinh' className='mt-5 space-y-4'>
          {sections.map((section) => {
            const dangThu = collapsed[section.sourceDir];
            const soBaiChon = section.lessons.filter((l) => l.selected).length;

            return (
              <div
                key={section.sourceDir}
                className={`rounded-lg border ${
                  section.selected ? 'border-border' : 'border-border opacity-60'
                }`}
              >
                <div className='flex flex-wrap items-center gap-3 border-b border-border bg-muted/40 p-3'>
                  <Checkbox
                    checked={section.selected}
                    onCheckedChange={(v) =>
                      toggleSection(section.sourceDir, v === true)
                    }
                    aria-label={`Chọn chương ${section.sectionName}`}
                  />
                  <Input
                    value={section.sectionName}
                    onChange={(e) =>
                      suaSection(section.sourceDir, { sectionName: e.target.value })
                    }
                    maxLength={255}
                    className='h-9 min-w-0 flex-1 font-medium'
                    placeholder='Tên chương'
                  />
                  <span className='shrink-0 text-xs text-muted-foreground'>
                    {soBaiChon}/{section.lessons.length} bài
                  </span>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='h-9 w-9 shrink-0'
                    onClick={() =>
                      setCollapsed((p) => ({
                        ...p,
                        [section.sourceDir]: !p[section.sourceDir],
                      }))
                    }
                    aria-label={dangThu ? 'Mở chương' : 'Thu gọn chương'}
                  >
                    {dangThu ? (
                      <ChevronDown className='h-4 w-4' aria-hidden='true' />
                    ) : (
                      <ChevronUp className='h-4 w-4' aria-hidden='true' />
                    )}
                  </Button>
                </div>

                {!dangThu && (
                  <div className='space-y-3 p-3'>
                    <div className='space-y-1'>
                      <Label className='text-xs text-muted-foreground'>
                        Mô tả chương
                      </Label>
                      <Textarea
                        value={section.description}
                        onChange={(e) =>
                          suaSection(section.sourceDir, {
                            description: e.target.value,
                          })
                        }
                        rows={2}
                        className='text-sm'
                        placeholder='Chương này dạy gì…'
                      />
                    </div>

                    <div className='divide-y divide-border rounded-lg border border-border'>
                      {section.lessons.map((lesson) => (
                        <div
                          key={lesson.sourcePath}
                          className={`space-y-2 p-3 ${
                            lesson.selected ? '' : 'opacity-60'
                          }`}
                        >
                          <div className='flex flex-wrap items-center gap-2'>
                            <Checkbox
                              checked={lesson.selected}
                              onCheckedChange={(v) =>
                                toggleLesson(
                                  section.sourceDir,
                                  lesson.sourcePath,
                                  v === true
                                )
                              }
                              aria-label={`Chọn bài ${lesson.lessonName}`}
                            />
                            {lesson.lessonType === 'VIDEO' ? (
                              <Video
                                className='h-4 w-4 shrink-0 text-muted-foreground'
                                aria-hidden='true'
                              />
                            ) : (
                              <FileText
                                className='h-4 w-4 shrink-0 text-muted-foreground'
                                aria-hidden='true'
                              />
                            )}
                            <Input
                              value={lesson.lessonName}
                              onChange={(e) =>
                                suaLesson(section.sourceDir, lesson.sourcePath, {
                                  lessonName: e.target.value,
                                })
                              }
                              maxLength={255}
                              className='h-8 min-w-0 flex-1 text-sm'
                            />
                            {/* [THÊM 20/08/2026] Xem trước video ngay tại đây —
                                trước nay giảng viên duyệt mà chưa từng nhìn
                                thấy nội dung mình sắp xuất bản. */}
                            {lesson.lessonType === 'VIDEO' && (
                              <ImportMediaPreview
                                jobId={jobId}
                                sourcePath={lesson.sourcePath}
                                title={lesson.lessonName || 'Video bài học'}
                                kind='video'
                              />
                            )}
                          </div>

                          <div className='flex flex-wrap items-center gap-2 pl-6 text-xs text-muted-foreground'>
                            <span className='rounded bg-muted px-1.5 py-0.5 font-mono'>
                              {lesson.ext}
                            </span>
                            <span>{formatBytes(lesson.sizeBytes)}</span>
                            {lesson.durationSeconds !== null && (
                              <span className='flex items-center gap-1'>
                                <Clock className='h-3 w-3' aria-hidden='true' />
                                {formatDuration(lesson.durationSeconds)}
                              </span>
                            )}
                            {lesson.hasSubtitle && (
                              <span className='flex items-center gap-1'>
                                <Captions className='h-3 w-3' aria-hidden='true' />
                                phụ đề
                              </span>
                            )}
                            {lesson.hasText && (
                              <span className='flex items-center gap-1'>
                                <FileText className='h-3 w-3' aria-hidden='true' />
                                có nội dung
                              </span>
                            )}
                            {lesson.quiz.length > 0 && (
                              <span className='flex items-center gap-1 text-primary'>
                                <ListChecks className='h-3 w-3' aria-hidden='true' />
                                {lesson.quiz.length} câu hỏi
                              </span>
                            )}
                          </div>

                          {lesson.note && (
                            <p className='pl-6 text-xs text-warning'>{lesson.note}</p>
                          )}

                          {/* [SỬA 20/08/2026] Mô tả bài học nay SỬA ĐƯỢC.
                              Bản trước để chỉ đọc với lý do "màn hình sẽ quá
                              rối" — nhưng hệ quả là mô tả AI viết sai thì phải
                              vào trang Sửa khóa học mới đổi được, tức là phải
                              nhớ bài nào sai rồi tự đi tìm lại. Chia tab xong
                              thì chỗ này đã đủ thoáng để sửa tại chỗ. */}
                          <Textarea
                            value={lesson.description}
                            onChange={(e) =>
                              suaLesson(section.sourceDir, lesson.sourcePath, {
                                description: e.target.value,
                              })
                            }
                            rows={2}
                            className='ml-6 w-[calc(100%-1.5rem)] text-sm'
                            placeholder='Mô tả bài học…'
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </TabsContent>

        {/* ═══════════════ TAB 5 — TRẮC NGHIỆM ═══════════════ */}
        <TabsContent value='trac-nghiem' className='mt-5'>
          <ImportQuizEditor
            jobId={jobId}
            lessons={quizLessons}
            onChange={apDungQuiz}
            includeQuiz={includeQuiz}
            onIncludeQuizChange={setIncludeQuiz}
          />
        </TabsContent>
      </Tabs>

      {/* ── THANH HÀNH ĐỘNG ── */}
      <div className='sticky bottom-0 -mx-1 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/95 px-1 py-4 backdrop-blur'>
        <p className='text-sm text-muted-foreground'>
          Sẽ tạo <strong className='text-foreground'>{counts.sections}</strong>{' '}
          chương, <strong className='text-foreground'>{counts.lessons}</strong> bài
          học
          {includeQuiz && counts.questions > 0 && (
            <>
              {' '}
              và{' '}
              <strong className='text-foreground'>{counts.sectionsWithQuiz}</strong>{' '}
              bài kiểm tra
            </>
          )}
          .
        </p>
        <div className='flex gap-2'>
          <Button type='button' variant='outline' onClick={onCancel} disabled={submitting}>
            Hủy bỏ
          </Button>
          <Button type='button' onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin' aria-hidden='true' />
                Đang tạo…
              </>
            ) : (
              'Tạo khóa học nháp'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImportReviewPanel;
