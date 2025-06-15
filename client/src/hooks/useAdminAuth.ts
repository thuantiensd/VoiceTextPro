import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export function useAdminAuth() {
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && (!currentUser || currentUser.role !== "admin")) {
      toast({
        title: "Không có quyền truy cập",
        description: "Bạn cần đăng nhập với tài khoản admin để truy cập trang này",
        variant: "destructive",
      });
      setLocation("/admin-login");
    }
  }, [currentUser, isLoading, toast, setLocation]);

  return {
    user: currentUser,
    isLoading,
    isAdmin: currentUser?.role === "admin"
  };
}