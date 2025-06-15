import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { AudioFile } from "@shared/schema";
import { 
  Search, 
  Grid3X3, 
  List, 
  Music, 
  Share2, 
  Download, 
  Trash2, 
  Play, 
  Pause,
  ChevronLeft, 
  ChevronRight,
  Plus
} from "lucide-react";

export default function FileManager() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [formatFilter, setFormatFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [voiceFilter, setVoiceFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name" | "duration" | "size">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [playingFileId, setPlayingFileId] = useState<number | null>(null);
  const [playProgress, setPlayProgress] = useState<Record<number, number>>({});
  const [currentTime, setCurrentTime] = useState<Record<number, number>>({});
  const itemsPerPage = 9;

  const { toast } = useToast();
  const audioRefs = useRef<Record<number, HTMLAudioElement>>({});

  const { data: audioFiles = [], isLoading } = useQuery<AudioFile[]>({
    queryKey: ['/api/audio-files', searchQuery],
    queryFn: async () => {
      const url = searchQuery 
        ? `/api/audio-files?search=${encodeURIComponent(searchQuery)}`
        : '/api/audio-files';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch audio files');
      return response.json();
    },
  });

  const filteredAndSortedFiles = audioFiles
    .filter(file => {
      if (formatFilter !== "all" && file.format !== formatFilter) return false;
      if (voiceFilter !== "all" && !file.voice.includes(voiceFilter)) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "name":
          return a.title.localeCompare(b.title);
        case "duration":
          return b.duration - a.duration;
        case "size":
          return b.fileSize - a.fileSize;
        default:
          return 0;
      }
    });

  const totalPages = Math.ceil(filteredAndSortedFiles.length / itemsPerPage);
  const paginatedFiles = filteredAndSortedFiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleShare = async (file: AudioFile) => {
    try {
      const response = await apiRequest('POST', `/api/audio-files/${file.id}/share`, {
        isPublic: !file.isPublic
      });
      const data = await response.json();
      
      if (data.shareUrl) {
        navigator.clipboard.writeText(`${window.location.origin}${data.shareUrl}`);
        toast({
          title: "Link copied to clipboard",
          description: "Share link has been copied to your clipboard",
        });
      } else {
        toast({
          title: "Sharing disabled",
          description: "File is no longer publicly accessible",
        });
      }
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Failed to toggle sharing for this file",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (file: AudioFile) => {
    try {
      await apiRequest('DELETE', `/api/audio-files/${file.id}`);
      toast({
        title: "File deleted",
        description: "Audio file has been successfully deleted",
      });
      // The query will automatically refetch due to cache invalidation
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete the audio file",
        variant: "destructive",
      });
    }
  };

  const handlePlayAudio = async (file: AudioFile) => {
    try {
      // Stop any currently playing audio
      if (playingFileId && audioRefs.current[playingFileId]) {
        audioRefs.current[playingFileId].pause();
        setPlayingFileId(null);
      }

      // Check if audio already exists for this file
      if (audioRefs.current[file.id]) {
        const existingAudio = audioRefs.current[file.id];
        if (!existingAudio.paused) {
          existingAudio.pause();
          setPlayingFileId(null);
          return;
        }
        
        setPlayingFileId(file.id);
        await existingAudio.play();
        return;
      }

      // Generate audio only if not cached
      console.log('Generating audio for file:', file.title);
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: file.content,
          voice: file.voice === "vi-VN-Female" ? "nova" : 
                 file.voice === "vi-VN-Male" ? "onyx" :
                 file.voice === "vi-VN-HoaiMy" ? "alloy" : "nova",
          speed: file.speed
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Create and configure audio element
      const audio = new Audio(audioUrl);
      audioRefs.current[file.id] = audio;

      audio.onloadedmetadata = () => {
        setPlayingFileId(file.id);
      };

      audio.ontimeupdate = () => {
        if (audio.duration) {
          const progress = (audio.currentTime / audio.duration) * 100;
          setPlayProgress(prev => ({ ...prev, [file.id]: progress }));
          setCurrentTime(prev => ({ ...prev, [file.id]: audio.currentTime }));
        }
      };

      audio.onended = () => {
        setPlayingFileId(null);
        setPlayProgress(prev => ({ ...prev, [file.id]: 0 }));
        setCurrentTime(prev => ({ ...prev, [file.id]: 0 }));
      };

      audio.onerror = () => {
        setPlayingFileId(null);
        toast({
          title: "Lỗi phát âm thanh",
          description: "Không thể phát file audio này",
          variant: "destructive",
        });
      };

      await audio.play();
    } catch (error) {
      toast({
        title: "Lỗi phát âm thanh", 
        description: "Không thể phát file audio này",
        variant: "destructive",
      });
    }
  };

  const handlePauseAudio = (fileId: number) => {
    if (audioRefs.current[fileId]) {
      audioRefs.current[fileId].pause();
      setPlayingFileId(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getVoiceName = (voice: string) => {
    const voiceMap: Record<string, string> = {
      'vi-VN-HoaiMy': 'Hoài My',
      'vi-VN-NamMinh': 'Nam Minh',
      'vi-VN-ThuHa': 'Thu Hà',
      'vi-VN-QuangAnh': 'Quang Anh',
    };
    return voiceMap[voice] || voice;
  };

  return (
    <section id="file-manager" className="py-16 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Quản Lý File Audio</h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Lưu trữ, tổ chức và chia sẻ các file audio đã tạo
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-50 dark:bg-gray-700 sticky top-24">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Bộ lọc</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Định dạng</label>
                    <Select value={formatFilter} onValueChange={setFormatFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="mp3">MP3</SelectItem>
                        <SelectItem value="wav">WAV</SelectItem>
                        <SelectItem value="ogg">OGG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Thời gian tạo</label>
                    <Select value={timeFilter} onValueChange={setTimeFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="today">Hôm nay</SelectItem>
                        <SelectItem value="week">Tuần này</SelectItem>
                        <SelectItem value="month">Tháng này</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Giọng đọc</label>
                    <Select value={voiceFilter} onValueChange={setVoiceFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="HoaiMy">Hoài My</SelectItem>
                        <SelectItem value="NamMinh">Nam Minh</SelectItem>
                        <SelectItem value="ThuHa">Thu Hà</SelectItem>
                        <SelectItem value="QuangAnh">Quang Anh</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button className="w-full mt-6 gradient-primary text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Batch Processing
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* File List */}
          <div className="lg:col-span-3">
            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm file audio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* File Grid */}
            {isLoading ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <Skeleton className="h-12 w-12 rounded-xl" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : paginatedFiles.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Chưa có file audio nào</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Tạo file audio đầu tiên bằng công cụ TTS ở trên
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedFiles.map((file) => (
                  <Card key={file.id} className="hover:shadow-xl transition-all duration-200 overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
                          <Music className="text-white text-xl h-6 w-6" />
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => handleShare(file)}
                            className="h-8 w-8 text-gray-400 hover:text-primary-500"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            className="h-8 w-8 text-gray-400 hover:text-green-500"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => handleDelete(file)}
                            className="h-8 w-8 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <h3 className="font-semibold mb-2 line-clamp-2">{file.title}</h3>
                      
                      <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <div className="flex justify-between">
                          <span>Thời lượng:</span>
                          <span>{formatTime(file.duration)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Giọng đọc:</span>
                          <span>{getVoiceName(file.voice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Định dạng:</span>
                          <Badge variant="secondary">{file.format.toUpperCase()}</Badge>
                        </div>
                        {file.fileSize > 0 && (
                          <div className="flex justify-between">
                            <span>Kích thước:</span>
                            <span>{formatFileSize(file.fileSize)}</span>
                          </div>
                        )}
                        {file.isPublic && (
                          <div className="flex justify-between">
                            <span>Trạng thái:</span>
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Công khai
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Mini Player */}
                      <Card className="bg-gray-50 dark:bg-gray-700">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <Button 
                              size="icon" 
                              onClick={() => {
                                if (playingFileId === file.id) {
                                  handlePauseAudio(file.id);
                                } else {
                                  handlePlayAudio(file);
                                }
                              }}
                              className="w-8 h-8 gradient-primary text-white hover:shadow-lg transition-all duration-200"
                            >
                              {playingFileId === file.id ? (
                                <Pause className="h-3 w-3" />
                              ) : (
                                <Play className="h-3 w-3" />
                              )}
                            </Button>
                            <div className="flex-1">
                              <Progress 
                                value={playProgress[file.id] || 0} 
                                className="h-1" 
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {currentTime[file.id] ? 
                                formatTime(currentTime[file.id]) : 
                                formatTime(0)
                              }
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page ? "gradient-primary text-white" : ""}
                    >
                      {page}
                    </Button>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
