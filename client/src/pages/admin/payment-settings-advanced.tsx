import React from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Building, 
  Phone, 
  Mail, 
  DollarSign, 
  Package, 
  QrCode,
  Shield,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Globe,
  Banknote
} from 'lucide-react';

import { AdvancedFormContainer } from '@/components/admin/advanced-form-container';
import { AdvancedFormSection } from '@/components/admin/advanced-form-section';
import { AdvancedFormField } from '@/components/admin/advanced-form-field';
import AdminConfirmDialog from '@/components/admin-confirm-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { UpdatePaymentSettings, PaymentSettings } from "@shared/schema";

export default function PaymentSettingsAdvanced() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = React.useState<Partial<PaymentSettings>>({});
  const [hasChanges, setHasChanges] = React.useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | undefined>();

  // Load current payment settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/payment-settings"],
    queryFn: () => apiRequest("GET", "/api/payment-settings"),
  });

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: async (data: UpdatePaymentSettings) => {
      return await apiRequest("PUT", "/api/payment-settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Cài đặt thanh toán đã được cập nhật",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-settings"] });
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

  // Initialize form data
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
    await updateSettings.mutateAsync(formData as UpdatePaymentSettings);
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
    a.download = `payment-settings-${new Date().toISOString().split('T')[0]}.json`;
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
          description: "Cài đặt thanh toán đã được nhập từ file",
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

  // Calculate yearly discount
  const calculateDiscount = (monthly: number, yearly: number) => {
    if (!monthly || !yearly) return 0;
    const monthlyTotal = monthly * 12;
    const discount = ((monthlyTotal - yearly) / monthlyTotal) * 100;
    return Math.round(discount);
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
        title="Cài đặt thanh toán"
        description="Quản lý thông tin thanh toán, bảng giá dịch vụ và cấu hình các phương thức thanh toán cho VoiceText Pro"
        onSave={handleSave}
        onReset={handleReset}
        onExport={handleExport}
        onImport={handleImport}
        hasChanges={hasChanges}
        isSubmitting={updateSettings.isPending}
        autoSave={false}
        lastSaved={lastSaved}
      >
        
        {/* Bank Information */}
        <AdvancedFormSection
          title="Thông tin ngân hàng"
          description="Cấu hình thông tin tài khoản ngân hàng để nhận thanh toán"
          icon={Building}
          badge={{ text: "Bank", color: "blue" }}
          gradient={true}
          helpText="Thông tin này sẽ hiển thị cho khách hàng khi thực hiện thanh toán"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AdvancedFormField
              name="bankName"
              label="Tên ngân hàng"
              type="text"
              value={formData.bankName}
              onChange={(value) => handleFieldChange('bankName', value)}
              icon={Building}
              placeholder="Ngân hàng TMCP Công Thương Việt Nam"
              description="Tên đầy đủ của ngân hàng"
              validation={[
                { type: 'required', message: 'Vui lòng nhập tên ngân hàng' },
                { type: 'min', value: 3, message: 'Tên ngân hàng phải có ít nhất 3 ký tự' }
              ]}
              required
            />
            
            <AdvancedFormField
              name="bankCode"
              label="Mã ngân hàng"
              type="text"
              value={formData.bankCode}
              onChange={(value) => handleFieldChange('bankCode', value)}
              icon={CreditCard}
              placeholder="ICB"
              description="Mã ngắn của ngân hàng (Swift code hoặc Bank code)"
              validation={[
                { type: 'required', message: 'Vui lòng nhập mã ngân hàng' },
                { type: 'pattern', value: '^[A-Z0-9]{2,10}$', message: 'Mã ngân hàng không hợp lệ' }
              ]}
              required
            />
            
            <AdvancedFormField
              name="accountNumber"
              label="Số tài khoản"
              type="text"
              value={formData.accountNumber}
              onChange={(value) => handleFieldChange('accountNumber', value)}
              icon={CreditCard}
              placeholder="1234567890123456"
              description="Số tài khoản ngân hàng để nhận thanh toán"
              validation={[
                { type: 'required', message: 'Vui lòng nhập số tài khoản' },
                { type: 'pattern', value: '^[0-9]{8,20}$', message: 'Số tài khoản không hợp lệ' }
              ]}
              required
            />
            
            <AdvancedFormField
              name="accountName"
              label="Tên chủ tài khoản"
              type="text"
              value={formData.accountName}
              onChange={(value) => handleFieldChange('accountName', value)}
              icon={Building}
              placeholder="NGUYEN VAN A"
              description="Tên chủ tài khoản (in hoa, không dấu)"
              validation={[
                { type: 'required', message: 'Vui lòng nhập tên chủ tài khoản' },
                { type: 'pattern', value: '^[A-Z ]{3,50}$', message: 'Tên phải in hoa, không dấu, 3-50 ký tự' }
              ]}
              required
            />
          </div>
        </AdvancedFormSection>

        {/* Support Information */}
        <AdvancedFormSection
          title="Thông tin hỗ trợ"
          description="Thông tin liên hệ để hỗ trợ khách hàng về thanh toán"
          icon={Shield}
          badge={{ text: "Support", color: "green" }}
          helpText="Thông tin này sẽ được hiển thị khi khách hàng cần hỗ trợ về thanh toán"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AdvancedFormField
              name="supportEmail"
              label="Email hỗ trợ"
              type="email"
              value={formData.supportEmail}
              onChange={(value) => handleFieldChange('supportEmail', value)}
              icon={Mail}
              placeholder="support@voicetextpro.com"
              description="Email để khách hàng liên hệ khi có vấn đề về thanh toán"
              validation={[
                { type: 'required', message: 'Vui lòng nhập email hỗ trợ' },
                { type: 'pattern', value: '^[^@]+@[^@]+\.[^@]+$', message: 'Email không hợp lệ' }
              ]}
              required
            />
            
            <AdvancedFormField
              name="supportPhone"
              label="Số điện thoại hỗ trợ"
              type="text"
              value={formData.supportPhone}
              onChange={(value) => handleFieldChange('supportPhone', value)}
              icon={Phone}
              placeholder="0123456789"
              description="Số điện thoại hotline hỗ trợ thanh toán"
              validation={[
                { type: 'required', message: 'Vui lòng nhập số điện thoại' },
                { type: 'pattern', value: '^[0-9]{10,11}$', message: 'Số điện thoại không hợp lệ' }
              ]}
              required
            />
          </div>
        </AdvancedFormSection>

        {/* Pricing Plans */}
        <AdvancedFormSection
          title="Bảng giá dịch vụ"
          description="Cấu hình giá cho các gói dịch vụ Pro và Premium"
          icon={DollarSign}
          badge={{ text: "Pricing", color: "yellow" }}
          gradient={true}
          helpText="Giá sẽ được hiển thị trên trang pricing và trong quá trình thanh toán"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Pro Plan */}
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">Gói Pro</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Dành cho cá nhân & SME</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <AdvancedFormField
                    name="proMonthlyPrice"
                    label="Giá hàng tháng"
                    type="number"
                    value={formData.proMonthlyPrice}
                    onChange={(value) => handleFieldChange('proMonthlyPrice', value)}
                    icon={Banknote}
                    min={1000}
                    max={10000000}
                    step={1000}
                    suffix="VND"
                    description="Giá gói Pro theo tháng"
                    validation={[
                      { type: 'required', message: 'Vui lòng nhập giá tháng' },
                      { type: 'min', value: 1000, message: 'Tối thiểu 1,000 VND' }
                    ]}
                    preview={true}
                    required
                  />
                  
                  <AdvancedFormField
                    name="proYearlyPrice"
                    label="Giá hàng năm"
                    type="number"
                    value={formData.proYearlyPrice}
                    onChange={(value) => handleFieldChange('proYearlyPrice', value)}
                    icon={Banknote}
                    min={10000}
                    max={100000000}
                    step={1000}
                    suffix="VND"
                    description="Giá gói Pro theo năm (thường có chiết khấu)"
                    validation={[
                      { type: 'required', message: 'Vui lòng nhập giá năm' },
                      { type: 'min', value: 10000, message: 'Tối thiểu 10,000 VND' }
                    ]}
                    preview={true}
                    required
                  />
                  
                  {formData.proMonthlyPrice && formData.proYearlyPrice && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                    >
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-medium">
                          Tiết kiệm {calculateDiscount(formData.proMonthlyPrice, formData.proYearlyPrice)}% 
                          khi đăng ký theo năm
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-purple-900 dark:text-purple-100">Gói Premium</h3>
                    <p className="text-sm text-purple-700 dark:text-purple-300">Dành cho doanh nghiệp</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <AdvancedFormField
                    name="premiumMonthlyPrice"
                    label="Giá hàng tháng"
                    type="number"
                    value={formData.premiumMonthlyPrice}
                    onChange={(value) => handleFieldChange('premiumMonthlyPrice', value)}
                    icon={Banknote}
                    min={1000}
                    max={10000000}
                    step={1000}
                    suffix="VND"
                    description="Giá gói Premium theo tháng"
                    validation={[
                      { type: 'required', message: 'Vui lòng nhập giá tháng' },
                      { type: 'min', value: 1000, message: 'Tối thiểu 1,000 VND' },
                      { type: 'custom',
                        validator: (val) => val > (formData.proMonthlyPrice || 0),
                        message: 'Phải lớn hơn giá gói Pro'
                      }
                    ]}
                    preview={true}
                    required
                  />
                  
                  <AdvancedFormField
                    name="premiumYearlyPrice"
                    label="Giá hàng năm"
                    type="number"
                    value={formData.premiumYearlyPrice}
                    onChange={(value) => handleFieldChange('premiumYearlyPrice', value)}
                    icon={Banknote}
                    min={10000}
                    max={100000000}
                    step={1000}
                    suffix="VND"
                    description="Giá gói Premium theo năm (thường có chiết khấu)"
                    validation={[
                      { type: 'required', message: 'Vui lòng nhập giá năm' },
                      { type: 'min', value: 10000, message: 'Tối thiểu 10,000 VND' },
                      { type: 'custom',
                        validator: (val) => val > (formData.proYearlyPrice || 0),
                        message: 'Phải lớn hơn giá gói Pro'
                      }
                    ]}
                    preview={true}
                    required
                  />
                  
                  {formData.premiumMonthlyPrice && formData.premiumYearlyPrice && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                    >
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-medium">
                          Tiết kiệm {calculateDiscount(formData.premiumMonthlyPrice, formData.premiumYearlyPrice)}% 
                          khi đăng ký theo năm
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </AdvancedFormSection>

        {/* QR Code & Additional Settings */}
        <AdvancedFormSection
          title="Cài đặt bổ sung"
          description="Cấu hình QR code thanh toán và các tùy chọn khác"
          icon={QrCode}
          badge={{ text: "Extra", variant: "outline" }}
          collapsible={true}
          defaultExpanded={false}
          helpText="Các tính năng bổ sung để cải thiện trải nghiệm thanh toán"
        >
          <div className="space-y-6">
            <AdvancedFormField
              name="qrCodeUrl"
              label="URL QR Code thanh toán"
              type="text"
              value={formData.qrCodeUrl}
              onChange={(value) => handleFieldChange('qrCodeUrl', value)}
              icon={QrCode}
              placeholder="https://img.vietqr.io/image/..."
              description="URL hình ảnh QR code cho thanh toán nhanh (tùy chọn)"
              validation={[
                { type: 'pattern', value: '^https?://.+', message: 'URL phải bắt đầu bằng http:// hoặc https://' }
              ]}
            />
            
            {formData.qrCodeUrl && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border"
              >
                <img 
                  src={formData.qrCodeUrl} 
                  alt="QR Code Preview" 
                  className="max-w-48 max-h-48 rounded-lg shadow-md"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </motion.div>
            )}
          </div>
        </AdvancedFormSection>

      </AdvancedFormContainer>

      <AdminConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirmSave}
        title="Xác nhận lưu cài đặt thanh toán"
        description="Bạn có chắc chắn muốn lưu các thay đổi cài đặt thanh toán? Điều này sẽ ảnh hưởng đến tất cả giao dịch thanh toán mới."
      />
    </>
  );
} 