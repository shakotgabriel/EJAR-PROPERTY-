import React, { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, Trash2, CheckCheck, Loader } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

const notificationTypeColors: Record<string, { bg: string; text: string; icon: string }> = {
  message: { bg: "bg-blue-100", text: "text-blue-600", icon: "💬" },
  inquiry: { bg: "bg-green-100", text: "text-green-600", icon: "❓" },
  inquiry_update: { bg: "bg-purple-100", text: "text-purple-600", icon: "📝" },
  review: { bg: "bg-yellow-100", text: "text-yellow-600", icon: "⭐" },
  property_update: { bg: "bg-indigo-100", text: "text-indigo-600", icon: "🏠" },
  system: { bg: "bg-gray-100", text: "text-gray-600", icon: "⚙️" },
};

const Notifications: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  const handleMarkAsRead = async (id: number) => {
    await markAsRead(id);
  };

  const handleDelete = async (id: number) => {
    await deleteNotification(id);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="rounded-3xl shadow-2xl border border-white/50 backdrop-blur bg-white/90">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-8 h-8 text-blue-600" />
                <div>
                  <CardTitle className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Notifications
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
                  </p>
                </div>
              </div>

              {unreadCount > 0 && (
                <Button
                  onClick={handleMarkAllRead}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <CheckCheck className="w-4 h-4 mr-2" />
                  Mark All Read
                </Button>
              )}
            </div>
          </CardHeader>

          <Separator />

          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {isLoading && (!notifications || notifications.length === 0) ? (
              <div className="flex justify-center py-12">
                <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : !notifications || notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No notifications yet</p>
                <p className="text-gray-400 text-sm mt-2">
                  You'll receive notifications about messages, property inquiries, and updates here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => {
                  const colors = notificationTypeColors[notification.notification_type] || notificationTypeColors.system;
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-xl border transition ${
                        notification.is_read
                          ? 'bg-white border-gray-200'
                          : 'bg-white border-indigo-200 ring-2 ring-indigo-100'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 ${colors.bg}`}
                        >
                          {colors.icon}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3
                                className={`font-semibold text-lg ${
                                  notification.is_read ? 'text-gray-700' : 'text-gray-900'
                                }`}
                              >
                                {notification.title}
                              </h3>
                              <p
                                className={`text-sm mt-1 ${
                                  notification.is_read
                                    ? 'text-gray-600'
                                    : 'text-gray-700 font-medium'
                                }`}
                              >
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(notification.created_at).toLocaleString()}
                              </p>
                            </div>

                            {!notification.is_read && (
                              <div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                            )}
                          </div>

                          <div className="flex gap-2 mt-3">
                            {!notification.is_read && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="text-xs h-8"
                              >
                                <CheckCheck className="w-3 h-3 mr-1" />
                                Mark Read
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(notification.id)}
                              className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Notifications;
