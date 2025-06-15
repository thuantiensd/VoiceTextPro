import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAdminFormState } from "@/hooks/useAdminFormState";
import AdminConfirmDialog from "@/components/admin-confirm-dialog";
import { Settings, DollarSign, Package, Monitor, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import Breadcrumb from "@/components/breadcrumb";
import type { UpdatePaymentSettings, PaymentSettings, UpdateAppSettings, AppSettings } from "@shared/schema";

export default function GeneralSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load payment settings to get pricing
  const { data: paymentSettings, isLoading: paymentLoading } = useQuery({
    queryKey: ["/api/payment-settings"],
  });

  // Load app settings for banner configuration
  const { data: appSettings, isLoading: appLoading } = useQuery({
    queryKey: ["/api/admin/app-settings"],
  });

  const updatePaymentSettings = useMutation({
    mutationFn: async (data: UpdatePaymentSettings) => {
      return await apiRequest("PUT", "/api/payment-settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Cài đặt thanh toán đã được cập nhật",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-settings"] });
      paymentFormState.resetFormState();
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi", 
        description: error.message,
        variant: "destructive",
      });
      paymentFormState.setIsSubmitting(false);
    },
  });

  const updateAppSettings = useMutation({
    mutationFn: async (data: UpdateAppSettings) => {
      return await apiRequest("PUT", "/api/admin/app-settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Cài đặt banner đã được cập nhật",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/app-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/app-settings"] });
      bannerFormState.resetFormState();
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi", 
        description: error.message,
        variant: "destructive",
      });
      bannerFormState.setIsSubmitting(false);
    },
  });

  const paymentFormState = useAdminFormState<UpdatePaymentSettings>({
    initialData: paymentSettings as PaymentSettings,
    onSave: (data) => updatePaymentSettings.mutate(data),
  });

  const bannerFormState = useAdminFormState<UpdateAppSettings>({
    initialData: appSettings as AppSettings,
    onSave: (data) => updateAppSettings.mutate(data),
  });

  const handlePaymentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: UpdatePaymentSettings = {
      proMonthlyPrice: Number(formData.get("proMonthlyPrice")),
      proYearlyPrice: Number(formData.get("proYearlyPrice")),
      premiumMonthlyPrice: Number(formData.get("premiumMonthlyPrice")),
      premiumYearlyPrice: Number(formData.get("premiumYearlyPrice")),
    };
    paymentFormState.handleSubmit(data);
  };

  const handleBannerSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: UpdateAppSettings = {
      enableUpgradeBanner: formData.get("enableUpgradeBanner") === "on",
      bannerTitle: formData.get("bannerTitle") as string,
      bannerDescription: formData.get("bannerDescription") as string,
      bannerButtonText: formData.get("bannerButtonText") as string,
    };
    bannerFormState.handleSubmit(data);
  };

  if (paymentLoading || appLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Breadcrumb 
          title="Cài đặt chung" 
          showBackButton={true} 
          backUrl="/admin"
        />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Cài đặt chung hệ thống
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Quản lý cài đặt tổng quan và bảng giá dịch vụ
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              
              {/* Pricing Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Bảng giá dịch vụ
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pro Plan */}
                  <div className="space-y-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100">Gói Pro</h4>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="proMonthlyPrice">Giá tháng (VND)</Label>
                        <Input 
                          id="proMonthlyPrice"
                          name="proMonthlyPrice"
                          type="number"
                          value={formState.currentData?.proMonthlyPrice || paymentSettings?.proMonthlyPrice || 99000}
                          onChange={formState.handleInputChange}
                          placeholder="99000"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="proYearlyPrice">Giá năm (VND)</Label>
                        <Input 
                          id="proYearlyPrice"
                          name="proYearlyPrice"
                          type="number"
                          value={formState.currentData?.proYearlyPrice || paymentSettings?.proYearlyPrice || 990000}
                          onChange={formState.handleInputChange}
                          placeholder="990000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Premium Plan */}
                  <div className="space-y-4 p-4 border rounded-lg bg-purple-50 dark:bg-purple-950/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="h-5 w-5 text-purple-600" />
                      <h4 className="font-semibold text-purple-900 dark:text-purple-100">Gói Premium</h4>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="premiumMonthlyPrice">Giá tháng (VND)</Label>
                        <Input 
                          id="premiumMonthlyPrice"
                          name="premiumMonthlyPrice"
                          type="number"
                          value={formState.currentData?.premiumMonthlyPrice || paymentSettings?.premiumMonthlyPrice || 199000}
                          onChange={formState.handleInputChange}
                          placeholder="199000"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="premiumYearlyPrice">Giá năm (VND)</Label>
                        <Input 
                          id="premiumYearlyPrice"
                          name="premiumYearlyPrice"
                          type="number"
                          value={formState.currentData?.premiumYearlyPrice || paymentSettings?.premiumYearlyPrice || 1990000}
                          onChange={formState.handleInputChange}
                          placeholder="1990000"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing Guidelines */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium mb-2">Hướng dẫn định giá</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Gói Pro: Phù hợp cho người dùng cá nhân và doanh nghiệp nhỏ</li>
                    <li>• Gói Premium: Dành cho doanh nghiệp và người dùng chuyên nghiệp</li>
                    <li>• Giá năm thường có khuyến mãi 10-20% so với giá tháng</li>
                    <li>• Cân nhắc đối thủ cạnh tranh khi điều chỉnh giá</li>
                  </ul>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex gap-4 pt-6 border-t">
                {formState.hasChanges && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={formState.handleReset}
                  >
                    Hủy thay đổi
                  </Button>
                )}
                <Button 
                  type="submit" 
                  disabled={formState.isSubmitting || !formState.hasChanges}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {formState.isSubmitting ? "Đang lưu..." : "Lưu cài đặt"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <AdminConfirmDialog
        open={formState.showConfirmDialog}
        onOpenChange={formState.setShowConfirmDialog}
        onConfirm={formState.handleConfirmSave}
        title="Xác nhận lưu thay đổi"
        description="Bạn có chắc chắn muốn lưu các thay đổi bảng giá này?"
      />
    </div>
  );
}