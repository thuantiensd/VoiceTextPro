import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAdminFormState } from "@/hooks/useAdminFormState";
import { Monitor, RotateCcw, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import Breadcrumb from "@/components/breadcrumb";
import type { UpdateAppSettings, AppSettings } from "@shared/schema";

export default function BannerSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load app settings for banner configuration
  const { data: appSettings, isLoading } = useQuery({
    queryKey: ["/api/admin/app-settings"],
  });

  const updateSettings = useMutation({
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
      formState.resetFormState();
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi", 
        description: error.message,
        variant: "destructive",
      });
      formState.setIsSubmitting(false);
    },
  });

  const formState = useAdminFormState<UpdateAppSettings>({
    initialData: appSettings || {},
    onSave: (data) => updateSettings.mutate(data),
  });

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Submitting banner data:", formState.currentData);
    formState.handleSubmit(formState.currentData);
  };

  if (isLoading) {
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
          title="Cài đặt Banner" 
          showBackButton={true} 
          backUrl="/admin"
        />
        
        {/* Banner Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-purple-600" />
              Cấu hình Banner Nâng cấp
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Quản lý nội dung và hiển thị banner khuyến khích nâng cấp gói dịch vụ
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              
              {/* Banner Enable/Disable */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <div>
                  <Label className="text-base font-medium">Hiển thị Banner</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Bật/tắt hiển thị banner nâng cấp trên trang web
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={(formState.currentData as any)?.enableUpgradeBanner ?? true}
                    onCheckedChange={(checked) => {
                      const updatedData = { ...formState.currentData, enableUpgradeBanner: checked };
                      formState.setCurrentData(updatedData);
                    }}
                  />
                  <Badge variant={(formState.currentData as any)?.enableUpgradeBanner ? "default" : "secondary"}>
                    {(formState.currentData as any)?.enableUpgradeBanner ? (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        Hiển thị
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        Ẩn
                      </>
                    )}
                  </Badge>
                </div>
              </div>

              {/* Banner Content */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Nội dung Banner</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bannerTitle">Tiêu đề Banner</Label>
                    <Input
                      id="bannerTitle"
                      name="bannerTitle"
                      value={formState.currentData?.bannerTitle ?? "Nâng cấp VoiceText Pro"}
                      onChange={formState.handleInputChange}
                      placeholder="Nhập tiêu đề banner..."
                      className="text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bannerDescription">Mô tả Banner</Label>
                    <Textarea
                      id="bannerDescription"
                      name="bannerDescription"
                      value={formState.currentData?.bannerDescription ?? "Tận hưởng không giới hạn ký tự và giọng đọc chất lượng cao"}
                      onChange={formState.handleInputChange}
                      placeholder="Nhập mô tả banner..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bannerButtonText">Văn bản Nút</Label>
                    <Input
                      id="bannerButtonText"
                      name="bannerButtonText"
                      value={formState.currentData?.bannerButtonText ?? "Nâng cấp ngay"}
                      onChange={formState.handleInputChange}
                      placeholder="Nhập văn bản cho nút..."
                    />
                  </div>
                </div>
              </div>

              {/* Preview Banner */}
              {formState.currentData?.enableUpgradeBanner && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Xem trước Banner</h3>
                  <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-purple-50 dark:from-orange-950/20 dark:to-purple-950/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-orange-800 dark:text-orange-200 text-lg">
                            {formState.currentData?.bannerTitle || "Nâng cấp VoiceText Pro"}
                          </h4>
                          <p className="text-orange-700 dark:text-orange-300 mt-1">
                            {formState.currentData?.bannerDescription || "Tận hưởng không giới hạn ký tự và giọng đọc chất lượng cao"}
                          </p>
                        </div>
                        <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                          {formState.currentData?.bannerButtonText || "Nâng cấp ngay"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Action Buttons */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    {formState.hasChanges && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={formState.handleReset}
                        className="flex items-center gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Đặt lại
                      </Button>
                    )}
                    {!formState.hasChanges && <div />}
                    
                    <Button
                      type="submit"
                      disabled={formState.isSubmitting || !formState.hasChanges}
                      className="flex items-center gap-2"
                    >
                      {formState.isSubmitting ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Monitor className="h-4 w-4" />
                          Lưu cài đặt Banner
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}