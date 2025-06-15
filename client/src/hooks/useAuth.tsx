import React, { createContext, useContext, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasAuthError: boolean;
  logout: () => void;
  isLoggingOut: boolean;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAuthError, setHasAuthError] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      setHasAuthError(false);
      const response = await apiRequest("GET", "/api/auth/me");
      const userData = await response.json();
      setUser(userData);
    } catch (error: any) {
      setHasAuthError(true);
      setUser(null);
      // Don't show error for 401 - it's expected when not logged in
      if (error?.status !== 401) {
        console.error("Auth error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      setUser(null);
      setHasAuthError(false);
      queryClient.clear();
      toast({
        title: "Đăng xuất thành công",
        description: "Hẹn gặp lại bạn!",
      });
      window.location.href = "/";
    },
    onError: () => {
      toast({
        title: "Lỗi đăng xuất",
        description: "Có lỗi xảy ra khi đăng xuất",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    fetchUser();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && !hasAuthError,
    hasAuthError,
    logout: () => logoutMutation.mutate(),
    isLoggingOut: logoutMutation.isPending,
    refetchUser: fetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}