import React from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion } from 'framer-motion';
import { 
  Settings, 
  Users, 
  Crown, 
  Star, 
  Shield, 
  Zap,
  FileText,
  Type,
  Mic,
  Globe,
  Eye,
  Lock,
  Sparkles
} from 'lucide-react';

import { AdvancedFormContainer } from '@/components/admin/advanced-form-container';
import { AdvancedFormSection } from '@/components/admin/advanced-form-section';
import { AdvancedFormField } from '@/components/admin/advanced-form-field';
import AdminConfirmDialog from '@/components/admin-confirm-dialog';
import type { UpdateAppSettings, AppSettings } from "@shared/schema";

export default function AppSettingsAdvanced() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = React.useState<Partial<AppSettings>>({});
  const [hasChanges, setHasChanges] = React.useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | undefined>();

  // Load current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/admin/app-settings"],
    queryFn: () => apiRequest("GET", "/api/admin/app-settings"),
  });

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: async (data: UpdateAppSettings) => {
      return await apiRequest("PUT", "/api/admin/app-settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Cài đặt ứng dụng đã được cập nhật",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/app-settings"] });
      setHasChanges(false);
      setLastSaved(new Date());
      setShowConfirmDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Initialize form data when settings are loaded
  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // Handle field changes
  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setHasChanges(true);
  };

  // Handle form submission
  const handleSave = async () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmSave = async () => {
    await updateSettings.mutateAsync(formData as UpdateAppSettings);
  };

  // Handle reset
  const handleReset = () => {
    if (settings) {
      setFormData(settings);
      setHasChanges(false);
    }
  };

  // Handle export
  const handleExport = () => {
    const exportData = {
      ...formData,
      exportedAt: new Date(),
      version: "1.0"
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `app-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle import
  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        setFormData(importedData);
        setHasChanges(true);
        toast({
          title: "Nhập thành công",
          description: "Cài đặt đã được nhập từ file",
        });
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "File không hợp lệ",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <>
      <AdvancedFormContainer
        title="Cài đặt ứng dụng"
        description="Quản lý cài đặt tổng quan cho ứng dụng VoiceText Pro, bao gồm giới hạn cho từng gói dịch vụ và tính năng truy cập khách"
        onSave={handleSave}
        onReset={handleReset}
        onExport={handleExport}
        onImport={handleImport}
        hasChanges={hasChanges}
        isSubmitting={updateSettings.isPending}
        autoSave={true}
        autoSaveDelay={5000}
        lastSaved={lastSaved}
      >
        
        {/* Free Tier Settings */}
        <AdvancedFormSection
          title="Gói miễn phí"
          description="Cấu hình giới hạn cho người dùng gói miễn phí"
          icon={Users}
          badge={{ text: "Free", variant: "secondary" }}
          gradient={true}
          helpText="Gói miễn phí giúp người dùng trải nghiệm dịch vụ trước khi nâng cấp"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AdvancedFormField
              name="freeMaxFiles"
              label="Số file tối đa/tháng"
              type="number"
              value={formData.freeMaxFiles}
              onChange={(value) => handleFieldChange('freeMaxFiles', value)}
              icon={FileText}
              min={1}
              max={100}
              suffix="files"
              description="Số lượng file audio tối đa mà người dùng miễn phí có thể tạo mỗi tháng"
              validation={[
                { type: 'required', message: 'Vui lòng nhập số file tối đa' },
                { type: 'min', value: 1, message: 'Tối thiểu 1 file' },
                { type: 'max', value: 100, message: 'Tối đa 100 files' }
              ]}
              preview={true}
            />
            
            <AdvancedFormField
              name="freeMaxCharacters"
              label="Số ký tự tối đa/file"
              type="number"
              value={formData.freeMaxCharacters}
              onChange={(value) => handleFieldChange('freeMaxCharacters', value)}
              icon={Type}
              min={10}
              max={10000}
              suffix="ký tự"
              description="Số ký tự tối đa cho mỗi lần chuyển đổi của người dùng miễn phí"
              validation={[
                { type: 'required', message: 'Vui lòng nhập số ký tự tối đa' },
                { type: 'min', value: 10, message: 'Tối thiểu 10 ký tự' },
                { type: 'max', value: 10000, message: 'Tối đa 10,000 ký tự' }
              ]}
              preview={true}
            />
          </div>
        </AdvancedFormSection>

        {/* Pro Tier Settings */}
        <AdvancedFormSection
          title="Gói Pro"
          description="Cấu hình tính năng và giới hạn cho gói Pro"
          icon={Crown}
          badge={{ text: "Pro", color: "blue" }}
          gradient={true}
          helpText="Gói Pro dành cho người dùng cá nhân và doanh nghiệp nhỏ"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AdvancedFormField
              name="proMaxFiles"
              label="Số file tối đa/tháng"
              type="number"
              value={formData.proMaxFiles}
              onChange={(value) => handleFieldChange('proMaxFiles', value)}
              icon={FileText}
              min={1}
              max={10000}
              suffix="files"
              description="Số lượng file audio tối đa cho người dùng Pro"
              validation={[
                { type: 'required', message: 'Vui lòng nhập số file tối đa' },
                { type: 'min', value: 1, message: 'Tối thiểu 1 file' },
                { type: 'custom', 
                  validator: (val) => val > (formData.freeMaxFiles || 0),
                  message: 'Phải lớn hơn giới hạn gói miễn phí'
                }
              ]}
              preview={true}
            />
            
            <AdvancedFormField
              name="proMaxCharacters"
              label="Số ký tự tối đa/file"
              type="number"
              value={formData.proMaxCharacters}
              onChange={(value) => handleFieldChange('proMaxCharacters', value)}
              icon={Type}
              min={100}
              max={1000000}
              suffix="ký tự"
              description="Số ký tự tối đa cho mỗi lần chuyển đổi của gói Pro"
              validation={[
                { type: 'required', message: 'Vui lòng nhập số ký tự tối đa' },
                { type: 'min', value: 100, message: 'Tối thiểu 100 ký tự' },
                { type: 'custom',
                  validator: (val) => val > (formData.freeMaxCharacters || 0),
                  message: 'Phải lớn hơn giới hạn gói miễn phí'
                }
              ]}
              preview={true}
            />
          </div>
        </AdvancedFormSection>

        {/* Premium Tier Settings */}
        <AdvancedFormSection
          title="Gói Premium"
          description="Cấu hình tính năng cao cấp nhất cho gói Premium"
          icon={Star}
          badge={{ text: "Premium", color: "yellow" }}
          gradient={true}
          helpText="Gói Premium dành cho doanh nghiệp và người dùng chuyên nghiệp"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AdvancedFormField
              name="premiumMaxFiles"
              label="Số file tối đa/tháng"
              type="number"
              value={formData.premiumMaxFiles}
              onChange={(value) => handleFieldChange('premiumMaxFiles', value)}
              icon={FileText}
              min={1}
              max={100000}
              suffix="files"
              description="Số lượng file audio tối đa cho người dùng Premium"
              validation={[
                { type: 'required', message: 'Vui lòng nhập số file tối đa' },
                { type: 'min', value: 1, message: 'Tối thiểu 1 file' },
                { type: 'custom',
                  validator: (val) => val > (formData.proMaxFiles || 0),
                  message: 'Phải lớn hơn giới hạn gói Pro'
                }
              ]}
              preview={true}
            />
            
            <AdvancedFormField
              name="premiumMaxCharacters"
              label="Số ký tự tối đa/file"
              type="number"
              value={formData.premiumMaxCharacters}
              onChange={(value) => handleFieldChange('premiumMaxCharacters', value)}
              icon={Type}
              min={1000}
              max={10000000}
              suffix="ký tự"
              description="Số ký tự tối đa cho mỗi lần chuyển đổi của gói Premium"
              validation={[
                { type: 'required', message: 'Vui lòng nhập số ký tự tối đa' },
                { type: 'min', value: 1000, message: 'Tối thiểu 1,000 ký tự' },
                { type: 'custom',
                  validator: (val) => val > (formData.proMaxCharacters || 0),
                  message: 'Phải lớn hơn giới hạn gói Pro'
                }
              ]}
              preview={true}
            />
          </div>
        </AdvancedFormSection>

        {/* Guest Access Settings */}
        <AdvancedFormSection
          title="Truy cập khách"
          description="Quản lý tính năng truy cập cho người dùng chưa đăng ký"
          icon={Shield}
          badge={{ text: "Guest", variant: "outline" }}
          helpText="Cho phép người dùng trải nghiệm dịch vụ mà không cần đăng ký tài khoản"
        >
          <div className="space-y-6">
            <AdvancedFormField
              name="enableGuestAccess"
              label="Kích hoạt truy cập khách"
              type="switch"
              value={formData.enableGuestAccess}
              onChange={(value) => handleFieldChange('enableGuestAccess', value)}
              icon={Eye}
              description="Cho phép người dùng chưa đăng ký sử dụng dịch vụ với giới hạn"
            />
            
            {formData.enableGuestAccess && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <AdvancedFormField
                  name="guestMaxCharacters"
                  label="Số ký tự tối đa cho khách"
                  type="number"
                  value={formData.guestMaxCharacters}
                  onChange={(value) => handleFieldChange('guestMaxCharacters', value)}
                  icon={Type}
                  min={10}
                  max={1000}
                  suffix="ký tự"
                  description="Giới hạn ký tự cho người dùng khách"
                  validation={[
                    { type: 'required', message: 'Vui lòng nhập số ký tự tối đa' },
                    { type: 'min', value: 10, message: 'Tối thiểu 10 ký tự' },
                    { type: 'max', value: 1000, message: 'Tối đa 1,000 ký tự' }
                  ]}
                  preview={true}
                />
                
                <AdvancedFormField
                  name="guestVoices"
                  label="Giọng đọc cho khách"
                  type="textarea"
                  value={formData.guestVoices?.join(', ') || ''}
                  onChange={(value) => handleFieldChange('guestVoices', value.split(',').map((v: string) => v.trim()).filter(Boolean))}
                  icon={Mic}
                  rows={2}
                  description="Danh sách giọng đọc có sẵn cho người dùng khách (phân cách bằng dấu phẩy)"
                  validation={[
                    { type: 'required', message: 'Vui lòng nhập ít nhất một giọng đọc' }
                  ]}
                />
              </motion.div>
            )}
          </div>
        </AdvancedFormSection>

        {/* Advanced Features */}
        <AdvancedFormSection
          title="Tính năng nâng cao"
          description="Cấu hình các tính năng đặc biệt và bảo mật"
          icon={Sparkles}
          badge={{ text: "Advanced", color: "purple" }}
          collapsible={true}
          defaultExpanded={false}
          helpText="Các tính năng này ảnh hưởng đến trải nghiệm người dùng và bảo mật hệ thống"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AdvancedFormField
              name="enableVoicePreview"
              label="Kích hoạt Voice Preview"
              type="switch"
              value={formData.enableVoicePreview}
              onChange={(value) => handleFieldChange('enableVoicePreview', value)}
              icon={Eye}
              description="Cho phép người dùng nghe thử giọng đọc trước khi tạo file"
            />
            
            <AdvancedFormField
              name="maxTextLength"
              label="Độ dài văn bản tối đa"
              type="number"
              value={formData.maxTextLength}
              onChange={(value) => handleFieldChange('maxTextLength', value)}
              icon={Type}
              min={100}
              max={100000}
              suffix="ký tự"
              description="Giới hạn tổng độ dài văn bản trong toàn hệ thống"
              validation={[
                { type: 'required', message: 'Vui lòng nhập độ dài tối đa' },
                { type: 'min', value: 100, message: 'Tối thiểu 100 ký tự' }
              ]}
              preview={true}
            />
            
            <AdvancedFormField
              name="defaultLanguage"
              label="Ngôn ngữ mặc định"
              type="select"
              value={formData.defaultLanguage}
              onChange={(value) => handleFieldChange('defaultLanguage', value)}
              icon={Globe}
              options={[
                { value: 'vi', label: 'Tiếng Việt' },
                { value: 'en', label: 'English' },
                { value: 'ja', label: '日本語' },
                { value: 'ko', label: '한국어' },
                { value: 'zh', label: '中文' }
              ]}
              description="Ngôn ngữ được chọn mặc định khi tạo audio mới"
              validation={[
                { type: 'required', message: 'Vui lòng chọn ngôn ngữ mặc định' }
              ]}
            />
            
            <AdvancedFormField
              name="allowedLanguages"
              label="Ngôn ngữ được phép"
              type="textarea"
              value={formData.allowedLanguages?.join(', ') || ''}
              onChange={(value) => handleFieldChange('allowedLanguages', value.split(',').map((v: string) => v.trim()).filter(Boolean))}
              icon={Globe}
              rows={2}
              description="Danh sách ngôn ngữ người dùng có thể sử dụng (phân cách bằng dấu phẩy)"
              validation={[
                { type: 'required', message: 'Vui lòng nhập ít nhất một ngôn ngữ' }
              ]}
            />
          </div>
        </AdvancedFormSection>

      </AdvancedFormContainer>

      <AdminConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirmSave}
        title="Xác nhận lưu cài đặt"
        description="Bạn có chắc chắn muốn lưu các thay đổi cài đặt ứng dụng? Điều này sẽ ảnh hưởng đến tất cả người dùng."
      />
    </>
  );
} 