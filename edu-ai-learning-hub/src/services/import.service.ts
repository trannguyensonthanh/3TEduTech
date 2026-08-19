/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/import.service.ts
// [THÊM 18/08/2026 — COURSE IMPORT, Giai đoạn A]
//
// Tầng gọi API cho tính năng "Nhập khóa học từ tệp ZIP".
//
// ─────────────────────────────────────────────────────────────────────────────
// ⚠️ VÌ SAO TẢI TỆP KHÔNG DÙNG apiHelper.post
//
// `apiHelper.post` luôn chạy `JSON.stringify(body)` — đưa FormData vào đó sẽ ra
// chuỗi "{}" và máy chủ nhận được một request rỗng, KHÔNG hề báo lỗi. Đây là
// loại lỗi mất nhiều thời gian nhất để tìm ra.
//
// Ngoài ra ở đây dùng XMLHttpRequest chứ không dùng `fetch`: `fetch` KHÔNG có
// cách nào theo dõi tiến độ TẢI LÊN. Với tệp ZIP hơn trăm MB, một thanh tiến độ
// đứng im là trải nghiệm rất tệ — người dùng tưởng treo và bấm lại.

import apiHelper from './apiHelper';
import TokenService from './token.service';

const API_BASE_URL: string =
  import.meta.env.VITE_API_URL ||
  `http://${window.location.hostname}:5000/v1`;

/* ───────────────────────────── Kiểu dữ liệu ───────────────────────────── */

export type ImportStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'READY'
  | 'ACCEPTED'
  | 'FAILED'
  | 'CANCELLED';

/**
 * Trạng thái tải video lên Cloudinary — chỉ có ý nghĩa SAU khi đã chấp nhận
 * bản nháp. Tách khỏi `ImportStatus` vì đây là một vòng đời riêng: khóa học đã
 * tồn tại và dùng được rồi, việc tải video chạy nền phía sau.
 */
export type MediaStatus =
  | 'QUEUED'
  | 'UPLOADING'
  | 'DONE'
  | 'PARTIAL'
  | 'SKIPPED'
  | 'FAILED';

/** Bản rút gọn — dùng cho danh sách và thăm dò tiến độ. */
export interface ImportJobSummary {
  jobId: string;
  sourceName: string;
  sizeBytes: number;
  status: ImportStatus;
  progress: number;
  statusMessage?: string;
  errorCode?: string;
  hasProposal: boolean;
  totalSections: number;
  totalLessons: number;
  resultCourseId?: number;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;

  // --- Tải video lên Cloudinary (chỉ xuất hiện sau khi đã chấp nhận) ---
  mediaStatus?: MediaStatus;
  mediaTotal?: number;
  mediaDone?: number;
  mediaFailed?: number;
  mediaMessage?: string;
}

/** Một câu trắc nghiệm do AI soạn (Giai đoạn D). */
export interface ProposedQuizQuestion {
  question: string;
  options: string[];
  /** Chỉ số đáp án đúng trong `options`, đếm từ 0. */
  correctIndex: number;
  explanation: string;
}

