import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Crown, X, Zap, Star, ArrowRight } from "lucide-react";

export default function UpgradeBanner() {
  const { user, isAuthenticated } = useAuth();
  const [isVisible, setIsVisible] = useState(true);

  // Fetch app settings for dynamic banner content
  const { data: appSettings } = useQuery({
    queryKey: ["/api/app-settings"],
    staleTime: 0,
    refetchInterval: 10000, // Refetch every 10 seconds to ensure fresh data
  });

  // Don't show banner if user is not authenticated or already has premium
  if (!isAuthenticated || !user || user.subscriptionType === "premium" || !isVisible) {
    return null;
  }

  // Check if banner is disabled in settings (with safe access)
  if (appSettings && (appSettings as any).enableUpgradeBanner === false) {
    return null;
  }

  const getBannerContent = () => {
    // Use dynamic content from app settings with safe access
    const title = (appSettings as any)?.bannerTitle || "Nâng cấp VoiceText Pro";
    const description = (appSettings as any)?.bannerDescription || "Tận hưởng không giới hạn ký tự và giọng đọc chất lượng cao";
    const buttonText = (appSettings as any)?.bannerButtonText || "Nâng cấp ngay";

    switch (user.subscriptionType) {
      case "free":
        return {
          title,
          description,
          buttonText,
          price: "99.000đ/tháng",
          targetPlan: "pro",
          icon: Crown,
          gradient: "from-blue-500 to-purple-600",
          benefits: ["100 file audio/tháng", "Lưu trữ vĩnh viễn", "Tất cả giọng nói premium"]
        };
      case "pro":
        return {
          title,
          description,
          buttonText,
          price: "199.000đ/tháng", 
          targetPlan: "premium",
          icon: Star,
          gradient: "from-purple-500 to-pink-600",
          benefits: ["Unlimited file audio", "AI voices", "API access", "Hỗ trợ 24/7"]
        };
      default:
        return null;
    }
  };

  const bannerData = getBannerContent();
  if (!bannerData) return null;

  const Icon = bannerData.icon;

  return (
    <div className="mb-8 animate-in slide-in-from-top-4 duration-700">
      <Card className={`relative overflow-hidden bg-gradient-to-br ${bannerData.gradient} text-white border-0 shadow-2xl hover:shadow-3xl transition-all duration-300`}>
        <div className="absolute inset-0 bg-black/10"></div>
        {/* Floating dots animation */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-4 left-8 w-2 h-2 bg-white/20 rounded-full animate-pulse"></div>
          <div className="absolute top-12 right-16 w-1 h-1 bg-white/30 rounded-full animate-ping delay-300"></div>
          <div className="absolute bottom-8 left-16 w-1.5 h-1.5 bg-white/25 rounded-full animate-pulse delay-700"></div>
          <div className="absolute bottom-16 right-8 w-1 h-1 bg-white/20 rounded-full animate-ping delay-1000"></div>
        </div>
        <CardContent className="relative p-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsVisible(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/20 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Icon className="h-8 w-8" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                <div className="mb-3 md:mb-0">
                  <h3 className="text-xl md:text-2xl font-bold mb-2">{bannerData.title}</h3>
                  <p className="text-white/90 text-base">{bannerData.description}</p>
                </div>
                {user.subscriptionType === "free" && (
                  <Badge className="bg-yellow-400 text-yellow-900 self-start md:ml-4 px-3 py-1">
                    ⚡ Phổ biến nhất
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {bannerData.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <Zap className="h-4 w-4 text-yellow-300" />
                    <span className="font-medium">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
                <div className="text-lg">
                  <span className="text-white/80">Chỉ từ </span>
                  <span className="text-2xl font-bold">{bannerData.price}</span>
                  <span className="text-white/80 ml-1">/ {user.subscriptionType === "free" ? "tháng" : "nâng cấp"}</span>
                </div>
                
                <Button 
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  asChild
                >
                  <Link href={`/pricing`}>
                    <Crown className="mr-2 h-5 w-5" />
                    {bannerData.buttonText}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}