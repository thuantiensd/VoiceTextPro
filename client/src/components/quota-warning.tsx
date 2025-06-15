import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { AlertTriangle, Crown, Zap } from "lucide-react";

interface QuotaWarningProps {
  currentUsage: number;
  maxUsage: number;
}

export default function QuotaWarning({ currentUsage, maxUsage }: QuotaWarningProps) {
  const { user, isAuthenticated } = useAuth();

  // Only show for free users
  if (!isAuthenticated || !user || user.subscriptionType !== "free") {
    return null;
  }

  const usagePercentage = (currentUsage / maxUsage) * 100;
  const remainingFiles = maxUsage - currentUsage;

  // Show warning when user has used 70% or more of their quota
  if (usagePercentage < 70) {
    return null;
  }

  const getWarningLevel = () => {
    if (usagePercentage >= 90) return "critical";
    if (usagePercentage >= 80) return "warning";
    return "info";
  };

  const warningLevel = getWarningLevel();

  const getColors = () => {
    switch (warningLevel) {
      case "critical":
        return {
          bg: "bg-red-50 dark:bg-red-950",
          border: "border-red-200 dark:border-red-800",
          text: "text-red-800 dark:text-red-200",
          icon: "text-red-600 dark:text-red-400"
        };
      case "warning":
        return {
          bg: "bg-yellow-50 dark:bg-yellow-950",
          border: "border-yellow-200 dark:border-yellow-800",
          text: "text-yellow-800 dark:text-yellow-200",
          icon: "text-yellow-600 dark:text-yellow-400"
        };
      default:
        return {
          bg: "bg-blue-50 dark:bg-blue-950",
          border: "border-blue-200 dark:border-blue-800",
          text: "text-blue-800 dark:text-blue-200",
          icon: "text-blue-600 dark:text-blue-400"
        };
    }
  };

  const colors = getColors();

  const getMessage = () => {
    if (remainingFiles === 0) {
      return {
        title: "Bạn đã sử dụng hết quota tháng này!",
        description: "Nâng cấp lên Pro để tiếp tục sử dụng dịch vụ với 100 file audio/tháng"
      };
    }
    if (remainingFiles <= 2) {
      return {
        title: `Chỉ còn ${remainingFiles} file audio!`,
        description: "Nâng cấp ngay để không bị gián đoạn"
      };
    }
    return {
      title: `Còn ${remainingFiles} file audio trong tháng này`,
      description: "Nâng cấp lên Pro để có thêm 95 file audio và nhiều tính năng khác"
    };
  };

  const message = getMessage();

  return (
    <Card className={`${colors.bg} ${colors.border} border mb-4`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className={`h-5 w-5 ${colors.icon} mt-0.5 flex-shrink-0`} />
          
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium ${colors.text} mb-1`}>
              {message.title}
            </h4>
            <p className={`text-sm ${colors.text} opacity-90 mb-3`}>
              {message.description}
            </p>

            {/* Usage Progress */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className={colors.text}>Đã sử dụng</span>
                <span className={colors.text}>{currentUsage}/{maxUsage} files</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    warningLevel === "critical" ? "bg-red-500" :
                    warningLevel === "warning" ? "bg-yellow-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Benefits Preview */}
            <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
              <div className="flex items-center space-x-1">
                <Zap className="h-3 w-3" />
                <span>100 files/tháng</span>
              </div>
              <div className="flex items-center space-x-1">
                <Crown className="h-3 w-3" />
                <span>Lưu trữ vĩnh viễn</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                Chỉ 99.000đ/tháng
              </Badge>
              
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700" asChild>
                <Link href="/pricing">
                  Nâng cấp Pro
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}