export interface ProposedLesson {
  order: number | null;
  label: string;
  lessonName: string;
  lessonType: 'VIDEO' | 'TEXT';
  /** Đường dẫn TƯƠNG ĐỐI bên trong ZIP. Dùng làm khóa đối chiếu khi gửi lại. */
  sourcePath: string;
  sizeBytes: number;
  fileKind: string;
  ext: string;
  subtitlePath: string | null;
  /** Máy chủ luôn gửi kèm; để tùy chọn cho chắc nếu bản nháp cũ còn trong Redis. */
  hasSubtitle?: boolean;
  /* [THÊM 18/08/2026] Bài học video đang CHỜ giảng viên gắn nguồn.
     Từ nay nội dung video KHÔNG được giải nén ra máy chủ — hệ thống chỉ đọc tên
     và kích thước từ thư mục trung tâm của tệp ZIP. Video được gắn ở bước 4:
     tải thẳng từ trình duyệt lên Cloudinary, hoặc dán link YouTube.
     Để tùy chọn vì bản nháp cũ còn trong Redis sẽ không có trường này. */
  needsVideo?: boolean;
  /** Tên tệp video gốc trong ZIP — dùng để khớp tự động ở bước 4. */
  videoFileName?: string | null;
  /** Ước tính theo kích thước tệp. Chỉ để hiển thị, KHÔNG ghi vào CSDL. */
  estimatedDurationSeconds?: number | null;
  durationSeconds: number | null;
  textContent: string | null;
  textSource?: 'node' | 'ai-service' | 'skipped';
  extractError?: string;
  extractWarning?: string;
  description?: string | null;
  /** Chỉ có sau khi bấm "Tạo câu hỏi trắc nghiệm". */
  quizQuestions?: ProposedQuizQuestion[];
  selected: boolean;
  lessonOrder: number;
}

export interface ProposedSection {
  sourceDir: string;
  sectionName: string;
  description: string | null;
  sectionOrder: number;
  lessons: ProposedLesson[];
}

export interface ImportProposal {
  courseName: string;
  courseDescription?: string | null;
  /** Mô tả ngắn do AI viết (Giai đoạn B). Chỉ có sau khi đã bấm "Dùng AI". */
  courseShortDescription?: string | null;
  sections: ProposedSection[];
  /** 0..1 — độ tin cậy của việc đoán cấu trúc từ cây thư mục. */
  confidence: number;
  confidenceDetail?: Record<string, any>;
  needsAiGrouping: boolean;
  stats: {
    totalLessons: number;
    totalSections: number;
    videoCount: number;
    subtitleMatched: number;
  };
}

/** Thân request khi bấm "Tạo khóa học". */
export interface AcceptImportPayload {
  courseName: string;
  categoryId: number;
  levelId: number;
  shortDescription?: string | null;
  fullDescription?: string | null;
  requirements?: string | null;
  learningOutcomes?: string | null;
  language?: string;
  originalPrice?: number;
  discountedPrice?: number | null;
  /** Có tạo kèm câu hỏi trắc nghiệm do AI soạn không. Mặc định false. */
  includeQuiz?: boolean;
  sections?: Array<{
    sourceDir: string;
    sectionName?: string;
    description?: string | null;
    selected?: boolean;
    lessons?: Array<{
      sourcePath: string;
      lessonName?: string;
      description?: string | null;
      selected?: boolean;
    }>;
  }>;
}

/**
 * Một bài học đang chờ giảng viên gắn nguồn video (bước 4).
 * [THÊM 18/08/2026]
 */
export interface LessonNeedingVideo {
  lessonId: number;
  lessonName: string;
  /** Đường dẫn trong ZIP — chỉ để hiển thị cho giảng viên dễ đối chiếu. */
  sourcePath: string;
  /** Tên tệp video gốc. Dùng để KHỚP TỰ ĐỘNG khi chọn một lượt nhiều tệp. */
  videoFileName: string | null;
  sizeBytes: number | null;
  estimatedDurationSeconds: number | null;
  hasSubtitle: boolean;
}

export interface AcceptImportResult {
  courseId: number;
  totalSections: number;
  totalLessons: number;
  totalQuestions: number;
  videosPendingUpload: number;
  /** [THÊM 18/08/2026] Đầu vào cho bước 4. Rỗng = không có bài nào cần video. */
  lessonsNeedingVideo?: LessonNeedingVideo[];
}

/**
 * Giới hạn tải lên, ĐỌC TỪ MÁY CHỦ.
 * [THÊM 18/08/2026]
 *
 * ⚠️ Đừng ghi cứng những con số này ở phía giao diện. Chúng khác nhau giữa dev
 * và production và được đặt trong docker-compose — ghi cứng là chắc chắn có
 * ngày lệch, và triệu chứng sẽ là "giao diện bảo được phép nhưng máy chủ từ
 * chối" (hoặc tệ hơn: giao diện chặn oan một tệp máy chủ vẫn nhận).
 */
