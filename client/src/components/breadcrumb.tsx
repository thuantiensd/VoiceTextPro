import { Button } from "@/components/ui/button";
import { ChevronLeft, Home } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState } from "react";

interface BreadcrumbProps {
  title: string;
  showBackButton?: boolean;
  backUrl?: string;
  showHomeButton?: boolean;
}

export default function Breadcrumb({ 
  title, 
  showBackButton = true, 
  backUrl = "/", 
  showHomeButton = true 
}: BreadcrumbProps) {
  const [finalBackUrl, setFinalBackUrl] = useState(backUrl);

  useEffect(() => {
    // Check for returnTab parameter in URL
    const params = new URLSearchParams(window.location.search);
    const returnTab = params.get('returnTab');
    
    if (returnTab && ['overview', 'notifications', 'users', 'audio', 'payments', 'settings-menu', 'system-status'].includes(returnTab)) {
      setFinalBackUrl(`/admin?tab=${returnTab}`);
    } else {
      setFinalBackUrl(backUrl);
    }
  }, [backUrl]);
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Link href={finalBackUrl}>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  Quay lại
                </Button>
              </Link>
            )}
            
            {showHomeButton && (
              <Link href="/">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Trang chủ
                </Button>
              </Link>
            )}
          </div>
          
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white absolute left-1/2 transform -translate-x-1/2">
            {title}
          </h1>
          
          <div></div> {/* Spacer for balance */}
        </div>
      </div>
    </div>
  );
}