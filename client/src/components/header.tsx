import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "./theme-provider";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Menu, Mic, Moon, Sun, X, User, LogOut, LogIn, UserPlus, Settings, Crown, Home, FileText, Volume2, Shield, Users, BarChart3, Bell, ExternalLink, Check } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout, isLoggingOut } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Đơn giản hóa logic thông báo
  const isAdmin = user?.role === "admin";

  // Lấy số thông báo chưa đọc
  const { data: unreadCount = 0 } = useQuery({
    queryKey: isAdmin ? ['/api/admin/notifications/unread', user?.id] : ['/api/user/notifications/unread-count', user?.id],
    enabled: isAuthenticated && !!user?.id,
    refetchInterval: 15000, // 15 giây
    staleTime: 5000,
  });

  // Tính số lượng thông báo chưa đọc
  const displayUnreadCount = isAdmin 
    ? (Array.isArray(unreadCount) ? unreadCount.length : 0)
    : (typeof unreadCount === 'number' ? unreadCount : 0);

  // Lấy danh sách thông báo để hiển thị trong dropdown
  const { data: notificationsList } = useQuery({
    queryKey: isAdmin ? ['/api/admin/notifications', user?.id] : ['/api/user/notifications', user?.id],
    enabled: isAuthenticated && !!user?.id,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Mutation để đánh dấu thông báo đã đọc
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const endpoint = isAdmin 
        ? `/api/admin/notifications/${notificationId}/read`
        : `/api/user/notifications/${notificationId}/read`;
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Refresh cả 2 query
      queryClient.invalidateQueries({ 
        queryKey: isAdmin ? ['/api/admin/notifications/unread', user?.id] : ['/api/user/notifications/unread-count', user?.id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: isAdmin ? ['/api/admin/notifications', user?.id] : ['/api/user/notifications', user?.id] 
      });
    },
  });

  // Đơn giản hóa xử lý click notification
  const handleNotificationClick = (notification: any) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigation logic dựa trên user role
    if (isAdmin) {
      // Admin: redirect đến admin panel với tab tương ứng
      if (notification.type === 'user' || notification.title?.includes('Người dùng mới')) {
        setLocation('/admin?tab=users');
      } else if (notification.type === 'payment' || notification.title?.includes('thanh toán') || notification.title?.includes('Biên lai')) {
        setLocation('/admin?tab=payments');
      } else if (notification.type === 'audio' || notification.title?.includes('File âm thanh')) {
        setLocation('/admin?tab=audio');
      } else {
        setLocation('/admin?tab=notifications');
      }
    } else {
      // User: redirect đến trang tương ứng
      if (notification.type === 'payment' || notification.type === 'upgrade' || notification.type === 'expiry_warning') {
        setLocation('/pricing');
      } else if (notification.type === 'audio_created' || notification.type === 'welcome') {
        setLocation('/dashboard');
      } else {
        setLocation('/notifications');
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment': return '💰';
      case 'user': return '👤';
      case 'system': return '⚙️';
      case 'audio': return '🎵';
      case 'audio_created': return '🎵';
      case 'welcome': return '👋';
      case 'upgrade': return '⭐';
      case 'expiry_warning': return '⚠️';
      default: return '📢';
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <header className="gradient-primary sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Mic className="text-xl text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">VoiceText Pro</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <button
              onClick={() => scrollToSection("tts-tool")}
              className="text-white hover:text-yellow-300 transition-colors duration-200 font-medium"
            >
              Công cụ TTS
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="text-white hover:text-yellow-300 transition-colors duration-200 font-medium"
            >
              Tính năng
            </button>
            <button
              onClick={() => scrollToSection("file-manager")}
              className="text-white hover:text-yellow-300 transition-colors duration-200 font-medium"
            >
              Quản lý File
            </button>
            <Link href="/pricing">
              <button className="text-white hover:text-yellow-300 transition-colors duration-200 font-medium">
                Bảng giá
              </button>
            </Link>
            
            {/* Additional links for authenticated users */}
            {isAuthenticated && (
              <>
                <Link href="/features">
                  <button className="text-white hover:text-yellow-300 transition-colors duration-200 font-medium">
                    Chi tiết tính năng
                  </button>
                </Link>
              </>
            )}
          </nav>

          {/* Auth & Theme Toggle & Mobile Menu */}
          <div className="flex items-center space-x-4">
            {/* Notification Bell Dropdown for All Users */}
            {isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="relative bg-white/20 hover:bg-white/30 text-white hover:text-white p-2"
                  >
                    <Bell className="h-5 w-5" />
                    {displayUnreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold"
                      >
                        {displayUnreadCount > 99 ? '99+' : displayUnreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                  <div className="px-3 py-2 font-semibold border-b">
                    Thông báo ({displayUnreadCount > 0 ? `${displayUnreadCount} mới` : 'Không có mới'})
                  </div>
                  
                  {!notificationsList ? (
                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                      Đang tải...
                    </div>
                  ) : (
                    <>
                      {Array.isArray(notificationsList) && notificationsList.length > 0 ? (
                        <>
                          {notificationsList.slice(0, 5).map((notification: any) => (
                            <DropdownMenuItem
                              key={notification.id}
                              className={`cursor-pointer p-3 focus:bg-accent ${
                                !notification.isRead ? 'bg-blue-50 hover:bg-blue-100' : ''
                              }`}
                              onSelect={() => handleNotificationClick(notification)}
                            >
                              <div className="flex items-start gap-3 w-full">
                                <span className="text-lg mt-1">
                                  {getNotificationIcon(notification.type)}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium text-sm truncate">
                                      {notification.title}
                                    </p>
                                    {!notification.isRead && (
                                      <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                                    {notification.message || notification.content}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(notification.createdAt).toLocaleString('vi-VN')}
                                  </p>
                                </div>
                                <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              </div>
                            </DropdownMenuItem>
                          ))}
                          
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={isAdmin ? "/admin?tab=notifications" : "/notifications"}>
                              <div className="w-full text-center py-2 text-sm font-medium text-primary">
                                Xem tất cả thông báo
                              </div>
                            </Link>
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                          Không có thông báo nào
                        </div>
                      )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Authentication buttons */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white hover:text-white">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-white/30 text-white text-sm">
                        {user?.fullName?.charAt(0) || user?.username?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm font-medium">
                      {user?.fullName || user?.username}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem disabled>
                    <User className="mr-2 h-4 w-4" />
                    <span>{user?.email}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>

                  {user?.subscriptionType !== "premium" && (
                    <DropdownMenuItem asChild>
                      <Link href="/pricing">
                        <Crown className="mr-2 h-4 w-4" />
                        <span>Nâng cấp</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user?.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Quản lý Admin</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={logout} disabled={isLoggingOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="bg-white/20 hover:bg-white/30 text-white hover:text-white">
                    <LogIn className="mr-2 h-4 w-4" />
                    Đăng nhập
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="ghost" size="sm" className="bg-white/20 hover:bg-white/30 text-white hover:text-white">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Đăng ký
                  </Button>
                </Link>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors duration-200 text-white hover:text-white"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors duration-200 text-white hover:text-white"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/10 backdrop-blur-sm">
          <div className="px-4 py-4 space-y-2">
            <button
              onClick={() => scrollToSection("tts-tool")}
              className="block w-full text-left py-2 text-white hover:text-yellow-300 transition-colors duration-200"
            >
              Công cụ TTS
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="block w-full text-left py-2 text-white hover:text-yellow-300 transition-colors duration-200"
            >
              Tính năng
            </button>
            <button
              onClick={() => scrollToSection("file-manager")}
              className="block w-full text-left py-2 text-white hover:text-yellow-300 transition-colors duration-200"
            >
              Quản lý File
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="block w-full text-left py-2 text-white hover:text-yellow-300 transition-colors duration-200"
            >
              Bảng giá
            </button>
            
            {/* Additional mobile links for authenticated users */}
            {isAuthenticated && (
              <>
                <Link href="/features">
                  <button className="block w-full text-left py-2 text-white hover:text-yellow-300 transition-colors duration-200">
                    Chi tiết tính năng
                  </button>
                </Link>
              </>
            )}
            
            {/* Mobile Auth Menu */}
            <div className="border-t border-white/20 pt-2 mt-4">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="text-white/80 text-sm py-2">
                    Xin chào, {user?.fullName || user?.username}
                  </div>
                  <button
                    onClick={logout}
                    disabled={isLoggingOut}
                    className="block w-full text-left py-2 text-white hover:text-yellow-300 transition-colors duration-200"
                  >
                    {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link href="/login">
                    <button 
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-left py-2 text-white hover:text-yellow-300 transition-colors duration-200"
                    >
                      Đăng nhập
                    </button>
                  </Link>
                  <Link href="/register">
                    <button 
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-left py-2 text-white hover:text-yellow-300 transition-colors duration-200"
                    >
                      Đăng ký
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
