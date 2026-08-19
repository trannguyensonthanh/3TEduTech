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
import { Icons } from '@/components/common/Icons';
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

/* Lưu thẳng COMPONENT chứ không lưu tên khóa của `Icons`.
   Nếu lưu tên khóa rồi tra `Icons[key]`, TypeScript phải suy ra kiểu là HỢP của
   toàn bộ icon trong bộ — chỉ cần một icon trong đó có props khác biệt là cả
   chỗ này báo lỗi biên dịch, dù ta không hề dùng tới nó. */
type IconComponent = React.ComponentType<{ className?: string }>;

const STEPS: Array<{ key: Step; label: string; Icon: IconComponent }> = [
  { key: 'upload', label: 'Tải tệp ZIP', Icon: Icons.upload },
  { key: 'processing', label: 'Hệ thống phân tích', Icon: Icons.wand },
  { key: 'review', label: 'Bạn duyệt & tạo', Icon: Icons.listChecks },
  { key: 'attach-video', label: 'Gắn video', Icon: Icons.video },
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
                  'flex h-11 w-11 items-center justify-center rounded-2xl border transition-all duration-300',
                  isActive
                    ? 'border-indigo-400/50 bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 scale-110'
                    : isDone
                      ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-400'
                      : 'border-border/60 bg-muted/40 text-muted-foreground',
                ].join(' ')}
              >
                {isDone ? (
                  <Icons.check className='h-5 w-5 stroke-[3]' />
                ) : (
                  <Icon
                    className={`h-5 w-5 ${isActive ? 'animate-pulse' : ''}`}
                  />
                )}
              </div>
              <span
                className={`text-[11px] font-semibold sm:text-xs ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>

            {index < STEPS.length - 1 && (
              <div
                className={`mb-6 h-0.5 w-8 rounded-full sm:w-16 ${
                  index < currentIndex ? 'bg-emerald-400/60' : 'bg-border/60'
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
    <div className='rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm'>
      <button
        type='button'
        onClick={() => setOpen((v) => !v)}
        className='flex w-full items-center justify-between gap-3 px-5 py-4 text-left'
      >
        <span className='flex items-center gap-2.5 text-sm font-semibold'>
          <Icons.lightbulb className='h-4 w-4 text-amber-400' />
          Nên sắp xếp tệp ZIP như thế nào?
        </span>
        {open ? (
          <Icons.chevronUp className='h-4 w-4 text-muted-foreground' />
        ) : (
          <Icons.chevronDown className='h-4 w-4 text-muted-foreground' />
        )}
      </button>

      {open && (
        <div className='space-y-4 border-t border-border/50 px-5 py-4 text-sm'>
          <p className='text-muted-foreground'>
            Hệ thống đoán cấu trúc từ <strong>tên thư mục và tên tệp</strong> —
            hoàn toàn không tốn token AI. Đặt tên càng gọn gàng thì bản nháp
            càng chính xác:
          </p>

          <pre className='overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-relaxed text-slate-300'>
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
      ? { icon: Icons.checkCircle2, color: 'from-emerald-500 to-teal-600', title: 'Hoàn tất!' }
      : status === 'PARTIAL'
        ? { icon: Icons.alertTriangle, color: 'from-amber-500 to-orange-600', title: 'Xong, nhưng có vài video lỗi' }
        : status === 'SKIPPED'
          ? { icon: Icons.info, color: 'from-sky-500 to-cyan-600', title: 'Đã bỏ qua bước tải video' }
          : status === 'FAILED'
            ? { icon: Icons.xCircle, color: 'from-rose-500 to-red-600', title: 'Tải video thất bại' }
            : { icon: Icons.video, color: 'from-indigo-500 via-purple-600 to-fuchsia-600', title: 'Đang tải video lên' };

  const ToneIcon = tone.icon;

  return (
    <div className='space-y-6 rounded-3xl border border-border/60 bg-card/60 p-8 text-center backdrop-blur-sm sm:p-12'>
      <div
        className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${tone.color} shadow-xl shadow-purple-500/25`}
      >
        <ToneIcon className={`h-9 w-9 text-white ${running ? 'animate-pulse' : ''}`} />
      </div>

      <div className='space-y-2'>
        <h2 className='text-xl font-bold'>{tone.title}</h2>
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
                <span className='ml-2 text-amber-400'>({failed} lỗi)</span>
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

      <Button
        onClick={onDone}
        variant={running ? 'outline' : 'default'}
        className={
          running
            ? 'rounded-xl'
            : 'h-11 rounded-xl border border-white/20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 font-extrabold text-white shadow-xl shadow-purple-500/30 hover:-translate-y-0.5'
        }
      >
        {running ? (
          <>
            <Icons.arrowRight className='mr-2 h-4 w-4' />
            Để chạy nền, về danh sách khóa học
          </>
        ) : (
          <>
            <Icons.arrowRight className='mr-2 h-4 w-4' />
            Về danh sách khóa học
          </>
        )}
      </Button>
    </div>
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
    <InstructorLayout>
      <div className='mx-auto max-w-6xl space-y-7 p-4 md:p-6 lg:p-8'>
        {/* BANNER */}
        <header className='relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 shadow-2xl sm:p-8'>
          <div className='pointer-events-none absolute -bottom-14 -right-10 h-72 w-72 animate-pulse rounded-full bg-fuchsia-500/20 blur-3xl' />
          <div className='pointer-events-none absolute -top-14 left-10 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl' />

          <div className='relative z-10 space-y-2.5'>
            <div className='inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/20 px-3.5 py-1 text-xs font-bold text-indigo-300 shadow-inner backdrop-blur-md'>
              <Icons.packageOpen className='h-3.5 w-3.5 animate-pulse text-pink-400' />
              <span className='uppercase tracking-wider'>Course Import</span>
            </div>

            <h1 className='font-outfit text-3xl font-extrabold tracking-tight text-white md:text-4xl'>
              Nhập khóa học từ{' '}
              <span className='bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-300 bg-clip-text font-black text-transparent'>
                tệp ZIP
              </span>
            </h1>

            <p className='max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base'>
              Tải lên một tệp ZIP chứa tài liệu và phụ đề của khóa học. Hệ
              thống tự dựng cấu trúc chương–bài từ cây thư mục, đọc nội dung tài
              liệu, ghép phụ đề — rồi đưa bản nháp cho bạn duyệt. Video được gắn
              ở bước cuối, tải thẳng từ máy bạn hoặc dán link YouTube. Không có
              gì vào cơ sở dữ liệu trước khi bạn bấm đồng ý.
            </p>
          </div>
        </header>

        <StepBar current={step} />

        {loadError && (
          <div className='flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300'>
            <Icons.alertTriangle className='mt-0.5 h-4 w-4 shrink-0' />
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
                'group cursor-pointer rounded-3xl border-2 border-dashed p-10 text-center transition-all duration-300 sm:p-14',
                isDragging
                  ? 'scale-[1.01] border-indigo-400 bg-indigo-500/10'
                  : 'border-border/70 bg-card/50 hover:border-indigo-400/60 hover:bg-indigo-500/5',
              ].join(' ')}
            >
              <input
                ref={fileInputRef}
                type='file'
                accept='.zip,application/zip'
                className='hidden'
                onChange={(e) => pickFile(e.target.files?.[0])}
              />

              <div className='mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-600 to-fuchsia-600 shadow-xl shadow-purple-500/30 transition-transform duration-300 group-hover:scale-105'>
                <Icons.archive className='h-9 w-9 text-white' />
              </div>

              {file ? (
                <>
                  <p className='text-lg font-bold'>{file.name}</p>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {formatBytes(file.size)} — bấm để chọn tệp khác
                  </p>
                </>
              ) : (
                <>
                  <p className='text-lg font-bold'>
                    Kéo thả tệp .zip vào đây
                  </p>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    hoặc bấm để chọn từ máy tính
                  </p>
                </>
              )}
            </div>

            {isUploading && (
              <div className='space-y-2 rounded-2xl border border-border/60 bg-card/60 p-5'>
                <div className='flex items-center justify-between text-sm font-medium'>
                  <span className='flex items-center gap-2'>
                    <Icons.loader2 className='h-4 w-4 animate-spin text-indigo-400' />
                    Đang tải lên...
                  </span>
                  <span className='tabular-nums'>{uploadPercent}%</span>
                </div>
                <Progress value={uploadPercent} className='h-2' />
              </div>
            )}

            <div className='flex justify-end'>
              <Button
                size='lg'
                disabled={!file || isUploading}
                onClick={handleUpload}
                className='h-12 rounded-2xl border border-white/20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-7 font-extrabold text-white shadow-xl shadow-purple-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 disabled:translate-y-0 disabled:opacity-50'
              >
                <Icons.upload className='mr-2 h-5 w-5 stroke-[3]' />
                Tải lên & phân tích
              </Button>
            </div>

            <StructureGuide />
          </div>
        )}

        {/* ── BƯỚC 2: XỬ LÝ ── */}
        {step === 'processing' && (
          <div className='space-y-6 rounded-3xl border border-border/60 bg-card/60 p-8 text-center backdrop-blur-sm sm:p-12'>
            <div className='mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-600 to-fuchsia-600 shadow-xl shadow-purple-500/30'>
              <Icons.wand className='h-9 w-9 animate-pulse text-white' />
            </div>

            <div className='space-y-2'>
              <h2 className='text-xl font-bold'>Đang phân tích tệp của bạn</h2>
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

            <Button
              variant='outline'
              onClick={handleCancel}
              className='rounded-xl'
            >
              <Icons.x className='mr-2 h-4 w-4' />
              Hủy phiên nhập
            </Button>
          </div>
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
