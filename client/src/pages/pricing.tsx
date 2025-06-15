import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Check, Crown, Zap, Star, ArrowRight, ArrowLeft, Sparkles, Users, Shield, Headphones, TrendingUp, Lightbulb } from "lucide-react";
import Breadcrumb from "@/components/breadcrumb";

export default function PricingPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Khách vãng lai có thể xem pricing để biết các gói nâng cấp
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Force reload functionality
  useEffect(() => {
    // Check if we came from navigation (not a full reload)
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    const navigationType = navigationEntries[0]?.type;
    
    // If it's a navigate (not reload) and we don't have the reload flag, force reload
    if (navigationType === 'navigate' && !sessionStorage.getItem('pricing-reloaded')) {
      sessionStorage.setItem('pricing-reloaded', 'true');
      window.location.reload();
      return;
    }
    
    // Clear the reload flag when component unmounts or page changes
    const clearReloadFlag = () => {
      sessionStorage.removeItem('pricing-reloaded');
    };
    
    window.addEventListener('beforeunload', clearReloadFlag);
    
    return () => {
      window.removeEventListener('beforeunload', clearReloadFlag);
      // Don't clear immediately on unmount to prevent reload loop
      setTimeout(() => {
        sessionStorage.removeItem('pricing-reloaded');
      }, 100);
    };
  }, []);

  // Animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const plans = [
    {
      name: "Free",
      price: { monthly: 0, yearly: 0 },
      description: "Dành cho người dùng cá nhân",
      features: [
        "5 file audio mỗi tháng",
        "Giọng nói cơ bản",
        "File tự động xóa sau 24h",
        "Chất lượng standard",
        "Hỗ trợ qua email"
      ],
      limitations: [
        "Giới hạn 5 file/tháng",
        "Không lưu trữ vĩnh viễn",
        "Chỉ có 2 giọng nói"
      ],
      current: user?.subscriptionType === "free",
      popular: false,
      icon: Zap,
      color: "gray",
      gradient: "from-gray-400 to-gray-600",
      bgGradient: "from-gray-50 to-gray-100",
      glowColor: "gray-400"
    },
    {
      name: "Pro",
      price: { monthly: 99000, yearly: 990000 },
      description: "Dành cho chuyên gia và doanh nghiệp nhỏ",
      features: [
        "100 file audio mỗi tháng", 
        "Tất cả giọng nói premium",
        "Lưu trữ vĩnh viễn",
        "Export đa định dạng (MP3, WAV, OGG)",
        "Chất lượng cao HD",
        "Hỗ trợ ưu tiên",
        "API access cơ bản"
      ],
      current: user?.subscriptionType === "pro",
      popular: true,
      icon: Crown,
      color: "blue",
      gradient: "from-blue-500 to-purple-600",
      bgGradient: "from-blue-50 to-purple-50",
      glowColor: "blue-500"
    },
    {
      name: "Premium",
      price: { monthly: 199000, yearly: 1990000 },
      description: "Dành cho doanh nghiệp và người dùng chuyên nghiệp",
      features: [
        "Unlimited file audio",
        "Tất cả giọng nói + AI voices",
        "Lưu trữ không giới hạn",
        "Tất cả định dạng export",
        "Chất lượng studio",
        "Custom voice training",
        "API access đầy đủ",
        "Hỗ trợ 24/7",
        "White-label option"
      ],
      current: user?.subscriptionType === "premium",
      popular: false,
      icon: Star,
      color: "purple",
      gradient: "from-purple-500 to-pink-600",
      bgGradient: "from-purple-50 to-pink-50", 
      glowColor: "purple-500"
    }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(price);
  };

  const getYearlySavings = (monthly: number, yearly: number) => {
    const monthlyCost = monthly * 12;
    const savings = monthlyCost - yearly;
    const percentage = Math.round((savings / monthlyCost) * 100);
    return { savings, percentage };
  };

  const features = [
    {
      icon: Users,
      title: "Phù hợp mọi đối tượng",
      description: "Từ cá nhân đến doanh nghiệp lớn"
    },
    {
      icon: Shield,
      title: "Bảo mật tuyệt đối",
      description: "Dữ liệu được mã hóa và bảo vệ"
    },
    {
      icon: Headphones,
      title: "Hỗ trợ 24/7",
      description: "Đội ngũ hỗ trợ luôn sẵn sàng"
    },
    {
      icon: TrendingUp,
      title: "Liên tục cập nhật",
      description: "Tính năng mới được bổ sung thường xuyên"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-300/10 to-purple-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <Breadcrumb 
        title="Bảng giá thành viên" 
        showBackButton={true}
        backUrl="/"
        showHomeButton={true}
      />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        
        {/* Header */}
        <div className={`text-center mb-12 transition-all duration-1000 mx-auto max-w-4xl ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center justify-center p-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full mb-4 backdrop-blur-sm border border-blue-200/20">
            <Sparkles className="h-6 w-6 text-blue-600 mr-2" />
            <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Giá tốt nhất thị trường
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-gray-900 dark:text-white leading-none text-center mx-auto">
            Chọn gói phù hợp với bạn
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 max-w-lg mx-auto leading-normal text-center">
            Nâng cấp để trải nghiệm đầy đủ tính năng VoiceText Pro với công nghệ AI tiên tiến nhất
          </p>
          
          {/* Enhanced Billing Toggle */}
          <div className="flex items-center justify-center space-x-6 mb-8">
            <span className={`text-sm transition-all duration-300 ${billingCycle === "monthly" ? "text-gray-900 dark:text-white font-semibold scale-110" : "text-gray-500 hover:text-gray-700"}`}>
              Hàng tháng
            </span>
            <div className="relative">
              <button
                onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
                className={`relative w-16 h-8 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/30 ${
                  billingCycle === "yearly" 
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30" 
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 transform ${
                    billingCycle === "yearly" ? "translate-x-8" : ""
                  }`}
                />
              </button>
              {billingCycle === "yearly" && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 animate-bounce">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                    🎉 Tiết kiệm 17%
                  </div>
                </div>
              )}
            </div>
            <span className={`text-sm transition-all duration-300 ${billingCycle === "yearly" ? "text-gray-900 dark:text-white font-semibold scale-110" : "text-gray-500 hover:text-gray-700"}`}>
              Hàng năm
            </span>
            {billingCycle === "yearly" && (
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs animate-pulse border-none shadow-lg">
                <Sparkles className="w-3 h-3 mr-1" />
                Hot Deal!
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const savings = billingCycle === "yearly" ? getYearlySavings(plan.price.monthly, plan.price.yearly) : null;
            const isHovered = hoveredPlan === plan.name;
            
            // Fix: Dynamic shadow classes
            const shadowClass = isHovered 
              ? plan.name === "Pro" 
                ? "shadow-2xl shadow-blue-500/30" 
                : plan.name === "Premium" 
                  ? "shadow-2xl shadow-purple-500/30"
                  : "shadow-2xl shadow-gray-400/30"
              : '';
            
            return (
              <Card 
                key={plan.name}
                className={`relative overflow-hidden backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 ${
                  plan.popular 
                    ? "ring-2 ring-blue-500/50 shadow-2xl shadow-blue-500/20 md:scale-110" 
                    : "shadow-xl hover:shadow-2xl"
                } ${shadowClass}`}
                onMouseEnter={() => setHoveredPlan(plan.name)}
                onMouseLeave={() => setHoveredPlan(null)}
                style={{
                  animationDelay: `${index * 200}ms`
                }}
              >
                {/* Glowing border effect */}
                <div className={`absolute inset-0 bg-gradient-to-r ${plan.gradient} opacity-0 transition-opacity duration-500 ${isHovered ? 'opacity-20' : ''} rounded-lg`}></div>
                
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-center py-3 text-sm font-semibold">
                    <div className="flex items-center justify-center space-x-2">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <span className="tracking-wide">PHỔ BIẾN NHẤT</span>
                      <Sparkles className="w-4 h-4 animate-pulse" />
                    </div>
                  </div>
                )}
                
                <CardHeader className={`text-center relative z-10 ${plan.popular ? "pt-16" : "pt-8"}`}>
                  <div className={`w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br ${plan.gradient} flex items-center justify-center shadow-lg transform transition-all duration-300 ${isHovered ? 'scale-110 rotate-12' : ''}`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-3xl font-bold mb-2">{plan.name}</CardTitle>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                    {plan.description}
                  </p>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline justify-center mb-2">
                      <span className={`text-5xl font-bold bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>
                        {plan.price[billingCycle] === 0 ? "Free" : formatPrice(plan.price[billingCycle])}
                      </span>
                      {plan.price[billingCycle] > 0 && (
                        <span className="text-gray-500 ml-2 text-lg">
                          /{billingCycle === "monthly" ? "tháng" : "năm"}
                        </span>
                      )}
                    </div>
                    {savings && plan.price.yearly > 0 && (
                      <div className="inline-flex items-center bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Tiết kiệm {formatPrice(savings.savings)}/năm
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0 relative z-10">
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className={`flex items-start transition-all duration-300 delay-${featureIndex * 100} ${isHovered ? 'translate-x-2' : ''}`}>
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-r ${plan.gradient} flex items-center justify-center mt-0.5 mr-3`}>
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.current ? (
                    <Button className={`w-full h-12 bg-gradient-to-r ${plan.gradient} text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg`} disabled>
                      <Crown className="w-4 h-4 mr-2" />
                      Gói hiện tại
                    </Button>
                  ) : !isAuthenticated ? (
                    <Button className={`w-full h-12 bg-gradient-to-r ${plan.gradient} text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-lg`} asChild>
                      <Link href="/register">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Bắt đầu miễn phí
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  ) : plan.name === "Free" ? (
                    <Button 
                      variant="outline" 
                      className="w-full h-12 border-2 border-gray-300 hover:border-gray-400 font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
                      onClick={() => window.location.href = `/downgrade?plan=${plan.name.toLowerCase()}`}
                    >
                      Chuyển về Free
                    </Button>
                  ) : (
                    <Button 
                      className={`w-full h-12 bg-gradient-to-r ${plan.gradient} text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-lg relative overflow-hidden group`}
                      onClick={() => window.location.href = `/payment?plan=${plan.name.toLowerCase()}&billing=${billingCycle}`}
                    >
                      <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                      <span className="relative z-10 flex items-center justify-center">
                        <Crown className="w-4 h-4 mr-2" />
                        Nâng cấp lên {plan.name}
                        <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                      </span>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature Highlights */}
        <div className={`mb-20 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Tại sao chọn VoiceText Pro?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="text-center p-6 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg border border-white/20 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl"
                  style={{ animationDelay: `${600 + index * 100}ms` }}
                >
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Enhanced FAQ Section */}
        <div className={`max-w-4xl mx-auto transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Câu hỏi thường gặp
            </h2>
            <p className="text-gray-600 dark:text-gray-400">Giải đáp mọi thắc mắc của bạn</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg border border-white/20 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <Lightbulb className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Tôi có thể hủy đăng ký bất cứ lúc nào không?</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Có, bạn có thể hủy đăng ký bất cứ lúc nào. Gói dịch vụ sẽ vẫn hoạt động đến hết chu kỳ thanh toán.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg border border-white/20 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <Shield className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Có được hoàn tiền không?</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Chúng tôi có chính sách hoàn tiền trong vòng 30 ngày đầu nếu bạn không hài lòng với dịch vụ.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg border border-white/20 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <TrendingUp className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Tôi có thể thay đổi gói dịch vụ không?</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Có, bạn có thể nâng cấp hoặc hạ cấp gói dịch vụ bất cứ lúc nào. Phí sẽ được tính theo tỷ lệ.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg border border-white/20 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <Headphones className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Có hỗ trợ kỹ thuật không?</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Có, chúng tôi có đội ngũ hỗ trợ chuyên nghiệp 24/7 qua email, chat và điện thoại.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className={`text-center mt-20 transition-all duration-1000 delay-900 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="p-12 rounded-3xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-lg border border-white/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5 animate-gradient-x"></div>
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Sẵn sàng bắt đầu?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                Tham gia cùng hàng nghìn người dùng đã tin tuyển VoiceText Pro
              </p>
              <Button className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg" asChild>
                <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                  <Sparkles className="w-5 h-5 mr-2" />
                  {isAuthenticated ? "Trải nghiệm ngay" : "Đăng ký miễn phí"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}