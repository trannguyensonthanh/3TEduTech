/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/notifications/NotificationItemPageVersion.tsx
// Hoặc bạn có thể import trực tiếp NotificationItem từ dropdown nếu style giống nhau
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

import { formatDistanceToNowStrict } from 'date-fns';
import {
  useDeleteNotification,
  useMarkNotificationAsRead,
} from '@/hooks/queries/notification.queries';
import { cn } from '@/lib/utils';
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
  Trash2,
  MailOpen,
  Loader2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { TableCell, TableRow } from '@/components/ui/table';
import { Notification } from '@/services/notification.service';
import ConfirmationDialog from '@/components/instructor/courseCreate/ConfirmationDialog';
// Giả sử bạn có hook delete từng notification (nếu cần nút delete riêng ở đây)
// import { useDeleteNotification } from '@/hooks/queries/notification.queries';

// Helper getNotificationDetails (giống như trong NotificationItem của dropdown)
const getNotificationDetails = (
  notification: Notification
): { icon: React.ReactNode; link: string | null; typeLabel: string } => {
  let icon: React.ReactNode = (
    <Info size={20} className="text-muted-foreground" />
  );
  let link: string | null = null;
  let typeLabel = notification.type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase()); // Format type

  switch (notification.type) {
    case 'COURSE_APPROVED':
      icon = <BookCheck size={20} className="text-green-500" />;
      typeLabel = 'Course Approved';
      break;
    case 'COURSE_REJECTED':
      icon = <AlertCircle size={20} className="text-red-500" />;
      typeLabel = 'Course Rejected';
      break;
    case 'NEW_COURSE_REVIEW':
      icon = <MessageSquare size={20} className="text-yellow-500" />;
      typeLabel = 'New Review';
      break;
    case 'ORDER_COMPLETED':
      icon = <CheckCircle size={20} className="text-green-500" />;
      typeLabel = 'Order Completed';
      break;
    case 'ORDER_FAILED':
      icon = <AlertCircle size={20} className="text-red-500" />;
      typeLabel = 'Order Failed';
      break;
    case 'PAYOUT_PROCESSED':
      icon = <DollarSign size={20} className="text-green-500" />;
      typeLabel = 'Payout Processed';
      break;
    // Thêm các case khác
    default:
      icon = <BellRing size={20} className="text-primary" />;
  }

  if (notification.relatedEntityType && notification.relatedEntityId) {
    if (notification.relatedEntityType.toLowerCase() === 'course')
      link = `/courses/${notification.relatedEntityId}`;
    else if (notification.relatedEntityType.toLowerCase() === 'order')
      link = `/user/orders/${notification.relatedEntityId}`;
  }
  notification.linkTo = link;
  return { icon, link, typeLabel };
};
interface NotificationItemPageVersionProps {
  notification: Notification;
  onActionSuccess?: () => void; // Callback chung khi markAsRead hoặc delete thành công để parent có thể refetch
}

const NotificationItemPageVersion: React.FC<
  NotificationItemPageVersionProps
> = ({ notification, onActionSuccess }) => {
  const navigate = useNavigate();
  const { mutate: markAsReadMutate, isPending: isMarkingRead } =
    useMarkNotificationAsRead();
  const { mutate: deleteNotificationMutate, isPending: isDeleting } =
    useDeleteNotification(); // *** SỬ DỤNG HOOK MỚI ***
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] =
    useState(false);

  const details = getNotificationDetails(notification);

  const handleItemClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    // Không điều hướng nếu click vào nút bên trong
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    if (!notification.isRead && !isMarkingRead) {
      markAsReadMutate(notification.notificationId, {
        onSuccess: () => {
          onActionSuccess?.();
        },
        onError: (err) =>
          console.error('Failed to mark notification as read:', err),
      });
    }
    if (details.link) {
      navigate(details.link);
    }
  };

  const handleMarkAsReadClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Ngăn click vào item chính
    if (!notification.isRead && !isMarkingRead) {
      markAsReadMutate(notification.notificationId, {
        onSuccess: () => {
          toast({ title: 'Notification marked as read.' });
          onActionSuccess?.();
        },
        onError: (err: any) =>
          toast({
            title: 'Error',
            description: err.message,
            variant: 'destructive',
          }),
      });
    }
  };

  const handleDeleteRequest = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (isDeleting) return;
    deleteNotificationMutate(notification.notificationId, {
      onSuccess: () => {
        toast({ title: 'Notification Deleted' });
        onActionSuccess?.(); // Kích hoạt refetch ở parent
        setIsConfirmDeleteDialogOpen(false);
      },
      onError: (err: any) => {
        toast({
          title: 'Delete Failed',
          description: err.message,
          variant: 'destructive',
        });
        setIsConfirmDeleteDialogOpen(false);
      },
    });
  };

  return (
    <>
      <TableRow
        key={notification.notificationId}
        className={cn(
          'cursor-pointer group transition-colors',
          !notification.isRead
            ? 'bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/15'
            : 'hover:bg-muted/50 dark:hover:bg-muted/20'
        )}
        onClick={handleItemClick}
        tabIndex={0}
        onKeyDown={(e) =>
          (e.key === 'Enter' || e.key === ' ') && handleItemClick(e as any)
        } // Type cast
        aria-selected={!notification.isRead}
      >
        <TableCell className="w-12 text-center pl-4 pr-2 py-3">
          <div
            className={cn(
              'inline-flex p-2 rounded-full transition-colors',
              !notification.isRead
                ? 'bg-primary/10 group-hover:bg-primary/20'
                : 'bg-muted group-hover:bg-accent'
            )}
          >
            {details.icon}
          </div>
        </TableCell>
        <TableCell className="py-3">
          <p
            className={cn(
              'text-sm leading-snug',
              !notification.isRead
                ? 'text-foreground font-semibold'
                : 'text-muted-foreground'
            )}
          >
            {details.typeLabel}
          </p>
          <p
            className="text-xs text-muted-foreground line-clamp-2 mt-0.5"
            title={notification.message}
          >
            {notification.message}
          </p>
        </TableCell>
        <TableCell className="text-xs text-muted-foreground text-right whitespace-nowrap py-3">
          {formatDistanceToNowStrict(new Date(notification.createdAt), {
            addSuffix: true,
          })}
        </TableCell>
        <TableCell className="text-right py-3 pr-4">
          <div className="flex items-center justify-end gap-1">
            {!notification.isRead && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMarkAsReadClick}
                disabled={isMarkingRead}
                title="Mark as read"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
              >
                {isMarkingRead ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MailOpen className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              title="Delete this notification"
              onClick={handleDeleteRequest} // Mở dialog xác nhận
              disabled={isDeleting}
            >
              {isDeleting &&
              notification.notificationId === /* ID đang xóa */ undefined ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
            </Button>
          </div>
        </TableCell>
      </TableRow>
      <ConfirmationDialog
        open={isConfirmDeleteDialogOpen}
        onOpenChange={setIsConfirmDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Notification?"
        description="This action cannot be undone. Are you sure you want to permanently delete this notification?"
        confirmText="Delete"
        confirmVariant="destructive"
        isConfirming={isDeleting}
      />
    </>
  );
};

export default NotificationItemPageVersion;
