import { useState, useCallback } from "react";
import notificationsService, { type Notification } from "@/api/notifications.service";

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadNotifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: (page?: number) => Promise<void>;
  fetchUnreadNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await notificationsService.getNotifications(page);
      setNotifications(data.results);
      setUnreadCount(data.results.filter((n) => !n.is_read).length);
    } catch (err) {
      setError("Failed to load notifications");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUnreadNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await notificationsService.getUnreadNotifications();
      setUnreadNotifications(data.results);
      setUnreadCount(data.results.length);
    } catch (err) {
      setError("Failed to load unread notifications");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationsService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  }, []);

  const markAsRead = useCallback(
    async (id: number) => {
      setError(null);
      try {
        await notificationsService.markAsRead(id);
        
        
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
        setUnreadNotifications((prev) => prev.filter((n) => n.id !== id));
        
       
        await fetchUnreadCount();
      } catch (err) {
        setError("Failed to mark as read");
        console.error(err);
      }
    },
    [fetchUnreadCount]
  );

  const markAllAsRead = useCallback(async () => {
    setError(null);
    try {
      await notificationsService.markAllAsRead();
      
     
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      setError("Failed to mark all as read");
      console.error(err);
    }
  }, []);

  const deleteNotification = useCallback(
    async (id: number) => {
      setError(null);
      try {
        await notificationsService.deleteNotification(id);
        
        
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setUnreadNotifications((prev) => prev.filter((n) => n.id !== id));
        
      
        await fetchUnreadCount();
      } catch (err) {
        setError("Failed to delete notification");
        console.error(err);
      }
    },
    [fetchUnreadCount]
  );

  return {
    notifications,
    unreadNotifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    fetchUnreadNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};
