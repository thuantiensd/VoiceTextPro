import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Copy, CreditCard, Clock, CheckCircle, ArrowLeft, Crown, QrCode, Smartphone, Upload, Image, Home } from "lucide-react";

export default function PaymentPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auth is now handled by ProtectedRoute component
  
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [step, setStep] = useState(1); // 1: Tạo đơn, 2: Thanh toán, 3: Upload ảnh
  const [createdPayment, setCreatedPayment] = useState<any>(null);
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Get URL params
  const params = new URLSearchParams(window.location.search);
  const plan = params.get("plan") || "pro";
  const billing = params.get("billing") || "monthly";

  // Load payment settings
  const { data: paymentSettings, isLoading } = useQuery({
    queryKey: ["/api/payment-settings"],
  });

  // Set user info when available
  useEffect(() => {
    if (user) {
      setCustomerName(user.fullName || user.username || "");
      setCustomerEmail(user.email || "");
    }
  }, [user]);

  // Calculate price and generate order ID
  const getPrice = () => {
    if (!paymentSettings) return 99000;

    const settings = paymentSettings as any;
    if (plan === "pro") {
      return billing === "yearly" ? settings.proYearlyPrice : settings.proMonthlyPrice;
    } else {
      return billing === "yearly" ? settings.premiumYearlyPrice : settings.premiumMonthlyPrice;
    }
  };

  const price = getPrice();
  const [orderId] = useState(`VTP${Date.now()}`);
  const formattedPrice = price.toLocaleString("vi-VN");

  const generateQRCode = () => {
    if (!paymentSettings) return;
    
    const settings = paymentSettings as any;
    const bankCode = settings?.bankCode || "ICB"; 
    const accountNumber = settings?.accountNumber || "1234567890123456";
    const accountName = settings?.accountName || "NGUYEN VAN A";
    
    // Tạo QR code theo chuẩn VietQR (format đúng)
    const qrUrl = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact.jpg?amount=${price}&addInfo=${encodeURIComponent(orderId)}&accountName=${encodeURIComponent(accountName)}`;
    
    console.log("QR URL generated:", qrUrl);
    console.log("Payment settings:", settings);
    setQrCodeUrl(qrUrl);
  };

  // Generate QR code when payment info changes
  useEffect(() => {
    if (paymentSettings && price) {
      generateQRCode();
    }
  }, [paymentSettings, price]);

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/payments", data);
      return response.json();
    },
    onSuccess: (data) => {
      setCreatedPayment(data);
      setStep(2);
      toast({
        title: "Đã tạo đơn hàng",
        description: "Thông tin thanh toán đã được gửi. Vui lòng chuyển khoản theo thông tin bên dưới.",
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Không thể tạo đơn hàng. Vui lòng thử lại.";
      toast({
        title: "Lỗi tạo đơn hàng",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Upload receipt mutation
  const uploadReceiptMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/payments/${(createdPayment as any)?.id}/receipt`, {
        method: "POST",
        body: formData,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Upload thành công",
        description: "Ảnh chuyển khoản đã được gửi. Admin sẽ xác nhận trong thời gian sớm nhất.",
      });
      // Chuyển thẳng sang bước hoàn tất
      setTimeout(() => {
        setStep(4);
      }, 500);
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Không thể upload ảnh. Vui lòng thử lại.";
      toast({
        title: "Lỗi upload",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Bank info from settings
  const settings = paymentSettings as any;
  const bankInfo = {
    bankName: settings?.bankName || "Ngân hàng TMCP Công Thương Việt Nam",
    accountNumber: settings?.accountNumber || "1234567890123456",
    accountName: settings?.accountName || "NGUYEN VAN A",
    supportEmail: settings?.supportEmail || "support@voicetextpro.com",
    supportPhone: settings?.supportPhone || "0123456789"
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Đã sao chép",
      description: `${label}: ${text}`,
    });
  };

  const handleCreatePayment = () => {
    if (!customerName.trim() || !customerEmail.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập đầy đủ họ tên và email.",
        variant: "destructive",
      });
      return;
    }

    createPaymentMutation.mutate({
      orderId,
      planType: plan,
      billingCycle: billing,
      amount: price,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      notes: notes.trim(),
      paymentMethod: "bank_transfer",
      bankAccount: bankInfo.accountNumber,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File quá lớn",
          description: "Vui lòng chọn file nhỏ hơn 5MB.",
          variant: "destructive",
        });
        return;
      }
      setReceiptImage(file);
    }
  };

  const handleUploadReceipt = () => {
    if (!receiptImage || !createdPayment) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn ảnh chuyển khoản.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("receipt", receiptImage);
    
    setUploading(true);
    uploadReceiptMutation.mutate(formData, {
      onSettled: () => setUploading(false)
    });
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setCreatedPayment(null);
    setReceiptImage(null);
  };

  const planNames = {
    pro: "Pro",
    premium: "Premium"
  };

  const billingNames = {
    monthly: "Tháng",
    yearly: "Năm"
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Thanh toán</h1>
              <p className="text-muted-foreground">
                Hoàn tất thanh toán để nâng cấp tài khoản
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`rounded-full w-8 h-8 flex items-center justify-center border-2 ${step >= 1 ? 'border-primary bg-primary text-white' : 'border-muted-foreground'}`}>
                  1
                </div>
                <span className="font-medium">Xác nhận đơn hàng</span>
              </div>
              <div className="w-8 h-px bg-border"></div>
              <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`rounded-full w-8 h-8 flex items-center justify-center border-2 ${step >= 2 ? 'border-primary bg-primary text-white' : 'border-muted-foreground'}`}>
                  2
                </div>
                <span className="font-medium">Chuyển khoản</span>
              </div>
              <div className="w-8 h-px bg-border"></div>
              <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`rounded-full w-8 h-8 flex items-center justify-center border-2 ${step >= 3 ? 'border-primary bg-primary text-white' : 'border-muted-foreground'}`}>
                  3
                </div>
                <span className="font-medium">Hoàn tất</span>
              </div>
            </div>
          </div>

          {/* Step 1: Order Confirmation */}
          {step === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {/* Order Info */}
              <div className="lg:col-span-1 xl:col-span-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Thông tin đơn hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {plan === "premium" && <Crown className="h-4 w-4 text-yellow-500" />}
                        <span className="font-medium">
                          Gói {planNames[plan as keyof typeof planNames]} - {billingNames[billing as keyof typeof billingNames]}
                        </span>
                      </div>
                      <Badge variant="secondary">{formattedPrice} VND</Badge>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Mã đơn hàng:</span>
                        <span className="font-mono">{orderId}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Phương thức:</span>
                        <span>Chuyển khoản ngân hàng</span>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Tổng thanh toán:</span>
                      <span className="text-lg text-primary">{formattedPrice} VND</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Thông tin khách hàng</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerName">Họ và tên *</Label>
                      <Input
                        id="customerName"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Nhập họ và tên"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerEmail">Email *</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="Nhập địa chỉ email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Ghi chú (không bắt buộc)</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Thêm ghi chú nếu cần..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-1 xl:col-span-2 flex flex-col justify-center">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-8 text-center space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Sẵn sàng nâng cấp?
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Xác nhận thông tin và tiến hành thanh toán để kích hoạt gói {planNames[plan as keyof typeof planNames]}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Gói dịch vụ</span>
                        <span className="font-medium">{planNames[plan as keyof typeof planNames]}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Chu kỳ thanh toán</span>
                        <span className="font-medium">{billingNames[billing as keyof typeof billingNames]}</span>
                      </div>
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Tổng cộng</span>
                        <span className="text-primary">{formattedPrice} VND</span>
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleCreatePayment}
                      disabled={createPaymentMutation.isPending || !customerName.trim() || !customerEmail.trim()}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                      size="lg"
                    >
                      {createPaymentMutation.isPending ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                          Đang tạo đơn hàng...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Xác nhận đơn hàng
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* QR Code */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <QrCode className="h-5 w-5" />
                      Quét QR để thanh toán
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-4">
                      <div className="bg-white p-3 rounded-lg border inline-block">
                        {qrCodeUrl ? (
                          <img 
                            src={qrCodeUrl} 
                            alt="QR Code thanh toán" 
                            className="w-40 h-40 mx-auto"
                          />
                        ) : (
                          <div className="w-40 h-40 flex items-center justify-center bg-gray-100 rounded">
                            <QrCode className="h-10 w-10 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                        <p className="text-xs text-green-700">
                          <span className="font-medium">Thông tin đã điền sẵn:</span><br/>
                          Số tiền: {formattedPrice} VND | Nội dung: {orderId}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bank Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Thông tin chuyển khoản</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">Ngân hàng:</span>
                        <span className="font-medium text-sm">{bankInfo.bankName}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">STK:</span>
                        <span className="font-mono text-sm">{bankInfo.accountNumber}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">Chủ TK:</span>
                        <span className="font-medium text-sm">{bankInfo.accountName}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-primary/10 rounded">
                        <span className="text-sm">Số tiền:</span>
                        <span className="font-bold text-primary">{formattedPrice} VND</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">Nội dung:</span>
                        <span className="font-mono text-sm">{orderId}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Đã chuyển khoản?</h3>
                  <p className="text-sm text-blue-700 mb-4">
                    Sau khi chuyển khoản thành công, vui lòng upload ảnh chứng từ để admin xác nhận nhanh hơn.
                  </p>
                  <Button onClick={() => setStep(3)} size="lg">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload ảnh chuyển khoản
                  </Button>
                </div>
                <Button variant="outline" onClick={handleBackToStep1}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại bước 1
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Upload Receipt */}
          {step === 3 && (
            <div className="max-w-2xl mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Upload ảnh chuyển khoản
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="receipt-upload"
                    />
                    <label
                      htmlFor="receipt-upload"
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-sm font-medium">Chọn ảnh chuyển khoản</span>
                      <span className="text-xs text-gray-500">PNG, JPG dưới 5MB</span>
                    </label>
                  </div>

                  {receiptImage && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700">
                        <span className="font-medium">Đã chọn:</span> {receiptImage.name}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Button
                      onClick={handleUploadReceipt}
                      disabled={!receiptImage || uploading || uploadReceiptMutation.isPending}
                      className="w-full"
                      size="lg"
                    >
                      {uploading || uploadReceiptMutation.isPending ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                          Đang upload...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Gửi ảnh chuyển khoản
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setStep(2)} className="w-full">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Quay lại
                    </Button>
                  </div>
                </CardContent>
              </Card>


            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="flex justify-center">
              <Card className="w-full max-w-md">
                <CardContent className="p-8 text-center space-y-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Hoàn tất!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Ảnh chuyển khoản đã được gửi. Admin sẽ xác nhận và nâng cấp tài khoản trong thời gian sớm nhất.
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Thời gian xử lý: 1-24 giờ
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Bạn sẽ nhận được email thông báo khi tài khoản được nâng cấp
                    </p>
                  </div>
                  
                  <Button 
                    onClick={() => window.location.href = '/'} 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    size="lg"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Quay về trang chủ
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}