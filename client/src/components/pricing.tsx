import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, Star, Sparkles, ArrowRight, Check, X } from 'lucide-react';
import { Link } from 'wouter';

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  useEffect(() => {
    setIsVisible(true);
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

  const handlePlanSelect = (planType: string, cycle: string) => {
    console.log(`Selected ${planType} plan with ${cycle} billing`);
    // Handle plan selection logic here
  };

  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-300/10 to-purple-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center justify-center p-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full mb-6 backdrop-blur-sm border border-blue-200/20">
            <Sparkles className="h-6 w-6 text-blue-600 mr-2" />
            <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Bảng Giá Dịch Vụ
            </span>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold mb-4 text-gray-900 dark:text-white leading-none">
            Chọn gói phù hợp với bạn
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 max-w-lg mx-auto leading-normal">
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
            
            const shadowClass = isHovered 
              ? plan.name === "Pro" 
                ? "shadow-2xl shadow-blue-500/30" 
                : plan.name === "Premium" 
                  ? "shadow-2xl shadow-purple-500/30"
                  : "shadow-2xl shadow-gray-400/30"
              : '';
            
            return (
              <div
                key={plan.name}
                className={`relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl p-8 transition-all duration-500 hover:scale-105 border border-gray-200/50 dark:border-gray-700/50 ${shadowClass} ${
                  plan.popular ? 'ring-4 ring-blue-500/50 ring-opacity-75 transform scale-105 shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:ring-blue-400/70' : ''
                }`}
                style={{
                  animationDelay: `${index * 200}ms`,
                  ...(plan.popular && {
                    boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.25), 0 0 0 1px rgba(59, 130, 246, 0.1)',
                  }),
                }}
                onMouseEnter={() => setHoveredPlan(plan.name)}
                onMouseLeave={() => setHoveredPlan(null)}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-0 right-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-center py-3 text-sm font-bold rounded-t-3xl shadow-2xl animate-pulse">
                    <div className="flex items-center justify-center space-x-2">
                      <Sparkles className="w-5 h-5 animate-bounce text-yellow-300" />
                      <span className="tracking-wider text-base font-extrabold drop-shadow-lg">
                        ✨ PHỔ BIẾN NHẤT ✨
                      </span>
                      <Sparkles className="w-5 h-5 animate-bounce text-yellow-300" />
                    </div>
                  </div>
                )}

                <div className={`${plan.popular ? 'mt-8' : ''}`}>
                  {/* Plan Header */}
                  <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.bgGradient} mb-4 transition-transform duration-300 ${isHovered ? 'scale-110 rotate-3' : ''}`}>
                      <Icon className={`w-8 h-8 text-${plan.color}-600`} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{plan.description}</p>
                  </div>

                  {/* Pricing */}
                  <div className="text-center mb-8">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        {plan.price[billingCycle] === 0 ? "Miễn phí" : formatPrice(plan.price[billingCycle])}
                      </span>
                      {plan.price[billingCycle] > 0 && (
                        <span className="text-gray-500 dark:text-gray-400 ml-2">
                          /{billingCycle === "monthly" ? "tháng" : "năm"}
                        </span>
                      )}
                    </div>
                    {billingCycle === "yearly" && savings && plan.price.monthly > 0 && (
                      <div className="mt-2">
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          Tiết kiệm {formatPrice(savings.savings)} ({savings.percentage}%)
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                      </div>
                    ))}
                    {plan.limitations && plan.limitations.map((limitation, limitIndex) => (
                      <div key={limitIndex} className="flex items-start opacity-60">
                        <X className="w-5 h-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                        <span className="text-gray-500 dark:text-gray-400 text-sm line-through">{limitation}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <div className="space-y-4">
                    {plan.name === "Free" ? (
                      <Link to="/register">
                        <Button variant="outline" size="lg" className="w-full transition-all duration-300 hover:scale-105">
                          Bắt đầu miễn phí
                        </Button>
                      </Link>
                    ) : plan.name === "Pro" ? (
                      <Button 
                        size="lg" 
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
                        onClick={() => handlePlanSelect("pro", billingCycle)}
                      >
                        <Crown className="mr-2 h-4 w-4" />
                        Chọn Pro
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        size="lg" 
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
                        onClick={() => handlePlanSelect("premium", billingCycle)}
                      >
                        <Crown className="mr-2 h-4 w-4" />
                        Chọn Premium
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className={`text-center transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 rounded-2xl p-8 backdrop-blur-sm border border-blue-200/30">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Bạn có câu hỏi về gói dịch vụ?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp bạn tìm gói dịch vụ phù hợp nhất với nhu cầu của bạn.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" size="lg" className="group transition-all duration-300 hover:scale-105">
                Liên hệ hỗ trợ
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Link to="/pricing">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all duration-300 hover:scale-105">
                  Xem chi tiết pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
