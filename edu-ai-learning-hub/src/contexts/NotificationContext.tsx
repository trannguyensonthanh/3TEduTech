/* eslint-disable @typescript-eslint/no-explicit-any */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useToast } from '@/hooks/use-toast';

// Define notification types and interfaces
export type NotificationVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info';

export interface Notification {
  id: string;
  title: string;
  message: string;
  variant: NotificationVariant;
  read?: boolean;
  timestamp: Date;
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider'
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Load notifications from localStorage on component mount
  useEffect(() => {
    const storedNotifications = localStorage.getItem('3tedutech-notifications');
    if (storedNotifications) {
      try {
        // Parse stored notifications and convert string timestamps back to Date objects
        const parsedNotifications = JSON.parse(storedNotifications);
        setNotifications(
          parsedNotifications.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp),
          }))
        );
      } catch (error) {
        console.error('Failed to parse stored notifications:', error);
      }
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(
      '3tedutech-notifications',
      JSON.stringify(notifications)
    );
  }, [notifications]);

  const addNotification = (
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ) => {
    const generateUniqueId = () => Math.random().toString(36).substr(2, 9);

    const newNotification: Notification = {
      ...notification,
      id: generateUniqueId(),
      timestamp: new Date(),
      read: false,
    };

    setNotifications((prev) => [newNotification, ...prev.slice(0, 49)]); // Keep max 50 notifications

    // Show toast for new notification
    toast({
      title: notification.title,
      description: notification.message,
      variant:
        notification.variant === 'destructive' ? 'destructive' : 'default',
    });
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
