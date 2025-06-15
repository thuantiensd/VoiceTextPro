import { createNotification } from "../routes/notifications";

// Helper function to create payment notification
export async function createPaymentNotification(userId: number, status: string, amount: number) {
  let title = "";
  let message = "";

  switch (status) {
    case "pending":
      title = "Thanh toán đang chờ xử lý";
      message = `Thanh toán ${amount.toLocaleString()} VND của bạn đang được xử lý.`;
      break;
    case "completed":
      title = "Thanh toán thành công";
      message = `Thanh toán ${amount.toLocaleString()} VND đã được xác nhận.`;
      break;
    case "rejected":
      title = "Thanh toán bị từ chối";
      message = `Thanh toán ${amount.toLocaleString()} VND đã bị từ chối.`;
      break;
  }

  await createNotification({
    userId,
    type: "payment",
    title,
    message,
    metadata: { amount, status }
  });
}

// Helper function to create user notification
export async function createUserNotification(userId: number, action: string, details?: any) {
  let title = "";
  let message = "";

  switch (action) {
    case "account_locked":
      title = "Tài khoản bị khóa";
      message = `Tài khoản của bạn đã bị khóa. Lý do: ${details?.reason || "Vi phạm điều khoản sử dụng"}`;
      break;
    case "account_unlocked":
      title = "Tài khoản được mở khóa";
      message = "Tài khoản của bạn đã được mở khóa và có thể sử dụng bình thường.";
      break;
    case "subscription_expired":
      title = "Gói dịch vụ hết hạn";
      message = "Gói dịch vụ của bạn đã hết hạn. Vui lòng gia hạn để tiếp tục sử dụng các tính năng cao cấp.";
      break;
  }

  await createNotification({
    userId,
    type: "user",
    title,
    message,
    metadata: details
  });
}

// Helper function to create audio notification
export async function createAudioNotification(userId: number, action: string, details: any) {
  let title = "";
  let message = "";

  switch (action) {
    case "conversion_complete":
      title = "Chuyển đổi âm thanh hoàn tất";
      message = `File "${details.fileName}" đã được chuyển đổi thành công.`;
      break;
    case "conversion_failed":
      title = "Chuyển đổi âm thanh thất bại";
      message = `Không thể chuyển đổi file "${details.fileName}". Lỗi: ${details.error}`;
      break;
    case "storage_limit":
      title = "Dung lượng lưu trữ sắp hết";
      message = "Bạn đã sử dụng 90% dung lượng lưu trữ. Vui lòng nâng cấp gói dịch vụ hoặc xóa bớt file.";
      break;
  }

  await createNotification({
    userId,
    type: "audio",
    title,
    message,
    metadata: details
  });
}

// Helper function to create system notification
export async function createSystemNotification(userId: number, action: string, details?: any) {
  let title = "";
  let message = "";

  switch (action) {
    case "maintenance":
      title = "Bảo trì hệ thống";
      message = `Hệ thống sẽ tiến hành bảo trì vào ${details.startTime}. Thời gian dự kiến: ${details.duration}`;
      break;
    case "new_feature":
      title = "Tính năng mới";
      message = `Chúng tôi vừa cập nhật tính năng mới: ${details.featureName}`;
      break;
    case "security":
      title = "Cảnh báo bảo mật";
      message = details.message || "Phát hiện hoạt động đáng ngờ trên tài khoản của bạn.";
      break;
  }

  await createNotification({
    userId,
    type: "system",
    title,
    message,
    metadata: details
  });
} 