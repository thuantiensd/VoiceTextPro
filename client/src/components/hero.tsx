import { Button } from "@/components/ui/button";
import { Play, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Hero() {
  const { toast } = useToast();

  const scrollToTTSTool = () => {
    const element = document.getElementById("tts-tool");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleDownloadApp = () => {
    toast({
      title: "🚀 Ứng dụng đang phát triển",
      description: "VoiceText Pro mobile app đang được phát triển và sẽ sớm ra mắt. Hãy theo dõi để cập nhật thông tin mới nhất!",
      duration: 5000,
    });
  };

  return (
    <section className="hero-gradient py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/5"></div>
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-24 h-24 bg-purple-300/20 rounded-full blur-lg"></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-blue-200/15 rounded-full blur-md"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fadeInUp hero-text-shadow">
            Chuyển Văn Bản Thành<br />
            <span className="hero-gradient-text">Giọng Nói Việt</span> Tự Nhiên
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto animate-fadeInUp text-blue-50/90 leading-relaxed">
            Công nghệ AI tiên tiến với hơn 20 giọng đọc tiếng Việt chân thực.
            <br className="hidden sm:block" />
            Hỗ trợ file PDF, Word, và batch processing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fadeInUp">
            <Button
              onClick={scrollToTTSTool}
              size="lg"
              className="hero-button-primary px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Play className="mr-2 h-5 w-5" />
              Dùng thử miễn phí
            </Button>
            <Button
              onClick={handleDownloadApp}
              variant="outline"
              size="lg"
              className="hero-button-secondary border-2 px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <Download className="mr-2 h-5 w-5" />
              Tải ứng dụng
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
