// src/services/lesson.service.ts

import { Subtitle } from '@/services/subtitle.service';
import apiHelper, { fetchWithAuth } from './apiHelper'; // Import fetchWithAuth nếu cần cho upload
import { QuizQuestion } from '@/services/quiz.service';

export type IsoDateTimeString = string; // Dùng cho DATETIME2
export type IsoDateString = string; // Dùng cho DATE

export type LessonType = 'VIDEO' | 'TEXT' | 'QUIZ';
export type VideoSourceType = 'CLOUDINARY' | 'YOUTUBE' | 'VIMEO';

export interface Lesson {
  lessonId?: number | string; // Hoặc string nếu API trả về string
  tempId?: string | number; // FE temp ID khi tạo mới
  sectionId?: number; // Hoặc string
  lessonName: string;
  description?: string | null;
  lessonOrder?: number;
  lessonType?: LessonType;
  videoSourceType?: VideoSourceType | null;
  externalVideoInput?: string | null; // URL từ YT/Vimeo
  externalVideoId?: string | null; // ID từ YT/Vimeo HOẶC Public ID từ Cloudinary
  thumbnailUrl?: string | null;
  videoDurationSeconds?: number | null;
  textContent?: string | null; // Cho lesson type TEXT
  isFreePreview: boolean;
  originalId?: number | null; // Cho việc sao chép khóa học
  createdAt?: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
  // --- Dữ liệu lồng nhau (quan trọng cho FE state) ---
  subtitles?: Subtitle[];
  questions?: QuizQuestion[];
  attachments?: Attachment[];
  // --- Thuộc tính chỉ dùng ở FE khi tạo/sửa ---
  lessonVideoFile?: File | null; // File object khi upload lên Cloudinary
  // externalVideoInput?: string | null; // Có thể dùng làm trường nhập liệu cho YT/Vimeo URL/ID
}

export interface Attachment {
  attachmentId?: number;
  tempId?: string | number; // FE temp ID
  lessonId: number; // Hoặc string
  fileName: string;
  fileUrl: string; // URL công khai để tải/hiển thị
  fileType?: string | null;
  fileSize?: number | null; // bytes
  cloudStorageId?: string | null; // Để backend xóa nếu cần
  uploadedAt?: IsoDateTimeString;
  // --- Thuộc tính chỉ dùng ở FE khi upload ---
  file?: File | null; // File object thực tế khi upload
}

export interface LessonListData {
  lessons: Lesson[];
}

export interface CreateLessonData {
  // sectionId lấy từ URL
  lessonName: string;
  lessonType: 'VIDEO' | 'TEXT' | 'QUIZ';
  description?: string;
  videoUrl?: string; // Có thể ko cần nếu upload sau
  externalVideoId?: string;
  thumbnailUrl?: string;
  videoSourceType?: 'YOUTUBE' | 'VIMEO' | 'CLOUDINARY'; // Nếu có
  externalVideoInput?: string; // Nếu có
  videoDurationSeconds?: number;
  textContent?: string;
  isFreePreview?: boolean;
}

export interface UpdateLessonData {
  lessonName?: string;
  description?: string;
  lessonType?: 'VIDEO' | 'TEXT' | 'QUIZ';
  videoUrl?: string | null; // Cho phép null để xóa link
  externalVideoId?: string | null;
  thumbnailUrl?: string | null;
  videoDurationSeconds?: number | null;
  textContent?: string | null;
  isFreePreview?: boolean;
}

export interface LessonOrderData {
  id: number; // LessonID
  order: number;
}

// --- Lesson APIs ---

/** Lấy danh sách lessons của section */
export const getLessons = async (
  courseId: number,
  sectionId: number
): Promise<LessonListData> => {
  // API này thường không gọi riêng lẻ
  return apiHelper.get(`/courses/${courseId}/sections/${sectionId}/lessons`);
};

/** Tạo lesson mới */
export const createLesson = async (
  courseId: number,
  sectionId: number,
  data: CreateLessonData
): Promise<Lesson> => {
  return apiHelper.post(
    `/courses/${courseId}/sections/${sectionId}/lessons`,
    data
  );
};

