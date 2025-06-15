import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./components/theme-provider";
import ProtectedRoute from "@/components/protected-route";
import { AuthProvider } from "@/hooks/useAuth";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import AdminDashboard from "@/pages/admin";
import AdminLogin from "@/pages/admin-login";
import AudioSettings from "@/pages/admin/audio-settings";
import PaymentSettingsAdvanced from "@/pages/admin/payment-settings-advanced";
import GeneralSettings from "@/pages/admin/general-settings";
import AppSettingsAdvanced from "@/pages/admin/app-settings-advanced";
import BannerSettings from "@/pages/admin/banner-settings";
import VoiceSamples from "@/pages/admin/voice-samples";
import SystemMaintenanceAdvanced from "@/pages/admin/system-maintenance-advanced";
import PricingPage from "@/pages/pricing";
import PaymentPage from "@/pages/payment";
import SimplePayment from "@/pages/simple-payment";
import BasicPayment from "@/pages/basic-payment";

import Notifications from "@/pages/notifications";
import Features from "@/pages/features";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Trang chủ - không yêu cầu đăng nhập */}
      <Route path="/">
        <ProtectedRoute requireAuth={false}>
          <Home />
        </ProtectedRoute>
      </Route>

      {/* Trang đăng nhập/đăng ký - không yêu cầu đăng nhập (và redirect nếu đã đăng nhập) */}
      <Route path="/login">
        <ProtectedRoute requireAuth={false}>
          <Login />
        </ProtectedRoute>
      </Route>
      
      <Route path="/register">
        <ProtectedRoute requireAuth={false}>
          <Register />
        </ProtectedRoute>
      </Route>

      {/* Trang admin login - không yêu cầu đăng nhập */}
      <Route path="/admin-login">
        <ProtectedRoute requireAuth={false}>
          <AdminLogin />
        </ProtectedRoute>
      </Route>

      {/* Tất cả các trang khác - yêu cầu đăng nhập */}
      <Route path="/dashboard">
        <ProtectedRoute requireAuth={true}>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin">
        <ProtectedRoute requireAuth={true}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/general-settings">
        <ProtectedRoute requireAuth={true}>
          <GeneralSettings />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/text-settings">
        <ProtectedRoute requireAuth={true}>
          <GeneralSettings />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/audio-settings">
        <ProtectedRoute requireAuth={true}>
          <AudioSettings />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/payment-settings">
        <ProtectedRoute requireAuth={true}>
          <PaymentSettingsAdvanced />
        </ProtectedRoute>
      </Route>
      
      
      <Route path="/admin/app-settings">
        <ProtectedRoute requireAuth={true}>
          <AppSettingsAdvanced />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/banner-settings">
        <ProtectedRoute requireAuth={true}>
          <BannerSettings />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/voice-samples">
        <ProtectedRoute requireAuth={true}>
          <VoiceSamples />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/system-maintenance">
        <ProtectedRoute requireAuth={true}>
          <SystemMaintenanceAdvanced />
        </ProtectedRoute>
      </Route>
      
      <Route path="/pricing">
        <ProtectedRoute requireAuth={false}>
          <PricingPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/payment">
        <ProtectedRoute requireAuth={true}>
          <PaymentPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/payment/plans/:plan/billing/:billing">
        <ProtectedRoute requireAuth={true}>
          <PaymentPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/thanhtoan">
        <ProtectedRoute requireAuth={true}>
          <PaymentPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/payment-basic">
        <ProtectedRoute requireAuth={true}>
          <BasicPayment />
        </ProtectedRoute>
      </Route>
      
      <Route path="/payment-simple">
        <ProtectedRoute requireAuth={true}>
          <SimplePayment />
        </ProtectedRoute>
      </Route>
      
      <Route path="/notifications">
        <ProtectedRoute requireAuth={true}>
          <Notifications />
        </ProtectedRoute>
      </Route>
      
      <Route path="/features">
        <ProtectedRoute requireAuth={false}>
          <Features />
        </ProtectedRoute>
      </Route>
      
      <Route path="/shared/:shareId">
        <ProtectedRoute requireAuth={true}>
          <Home />
        </ProtectedRoute>
      </Route>
      
      <Route>
        <ProtectedRoute requireAuth={true}>
          <NotFound />
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
