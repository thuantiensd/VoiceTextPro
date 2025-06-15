import { Card, CardContent } from "@/components/ui/card";
import { 
  Mic, 
  FileUp, 
  Settings, 
  Download, 
  Share2, 
  Smartphone,
  Users,
  Zap,
  Shield
} from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "20+ Giọng Đọc Tiếng Việt",
    description: "Đa dạng giọng đọc từ 3 miền Bắc-Trung-Nam với chất lượng tự nhiên, chân thực như người thật."
  },
  {
    icon: FileUp,
    title: "Hỗ Trợ Đa Định Dạng",
    description: "Chuyển đổi từ PDF, Word, TXT và nhiều định dạng khác. Batch processing cho nhiều file cùng lúc."
  },
  {
    icon: Settings,
    title: "Tùy Chỉnh Nâng Cao",
    description: "Điều chỉnh tốc độ, cao độ, âm lượng, nhấn mạnh và nhiều thông số khác để có giọng đọc hoàn hảo."
  },
  {
    icon: Download,
    title: "Xuất Đa Định Dạng",
    description: "Tải xuống audio với chất lượng cao ở nhiều định dạng: MP3, WAV, OGG phù hợp mọi nhu cầu."
  },
  {
    icon: Share2,
    title: "Chia Sẻ Dễ Dàng",
    description: "Tạo link chia sẻ công khai để người khác có thể nghe audio mà không cần tài khoản."
  },
  {
    icon: Smartphone,
    title: "Responsive Design",
    description: "Giao diện thân thiện, hoạt động mượt mà trên mọi thiết bị từ desktop đến smartphone."
  },
  {
    icon: Zap,
    title: "Xử Lý Nhanh Chóng",
    description: "Công nghệ AI tối ưu giúp chuyển đổi văn bản thành giọng nói trong thời gian thực."
  },
  {
    icon: Shield,
    title: "Bảo Mật Cao",
    description: "Dữ liệu được mã hóa và bảo vệ tuyệt đối. Không lưu trữ nội dung cá nhân của người dùng."
  },
  {
    icon: Users,
    title: "Cộng Đồng Hỗ Trợ",
    description: "Tham gia cộng đồng người dùng để chia sẻ kinh nghiệm và nhận hỗ trợ 24/7."
  }
];

export default function Features() {
  return (
    <section id="features" className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Tính Năng Nổi Bật</h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl mx-auto">
            Trải nghiệm công nghệ chuyển đổi text-to-speech tiên tiến nhất với hàng loạt tính năng mạnh mẽ
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105 border-0 shadow-lg"
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 gradient-primary rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
