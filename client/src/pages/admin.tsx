import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { 
  Users, 
  AudioLines, 
  Settings, 
  TrendingUp, 
  FileText, 
  Volume2, 
  CreditCard, 
  Mic, 
  Database,
  Monitor,
  Calendar,
  DollarSign,
  Activity,
  Headphones,
  Download,
  Upload,
  BarChart3,
  PieChart,
  Shield,
  Home,
  Palette,
  Bell,
  Lock,
  Zap,
  Clock,
  Target,
  Play,
  Pause,
  Square,
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Ban,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  MoreHorizontal,
  AlertTriangle,
  Info,
  LogOut,
  Plus,
  FileX,
  Star,
  Sparkles,
  Gem,
  Crown,
  Rocket,
  Image,
  Key
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Breadcrumb from "@/components/breadcrumb";

import type { 
  User, 
  AudioFile, 
  Payment, 
  ActivityLog, 
  SystemMetric, 
  SupportTicket,
  PaymentSettings,
  UpdatePaymentSettings
} from "@shared/schema";

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isLockUserOpen, setIsLockUserOpen] = useState(false);
  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [lockingUser, setLockingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [lockReason, setLockReason] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isPaymentDetailOpen, setIsPaymentDetailOpen] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  
  // Admin Settings State
  const [adminSettings, setAdminSettings] = useState<any>({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    role: "user",
    subscriptionType: "free"
  });
  const [editUserData, setEditUserData] = useState({
    username: "",
    email: "",
    fullName: "",
    role: "user",
    subscriptionType: "free",
    isActive: true
  });

  // Sync URL params với activeTab state
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ['overview', 'notifications', 'users', 'audio', 'payments', 'settings-menu', 'system-status'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []); // Chỉ chạy một lần khi component mount

  // Handle returnTab từ URL parameters - để quay lại đúng tab
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const returnTab = params.get('returnTab');
      if (returnTab && ['overview', 'notifications', 'users', 'audio', 'payments', 'settings-menu', 'system-status'].includes(returnTab)) {
        // Replace current URL để remove returnTab parameter
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('returnTab');
        newUrl.searchParams.set('tab', returnTab);
        window.history.replaceState({}, '', newUrl.toString());
        setActiveTab(returnTab);
      }
    };

    // Check immediately on mount
    handlePopState();
    
    // Listen for browser back/forward navigation
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Check admin authentication first
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  // Fetch data
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    retry: false,
  });

  const { data: audioFiles, isLoading: audioFilesLoading } = useQuery({
    queryKey: ["/api/admin/audio-files"],
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/admin/payments"],
  });

  const { data: activityLogs, isLoading: activityLogsLoading } = useQuery({
    queryKey: ["/api/admin/activity-logs"],
  });

  const { data: systemMetrics, isLoading: systemMetricsLoading } = useQuery({
    queryKey: ["/api/admin/system-metrics"],
  });

  const { data: supportTickets, isLoading: supportTicketsLoading } = useQuery({
    queryKey: ["/api/admin/support-tickets"],
  });

  const { data: notifications, isLoading: notificationsLoading, refetch: refetchNotifications } = useQuery({
    queryKey: ["/api/admin/notifications"],
  });

  // Query riêng cho thông báo chưa đọc để hiển thị badge
  const { data: unreadNotifications, refetch: refetchUnreadNotifications } = useQuery({
    queryKey: ['/api/admin/notifications/unread'],
    refetchInterval: 15000, // Refresh mỗi 15 giây
    retry: false,
  });

  // Fetch admin settings
  const { data: settingsData, isLoading: settingsDataLoading } = useQuery({
    queryKey: ["/api/admin/settings"],
    retry: false,
  });

  // Load settings data into state
  useEffect(() => {
    if (settingsData) {
      setAdminSettings(settingsData);
    }
  }, [settingsData]);

  const unreadCount = Array.isArray(unreadNotifications) ? unreadNotifications.length : 0;

  // Mutation để đánh dấu thông báo đã đọc
  const markNotificationReadMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("PATCH", `/api/admin/notifications/${id}/read`, {});
    },
    onSuccess: () => {
      // Invalidate both queries to force fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications/unread"] });
    }
  });

  // Mutation để đánh dấu tất cả thông báo đã đọc
  const markAllNotificationsReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", "/api/admin/notifications/read-all", {});
    },
    onSuccess: () => {
      // Invalidate both queries to force fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications/unread"] });
      toast({
        title: "Thành công",
        description: "Đã đánh dấu tất cả thông báo là đã đọc"
      });
    }
  });

  // Mutation để xóa tất cả thông báo
  const clearAllNotificationsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/admin/notifications/clear-all", {});
    },
    onSuccess: () => {
      // Invalidate both queries to force fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications/unread"] });
      toast({
        title: "Thành công",
        description: "Đã xóa tất cả thông báo"
      });
    }
  });

  // Hàm xử lý click thông báo để điều hướng
  const handleNotificationClick = (notification: any) => {
    // Đánh dấu đã đọc nếu chưa đọc
    if (!notification.isRead) {
      markNotificationReadMutation.mutate(notification.id);
    }
    
    // Điều hướng đến tab tương ứng dựa trên loại thông báo
    let targetTab = "overview";
    let tabName = "";
    
    switch (notification.type) {
      case "payment":
        targetTab = "payments";
        tabName = "Quản lý thanh toán";
        break;
      case "user":
        targetTab = "users";
        tabName = "Quản lý người dùng";
        break;
      case "system":
        targetTab = "settings-menu";
        tabName = "Cài đặt hệ thống";
        break;
      case "audio":
        targetTab = "audio";
        tabName = "Quản lý audio";
        break;
      default:
        targetTab = "overview";
        tabName = "Tổng quan";
        break;
    }
    
    setActiveTab(targetTab);
    
    // Hiển thị thông báo xác nhận
    toast({
      title: "Đã chuyển đến",
      description: `Chuyển đến tab ${tabName}`,
    });
  };

  // Hàm lọc thông báo theo danh mục
  const getFilteredNotifications = () => {
    if (!notifications) return [];
    
    const allNotifications = notifications as any[];
    
    switch (notificationFilter) {
      case "user":
        return allNotifications.filter(n => 
          n.type === "user" && 
          (n.title.includes("đăng ký") || n.title.includes("tài khoản"))
        );
      case "payment":
        return allNotifications.filter(n => 
          n.type === "payment" || 
          n.title.includes("thanh toán") || 
          n.title.includes("nâng cấp")
        );
      case "system":
        return allNotifications.filter(n => n.type === "system");
      case "audio":
        return allNotifications.filter(n => 
          n.title.includes("File âm thanh") || 
          n.title.includes("audio")
        );
      default:
        return allNotifications;
    }
  };

  // Đếm số thông báo theo từng loại
  const getNotificationCounts = () => {
    if (!notifications) return { all: 0, user: 0, payment: 0, system: 0, audio: 0 };
    
    const allNotifications = notifications as any[];
    
    return {
      all: allNotifications.length,
      user: allNotifications.filter(n => 
        n.type === "user" && 
        (n.title.includes("đăng ký") || n.title.includes("tài khoản"))
      ).length,
      payment: allNotifications.filter(n => 
        n.type === "payment" || 
        n.title.includes("thanh toán") || 
        n.title.includes("nâng cấp")
      ).length,
      system: allNotifications.filter(n => n.type === "system").length,
      audio: allNotifications.filter(n => 
        n.title.includes("File âm thanh") || 
        n.title.includes("audio")
      ).length
    };
  };

  const notificationCounts = getNotificationCounts();
  const filteredNotifications = getFilteredNotifications();

  // Mutation để xác nhận thanh toán
  const confirmPaymentMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      return await apiRequest("PUT", `/api/admin/payments/${paymentId}/confirm`, {});
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xác nhận thanh toán và nâng cấp tài khoản người dùng"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error) => {
      toast({
        title: "Lỗi", 
        description: "Không thể xác nhận thanh toán",
        variant: "destructive"
      });
    }
  });

  // Mutation để từ chối thanh toán
  const rejectPaymentMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      return await apiRequest("PUT", `/api/admin/payments/${paymentId}/reject`, {});
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã từ chối thanh toán"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
    },
    onError: (error) => {
      toast({
        title: "Lỗi", 
        description: "Không thể từ chối thanh toán",
        variant: "destructive"
      });
    }
  });

  // Mutation để tạo người dùng mới
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      return await apiRequest("POST", "/api/admin/users", userData);
    },
    onSuccess: () => {
      toast({
        title: "Tạo người dùng thành công",
        description: "Người dùng mới đã được thêm vào hệ thống",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsCreateUserOpen(false);
      setNewUser({
        username: "",
        email: "",
        password: "",
        fullName: "",
        role: "user",
        subscriptionType: "free"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi tạo người dùng",
        description: error.message || "Có lỗi xảy ra khi tạo người dùng",
        variant: "destructive",
      });
    },
  });

  // Mutation để cập nhật người dùng
  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: number; userData: typeof editUserData }) => {
      const { id, userData } = data;
      return await apiRequest("PUT", `/api/admin/users/${id}`, userData);
    },
    onSuccess: () => {
      toast({
        title: "Cập nhật thành công",
        description: "Thông tin người dùng đã được cập nhật",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsEditUserOpen(false);
      setEditingUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi cập nhật",
        description: error.message || "Có lỗi xảy ra khi cập nhật người dùng",
        variant: "destructive",
      });
    },
  });

  // Mutation để khóa/mở khóa tài khoản
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive, reason }: { userId: number, isActive: boolean, reason?: string }) => {
      return await apiRequest("PUT", `/api/admin/users/${userId}/status`, {
        isActive,
        lockReason: reason
      });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật trạng thái tài khoản"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsLockUserOpen(false);
      setLockingUser(null);
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái tài khoản",
        variant: "destructive"
      });
    }
  });

  // Mutation để xóa người dùng
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest("DELETE", `/api/admin/users/${userId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xóa người dùng khỏi hệ thống"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsDeleteUserOpen(false);
      setDeletingUser(null);
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa người dùng",
        variant: "destructive"
      });
    }
  });

  // Hàm mở dialog chỉnh sửa
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUserData({
      username: user.username,
      email: user.email,
      fullName: user.fullName || "",
      role: user.role,
      subscriptionType: user.subscriptionType,
      isActive: user.isActive
    });
    setIsEditUserOpen(true);
  };

  // Hàm xem chi tiết người dùng
  const handleViewUser = (user: User) => {
    toast({
      title: "Thông tin người dùng",
      description: `${user.fullName} (${user.username}) - ${user.email}`,
    });
  };

  // Hàm khóa/mở khóa tài khoản
  const handleToggleUserStatus = (user: User) => {
    if (user.isActive) {
      // Nếu đang hoạt động, mở dialog để nhập lý do khóa
      setLockingUser(user);
      setLockReason("");
      setIsLockUserOpen(true);
    } else {
      // Nếu đang khóa, mở khóa ngay lập tức
      toggleUserStatusMutation.mutate({
        userId: user.id,
        isActive: true
      });
    }
  };

  // Hàm xác nhận khóa tài khoản với lý do
  const handleConfirmLockUser = () => {
    if (!lockingUser || !lockReason.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập lý do khóa tài khoản",
        variant: "destructive",
      });
      return;
    }

    updateUserMutation.mutate({
      id: lockingUser.id,
      userData: {
        isActive: false,
        lockReason: lockReason.trim()
      } as any
    }, {
      onSuccess: () => {
        toast({
          title: "Khóa tài khoản thành công",
          description: `Tài khoản ${lockingUser.username} đã bị khóa`,
        });
        setIsLockUserOpen(false);
        setLockingUser(null);
        setLockReason("");
      },
      onError: (error: any) => {
        toast({
          title: "Lỗi",
          description: `Không thể khóa tài khoản: ${error.message}`,
          variant: "destructive",
        });
      }
    });
  };

  // Hàm xóa người dùng
  const handleDeleteUser = (user: User) => {
    setDeletingUser(user);
    setIsDeleteUserOpen(true);
  };

  // Hàm xác nhận xóa người dùng
  const handleConfirmDeleteUser = () => {
    if (!deletingUser) return;
    deleteUserMutation.mutate(deletingUser.id);
  };

  // Hàm đăng xuất
  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      toast({
        title: "Đăng xuất thành công",
        description: "Bạn đã đăng xuất khỏi hệ thống quản trị",
      });
      // Chuyển hướng về trang đăng nhập admin
      window.location.href = "/admin-login";
    } catch (error) {
      toast({
        title: "Lỗi đăng xuất",
        description: "Có lỗi xảy ra khi đăng xuất",
        variant: "destructive",
      });
    }
  };

  // Handle settings update
  const handleSettingUpdate = async (category: string, key: string, value: string, type: string = 'string', description: string = '') => {
    setSettingsSaving(true);
    try {
      await apiRequest("PUT", "/api/admin/settings", {
        category,
        key,
        value,
        type,
        description
      });
      
      // Update local state
      setAdminSettings((prev: any) => ({
        ...prev,
        [category]: {
          ...prev[category],
          [key]: { value, type, description }
        }
      }));
      
      toast({
        title: "Thành công",
        description: "Cập nhật cấu hình thành công"
      });
    } catch (error) {
      console.error("Error updating setting:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật cấu hình",
        variant: "destructive"
      });
    } finally {
      setSettingsSaving(false);
    }
  };

  // Check authentication first
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // If not admin, redirect to admin login
  if (!currentUser || (currentUser as any).role !== "admin") {
    // Use window.location.href for immediate redirect
    window.location.href = "/admin-login";
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Loading state for data
  if (usersLoading || audioFilesLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Calculate stats
  const totalUsers = (users as any[])?.length || 0;
  const activeUsers = (users as any[])?.filter((user: User) => user.isActive).length || 0;
  const proUsers = (users as any[])?.filter((user: User) => user.subscriptionType === "pro").length || 0;
  const premiumUsers = (users as any[])?.filter((user: User) => user.subscriptionType === "premium").length || 0;
  
  const totalAudioFiles = (audioFiles as any[])?.length || 0;
  const totalStorageUsed = (audioFiles as any[])?.reduce((acc: number, file: AudioFile) => acc + file.fileSize, 0) || 0;
  
  const totalRevenue = (payments as any[])?.reduce((acc: number, payment: Payment) => acc + payment.amount, 0) || 0;
  const pendingPayments = (payments as any[])?.filter((payment: Payment) => payment.status === "pending").length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-2 sm:p-4">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-gradient-to-r from-blue-300/20 to-purple-300/20 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-gradient-to-r from-purple-300/20 to-pink-300/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-gradient-to-r from-pink-300/20 to-yellow-300/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 relative z-10">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg rounded-2xl p-4 border border-white/20 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  VoiceText Pro Admin
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Quản trị hệ thống</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Home Button */}
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border-white/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300"
              onClick={() => window.location.href = '/'}
            >
              <Home className="h-4 w-4" />
              Trang chủ
            </Button>
            {/* Enhanced Notification Bell */}
            <Button 
              variant="outline" 
              size="sm"
              className="relative bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border-white/30 hover:bg-white/80 dark:hover:bg-slate-600/80 transition-all duration-300"
              onClick={() => setActiveTab("notifications")}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold bg-gradient-to-r from-red-500 to-pink-500 animate-pulse"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
            {/* Enhanced Logout Button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border-white/30 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800 transition-all duration-300"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 h-auto bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border border-white/20 rounded-2xl p-1">
            <TabsTrigger 
              value="overview" 
              className="text-xs sm:text-sm p-3 flex items-center gap-2 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/50 dark:hover:bg-slate-700/50"
            >
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Tổng quan</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="text-xs sm:text-sm p-3 flex items-center gap-2 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/50 dark:hover:bg-slate-700/50 relative"
            >
              <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Thông báo</span>
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="text-xs sm:text-sm p-3 flex items-center gap-2 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/50 dark:hover:bg-slate-700/50"
            >
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Người dùng</span>
            </TabsTrigger>
            <TabsTrigger 
              value="audio" 
              className="text-xs sm:text-sm p-3 flex items-center gap-2 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/50 dark:hover:bg-slate-700/50"
            >
              <AudioLines className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Audio</span>
            </TabsTrigger>
            <TabsTrigger 
              value="payments" 
              className="text-xs sm:text-sm p-3 flex items-center gap-2 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/50 dark:hover:bg-slate-700/50"
            >
              <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Thanh toán</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings-menu" 
              className="text-xs sm:text-sm p-3 flex items-center gap-2 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-500 data-[state=active]:to-gray-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/50 dark:hover:bg-slate-700/50"
            >
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Cài đặt</span>
            </TabsTrigger>
            <TabsTrigger 
              value="system-status" 
              className="text-xs sm:text-sm p-3 flex items-center gap-2 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/50 dark:hover:bg-slate-700/50"
            >
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Trạng thái</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Users Card */}
              <Card className="bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-cyan-500/10 border-blue-200/50 dark:border-blue-700/50 hover:shadow-lg hover:scale-105 transition-all duration-300 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Tổng người dùng</CardTitle>
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg shadow-lg">
                    <Users className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{totalUsers}</div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center">
                    <Star className="h-3 w-3 mr-1 text-yellow-500" />
                    {activeUsers} đang hoạt động
                  </p>
                  <div className="mt-2 flex gap-2">
                    <div className="text-xs text-green-600 font-medium">+12%</div>
                    <div className="text-xs text-gray-500">so với tháng trước</div>
                  </div>
                </CardContent>
              </Card>

              {/* Audio Files Card */}
              <Card className="bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-pink-500/10 border-purple-200/50 dark:border-purple-700/50 hover:shadow-lg hover:scale-105 transition-all duration-300 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Audio Files</CardTitle>
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg shadow-lg">
                    <AudioLines className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{totalAudioFiles}</div>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    {(totalStorageUsed / (1024 * 1024)).toFixed(1)} MB sử dụng
                  </p>
                  <div className="mt-2 flex gap-2">
                    <div className="text-xs text-green-600 font-medium">+8%</div>
                    <div className="text-xs text-gray-500">files mới tuần này</div>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Card */}
              <Card className="bg-gradient-to-br from-emerald-500/10 via-emerald-400/5 to-teal-500/10 border-emerald-200/50 dark:border-emerald-700/50 hover:shadow-lg hover:scale-105 transition-all duration-300 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Doanh thu</CardTitle>
                  <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg shadow-lg">
                    <DollarSign className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{totalRevenue.toLocaleString()}₫</div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    {pendingPayments} thanh toán chờ xử lý
                  </p>
                  <div className="mt-2 flex gap-2">
                    <div className="text-xs text-green-600 font-medium">+24%</div>
                    <div className="text-xs text-gray-500">tăng trưởng tháng</div>
                  </div>
                </CardContent>
              </Card>

              {/* Premium Users Card */}
              <Card className="bg-gradient-to-br from-orange-500/10 via-orange-400/5 to-red-500/10 border-orange-200/50 dark:border-orange-700/50 hover:shadow-lg hover:scale-105 transition-all duration-300 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Gói Premium</CardTitle>
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg shadow-lg">
                    <Crown className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">{proUsers + premiumUsers}</div>
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    Pro: {proUsers}, Premium: {premiumUsers}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <div className="text-xs text-green-600 font-medium">+16%</div>
                    <div className="text-xs text-gray-500">chuyển đổi tháng</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Recent Activity & Support */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                      <Activity className="h-4 w-4 text-white" />
                    </div>
                    Hoạt động gần đây
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {(activityLogs as any[])?.slice(0, 5).map((log: ActivityLog, index: number) => (
                      <div key={index} className="flex items-center space-x-4 p-3 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-100/50 dark:border-blue-800/50 hover:shadow-md transition-all duration-200">
                        <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{log.action}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{log.details}</p>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-slate-700/50 px-2 py-1 rounded-full">
                          {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                      <MessageSquare className="h-4 w-4 text-white" />
                    </div>
                    Hỗ trợ khách hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {(supportTickets as any[])?.slice(0, 5).map((ticket: SupportTicket) => (
                      <div key={ticket.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-100/50 dark:border-emerald-800/50 hover:shadow-md transition-all duration-200">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{ticket.title}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                            {ticket.category}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            ticket.status === 'open' ? 'destructive' : 
                            ticket.status === 'resolved' ? 'default' : 'secondary'
                          }
                          className={`
                            ${ticket.status === 'open' ? 'bg-gradient-to-r from-red-500 to-pink-500' : ''}
                            ${ticket.status === 'resolved' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : ''}
                            transition-all duration-200 hover:scale-110
                          `}
                        >
                          {ticket.status === 'open' ? 'Mở' : ticket.status === 'resolved' ? 'Đã giải quyết' : ticket.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Quản lý thông báo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Bộ lọc thông báo theo danh mục */}
                  <div className="flex flex-wrap gap-2 p-4 bg-muted rounded-lg">
                    <Button
                      variant={notificationFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNotificationFilter("all")}
                      className="gap-2"
                    >
                      <Bell className="h-4 w-4" />
                      Tất cả ({notificationCounts.all})
                    </Button>
                    <Button
                      variant={notificationFilter === "user" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNotificationFilter("user")}
                      className="gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Đăng ký tài khoản ({notificationCounts.user})
                    </Button>
                    <Button
                      variant={notificationFilter === "payment" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNotificationFilter("payment")}
                      className="gap-2"
                    >
                      <CreditCard className="h-4 w-4" />
                      Thanh toán/Nâng cấp ({notificationCounts.payment})
                    </Button>
                    <Button
                      variant={notificationFilter === "system" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNotificationFilter("system")}
                      className="gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Hệ thống ({notificationCounts.system})
                    </Button>
                    <Button
                      variant={notificationFilter === "audio" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNotificationFilter("audio")}
                      className="gap-2"
                    >
                      <AudioLines className="h-4 w-4" />
                      File âm thanh ({notificationCounts.audio})
                    </Button>
                  </div>

                  {/* Danh sách thông báo */}
                  <div className="space-y-3">
                    {notificationsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                        <p className="mt-2 text-muted-foreground">Đang tải thông báo...</p>
                      </div>
                    ) : filteredNotifications.length > 0 ? (
                      filteredNotifications.map((notification: any) => (
                        <div 
                          key={notification.id}
                          className={`p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow ${
                            notification.isRead ? 'bg-background' : 'bg-blue-50 border-blue-200'
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`w-2 h-2 rounded-full ${
                                  notification.isRead ? 'bg-gray-400' : 'bg-blue-500'
                                }`}></span>
                                <span className="font-medium">{notification.title}</span>
                                <Badge variant={
                                  notification.type === 'payment' ? 'default' :
                                  notification.type === 'user' ? 'secondary' :
                                  notification.type === 'system' ? 'destructive' : 'outline'
                                }>
                                  {notification.type === 'payment' ? 'Thanh toán' :
                                   notification.type === 'user' ? 'Người dùng' :
                                   notification.type === 'system' ? 'Hệ thống' : 'Khác'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                              {!notification.isRead && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markNotificationReadMutation.mutate(notification.id)}
                                  disabled={markNotificationReadMutation.isPending}
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          {notificationFilter === "all" 
                            ? "Không có thông báo nào"
                            : `Không có thông báo ${
                                notificationFilter === "user" ? "đăng ký tài khoản" :
                                notificationFilter === "payment" ? "thanh toán/nâng cấp" :
                                notificationFilter === "system" ? "hệ thống" :
                                notificationFilter === "audio" ? "file âm thanh" : ""
                              } nào`
                          }
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => markAllNotificationsReadMutation.mutate()}
                      disabled={markAllNotificationsReadMutation.isPending || (notifications as any[])?.filter((n: any) => !n.isRead).length === 0}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Đánh dấu tất cả đã đọc
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => clearAllNotificationsMutation.mutate()}
                      disabled={clearAllNotificationsMutation.isPending || (notifications as any[])?.length === 0}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Xóa tất cả
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Quản lý người dùng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Search className="h-4 w-4" />
                      <Input placeholder="Tìm kiếm người dùng..." className="w-64" />
                    </div>
                    <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Thêm người dùng
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Tạo người dùng mới</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="username">Tên đăng nhập</Label>
                            <Input
                              id="username"
                              value={newUser.username}
                              onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                              placeholder="Nhập tên đăng nhập"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={newUser.email}
                              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                              placeholder="Nhập email"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="password">Mật khẩu</Label>
                            <Input
                              id="password"
                              type="password"
                              value={newUser.password}
                              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                              placeholder="Nhập mật khẩu"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="fullName">Họ và tên</Label>
                            <Input
                              id="fullName"
                              value={newUser.fullName}
                              onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                              placeholder="Nhập họ và tên"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="role">Vai trò</Label>
                            <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn vai trò" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Người dùng</SelectItem>
                                <SelectItem value="admin">Quản trị viên</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="subscriptionType">Gói dịch vụ</Label>
                            <Select value={newUser.subscriptionType} onValueChange={(value) => setNewUser({...newUser, subscriptionType: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn gói dịch vụ" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">Miễn phí</SelectItem>
                                <SelectItem value="pro">Pro</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-3">
                          <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>
                            Hủy
                          </Button>
                          <Button 
                            onClick={() => createUserMutation.mutate(newUser)}
                            disabled={createUserMutation.isPending || !newUser.username || !newUser.email || !newUser.password}
                          >
                            {createUserMutation.isPending ? "Đang tạo..." : "Tạo người dùng"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Dialog chỉnh sửa người dùng */}
                    <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="edit-username">Tên đăng nhập</Label>
                            <Input
                              id="edit-username"
                              value={editUserData.username}
                              onChange={(e) => setEditUserData({...editUserData, username: e.target.value})}
                              placeholder="Nhập tên đăng nhập"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                              id="edit-email"
                              type="email"
                              value={editUserData.email}
                              onChange={(e) => setEditUserData({...editUserData, email: e.target.value})}
                              placeholder="Nhập email"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="edit-fullName">Họ và tên</Label>
                            <Input
                              id="edit-fullName"
                              value={editUserData.fullName}
                              onChange={(e) => setEditUserData({...editUserData, fullName: e.target.value})}
                              placeholder="Nhập họ và tên"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="edit-role">Vai trò</Label>
                            <Select
                              value={editUserData.role}
                              onValueChange={(value) => setEditUserData({...editUserData, role: value})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn vai trò" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Người dùng</SelectItem>
                                <SelectItem value="admin">Quản trị viên</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="edit-subscription">Gói dịch vụ</Label>
                            <Select
                              value={editUserData.subscriptionType}
                              onValueChange={(value) => setEditUserData({...editUserData, subscriptionType: value})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn gói dịch vụ" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">Miễn phí</SelectItem>
                                <SelectItem value="pro">Pro</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="edit-active"
                              checked={editUserData.isActive}
                              onCheckedChange={(checked) => setEditUserData({...editUserData, isActive: checked})}
                            />
                            <Label htmlFor="edit-active">Tài khoản hoạt động</Label>
                          </div>
                        </div>
                        <div className="flex justify-end gap-3">
                          <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
                            Hủy
                          </Button>
                          <Button 
                            onClick={() => {
                              if (!editingUser) return;
                              updateUserMutation.mutate({
                                id: editingUser.id,
                                userData: editUserData
                              });
                            }}
                            disabled={updateUserMutation.isPending || !editUserData.username || !editUserData.email}
                          >
                            {updateUserMutation.isPending ? "Đang cập nhật..." : "Cập nhật"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Dialog khóa tài khoản */}
                    <Dialog open={isLockUserOpen} onOpenChange={setIsLockUserOpen}>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Khóa tài khoản</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="text-sm text-gray-600">
                            Bạn có chắc chắn muốn khóa tài khoản <strong>{lockingUser?.username}</strong>?
                          </div>
                          <div>
                            <Label htmlFor="lock-reason">Lý do khóa tài khoản *</Label>
                            <Textarea
                              id="lock-reason"
                              placeholder="Nhập lý do khóa tài khoản..."
                              value={lockReason}
                              onChange={(e) => setLockReason(e.target.value)}
                              className="mt-1"
                              rows={3}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-3">
                          <Button variant="outline" onClick={() => setIsLockUserOpen(false)}>
                            Hủy
                          </Button>
                          <Button 
                            onClick={handleConfirmLockUser}
                            disabled={updateUserMutation.isPending || !lockReason.trim()}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {updateUserMutation.isPending ? "Đang khóa..." : "Khóa tài khoản"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Dialog xóa người dùng */}
                    <Dialog open={isDeleteUserOpen} onOpenChange={setIsDeleteUserOpen}>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle className="text-red-600">Xóa người dùng</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <AlertTriangle className="h-8 w-8 text-red-600 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-red-800">Cảnh báo: Hành động không thể hoàn tác</div>
                              <div className="text-sm text-red-600 mt-1">
                                Tất cả dữ liệu của người dùng sẽ bị xóa vĩnh viễn
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            Bạn có chắc chắn muốn xóa người dùng <strong>{deletingUser?.username}</strong>?
                          </div>
                          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                            <strong>Dữ liệu sẽ bị xóa:</strong>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              <li>Thông tin tài khoản</li>
                              <li>Tất cả file âm thanh đã tạo</li>
                              <li>Lịch sử thanh toán</li>
                              <li>Dữ liệu sử dụng dịch vụ</li>
                            </ul>
                          </div>
                        </div>
                        <div className="flex justify-end gap-3">
                          <Button variant="outline" onClick={() => setIsDeleteUserOpen(false)}>
                            Hủy
                          </Button>
                          <Button 
                            onClick={handleConfirmDeleteUser}
                            disabled={deleteUserMutation.isPending}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {deleteUserMutation.isPending ? "Đang xóa..." : "Xóa vĩnh viễn"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tên đăng nhập</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Gói dịch vụ</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                        <TableHead>Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Admin accounts - làm mờ và ghim ở đầu */}
                      {(users as any[])?.filter((user: User) => user.role === "admin").map((user: User) => (
                        <TableRow key={user.id} className="bg-gray-50 opacity-70 border-l-4 border-l-red-400">
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-2">
                              <Shield className="h-4 w-4 text-red-500" />
                              <span className="text-gray-600">{user.username}</span>
                              <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
                                ADMIN
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-500">{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
                              {user.subscriptionType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                              Hoạt động
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewUser(user)}
                                title="Xem chi tiết"
                                className="opacity-50"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <span className="text-xs text-gray-400 italic">Được bảo vệ</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* Người dùng thường */}
                      {(users as any[])?.filter((user: User) => user.role !== "admin").slice(0, 10).map((user: User) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{(user as any).fullName || user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.subscriptionType === 'premium' ? 'default' : 'secondary'}>
                              {user.subscriptionType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col space-y-1">
                              <Badge variant={user.isActive ? 'default' : 'destructive'}>
                                {user.isActive ? (
                                  <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    Hoạt động
                                  </span>
                                ) : 'Bị khóa'}
                              </Badge>
                              {!user.isActive && (
                                <span className="text-xs text-red-600 italic">
                                  {(user as any).lockReason ? `Lý do: ${(user as any).lockReason}` : 'Tài khoản đã bị khóa'}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewUser(user)}
                                title="Xem chi tiết"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditUser(user)}
                                title="Chỉnh sửa"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant={user.isActive ? "outline" : "default"}
                                size="sm"
                                onClick={() => handleToggleUserStatus(user)}
                                title={user.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                                className={user.isActive ? 
                                  "hover:bg-red-50 hover:text-red-600 hover:border-red-300" : 
                                  "bg-red-600 hover:bg-red-700 text-white"
                                }
                              >
                                <Ban className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUser(user)}
                                title="Xóa người dùng"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audio Files Tab */}
          <TabsContent value="audio" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AudioLines className="h-5 w-5" />
                  Quản lý Audio Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tiêu đề</TableHead>
                      <TableHead>Người tạo</TableHead>
                      <TableHead>Định dạng</TableHead>
                      <TableHead>Kích thước</TableHead>
                      <TableHead>Thời lượng</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(audioFiles as any[])?.slice(0, 10).map((file: AudioFile) => (
                      <TableRow key={file.id}>
                        <TableCell className="font-medium">{file.title}</TableCell>
                        <TableCell>
                          {(users as any[])?.find((u: User) => u.id === file.userId)?.username || "Unknown"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{file.format.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>{(file.fileSize / 1024).toFixed(1)} KB</TableCell>
                        <TableCell>{file.duration}s</TableCell>
                        <TableCell>
                          {new Date(file.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Play className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Quản lý thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã đơn hàng</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Gói dịch vụ</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ảnh CK</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(payments as any[])?.slice(0, 10).map((payment: Payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.orderId}</TableCell>
                        <TableCell>{payment.customerName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.planType}</Badge>
                        </TableCell>
                        <TableCell>{payment.amount.toLocaleString()} VND</TableCell>
                        <TableCell>
                          <Badge variant={
                            payment.status === 'completed' ? 'default' : 
                            payment.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {payment.status === 'completed' ? 'Đã xác nhận' : 
                             payment.status === 'pending' ? 'Chờ xử lý' : 'Bị hủy'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payment.receiptImageUrl ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                if (payment.receiptImageUrl) {
                                  window.open(payment.receiptImageUrl, '_blank');
                                }
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Xem ảnh
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-xs">Chưa có</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setIsPaymentDetailOpen(true);
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            {payment.status === 'pending' && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => confirmPaymentMutation.mutate(payment.id)}
                                  disabled={confirmPaymentMutation.isPending}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => rejectPaymentMutation.mutate(payment.id)}
                                  disabled={rejectPaymentMutation.isPending}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Menu Tab */}
          <TabsContent value="settings-menu" className="space-y-6">

            {/* Detailed Settings Pages */}
            <div className="relative">
              {/* Background gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/30 via-purple-50/20 to-pink-100/30 dark:from-indigo-900/20 dark:via-purple-900/10 dark:to-pink-900/20 rounded-2xl"></div>
              
              <Card className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/30 shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-pink-500/15 rounded-t-2xl border-b border-white/20">
                  <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                    <div className="relative">
                      <div className="p-3 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl shadow-lg">
                        <Settings className="h-6 w-6 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                    </div>
                    <div>
                      <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        🎛️ Trang cài đặt chi tiết
                      </span>
                      <p className="text-sm font-normal text-gray-600 dark:text-gray-400 mt-1">
                        Truy cập các module cài đặt chuyên sâu với giao diện hiện đại
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* App Settings Card */}
                    <div 
                      className="group relative bg-gradient-to-br from-blue-50/80 to-indigo-100/80 dark:from-blue-950/40 dark:to-indigo-900/40 rounded-2xl p-6 cursor-pointer overflow-hidden border border-blue-200/30 dark:border-blue-700/30 hover:border-blue-300/50 dark:hover:border-blue-600/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1"
                      onClick={() => window.location.href = '/admin/app-settings?returnTab=settings-menu'}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg group-hover:shadow-blue-500/25 transition-shadow duration-300">
                            <Settings className="h-7 w-7 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                              Cài đặt ứng dụng
                            </h3>
                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                              Quota & Limits Manager
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          Cấu hình giới hạn file, ký tự và giọng đọc cho từng gói dịch vụ một cách chi tiết
                        </p>
                        <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300">
                          <span>Truy cập ngay</span>
                          <svg className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                          </svg>
                        </div>
                      </div>
                    </div>


                    




                    {/* Payment Settings Card */}
                    <div 
                      className="group relative bg-gradient-to-br from-teal-50/80 to-emerald-100/80 dark:from-teal-950/40 dark:to-emerald-900/40 rounded-2xl p-6 cursor-pointer overflow-hidden border border-teal-200/30 dark:border-teal-700/30 hover:border-teal-300/50 dark:hover:border-teal-600/50 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/10 hover:-translate-y-1"
                      onClick={() => window.location.href = '/admin/payment-settings?returnTab=settings-menu'}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-teal-400/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="p-3 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl shadow-lg group-hover:shadow-teal-500/25 transition-shadow duration-300">
                            <CreditCard className="h-7 w-7 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                              Cài đặt thanh toán
                            </h3>
                            <p className="text-sm text-teal-600 dark:text-teal-400 font-medium">
                              Payment Gateway
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          Quản lý thông tin tài khoản ngân hàng, email hỗ trợ và cổng thanh toán
                        </p>
                        <div className="mt-4 flex items-center text-teal-600 dark:text-teal-400 text-sm font-medium group-hover:text-teal-700 dark:group-hover:text-teal-300">
                          <span>Thiết lập payment</span>
                          <svg className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                          </svg>
                        </div>
                      </div>
                    </div>



                    {/* System Maintenance Card */}
                    <div 
                      className="group relative bg-gradient-to-br from-red-50/80 to-pink-100/80 dark:from-red-950/40 dark:to-pink-900/40 rounded-2xl p-6 cursor-pointer overflow-hidden border border-red-200/30 dark:border-red-700/30 hover:border-red-300/50 dark:hover:border-red-600/50 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10 hover:-translate-y-1"
                      onClick={() => window.location.href = '/admin/system-maintenance?returnTab=settings-menu'}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-red-400/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg group-hover:shadow-red-500/25 transition-shadow duration-300">
                            <Database className="h-7 w-7 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors">
                              Bảo trì hệ thống
                            </h3>
                            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                              System Maintenance
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          Thực hiện các tác vụ bảo trì như dọn dẹp cache, xóa file tạm và sao lưu dữ liệu
                        </p>
                        <div className="mt-4 flex items-center text-red-600 dark:text-red-400 text-sm font-medium group-hover:text-red-700 dark:group-hover:text-red-300">
                          <span>System tools</span>
                          <svg className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Status Tab */}
          <TabsContent value="system-status" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Trạng thái hệ thống
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Theo dõi hiệu suất và trạng thái hoạt động của hệ thống
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Hiệu suất hệ thống</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>CPU</span>
                          <span>45%</span>
                        </div>
                        <Progress value={45} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>RAM</span>
                          <span>62%</span>
                        </div>
                        <Progress value={62} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Dung lượng</span>
                          <span>38%</span>
                        </div>
                        <Progress value={38} className="h-2" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Dịch vụ</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">API Server</span>
                        <Badge variant="default">Hoạt động</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Database</span>
                        <Badge variant="default">Hoạt động</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">OpenAI API</span>
                        <Badge variant="default">Hoạt động</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Email Service</span>
                        <Badge variant="secondary">Bảo trì</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Dialog xem chi tiết thanh toán */}
        <Dialog open={isPaymentDetailOpen} onOpenChange={setIsPaymentDetailOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Chi tiết thanh toán</DialogTitle>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Mã đơn hàng:</label>
                    <p className="text-sm text-muted-foreground">{selectedPayment.orderId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Trạng thái:</label>
                    <Badge variant={selectedPayment.status === 'completed' ? 'default' : selectedPayment.status === 'pending' ? 'secondary' : 'destructive'}>
                      {selectedPayment.status === 'completed' ? 'Hoàn thành' : selectedPayment.status === 'pending' ? 'Chờ xử lý' : 'Thất bại'}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Khách hàng:</label>
                    <p className="text-sm text-muted-foreground">{selectedPayment.customerName || 'Không xác định'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email:</label>
                    <p className="text-sm text-muted-foreground">{selectedPayment.customerEmail || 'Không có'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Gói dịch vụ:</label>
                    <p className="text-sm text-muted-foreground">{selectedPayment.planType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Chu kỳ:</label>
                    <p className="text-sm text-muted-foreground">{selectedPayment.billingCycle === 'monthly' ? 'Hàng tháng' : 'Hàng năm'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Số tiền:</label>
                    <p className="text-sm font-bold text-green-600">{selectedPayment.amount.toLocaleString()} VND</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phương thức:</label>
                    <p className="text-sm text-muted-foreground">{selectedPayment.paymentMethod}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Số tài khoản:</label>
                    <p className="text-sm text-muted-foreground">{selectedPayment.bankAccount || 'Không có'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Ngày tạo:</label>
                    <p className="text-sm text-muted-foreground">{new Date(selectedPayment.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {selectedPayment.receiptImageUrl && (
                  <div>
                    <label className="text-sm font-medium">Ảnh chuyển khoản:</label>
                    <div className="mt-2">
                      <img 
                        src={selectedPayment.receiptImageUrl} 
                        alt="Ảnh chuyển khoản" 
                        className="max-w-full h-auto max-h-96 border rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
      
      {/* Custom CSS Animations */}
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}