import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTTS } from "@/hooks/use-tts";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import AudioVisualizer from "./audio-visualizer";
import QuotaWarning from "./quota-warning";
import VoicePreview from "./voice-preview";
import TextTemplatesCompact from "./text-templates-compact";
import { 
  CloudUpload, 
  Play, 
  Pause, 
  Download, 
  FileText, 
  Loader2, 
  Volume2, 
  Settings,
  ChevronDown,
  SpellCheck,
  Languages,
  Square,
  Save,
  Sparkles,
  Split,
  FileStack,
  Crown,
  VolumeX,
  Volume1,
  Trash
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function TTSTool() {
  const [text, setText] = useState("");
  const [maxCharacters, setMaxCharacters] = useState(500);
  const [voice, setVoice] = useState("alloy");
  
  // Initialize voice based on authentication status
  useEffect(() => {
    if (!isAuthenticated) {
      setVoice("alloy");
    }
  }, []); // Run once on mount
  const [title, setTitle] = useState("");
  const [format, setFormat] = useState("mp3");
  const [useSSML, setUseSSML] = useState(false);
  const [activeTab, setActiveTab] = useState("create");
  const [speed, setSpeed] = useState([1.0]);
  const [pitch, setPitch] = useState([1.0]);
  const [volume, setVolume] = useState([1.0]);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  
  // Audio visualizer state
  const [visualizerMode, setVisualizerMode] = useState<"particles" | "liquid" | "neural" | "galaxy">("particles");
  const [visualizerColor, setVisualizerColor] = useState<"sunset" | "ocean" | "forest" | "cosmic">("sunset");
  const [showFrequencyLabels, setShowFrequencyLabels] = useState(false);
  
  // Audio playback state
  const [playbackVolume, setPlaybackVolume] = useState([1.0]);
  const [isMuted, setIsMuted] = useState(false);
  const [savedVolume, setSavedVolume] = useState(1.0);
  const [showVolumeControls, setShowVolumeControls] = useState(false);
  
  // Ref for volume controls to detect outside clicks
  const volumeControlsRef = useRef<HTMLDivElement>(null);

  // Handle click outside to hide volume controls
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (volumeControlsRef.current && !volumeControlsRef.current.contains(event.target as Node)) {
        setShowVolumeControls(false);
      }
    };

    if (showVolumeControls) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVolumeControls]);

  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  
  // Debug authentication status
  useEffect(() => {
    console.log('🔐 Authentication status:', { isAuthenticated, user: user?.email });
  }, [isAuthenticated, user]);

  // Fetch app settings including character limit
  const { data: appSettings } = useQuery<any>({
    queryKey: ["/api/app-settings"],
    staleTime: 0, // Always fetch fresh data for immediate updates
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch audio files for quota calculation
  const { data: audioFiles = [] } = useQuery<any[]>({
    queryKey: ["/api/audio-files"],
    enabled: isAuthenticated,
  });

  // Get available voices from API
  const { data: voices = [] } = useQuery<any[]>({
    queryKey: ["/api/voices"],
    retry: false,
  });

  // Force alloy for guests - run immediately and on every render
  useEffect(() => {
    if (!isAuthenticated) {
      setVoice("alloy");
      // Also clear any saved preferences for guests
      localStorage.removeItem('tts-preferences');
    }
  }, [isAuthenticated]);

  // Additional safety: force alloy if guest user tries to change voice
  const handleVoiceChange = (newVoice: string) => {
    if (!isAuthenticated && newVoice !== "alloy") {
      toast({
        title: "Cần đăng nhập",
        description: "Vui lòng đăng nhập để sử dụng giọng này",
        variant: "destructive",
      });
      return;
    }
    setVoice(newVoice);
  };

  // Update maxCharacters based on user authentication status and subscription
  useEffect(() => {
      if (!isAuthenticated) {
      // Guest users get limit from app settings (admin configurable)
      setMaxCharacters((appSettings as any)?.guestMaxCharacters || 100);
    } else if (appSettings) {
        // Authenticated users get limits based on subscription
        const subscriptionType = user?.subscriptionType || 'free';
        if (subscriptionType === 'premium') {
        setMaxCharacters((appSettings as any).premiumMaxCharacters || 5000);
        } else if (subscriptionType === 'pro') {
        setMaxCharacters((appSettings as any).proMaxCharacters || 2000);
        } else {
        setMaxCharacters((appSettings as any).freeMaxCharacters || 500);
      }
    }
  }, [appSettings, isAuthenticated, user?.subscriptionType]);

  // Load saved preferences on component mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('tts-preferences');
    if (savedPreferences) {
      try {
        const prefs = JSON.parse(savedPreferences);
        // Only load voice preference for authenticated users
        if (prefs.voice && isAuthenticated) setVoice(prefs.voice);
        if (prefs.speed) setSpeed([prefs.speed]);
        if (prefs.pitch) setPitch([prefs.pitch]);
        if (prefs.volume) setVolume([prefs.volume]);
        if (prefs.format) setFormat(prefs.format);
      } catch (error) {
        console.log('Failed to load preferences');
      }
    }
  }, [isAuthenticated]);

  // Save preferences when they change
  const savePreferences = () => {
    const preferences = {
      voice,
      speed: speed[0],
      pitch: pitch[0],
      volume: volume[0],
      format
    };
    localStorage.setItem('tts-preferences', JSON.stringify(preferences));
    toast({
      title: "Đã lưu cài đặt",
      description: "Cài đặt giọng nói đã được lưu thành công",
    });
  };
  const {
    generateAudio,
    playAudio,
    pause,
    resume,
    stop,
    downloadAudio,
    isPlaying,
    isPaused,
    isGenerating,
    progress,
    duration,
    currentTime,
    hasGeneratedAudio,
    playbackVolume: ttsPlaybackVolume,
    setPlaybackVolume: setTtsPlaybackVolume,
    audioRef: ttsAudioRef
  } = useTTS(isAuthenticated);

  // Global audio ref to control volume
  const globalAudioRef = useRef<HTMLAudioElement | null>(null);
  const allAudioElements = useRef<HTMLAudioElement[]>([]);

  // Sync local volume with useTTS volume
  useEffect(() => {
    setPlaybackVolume([ttsPlaybackVolume]);
  }, [ttsPlaybackVolume]);

  // Sync volume slider in settings with playback volume
  useEffect(() => {
    setVolume([playbackVolume[0]]);
  }, [playbackVolume]);

  // Real-time volume control - update audio immediately when volume changes
  useEffect(() => {
    const targetVolume = isMuted ? 0 : playbackVolume[0];
    
    // Update useTTS audioRef (this is the primary audio element)
    if (ttsAudioRef.current) {
      ttsAudioRef.current.volume = targetVolume;
    }

    // Update all audio elements in the DOM
    const allAudioElements = document.querySelectorAll('audio');
    allAudioElements.forEach(audio => {
      audio.volume = targetVolume;
    });
  }, [playbackVolume, isMuted, ttsAudioRef]);

  // Handle volume controls
  const handleVolumeChange = (newVolume: number[]) => {
    setPlaybackVolume(newVolume);
    setTtsPlaybackVolume(newVolume[0]); // Sync with useTTS
    if (newVolume[0] > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      // Unmute
      setIsMuted(false);
      const volumeToRestore = savedVolume > 0 ? savedVolume : 0.5;
      setPlaybackVolume([volumeToRestore]);
      setTtsPlaybackVolume(volumeToRestore);
    } else {
      // Mute
      setSavedVolume(playbackVolume[0]);
      setIsMuted(true);
      setPlaybackVolume([0]);
      setTtsPlaybackVolume(0);
    }
  };

  const handleVolumeIconClick = () => {
    setShowVolumeControls(!showVolumeControls);
  };

  // Check if current settings match previous generation  
  const checkIfSameConfig = (currentText: string, options: any) => {
    // Simple check - could be enhanced
    return false; // For now always allow generation
  };

  // Check if generate button should be disabled
  const isGenerateDisabled = 
    checkIfSameConfig(text, {
    voice,
    rate: speed[0],
    pitch: pitch[0],
    volume: volume[0]
    }) || 
    !text.trim() || 
    text.length > maxCharacters;

  const {
    isUploading,
    uploadFile,
    dragProps
  } = useFileUpload({
    onSuccess: (extractedText, filename) => {
      setText(extractedText);
      toast({
        title: "File uploaded successfully",
        description: `Extracted text from ${filename}`,
      });
    },
    onError: (error) => {
      const errorMessage = typeof error === 'string' ? error : ((error as any)?.message || "Không thể xử lý file");
      toast({
        title: "Tải file thất bại",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  const handleGenerateAudio = async () => {
    // Force alloy for guests
    let voiceToUse = voice;
    if (!isAuthenticated) {
      setVoice("alloy");
      voiceToUse = "alloy";
    }
    if (!text.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập văn bản cần chuyển đổi",
        variant: "destructive",
      });
      return;
    }

    // Check character limit first
    if (text.length > maxCharacters) {
      toast({
        title: "Vượt quá giới hạn ký tự",
        description: `Văn bản quá dài (${text.length}/${maxCharacters} ký tự). Vui lòng nâng cấp gói để được giới hạn cao hơn.`,
        variant: "destructive",
      });
              setTimeout(() => {
          window.location.href = "/features";
        }, 1500);
      return;
    }

    // Check subscription limits for authenticated users
    if (isAuthenticated) {
      const subscriptionType = user?.subscriptionType || 'free';
      const currentFiles = audioFiles?.length || 0;
      const maxFiles = getMaxFiles(subscriptionType);
      
      if (currentFiles >= maxFiles) {
        toast({
          title: "Đã vượt giới hạn file",
          description: `Gói ${subscriptionType} chỉ cho phép tối đa ${maxFiles} file. Vui lòng nâng cấp tài khoản.`,
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/features";
        }, 1500);
        return;
      }
    }

    try {
      const result = await generateAudio(text, {
        voice: voiceToUse,
        rate: speed[0],
        pitch: pitch[0],
        volume: volume[0]
      });
      
      if (result === 'generated') {
        toast({
          title: "🎵 Tạo giọng nói thành công!",
          description: isAuthenticated ? 
            "Audio đã được tạo và lưu vào thư viện của bạn" : 
            "Audio đã được tạo (đăng nhập để lưu vào thư viện)",
          duration: 3000,
        });
      } else if (result === 'reused') {
        toast({
          title: "🔄 Sử dụng audio có sẵn",
          description: "Cài đặt chưa thay đổi, sử dụng lại audio trước đó",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('🚨 Generate audio error:', error);
      toast({
        title: "Lỗi tạo giọng nói",
        description: "Không thể tạo giọng nói. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  // Helper function to get max files based on subscription
  const getMaxFiles = (subscriptionType: string) => {
    if (subscriptionType === 'premium') return appSettings?.premiumMaxFiles || 1000;
    if (subscriptionType === 'pro') return appSettings?.proMaxFiles || 100;
    return appSettings?.freeMaxFiles || 5;
  };

  const handlePlayAudio = () => {
    if (hasGeneratedAudio) {
      playAudio();
    }
  };

  // Text processing functions
  const normalizeText = () => {
    if (!text.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập văn bản để chuẩn hóa",
        variant: "destructive",
      });
      return;
    }

    let normalized = text
      // Chuẩn hóa dấu cách
      .replace(/\s+/g, ' ')
      .trim()
      // Chuẩn hóa dấu câu
      .replace(/([.!?])\s*([A-ZÁÀẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÉÈẸẺẼÊỀẾỆỂỄÍÌỊỈĨÓÒỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÚÙỤỦŨƯỪỨỰỬỮÝỲỴỶỸĐ])/g, '$1 $2')
      // Xóa ký tự đặc biệt không cần thiết
      .replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF.,!?;:()""''`-]/g, '')
      // Chuẩn hóa dấu ngoặc kép
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'");
    
    setText(normalized);
    toast({
      title: "Thành công",
      description: "Đã chuẩn hóa văn bản",
    });
  };

  const checkSpelling = () => {
    if (!text.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập văn bản để kiểm tra",
        variant: "destructive",
      });
      return;
    }

    // Sửa lỗi chính tả phổ biến trong tiếng Việt với độ chính xác cao
    let corrected = text;
    let changeCount = 0;
    const changedWords: string[] = [];
    
    // Chỉ sửa những từ viết tắt rất chắc chắn và an toàn
    const corrections = [
      // Từ viết tắt phổ biến nhất - hoàn toàn an toàn
      { from: /\bko\b/gi, to: 'không', desc: 'ko → không' },
      { from: /\bdc\b/gi, to: 'được', desc: 'dc → được' },
      { from: /\bđc\b/gi, to: 'được', desc: 'đc → được' },
      { from: /\bvs\b/gi, to: 'với', desc: 'vs → với' },
      { from: /\bms\b/gi, to: 'mình', desc: 'ms → mình' },
      { from: /\bbn\b/gi, to: 'bạn', desc: 'bn → bạn' },
      { from: /\bmk\b/gi, to: 'mình', desc: 'mk → mình' },
      
      // Từ viết tắt đặc biệt
      { from: /\btk\b/gi, to: 'tài khoản', desc: 'tk → tài khoản' },
      { from: /\bsp\b/gi, to: 'sản phẩm', desc: 'sp → sản phẩm' },
      { from: /\bmn\b/gi, to: 'mọi người', desc: 'mn → mọi người' },
      { from: /\bae\b/gi, to: 'anh em', desc: 'ae → anh em' },
      
      // Từ chat phổ biến
      { from: /\bchx\b/gi, to: 'chưa', desc: 'chx → chưa' },
      { from: /\bcx\b/gi, to: 'cũng', desc: 'cx → cũng' },
      { from: /\bkb\b/gi, to: 'không biết', desc: 'kb → không biết' },
      { from: /\bkbt\b/gi, to: 'không biết', desc: 'kbt → không biết' },
      
      // Từ đơn giản
      { from: /\boke\b/gi, to: 'ok', desc: 'oke → ok' },
      { from: /\bokela\b/gi, to: 'ok', desc: 'okela → ok' },
      
      // Chỉ sửa khi chắc chắn 100%
      { from: /(?<!\w)j(?!\w)/gi, to: 'gì', desc: 'j → gì' },
      { from: /(?<!\w)wa(?!\w)/gi, to: 'quá', desc: 'wa → quá' },
      { from: /(?<!\w)ny(?!\w)/gi, to: 'này', desc: 'ny → này' }
    ];

    // Áp dụng từng rule một cách cẩn thận
    corrections.forEach(correction => {
      const beforeCorrection = corrected;
      corrected = corrected.replace(correction.from, (match) => {
        // Đếm số lần thay thế
        changeCount++;
        changedWords.push(correction.desc);
        return correction.to;
      });
    });
    
    // Kiểm tra xem có thay đổi gì không
    if (corrected !== text) {
      setText(corrected);
      
      // Hiển thị thông báo chi tiết
      const uniqueChanges = Array.from(new Set(changedWords));
      toast({
        title: "Đã sửa lỗi chính tả",
        description: `Sửa ${changeCount} lỗi: ${uniqueChanges.slice(0, 3).join(', ')}${uniqueChanges.length > 3 ? '...' : ''}`,
      });
    } else {
      toast({
        title: "Hoàn tất kiểm tra",
        description: "Không tìm thấy lỗi chính tả phổ biến cần sửa",
      });
    }
  };

  const highlightDifficultWords = () => {
    if (!text.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập văn bản để phân tích",
        variant: "destructive",
      });
      return;
    }

    // Danh sách từ khó phát âm trong tiếng Việt
    const difficultWords = [
      'nghiêm', 'nghiệp', 'nghiền', 'nghiêng', 'nghiêu',
      'thuở', 'thuần', 'thuật', 'thuộc', 'thuần',
      'phường', 'phượng', 'phương', 'phước', 'phụng',
      'trường', 'trượng', 'trương', 'trước', 'trụng',
      'khuôn', 'khuông', 'khuống', 'khuấy', 'khuất',
      'giường', 'giượng', 'giương', 'giước', 'giụng',
      'nguyên', 'nguyệt', 'nguyện', 'nguyền'
    ];

    let highlighted = text;
    let foundWords = [];

    difficultWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(text)) {
        foundWords.push(word);
        highlighted = highlighted.replace(regex, `**${word}**`);
      }
    });

    if (foundWords.length > 0) {
      setText(highlighted);
      toast({
        title: "Đã đánh dấu từ khó",
        description: `Tìm thấy ${foundWords.length} từ khó phát âm (đánh dấu bằng **)`,
      });
    } else {
      toast({
        title: "Hoàn tất",
        description: "Không tìm thấy từ khó phát âm phổ biến",
      });
    }
  };

  const handlePause = () => {
    if (isPlaying) {
      pause();
    } else if (isPaused) {
      resume();
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  


  return (
    <section id="tts-tool" className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Công Cụ Chuyển Đổi Text-to-Speech</h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Nhập văn bản hoặc tải file lên để chuyển đổi thành giọng nói chất lượng cao
          </p>
          {!isAuthenticated && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-2xl mx-auto mt-6">
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                ✨ Bạn đang sử dụng gói miễn phí (tối đa {maxCharacters} ký tự). 
                <a href="/login" className="ml-1 underline hover:text-blue-600">Đăng nhập</a> để mở khóa thêm tính năng!
              </p>
            </div>
          )}
          
          {/* Warning for guest users */}
          {!isAuthenticated && (
            <Alert className="mt-6 max-w-2xl mx-auto border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <strong>Lưu ý:</strong> Người dùng chưa đăng nhập chỉ có thể nghe audio tạm thời. 
                File sẽ bị xóa sau 1 giờ. <a href="/register" className="underline font-medium">Đăng ký</a> để lưu trữ vĩnh viễn!
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Quota Warning for Free Users */}
        {isAuthenticated && appSettings && (
          <QuotaWarning 
            currentUsage={audioFiles.length} 
            maxUsage={appSettings.freeMaxFiles || 5} 
          />
        )}

        <Card className="shadow-xl">
          <CardContent className="p-6 md:p-8">
            {/* File Upload Area */}
            <div className="mb-8">
              <div
                {...dragProps}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-primary-500 transition-colors duration-200 cursor-pointer"
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <CloudUpload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">
                  {isUploading ? "Đang xử lý file..." : "Kéo thả file hoặc nhấn để chọn"}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  Hỗ trợ PDF, Word, TXT (tối đa 10MB)
                </p>
                <input
                  id="file-input"
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadFile(file);
                  }}
                />
                {isUploading && (
                  <div className="mt-4 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Đang trích xuất văn bản...</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Text Editor */}
              <div className="lg:col-span-2 space-y-4">
                <Label className="text-sm font-medium">Nội dung văn bản</Label>
                <div className="relative">
                  <Textarea
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                    }}
                    className="min-h-80 resize-none"
                    placeholder="Nhập văn bản cần chuyển đổi thành giọng nói..."
                  />
                  <div className={`absolute bottom-4 right-4 text-sm px-2 py-1 rounded ${
                    text.length > maxCharacters * 0.9 
                      ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
                      : 'text-gray-500 bg-white dark:bg-gray-800'
                  }`}>
                    {text.length}/{maxCharacters} ký tự
                  </div>
                  {text.length >= maxCharacters && (
                    <div className="absolute bottom-12 right-4 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                      Đã đạt giới hạn ký tự
                    </div>
                  )}
                </div>

                {/* Text Statistics */}
                {text.trim() && (
                  <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-semibold text-blue-700 dark:text-blue-300">
                            {text.trim().split(/\s+/).length}
                          </div>
                          <div className="text-blue-600 dark:text-blue-400">Từ</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-blue-700 dark:text-blue-300">
                            {text.split(/[.!?]+/).filter(s => s.trim()).length}
                          </div>
                          <div className="text-blue-600 dark:text-blue-400">Câu</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-blue-700 dark:text-blue-300">
                            {Math.ceil(text.trim().split(/\s+/).length / 150 * speed[0])}
                          </div>
                          <div className="text-blue-600 dark:text-blue-400">Phút ước tính</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-blue-700 dark:text-blue-300">
                            {Math.ceil(text.length / 1000)}MB
                          </div>
                          <div className="text-blue-600 dark:text-blue-400">Kích thước ước tính</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Text Templates - Moved here and compacted */}
                <div className="mt-4">
                  <TextTemplatesCompact onSelectTemplate={(content: string) => setText(content)} />
                </div>

                {/* Text Processing Options */}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={normalizeText}>
                    <FileText className="mr-2 h-4 w-4" />
                    Chuẩn hóa văn bản
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={checkSpelling}
                    disabled={!isAuthenticated || user?.subscriptionType === 'free'}
                    className="relative"
                  >
                    <SpellCheck className="mr-2 h-4 w-4" />
                    Kiểm tra chính tả
                    {(!isAuthenticated || user?.subscriptionType === 'free') && (
                      <Badge variant="outline" className="text-xs ml-2">Pro</Badge>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={highlightDifficultWords}
                    disabled={!isAuthenticated || user?.subscriptionType === 'free'}
                    className="relative"
                  >
                    <Languages className="mr-2 h-4 w-4" />
                    Phát âm từ khó
                    {(!isAuthenticated || user?.subscriptionType === 'free') && (
                      <Badge variant="outline" className="text-xs ml-2">Pro</Badge>
                    )}
                  </Button>
                </div>
              </div>

              {/* Controls Panel */}
              <div className="space-y-6">
                <Card className="bg-gray-50 dark:bg-gray-700">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Cài đặt giọng đọc</h3>
                    
                    {/* Voice Selection */}
                    <div className="mb-4">
                      <Label className="text-sm font-medium mb-2">Giọng đọc</Label>
                      <Select value={voice} onValueChange={handleVoiceChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn giọng đọc" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(voices) && voices.length > 0 ? (
                            <>
                              {/* FPT AI Voices - Vietnamese */}
                              {voices.filter((v: any) => v.provider === "fpt").length > 0 && (
                                <>
                                  <div className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded">
                                    🇻🇳 FPT AI - Tiếng Việt
                                  </div>
                                  {voices.filter((v: any) => v.provider === "fpt").map((voice: any) => (
                                    <TooltipProvider key={voice.id} delayDuration={200}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div>
                                            <SelectItem 
                                              value={voice.id}
                                              disabled={!!voice.disabled}
                                              className={voice.disabled ? "opacity-50 cursor-not-allowed" : ""}
                                              onClick={e => {
                                                if (voice.disabled) {
                                                  e.preventDefault();
                                                  if (voice.tier === "registered") {
                                                    window.alert("Đăng nhập để sử dụng giọng này!");
                                                  } else if (voice.tier === "pro") {
                                                    window.alert("Nâng cấp gói PRO để sử dụng giọng này!");
                                                  } else if (voice.tier === "premium") {
                                                    window.alert("Nâng cấp gói PREMIUM để sử dụng giọng này!");
                                                  }
                                                }
                                              }}
                                            >
                                              <span>
                                                {voice.gender === "female" ? "👩" : "👨"} {voice.name}
                                                {voice.region && ` - ${voice.region === "north" ? "Miền Bắc" : 
                                                  voice.region === "south" ? "Miền Nam" : "Miền Trung"}`}
                                                {voice.tier === "registered" && <Badge className="ml-2" variant="secondary">Đăng ký</Badge>}
                                                {voice.tier === "pro" && <Badge className="ml-2" variant="outline">PRO</Badge>}
                                                {voice.tier === "premium" && <Badge className="ml-2" variant="destructive">PREMIUM</Badge>}
                                              </span>
                                            </SelectItem>
                                          </div>
                                        </TooltipTrigger>
                                        {voice.disabled && (
                                          <TooltipContent side="right">
                                            {voice.tier === "registered" && "Đăng nhập để sử dụng giọng này"}
                                            {voice.tier === "pro" && "Nâng cấp gói PRO để sử dụng giọng này"}
                                            {voice.tier === "premium" && "Nâng cấp gói PREMIUM để sử dụng giọng này"}
                                          </TooltipContent>
                                        )}
                                      </Tooltip>
                                    </TooltipProvider>
                                  ))}
                                </>
                              )}
                              {/* OpenAI Voices - English */}
                              {voices.filter((v: any) => v.provider === "openai").length > 0 && (
                                <>
                                  <div className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded mt-2">
                                    🇺🇸 OpenAI - English
                                  </div>
                                  {voices.filter((v: any) => v.provider === "openai").map((voice: any) => (
                                    <TooltipProvider key={voice.id} delayDuration={200}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div>
                                            <SelectItem 
                                              value={voice.id}
                                              disabled={!!voice.disabled}
                                              className={voice.disabled ? "opacity-50 cursor-not-allowed" : ""}
                                              onClick={e => {
                                                if (voice.disabled) {
                                                  e.preventDefault();
                                                  if (voice.tier === "registered") {
                                                    window.alert("Đăng nhập để sử dụng giọng này!");
                                                  } else if (voice.tier === "pro") {
                                                    window.alert("Nâng cấp gói PRO để sử dụng giọng này!");
                                                  } else if (voice.tier === "premium") {
                                                    window.alert("Nâng cấp gói PREMIUM để sử dụng giọng này!");
                                                  }
                                                }
                                              }}
                                            >
                                              <span>
                                                {voice.gender === "female" ? "👩" : voice.gender === "male" ? "👨" : "🤖"} {voice.name}
                                                {voice.tier === "pro" && <Badge className="ml-2" variant="outline">PRO</Badge>}
                                                {voice.tier === "premium" && <Badge className="ml-2" variant="destructive">PREMIUM</Badge>}
                                              </span>
                                            </SelectItem>
                                          </div>
                                        </TooltipTrigger>
                                        {voice.disabled && (
                                          <TooltipContent side="right">
                                            {voice.tier === "registered" && "Đăng nhập để sử dụng giọng này"}
                                            {voice.tier === "pro" && "Nâng cấp gói PRO để sử dụng giọng này"}
                                            {voice.tier === "premium" && "Nâng cấp gói PREMIUM để sử dụng giọng này"}
                                          </TooltipContent>
                                        )}
                                      </Tooltip>
                                    </TooltipProvider>
                                  ))}
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              <SelectItem value="alloy">🤖 Alloy - Miễn phí</SelectItem>
                              <SelectItem value="banmai" disabled className="opacity-50">
                                👩 Ban Mai 🔓 ĐĂNG KÝ - Giọng nữ miền Bắc
                              </SelectItem>
                              <SelectItem value="leminh" disabled className="opacity-50">
                                👨 Lê Minh 💎 PREMIUM - Giọng nam miền Bắc
                              </SelectItem>
                              <SelectItem value="thuminh" disabled className="opacity-50">
                                👩 Thu Minh 💎 PREMIUM - Giọng nữ miền Nam
                              </SelectItem>
                              <SelectItem value="ngoclam" disabled className="opacity-50">
                                👩 Ngọc Lam ⭐ PRO - Giọng nữ miền Trung
                              </SelectItem>
                              <SelectItem value="echo" disabled className="opacity-50">
                                👨 Echo ⭐ PRO - English
                              </SelectItem>
                              <SelectItem value="nova" disabled className="opacity-50">
                                👩 Nova 💎 PREMIUM - English
                              </SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Speed Control */}
                    <div className="mb-4">
                      <Label className="text-sm font-medium mb-2">Tốc độ đọc</Label>
                      <Slider
                        value={speed}
                        onValueChange={setSpeed}
                        min={0.5}
                        max={2}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>Chậm</span>
                        <span>{speed[0].toFixed(1)}x</span>
                        <span>Nhanh</span>
                      </div>
                    </div>

                    {/* Pitch Control - Pro Feature */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">Cao độ giọng</Label>
                        {(!isAuthenticated || user?.subscriptionType === 'free') && (
                          <Badge variant="outline" className="text-xs">Pro</Badge>
                        )}
                      </div>
                      <Slider
                        value={pitch}
                        onValueChange={setPitch}
                        min={0.5}
                        max={2}
                        step={0.1}
                        className="w-full"
                        disabled={!isAuthenticated || user?.subscriptionType === 'free'}
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>Thấp</span>
                        <span>{pitch[0].toFixed(1)}</span>
                        <span>Cao</span>
                      </div>
                    </div>

                    {/* Volume Control */}
                    <div className="mb-6">
                      <Label className="text-sm font-medium mb-2">Âm lượng</Label>
                      <Slider
                        value={volume}
                        onValueChange={(newVolume) => {
                          setVolume(newVolume);
                          handleVolumeChange(newVolume); // Sync với playback volume
                        }}
                        min={0}
                        max={1}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>0%</span>
                        <span>{Math.round(volume[0] * 100)}%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Save Settings Button */}
                    <Button
                      onClick={savePreferences}
                      variant="outline"
                      size="sm"
                      className="w-full mb-4"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Lưu cài đặt này
                    </Button>

                    {/* Voice Preview */}
                    <div className="mb-6">
                      <VoicePreview 
                        voice={voice}
                        speed={speed[0]}
                        pitch={pitch[0]}
                        volume={volume[0]}
                        previewText={text || "Đây là giọng nói mẫu để bạn nghe thử."}
                      />
                    </div>

                    {/* Advanced Settings - Premium Feature */}
                    <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between p-0">
                          <span className="font-medium">Cài đặt nâng cao</span>
                          <div className="flex items-center gap-2">
                            {(!isAuthenticated || user?.subscriptionType === 'free') && (
                              <Badge variant="outline" className="text-xs">Premium</Badge>
                            )}
                            <Settings className="h-4 w-4" />
                          </div>
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-3 mt-3">
                        {(!isAuthenticated || user?.subscriptionType === 'free') ? (
                          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border">
                            <div className="flex items-center gap-2 mb-2">
                              <Crown className="h-4 w-4 text-purple-600" />
                              <span className="font-medium text-purple-800">Tính năng Premium</span>
                            </div>
                            <p className="text-sm text-purple-600 mb-3">
                              Nâng cấp để sử dụng các tùy chỉnh nâng cao như nhấn mạnh, SSML và nhiều hơn nữa.
                            </p>
                            <Button 
                              size="sm" 
                              onClick={() => window.location.href = '/features'}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              Xem tính năng
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div>
                              <Label className="text-sm font-medium mb-1">Nhấn mạnh</Label>
                              <Select defaultValue="normal">
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="normal">Bình thường</SelectItem>
                                  <SelectItem value="light">Nhẹ</SelectItem>
                                  <SelectItem value="strong">Mạnh</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-1">Tạm dừng giữa câu</Label>
                              <Slider
                                defaultValue={[0.5]}
                                min={0}
                                max={2}
                                step={0.1}
                                className="w-full"
                              />
                            </div>
                          </>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {/* Generate Audio Button */}
                  <Button 
                    onClick={handleGenerateAudio}
                    disabled={isGenerating || !text.trim() || isGenerateDisabled}
                    className={`w-full ${isGenerateDisabled ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'gradient-primary hover:shadow-lg transform hover:scale-105'} text-white transition-all duration-200`}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang tạo...
                      </>
                    ) : isGenerateDisabled ? (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Đã tạo xong
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Tạo giọng nói
                      </>
                    )}
                  </Button>

                  {/* Audio Controls */}
                  {hasGeneratedAudio && (
                    <div className="flex gap-2">
                      <Button 
                        onClick={handlePlayAudio}
                        variant="outline"
                        className="flex-1"
                        disabled={isPlaying}
                      >
                        <Play className="mr-1 h-4 w-4" />
                        Nghe thử
                      </Button>
                      
                      <Button 
                        onClick={handlePause}
                        disabled={!isPlaying && !isPaused}
                        variant="outline"
                        className="flex-1"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="mr-1 h-4 w-4" />
                            Tạm dừng
                          </>
                        ) : (
                          <>
                            <Play className="mr-1 h-4 w-4" />
                            Tiếp tục
                          </>
                        )}
                      </Button>

                      <Button 
                        onClick={stop}
                        variant="outline"
                        className="flex-1"
                        disabled={!isPlaying && !isPaused}
                      >
                        <Square className="mr-1 h-4 w-4" />
                        Dừng
                      </Button>
                    </div>
                  )}

                  <Button 
                    onClick={downloadAudio}
                    disabled={!hasGeneratedAudio}
                    className="w-full bg-green-500 text-white hover:bg-green-600"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Tải xuống MP3
                  </Button>
                  
                  {/* Debug: Manual Save Button */}
                  {hasGeneratedAudio && isAuthenticated && (
                    <Button 
                      onClick={async () => {
                        try {
                          console.log('🔧 Manual save test - Starting...');
                          const response = await fetch('/api/audio-files', {
                            method: 'POST',
                            credentials: 'include', // Include session cookies
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              title: `Audio Pro - ${new Date().toLocaleTimeString()}`,
                              content: text.substring(0, 100),
                              voice: voice || 'alloy',
                              speed: speed[0],
                              pitch: pitch[0],
                              volume: volume[0],
                              format: 'mp3',
                              duration: 10,
                              fileSize: 1000,
                              isPublic: false,
                            }),
                          });
                          
                          if (response.ok) {
                            const result = await response.json();
                            console.log('✅ Manual save successful:', result);
                            toast({
                              title: "✨ Lưu vào thư viện thành công!",
                              description: `Audio "${result.title}" đã được thêm vào bộ sưu tập của bạn`,
                              duration: 5000,
                            });
                            
                            // Manually invalidate queries to refresh UI
                            window.location.reload();
                          } else {
                            const error = await response.text();
                            console.error('❌ Manual save failed:', error);
                            toast({
                              title: "⚠️ Không thể lưu",
                              description: error,
                              variant: "destructive",
                            });
                          }
                        } catch (error) {
                          console.error('🚨 Manual save error:', error);
                          toast({
                            title: "🚫 Lỗi kết nối",
                            description: "Không thể kết nối đến server",
                            variant: "destructive",
                          });
                        }
                      }}
                      variant="outline"
                      className="w-full bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200 hover:border-purple-300 transition-all duration-300"
                    >
                      <Save className="mr-2 h-4 w-4 text-blue-600" />
                      ⭐ Lưu vào Thư Viện
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Audio Visualizer */}
            <Card className="mt-3 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-200 dark:border-gray-700">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Volume2 className="h-5 w-5 text-blue-600" />
                      Hiệu ứng âm thanh nghệ thuật
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Visualizer sáng tạo với hiệu ứng đặc biệt
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full transition-all ${
                      isPlaying ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' : 
                      isPaused ? 'bg-yellow-400' : 'bg-gray-400'
                    }`} />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {isPlaying ? "LIVE" : isPaused ? "PAUSED" : "READY"}
                    </span>
                  </div>
                </div>

                {/* Visualizer Mode Controls */}
                <div className="space-y-2 mb-3">
                  {/* Mode and Color Controls */}
                  <div className="flex flex-wrap items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-medium">Chế độ:</Label>
                      <Select value={visualizerMode} onValueChange={(value) => setVisualizerMode(value as "particles" | "liquid" | "neural" | "galaxy")}>
                        <SelectTrigger className="w-28 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="particles">Particles</SelectItem>
                          <SelectItem value="liquid">Liquid</SelectItem>
                          <SelectItem value="neural">Neural</SelectItem>
                          <SelectItem value="galaxy">Galaxy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-medium">Màu sắc:</Label>
                      <Select value={visualizerColor} onValueChange={(value) => setVisualizerColor(value as "sunset" | "ocean" | "forest" | "cosmic")}>
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sunset">Sunset</SelectItem>
                          <SelectItem value="ocean">Ocean</SelectItem>
                          <SelectItem value="forest">Forest</SelectItem>
                          <SelectItem value="cosmic">Cosmic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      <Checkbox 
                        id="show-freq" 
                        checked={showFrequencyLabels}
                        onCheckedChange={(checked) => setShowFrequencyLabels(checked === true)}
                      />
                      <Label htmlFor="show-freq" className="text-xs">Hiện tần số</Label>
                    </div>
                  </div>


                </div>
                
                {/* Enhanced AudioVisualizer with professional features */}
                <div className="relative">
                  <AudioVisualizer 
                    isPlaying={isPlaying} 
                    height={140}
                    barCount={64}
                    mode={visualizerMode}
                    showFrequencyLabels={showFrequencyLabels}
                    color={visualizerColor}
                  />
                  
                  {/* Audio Quality Indicator */}
                  <div className="absolute top-3 left-3 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium">
                    📊 48kHz • 32-bit • Stereo
                  </div>

                  {/* Compact Volume Controls in Bottom Right */}
                  <div ref={volumeControlsRef} className="absolute bottom-3 right-3 flex items-center gap-2">
                    {/* Volume Icon Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowVolumeControls(!showVolumeControls)}
                      className="p-2 bg-black/70 hover:bg-black/80 rounded-full transition-all duration-200"
                    >
                      {isMuted || playbackVolume[0] === 0 ? (
                        <VolumeX className="h-4 w-4 text-red-400" />
                      ) : playbackVolume[0] < 0.3 ? (
                        <Volume1 className="h-4 w-4 text-white" />
                      ) : playbackVolume[0] < 0.7 ? (
                        <Volume2 className="h-4 w-4 text-blue-400" />
                      ) : (
                        <Volume2 className="h-4 w-4 text-green-400" />
                      )}
                    </Button>

                    {/* Volume Slider (shows when clicked) */}
                    {showVolumeControls && (
                      <div className="flex items-center gap-2 bg-black/80 backdrop-blur-sm px-3 py-2 rounded-full animate-in slide-in-from-right duration-200">
                        <Slider
                          value={playbackVolume}
                          onValueChange={handleVolumeChange}
                          max={1}
                          min={0}
                          step={0.05}
                          className="w-20"
                        />
                        <span className="text-white text-xs font-medium min-w-[2rem]">
                          {Math.round(playbackVolume[0] * 100)}%
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleMuteToggle}
                          className="p-1 hover:bg-white/20 rounded"
                        >
                          {isMuted ? (
                            <VolumeX className="h-3 w-3 text-red-400" />
                          ) : (
                            <Volume2 className="h-3 w-3 text-white" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Progress Bar with Waveform */}
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-mono">{formatTime(currentTime)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <span className="font-mono">{formatTime(duration)}</span>
                  </div>
                  
                  {/* Progress bar with gradient */}
                  <div className="relative">
                    <Progress 
                      value={progress} 
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700" 
                    />
                    <div 
                      className="absolute top-0 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                    
                    {/* Playhead indicator */}
                    <div 
                      className={`absolute top-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full transform -translate-y-1/2 transition-all duration-100 ${
                        isPlaying ? 'shadow-lg shadow-blue-500/50' : ''
                      }`}
                      style={{ left: `calc(${progress}% - 8px)` }}
                    />
                  </div>
                  
                  {/* Audio Info Bar */}
                  <div className="flex justify-between items-center text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
                    <span>🎵 Voice: {voice || "Chưa chọn"}</span>
                    <span>⚡ Speed: {speed[0]}x</span>
                    <span>🔊 Volume: {Math.round(playbackVolume[0] * 100)}%</span>
                    <span>📏 {text.length} ký tự</span>
                  </div>
                </div>
              </CardContent>
            </Card>


          </CardContent>
        </Card>
      </div>
    </section>
  );
}
