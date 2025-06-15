import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Handle authentication redirects - only once
  useEffect(() => {
    if (isLoading) return;

    // Protected route but user not authenticated
    if (requireAuth && !isAuthenticated && location !== "/login" && location !== "/register" && location !== "/admin-login") {
      // Admin routes redirect to admin login (im lặng)
      if (location.startsWith("/admin")) {
        setLocation("/admin-login");
      } else {
        // Regular routes redirect to regular login
        toast({
          title: "Yêu cầu đăng nhập",
          description: "Vui lòng đăng ký hoặc đăng nhập để sử dụng dịch vụ.",
          variant: "destructive",
        });
        setLocation("/login");
      }
      return;
    }

    // User authenticated but on auth pages - redirect to home
    if (isAuthenticated && (location === "/login" || location === "/register")) {
      setLocation("/");
      return;
    }
  }, [isAuthenticated, isLoading]); // Remove dependencies that cause re-runs

  // Hiển thị loading spinner khi đang check auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Đang kiểm tra thông tin đăng nhập...</p>
        </div>
      </div>
    );
  }

  // Nếu requireAuth = true nhưng chưa authenticated, không hiển thị gì (sẽ redirect)
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // Nếu đang ở trang login/register và đã authenticated, không hiển thị gì (sẽ redirect)
  if (!requireAuth && isAuthenticated && (location === "/login" || location === "/register")) {
    return null;
  }

  return <>{children}</>;
} 