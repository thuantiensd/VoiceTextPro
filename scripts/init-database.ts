import { db } from "../server/db";
import { users, paymentSettings } from "../shared/schema";
import bcrypt from "bcrypt";

async function initDatabase() {
  console.log("🔄 Khởi tạo database...");

  try {
    // Tạo admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await db.insert(users).values({
      username: "admin",
      email: "admin@voicetext.pro",
      password: hashedPassword,
      fullName: "Administrator",
      role: "admin",
      isActive: true,
      subscriptionType: "premium",
      subscriptionExpiry: null,
      totalAudioFiles: 0,
      totalUsageMinutes: 0
    }).onConflictDoNothing();

    // Tạo demo user
    const demoPassword = await bcrypt.hash("demo123", 10);
    await db.insert(users).values({
      username: "demo_user",
      email: "demo@voicetext.pro", 
      password: demoPassword,
      fullName: "Demo User",
      role: "user",
      isActive: true,
      subscriptionType: "free",
      subscriptionExpiry: null,
      totalAudioFiles: 5,
      totalUsageMinutes: 15
    }).onConflictDoNothing();

    // Tạo payment settings
    await db.insert(paymentSettings).values({
      id: 1,
      bankName: "Ngân hàng TMCP Công Thương Việt Nam (VietinBank)",
      accountNumber: "108004320485",
      accountHolder: "NGUYEN VAN A",
      qrCodeUrl: "https://img.vietqr.io/image/970415-108004320485-compact.jpg"
    }).onConflictDoNothing();

    console.log("✅ Database đã được khởi tạo thành công!");
    console.log("🔑 Tài khoản admin: admin/admin123");
    console.log("🔑 Tài khoản demo: demo_user/demo123");

  } catch (error) {
    console.error("❌ Lỗi khởi tạo database:", error);
  }
}

initDatabase().then(() => process.exit(0));