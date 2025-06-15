import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import Breadcrumb from "@/components/breadcrumb";
import { useToast } from "@/hooks/use-toast";
import AudioPlayer from "@/components/audio-player";
import { 
  BarChart3, 
  FileAudio, 
  Clock, 
  TrendingUp, 
  Calendar,
  Download,
  Play,
  Share2,
  Settings,
  Crown,
  Search,
  Filter,
  Grid,
  List,
  SortAsc,
  MoreHorizontal,
  Trash2,
  Edit,
  Copy,
  Eye
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatFileSize, formatDuration } from "@/lib/audio-utils";
import UpgradeBanner from "@/components/upgrade-banner";
import type { AudioFile, User } from "@shared/schema";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Auth is now handled by ProtectedRoute component
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [filterBy, setFilterBy] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const { data: audioFiles = [] } = useQuery({
    queryKey: ["/api/audio-files"],
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const { data: userStats = {} } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  // Fetch app settings for dynamic limits
  const { data: appSettings } = useQuery({
    queryKey: ["/api/app-settings"],
    staleTime: 0,
  });

  // Filter and sort audio files
  const filteredFiles = (audioFiles as AudioFile[]).filter((file: AudioFile) => {
    const matchesSearch = file.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         file.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterBy === "all" || file.voice === filterBy;
    return matchesSearch && matchesFilter;
  });

  const sortedFiles = [...filteredFiles].sort((a: AudioFile, b: AudioFile) => {
    switch (sortBy) {
      case "title":
        return a.title.localeCompare(b.title);
      case "duration":
        return b.duration - a.duration;
      case "size":
        return b.fileSize - a.fileSize;
      case "createdAt":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const recentFiles = sortedFiles.slice(0, 6);
  const totalFiles = (audioFiles as AudioFile[]).length;
  const totalDuration = (audioFiles as AudioFile[]).reduce((sum: number, file: AudioFile) => sum + file.duration, 0);
  const totalSize = (audioFiles as AudioFile[]).reduce((sum: number, file: AudioFile) => sum + file.fileSize, 0);

  // Dynamic usage limits based on app settings and subscription
  const getCurrentLimits = () => {
    if (!appSettings) return { characters: 500, files: 5 }; // Fallback while loading
    
    switch (user?.subscriptionType) {
      case "pro":
        return { 
          characters: (appSettings as any).proMaxCharacters || 10000, 
          files: (appSettings as any).proMaxFiles || 100 
        };
      case "premium":
        return { 
          characters: (appSettings as any).premiumMaxCharacters || 50000, 
          files: (appSettings as any).premiumMaxFiles || 1000 
        };
      default:
        return { 
          characters: (appSettings as any).freeMaxCharacters || 500, 
          files: (appSettings as any).freeMaxFiles || 5 
        };
    }
  };

  const currentLimit = getCurrentLimits();
  const charactersUsed = (userStats as any)?.totalCharactersUsed || 0;
  const charactersProgress = (charactersUsed / currentLimit.characters) * 100;
  const filesProgress = (totalFiles / currentLimit.files) * 100;

  const getBadgeVariant = (subscriptionType: string) => {
    switch (subscriptionType) {
      case "pro": return "default";
      case "premium": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Breadcrumb 
        title="Dashboard" 
        showBackButton={true}
        backUrl="/"
        showHomeButton={true}
      />
      
      <div className="container mx-auto px-4 py-8">
        {/* Upgrade Banner */}
        <UpgradeBanner />
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-muted-foreground">
              Xin chào {user?.fullName || user?.username}! Chào mừng trở lại VoiceText Pro.
            </p>
          </div>
          <Badge variant={getBadgeVariant(user?.subscriptionType || "free")} className="flex items-center gap-2">
            {user?.subscriptionType === "premium" && <Crown className="h-4 w-4" />}
            {user?.subscriptionType?.toUpperCase() || "FREE"}
          </Badge>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="files">File Audio</TabsTrigger>
            <TabsTrigger value="usage">Sử dụng</TabsTrigger>
            <TabsTrigger value="preferences">Cài đặt</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tổng file</p>
                      <p className="text-2xl font-bold">{totalFiles}</p>
                    </div>
                    <FileAudio className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Thời lượng</p>
                      <p className="text-2xl font-bold">{formatDuration(totalDuration)}</p>
                    </div>
                    <Clock className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Dung lượng</p>
                      <p className="text-2xl font-bold">{formatFileSize(totalSize)}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ký tự đã dùng</p>
                      <p className="text-2xl font-bold">{charactersUsed.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Usage Progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sử dụng ký tự</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>{charactersUsed.toLocaleString()} / {currentLimit.characters.toLocaleString()}</span>
                      <span>{Math.round(charactersProgress)}%</span>
                    </div>
                    <Progress value={charactersProgress} className="h-2" />
                    {charactersProgress > 80 && (
                      <p className="text-sm text-orange-600">
                        Bạn đã sử dụng gần hết hạn mức. Hãy nâng cấp để tiếp tục sử dụng.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Số lượng file</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>{totalFiles} / {currentLimit.files}</span>
                      <span>{Math.round(filesProgress)}%</span>
                    </div>
                    <Progress value={filesProgress} className="h-2" />
                    {filesProgress > 80 && (
                      <p className="text-sm text-orange-600">
                        Bạn đã tạo gần hết số file cho phép. Hãy nâng cấp để tạo thêm.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Files */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  File audio gần đây
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentFiles.length > 0 ? (
                  <div className="space-y-4">
                    {recentFiles.map((file: AudioFile) => (
                      <div key={file.id} className="p-4 border rounded-lg bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate text-lg">{file.title}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(file.duration)}
                              </span>
                              <span>{formatFileSize(file.fileSize)}</span>
                              <Badge variant="outline" className="text-xs">
                                {file.voice}
                              </Badge>
                              <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Audio Player */}
                        <AudioPlayer file={file} size="sm" className="mt-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileAudio className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Chưa có file audio nào</p>
                    <p className="text-sm">Tạo file đầu tiên của bạn!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="space-y-6">
            {/* File Management Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileAudio className="h-5 w-5" />
                    Quản lý file audio ({sortedFiles.length})
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search and Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm kiếm file audio..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[160px]">
                      <SortAsc className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Mới nhất</SelectItem>
                      <SelectItem value="title">Tên A-Z</SelectItem>
                      <SelectItem value="duration">Thời lượng</SelectItem>
                      <SelectItem value="size">Kích thước</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterBy} onValueChange={setFilterBy}>
                    <SelectTrigger className="w-[160px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả giọng</SelectItem>
                      <SelectItem value="Hoài My">Hoài My</SelectItem>
                      <SelectItem value="Nam Minh">Nam Minh</SelectItem>
                      <SelectItem value="Thu Hà">Thu Hà</SelectItem>
                      <SelectItem value="Quang Anh">Quang Anh</SelectItem>
                      <SelectItem value="Hồng Lan">Hồng Lan</SelectItem>
                      <SelectItem value="Tuấn Vũ">Tuấn Vũ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* File List/Grid */}
                {sortedFiles.length > 0 ? (
                  <div className={viewMode === "grid" ? 
                    "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : 
                    "space-y-3"
                  }>
                    {sortedFiles.map((file: AudioFile) => (
                      <div
                        key={file.id}
                        className={viewMode === "grid" ? 
                          "border rounded-lg p-4 hover:bg-muted/50 transition-colors" :
                          "flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        }
                      >
                        {viewMode === "grid" ? (
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium truncate mb-1">{file.title}</h4>
                                <p className="text-sm text-muted-foreground truncate mb-2">
                                  {file.content.length > 60 ? `${file.content.substring(0, 60)}...` : file.content}
                                </p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Download className="h-4 w-4 mr-2" />
                                    Tải xuống
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Chia sẻ
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Chỉnh sửa
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Sao chép
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Xóa
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(file.duration)}
                              </span>
                              <span>{formatFileSize(file.fileSize)}</span>
                              <Badge variant="outline" className="text-xs">
                                {file.voice}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(file.createdAt).toLocaleDateString('vi-VN')}
                            </div>
                            
                            {/* Audio Player */}
                            <AudioPlayer file={file} size="sm" />
                          </div>
                        ) : (
                          <div className="w-full">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium truncate mb-1">{file.title}</h4>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDuration(file.duration)}
                                  </span>
                                  <span>{formatFileSize(file.fileSize)}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {file.voice}
                                  </Badge>
                                  <span>{new Date(file.createdAt).toLocaleDateString('vi-VN')}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="ghost">
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost">
                                  <Share2 className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Xem chi tiết
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Chỉnh sửa
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Copy className="h-4 w-4 mr-2" />
                                      Sao chép
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600">
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Xóa
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            
                            {/* Audio Player */}
                            <AudioPlayer file={file} size="sm" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileAudio className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-medium mb-2">
                      {searchQuery || filterBy !== "all" ? "Không tìm thấy file nào" : "Chưa có file audio"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery || filterBy !== "all" ? 
                        "Thử thay đổi điều kiện tìm kiếm hoặc bộ lọc" : 
                        "Tạo file audio đầu tiên của bạn ngay bây giờ"
                      }
                    </p>
                    {!searchQuery && filterBy === "all" && (
                      <Button>
                        Tạo file audio mới
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            {/* Subscription Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Gói dịch vụ hiện tại</span>
                  <Badge variant={getBadgeVariant(user?.subscriptionType || "free")} className="flex items-center gap-2">
                    {user?.subscriptionType === "premium" && <Crown className="h-4 w-4" />}
                    {user?.subscriptionType?.toUpperCase() || "FREE"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Trạng thái</p>
                    <p className="font-medium">
                      {user?.subscriptionExpiry ? 
                        `Hết hạn: ${new Date(user.subscriptionExpiry).toLocaleDateString()}` :
                        "Gói miễn phí"
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tham gia từ</p>
                    <p className="font-medium">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tổng file đã tạo</p>
                    <p className="font-medium">{totalFiles} file</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sử dụng ký tự</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Đã sử dụng</span>
                        <span className="font-medium">{charactersUsed.toLocaleString()} / {currentLimit.characters.toLocaleString()}</span>
                      </div>
                      <Progress value={charactersProgress} className="h-3" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.round(charactersProgress)}% đã sử dụng
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">Tuần này</p>
                        <p className="text-lg font-semibold">12,450</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tháng này</p>
                        <p className="text-lg font-semibold">45,230</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>File audio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Đã tạo</span>
                        <span className="font-medium">{totalFiles} / {currentLimit.files}</span>
                      </div>
                      <Progress value={filesProgress} className="h-3" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.round(filesProgress)}% đã sử dụng
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">Tuần này</p>
                        <p className="text-lg font-semibold">8</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tháng này</p>
                        <p className="text-lg font-semibold">23</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Voice Usage Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Thống kê giọng nói</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Hoài My</span>
                        <span className="text-sm font-medium">45%</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Nam Minh</span>
                        <span className="text-sm font-medium">25%</span>
                      </div>
                      <Progress value={25} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Thu Hà</span>
                        <span className="text-sm font-medium">20%</span>
                      </div>
                      <Progress value={20} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Quang Anh</span>
                        <span className="text-sm font-medium">6%</span>
                      </div>
                      <Progress value={6} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Hồng Lan</span>
                        <span className="text-sm font-medium">3%</span>
                      </div>
                      <Progress value={3} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Tuấn Vũ</span>
                        <span className="text-sm font-medium">1%</span>
                      </div>
                      <Progress value={1} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upgrade Warning */}
            {(charactersProgress > 80 || filesProgress > 80) && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-orange-800 mb-1">Sắp đạt giới hạn sử dụng</h4>
                      <p className="text-orange-700 text-sm mb-3">
                        Bạn đã sử dụng gần hết hạn mức cho gói hiện tại. Nâng cấp để tiếp tục sử dụng không giới hạn.
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                          Nâng cấp ngay
                        </Button>
                        <Button size="sm" variant="outline">
                          Xem bảng giá
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Cài đặt tùy chọn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Tùy chỉnh các cài đặt mặc định cho việc tạo audio.
                </p>
                <Button className="mt-4" variant="outline">
                  Chỉnh sửa cài đặt
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}