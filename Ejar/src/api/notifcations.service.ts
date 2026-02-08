import API from "./api";

export interface Notification {
  id: number;
  recipient: number;
  notification_type: 'message' | 'inquiry' | 'inquiry_update' | 'review' | 'property_update' | 'system';
  title: string;
  message: string;
  related_object_type?: string;
  related_object_id?: number;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

class NotificationsService {
  private normalizeListResponse<T>(data: unknown): {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
  } {
    if (Array.isArray(data)) {
      return { count: data.length, next: null, previous: null, results: data };
    }
    if (
      data &&
      typeof data === "object" &&
      "results" in data &&
      Array.isArray((data as { results: unknown }).results)
    ) {
      const typed = data as {
        count?: number;
        next?: string | null;
        previous?: string | null;
        results: T[];
      };
      return {
        count: typeof typed.count === "number" ? typed.count : typed.results.length,
        next: typed.next ?? null,
        previous: typed.previous ?? null,
        results: typed.results,
      };
    }
    return { count: 0, next: null, previous: null, results: [] };
  }

  /**
   * Get all notifications for the current user
   */
  async getNotifications(page: number = 1): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: Notification[];
  }> {
    try {
      const res = await API.get(`notifications/?page=${page}`);
      return this.normalizeListResponse<Notification>(res.data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      throw error;
    }
  }

  /**
   * Get unread notifications
   */
  async getUnreadNotifications(): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: Notification[];
  }> {
    try {
      const res = await API.get("notifications/unread/");
      return this.normalizeListResponse<Notification>(res.data);
    } catch (error) {
      console.error("Failed to fetch unread notifications:", error);
      throw error;
    }
  }

  /**
   * Get count of unread notifications
   */
  async getUnreadCount(): Promise<number> {
    try {
      const res = await API.get<{ unread_count: number }>("notifications/unread_count/");
      return res.data.unread_count;
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
      throw error;
    }
  }

  /**
   * Get a specific notification
   */
  async getNotification(id: number): Promise<Notification> {
    try {
      const res = await API.get<Notification>(`notifications/${id}/`);
      return res.data;
    } catch (error) {
      console.error("Failed to fetch notification:", error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: number): Promise<Notification> {
    try {
      const res = await API.post<Notification>(`notifications/${id}/mark_read/`);
      return res.data;
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ message: string; count: number }> {
    try {
      const res = await API.post<{ message: string; count: number }>("notifications/mark_all_read/");
      return res.data;
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: number): Promise<void> {
    try {
      await API.delete(`notifications/${id}/delete_notification/`);
    } catch (error) {
      console.error("Failed to delete notification:", error);
      throw error;
    }
  }
}

export default new NotificationsService();
