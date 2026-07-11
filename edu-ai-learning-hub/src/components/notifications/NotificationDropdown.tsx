/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/layout/NotificationDropdown.tsx
import React, { useState, Fragment, useEffect } from 'react';
import {
  Bell,
  Loader2,
  MailOpen,
  Trash2,
  Settings2,
  X,
  ExternalLink,
  XCircle,
} from 'lucide-react';
import {
  useMyInfiniteNotifications,
  useMyUnreadNotificationCount,
  useMarkAllNotificationsAsRead,
} from '@/hooks/queries/notification.queries';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import NotificationItem from './NotificationItem'; // Import component con
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useInView } from 'react-intersection-observer';

const NOTIFICATIONS_PER_PAGE = 7; // Số thông báo tải mỗi lần

const NotificationDropdown: React.FC = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false); // State để kiểm soát dropdown

  // Fetch unread count
  const { data: unreadData } = useMyUnreadNotificationCount({
    // refetchInterval: 60000, // Tự động fetch lại mỗi phút
  });
  const unreadCount = unreadData?.unreadCount || 0;

  // Fetch notifications (infinite scroll)
  const {
    data: notificationsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading, // Loading lần đầu
    isError,
    error,
  } = useMyInfiniteNotifications(
    { limit: NOTIFICATIONS_PER_PAGE, isRead: undefined }, // Lấy cả đã đọc và chưa đọc ban đầu
    { enabled: isOpen } // Chỉ fetch khi dropdown mở
  );

  // Hook cho nút "Mark all as read"
  const { mutate: markAllReadMutate, isPending: isMarkingAllRead } =
    useMarkAllNotificationsAsRead();

  // Intersection observer để trigger load more
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0.5 });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      console.log('Fetching next page of notifications...');
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleMarkAllAsRead = () => {
    if (isMarkingAllRead || unreadCount === 0) return;
    markAllReadMutate(undefined, {
      onSuccess: () => {
        toast({ title: 'All notifications marked as read.' });
      },
      onError: (err: any) => {
        toast({
          title: 'Error',
          description: err.message || 'Could not mark all as read.',
          variant: 'destructive',
        });
      },
    });
  };

  // Gộp các page thành một mảng notifications phẳng
  const allNotifications =
    notificationsData?.pages.flatMap((response) => response.notifications) ||
    [];

  const handleDropdownOpenChange = (openStatus: boolean) => {
    setIsOpen(openStatus);
    if (openStatus && unreadCount > 0) {
      // Có thể gọi API đánh dấu đã xem (seen) một phần ở đây
      // Hoặc khi click vào từng item
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleDropdownOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full h-9 w-9"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-[1rem] px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-md">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 sm:w-96 p-0 shadow-xl"
        sideOffset={8}
      >
        <DropdownMenuLabel className="flex justify-between items-center px-3 py-2.5 border-b">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="default"
              onClick={(e) => {
                e.stopPropagation();
                handleMarkAllAsRead();
              }}
              disabled={isMarkingAllRead}
              className="h-auto py-1 px-1.5 text-xs text-primary hover:bg-primary/10"
            >
              {isMarkingAllRead && (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              )}
              Mark All Read
            </Button>
          )}
        </DropdownMenuLabel>

        {isLoading && !notificationsData ? (
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="h-[300px] flex flex-col items-center justify-center p-4 text-center">
            <XCircle className="h-10 w-10 text-destructive mb-2" />
            <p className="text-sm font-medium">Error Loading Notifications</p>
            <p className="text-xs text-muted-foreground">{error?.message}</p>
          </div>
        ) : allNotifications.length > 0 ? (
          <>
            <ScrollArea className="max-h-[350px] sm:max-h-[400px]">
              {' '}
              {/* Giới hạn chiều cao */}
              <div className="divide-y divide-border">
                {allNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.notificationId}
                    notification={notification}
                    onItemClick={() => setIsOpen(false)} // Đóng dropdown khi click vào item
                  />
                ))}
              </div>
              {/* Load more trigger */}
              {hasNextPage && (
                <div ref={loadMoreRef} className="p-4 text-center">
                  {isFetchingNextPage ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
                  ) : (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => fetchNextPage()}
                      className="text-xs"
                    >
                      Load More
                    </Button>
                  )}
                </div>
              )}
              {!hasNextPage &&
                allNotifications.length > NOTIFICATIONS_PER_PAGE && (
                  <p className="p-3 text-xs text-center text-muted-foreground">
                    You've reached the end.
                  </p>
                )}
            </ScrollArea>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="focus:bg-transparent">
              <Link
                to="/user/notifications"
                className="w-full justify-center text-sm py-2.5 cursor-pointer hover:bg-muted dark:hover:bg-muted/50 rounded-b-md"
              >
                View All Notifications{' '}
                <ExternalLink size={14} className="ml-1.5 opacity-70" />
              </Link>
            </DropdownMenuItem>
          </>
        ) : (
          <div className="py-10 text-center h-[300px] flex flex-col items-center justify-center">
            <MailOpen className="h-12 w-12 text-muted-foreground opacity-40 mb-3" />
            <p className="text-sm text-muted-foreground">
              You have no new notifications.
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