/** Cập nhật thứ tự lessons */
export const updateLessonsOrder = async (
  courseId: number,
  sectionId: number,
  lessonOrders: LessonOrderData[]
): Promise<LessonListData> => {
  // Giả sử API nhận mảng trực tiếp
  return apiHelper.patch(
    `/courses/${courseId}/sections/${sectionId}/lessons/order`,
    lessonOrders
  );
};

/** Lấy chi tiết lesson */
export const getLessonById = async (lessonId: number): Promise<Lesson> => {
  // API này dùng ID lesson trực tiếp
  return apiHelper.get(`/lessons/${lessonId}`);
};

/** Cập nhật lesson */
export const updateLesson = async (
  lessonId: number,
  data: UpdateLessonData
): Promise<Lesson> => {
  return apiHelper.patch(`/lessons/${lessonId}`, data);
};

/* ============================================================================
 * [THÊM 18/08/2026] Gắn video YouTube cho một bài học
 *
 * Dùng ở bước 4 của luồng nhập khóa học từ ZIP, cho những video quá nặng để
 * tải lên Cloudinary (gói miễn phí chặn ở 100MB mỗi tệp).
 *
 * ★ KHÔNG cần endpoint mới. `PATCH /lessons/:id` đã xử lý sẵn toàn bộ:
 *   - `extractYoutubeId()` lấy videoId từ đủ mọi dạng link (youtu.be/xxx,
 *     watch?v=xxx, /embed/xxx...), nên giảng viên dán kiểu nào cũng được
 *   - gọi YouTube Data API lấy THỜI LƯỢNG thật, điền vào VideoDurationSeconds
 *   - từ chối link sai định dạng bằng lỗi rõ ràng
 *
 * ⚠️ Máy chủ BẮT BUỘC có `externalVideoInput` khi `lessonType = VIDEO`
 *    (xem lessons.validation.js). Gửi thiếu sẽ nhận 400 với thông báo về
 *    "nguồn video", nghe rất khó hiểu nếu không biết ràng buộc này.
 * ========================================================================== */
export const setLessonYoutubeVideo = async (
  lessonId: number,
  youtubeUrlOrId: string
): Promise<Lesson> => {
  return apiHelper.patch(`/lessons/${lessonId}`, {
    lessonType: 'VIDEO',
    videoSourceType: 'YOUTUBE',
    externalVideoInput: youtubeUrlOrId.trim(),
  });
};

/** Xóa lesson */
export const deleteLesson = async (lessonId: number): Promise<void> => {
  await apiHelper.delete(`/lessons/${lessonId}`);
};

