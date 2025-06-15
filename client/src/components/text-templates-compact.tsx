import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ChevronDown, Play, Download, FileText, Volume2 } from "lucide-react";

interface TextTemplatesCompactProps {
  onSelectTemplate?: (content: string) => void;
}

const defaultTemplates = [
  {
    id: 1,
    title: "Quảng cáo sản phẩm",
    category: "marketing",
    content: "Khám phá sản phẩm mới của chúng tôi! Với chất lượng vượt trội và giá cả hợp lý, đây chính là lựa chọn hoàn hảo cho bạn. Đặt hàng ngay hôm nay để nhận ưu đãi đặc biệt!"
  },
  {
    id: 2,
    title: "Podcast giới thiệu",
    category: "podcast",
    content: "Chào mừng các bạn đến với podcast của chúng tôi. Hôm nay chúng ta sẽ cùng thảo luận về những xu hướng công nghệ mới nhất và tác động của chúng đến cuộc sống hàng ngày."
  },
  {
    id: 3,
    title: "Bài giảng trực tuyến",
    category: "education",
    content: "Trong bài học hôm nay, chúng ta sẽ tìm hiểu về nguyên lý cơ bản của lập trình. Hãy chuẩn bị sẵn máy tính và theo dõi cẩn thận những ví dụ thực hành."
  },
  {
    id: 4,
    title: "Tin tức thời sự",
    category: "news",
    content: "Tin tức nóng hổi: Thị trường công nghệ Việt Nam đang có những bước phát triển mạnh mẽ với sự xuất hiện của nhiều startup sáng tạo và thu hút được đầu tư lớn."
  }
];

export default function TextTemplatesCompact({ onSelectTemplate }: TextTemplatesCompactProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: templates } = useQuery({
    queryKey: ["/api/templates"],
    retry: false,
  });

  const previewMutation = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      const response = await apiRequest("POST", "/api/tts/preview", {
        content,
        voice: "alloy",
        speed: 1.0,
        format: "mp3"
      });
      return response.blob();
    },
    onSuccess: (blob, { content }) => {
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () => {
        setPlayingId(null);
        URL.revokeObjectURL(audioUrl);
      };
    },
    onError: () => {
      setPlayingId(null);
      toast({
        title: "Lỗi",
        description: "Không thể phát audio preview",
        variant: "destructive",
      });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async ({ content, title }: { content: string; title: string }) => {
      const response = await apiRequest("POST", "/api/tts", {
        text: content,
        voice: "alloy",
        speed: 1.0,
        format: "mp3"
      });
      return { blob: await response.blob(), title };
    },
    onSuccess: ({ blob, title }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Thành công",
        description: "Đã tải xuống file audio",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi", 
        description: "Không thể tải xuống audio",
        variant: "destructive",
      });
    },
  });

  const handlePreview = (template: any) => {
    if (playingId === template.id) {
      setPlayingId(null);
      return;
    }
    setPlayingId(template.id);
    previewMutation.mutate({ content: template.content });
  };

  const handleDownload = (template: any) => {
    downloadMutation.mutate({ content: template.content, title: template.title });
  };

  const allTemplates = templates || defaultTemplates;

  const categoryColors = {
    marketing: "bg-blue-100 text-blue-800",
    podcast: "bg-purple-100 text-purple-800", 
    education: "bg-green-100 text-green-800",
    news: "bg-orange-100 text-orange-800"
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Mẫu văn bản có sẵn</span>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-3 mt-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {allTemplates.map((template: any) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">{template.title}</h4>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${categoryColors[template.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800'}`}
                    >
                      {template.category}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {template.content}
                </p>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSelectTemplate?.(template.content)}
                    className="flex-1 text-xs"
                  >
                    Sử dụng
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handlePreview(template)}
                    disabled={previewMutation.isPending}
                    className="px-2"
                  >
                    {playingId === template.id ? (
                      <Volume2 className="h-3 w-3" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownload(template)}
                    disabled={downloadMutation.isPending}
                    className="px-2"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}