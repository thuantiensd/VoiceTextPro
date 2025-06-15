import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { ArrowLeft, Lock, Shield, Check } from "lucide-react";

// Demo Stripe public key (test mode)
const stripePromise = loadStripe("pk_test_51234567890abcdef");

interface CheckoutFormProps {
  planDetails: any;
  clientSecret: string;
}

function CheckoutForm({ planDetails, clientSecret }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
    });

    if (error) {
      toast({
        title: "Thanh toán thất bại",
        description: error.message || "Có lỗi xảy ra trong quá trình thanh toán",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Thanh toán thành công",
        description: "Gói dịch vụ của bạn đã được kích hoạt!",
      });
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="font-medium mb-2">Thông tin thanh toán</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
          <Lock className="h-4 w-4" />
          <span>Thông tin của bạn được bảo mật bằng mã hóa SSL</span>
        </div>
        <PaymentElement />
      </div>

      <Button
        type="submit"
        className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            <span>Đang xử lý...</span>
          </div>
        ) : (
          `Thanh toán ${planDetails.formattedPrice}`
        )}
      </Button>

      <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <Shield className="h-3 w-3" />
          <span>Bảo mật SSL</span>
        </div>
        <span>•</span>
        <span>Được hỗ trợ bởi Stripe</span>
      </div>
    </form>
  );
}

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [clientSecret, setClientSecret] = useState("");
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get URL parameters
    const params = new URLSearchParams(window.location.search);
    const plan = params.get("plan");
    const billing = params.get("billing") || "monthly";

    // Plan details
    const plans = {
      pro: {
        name: "Pro",
        monthly: 99000,
        yearly: 990000,
        features: ["100 file audio/tháng", "Tất cả giọng nói premium", "Lưu trữ vĩnh viễn"]
      },
      premium: {
        name: "Premium", 
        monthly: 199000,
        yearly: 1990000,
        features: ["Unlimited file audio", "AI voices", "API access", "Hỗ trợ 24/7"]
      }
    };

    const selectedPlan = plans[plan as keyof typeof plans];
    if (!selectedPlan) {
      setLocation("/pricing");
      return;
    }

    const price = selectedPlan[billing as keyof typeof selectedPlan] as number;
    const formattedPrice = new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(price);

    const details = {
      ...selectedPlan,
      billing,
      price,
      formattedPrice,
      planId: plan
    };

    setPlanDetails(details);

    // Create payment intent (demo)
    createPaymentIntent(details);
  }, [isAuthenticated, setLocation]);

  const createPaymentIntent = async (details: any) => {
    try {
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        plan: details.planId,
        billing: details.billing
      });
      
      const data = await response.json();
      setClientSecret(data.clientSecret);
      
      // Update plan details with server response
      setPlanDetails({
        ...details,
        ...data.planDetails,
        isDemo: data.demo || false
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error creating payment intent:", error);
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Yêu cầu đăng nhập</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Bạn cần đăng nhập để thực hiện thanh toán
            </p>
            <div className="space-y-3">
              <Button className="w-full" asChild>
                <Link href="/login">Đăng nhập</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/register">Tạo tài khoản mới</Link>
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setLocation("/pricing")}>
                Quay lại trang giá
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Đang tải thông tin thanh toán...</p>
        </div>
      </div>
    );
  }

  if (!planDetails || !clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600">Có lỗi xảy ra. Vui lòng thử lại.</p>
            <Button className="mt-4" onClick={() => setLocation("/pricing")}>
              Quay lại trang giá
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/pricing")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại trang giá
          </Button>
          <h1 className="text-3xl font-bold">Thanh toán</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Hoàn tất thanh toán để kích hoạt gói {planDetails.name}
          </p>
          {planDetails?.isDemo && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Đang trong chế độ demo - không có giao dịch thật nào được thực hiện
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Gói {planDetails.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Thanh toán {planDetails.billing === "monthly" ? "hàng tháng" : "hàng năm"}
                  </p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  {planDetails.name}
                </Badge>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Tính năng bao gồm:</h4>
                <ul className="space-y-1">
                  {planDetails.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Gói {planDetails.name}</span>
                  <span>{planDetails.formattedPrice}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Thuế VAT (10%)</span>
                  <span>{new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND"
                  }).format(planDetails.price * 0.1)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium text-lg">
                  <span>Tổng cộng</span>
                  <span>{new Intl.NumberFormat("vi-VN", {
                    style: "currency", 
                    currency: "VND"
                  }).format(planDetails.price * 1.1)}</span>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                  <strong>🚀 Demo Mode:</strong> Đây là môi trường test
                </p>
                <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <p>• Thẻ test: <span className="font-mono">4242 4242 4242 4242</span></p>
                  <p>• MM/YY: <span className="font-mono">12/34</span> | CVC: <span className="font-mono">123</span></p>
                  <p>• Không có tiền thật bị trừ</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Phương thức thanh toán</CardTitle>
            </CardHeader>
            <CardContent>
              {clientSecret && (
                <Elements 
                  stripe={stripePromise} 
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#3b82f6',
                      },
                    },
                  }}
                >
                  <CheckoutForm planDetails={planDetails} clientSecret={clientSecret} />
                </Elements>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}