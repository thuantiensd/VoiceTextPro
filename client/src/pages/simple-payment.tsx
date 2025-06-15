import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Copy, CheckCircle, QrCode, CreditCard, AlertCircle } from "lucide-react";

export default function SimplePayment() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Auth is now handled by ProtectedRoute component
  const [planInfo, setPlanInfo] = useState<any>(null);
  const [copied, setCopied] = useState("");
  const [orderCreated, setOrderCreated] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get("plan");
    const billing = params.get("billing") || "monthly";

    const plans = {
      pro: { name: "Pro", monthly: 99000, yearly: 990000 },
      premium: { name: "Premium", monthly: 199000, yearly: 1990000 }
    };

    const selectedPlan = plans[plan as keyof typeof plans] || plans.pro;
    const price = selectedPlan[billing as keyof typeof selectedPlan] as number;
    const orderId = `VTP${Date.now()}`;

    setPlanInfo({
      name: selectedPlan.name,
      billing,
      price,
      orderId,
      formattedPrice: new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND"
      }).format(price)
    });
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast({
      title: "Đã sao chép",
      description: `${label} đã được sao chép`,
    });
    setTimeout(() => setCopied(""), 2000);
  };

  if (!planInfo) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <Button variant="ghost" className="mb-4" onClick={() => setLocation("/pricing")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
          <h1 className="text-3xl font-bold mb-2">Thanh toán</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gói {planInfo.name} - {planInfo.formattedPrice}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Thông tin chuyển khoản
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Gói {planInfo.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Mã đơn hàng: {planInfo.orderId}
                  </p>
                </div>
                <Badge className="bg-blue-600 text-white">{planInfo.formattedPrice}</Badge>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Thông tin tài khoản</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Ngân hàng</p>
                    <p className="font-medium">Vietcombank</p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Số tài khoản</p>
                    <p className="font-mono text-lg">1234567890123456</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard("1234567890123456", "Số tài khoản")}
                  >
                    {copied === "Số tài khoản" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tên tài khoản</p>
                    <p className="font-medium">CONG TY VOICETEXT PRO</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard("CONG TY VOICETEXT PRO", "Tên tài khoản")}
                  >
                    {copied === "Tên tài khoản" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Số tiền</p>
                    <p className="font-bold text-xl text-green-600">{planInfo.formattedPrice}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(planInfo.price.toString(), "Số tiền")}
                  >
                    {copied === "Số tiền" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Nội dung chuyển khoản</p>
                    <p className="font-mono">{planInfo.orderId} VoiceText Pro</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(`${planInfo.orderId} VoiceText Pro`, "Nội dung")}
                  >
                    {copied === "Nội dung" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="text-center">
              <h3 className="font-semibold mb-3 flex items-center justify-center">
                <QrCode className="mr-2 h-4 w-4" />
                QR Code chuyển khoản
              </h3>
              <div className="inline-block p-4 bg-white rounded-lg">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`Bank: Vietcombank\nAccount: 1234567890123456\nAmount: ${planInfo.price}\nContent: ${planInfo.orderId} VoiceText Pro`)}`}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Quét QR bằng app ngân hàng để chuyển khoản
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Lưu ý quan trọng:
              </h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• Chuyển khoản đúng số tiền và nội dung</li>
                <li>• Sau khi chuyển khoản, admin sẽ xác nhận và kích hoạt gói cho bạn</li>
                <li>• Thời gian xử lý: 1-24 giờ trong giờ hành chính</li>
                <li>• Bạn sẽ nhận thông báo qua email khi gói được kích hoạt</li>
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border-l-4 border-blue-400">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                    Cách xác nhận thanh toán
                  </h4>
                  <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                    <p>Sau khi chuyển khoản thành công:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-4">
                      <li>Chụp ảnh hoá đơn chuyển khoản</li>
                      <li>Gửi ảnh kèm mã đơn hàng <strong>{planInfo.orderId}</strong> qua email hoặc Zalo</li>
                      <li>Admin sẽ xác nhận và kích hoạt gói trong 24h</li>
                    </ol>
                    <p className="mt-3">
                      <strong>Email hỗ trợ:</strong> support@voicetextpro.com<br/>
                      <strong>Zalo hỗ trợ:</strong> 0123456789
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}