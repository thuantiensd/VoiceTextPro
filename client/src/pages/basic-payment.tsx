import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Copy, CreditCard, Clock, CheckCircle, ArrowLeft } from "lucide-react";

export default function BasicPayment() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auth is now handled by ProtectedRoute component
  
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  
  // Get URL params
  const params = new URLSearchParams(window.location.search);
  const plan = params.get("plan") || "pro";
  const billing = params.get("billing") || "monthly";

  // Load payment settings
  const { data: paymentSettings, isLoading } = useQuery({
    queryKey: ["/api/admin/payment-settings"],
  });

  // Set user info when available
  useEffect(() => {
    if (user) {
      setCustomerName(user.fullName || user.username);
      setCustomerEmail(user.email);
    }
  }, [user]);
  
  const getPrice = () => {
    if (!paymentSettings) return 99000;

    if (plan === "pro") {
      return billing === "yearly" ? paymentSettings.proYearlyPrice : paymentSettings.proMonthlyPrice;
    } else {
      return billing === "yearly" ? paymentSettings.premiumYearlyPrice : paymentSettings.premiumMonthlyPrice;
    }
  };

  const price = getPrice();
  const orderId = `VTP${Date.now()}`;
  const formattedPrice = price.toLocaleString("vi-VN");

  // Bank info from settings
  const bankInfo = {
    bankName: paymentSettings?.bankName || "Ngân hàng TMCP Công Thương Việt Nam",
    accountNumber: paymentSettings?.accountNumber || "1234567890123456",
    accountName: paymentSettings?.accountName || "NGUYEN VAN A",
    supportEmail: paymentSettings?.supportEmail || "support@voicetextpro.com",
    supportPhone: paymentSettings?.supportPhone || "0123456789"
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Đã sao chép: ${text}`);
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "#f5f5f5", 
      padding: "20px",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <button 
          onClick={() => window.location.href = "/pricing"}
          style={{
            padding: "10px 20px",
            marginBottom: "20px",
            backgroundColor: "#fff",
            border: "1px solid #ddd",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          ← Quay lại
        </button>

        <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>Thanh toán</h1>
        <p style={{ color: "#666", marginBottom: "30px" }}>
          Gói {selectedPlan.name} - {formattedPrice}
        </p>

        <div style={{
          backgroundColor: "#fff",
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "25px",
          marginBottom: "20px"
        }}>
          <h2 style={{ fontSize: "20px", marginBottom: "20px" }}>💳 Thông tin chuyển khoản</h2>
          
          <div style={{
            backgroundColor: "#e3f2fd",
            padding: "15px",
            borderRadius: "5px",
            marginBottom: "20px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontWeight: "bold", margin: "0" }}>Gói {selectedPlan.name}</p>
                <p style={{ fontSize: "14px", color: "#666", margin: "5px 0 0 0" }}>
                  Mã đơn hàng: {orderId}
                </p>
              </div>
              <span style={{
                backgroundColor: "#1976d2",
                color: "#fff",
                padding: "5px 10px",
                borderRadius: "15px",
                fontSize: "14px"
              }}>
                {formattedPrice}
              </span>
            </div>
          </div>

          <h3 style={{ marginBottom: "15px" }}>Thông tin tài khoản</h3>
          
          <div style={{ display: "grid", gap: "15px" }}>
            <div style={{
              backgroundColor: "#f5f5f5",
              padding: "15px",
              borderRadius: "5px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <p style={{ fontSize: "14px", color: "#666", margin: "0" }}>Ngân hàng</p>
                <p style={{ fontWeight: "bold", margin: "5px 0 0 0" }}>Vietcombank</p>
              </div>
            </div>

            <div style={{
              backgroundColor: "#f5f5f5",
              padding: "15px",
              borderRadius: "5px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <p style={{ fontSize: "14px", color: "#666", margin: "0" }}>Số tài khoản</p>
                <p style={{ fontFamily: "monospace", fontSize: "18px", margin: "5px 0 0 0" }}>1234567890123456</p>
              </div>
              <button 
                onClick={() => copyText("1234567890123456")}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  cursor: "pointer"
                }}
              >
                📋 Copy
              </button>
            </div>

            <div style={{
              backgroundColor: "#f5f5f5",
              padding: "15px",
              borderRadius: "5px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <p style={{ fontSize: "14px", color: "#666", margin: "0" }}>Tên tài khoản</p>
                <p style={{ fontWeight: "bold", margin: "5px 0 0 0" }}>CONG TY VOICETEXT PRO</p>
              </div>
              <button 
                onClick={() => copyText("CONG TY VOICETEXT PRO")}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  cursor: "pointer"
                }}
              >
                📋 Copy
              </button>
            </div>

            <div style={{
              backgroundColor: "#f5f5f5",
              padding: "15px",
              borderRadius: "5px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <p style={{ fontSize: "14px", color: "#666", margin: "0" }}>Số tiền</p>
                <p style={{ fontWeight: "bold", fontSize: "20px", color: "#4caf50", margin: "5px 0 0 0" }}>
                  {formattedPrice}
                </p>
              </div>
              <button 
                onClick={() => copyText(price.toString())}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  cursor: "pointer"
                }}
              >
                📋 Copy
              </button>
            </div>

            <div style={{
              backgroundColor: "#f5f5f5",
              padding: "15px",
              borderRadius: "5px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <p style={{ fontSize: "14px", color: "#666", margin: "0" }}>Nội dung chuyển khoản</p>
                <p style={{ fontFamily: "monospace", margin: "5px 0 0 0" }}>{orderId} VoiceText Pro</p>
              </div>
              <button 
                onClick={() => copyText(`${orderId} VoiceText Pro`)}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  cursor: "pointer"
                }}
              >
                📋 Copy
              </button>
            </div>
          </div>

          <div style={{ textAlign: "center", margin: "30px 0" }}>
            <h3 style={{ marginBottom: "15px" }}>🔲 QR Code chuyển khoản</h3>
            <div style={{
              display: "inline-block",
              padding: "20px",
              backgroundColor: "#fff",
              borderRadius: "8px",
              border: "1px solid #ddd"
            }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`Bank: Vietcombank\nAccount: 1234567890123456\nAmount: ${price}\nContent: ${orderId} VoiceText Pro`)}`}
                alt="QR Code"
                style={{ width: "200px", height: "200px" }}
              />
            </div>
            <p style={{ fontSize: "14px", color: "#666", marginTop: "10px" }}>
              Quét QR bằng app ngân hàng để chuyển khoản
            </p>
          </div>

          <div style={{
            backgroundColor: "#fff3cd",
            border: "1px solid #ffeaa7",
            borderRadius: "5px",
            padding: "15px",
            marginBottom: "20px"
          }}>
            <h4 style={{ color: "#856404", margin: "0 0 10px 0" }}>⚠️ Lưu ý quan trọng:</h4>
            <ul style={{ color: "#856404", fontSize: "14px", paddingLeft: "20px", margin: "0" }}>
              <li>Chuyển khoản đúng số tiền và nội dung</li>
              <li>Sau khi chuyển khoản, admin sẽ xác nhận và kích hoạt gói cho bạn</li>
              <li>Thời gian xử lý: 1-24 giờ trong giờ hành chính</li>
              <li>Bạn sẽ nhận thông báo qua email khi gói được kích hoạt</li>
            </ul>
          </div>

          {!isAuthenticated && (
            <div style={{
              backgroundColor: "#e8f5e8",
              border: "1px solid #c3e6c3",
              borderRadius: "5px",
              padding: "15px",
              marginBottom: "20px"
            }}>
              <h4 style={{ color: "#155724", margin: "0 0 10px 0" }}>👤 Đăng ký tài khoản để sử dụng</h4>
              <p style={{ color: "#155724", fontSize: "14px", margin: "0 0 15px 0" }}>
                Sau khi chuyển khoản thành công, bạn cần tạo tài khoản để sử dụng dịch vụ:
              </p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button 
                  onClick={() => window.location.href = "/register"}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#28a745",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  Đăng ký ngay
                </button>
                <button 
                  onClick={() => window.location.href = "/login"}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#fff",
                    color: "#28a745",
                    border: "2px solid #28a745",
                    borderRadius: "5px",
                    cursor: "pointer"
                  }}
                >
                  Đã có tài khoản
                </button>
              </div>
            </div>
          )}

          <div style={{
            backgroundColor: "#d1ecf1",
            border: "1px solid #bee5eb",
            borderLeftWidth: "4px",
            borderLeftColor: "#17a2b8",
            borderRadius: "5px",
            padding: "15px"
          }}>
            <h4 style={{ color: "#0c5460", margin: "0 0 10px 0" }}>📋 Cách xác nhận thanh toán</h4>
            <div style={{ color: "#0c5460", fontSize: "14px" }}>
              <p style={{ margin: "0 0 10px 0" }}>Sau khi chuyển khoản thành công:</p>
              <ol style={{ paddingLeft: "20px", margin: "0 0 15px 0" }}>
                <li>Chụp ảnh hoá đơn chuyển khoản</li>
                <li>Gửi ảnh kèm mã đơn hàng <strong>{orderId}</strong> qua email hoặc Zalo</li>
                <li>Đăng ký tài khoản (nếu chưa có)</li>
                <li>Admin sẽ xác nhận và kích hoạt gói trong 24h</li>
              </ol>
              <p style={{ margin: "0" }}>
                <strong>Email hỗ trợ:</strong> {bankInfo.supportEmail}<br/>
                <strong>Zalo hỗ trợ:</strong> {bankInfo.supportPhone}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}