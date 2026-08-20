// src/pages/instructor/CourseImport.tsx
// [THÊM 18/08/2026 — COURSE IMPORT, Giai đoạn A]
//
// Nhập khóa học từ tệp ZIP — màn hình 3 bước: Tải lên → Xử lý → Duyệt.
//
// ─────────────────────────────────────────────────────────────────────────────
// VÌ SAO THĂM DÒ (POLLING) CHỨ KHÔNG DÙNG SSE
//
// Dự án đã có sẵn hạ tầng SSE (event.manager + /v1/events), và backend cũng đã
// đẩy sự kiện tiến độ vào đó. Nhưng ở bước "chạy được trước đã" thì thăm dò
// 2 giây/lần đơn giản hơn hẳn và KHÔNG BAO GIỜ hỏng:
//
//   • Không phụ thuộc cấu hình đệm của Nginx (thứ đã từng làm chết SSE ở
//     production trong khi dev vẫn chạy ngon vì Vite đi đường khác).
//   • Không cần xử lý kết nối rớt / tự nối lại.
//   • Một lần nhập chỉ kéo dài vài phút — chi phí thăm dò không đáng kể.
//
// Khi mọi thứ đã ổn định, chuyển sang SSE chỉ là thay phần `useEffect` bên dưới.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import InstructorLayout from '@/components/layout/InstructorLayout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import PageHeader from '@/components/common/PageHeader';
import SectionCard from '@/components/common/SectionCard';
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Lightbulb,
  ListChecks,
  Loader2,
  Upload,
  Video,
  Wand,
  X,
  XCircle,
} from 'lucide-react';
import ImportReviewPanel from './components/ImportReviewPanel';
import VideoAttachPanel from './components/VideoAttachPanel';
import ZipGuidePanel from './components/ZipGuidePanel';

import {
  uploadImportZip,
  getImportLimits,
  FALLBACK_LIMITS,
  getImportStatus,
  getImportProposal,
  listMyImports,
  cancelImport,
  formatBytes,
  isRunning,
  isMediaRunning,
  type ImportJobSummary,
  type ImportProposal,
  type ImportLimits,
  type LessonNeedingVideo,
  type AcceptImportResult,
} from '@/services/import.service';

/** Chu kỳ thăm dò khi hệ thống đang phân tích ZIP (ms). */
const POLL_INTERVAL_MS = 2000;

/** Chu kỳ thăm dò khi đang tải video lên (ms).
 *  Thưa hơn nhiều vì mỗi video mất vài phút — hỏi dồn dập chỉ tốn lưu lượng. */
const MEDIA_POLL_INTERVAL_MS = 5000;

/* [SỬA 18/08/2026] Thêm bước 'attach-video'.
   Video không còn được giải nén ra máy chủ, nên sau khi tạo khóa học giảng viên
   phải tự gắn nguồn cho từng bài: tải thẳng lên Cloudinary, hoặc dán link
   YouTube. Bước 'media' cũ vẫn giữ — nó theo dõi hàng đợi phía máy chủ, giờ chủ
   yếu là tải phụ đề. */
type Step = 'upload' | 'processing' | 'review' | 'attach-video' | 'media';

/* ───────────────────────────── Thanh 3 bước ───────────────────────────── */

/* Lưu thẳng COMPONENT chứ không lưu tên khóa rồi tra bảng.
   Nếu lưu tên khóa rồi tra `Bang[key]`, TypeScript phải suy ra kiểu là HỢP của
   toàn bộ icon trong bộ — chỉ cần một icon trong đó có props khác biệt là cả
   chỗ này báo lỗi biên dịch, dù ta không hề dùng tới nó. */
type IconComponent = React.ComponentType<{ className?: string }>;

const STEPS: Array<{ key: Step; label: string; Icon: IconComponent }> = [
  { key: 'upload', label: 'Tải tệp ZIP', Icon: Upload },
  { key: 'processing', label: 'Hệ thống phân tích', Icon: Wand },
  { key: 'review', label: 'Bạn duyệt & tạo', Icon: ListChecks },
  { key: 'attach-video', label: 'Gắn video', Icon: Video },
];

