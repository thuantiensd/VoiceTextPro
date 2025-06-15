import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Bell, 
  Mic, 
  FileAudio, 
  Zap, 
  Shield, 
  Globe, 
  Sparkles, 
  ArrowRight,
  Check,
  Star,
  Users,
  BarChart3,
  MessageSquare,
  Download,
  Settings,
  Crown,
  Rocket,
  Gift,
  Play,
  Pause,
  Volume2,
  Award,
  Headphones,
  Waves,
  CheckCircle,
  TrendingUp,
  Heart,
  Quote,
  Filter,
  Search,
  ChevronDown,
  Monitor,
  Smartphone,
  Palette,
  Code2,
  Timer,
  ShieldCheck
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

export default function FeaturesPage() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("demo");
  const [demoText, setDemoText] = useState("Chào mừng bạn đến với VoiceText Pro - nền tảng chuyển văn bản thành giọng nói hàng đầu Việt Nam!");
  const [selectedVoice, setSelectedVoice] = useState("alloy");
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stats counter animation
  const [stats, setStats] = useState({ users: 0, files: 0, hours: 0 });
  
  useEffect(() => {
    const animateStats = () => {
      const targetStats = { users: 12500, files: 45000, hours: 8760 };
      const duration = 2000;
      const steps = 60;
      const increment = {
        users: targetStats.users / steps,
        files: targetStats.files / steps,
        hours: targetStats.hours / steps
      };
      
      let currentStep = 0;
      const timer = setInterval(() => {
        if (currentStep < steps) {
          setStats({
            users: Math.floor(increment.users * currentStep),
            files: Math.floor(increment.files * currentStep),
            hours: Math.floor(increment.hours * currentStep)
          });
          currentStep++;
        } else {
          setStats(targetStats);
          clearInterval(timer);
        }
      }, duration / steps);
    };
    
    animateStats();
  }, []);

  // Demo TTS functionality
  const handleDemoPlay = async () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    try {
      setIsPlaying(true);
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: demoText,
          voice: selectedVoice,
          rate: 1.0,
          pitch: 1.0,
          volume: 1.0
        })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = () => setIsPlaying(false);
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Demo TTS error:', error);
      setIsPlaying(false);
    }
  };

  // Customer testimonials
  const testimonials = [
    {
      name: "Nguyễn Văn An",
      role: "Content Creator",
      avatar: "🎭",
      content: "VoiceText Pro đã thay đổi hoàn toàn cách tôi tạo nội dung. Chất lượng giọng đọc AI vượt xa mong đợi!",
      rating: 5,
      platform: "YouTube"
    },
    {
      name: "Trần Thị Bình",
      role: "Podcaster",
      avatar: "🎙️",
      content: "Tính năng đồng bộ âm lượng và hiệu ứng âm thanh thật tuyệt vời. Tiết kiệm rất nhiều thời gian chỉnh sửa.",
      rating: 5,
      platform: "Spotify"
    },
    {
      name: "Lê Minh Cường",
      role: "Giáo viên",
      avatar: "👨‍🏫",
      content: "Sử dụng để tạo bài giảng audio cho học sinh. Giọng đọc tự nhiên, học sinh rất thích nghe.",
      rating: 5,
      platform: "Coursera"
    },
    {
      name: "Phạm Thị Dung",
      role: "Marketer",
      avatar: "📢",
      content: "API integration rất dễ dàng. Đã tích hợp vào hệ thống CRM và tự động hóa thông báo voice.",
      rating: 5,
      platform: "Enterprise"
    }
  ];

  // Enhanced features with categories
  const enhancedFeatures = [
    {
      id: "real-time-volume",
      title: "Điều khiển âm lượng thời gian thực",
      description: "Điều chỉnh âm lượng mượt mà trong khi audio đang phát, đồng bộ hoàn hảo giữa các controls",
      icon: <Volume2 className="h-6 w-6" />,
      status: "Mới nhất",
      color: "bg-green-500",
      category: "audio",
      features: [
        "Real-time volume control không lag",
        "Đồng bộ đa thanh kéo âm lượng",
        "Memory volume cho mute/unmute",
        "Audio visualizer với hiệu ứng"
      ]
    },
    {
      id: "advanced-notifications",
      title: "Hệ thống thông báo thông minh",
      description: "Thông báo tức thì với routing thông minh và quản lý trạng thái đọc/chưa đọc",
      icon: <Bell className="h-6 w-6" />,
      status: "Nâng cấp",
      color: "bg-blue-500",
      category: "system",
      features: [
        "Routing thông minh đến trang liên quan",
        "Phân quyền admin/user notifications",
        "Mark as read realtime",
        "Dropdown notifications với preview"
      ]
    },
    {
      id: "premium-voices",
      title: "Bộ sưu tập giọng đọc Premium",
      description: "11+ giọng đọc AI chất lượng cao từ OpenAI và FPT AI với điều chỉnh tham số chi tiết",
      icon: <Mic className="h-6 w-6" />,
      status: "Pro",
      color: "bg-purple-500",
      category: "voice",
      features: [
        "11 giọng OpenAI (Alloy, Echo, Fable...)",
        "Giọng tiếng Việt từ FPT AI",
        "Điều chỉnh tốc độ, pitch, volume",
        "Voice preview trước khi tạo"
      ]
    },
    {
      id: "smart-file-management",
      title: "Quản lý file thông minh",
      description: "Hệ thống lưu trữ và tìm kiếm file tiên tiến với auto-save và cloud sync",
      icon: <FileAudio className="h-6 w-6" />,
      status: "Cải tiến",
      color: "bg-orange-500",
      category: "storage",
      features: [
        "Auto-save khi tạo audio",
        "Tìm kiếm full-text content",
        "Cloud storage unlimited",
        "Share link với permission control"
      ]
    },
    {
      id: "audio-visualizer",
      title: "Audio Visualizer Pro",
      description: "Trải nghiệm âm thanh nghệ thuật với visualizer động và controls chuyên nghiệp",
             icon: <Waves className="h-6 w-6" />,
      status: "Độc quyền",
      color: "bg-pink-500",
      category: "audio",
      features: [
        "Real-time waveform visualization",
        "Multiple visualizer themes",
        "Progress bar với preview",
        "Professional audio controls"
      ]
    },
    {
      id: "batch-processing",
      title: "Xử lý hàng loạt",
      description: "Tạo nhiều file audio cùng lúc từ danh sách văn bản với queue management",
      icon: <Zap className="h-6 w-6" />,
      status: "Sắp ra mắt",
      color: "bg-yellow-500",
      category: "productivity",
      features: [
        "Queue processing với priority",
        "CSV/Excel import support",
        "Bulk voice assignment",
        "Progress tracking realtime"
      ]
    }
  ];

  // Pricing plans with enhanced features
  const pricingPlans = {
    free: {
      name: "Miễn phí",
      price: "0₫",
      color: "border-gray-300",
      popular: false,
      description: "Hoàn hảo cho người dùng cá nhân",
      features: [
        "500 ký tự/tháng",
        "5 file âm thanh",
        "2 giọng đọc cơ bản",
        "Định dạng MP3",
        "Hỗ trợ email",
        "Audio visualizer cơ bản"
      ]
    },
    pro: {
      name: "Pro",
      price: "99.000₫",
      color: "border-blue-500",
      popular: true,
      description: "Lý tưởng cho content creators",
      features: [
        "10.000 ký tự/tháng",
        "100 file âm thanh",
        "Tất cả giọng đọc AI",
        "Nhiều định dạng xuất",
        "Real-time volume control",
        "Audio visualizer Pro",
        "Chia sẻ file công khai",
        "Hỗ trợ ưu tiên"
      ]
    },
    premium: {
      name: "Premium",
      price: "199.000₫",
      color: "border-yellow-500",
      popular: false,
      description: "Dành cho doanh nghiệp và power users",
      features: [
        "50.000 ký tự/tháng",
        "1.000 file âm thanh",
        "Tất cả tính năng Pro",
        "API tích hợp",
        "Batch processing",
        "Priority queue",
        "Custom branding",
        "24/7 premium support",
        "Analytics dashboard"
      ]
    }
  };

  // Filter functions
  const filteredFeatures = enhancedFeatures.filter(feature => {
    const matchesSearch = feature.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
                         feature.description.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCategory = selectedCategory === "all" || feature.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: "all", name: "Tất cả", icon: <Settings className="h-4 w-4" /> },
    { id: "audio", name: "Âm thanh", icon: <Headphones className="h-4 w-4" /> },
    { id: "voice", name: "Giọng đọc", icon: <Mic className="h-4 w-4" /> },
    { id: "system", name: "Hệ thống", icon: <Monitor className="h-4 w-4" /> },
    { id: "storage", name: "Lưu trữ", icon: <FileAudio className="h-4 w-4" /> },
    { id: "productivity", name: "Hiệu suất", icon: <TrendingUp className="h-4 w-4" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Enhanced Hero Section */}
        <section className="relative py-20 px-4">
          <div className="container mx-auto text-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <Badge className="mb-4 bg-purple-500/10 text-purple-300 border-purple-500/20">
                <Sparkles className="h-3 w-3 mr-1" />
                Nền tảng TTS #1 Việt Nam
              </Badge>
              <h1 className="text-6xl font-bold text-white mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                VoiceText Pro
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Chuyển văn bản thành giọng nói AI chất lượng cao với công nghệ tiên tiến nhất. 
                Trải nghiệm âm thanh chuyên nghiệp cho mọi nhu cầu.
              </p>
            </motion.div>

            {/* Live Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-12"
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.users.toLocaleString()}+</div>
                <div className="text-gray-400">Người dùng</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.files.toLocaleString()}+</div>
                <div className="text-gray-400">File audio</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.hours.toLocaleString()}+</div>
                <div className="text-gray-400">Giờ âm thanh</div>
              </div>
            </motion.div>

            {/* Live Demo Section */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="max-w-4xl mx-auto"
            >
                               <Card className="bg-black/20 backdrop-blur-lg border-white/30 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-center gap-2">
                    <Play className="h-5 w-5" />
                    Trải nghiệm ngay - Không cần đăng ký
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={demoText}
                    onChange={(e) => setDemoText(e.target.value)}
                    placeholder="Nhập văn bản để nghe thử..."
                                         className="bg-black/30 border-white/30 text-white placeholder:text-gray-300 resize-none backdrop-blur-sm"
                    rows={3}
                  />
                  <div className="flex gap-4 items-center justify-center">
                                         <select 
                       value={selectedVoice}
                       onChange={(e) => setSelectedVoice(e.target.value)}
                       className="bg-black/30 border border-white/30 rounded-md px-3 py-2 text-white backdrop-blur-sm"
                     >
                                             <option value="alloy" className="bg-gray-800 text-white">Alloy (Nữ - Trẻ trung)</option>
                       <option value="echo" className="bg-gray-800 text-white">Echo (Nam - Chuyên nghiệp)</option>
                       <option value="fable" className="bg-gray-800 text-white">Fable (Nam - Ấm áp)</option>
                       <option value="onyx" className="bg-gray-800 text-white">Onyx (Nam - Sâu lắng)</option>
                       <option value="nova" className="bg-gray-800 text-white">Nova (Nữ - Năng động)</option>
                       <option value="shimmer" className="bg-gray-800 text-white">Shimmer (Nữ - Dịu dàng)</option>
                    </select>
                    <Button 
                      onClick={handleDemoPlay}
                      disabled={!demoText.trim()}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Đang phát...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Nghe thử ngay
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Main Content Tabs */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                             <TabsList className="grid w-full grid-cols-4 bg-black/20 backdrop-blur-lg border-white/30">
                <TabsTrigger value="demo" className="data-[state=active]:bg-white/20 text-white">
                  <Rocket className="h-4 w-4 mr-2" />
                  Live Demo
                </TabsTrigger>
                <TabsTrigger value="features" className="data-[state=active]:bg-white/20 text-white">
                  <Star className="h-4 w-4 mr-2" />
                  Tính năng
                </TabsTrigger>
                <TabsTrigger value="testimonials" className="data-[state=active]:bg-white/20 text-white">
                  <Heart className="h-4 w-4 mr-2" />
                  Đánh giá
                </TabsTrigger>
                <TabsTrigger value="pricing" className="data-[state=active]:bg-white/20 text-white">
                  <Crown className="h-4 w-4 mr-2" />
                  Bảng giá
                </TabsTrigger>
              </TabsList>

              {/* Features Tab with Filters */}
              <TabsContent value="features">
                <div className="space-y-6">
                  {/* Search and Filter */}
                  <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                                                 placeholder="Tìm kiếm tính năng..."
                         value={searchFilter}
                         onChange={(e) => setSearchFilter(e.target.value)}
                         className="pl-10 bg-black/30 border-white/30 text-white placeholder:text-gray-300 backdrop-blur-sm"
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {categories.map((category) => (
                        <Button
                          key={category.id}
                          variant={selectedCategory === category.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedCategory(category.id)}
                                                     className={selectedCategory === category.id ? 
                             "bg-purple-500 hover:bg-purple-600 text-white" : 
                             "border-white/30 text-white hover:bg-white/20 bg-black/20"
                           }
                        >
                          {category.icon}
                          <span className="ml-2">{category.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Features Grid */}
                  <AnimatePresence>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {filteredFeatures.map((feature, index) => (
                        <motion.div
                          key={feature.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                                                     <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 bg-black/20 backdrop-blur-lg border-white/30 group hover:border-purple-500/50">
                            <div className={`absolute top-0 right-0 ${feature.color} text-white px-3 py-1 text-sm rounded-bl-lg`}>
                              {feature.status}
                            </div>
                            <CardHeader>
                              <div className="flex items-center gap-3">
                                <div className={`p-2 ${feature.color} text-white rounded-lg group-hover:scale-110 transition-transform`}>
                                  {feature.icon}
                                </div>
                                <div>
                                  <CardTitle className="text-lg text-white">{feature.title}</CardTitle>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-gray-300 mb-4">
                                {feature.description}
                              </p>
                              <ul className="space-y-2">
                                {feature.features.map((item, idx) => (
                                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                                    <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </AnimatePresence>
                </div>
              </TabsContent>

              {/* Testimonials Tab */}
              <TabsContent value="testimonials">
                <div className="space-y-8">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-white mb-4">Khách hàng nói gì về chúng tôi</h2>
                    <p className="text-gray-300 max-w-2xl mx-auto">
                      Hàng nghìn khách hàng đã tin tưởng và sử dụng VoiceText Pro cho nhu cầu của họ
                    </p>
                  </div>
                  
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {testimonials.map((testimonial, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                      >
                                                 <Card className="bg-black/20 backdrop-blur-lg border-white/30 hover:shadow-2xl transition-all duration-300">
                          <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="text-2xl">{testimonial.avatar}</div>
                              <div>
                                <div className="font-semibold text-white">{testimonial.name}</div>
                                <div className="text-sm text-gray-400">{testimonial.role}</div>
                                <Badge variant="outline" className="text-xs mt-1 border-purple-500/30 text-purple-300">
                                  {testimonial.platform}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex mb-3">
                              {[...Array(testimonial.rating)].map((_, i) => (
                                <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                              ))}
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed relative">
                              <Quote className="h-4 w-4 text-purple-400 absolute -top-2 -left-2" />
                              {testimonial.content}
                            </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Enhanced Pricing Tab */}
              <TabsContent value="pricing">
                <div className="space-y-8">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-white mb-4">Chọn gói phù hợp với bạn</h2>
                    <p className="text-gray-300 max-w-2xl mx-auto">
                      Từ miễn phí đến enterprise, chúng tôi có gói dịch vụ cho mọi nhu cầu
                    </p>
                  </div>

                  <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
                    {Object.entries(pricingPlans).map(([key, plan], index) => (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                      >
                        <Card className={`relative ${plan.color} border-2 ${
                          plan.popular ? 'ring-2 ring-purple-500 scale-105' : ''
                                                 } bg-black/20 backdrop-blur-lg hover:shadow-2xl transition-all duration-300`}>
                          {plan.popular && (
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2">
                                <Star className="h-3 w-3 mr-1" />
                                Phổ biến nhất
                              </Badge>
                            </div>
                          )}
                          <CardHeader className="text-center pb-4">
                            <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                            <p className="text-gray-400 text-sm">{plan.description}</p>
                            <div className="text-4xl font-bold text-white mt-4">
                              {plan.price}
                              {key !== 'free' && <span className="text-lg text-gray-400">/tháng</span>}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-3 mb-8">
                              {plan.features.map((feature, featureIndex) => (
                                <li key={featureIndex} className="flex items-center gap-3">
                                  <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                                  <span className="text-gray-300 text-sm">{feature}</span>
                                </li>
                              ))}
                            </ul>
                            <Button 
                              className={`w-full ${
                                plan.popular 
                                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' 
                                  : 'bg-black/20 hover:bg-black/30 border border-white/30 text-white'
                              } transition-all duration-300`}
                              disabled={key === 'free'}
                            >
                              {user?.subscriptionType === key ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Gói hiện tại
                                </>
                              ) : key === 'free' ? (
                                'Miễn phí'
                              ) : (
                                <>
                                  Bắt đầu ngay
                                  <ArrowRight className="h-4 w-4 ml-2" />
                                </>
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  {/* Comparison Table */}
                  <div className="mt-16">
                    <h3 className="text-2xl font-bold text-white text-center mb-8">So sánh chi tiết</h3>
                                         <Card className="bg-black/20 backdrop-blur-lg border-white/30 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-white/20">
                              <th className="text-left p-4 text-white">Tính năng</th>
                              <th className="text-center p-4 text-white">Miễn phí</th>
                              <th className="text-center p-4 text-white">Pro</th>
                              <th className="text-center p-4 text-white">Premium</th>
                            </tr>
                          </thead>
                          <tbody className="text-gray-300">
                            <tr className="border-b border-white/10">
                              <td className="p-4">Ký tự/tháng</td>
                              <td className="text-center p-4">500</td>
                              <td className="text-center p-4">10,000</td>
                              <td className="text-center p-4">50,000</td>
                            </tr>
                            <tr className="border-b border-white/10">
                              <td className="p-4">File lưu trữ</td>
                              <td className="text-center p-4">5</td>
                              <td className="text-center p-4">100</td>
                              <td className="text-center p-4">1,000</td>
                            </tr>
                            <tr className="border-b border-white/10">
                              <td className="p-4">Giọng đọc AI</td>
                              <td className="text-center p-4">2</td>
                              <td className="text-center p-4">Tất cả</td>
                              <td className="text-center p-4">Tất cả + Custom</td>
                            </tr>
                            <tr className="border-b border-white/10">
                              <td className="p-4">API Access</td>
                              <td className="text-center p-4">❌</td>
                              <td className="text-center p-4">❌</td>
                              <td className="text-center p-4">✅</td>
                            </tr>
                            <tr>
                              <td className="p-4">Hỗ trợ</td>
                              <td className="text-center p-4">Email</td>
                              <td className="text-center p-4">Priority</td>
                              <td className="text-center p-4">24/7</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Enhanced CTA Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
                             <Card className="inline-block p-12 bg-gradient-to-br from-indigo-900/40 via-purple-800/30 to-blue-900/40 backdrop-blur-lg border-gradient-to-r border-indigo-400/30 shadow-2xl">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <Rocket className="h-8 w-8 text-emerald-300" />
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-200 to-teal-100 bg-clip-text text-transparent">Sẵn sàng bắt đầu?</h2>
                </div>
                <p className="mb-8 text-emerald-50 text-lg max-w-2xl">
                  Tham gia cùng hàng nghìn người dùng đang tạo ra những nội dung âm thanh tuyệt vời với VoiceText Pro
                </p>
                <div className="flex gap-6 justify-center flex-wrap">
                  {!isAuthenticated ? (
                    <>
                      <Link href="/register">
                        <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3">
                          <Rocket className="h-5 w-5 mr-2" />
                          Đăng ký miễn phí
                        </Button>
                      </Link>
                      <Link href="/login">
                        <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 px-8 py-3">
                          Đăng nhập
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <Link href="/dashboard">
                      <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3">
                        Vào Dashboard
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>
        </section>
      </div>

      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}