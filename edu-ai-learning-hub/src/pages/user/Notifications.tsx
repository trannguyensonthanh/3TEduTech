/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/NotificationsPage.tsx
import React, { useState, useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  CheckCheck,
  Trash2,
  Loader2,
  Settings2,
  AlertCircle,
  XCircle,
  MailOpen,
  ChevronDown,
  RotateCcw,
  ListFilter,
} from 'lucide-react';
import {
  useMyInfiniteNotifications,
  useMarkAllNotificationsAsRead,
  useMyUnreadNotificationCount, // Để cập nhật badge ở header (nếu Navbar không tự làm)
  notificationKeys,
  useDeleteAllMyNotifications,
  useDeleteAllReadNotifications, // Key để invalidate
} from '@/hooks/queries/notification.queries';
import NotificationItemPageVersion from '@/components/notifications/NotificationItemPageVersion'; // Component item mới
import { useToast } from '@/hooks/use-toast';
import { useInView } from 'react-intersection-observer';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ConfirmationDialog from '@/components/instructor/courseCreate/ConfirmationDialog';
const NOTIFICATIONS_PER_PAGE = 15;

const NotificationsPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  // --- State cho Dialog Xác nhận Xóa nhiều ---
  const [clearConfirmState, setClearConfirmState] = useState<{
    isOpen: boolean;
    actionType: 'read' | 'all' | null;
    title: string;
    description: string;
  }>({ isOpen: false, actionType: null, title: '', description: '' });

  // --- Query & Mutation Hooks ---
  const queryParams = {
    limit: NOTIFICATIONS_PER_PAGE,
    isRead: activeTab === 'unread' ? (0 as 0 | 1) : undefined,
  };

  const {
    data: notificationsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch: refetchNotifications, // Thêm refetch
  } = useMyInfiniteNotifications(queryParams);

  const { mutate: markAllReadMutate, isPending: isMarkingAllRead } =
    useMarkAllNotificationsAsRead();
  const { mutate: clearReadMutate, isPending: isClearingRead } =
    useDeleteAllReadNotifications();
  const { mutate: clearAllMutate, isPending: isClearingAll } =
    useDeleteAllMyNotifications();

  const { data: unreadData, refetch: refetchUnreadCount } =
    useMyUnreadNotificationCount();
  const unreadCount = unreadData?.unreadCount || 0;

  // --- Infinite Scroll ---
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0.2 });
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allNotifications =
    notificationsData?.pages.flatMap((page) => page.notifications) || [];

  // --- Handlers ---
  const handleMarkAllAsRead = () => {
    if (isMarkingAllRead || unreadCount === 0) return;
    markAllReadMutate(undefined, {
      onSuccess: () => {
        toast({ title: 'All marked as read.' });
        refetchUnreadCount();
      },
      onError: (err: any) => {
        toast({
          title: 'Error',
          description: err.message,
          variant: 'destructive',
        });
      },
    });
  };

  const openClearConfirmDialog = (type: 'read' | 'all') => {
    setClearConfirmState({
      isOpen: true,
      actionType: type,
      title:
        type === 'read'
          ? 'Clear Read Notifications?'
          : 'Clear ALL Notifications?',
      description:
        type === 'read'
          ? 'This will permanently delete all notifications you have already read. This action cannot be undone.'
          : 'This will permanently delete ALL your notifications, read and unread. This action cannot be undone.',
    });
  };

  const handleConfirmClear = () => {
    if (clearConfirmState.actionType === 'read') {
      clearReadMutate(undefined, {
        onSuccess: (data) => {
          toast({ title: `${data.deletedCount} read notifications cleared.` });
          refetchNotifications();
          refetchUnreadCount();
        },
        onError: (err: any) => {
          toast({
            title: 'Error',
            description: err.message,
            variant: 'destructive',
          });
        },
        onSettled: () =>
          setClearConfirmState({
            isOpen: false,
            actionType: null,
            title: '',
            description: '',
          }),
      });
    } else if (clearConfirmState.actionType === 'all') {
      clearAllMutate(undefined, {
        onSuccess: (data) => {
          toast({ title: `All ${data.deletedCount} notifications cleared.` });
          refetchNotifications();
          refetchUnreadCount();
        },
        onError: (err: any) => {
          toast({
            title: 'Error',
            description: err.message,
            variant: 'destructive',
          });
        },
        onSettled: () =>
          setClearConfirmState({
            isOpen: false,
            actionType: null,
            title: '',
            description: '',
          }),
      });
    }
  };

  const handleSingleNotificationAction = () => {
    // Được gọi từ NotificationItemPageVersion sau khi mark as read hoặc delete thành công
    refetchUnreadCount();
    // Nếu đang ở tab unread và một item được đánh dấu đã đọc (hoặc xóa), cần refresh list
    if (activeTab === 'unread') {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.myList(queryParams),
      });
    }
  };

  const isProcessingAnyClear = isClearingRead || isClearingAll;

  const renderSkeletons = (count = 5) =>
    Array.from({ length: count }).map((_, i) => (
      <TableRow key={`skel-noti-${i}`}>
        <TableCell className="w-12 text-center">
          <Skeleton className="h-8 w-8 rounded-full" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-3/4 mb-1" />
          <Skeleton className="h-3 w-full" />
        </TableCell>
        <TableCell className="text-right">
          <Skeleton className="h-3 w-20 ml-auto" />
        </TableCell>
        <TableCell className="text-right">
          <Skeleton className="h-8 w-16 ml-auto" />
        </TableCell>
      </TableRow>
    ));

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg border-t-4 border-primary">
            <CardHeader className="border-b">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center">
                    <Bell className="h-7 w-7 mr-2.5 text-primary" />{' '}
                    Notifications
                  </CardTitle>
                  <CardDescription className="mt-1">
                    View and manage your recent notifications.
                  </CardDescription>
                </div>
                {/* Action Buttons Dropdown for smaller screens */}
                <div className="sm:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <ListFilter className="h-4 w-4 mr-1.5" /> Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {unreadCount > 0 && (
                        <DropdownMenuItem
                          onClick={handleMarkAllAsRead}
                          disabled={isMarkingAllRead}
                        >
                          <CheckCheck className="mr-2 h-4 w-4" />
                          Mark all read
                        </DropdownMenuItem>
                      )}
                      {allNotifications.length > 0 && (
                        <DropdownMenuItem
                          onClick={() => openClearConfirmDialog('read')}
                          disabled={isProcessingAnyClear}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Clear Read
                        </DropdownMenuItem>
                      )}
                      {allNotifications.length > 0 && (
                        <DropdownMenuItem
                          onClick={() => openClearConfirmDialog('all')}
                          disabled={isProcessingAnyClear}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Clear All
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/user/settings/notifications">
                          <Settings2 className="mr-2 h-4 w-4" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {/* Action Buttons for larger screens */}
                <div className="hidden sm:flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      disabled={isMarkingAllRead}
                    >
                      {isMarkingAllRead && (
                        <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      )}
                      <CheckCheck className="h-4 w-4 mr-1.5" /> Mark all as read
                    </Button>
                  )}
                  {allNotifications.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                          disabled={isProcessingAnyClear}
                        >
                          <Trash2 className="h-4 w-4 mr-1.5" /> Clear
                          {isProcessingAnyClear && (
                            <Loader2 className="h-4 w-4 animate-spin ml-1.5" />
                          )}
                          <ChevronDown className="h-4 w-4 ml-1.5 opacity-70" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openClearConfirmDialog('read')}
                          disabled={isProcessingAnyClear}
                        >
                          Clear Read Notifications
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openClearConfirmDialog('all')}
                          disabled={isProcessingAnyClear}
                          className="text-destructive focus:text-destructive"
                        >
                          Clear ALL Notifications
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs
                value={activeTab}
                onValueChange={(value) =>
                  setActiveTab(value as 'all' | 'unread')
                }
                className="w-full"
              >
                <TabsList className="px-4 pt-4 border-b sticky top-16 bg-card z-10 sm:rounded-t-none">
                  <TabsTrigger value="all">
                    All{' '}
                    <Badge
                      variant={activeTab === 'all' ? 'default' : 'secondary'}
                      className="ml-1.5 px-1.5 py-0 text-xs"
                    >
                      {isLoading
                        ? '...'
                        : notificationsData?.pages[0]?.total || 0}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="unread">
                    Unread{' '}
                    <Badge
                      variant={activeTab === 'unread' ? 'default' : 'secondary'}
                      className="ml-1.5 px-1.5 py-0 text-xs"
                    >
                      {isLoading ? '...' : unreadCount}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                <div className="min-h-[350px] md:min-h-[400px]">
                  {isLoading && !notificationsData?.pages.length ? (
                    <Table>
                      <TableBody>
                        {renderSkeletons(NOTIFICATIONS_PER_PAGE)}
                      </TableBody>
                    </Table>
                  ) : isError ? (
                    <div className="text-center py-12 text-destructive flex flex-col items-center">
                      <XCircle className="h-10 w-10 mb-2" />
                      <p className="font-medium">
                        Failed to load notifications
                      </p>
                      <p className="text-sm mt-1">{error?.message}</p>
                      <Button
                        variant="outline"
                        onClick={() => refetchNotifications()}
                        size="sm"
                        className="mt-3"
                      >
                        <RotateCcw size={14} className="mr-1.5" />
                        Retry
                      </Button>
                    </div>
                  ) : allNotifications.length > 0 ? (
                    <Table className="[&_tr:last-child]:border-0">
                      {' '}
                      {/* Bỏ border cuối */}
                      <TableBody>
                        {allNotifications.map((notification) => (
                          <NotificationItemPageVersion
                            key={notification.notificationId}
                            notification={notification}
                            onActionSuccess={handleSingleNotificationAction}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="py-16 text-center flex flex-col items-center justify-center h-full">
                      <MailOpen className="mx-auto h-16 w-16 text-muted-foreground opacity-30 mb-4" />
                      <h3 className="text-lg font-medium">
                        {activeTab === 'all'
                          ? 'No notifications yet'
                          : "You're all caught up!"}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {activeTab === 'all'
                          ? "We'll let you know when something new happens."
                          : 'No unread notifications.'}
                      </p>
                    </div>
                  )}
                  {hasNextPage && (
                    <div
                      ref={loadMoreRef}
                      className="flex justify-center p-4 border-t"
                    >
                      {isFetchingNextPage ? (
                        <Button
                          variant="outline"
                          disabled
                          className="w-full sm:w-auto opacity-70"
                        >
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                          Loading more...
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => fetchNextPage()}
                          className="w-full sm:w-auto"
                        >
                          Load More Notifications
                        </Button>
                      )}
                    </div>
                  )}
                  {!hasNextPage &&
                    allNotifications.length > 0 &&
                    allNotifications.length >= NOTIFICATIONS_PER_PAGE && (
                      <p className="p-4 text-xs text-center text-muted-foreground border-t">
                        You've reached the end.
                      </p>
                    )}
                </div>
              </Tabs>
            </CardContent>
            <CardFooter className="border-t p-4 text-center">
              <Button
                asChild
                variant="link"
                size="sm"
                className="text-xs text-muted-foreground p-0 h-auto"
              >
                <Link to="/user/settings/notifications">
                  {' '}
                  <Settings2 size={14} className="mr-1.5" /> Notification
                  Settings{' '}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      <ConfirmationDialog
        open={clearConfirmState.isOpen}
        onOpenChange={(open) => {
          if (!open)
            setClearConfirmState((prev) => ({ ...prev, isOpen: false }));
        }}
        onConfirm={handleConfirmClear}
        title={clearConfirmState.title}
        description={clearConfirmState.description}
        confirmText="Yes, Clear"
        confirmVariant="destructive"
        isConfirming={isClearingRead || isClearingAll}
      />
    </Layout>
  );
};

export default NotificationsPage;