const StepBar: React.FC<{ current: Step }> = ({ current }) => {
  /* [SỬA 18/08/2026] 'media' KHÔNG nằm trong STEPS (nó là đường đi cũ, chỉ còn
     dùng cho bản nháp tạo trước khi đổi cách xử lý video). Nếu tra thẳng thì
     `findIndex` trả -1 và thanh bước hiện như chưa bắt đầu gì cả — người dùng
     tưởng mất tiến độ. Quy nó về cùng vị trí với 'attach-video'. */
  const normalized: Step = current === 'media' ? 'attach-video' : current;
  const currentIndex = STEPS.findIndex((s) => s.key === normalized);

  return (
    <div className='flex items-center justify-center gap-2 sm:gap-4'>
      {STEPS.map((step, index) => {
        const { Icon } = step;
        const isDone = index < currentIndex;
        const isActive = index === currentIndex;

        return (
          <React.Fragment key={step.key}>
            <div className='flex flex-col items-center gap-2 text-center'>
              <div
                className={[
                  'flex h-11 w-11 items-center justify-center rounded-xl border transition-colors',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : isDone
                      ? 'border-border bg-muted text-success'
                      : 'border-border bg-muted text-muted-foreground',
                ].join(' ')}
              >
                {isDone ? (
                  <Check className='h-5 w-5' aria-hidden='true' />
                ) : (
                  <Icon className='h-5 w-5' />
                )}
              </div>
              <span
                className={`text-[11px] font-medium sm:text-xs ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>

            {index < STEPS.length - 1 && (
              <div
                className={`mb-6 h-0.5 w-8 rounded-full sm:w-16 ${
                  index < currentIndex ? 'bg-primary' : 'bg-border'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ───────────────────────── Hướng dẫn cấu trúc thư mục ───────────────────── */

const StructureGuide: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className='rounded-xl border border-border bg-card'>
      <button
        type='button'
        onClick={() => setOpen((v) => !v)}
        className='flex w-full items-center justify-between gap-3 px-5 py-4 text-left'
      >
        <span className='flex items-center gap-2.5 text-sm font-semibold'>
          <Lightbulb className='h-4 w-4 text-muted-foreground' aria-hidden='true' />
          Nên sắp xếp tệp ZIP như thế nào?
        </span>
        {open ? (
          <ChevronUp className='h-4 w-4 text-muted-foreground' aria-hidden='true' />
        ) : (
          <ChevronDown className='h-4 w-4 text-muted-foreground' aria-hidden='true' />
        )}
      </button>

      {open && (
        <div className='space-y-4 border-t border-border px-5 py-4 text-sm'>
          <p className='text-muted-foreground'>
            Hệ thống đoán cấu trúc từ <strong>tên thư mục và tên tệp</strong> —
            hoàn toàn không tốn token AI. Đặt tên càng gọn gàng thì bản nháp
            càng chính xác:
          </p>

          {/* Khối cây thư mục dùng nền `bg-muted` chứ không tự đặt nền tối:
              một trang không được tự bật chế độ tối cục bộ. */}
          <pre className='overflow-x-auto rounded-lg border border-border bg-muted p-4 text-xs leading-relaxed text-muted-foreground'>
            {`Khóa học Python cơ bản/
├── _khoa-hoc.md          ← mô tả khóa học (không bắt buộc)
├── 01. Nhập môn/
│   ├── _chuong.md        ← mô tả chương (không bắt buộc)
│   ├── 01. Giới thiệu.mp4
│   ├── 01. Giới thiệu.srt   ← phụ đề, TRÙNG TÊN với video
│   └── 02. Cài đặt.pdf
└── 02. Biến và kiểu dữ liệu/
    ├── 01. Biến.mp4
    └── 02. Bài tập.docx`}
          </pre>

          <ul className='space-y-1.5 text-xs text-muted-foreground'>
            <li>
              • Mỗi <strong>thư mục con</strong> thành một chương, mỗi{' '}
              <strong>tệp</strong> thành một bài học.
            </li>
            <li>
              • Số ở đầu tên (<code>01.</code>, <code>Bài 2 -</code>) dùng để sắp
              thứ tự, và sẽ được bỏ khỏi tên bài học hiển thị.
            </li>
            <li>
              • Tệp <code>.srt</code>/<code>.vtt</code> trùng tên với video sẽ tự
              được ghép làm phụ đề.
            </li>
            <li>
              • Đọc được nội dung: <code>.pdf .docx .pptx .odt .txt .md</code> và
              tệp mã nguồn. Video giữ nguyên, chưa tải lên cho tới khi bạn bấm
              tạo khóa học.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

/* ────────────────────── Bước 4: tải video lên Cloudinary ────────────────── */

const MediaUploadPanel: React.FC<{
  job: ImportJobSummary | null;
  onDone: () => void;
}> = ({ job, onDone }) => {
  const total = job?.mediaTotal ?? 0;
  const done = job?.mediaDone ?? 0;
  const failed = job?.mediaFailed ?? 0;
  const status = job?.mediaStatus ?? 'QUEUED';
  const running = isMediaRunning(status);
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  /* Bốn kết cục, mỗi cái một sắc thái khác nhau — gộp chung thành "xong/lỗi"
     sẽ làm giảng viên hiểu sai mức độ nghiêm trọng. */
  const tone =
    status === 'DONE'
      ? { icon: CheckCircle2, color: 'text-success', title: 'Hoàn tất' }
      : status === 'PARTIAL'
        ? { icon: AlertTriangle, color: 'text-warning', title: 'Xong, nhưng có vài video lỗi' }
        : status === 'SKIPPED'
          ? { icon: Info, color: 'text-muted-foreground', title: 'Đã bỏ qua bước tải video' }
          : status === 'FAILED'
            ? { icon: XCircle, color: 'text-danger', title: 'Tải video thất bại' }
            : { icon: Video, color: 'text-muted-foreground', title: 'Đang tải video lên' };

  const ToneIcon = tone.icon;

  return (
    <SectionCard bodyClassName='space-y-6 p-8 text-center sm:p-12'>
      {/* Bốn kết cục chỉ khác nhau ở BIỂU TƯỢNG và nhãn chữ; màu trạng thái đi
          kèm chứ không đứng một mình gánh ý nghĩa. */}
      <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-xl border border-border bg-muted'>
        <ToneIcon className={`h-8 w-8 ${tone.color}`} aria-hidden='true' />
      </div>

      <div className='space-y-2'>
        <h2 className='text-lg font-semibold'>{tone.title}</h2>
        <p className='mx-auto max-w-lg text-sm text-muted-foreground'>
          {job?.mediaMessage || 'Đang chuẩn bị...'}
        </p>
      </div>

      {total > 0 && status !== 'SKIPPED' && (
        <div className='mx-auto max-w-md space-y-2'>
          <Progress value={percent} className='h-2.5' />
          <div className='flex justify-between text-xs tabular-nums text-muted-foreground'>
            <span>
              {done}/{total} video
              {failed > 0 && (
                <span className='ml-2 text-warning'>({failed} lỗi)</span>
              )}
            </span>
            <span>{percent}%</span>
          </div>
        </div>
      )}

      {running && (
        <p className='mx-auto max-w-lg text-xs text-muted-foreground'>
          Khóa học đã được tạo và bạn có thể rời trang này bất cứ lúc nào — việc
          tải video vẫn chạy trên máy chủ. Chỉ là các bài video sẽ chưa phát
          được cho tới khi tải xong.
        </p>
      )}

      <Button onClick={onDone} variant={running ? 'outline' : 'default'}>
        {running ? (
          <>
            <ArrowRight className='mr-2 h-4 w-4' aria-hidden='true' />
            Để chạy nền, về danh sách khóa học
          </>
        ) : (
          <>
            <ArrowRight className='mr-2 h-4 w-4' aria-hidden='true' />
            Về danh sách khóa học
          </>
        )}
      </Button>
    </SectionCard>
  );
};

/* ───────────────────────────── Trang chính ───────────────────────────── */

const CourseImport: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('upload');

  /* [THÊM 18/08/2026] Giới hạn ĐỌC TỪ MÁY CHỦ, không ghi cứng.
     Xem ghi chú ở `ImportLimits` trong import.service.ts. */
  const [limits, setLimits] = useState<ImportLimits>(FALLBACK_LIMITS);
  /** Danh sách bài chờ gắn video — nhận được sau khi tạo khóa học xong. */
  const [lessonsNeedingVideo, setLessonsNeedingVideo] = useState<
    LessonNeedingVideo[]
  >([]);
  /* Giữ lại dù KHÔNG truyền xuống VideoAttachPanel nữa: nó là điều kiện để
     hiển thị bước 4 (`step === 'attach-video' && createdCourseId`). Component
     con chỉ làm việc theo `lessonId`, máy chủ tự tra ra khóa học từ bài học. */
  const [createdCourseId, setCreatedCourseId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [job, setJob] = useState<ImportJobSummary | null>(null);
  const [proposal, setProposal] = useState<ImportProposal | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  /* Giữ jobId trong ref để hàm thăm dò luôn đọc được giá trị MỚI NHẤT.
     Nếu chỉ đọc biến state trong `setInterval`, closure sẽ giữ mãi giá trị của
     lần render đầu — lỗi kinh điển khiến thăm dò gọi nhầm job cũ. */
  const jobIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /* --- Nạp bản nháp khi job đã READY --- */
  const loadProposal = useCallback(async (jobId: string) => {
    try {
      const data = await getImportProposal(jobId);
      if (!isMountedRef.current) return;
      setProposal(data);
      setStep('review');
    } catch (error: any) {
      if (!isMountedRef.current) return;
      setLoadError(error?.message || 'Không tải được bản nháp.');
    }
  }, []);

  /* --- Khôi phục phiên đang chạy khi mở lại trang ---
     Không có bước này, người dùng lỡ tải lại trang giữa lúc xử lý sẽ tưởng
     mất sạch và tải tệp lên lần nữa — vừa tốn đĩa vừa bị chặn bởi quy tắc
     "mỗi người một lần nhập tại một thời điểm". */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { jobs } = await listMyImports();
        if (cancelled || !jobs?.length) return;

        /* Ba tình huống đáng khôi phục, theo thứ tự ưu tiên:
             1. Đang phân tích ZIP
             2. Bản nháp đã sẵn sàng, chờ duyệt
             3. Đã tạo khóa học nhưng video còn đang tải lên
           Trường hợp 3 rất dễ bị bỏ sót: khóa học đã tồn tại nên nhìn qua tưởng
           xong rồi, nhưng các bài video vẫn chưa phát được. */
        const resumable = jobs.find(
          (j) =>
            isRunning(j.status) ||
            j.status === 'READY' ||
            (j.status === 'ACCEPTED' && isMediaRunning(j.mediaStatus))
        );
        if (!resumable) return;

        jobIdRef.current = resumable.jobId;
        setJob(resumable);

        if (resumable.status === 'ACCEPTED') {
          setStep('media');
          toast.info('Khóa học đã tạo xong, video vẫn đang được tải lên.');
          return;
        }

        if (resumable.status === 'READY') {
          await loadProposal(resumable.jobId);
        } else {
          setStep('processing');
        }
        toast.info('Đã khôi phục phiên nhập khóa học đang dở.');
      } catch {
        // Không sao — chỉ là tiện ích, người dùng vẫn tải tệp mới được.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadProposal]);

  /* --- Thăm dò tiến độ PHÂN TÍCH (bước 2) --- */
  useEffect(() => {
    if (step !== 'processing') return undefined;

    const tick = async () => {
      const jobId = jobIdRef.current;
      if (!jobId) return;

      try {
        const status = await getImportStatus(jobId);
        if (!isMountedRef.current) return;
        setJob(status);

        if (status.status === 'READY') {
          await loadProposal(jobId);
        } else if (status.status === 'FAILED') {
          setLoadError(status.statusMessage || 'Xử lý tệp thất bại.');
          setStep('upload');
          toast.error(status.statusMessage || 'Xử lý tệp thất bại.');
        } else if (status.status === 'CANCELLED') {
          setStep('upload');
        }
      } catch (error: any) {
        // Lỗi mạng thoáng qua thì bỏ qua, lần thăm dò sau sẽ thử lại.
        console.warn('[Import] Thăm dò thất bại:', error?.message);
      }
    };

    void tick();
    const timer = setInterval(tick, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [step, loadProposal]);

  /* --- Thăm dò tiến độ TẢI VIDEO (bước 4) ---
     Chu kỳ thưa hơn hẳn: một video có thể mất vài phút, hỏi mỗi 2 giây chỉ tạo
     lưu lượng vô ích. */
  useEffect(() => {
    if (step !== 'media') return undefined;

    const tick = async () => {
      const jobId = jobIdRef.current;
      if (!jobId) return;

      try {
        const status = await getImportStatus(jobId);
        if (!isMountedRef.current) return;
        setJob(status);
      } catch (error: any) {
        /* Bản ghi job hết hạn (404) sau khi mọi thứ đã xong là chuyện bình
           thường — không phải lỗi, chỉ đơn giản là hết việc để theo dõi. */
        console.warn('[Import] Thăm dò tải video thất bại:', error?.message);
      }
    };

    void tick();
    const timer = setInterval(tick, MEDIA_POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [step]);

  /* --- Chọn tệp --- */
  /* [THÊM 18/08/2026] Đọc giới hạn từ máy chủ một lần khi vào trang.
     Hỏng thì giữ nguyên FALLBACK_LIMITS — cố ý DÈ DẶT hơn thực tế, nên trường
     hợp xấu nhất là chặn oan một tệp mà máy chủ vẫn nhận, chứ không phải để
     lọt một tệp máy chủ sẽ từ chối sau vài phút tải. */
  useEffect(() => {
    let huy = false;
    getImportLimits()
      .then((l) => {
        if (!huy) setLimits(l);
      })
      .catch(() => {
        /* Im lặng: đây là tối ưu trải nghiệm, không phải chức năng cốt lõi.
           Báo lỗi đỏ chỉ vì không đọc được cấu hình sẽ làm người dùng hoang
           mang về một thứ họ không cần biết. */
      });
    return () => {
      huy = true;
    };
  }, []);

  /* [THÊM 18/08/2026] Kiểm tra kích thước NGAY LÚC CHỌN TỆP.

     ★ Trước đây không có phép kiểm tra nào ở đây. Giảng viên chọn tệp 1.62GB,
     trình duyệt lặng lẽ bắt đầu tải, và chỉ sau vài phút mới nhận về "Tệp quá
     lớn, tối đa 120MB" từ máy chủ. Vài phút chờ đợi đó hoàn toàn vô ích — và
     trên mạng chậm thì còn lâu hơn nhiều.

     Thông báo cũng phải nói ĐƯỢC PHẢI LÀM GÌ. "Tệp quá lớn" là đúng nhưng vô
     dụng: người đọc không biết vì sao lại là con số đó, và bước tiếp theo là gì. */
  const pickFile = (picked: File | null | undefined) => {
    if (!picked) return;

    if (!picked.name.toLowerCase().endsWith('.zip')) {
      toast.error('Chỉ nhận tệp .zip.');
      return;
    }

    const tranByte = limits.maxZipMb * 1024 * 1024;
    if (picked.size > tranByte) {
      setFile(null);
      setLoadError(
        `Tệp ${formatBytes(picked.size)} vượt quá giới hạn ${limits.maxZipMb}MB. ` +
          'Tệp ZIP chỉ nên chứa tài liệu và phụ đề — hãy bỏ video ra ngoài. ' +
          'Video được gắn ở bước cuối, tải thẳng lên hoặc dán link YouTube. ' +
          'Xem phần hướng dẫn bên dưới để tạo tệp ZIP nhẹ chỉ bằng một lệnh.'
      );
      toast.error(`Tệp quá lớn (${formatBytes(picked.size)}). Xem hướng dẫn bên dưới.`);
      return;
    }

    setFile(picked);
    setLoadError(null);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    pickFile(event.dataTransfer.files?.[0]);
  };

  /* --- Tải lên --- */
  const handleUpload = async () => {
    if (!file || isUploading) return;

    setIsUploading(true);
    setUploadPercent(0);
    setLoadError(null);

    try {
      const created = await uploadImportZip(file, setUploadPercent);
      if (!isMountedRef.current) return;

      jobIdRef.current = created.jobId;
      setJob(created);
      setStep('processing');
      toast.success('Đã tải tệp lên. Hệ thống đang phân tích...');
    } catch (error: any) {
      if (!isMountedRef.current) return;
      const message = error?.message || 'Tải tệp thất bại.';
      setLoadError(message);
      toast.error(message);
    } finally {
      if (isMountedRef.current) setIsUploading(false);
    }
  };

  /* --- Hủy --- */
  const handleCancel = async () => {
    const jobId = jobIdRef.current;
    if (!jobId) return;

    try {
      await cancelImport(jobId);
      toast.success('Đã hủy và dọn dẹp tệp tạm trên máy chủ.');
    } catch (error: any) {
      toast.error(error?.message || 'Không hủy được.');
    } finally {
      jobIdRef.current = null;
      setJob(null);
      setProposal(null);
      setFile(null);
      setUploadPercent(0);
      setStep('upload');
    }
  };

  /* Sau khi tạo khóa học: nếu có video thì Ở LẠI xem tiến độ tải lên.
     Chuyển thẳng sang trang danh sách sẽ khiến giảng viên mở khóa học ra thấy
     các bài video KHÔNG PHÁT ĐƯỢC (vì chưa tải xong) và tưởng là lỗi. */
  const handleAccepted = (result: AcceptImportResult) => {
    toast.success(`Đã tạo khóa học nháp #${result.courseId}!`);
    setProposal(null); // Bản nháp đã dùng xong, giải phóng bộ nhớ
    setCreatedCourseId(result.courseId);

    const canGanVideo = result.lessonsNeedingVideo ?? [];

    /* [SỬA 18/08/2026] Ba nhánh, theo đúng thứ tự ưu tiên:

       1. Có bài chờ gắn video → sang bước 4. Đây là đường đi MẶC ĐỊNH từ nay,
          vì video không còn được giải nén ra máy chủ.
       2. Máy chủ đang tải gì đó (bản nháp cũ còn video trên đĩa, hoặc chỉ có
          phụ đề) → ở lại xem tiến độ.
       3. Không có gì để làm → rời trang.

       Nhánh 2 giữ lại có chủ đích: những job tạo TRƯỚC lần đổi này vẫn còn
       video trên đĩa và phải chạy hết đường cũ, nếu không giảng viên mở khóa
       học ra sẽ thấy bài video không phát được. */
    if (canGanVideo.length > 0) {
      setLessonsNeedingVideo(canGanVideo);
      setStep('attach-video');
      return;
    }

    if (result.videosPendingUpload > 0) {
      setStep('media');
      return;
    }

    jobIdRef.current = null;
    navigate('/instructor/courses');
  };

  const finishAndLeave = () => {
    jobIdRef.current = null;
    navigate('/instructor/courses');
  };

  /* ───────────────────────────── Giao diện ───────────────────────────── */

  return (
    <InstructorLayout pageTitle='Nhập khóa học từ tệp ZIP'>
      <PageHeader
        title='Nhập khóa học từ tệp ZIP'
        description='Tải lên tệp ZIP chứa tài liệu và phụ đề. Hệ thống dựng cấu trúc chương–bài từ cây thư mục, đọc nội dung tài liệu, ghép phụ đề rồi đưa bản nháp cho bạn duyệt. Video được gắn ở bước cuối. Không có gì vào cơ sở dữ liệu trước khi bạn bấm đồng ý.'
      />

      <div className='space-y-6'>
        <StepBar current={step} />

        {loadError && (
          <div className='flex items-start gap-3 rounded-xl border border-border bg-danger-soft p-4 text-sm text-danger'>
            <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0' aria-hidden='true' />
            <span>{loadError}</span>
          </div>
        )}

        {/* ── BƯỚC 1: TẢI LÊN ── */}
        {step === 'upload' && (
          <div className='space-y-5'>
            {/* [THÊM 18/08/2026] Hướng dẫn đặt NGAY TRÊN khung kéo–thả.
                Tự mở sẵn khi vừa có lỗi (thường là "tệp quá lớn") — đó đúng là
                lúc giảng viên cần đọc nó nhất. */}
            <ZipGuidePanel limits={limits} defaultOpen={Boolean(loadError)} />
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={[
                'cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors sm:p-14',
                isDragging
                  ? 'border-primary bg-accent'
                  : 'border-border bg-card hover:border-primary hover:bg-accent',
              ].join(' ')}
            >
              <input
                ref={fileInputRef}
                type='file'
                accept='.zip,application/zip'
                className='hidden'
                onChange={(e) => pickFile(e.target.files?.[0])}
              />

              <div className='mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground'>
                <Archive className='h-8 w-8' aria-hidden='true' />
              </div>

              {file ? (
                <>
                  <p className='text-base font-medium'>{file.name}</p>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {formatBytes(file.size)} — bấm để chọn tệp khác
                  </p>
                </>
              ) : (
                <>
                  <p className='text-base font-medium'>
                    Kéo thả tệp .zip vào đây
                  </p>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    hoặc bấm để chọn từ máy tính
                  </p>
                </>
              )}
            </div>

            {isUploading && (
              <div className='space-y-2 rounded-xl border border-border bg-card p-5'>
                <div className='flex items-center justify-between text-sm font-medium'>
                  <span className='flex items-center gap-2'>
                    <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' aria-hidden='true' />
                    Đang tải lên...
                  </span>
                  <span className='tabular-nums'>{uploadPercent}%</span>
                </div>
                <Progress value={uploadPercent} className='h-2' />
              </div>
            )}

            <div className='flex justify-end'>
              <Button disabled={!file || isUploading} onClick={handleUpload}>
                <Upload className='mr-2 h-4 w-4' aria-hidden='true' />
                Tải lên & phân tích
              </Button>
            </div>

            <StructureGuide />
          </div>
        )}

        {/* ── BƯỚC 2: XỬ LÝ ── */}
        {step === 'processing' && (
          <SectionCard bodyClassName='space-y-6 p-8 text-center sm:p-12'>
            <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground'>
              <Wand className='h-8 w-8' aria-hidden='true' />
            </div>

            <div className='space-y-2'>
              <h2 className='text-lg font-semibold'>Đang phân tích tệp của bạn</h2>
              <p className='text-sm text-muted-foreground'>
                {job?.statusMessage || 'Đang chuẩn bị...'}
              </p>
            </div>

            <div className='mx-auto max-w-md space-y-2'>
              <Progress value={job?.progress ?? 0} className='h-2.5' />
              <p className='text-right text-xs tabular-nums text-muted-foreground'>
                {job?.progress ?? 0}%
              </p>
            </div>

            <p className='text-xs text-muted-foreground'>
              Bạn có thể rời trang này — tiến trình vẫn chạy trên máy chủ và sẽ
              được khôi phục khi bạn quay lại.
            </p>

            <Button variant='outline' onClick={handleCancel}>
              <X className='mr-2 h-4 w-4' aria-hidden='true' />
              Hủy phiên nhập
            </Button>
          </SectionCard>
        )}

        {/* ── BƯỚC 3: DUYỆT ── */}
        {step === 'review' && proposal && job && (
          <ImportReviewPanel
            jobId={job.jobId}
            proposal={proposal}
            onAccepted={handleAccepted}
            onCancel={handleCancel}
          />
        )}

        {/* ── BƯỚC 4: TẢI VIDEO LÊN ── */}
        {step === 'attach-video' && createdCourseId && (
          <VideoAttachPanel
            lessons={lessonsNeedingVideo}
            limits={limits}
            onFinish={finishAndLeave}
          />
        )}

        {step === 'media' && <MediaUploadPanel job={job} onDone={finishAndLeave} />}
      </div>
    </InstructorLayout>
  );
};

export default CourseImport;
