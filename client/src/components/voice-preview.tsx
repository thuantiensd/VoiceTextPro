import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

// Cache cho audio previews với giới hạn kích thước
const audioCache = new Map<string, string>();
const MAX_CACHE_SIZE = 20; // Giới hạn 20 file cache

// Hàm dọn dẹp cache khi quá giới hạn
const cleanupCache = () => {
  if (audioCache.size >= MAX_CACHE_SIZE) {
    const firstKey = audioCache.keys().next().value;
    if (firstKey) {
      const url = audioCache.get(firstKey);
      if (url) URL.revokeObjectURL(url);
      audioCache.delete(firstKey);
    }
  }
};

interface VoicePreviewProps {
  voice: string;
  speed: number;
  pitch: number;
  volume: number;
  previewText?: string;
}

export default function VoicePreview({ 
  voice, 
  speed, 
  pitch, 
  volume, 
  previewText = "Đây là giọng nói mẫu để bạn nghe thử. Chọn giọng nói phù hợp với nhu cầu của bạn." 
}: VoicePreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Force alloy for guest users
  const voiceToUse = !isAuthenticated ? "alloy" : voice;

  // Tạo cache key dựa trên tất cả tham số
  const getCacheKey = () => {
    return `${voiceToUse}-${speed}-${pitch}-${volume}-${previewText}`;
  };

  // Cleanup audio khi component unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePreview = async () => {
    // Nếu đang phát, thì dừng
    if (audio && isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    // Nếu có audio đã tồn tại và đã dừng, thì tiếp tục phát
    if (audio && !isPlaying) {
      try {
        await audio.play();
        setIsPlaying(true);
        return;
      } catch (error) {
        // Nếu không phát được audio cũ, tạo mới
      }
    }

    setIsLoading(true);
    try {
      // Sử dụng file audio mẫu có sẵn
      const samplePath = `/audio-samples/${voiceToUse}.mp3`;
      const newAudio = new Audio(samplePath);
      
      newAudio.onplay = () => setIsPlaying(true);
      newAudio.onpause = () => setIsPlaying(false);
      newAudio.onended = () => setIsPlaying(false);
      newAudio.onerror = () => {
        // Nếu không có file mẫu, fallback về API
        toast({
          title: "Thông báo",
          description: "Đang tải mẫu giọng đọc...",
        });
        handleApiPreview();
      };

      setAudio(newAudio);
      audioRef.current = newAudio;
      await newAudio.play();
    } catch (error) {
      // Fallback về API nếu không có file mẫu
      await handleApiPreview();
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiPreview = async () => {
    const cacheKey = getCacheKey();
    
    // Kiểm tra cache trước
    if (audioCache.has(cacheKey)) {
      const cachedUrl = audioCache.get(cacheKey)!;
      const cachedAudio = new Audio(cachedUrl);
      
      cachedAudio.onplay = () => setIsPlaying(true);
      cachedAudio.onpause = () => setIsPlaying(false);
      cachedAudio.onended = () => setIsPlaying(false);

      setAudio(cachedAudio);
      audioRef.current = cachedAudio;
      await cachedAudio.play();
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/tts/preview", {
        content: previewText,
        voice: voiceToUse,
        speed,
        pitch,
        volume,
        format: "mp3"
      });

      if (response.ok) {
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        
        // Dọn dẹp cache nếu cần và lưu vào cache
        cleanupCache();
        audioCache.set(cacheKey, audioUrl);
        
        const newAudio = new Audio(audioUrl);
        
        newAudio.onplay = () => setIsPlaying(true);
        newAudio.onpause = () => setIsPlaying(false);
        newAudio.onended = () => setIsPlaying(false);

        setAudio(newAudio);
        audioRef.current = newAudio;
        await newAudio.play();
      } else {
        throw new Error("Failed to generate preview");
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tạo file nghe thử. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-dashed">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Nghe thử giọng nói với cài đặt hiện tại
          </span>
        </div>
        <Button
          onClick={handlePreview}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isLoading ? "Đang tạo..." : isPlaying ? "Dừng" : "Nghe thử"}
        </Button>
      </CardContent>
    </Card>
  );
}