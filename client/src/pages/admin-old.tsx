import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { User, AudioFile } from "@shared/schema";
import { 
  Users, 
  Crown, 
  Search, 
  Edit, 
  Trash2, 
  UserPlus, 
  Calendar,
  Activity,
  TrendingUp,
  Settings,
  FileAudio,
  ArrowLeft,
  CreditCard,
  Shield,
  Database,
  BarChart3,
  MessageSquare,
  Mail,
  Globe,
  Server,
  AlertTriangle,
  CheckCircle,
  XCircle,
  DollarSign,
  Download,
  Upload,
  Eye,
  Copy,
  FileText,
  Plus
} from "lucide-react";

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const { user: currentUser, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Payment settings queries
  const { data: paymentSettings } = useQuery({
    queryKey: ["/api/admin/payment-settings"],
    enabled: isAuthenticated && currentUser?.role === "admin",
  });

  const updatePaymentSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", "/api/admin/payment-settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-settings"] });
      toast({
        title: "Thành công",
        description: "Cập nhật cài đặt thanh toán thành công",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật cài đặt thanh toán",
        variant: "destructive",
      });
    },
  });

  // Check if user is admin
  if (!isAuthenticated || currentUser?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Không có quyền truy cập</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Bạn cần quyền admin để truy cập trang này.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    retry: false,
  });

  // Fetch audio files
  const { data: audioFiles = [], isLoading: audioLoading } = useQuery({
    queryKey: ["/api/audio-files", "all"],
    retry: false,
  });

  // Fetch templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/templates"],
    retry: false,
  });

  // Stats calculations
  const totalUsers = users.length;
  const proUsers = users.filter((user: User) => user.subscriptionType === "pro").length;
  const premiumUsers = users.filter((user: User) => user.subscriptionType === "premium").length;
  const totalAudioFiles = audioFiles.length;
  const recentUsers = users.filter((user: User) => {
    const createdDate = new Date(user.createdAt);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return createdDate > weekAgo;
  }).length;

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: number; updates: any }) => {
      return await apiRequest("PUT", `/api/users/${userId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Thành công",
        description: "Cập nhật người dùng thành công",
      });
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật người dùng",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Thành công",
        description: "Xóa người dùng thành công",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa người dùng",
        variant: "destructive",
      });
    },
  });

  // Delete audio file mutation
  const deleteAudioMutation = useMutation({
    mutationFn: async (audioId: number) => {
      return await apiRequest("DELETE", `/api/audio-files/${audioId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audio-files"] });
      toast({
        title: "Thành công",
        description: "Xóa file audio thành công",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa file audio",
        variant: "destructive",
      });
    },
  });

  // Template mutations
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      return await apiRequest("POST", "/api/templates", templateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Thành công",
        description: "Tạo template thành công",
      });
      setIsTemplateDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể tạo template",
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ templateId, updates }: { templateId: number; updates: any }) => {
      return await apiRequest("PUT", `/api/templates/${templateId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Thành công",
        description: "Cập nhật template thành công",
      });
      setIsTemplateDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật template",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      return await apiRequest("DELETE", `/api/templates/${templateId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Thành công",
        description: "Xóa template thành công",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa template",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users.filter((user: User) =>
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm("Bạn có chắc muốn xóa người dùng này?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleDeleteAudio = (audioId: number) => {
    if (confirm("Bạn có chắc muốn xóa file audio này?")) {
      deleteAudioMutation.mutate(audioId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Bảng điều khiển Admin</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Quản lý người dùng, nội dung và cài đặt hệ thống
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Về trang chủ
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="grid w-max min-w-full grid-cols-5 md:grid-cols-8 gap-1">
              <TabsTrigger value="overview" className="flex items-center gap-1 text-xs md:text-sm">
                <BarChart3 className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Tổng quan</span>
                <span className="sm:hidden">TQ</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-1 text-xs md:text-sm">
                <Users className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Người dùng</span>
                <span className="sm:hidden">ND</span>
              </TabsTrigger>
              <TabsTrigger value="audio" className="flex items-center gap-1 text-xs md:text-sm">
                <FileAudio className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Audio</span>
                <span className="sm:hidden">AU</span>
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-1 text-xs md:text-sm">
                <FileText className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Templates</span>
                <span className="sm:hidden">TP</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-1 text-xs md:text-sm">
                <CreditCard className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Thanh toán</span>
                <span className="sm:hidden">TT</span>
              </TabsTrigger>
              <TabsTrigger value="payment-settings" className="flex items-center gap-1 text-xs md:text-sm">
                <Settings className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden lg:inline">Cài đặt TT</span>
                <span className="lg:hidden">CD</span>
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-1 text-xs md:text-sm">
                <Server className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden lg:inline">Hệ thống</span>
                <span className="lg:hidden">HT</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-1 text-xs md:text-sm">
                <Database className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden lg:inline">Cài đặt</span>
                <span className="lg:hidden">CS</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    +{recentUsers} trong tuần qua
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Người dùng Pro</CardTitle>
                  <Crown className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{proUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {((proUsers / totalUsers) * 100).toFixed(1)}% tổng số
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Người dùng Premium</CardTitle>
                  <Shield className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{premiumUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {((premiumUsers / totalUsers) * 100).toFixed(1)}% tổng số
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng Audio Files</CardTitle>
                  <FileAudio className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalAudioFiles}</div>
                  <p className="text-xs text-muted-foreground">
                    Files đã tạo
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Hoạt động gần đây</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.slice(-5).map((user: User) => (
                      <div key={user.id} className="flex items-center space-x-4">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{user.username}</p>
                          <p className="text-xs text-gray-500">Đăng ký mới</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Thống kê hệ thống</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Tỷ lệ chuyển đổi</span>
                      <span className="text-sm font-medium">
                        {(((proUsers + premiumUsers) / totalUsers) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Người dùng hoạt động</span>
                      <span className="text-sm font-medium">{totalUsers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Files trung bình/người dùng</span>
                      <span className="text-sm font-medium">
                        {totalUsers > 0 ? (totalAudioFiles / totalUsers).toFixed(1) : 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Quản lý người dùng</span>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Tìm kiếm người dùng..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên người dùng</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Vai trò</TableHead>
                      <TableHead>Gói</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "destructive" : "secondary"}>
                            {user.role === "admin" ? "Admin" : "User"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              user.subscriptionType === "premium" ? "default" :
                              user.subscriptionType === "pro" ? "secondary" : "outline"
                            }
                          >
                            {user.subscriptionType || "Free"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={user.role === "admin"}
                            >
                              <Trash2 className="h-4 w-4" />
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

          {/* Audio Files Tab */}
          <TabsContent value="audio" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quản lý Audio Files</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên file</TableHead>
                      <TableHead>Người tạo</TableHead>
                      <TableHead>Kích thước</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {audioFiles.slice(0, 20).map((file: AudioFile) => (
                      <TableRow key={file.id}>
                        <TableCell className="font-medium">{file.title}</TableCell>
                        <TableCell>
                          {users.find((u: User) => u.id === file.userId)?.username || "Unknown"}
                        </TableCell>
                        <TableCell>{(file.size / 1024).toFixed(1)} KB</TableCell>
                        <TableCell>
                          {new Date(file.createdAt).toLocaleDateString('vi-VN')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAudio(file.id)}
                            >
                              <Trash2 className="h-4 w-4" />
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

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Quản lý mẫu văn bản</span>
                  <Button
                    onClick={() => {
                      setSelectedTemplate(null);
                      setIsTemplateDialogOpen(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Thêm mẫu mới
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tiêu đề</TableHead>
                      <TableHead>Danh mục</TableHead>
                      <TableHead>Nội dung</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template: any) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.title}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{template.category}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {template.content}
                        </TableCell>
                        <TableCell>
                          {template.createdAt ? new Date(template.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedTemplate(template);
                                setIsTemplateDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => deleteTemplateMutation.mutate(template.id)}
                              disabled={deleteTemplateMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
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
                <CardTitle className="flex items-center justify-between">
                  <span>Quản lý thanh toán</span>
                  <Badge variant="outline">Demo Mode</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">0</p>
                          <p className="text-sm text-gray-600">Thanh toán thành công</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-yellow-600">0</p>
                          <p className="text-sm text-gray-600">Đang chờ xác nhận</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">0 VND</p>
                          <p className="text-sm text-gray-600">Tổng doanh thu</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã đơn hàng</TableHead>
                          <TableHead>Khách hàng</TableHead>
                          <TableHead>Gói</TableHead>
                          <TableHead>Số tiền</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead>Ngày tạo</TableHead>
                          <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            Chưa có giao dịch nào
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Hướng dẫn xử lý thanh toán
                    </h4>
                    <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                      <p>Khi có khách hàng chuyển khoản:</p>
                      <ol className="list-decimal list-inside space-y-1 ml-4">
                        <li>Kiểm tra số tiền và nội dung chuyển khoản</li>
                        <li>Đối chiếu với mã đơn hàng khách gửi</li>
                        <li>Xác nhận thanh toán trong hệ thống</li>
                        <li>Gói sẽ tự động được kích hoạt cho khách hàng</li>
                      </ol>
                      <p className="mt-3">
                        <strong>Thông tin nhận thanh toán:</strong><br/>
                        Ngân hàng: Vietcombank<br/>
                        Số TK: 1234567890123456<br/>
                        Tên: CONG TY VOICETEXT PRO
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>



          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin hệ thống</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Trạng thái server</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Hoạt động
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Database</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Kết nối
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>OpenAI API</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Hoạt động
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Storage</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Bình thường
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Settings Tab */}
          <TabsContent value="payment-settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt thanh toán</CardTitle>
                <p className="text-sm text-gray-600">Quản lý thông tin ngân hàng và giá cả gói dịch vụ</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bank Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Thông tin ngân hàng</h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="bankName">Tên ngân hàng</Label>
                        <Input
                          id="bankName"
                          defaultValue={paymentSettings?.bankName || ""}
                          placeholder="Ngân hàng TMCP Công Thương Việt Nam"
                        />
                      </div>
                      <div>
                        <Label htmlFor="accountNumber">Số tài khoản</Label>
                        <Input
                          id="accountNumber"
                          defaultValue={paymentSettings?.accountNumber || ""}
                          placeholder="1234567890123456"
                        />
                      </div>
                      <div>
                        <Label htmlFor="accountName">Tên chủ tài khoản</Label>
                        <Input
                          id="accountName"
                          defaultValue={paymentSettings?.accountName || ""}
                          placeholder="NGUYEN VAN A"
                        />
                      </div>
                      <div>
                        <Label htmlFor="supportEmail">Email hỗ trợ</Label>
                        <Input
                          id="supportEmail"
                          type="email"
                          defaultValue={paymentSettings?.supportEmail || ""}
                          placeholder="support@voicetextpro.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="supportPhone">Số điện thoại hỗ trợ</Label>
                        <Input
                          id="supportPhone"
                          defaultValue={paymentSettings?.supportPhone || ""}
                          placeholder="0123456789"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Bảng giá dịch vụ</h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="proMonthly">Gói Pro - Hàng tháng (VND)</Label>
                        <Input
                          id="proMonthly"
                          type="number"
                          defaultValue={paymentSettings?.proMonthlyPrice || 99000}
                          placeholder="99000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="proYearly">Gói Pro - Hàng năm (VND)</Label>
                        <Input
                          id="proYearly"
                          type="number"
                          defaultValue={paymentSettings?.proYearlyPrice || 990000}
                          placeholder="990000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="premiumMonthly">Gói Premium - Hàng tháng (VND)</Label>
                        <Input
                          id="premiumMonthly"
                          type="number"
                          defaultValue={paymentSettings?.premiumMonthlyPrice || 199000}
                          placeholder="199000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="premiumYearly">Gói Premium - Hàng năm (VND)</Label>
                        <Input
                          id="premiumYearly"
                          type="number"
                          defaultValue={paymentSettings?.premiumYearlyPrice || 1990000}
                          placeholder="1990000"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={() => {
                      const bankName = (document.getElementById('bankName') as HTMLInputElement)?.value;
                      const accountNumber = (document.getElementById('accountNumber') as HTMLInputElement)?.value;
                      const accountName = (document.getElementById('accountName') as HTMLInputElement)?.value;
                      const supportEmail = (document.getElementById('supportEmail') as HTMLInputElement)?.value;
                      const supportPhone = (document.getElementById('supportPhone') as HTMLInputElement)?.value;
                      const proMonthlyPrice = parseInt((document.getElementById('proMonthly') as HTMLInputElement)?.value);
                      const proYearlyPrice = parseInt((document.getElementById('proYearly') as HTMLInputElement)?.value);
                      const premiumMonthlyPrice = parseInt((document.getElementById('premiumMonthly') as HTMLInputElement)?.value);
                      const premiumYearlyPrice = parseInt((document.getElementById('premiumYearly') as HTMLInputElement)?.value);
                      
                      updatePaymentSettingsMutation.mutate({
                        bankName,
                        accountNumber,
                        accountName,
                        supportEmail,
                        supportPhone,
                        proMonthlyPrice,
                        proYearlyPrice,
                        premiumMonthlyPrice,
                        premiumYearlyPrice
                      });
                    }}
                    disabled={updatePaymentSettingsMutation.isPending}
                  >
                    {updatePaymentSettingsMutation.isPending ? "Đang lưu..." : "Lưu cài đặt"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt hệ thống</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="maintenance">Chế độ bảo trì</Label>
                      <p className="text-sm text-gray-500">Tạm thời ngưng dịch vụ để bảo trì</p>
                    </div>
                    <Switch id="maintenance" />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="registration">Cho phép đăng ký mới</Label>
                      <p className="text-sm text-gray-500">Người dùng có thể tạo tài khoản mới</p>
                    </div>
                    <Switch id="registration" defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="announcement">Thông báo hệ thống</Label>
                    <Textarea 
                      id="announcement"
                      placeholder="Nhập thông báo hiển thị cho tất cả người dùng..."
                      className="min-h-20"
                    />
                    <Button>Cập nhật thông báo</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin và quyền của người dùng
              </DialogDescription>
            </DialogHeader>
            
            {selectedUser && (
              <EditUserForm
                user={selectedUser}
                onSave={(updates) => {
                  updateUserMutation.mutate({ userId: selectedUser.id, updates });
                }}
                onCancel={() => setIsEditDialogOpen(false)}
                isLoading={updateUserMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

interface EditUserFormProps {
  user: User;
  onSave: (updates: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function EditUserForm({ user, onSave, onCancel, isLoading }: EditUserFormProps) {
  const [role, setRole] = useState(user.role || "user");
  const [subscriptionType, setSubscriptionType] = useState(user.subscriptionType || "free");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      role,
      subscriptionType,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="role">Vai trò</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subscription">Loại gói</Label>
        <Select value={subscriptionType} onValueChange={setSubscriptionType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Đang lưu..." : "Lưu"}
        </Button>
      </div>
    </form>
  );
}