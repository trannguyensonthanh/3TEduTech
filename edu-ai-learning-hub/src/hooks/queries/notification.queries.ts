/* eslint-disable @typescript-eslint/no-explicit-any */
// src/hooks/queries/notification.queries.ts
import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  useQueryClient,
  InfiniteData,
  QueryFunctionContext,
  useInfiniteQuery,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult, // Thêm useInfiniteQuery
} from '@tanstack/react-query';
import {
  getMyNotifications as getMyNotificationsApi, // Đổi tên hàm service
  getMyUnreadNotificationCount as getMyUnreadNotificationCountApi,
  markNotificationAsRead as markNotificationAsReadApi,
  markAllNotificationsAsRead as markAllNotificationsAsReadApi,
  NotificationListResponse,
  NotificationQueryParams,
  UnreadCountResponse,
  deleteNotificationById,
  deleteAllReadNotifications,
  deleteAllMyNotifications,
  DeleteAllResultResponse,
  // Các type này nên được import từ file types chung
  // Notification, NotificationListResponse, NotificationQueryParams, UnreadCountResponse,
} from '@/services/notification.service';

// Query Key Factory
export const notificationKeys = {
  all: ['notifications'] as const,
  myLists: () => [...notificationKeys.all, 'myList'] as const,
  myList: (params?: NotificationQueryParams) =>
    [...notificationKeys.myLists(), params || {}] as const,
  myUnreadCount: () => [...notificationKeys.all, 'myUnreadCount'] as const,
};

// --- Queries ---

/** Hook lấy danh sách thông báo của user hiện tại (hỗ trợ Infinite Scroll) */
export const useMyInfiniteNotifications = (
  params: Omit<NotificationQueryParams, 'page'> = {}, // Bỏ page, limit sẽ được quản lý bởi hook
  options?: Omit<
    UseInfiniteQueryOptions<
      NotificationListResponse, // Từng page
      Error,
      NotificationListResponse[], // Dạng `select` sau khi xử lý (nếu có)
      NotificationListResponse, // Kết quả cuối cùng m muốn trả ra
      ReadonlyArray<string | Record<string, unknown> | undefined>, // Query key
      number // PageParam
    >,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >
): UseInfiniteQueryResult<NotificationListResponse[], Error> => {
  const queryKey = notificationKeys.myList({ ...params, infinite: true }); // Thêm cờ để phân biệt
  const limit = params.limit || 10; // Số item mỗi page

  return useInfiniteQuery<
    NotificationListResponse, // Kiểu dữ liệu API trả về cho 1 page
    Error,
    NotificationListResponse[], // Kiểu dữ liệu của data.pages
    ReadonlyArray<string | Record<string, any> | undefined>,
    number // Kiểu của pageParam (là số trang tiếp theo)
  >({
    queryKey: queryKey,
    queryFn: async ({
      pageParam = 1,
    }: QueryFunctionContext<
      ReadonlyArray<string | Record<string, any> | undefined>,
      number | undefined
    >) => {
      console.log('Fetching notifications, page:', pageParam);
      return getMyNotificationsApi({ ...params, page: pageParam, limit });
    },
    initialPageParam: 1, // Trang bắt đầu
    getNextPageParam: (lastPage) => {
      // Nếu trang hiện tại < tổng số trang, trả về số trang tiếp theo
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined; // Không có trang tiếp theo
    },
    staleTime: 1000 * 60, // 1 phút
    ...options,
  });
};

/** Hook lấy số lượng thông báo chưa đọc */
export const useMyUnreadNotificationCount = (
  options?: Omit<
    UseQueryOptions<UnreadCountResponse, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryKey = notificationKeys.myUnreadCount();
  return useQuery<UnreadCountResponse, Error>({
    queryKey: queryKey,
    queryFn: getMyUnreadNotificationCountApi,
    // Cập nhật thường xuyên hơn
    refetchInterval: 1000 * 60 * 2, // 2 phút
    staleTime: 1000 * 60, // 1 phút
    refetchOnWindowFocus: true,
    ...options,
  });
};

// --- Mutations ---

