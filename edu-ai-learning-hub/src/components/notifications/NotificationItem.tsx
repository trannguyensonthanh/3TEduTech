// src/components/notifications/NotificationItem.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Giả sử dùng Avatar
import { Button } from '@/components/ui/button';

import { formatDistanceToNowStrict } from 'date-fns';
import { useMarkNotificationAsRead } from '@/hooks/queries/notification.queries';
import { cn } from '@/lib/utils'; // Hàm tiện ích để nối class
import {
  AlertCircle,
  CheckCircle,
  Gift,
  MessageSquare,
  DollarSign,
  BookCheck,
  Eye,
  BellRing,
  Info,
  ShoppingCart,
} from 'lucide-react';
import { Notification } from '@/services/notification.service';

interface NotificationItemProps {
  notification: Notification;
  onItemClick?: () => void; // Callback để đóng dropdown khi click
}

// Helper để lấy icon và link dựa trên loại thông báo
const getNotificationDetails = (
  notification: Notification
): { icon: React.ReactNode; link: string | null } => {
  let icon: React.ReactNode = (
    <Info size={18} className="text-muted-foreground" />
  );
  let link: string | null = null;

  // Logic này cần được điều chỉnh cho phù hợp với các `Type` và `RelatedEntityType` của bạn
  switch (notification.type) {
    case 'COURSE_APPROVED':
    case 'COURSE_REJECTED':
    case 'COURSE_SUBMITTED': // Giảng viên nhận
      icon = (
        <BookCheck
          size={18}
          className={
            notification.type === 'COURSE_APPROVED'
              ? 'text-green-500'
              : notification.type === 'COURSE_REJECTED'
              ? 'text-red-500'
              : 'text-blue-500'
          }
        />
      );
      if (
        notification.relatedEntityType === 'Course' &&
        notification.relatedEntityId
      ) {
        // Giả sử bạn có slug trong message hoặc cần fetch slug
        // Tạm thời trỏ đến /courses/id (cần slug thực tế)
        link = `/courses/${notification.relatedEntityId}`; // Hoặc /instructor/courses/edit/{id}
        // Nếu message chứa slug, bạn có thể trích xuất từ đó
      }
      break;
    case 'NEW_COURSE_REVIEW':
      icon = <MessageSquare size={18} className="text-yellow-500" />;
      if (
        notification.relatedEntityType === 'Review' &&
        notification.relatedEntityId
      ) {
        // Cần course slug để link đến tab review của khóa học
        // link = `/courses/${courseSlug}?tab=reviews#review-${notification.relatedEntityId}`;
        link = `/courses/some-course-slug?review=${notification.relatedEntityId}`; // Placeholder
      }
      break;
    case 'ORDER_COMPLETED':
    case 'ORDER_FAILED':
      icon = (
        <ShoppingCart
          size={18}
          className={
            notification.type === 'ORDER_COMPLETED'
              ? 'text-green-500'
              : 'text-red-500'
          }
        />
      );
      if (
        notification.relatedEntityType === 'Order' &&
        notification.relatedEntityId
      ) {
        link = `/user/orders/${notification.relatedEntityId}`;
      }
      break;
    case 'PAYOUT_PROCESSED':
    case 'PAYOUT_FAILED':
      icon = (
        <DollarSign
          size={18}
          className={
            notification.type === 'PAYOUT_PROCESSED'
              ? 'text-green-500'
              : 'text-red-500'
          }
        />
      );
      if (
        notification.relatedEntityType === 'Payout' &&
        notification.relatedEntityId
      ) {
        link = `/instructor/payouts`; // Hoặc chi tiết payout nếu có
      }
      break;
    // Thêm các case khác
    default:
      icon = <BellRing size={18} className="text-primary" />;
  }
  // Gán link đã tạo vào notification object để dùng lại (nếu FE xử lý link)
  // Hoặc API nên trả về link sẵn nếu có thể
  notification.linkTo = link;
  return { icon, link };
};

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onItemClick,
}) => {
  const navigate = useNavigate();
  const { mutate: markAsRead, isPending: isMarkingRead } =
    useMarkNotificationAsRead();
  console.log('NotificationItem', notification);
  const details = getNotificationDetails(notification);

  const handleClick = () => {
    if (!notification.isRead && !isMarkingRead) {
      markAsRead(notification.notificationId, {
        onError: (err) => console.error('Failed to mark as read:', err),
        // Không cần onSuccess vì optimistic update đã làm hoặc invalidate sẽ làm
      });
    }
    if (details.link) {
      navigate(details.link);
    }
    onItemClick?.(); // Đóng dropdown
  };

  return (
    <DropdownMenuItem
      className={cn(
        'p-0 focus:bg-transparent' // Bỏ style focus mặc định của DropdownMenuItem
      )}
      // Không dùng asChild với Link ở đây để dễ xử lý onClick hơn
      onSelect={(e) => {
        e.preventDefault(); // Ngăn dropdown tự đóng nếu không muốn
        handleClick();
      }}
    >
      <div
        className={cn(
          'flex items-start gap-3 w-full p-2.5 hover:bg-muted/80 dark:hover:bg-muted/20 rounded-md cursor-pointer transition-colors',
          !notification.isRead &&
            'bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/15'
        )}
      >
        <div className="mt-0.5 shrink-0">{details.icon}</div>
        <div className="flex-grow min-w-0">
          <p
            className={cn(
              'text-xs leading-relaxed',
              !notification.isRead && 'font-semibold'
            )}
          >
            {notification.message}
          </p>
          <p
            className={cn(
              'text-xxs text-muted-foreground mt-0.5',
              !notification.isRead && 'font-medium'
            )}
          >
            {formatDistanceToNowStrict(new Date(notification.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>
        {!notification.isRead && (
          <div
            className="w-2 h-2 bg-primary rounded-full self-center shrink-0 ml-2"
            title="Unread"
          ></div>
        )}
      </div>
    </DropdownMenuItem>
  );
};

export default NotificationItem;
