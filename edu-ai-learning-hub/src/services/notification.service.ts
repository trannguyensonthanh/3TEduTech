// src/services/notification.service.ts
import { IsoDateTimeString } from '@/types/common.types';
import apiHelper from './apiHelper';

export interface Notification {
  notificationId: number;
  recipientAccountId: number;
  type: string; // Ví dụ: 'COURSE_APPROVED', 'NEW_REVIEW', 'PAYOUT_COMPLETED', 'ORDER_COMPLETED'
  message: string;
  relatedEntityType?: string | null; // 'Course', 'Review', 'Order', 'Payout'
  relatedEntityId?: string | number | null; // ID của entity liên quan
  isRead: boolean;
  createdAt: IsoDateTimeString;
  linkTo?: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  isRead?: 1 | 0 | undefined; // true | false | undefined (lấy cả hai)
  infinite?: boolean; // true | false (để phân biệt với useInfiniteQuery)
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface DeleteAllResultResponse {
  message: string;
  deletedCount: number;
}

/** Lấy danh sách thông báo của user hiện tại */
export const getMyNotifications = async (
  params?: NotificationQueryParams
): Promise<NotificationListResponse> => {
  return apiHelper.get('/notifications', undefined, params);
};

/** Lấy số lượng thông báo chưa đọc */
export const getMyUnreadNotificationCount =
  async (): Promise<UnreadCountResponse> => {
    return apiHelper.get('/notifications/unread-count');
  };

/** Đánh dấu một thông báo là đã đọc */
export const markNotificationAsRead = async (
  notificationId: number
): Promise<{ message: string }> => {
  return apiHelper.patch(`/notifications/${notificationId}/read`);
};

/** Đánh dấu tất cả thông báo là đã đọc */
export const markAllNotificationsAsRead = async (): Promise<{
  message: string;
  markedCount: number;
}> => {
  return apiHelper.post('/notifications/mark-all-read');
};

/**
 * Xóa một thông báo cụ thể của người dùng.
 * @param {number} notificationId - ID của thông báo cần xóa.
 * @returns {Promise<void>} - API trả về 204 No Content.
 */
export const deleteNotificationById = async (
  notificationId: number
): Promise<void> => {
  // API backend DELETE /notifications/:notificationId
  await apiHelper.delete(`/notifications/${notificationId}`);
};

/**
 * Xóa tất cả thông báo đã đọc của người dùng.
 * @returns {Promise<DeleteAllResultResponse>}
 */
export const deleteAllReadNotifications =
  async (): Promise<DeleteAllResultResponse> => {
    // API backend DELETE /notifications/read
    return apiHelper.delete('/notifications/read');
  };

/**
 * Xóa tất cả thông báo của người dùng.
 * @returns {Promise<DeleteAllResultResponse>}
 */
export const deleteAllMyNotifications =
  async (): Promise<DeleteAllResultResponse> => {
    // API backend DELETE /notifications/all
    return apiHelper.delete('/notifications/all');
  };
