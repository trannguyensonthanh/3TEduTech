// src/services/certificate.service.ts
//
// [THÊM 17/08/2026 — LEVEL 2, mục 2.1]
//
// Trước đây frontend TỰ GHÉP mã chứng chỉ: `CERT-${courseId}-${accountId}`.
// Mã đó không lưu ở đâu, không xác minh được, và ai biết công thức cũng tự chế
// ra được — tức là tấm chứng chỉ hoàn toàn vô giá trị. Nay mọi mã đều do server
// sinh ngẫu nhiên, lưu trong bảng Certificates và ký bằng HMAC-SHA256.

import apiHelper from './apiHelper';

export interface Certificate {
  certificateId: number;
  certificateCode: string;
  courseId: number;
  /** Ảnh chụp tại thời điểm cấp — KHÔNG đổi kể cả khi học viên hay khóa học đổi tên */
  studentNameSnapshot: string;
  courseNameSnapshot: string;
  instructorNameSnapshot?: string | null;
  /** Phiên bản giáo trình mà học viên đã thực sự học */
  courseVersionNumber: number;
  totalLessonsSnapshot?: number | null;
  finalQuizAverage?: number | null;
  completedAt?: string | null;
  issuedAt: string;
  isRevoked: boolean;
  revokedAt?: string | null;
  revokedReason?: string | null;
  /** Thông tin hiện tại của khóa học (chỉ để hiển thị phụ) */
  courseSlug?: string | null;
  courseThumbnailUrl?: string | null;
  categoryName?: string | null;
  levelName?: string | null;
  /** URL trang xác minh công khai — cũng là nội dung mã QR */
  verifyUrl: string;
  /** false khi đã thu hồi HOẶC chữ ký không khớp */
  isValid: boolean;
}

export interface MyCertificatesResponse {
  certificates: Certificate[];
  total: number;
}

/** Bản trình bày công khai — đã lược bỏ email, accountId và chữ ký. */
export interface PublicCertificateView {
  certificateCode: string;
  studentName: string;
  courseName: string;
  instructorName?: string | null;
  courseVersionNumber: number;
  totalLessons?: number | null;
  finalQuizAverage?: number | null;
  completedAt?: string | null;
  issuedAt: string;
  categoryName?: string | null;
  levelName?: string | null;
  courseSlug?: string | null;
  courseThumbnailUrl?: string | null;
  studentAvatarUrl?: string | null;
  verifyUrl: string;
}

export type VerificationStatus =
  | 'VALID'
  | 'REVOKED'
  | 'TAMPERED'
  | 'NOT_FOUND';

export interface VerificationResult {
  isValid: boolean;
  status: VerificationStatus;
  message: string;
  certificate?: PublicCertificateView;
  revokedAt?: string | null;
  revokedReason?: string | null;
}

export interface EligibilityResult {
  eligible: boolean;
  alreadyIssued: boolean;
  reason?: 'NOT_ENROLLED' | 'NOT_COMPLETED';
  certificate?: Certificate;
}

/** Danh sách chứng chỉ của tôi */
export const getMyCertificates = async (): Promise<MyCertificatesResponse> => {
  return apiHelper.get('/certificates/me');
};

/**
 * Tự bấm nhận chứng chỉ.
 * Thường không cần gọi — hệ thống đã cấp tự động khi học viên hoàn thành bài
 * cuối. Đây là đường dự phòng cho người tốt nghiệp từ trước khi có tính năng.
 */
export const issueCertificate = async (
  courseId: number
): Promise<Certificate> => {
  return apiHelper.post(`/certificates/issue/${courseId}`);
};

/** Đã đủ điều kiện nhận chứng chỉ chưa, và đã cấp chưa */
export const getCertificateEligibility = async (
  courseId: number
): Promise<EligibilityResult> => {
  return apiHelper.get(`/certificates/eligibility/${courseId}`);
};

/** Chi tiết một chứng chỉ — chỉ chủ sở hữu hoặc Admin */
export const getCertificateDetail = async (
  code: string
): Promise<Certificate> => {
  return apiHelper.get(`/certificates/${code}`);
};

/**
 * XÁC MINH CÔNG KHAI — không cần đăng nhập.
 *
 * ⚠️ Backend LUÔN trả HTTP 200, kể cả khi chứng chỉ giả hoặc không tồn tại;
 * kết quả nằm ở trường `status`. Đó là chủ đích: "mã này không hợp lệ" là một
 * câu trả lời THÀNH CÔNG của việc tra cứu, không phải lỗi máy chủ. Nhờ vậy
 * giao diện phân biệt được rõ ràng "mất mạng" (rơi vào catch) với "chứng chỉ
 * giả" (vào then, status = NOT_FOUND) — hai chuyện rất khác nhau.
 */
export const verifyCertificate = async (
  code: string
): Promise<VerificationResult> => {
  return apiHelper.get(`/certificates/verify/${encodeURIComponent(code)}`);
};

/** Thu hồi chứng chỉ — chỉ Admin */
export const revokeCertificate = async (
  code: string,
  reason: string
): Promise<Certificate> => {
  return apiHelper.patch(`/certificates/${code}/revoke`, { reason });
};
