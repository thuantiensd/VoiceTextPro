import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { ArrowLeft, Copy, CheckCircle, Clock, CreditCard, QrCode } from "lucide-react";

export default function BankTransferPage() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    // Get URL parameters
    const params = new URLSearchParams(window.location.search);
    const plan = params.get("plan");
    const billing = params.get("billing") || "monthly";

    if (!plan) {
      setLocation("/pricing");
      return;
    }

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

    // If not authenticated, show login prompt but still display pricing info
    if (!isAuthenticated) {
      const price = selectedPlan[billing as keyof typeof selectedPlan] as number;
      setOrderDetails({
        name: selectedPlan.name,
        billing,
        planId: plan,
        price,
        formattedPrice: new Intl.NumberFormat("vi-VN", {
          style: "currency", 
          currency: "VND"
        }).format(price),
        requiresLogin: true
      });
      setIsLoading(false);
      return;
    }

    // Create bank transfer order via API
    const createOrder = async () => {
      try {
        const response = await apiRequest("POST", "/api/create-bank-order", {
          plan,
          billing
        });
        
        const data = await response.json();
        setOrderDetails({
          name: plan === "pro" ? "Pro" : "Premium",
          billing,
          planId: plan,
          orderId: data.orderId,
          ...data.planDetails,
          bankInfo: data.bankInfo
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error creating bank order:", error);
        // Fallback to offline mode
        const price = selectedPlan[billing as keyof typeof selectedPlan] as number;
        const orderId = `VTP${Date.now()}`;
        setOrderDetails({
          name: selectedPlan.name,
          billing,
          planId: plan,
          price,
          formattedPrice: new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND"
          }).format(price),
          orderId,
          bankInfo: {
            bankName: "Vietcombank",
            accountNumber: "1234567890123456",
            accountName: "CONG TY VOICETEXT PRO",
            branch: "Chi nhánh Hoàn Kiếm, Hà Nội",
            content: `${orderId} VoiceText Pro`
          },
          offline: true
        });
        setIsLoading(false);
      }
    };
    
    createOrder();
  }, [isAuthenticated, setLocation]);



  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast({
      title: "Đã sao chép",
      description: `${label} đã được sao chép vào clipboard`,
    });
    setTimeout(() => setCopied(""), 2000);
  };

  const generateQRCodeUrl = () => {
    if (!orderDetails) return "";
    
    const { bankInfo, price, orderId } = orderDetails;
    // VietQR format for Vietnamese banks
    const qrData = `2|99|${bankInfo.accountNumber}|${bankInfo.accountName}|${price}|${orderId} VoiceText Pro`;
    
    // Using QR code generation service
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
  };

  if (!isAuthenticated && orderDetails?.requiresLogin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Yêu cầu đăng nhập</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Bạn đã chọn gói {orderDetails.name} với giá {orderDetails.formattedPrice}
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Vui lòng đăng nhập để xem thông tin chuyển khoản
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
          <p className="text-gray-600 dark:text-gray-400">Đang tạo thông tin thanh toán...</p>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
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
          <h1 className="text-3xl font-bold">Thanh toán chuyển khoản</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Chuyển khoản ngân hàng để kích hoạt gói {orderDetails.name}
          </p>
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
                  <h3 className="font-medium">Gói {orderDetails.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Thanh toán {orderDetails.billing === "monthly" ? "hàng tháng" : "hàng năm"}
                  </p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  {orderDetails.name}
                </Badge>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Mã đơn hàng:</h4>
                <div className="flex items-center space-x-2">
                  <code className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded text-sm font-mono">
                    {orderDetails.orderId}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(orderDetails.orderId, "Mã đơn hàng")}
                  >
                    {copied === "Mã đơn hàng" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Gói {orderDetails.name}</span>
                  <span>{orderDetails.formattedPrice}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Phí xử lý</span>
                  <span>Miễn phí</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium text-lg">
                  <span>Tổng cộng</span>
                  <span>{orderDetails.formattedPrice}</span>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Gói sẽ được kích hoạt trong 5-10 phút sau khi chuyển khoản thành công
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Bank Transfer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Thông tin chuyển khoản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bank Details */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Ngân hàng</label>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-medium">{orderDetails.bankInfo.bankName}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Số tài khoản</label>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-lg">{orderDetails.bankInfo.accountNumber}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(orderDetails.bankInfo.accountNumber, "Số tài khoản")}
                    >
                      {copied === "Số tài khoản" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Tên tài khoản</label>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-medium">{orderDetails.bankInfo.accountName}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(orderDetails.bankInfo.accountName, "Tên tài khoản")}
                    >
                      {copied === "Tên tài khoản" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Nội dung chuyển khoản</label>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono">{orderDetails.orderId} VoiceText Pro</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(`${orderDetails.orderId} VoiceText Pro`, "Nội dung")}
                    >
                      {copied === "Nội dung" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Số tiền</label>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold text-xl text-green-600">{orderDetails.formattedPrice}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(orderDetails.price.toString(), "Số tiền")}
                    >
                      {copied === "Số tiền" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* QR Code */}
              <div className="text-center">
                <h4 className="font-medium mb-3 flex items-center justify-center">
                  <QrCode className="mr-2 h-4 w-4" />
                  Quét QR để chuyển khoản
                </h4>
                <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
                  <img 
                    src={generateQRCodeUrl()}
                    alt="QR Code chuyển khoản"
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Mở app ngân hàng và quét mã QR để chuyển khoản
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Lưu ý quan trọng:</h5>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Chuyển khoản đúng số tiền và nội dung</li>
                  <li>• Gói sẽ tự động kích hoạt sau 5-10 phút</li>
                  <li>• Liên hệ hỗ trợ nếu không nhận được xác nhận</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}