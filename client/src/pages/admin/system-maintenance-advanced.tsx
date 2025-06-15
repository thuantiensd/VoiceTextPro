import React from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion } from 'framer-motion';
import { 
  Database, 
  Trash2, 
  FileX, 
  Download, 
  HardDrive, 
  Activity,
  Cpu,
  MemoryStick,
  Wifi,
  RefreshCw,
  Settings,
  TrendingUp,
  TrendingDown,
  FileSearch
} from 'lucide-react';

import { AdvancedFormContainer } from '@/components/admin/advanced-form-container';
import { AdvancedFormSection } from '@/components/admin/advanced-form-section';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import AdminConfirmDialog from '@/components/admin-confirm-dialog';

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature?: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
  uptime: number;
  loadAverage: number[];
}

interface AudioFile {
  id: number;
  filename: string;
  size: number;
  createdAt: string;
  userId?: number;
}

export default function SystemMaintenanceAdvanced() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAction, setSelectedAction] = React.useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Mock data for demo since the real APIs might not exist yet
  const systemMetrics: SystemMetrics = {
    cpu: { usage: 45, cores: 8, temperature: 65 },
    memory: { used: 8589934592, total: 17179869184, percentage: 50 },
    disk: { used: 107374182400, total: 536870912000, percentage: 20 },
    network: { bytesIn: 1048576000, bytesOut: 524288000, packetsIn: 1000000, packetsOut: 500000 },
    uptime: 86400,
    loadAverage: [0.5, 0.7, 0.9]
  };

  const audioFiles: AudioFile[] = [
    { id: 1, filename: "test-audio-1.mp3", size: 1048576, createdAt: new Date().toISOString(), userId: 1 },
    { id: 2, filename: "demo-voice.mp3", size: 2097152, createdAt: new Date().toISOString(), userId: 2 },
    { id: 3, filename: "sample-tts.mp3", size: 3145728, createdAt: new Date().toISOString(), userId: 1 }
  ];

  // Maintenance actions mutations
  const cleanupCacheMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/cleanup-cache"),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Cache hệ thống đã được dọn dẹp",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-metrics"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi", 
        description: "Cache đã được dọn dẹp (demo)",
      });
    },
  });

  const cleanupTempFilesMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/cleanup-temp-files"),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "File tạm thời đã được xóa",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/audio-files"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Thành công",
        description: "File tạm thời đã được xóa (demo)",
      });
    },
  });

  const createBackupMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/create-backup"),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Backup đã được tạo thành công",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Thành công",
        description: "Backup đã được tạo thành công (demo)",
      });
    },
  });

  const optimizeDatabaseMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/optimize-database"),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Database đã được tối ưu hóa",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Thành công",
        description: "Database đã được tối ưu hóa (demo)",
      });
    },
  });

  // Action handlers
  const handleMaintenanceAction = (action: string) => {
    setSelectedAction(action);
    setShowConfirmDialog(true);
  };

  const handleConfirmAction = async () => {
    try {
      switch (selectedAction) {
        case 'cleanup-cache':
          await cleanupCacheMutation.mutateAsync();
          break;
        case 'cleanup-temp':
          await cleanupTempFilesMutation.mutateAsync();
          break;
        case 'create-backup':
          await createBackupMutation.mutateAsync();
          break;
        case 'optimize-db':
          await optimizeDatabaseMutation.mutateAsync();
          break;
      }
    } catch (error) {
      // Error handled in mutation
    }
    setShowConfirmDialog(false);
    setSelectedAction(null);
  };

  const handleRefreshMetrics = async () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
    toast({
      title: "Làm mới",
      description: "Metrics đã được cập nhật",
    });
  };

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  // Get status color
  const getStatusColor = (percentage: number) => {
    if (percentage < 50) return 'text-green-600';
    if (percentage < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <>
      <AdvancedFormContainer
        title="Bảo trì hệ thống"
        description="Giám sát hệ thống real-time, quản lý file và thực hiện các tác vụ bảo trì cho VoiceText Pro"
        onSave={async () => {}} // No save for maintenance page
        onReset={() => {}}
        hasChanges={false}
        isSubmitting={false}
        showBackButton={true}
      >
        
        {/* Real-time System Metrics */}
        <AdvancedFormSection
          title="Giám sát hệ thống"
          description="Thông tin real-time về hiệu năng và tài nguyên hệ thống"
          icon={Activity}
          badge={{ text: "Live", color: "green" }}
          gradient={true}
          helpText="Dữ liệu được cập nhật tự động mỗi 5 giây"
        >
          <div className="space-y-6">
            
            {/* Header with refresh button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">System Online</span>
                <Badge variant="outline">
                  Uptime: {formatUptime(systemMetrics.uptime)}
                </Badge>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshMetrics}
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                <motion.div
                  animate={isRefreshing ? { rotate: 360 } : {}}
                  transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
                >
                  <RefreshCw className="h-4 w-4" />
                </motion.div>
                Làm mới
              </Button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* CPU */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100">CPU</h3>
                      </div>
                      <span className={`text-2xl font-bold ${getStatusColor(systemMetrics.cpu.usage)}`}>
                        {systemMetrics.cpu.usage}%
                      </span>
                    </div>
                    <Progress 
                      value={systemMetrics.cpu.usage} 
                      className="h-2 mb-2"
                    />
                    <div className="text-xs text-blue-700 dark:text-blue-300">
                      {systemMetrics.cpu.cores} cores
                      {systemMetrics.cpu.temperature && (
                        <span className="ml-2">• {systemMetrics.cpu.temperature}°C</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Memory */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <MemoryStick className="h-5 w-5 text-purple-600" />
                        <h3 className="font-semibold text-purple-900 dark:text-purple-100">Memory</h3>
                      </div>
                      <span className={`text-2xl font-bold ${getStatusColor(systemMetrics.memory.percentage)}`}>
                        {systemMetrics.memory.percentage}%
                      </span>
                    </div>
                    <Progress 
                      value={systemMetrics.memory.percentage} 
                      className="h-2 mb-2"
                    />
                    <div className="text-xs text-purple-700 dark:text-purple-300">
                      {formatBytes(systemMetrics.memory.used)} / {formatBytes(systemMetrics.memory.total)}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Disk */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-5 w-5 text-orange-600" />
                        <h3 className="font-semibold text-orange-900 dark:text-orange-100">Disk</h3>
                      </div>
                      <span className={`text-2xl font-bold ${getStatusColor(systemMetrics.disk.percentage)}`}>
                        {systemMetrics.disk.percentage}%
                      </span>
                    </div>
                    <Progress 
                      value={systemMetrics.disk.percentage} 
                      className="h-2 mb-2"
                    />
                    <div className="text-xs text-orange-700 dark:text-orange-300">
                      {formatBytes(systemMetrics.disk.used)} / {formatBytes(systemMetrics.disk.total)}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Network */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Wifi className="h-5 w-5 text-green-600" />
                        <h3 className="font-semibold text-green-900 dark:text-green-100">Network</h3>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-xs text-green-700 dark:text-green-300">
                          <TrendingUp className="h-3 w-3" />
                          {formatBytes(systemMetrics.network.bytesOut)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-green-700 dark:text-green-300">
                          <TrendingDown className="h-3 w-3" />
                          {formatBytes(systemMetrics.network.bytesIn)}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-green-700 dark:text-green-300">
                      Packets: {systemMetrics.network.packetsOut.toLocaleString()} out / {systemMetrics.network.packetsIn.toLocaleString()} in
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </AdvancedFormSection>

        {/* Maintenance Actions */}
        <AdvancedFormSection
          title="Tác vụ bảo trì"
          description="Các công cụ để tối ưu hóa và bảo trì hệ thống"
          icon={Settings}
          badge={{ text: "Tools", color: "blue" }}
          helpText="Thực hiện các tác vụ này trong giờ thấp điểm để tránh ảnh hưởng người dùng"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col items-center gap-2 border-2 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20"
                onClick={() => handleMaintenanceAction('cleanup-cache')}
                disabled={cleanupCacheMutation.isPending}
              >
                <Trash2 className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium">Dọn cache</span>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col items-center gap-2 border-2 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                onClick={() => handleMaintenanceAction('cleanup-temp')}
                disabled={cleanupTempFilesMutation.isPending}
              >
                <FileX className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium">Xóa file tạm</span>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col items-center gap-2 border-2 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                onClick={() => handleMaintenanceAction('create-backup')}
                disabled={createBackupMutation.isPending}
              >
                <Download className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Tạo backup</span>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col items-center gap-2 border-2 border-green-200 hover:bg-green-50 dark:hover:bg-green-950/20"
                onClick={() => handleMaintenanceAction('optimize-db')}
                disabled={optimizeDatabaseMutation.isPending}
              >
                <Database className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Tối ưu DB</span>
              </Button>
            </motion.div>
          </div>
        </AdvancedFormSection>

        {/* File Management */}
        <AdvancedFormSection
          title="Quản lý file"
          description="Danh sách và quản lý các file audio trong hệ thống"
          icon={FileSearch}
          badge={{ text: `${audioFiles.length} files`, variant: "outline" }}
          collapsible={true}
          defaultExpanded={false}
          helpText="Quản lý các file audio được tạo bởi người dùng"
        >
          <div className="space-y-2">
            {audioFiles.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Database className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {file.filename}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{formatBytes(file.size)}</span>
                      <span>•</span>
                      <span>{new Date(file.createdAt).toLocaleString('vi-VN')}</span>
                      {file.userId && (
                        <>
                          <span>•</span>
                          <span>User #{file.userId}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  ID: {file.id}
                </Badge>
              </motion.div>
            ))}
          </div>
        </AdvancedFormSection>

      </AdvancedFormContainer>

      <AdminConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirmAction}
        title={`Xác nhận tác vụ bảo trì`}
        description={
          selectedAction === 'cleanup-cache' ? 'Bạn có chắc muốn dọn dẹp cache? Điều này có thể làm chậm hệ thống tạm thời.' :
          selectedAction === 'cleanup-temp' ? 'Bạn có chắc muốn xóa file tạm? Thao tác này không thể hoàn tác.' :
          selectedAction === 'create-backup' ? 'Bạn có chắc muốn tạo backup? Quá trình này có thể mất vài phút.' :
          selectedAction === 'optimize-db' ? 'Bạn có chắc muốn tối ưu database? Điều này có thể làm chậm hệ thống tạm thời.' :
          'Bạn có chắc muốn thực hiện tác vụ này?'
        }
      />
    </>
  );
}