import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAdminFormState } from "@/hooks/useAdminFormState";
import AdminConfirmDialog from "@/components/admin-confirm-dialog";
import { Volume2, Settings, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Breadcrumb from "@/components/breadcrumb";
import type { UpdateAppSettings, AppSettings } from "@shared/schema";

export default function AudioSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: appSettings, isLoading } = useQuery({
    queryKey: ["/api/app-settings"],
  });

  const updateSettings = useMutation({
    mutationFn: async (data: UpdateAppSettings) => {
      return await apiRequest("PUT", "/api/admin/app-settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Cài đặt âm thanh đã được cập nhật",
      });
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
    initialData: appSettings as AppSettings,
    onSave: (data) => updateSettings.mutate(data),
  });

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: UpdateAppSettings = {
      maxAudioDuration: Number(formData.get("maxAudioDuration")),
      defaultAudioFormat: formData.get("defaultAudioFormat") as string,
      audioQuality: formData.get("audioQuality") as string,
    };
    formState.handleSubmit(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <Breadcrumb 
          title="Cài đặt âm thanh" 
          showBackButton={true} 
          backUrl="/admin"
        />
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Volume2 className="h-6 w-6 text-blue-600" />
            Cài đặt âm thanh
          </h2>
          
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="h-5 w-5 text-green-600" />
                  Cài đặt chung
                </h3>
                
                <div>
                  <Label htmlFor="maxAudioDuration">Thời lượng tối đa (giây)</Label>
                  <Input
                    id="maxAudioDuration"
                    name="maxAudioDuration"
                    type="number"
                    defaultValue={appSettings?.maxAudioDuration || 300}
                    onChange={formState.handleInputChange}
                    placeholder="300"
                  />
                </div>

                <div>
                  <Label htmlFor="defaultAudioFormat">Định dạng mặc định</Label>
                  <Select name="defaultAudioFormat" defaultValue={appSettings?.defaultAudioFormat || "mp3"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn định dạng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mp3">MP3</SelectItem>
                      <SelectItem value="wav">WAV</SelectItem>
                      <SelectItem value="ogg">OGG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Mic className="h-5 w-5 text-purple-600" />
                  Chất lượng âm thanh
                </h3>
                
                <div>
                  <Label htmlFor="audioQuality">Chất lượng mặc định</Label>
                  <Select name="audioQuality" defaultValue={appSettings?.audioQuality || "standard"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn chất lượng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Tiêu chuẩn</SelectItem>
                      <SelectItem value="high">Cao</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium mb-2">Hướng dẫn cài đặt</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Thời lượng tối đa: Giới hạn thời gian cho mỗi file audio</li>
                <li>• Định dạng mặc định: Định dạng xuất audio mặc định</li>
                <li>• Chất lượng: Ảnh hưởng đến dung lượng và chất lượng âm thanh</li>
              </ul>
            </div>

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
        </div>
      </div>

      <AdminConfirmDialog
        open={formState.showConfirmDialog}
        onOpenChange={formState.setShowConfirmDialog}
        onConfirm={formState.handleConfirmSave}
        title="Xác nhận lưu thay đổi"
        description="Bạn có chắc chắn muốn lưu các thay đổi cài đặt âm thanh này?"
      />
    </div>
  );
}