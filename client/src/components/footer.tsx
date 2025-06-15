import { Mic, Facebook, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { FaTwitter } from "react-icons/fa";

const footerLinks = {
  company: [
    { label: "Công cụ TTS", href: "#tts-tool" },
    { label: "Tính năng", href: "#features" },
    { label: "Bảng giá", href: "#pricing" },
    { label: "API Documentation", href: "#" },
    { label: "Hướng dẫn", href: "#" },
  ],
  support: [
    { label: "Trung tâm trợ giúp", href: "#" },
    { label: "Liên hệ", href: "#" },
    { label: "Báo lỗi", href: "#" },
    { label: "Yêu cầu tính năng", href: "#" },
    { label: "Community", href: "#" },
  ],
  legal: [
    { label: "Điều khoản sử dụng", href: "#" },
    { label: "Chính sách bảo mật", href: "#" },
    { label: "Cookie Policy", href: "#" },
    { label: "Bản quyền", href: "#" },
  ],
};

export default function Footer() {
  const scrollToSection = (href: string) => {
    if (href.startsWith("#")) {
      const element = document.getElementById(href.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Mic className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold">VoiceText Pro</h3>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Nền tảng chuyển đổi text-to-speech hàng đầu Việt Nam với công nghệ AI tiên tiến.
              Mang đến trải nghiệm giọng đọc tự nhiên và chân thực nhất.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3 text-gray-400">
                <Phone className="h-4 w-4" />
                <span>070 9096 9293</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400">
                <Mail className="h-4 w-4" />
                <span>support@voicetextpro.com</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400">
                <MapPin className="h-4 w-4" />
                <span>Đà Nẵng, Việt Nam</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
              >
                <FaTwitter className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Liên kết nhanh</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Hỗ trợ</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href} 
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Pháp lý</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href} 
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-center md:text-left">
              &copy; 2025 VoiceText Pro.
            </p>
            <p className="text-gray-500 text-sm mt-4 md:mt-0">
              Được phát triển bởi <span className="text-blue-400 font-medium">Tiến Thuận</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