export interface ImportLimits {
  maxZipMb: number;
  maxTotalMb: number;
  maxFileMb: number;
  maxFiles: number;
  /** Trần của Cloudinary gói miễn phí cho MỘT tệp video. */
  maxVideoUploadMb: number;
  /** Ví dụ ['.mp4', '.mkv', ...] */
  videoExtensions: string[];
}

/** Giá trị dùng tạm khi chưa gọi được máy chủ — cố ý DÈ DẶT hơn thực tế. */
export const FALLBACK_LIMITS: ImportLimits = {
  maxZipMb: 200,
  maxTotalMb: 500,
  maxFileMb: 200,
  maxFiles: 1000,
  maxVideoUploadMb: 100,
  videoExtensions: ['.mp4', '.m4v', '.mov', '.mkv', '.webm', '.avi', '.wmv', '.flv'],
};

/** GET /v1/imports/limits */
export const getImportLimits = async (): Promise<ImportLimits> => {
  const res = await apiHelper.get('/imports/limits');
  /* Máy chủ trả thẳng đối tượng (không bọc trong `data`). Hợp nhất với
     FALLBACK để một trường thiếu không làm giao diện hiện `undefined MB`. */
  return { ...FALLBACK_LIMITS, ...(res || {}) };
};

/* ───────────────────────────── Các lời gọi API ───────────────────────────── */

/**
 * Tải tệp ZIP lên và tạo phiên nhập.
 *
 * @param onProgress Nhận phần trăm 0..100 của quá trình TẢI LÊN (chưa phải
 *                   quá trình xử lý — đó là giai đoạn sau, theo dõi bằng
 *                   `getImportStatus`).
 */
