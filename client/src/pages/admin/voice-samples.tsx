import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAdminFormState } from "@/hooks/useAdminFormState";
import { Mic, Play, Save, Settings, RotateCcw } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Breadcrumb from "@/components/breadcrumb";
import AdminConfirmDialog from "@/components/admin-confirm-dialog";
import type { UpdateAppSettings, AppSettings } from "@shared/schema";

export default function VoiceSamples() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [sampleText, setSampleText] = useState("Xin chào, đây là mẫu giọng nói cho hệ thống VoiceText Pro. Chúng tôi cung cấp dịch vụ chuyển đổi văn bản thành giọng nói chất lượng cao với nhiều giọng đọc tự nhiên.");
  const [selectedVoice, setSelectedVoice] = useState("vi-VN-HoaiMy");
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);

  // Load voice sample settings from app settings
  const { data: appSettings, isLoading } = useQuery({
    queryKey: ["/api/admin/app-settings"],
  });

  const createVoiceSample = useMutation({
    mutationFn: async ({ text, voice }: { text: string; voice: string }) => {
      return await apiRequest("POST", "/api/admin/create-voice-sample", { text, voice });
    },
    onSuccess: (data: any) => {
      setGeneratedAudio(data.audioUrl);
      toast({
        title: "Thành công",
        description: "Mẫu giọng nói đã được tạo thành công",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Settings update mutation
  const updateSettings = useMutation({
    mutationFn: async (data: UpdateAppSettings) => {
      return await apiRequest("PUT", "/api/admin/app-settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Cài đặt mẫu giọng nói đã được cập nhật",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/app-settings"] });
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

  const handleCreateVoiceSample = () => {
    if (!sampleText.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập văn bản mẫu",
        variant: "destructive",
      });
      return;
    }
    
    createVoiceSample.mutate({ text: sampleText, voice: selectedVoice });
  };

  const handleSettingsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: UpdateAppSettings = {
      enableVoicePreview: formData.get("enableVoicePreview") === "on",
      defaultSampleText: formData.get("defaultSampleText") as string,
      voicePreviewDuration: Number(formData.get("voicePreviewDuration")),
    };
    formState.handleSubmit(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const voiceOptions = [
    { value: "vi-VN-HoaiMy", label: "Hoài My - Giọng nữ miền Bắc (tự nhiên)" },
    { value: "vi-VN-NamMinh", label: "Nam Minh - Giọng nam miền Bắc (rõ ràng)" },
    { value: "vi-VN-ThuHa", label: "Thu Hà - Giọng nữ miền Trung (ấm áp)" },
    { value: "vi-VN-QuangAnh", label: "Quang Anh - Giọng nam miền Nam (thân thiện)" },
    { value: "vi-VN-HongLan", label: "Hồng Lan - Giọng nữ miền Nam (dịu dàng)" },
    { value: "vi-VN-TuanVu", label: "Tuấn Vũ - Giọng nam trầm ấm (chuyên nghiệp)" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Breadcrumb 
          title="Tạo mẫu giọng nói" 
          showBackButton={true} 
          backUrl="/admin"
        />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-orange-600" />
              Tạo mẫu giọng nói
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tạo và quản lý các mẫu âm thanh để người dùng nghe thử các giọng nói
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Sample Text Input */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Văn bản mẫu</h3>
              <div className="space-y-2">
                <Label htmlFor="sampleText">Nội dung mẫu</Label>
                <Textarea
                  id="sampleText"
                  value={sampleText}
                  onChange={(e) => setSampleText(e.target.value)}
                  placeholder="Nhập văn bản để tạo mẫu giọng nói..."
                  className="min-h-[120px]"
                />
                <p className="text-xs text-gray-500">
                  Văn bản này sẽ được chuyển đổi thành audio mẫu cho từng giọng nói
                </p>
              </div>
            </div>

            {/* Voice Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Chọn giọng nói</h3>
              <div className="space-y-2">
                <Label htmlFor="sampleVoice">Giọng nói</Label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {voiceOptions.map((voice) => (
                      <SelectItem key={voice.value} value={voice.value}>
                        {voice.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Chọn giọng nói để tạo mẫu audio demo
                </p>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-center pt-4">
              <Button 
                onClick={handleCreateVoiceSample}
                disabled={createVoiceSample.isPending || !sampleText.trim()}
                size="lg"
                className="min-w-48"
              >
                <Mic className="h-4 w-4 mr-2" />
                {createVoiceSample.isPending ? "Đang tạo..." : "Tạo mẫu giọng nói"}
              </Button>
            </div>

            {/* Generated Audio */}
            {generatedAudio && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Mẫu âm thanh đã tạo</h3>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium">
                      Giọng: {voiceOptions.find(v => v.value === selectedVoice)?.label}
                    </p>
                    <Play className="h-4 w-4 text-green-600" />
                  </div>
                  <audio controls className="w-full">
                    <source src={generatedAudio} type="audio/mpeg" />
                    Trình duyệt của bạn không hỗ trợ phát audio.
                  </audio>
                  <p className="text-xs text-gray-500 mt-2">
                    File audio mẫu có thể được sử dụng cho voice preview
                  </p>
                </div>
              </div>
            )}

            {/* Usage Instructions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Hướng dẫn sử dụng</h3>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-disc list-inside">
                  <li>Tạo mẫu giọng nói cho từng voice để người dùng có thể nghe thử</li>
                  <li>Nên sử dụng văn bản mô tả tính năng hoặc giới thiệu dịch vụ</li>
                  <li>Độ dài văn bản nên từ 20-100 từ để tạo mẫu demo hiệu quả</li>
                  <li>Mẫu audio sẽ được lưu trữ và hiển thị trong phần voice preview</li>
                  <li>Có thể tạo nhiều mẫu khác nhau cho từng giọng nói</li>
                </ul>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Voice Sample Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Cài đặt mẫu giọng nói
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Cấu hình các thiết lập chung cho tính năng mẫu giọng nói
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSettingsSubmit} className="space-y-6">
              
              {/* Voice Preview Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div>
                    <Label className="text-base font-medium">Kích hoạt Voice Preview</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Cho phép người dùng nghe thử giọng nói trước khi tạo audio
                    </p>
                  </div>
                  <Switch
                    name="enableVoicePreview"
                    checked={formState.currentData?.enableVoicePreview ?? true}
                    onCheckedChange={(checked) => {
                      const updatedData = { ...formState.currentData, enableVoicePreview: checked };
                      formState.setCurrentData(updatedData);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultSampleText">Văn bản mẫu mặc định</Label>
                  <Textarea
                    id="defaultSampleText"
                    name="defaultSampleText"
                    value={formState.currentData?.defaultSampleText ?? "Đây là mẫu giọng nói cho VoiceText Pro"}
                    onChange={formState.handleInputChange}
                    placeholder="Nhập văn bản mẫu mặc định..."
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">
                    Văn bản này sẽ được sử dụng làm mẫu mặc định cho voice preview
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="voicePreviewDuration">Thời lượng preview tối đa (giây)</Label>
                  <Input
                    id="voicePreviewDuration"
                    name="voicePreviewDuration"
                    type="number"
                    value={formState.currentData?.voicePreviewDuration ?? 30}
                    onChange={formState.handleInputChange}
                    min="5"
                    max="60"
                    placeholder="30"
                  />
                  <p className="text-xs text-gray-500">
                    Giới hạn thời lượng tối đa cho mỗi lần preview giọng nói
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t">
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
                      <Save className="h-4 w-4" />
                      Lưu cài đặt
                    </>
                  )}
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
        title="Xác nhận lưu cài đặt"
        description="Bạn có chắc chắn muốn lưu các thay đổi cài đặt mẫu giọng nói này?"
      />
    </div>
  );
}