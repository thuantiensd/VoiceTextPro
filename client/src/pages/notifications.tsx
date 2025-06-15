import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, BellOff, Check, CheckCheck, Trash2, ArrowLeft, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { formatVietnamDate } from "@shared/datetime";
import { Link, useLocation } from "wouter";

export default function NotificationsPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Fetch user notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["/api/user/notifications"],
    enabled: isAuthenticated,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["/api/user/notifications/unread-count"],
    enabled: isAuthenticated,
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await apiRequest("PATCH", `/api/user/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/notifications/unread-count"] });
      // Force header bell icon to refresh with user ID
      queryClient.refetchQueries({ queryKey: ['/api/user/notifications/unread-count', user?.id] });
      toast({
        title: "Thành công",
        description: "Đã đánh dấu thông báo là đã đọc",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thông báo",
        variant: "destructive",
      });
    },
  });

  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/user/notifications/mark-all-read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/notifications/unread-count"] });
      // Force header bell icon to refresh with user ID
      queryClient.refetchQueries({ queryKey: ['/api/user/notifications/unread-count', user?.id] });
      toast({
        title: "Thành công",
        description: "Đã đánh dấu tất cả thông báo là đã đọc",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thông báo",
        variant: "destructive",
      });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await apiRequest("DELETE", `/api/user/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/notifications/unread-count"] });
      // Force header bell icon to refresh with user ID
      queryClient.refetchQueries({ queryKey: ['/api/user/notifications/unread-count', user?.id] });
      toast({
        title: "Thành công",
        description: "Đã xóa thông báo",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa thông báo",
        variant: "destructive",
      });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "payment":
        return "💳";
      case "system":
        return "⚙️";
      case "welcome":
        return "👋";
      case "upgrade":
        return "⬆️";
      case "expiry_warning":
        return "⚠️";
      case "audio_created":
        return "🎵";
      default:
        return "📢";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "payment":
        return "bg-green-500";
      case "system":
        return "bg-blue-500";
      case "welcome":
        return "bg-purple-500";
      case "upgrade":
        return "bg-orange-500";
      case "expiry_warning":
        return "bg-red-500";
      case "audio_created":
        return "bg-indigo-500";
      default:
        return "bg-gray-500";
    }
  };

  // Handle notification click with link navigation
  const handleNotificationClick = (notification: any) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Check if notification has a link to navigate to
    const linkMap: Record<string, string> = {
              "payment": "/features",
        "upgrade": "/features", 
        "expiry_warning": "/features",
      "audio_created": "/dashboard",
      "welcome": "/dashboard"
    };

    const targetRoute = linkMap[notification.type];
    if (targetRoute) {
      setLocation(targetRoute);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Cần đăng nhập
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Vui lòng đăng nhập để xem thông báo
              </p>
              <Link href="/login">
                <Button>Đăng nhập</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Bell className="h-8 w-8" />
                Thông báo
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Quản lý thông báo của bạn {Array.isArray(notifications) && notifications.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {unreadCount as number} chưa đọc
                  </Badge>
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {Array.isArray(notifications) && unreadCount as number > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Đánh dấu tất cả đã đọc
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : Array.isArray(notifications) && notifications.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <BellOff className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Không có thông báo
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Bạn chưa có thông báo nào. Các thông báo mới sẽ xuất hiện ở đây.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="grid gap-4">
              {Array.isArray(notifications) && notifications.map((notification: any) => (
                <Card 
                  key={notification.id} 
                  className={`transition-all hover:shadow-md cursor-pointer ${
                    !notification.isRead ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          !notification.isRead ? 'bg-blue-500' : 'bg-gray-300'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {notification.title}
                            </h3>
                            {notification.type === "payment" || 
                             notification.type === "upgrade" || 
                             notification.type === "expiry_warning" || 
                             notification.type === "audio_created" ||
                             notification.type === "welcome" ? (
                              <ExternalLink className="h-4 w-4 text-gray-400" />
                            ) : null}
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-2">
                            {notification.content}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                              {formatVietnamDate(notification.createdAt)}
                            </span>
                            <Badge variant="outline" className={getNotificationColor(notification.type)}>
                              {notification.type === "payment" && "Thanh toán"}
                              {notification.type === "system" && "Hệ thống"}
                              {notification.type === "welcome" && "Chào mừng"}
                              {notification.type === "upgrade" && "Nâng cấp"}
                              {notification.type === "expiry_warning" && "Cảnh báo"}
                              {notification.type === "audio_created" && "File âm thanh"}
                              {!["payment", "system", "welcome", "upgrade", "expiry_warning", "audio_created"].includes(notification.type) && "Khác"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsReadMutation.mutate(notification.id);
                            }}
                            disabled={markAsReadMutation.isPending}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotificationMutation.mutate(notification.id);
                          }}
                          disabled={deleteNotificationMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}