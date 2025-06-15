import { useState } from "react";
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
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { Mic, Eye, EyeOff, CheckCircle } from "lucide-react";
import GoogleOAuthButton from "@/components/google-oauth-button";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      fullName: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Đăng ký thành công",
        description: "Tài khoản đã được tạo. Bạn có thể đăng nhập ngay bây giờ!",
      });
      // Redirect to login page
      window.location.href = "/login";
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Có lỗi xảy ra khi tạo tài khoản";
      
      toast({
        title: "Đăng ký thất bại",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertUser) => {
    registerMutation.mutate(data);
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
            Tạo tài khoản để sử dụng đầy đủ tính năng
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Đăng ký</CardTitle>
            <CardDescription className="text-center">
              Điền thông tin để tạo tài khoản mới
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và tên</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Nhập họ và tên"
                  {...form.register("fullName")}
                  className="h-11"
                />
                {form.formState.errors.fullName && (
                  <p className="text-sm text-red-500">{form.formState.errors.fullName.message}</p>
                )}
              </div>

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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Nhập địa chỉ email"
                  {...form.register("email")}
                  className="h-11"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
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
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Đang tạo tài khoản..." : "Đăng ký"}
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
              text="Đăng ký với Google"
              mode="register"
              disabled={registerMutation.isPending}
            />

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Đã có tài khoản? </span>
              <Link href="/login">
                <a className="text-blue-600 hover:text-blue-500 font-medium">
                  Đăng nhập ngay
                </a>
              </Link>
            </div>

            <div className="mt-4 text-center">
              <Link href="/">
                <a className="text-sm text-gray-500 hover:text-gray-700">
                  ← Quay về trang chủ
                </a>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}