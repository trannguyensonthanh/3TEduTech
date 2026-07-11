import { useCallback } from 'react';
import {
  useNotifications,
  NotificationVariant,
} from '@/contexts/NotificationContext';

export const useNotification = () => {
  const { addNotification } = useNotifications();

  const notify = useCallback(
    (
      title: string,
      message: string,
      options?: { variant?: NotificationVariant; link?: string }
    ) => {
      addNotification({
        title,
        message,
        variant: options?.variant || 'default',
        link: options?.link,
      });
    },
    [addNotification]
  );

  const notifySuccess = useCallback(
    (title: string, message: string, link?: string) => {
      notify(title, message, { variant: 'success', link });
    },
    [notify]
  );

  const notifyError = useCallback(
    (title: string, message: string, link?: string) => {
      notify(title, message, { variant: 'destructive', link });
    },
    [notify]
  );

  const notifyWarning = useCallback(
    (title: string, message: string, link?: string) => {
      notify(title, message, { variant: 'warning', link });
    },
    [notify]
  );

  const notifyInfo = useCallback(
    (title: string, message: string, link?: string) => {
      notify(title, message, { variant: 'info', link });
    },
    [notify]
  );

  return {
    notify,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
  };
};