/** Upload/Cập nhật video bài học (Cơ chế cũ qua bộ đệm server) */
export const updateLessonVideo = async (
  lessonId: number,
  file: File
): Promise<Lesson> => {
  const formData = new FormData();
  formData.append('video', file);
  const API_BASE_URL: string = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/v1`;
  const url = new URL(`${API_BASE_URL}/lessons/${lessonId}/video`);
  return fetchWithAuth(url, {
    method: 'PATCH',
    body: formData,
  });
};

export interface VideoUploadToken {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  resourceType: string;
  type: string;
}

/** Lấy chữ ký bảo mật từ Backend để chuẩn bị Direct Upload */
export const getLessonVideoUploadToken = async (
  lessonId: number
): Promise<VideoUploadToken> => {
  return apiHelper.post(`/lessons/${lessonId}/video-upload-token`, {});
};

/** Xác nhận hoàn tất upload video với Backend & kích hoạt AI Transcribing */
export const confirmLessonVideoUpload = async (
  lessonId: number,
  publicId: string,
  duration: number
): Promise<Lesson> => {
  return apiHelper.put(`/lessons/${lessonId}/confirm-video`, { publicId, duration });
};

/** Thực hiện trọn gói luồng Direct Signed Upload từ Trình duyệt thẳng lên Cloudinary */
export const uploadLessonVideoDirect = async (
  lessonId: number,
  file: File,
  onProgress?: (percent: number) => void
): Promise<Lesson> => {
  // 1. Xin token/chữ ký từ Backend (< 15ms, 0MB RAM Server)
  const token = await getLessonVideoUploadToken(lessonId);

  // 2. Tải trực tiếp lên Cloudinary có theo dõi phần trăm tiến độ
  return new Promise<Lesson>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const uploadUrl = `https://api.cloudinary.com/v1_1/${token.cloudName}/${token.resourceType}/upload`;

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded * 100) / event.total);
          onProgress(percent);
        }
      };
    }

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          const { public_id, duration } = response;
          // 3. Chốt xác nhận với Backend để cập nhật CSDl và gọi Webhook AI
          const updatedLesson = await confirmLessonVideoUpload(lessonId, public_id, duration || 0);
          resolve(updatedLesson);
        } catch (err) {
          reject(new Error('Lỗi xử lý phản hồi xác nhận từ Server.'));
        }
      } else {
        reject(new Error(`Cloudinary direct upload failed (${xhr.status}): ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Lỗi kết nối mạng khi tải lên Cloudinary.'));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', token.apiKey);
    formData.append('timestamp', String(token.timestamp));
    formData.append('signature', token.signature);
    formData.append('folder', token.folder);
    formData.append('type', token.type);

    xhr.open('POST', uploadUrl, true);
    xhr.send(formData);
  });
};

/** Lấy Signed URL cho video private */
export const getLessonVideoSignedUrl = async (
  lessonId: number
): Promise<{ signedUrl: string; publicEmbedUrl?: string }> => {
  return apiHelper.get(`/lessons/${lessonId}/video-url`);
};

// --- Attachment APIs ---

/** Thêm file đính kèm */
export const addLessonAttachment = async (
  lessonId: number,
  file: File
): Promise<Attachment> => {
  const formData = new FormData();
  formData.append('attachment', file);
  const API_BASE_URL: string = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/v1`;
  const url = new URL(`${API_BASE_URL}/lessons/${lessonId}/attachments`);
  return fetchWithAuth(url, {
    method: 'POST',
    body: formData,
  });
};

/** Xóa file đính kèm */
export const deleteLessonAttachment = async (
  lessonId: number,
  attachmentId: number
): Promise<void> => {
  await apiHelper.delete(`/lessons/${lessonId}/attachments/${attachmentId}`);
};

// --- Quiz Question APIs (Quản lý bởi Instructor) ---
// Các hàm này sẽ gọi đến endpoints quản lý quiz questions, có thể là lồng trong lesson hoặc đứng riêng

// export interface QuizQuestion {
//   QuestionID: number;
//   LessonID: number;
//   QuestionText: string;
//   Explanation?: string | null;
//   QuestionOrder: number;
//   options: QuizOption[];
// }
// export interface QuizOption {
//   OptionID: number;
//   QuestionID: number;
//   OptionText: string;
//   IsCorrectAnswer: boolean;
//   OptionOrder: number;
// }
export interface CreateQuestionData {
  questionText: string;
  explanation?: string;
  questionOrder?: number; // Service backend tự tính?
  options: {
    optionText: string;
    isCorrectAnswer: boolean;
    optionOrder: number;
  }[];
}
export interface UpdateQuestionData {
  questionText?: string;
  explanation?: string;
  questionOrder?: number;
  options?: {
    optionText: string;
    isCorrectAnswer: boolean;
    optionOrder: number;
  }[];
}

/** Instructor: Lấy danh sách câu hỏi quiz của bài học */
export const getQuizQuestionsForLesson = async (
  lessonId: number
): Promise<{ questions: QuizQuestion[] }> => {
  return apiHelper.get(`/lessons/${lessonId}/quiz/questions`);
};

/** Instructor: Tạo câu hỏi quiz mới */
export const createQuizQuestion = async (
  lessonId: number,
  data: CreateQuestionData
): Promise<QuizQuestion> => {
  return apiHelper.post(`/lessons/${lessonId}/quiz/questions`, data);
};

/** Instructor: Cập nhật câu hỏi quiz */
export const updateQuizQuestion = async (
  questionId: number,
  data: UpdateQuestionData
): Promise<QuizQuestion> => {
  // Endpoint này đứng riêng
  return apiHelper.patch(`/quiz-questions/${questionId}`, data);
};

/** Instructor: Xóa câu hỏi quiz */
export const deleteQuizQuestion = async (questionId: number): Promise<void> => {
  // Endpoint này đứng riêng
  await apiHelper.delete(`/quiz-questions/${questionId}`);
};

/** AI: Sinh câu hỏi trắc nghiệm tự động */
export const generateLessonQuiz = async (
  lessonId: number,
  data: { questionsPerLesson?: number; difficulty?: string }
): Promise<any> => {
  return apiHelper.post(`/lessons/${lessonId}/generate-quiz`, data);
};
