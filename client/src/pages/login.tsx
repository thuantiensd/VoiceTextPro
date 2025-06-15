import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { loginSchema, type LoginUser } from "@shared/schema";
import { Mic, Eye, EyeOff, Lock } from "lucide-react";
import GoogleOAuthButton from "@/components/google-oauth-button";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  // Check for OAuth messages in URL params  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const success = urlParams.get('success');
    const message = urlParams.get('message');
    
    if (success && message) {
      // Success message (e.g., registration completed)
      let title = "Thành công";
      
      if (success === 'registration_complete') {
        title = "Đăng ký thành công!";
      }
      
      toast({
        title,
        description: decodeURIComponent(message),
        variant: "default",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      
      // Clear URL params để không hiển thị tin nhắn nhiều lần
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error && message) {
      // Error message
      let title = "Đăng nhập thất bại";
      
      if (error === 'account_not_found') {
        title = "Tài khoản không tồn tại";
      } else if (error === 'account_exists') {
        title = "Tài khoản đã tồn tại";
      }
      
      toast({
        title,
        description: decodeURIComponent(message),
        variant: "destructive",
      });
      
      // Clear URL params để không hiển thị lỗi nhiều lần
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  const form = useForm<LoginUser>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginUser) => {
      const response = await apiRequest("POST", "/api/login", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Đăng nhập thành công",
        description: "Chào mừng bạn trở lại!",
      });
      // Redirect to home page
      window.location.href = "/";
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Tên đăng nhập hoặc mật khẩu không đúng";
      const isAccountLocked = errorMessage.includes("Tài khoản đã bị khóa");
      
      toast({
        title: isAccountLocked ? "Tài khoản bị khóa" : "Đăng nhập thất bại", 
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginUser) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Mic className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">VoiceText Pro</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Đăng nhập để truy cập các tính năng cao cấp
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Đăng nhập</CardTitle>
            <CardDescription className="text-center">
              Nhập thông tin tài khoản của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Tên đăng nhập</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Nhập tên đăng nhập"
                  {...form.register("username")}
                  className="h-11"
                />
                {form.formState.errors.username && (
                  <p className="text-sm text-red-500">{form.formState.errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    {...form.register("password")}
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Hoặc</span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <GoogleOAuthButton 
              text="Đăng nhập với Google"
              mode="login"
              disabled={loginMutation.isPending}
            />

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Chưa có tài khoản? </span>
              <Link href="/register" className="text-blue-600 hover:text-blue-500 font-medium">
                Đăng ký ngay
              </Link>
            </div>

            <div className="mt-4 text-center">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                ← Quay về trang chủ
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}