/** Hook đánh dấu một thông báo là đã đọc */
export const useMarkNotificationAsRead = (
  options?: UseMutationOptions<{ message: string }, Error, number>
) => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, number>({
    mutationFn: markNotificationAsReadApi,
    onSuccess: (data, notificationId) => {
      // Cập nhật cache danh sách thông báo (cho cả infinite query)
      queryClient.setQueryData<InfiniteData<NotificationListResponse>>(
        notificationKeys.myList({ infinite: true }), // Đảm bảo key khớp với query
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              notifications: page.notifications.map((n) =>
                n.notificationId === notificationId ? { ...n, isRead: true } : n
              ),
            })),
          };
        }
      );
      // Cập nhật cache unread count (giảm đi 1 nếu notification đó chưa đọc)
      // Cần kiểm tra trạng thái isRead trước khi giảm để tránh lỗi
      // Cách đơn giản hơn là invalidate query unreadCount
      queryClient.invalidateQueries({
        queryKey: notificationKeys.myUnreadCount(),
      });
      console.log(`Notification ${notificationId} marked as read.`);
    },
    onError: (error) => {
      console.error('Mark notification as read failed:', error.message);
    },
    ...options,
  });
};

/** Hook đánh dấu tất cả thông báo là đã đọc */
export const useMarkAllNotificationsAsRead = (
  options?: UseMutationOptions<
    { message: string; markedCount: number },
    Error,
    void
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string; markedCount: number }, Error, void>({
    mutationFn: markAllNotificationsAsReadApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.myLists() }); // Invalidate tất cả list (bao gồm cả infinite)
      queryClient.setQueryData(notificationKeys.myUnreadCount(), {
        unreadCount: 0,
      });
      console.log(`${data.markedCount} notifications marked as read.`);
    },

    onError: (error) => {
      console.error('Mark all notifications as read failed:', error.message);
      // toast.error(error.message || 'Đánh dấu tất cả là đã đọc thất bại.');
    },
    ...options,
  });
};

/** Hook xóa một thông báo cụ thể */
export const useDeleteNotification = (
  options?: UseMutationOptions<void, Error, number>
) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    // Input là notificationId
    mutationFn: deleteNotificationById,
    onSuccess: (data, notificationId) => {
      // Invalidate danh sách thông báo và số lượng chưa đọc
      queryClient.invalidateQueries({ queryKey: notificationKeys.myLists() });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.myUnreadCount(),
      });
      // Hoặc có thể xóa trực tiếp notification đó khỏi cache của list
      // queryClient.setQueryData(notificationKeys.myLists(), (oldData: NotificationListResponse | undefined) => {
      //     if (!oldData) return oldData;
      //     return {
      //         ...oldData,
      //         notifications: oldData.notifications.filter(n => n.NotificationID !== notificationId),
      //         total: oldData.total ? oldData.total - 1 : 0,
      //     };
      // });
      console.log(`Notification ${notificationId} deleted.`);
      // toast.success('Đã xóa thông báo.');
    },
    onError: (error) => {
      console.error('Delete notification failed:', error.message);
      // toast.error(error.message || 'Xóa thông báo thất bại.');
    },
    ...options,
  });
};

/** Hook xóa tất cả thông báo đã đọc */
export const useDeleteAllReadNotifications = (
  options?: UseMutationOptions<DeleteAllResultResponse, Error, void>
) => {
  const queryClient = useQueryClient();
  return useMutation<DeleteAllResultResponse, Error, void>({
    mutationFn: deleteAllReadNotifications,
    onSuccess: (data) => {
      // Invalidate danh sách thông báo (chỉ những cái chưa đọc còn lại)
      queryClient.invalidateQueries({ queryKey: notificationKeys.myLists() });
      // Số lượng chưa đọc không thay đổi
      console.log(`${data.deletedCount} read notifications deleted.`);
      // toast.success(data.message);
    },
    onError: (error) => {
      console.error('Delete all read notifications failed:', error.message);
      // toast.error(error.message || 'Xóa thông báo đã đọc thất bại.');
    },
    ...options,
  });
};

/** Hook xóa tất cả thông báo */
export const useDeleteAllMyNotifications = (
  options?: UseMutationOptions<DeleteAllResultResponse, Error, void>
) => {
  const queryClient = useQueryClient();
  return useMutation<DeleteAllResultResponse, Error, void>({
    mutationFn: deleteAllMyNotifications,
    onSuccess: (data) => {
      // Invalidate danh sách và số lượng chưa đọc (sẽ về 0)
      queryClient.invalidateQueries({ queryKey: notificationKeys.myLists() });
      queryClient.setQueryData(notificationKeys.myUnreadCount(), {
        unreadCount: 0,
      });
      console.log(`All ${data.deletedCount} notifications deleted.`);
      // toast.success(data.message);
    },
    onError: (error) => {
      console.error('Delete all notifications failed:', error.message);
      // toast.error(error.message || 'Xóa tất cả thông báo thất bại.');
    },
    ...options,
  });
};