export const uploadImportZip = async (
  file: File,
  onProgress?: (percent: number) => void
): Promise<ImportJobSummary> => {
  
  // [FIX 19/08/2026] XMLHttpRequest không tự động kích hoạt logic refresh token
  // như fetchWithAuth (bên trong apiHelper). Do đó, nếu token đã hết hạn, tải
  // tệp sẽ thất bại bằng lỗi 401. Ta gọi một API nhẹ trước để `apiHelper` tự 
  // làm mới token nếu cần, sau đó mới dùng XHR.
  try {
    await apiHelper.get('/users/me');
  } catch (error) {
    console.warn('Lỗi kiểm tra token trước khi tải tệp:', error);
    // Bỏ qua lỗi, để XHR tự báo lỗi xác thực nếu token thực sự hỏng
  }

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    // Tên field PHẢI là 'file' — khớp với `uploadZip.single('file')` ở backend.
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}/imports`);

    const token = TokenService.getLocalAccessToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Accept', 'application/json');
    // ⚠️ KHÔNG tự đặt Content-Type. Trình duyệt phải tự sinh ra
    // 'multipart/form-data; boundary=...' — đặt tay là mất `boundary` và
    // multer phía máy chủ sẽ không tách được tệp ra khỏi thân request.

    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let body: any = {};
      try {
        body = JSON.parse(xhr.responseText || '{}');
      } catch {
        body = {};
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body as ImportJobSummary);
      } else {
        reject(
          new Error(
            body.message ||
              `Tải tệp thất bại (mã ${xhr.status}). Vui lòng thử lại.`
          )
        );
      }
    };

    xhr.onerror = () =>
      reject(new Error('Không kết nối được tới máy chủ. Kiểm tra lại mạng.'));
    xhr.onabort = () => reject(new Error('Đã hủy tải tệp.'));
    xhr.ontimeout = () => reject(new Error('Tải tệp quá lâu, đã quá hạn chờ.'));

    xhr.send(formData);
  });
};

/** Trạng thái + tiến độ xử lý. Dùng để thăm dò theo chu kỳ. */
export const getImportStatus = (jobId: string): Promise<ImportJobSummary> =>
  apiHelper.get(`/imports/${jobId}`);

/** Bản nháp đầy đủ — chỉ gọi được khi trạng thái đã là READY. */
export const getImportProposal = (jobId: string): Promise<ImportProposal> =>
  apiHelper.get(`/imports/${jobId}/proposal`);

/** Danh sách các phiên nhập của tôi. */
export const listMyImports = (): Promise<{
  jobs: ImportJobSummary[];
  total: number;
}> => apiHelper.get('/imports');

/** Kết quả của lượt nhờ AI viết mô tả. */
export interface EnrichResult {
  /** Bản nháp ĐÃ được điền mô tả — dùng để trộn vào trạng thái đang sửa. */
  proposal: ImportProposal;
  shortDescription: string | null;
  sectionsWritten: number;
  lessonsWritten: number;
  provider: string | null;
  warnings: string[];
}

/**
 * Nhờ AI viết mô tả cho bản nháp.
 *
 * ⚠️ Lượt gọi này TIÊU TOKEN THẬT của hạn mức Gemini/Qwen, nên giao diện phải
 * để giảng viên chủ động bấm chứ không tự chạy. Máy chủ cũng giới hạn 10
 * lần/giờ.
 *
 * Có thể mất tới ~3 phút với khóa học lớn (Qwen trên GPU T4 không nhanh), nên
 * đừng đặt thời gian chờ ngắn ở phía gọi.
 */
export const enrichImport = (jobId: string): Promise<EnrichResult> =>
  apiHelper.post(`/imports/${jobId}/enrich`, {});

export interface QuizResult {
  proposal: ImportProposal;
  totalQuestions: number;
  lessonsWithQuiz: number;
  provider: string | null;
  warnings: string[];
}

/**
 * Nhờ AI soạn câu hỏi trắc nghiệm.
 *
 * Chỉ ra đề cho bài học CÓ NỘI DUNG VĂN BẢN (PDF, DOCX, TXT...). Bài video chưa
 * có phụ đề sẽ bị bỏ qua — máy chủ lọc trước khi gọi AI để khỏi tốn token cho
 * việc chắc chắn không ra kết quả.
 */
export const generateQuiz = (
  jobId: string,
  questionsPerLesson = 3
): Promise<QuizResult> =>
  apiHelper.post(`/imports/${jobId}/quiz`, { questionsPerLesson });

/** Chốt bản nháp → tạo khóa học DRAFT. */
export const acceptImport = (
  jobId: string,
  payload: AcceptImportPayload
): Promise<AcceptImportResult> =>
  apiHelper.post(`/imports/${jobId}/accept`, payload);

/** Hủy phiên nhập và xóa thư mục tạm trên máy chủ. */
export const cancelImport = (jobId: string): Promise<{ cancelled: boolean }> =>
  apiHelper.delete(`/imports/${jobId}`);

/* ───────────────────────────── Tiện ích hiển thị ───────────────────────── */

export const formatBytes = (bytes: number): string => {
  if (!bytes || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

export const formatDuration = (seconds: number | null): string => {
  if (seconds === null || seconds === undefined || seconds <= 0) return '--:--';
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const two = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${two(m)}:${two(s)}` : `${m}:${two(s)}`;
};

/** Trạng thái nào là "đang chạy" — để biết có cần thăm dò tiếp không. */
export const isRunning = (status: ImportStatus): boolean =>
  status === 'PENDING' || status === 'PROCESSING';

/** Việc tải video còn đang chạy không. */
export const isMediaRunning = (status?: MediaStatus): boolean =>
  status === 'QUEUED' || status === 'UPLOADING';

export default {
  uploadImportZip,
  getImportStatus,
  getImportProposal,
  listMyImports,
  enrichImport,
  generateQuiz,
  acceptImport,
  cancelImport,
};
