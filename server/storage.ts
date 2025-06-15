import { 
  users, 
  audioFiles, 
  payments,
  paymentSettings,
  appSettings,
  adminNotifications,
  userNotifications,
  socialAccounts,
  type User, 
  type InsertUser, 
  type LoginUser, 
  type AudioFile, 
  type InsertAudioFile, 
  type UpdateAudioFile,
  type Payment,
  type InsertPayment,
  type PaymentSettings,
  type InsertPaymentSettings,
  type UpdatePaymentSettings,
  type AppSettings,
  type UpdateAppSettings,
  type UserNotification,
  type InsertUserNotification,
} from "@shared/schema";
import { createVietnamDate } from "@shared/datetime";
import { db } from "./db";
import { eq, desc, or, ilike, and, isNull, lt } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import bcrypt from "bcrypt";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  authenticateUser(loginData: LoginUser): Promise<User | null>;
  getAllUsers(limit?: number, offset?: number): Promise<User[]>;
  updateUserSubscription(userId: number, subscriptionType: string, expiryDate?: Date): Promise<User | undefined>;
  updateUserRole(userId: number, role: string): Promise<User | undefined>;
  updateUser(userId: number, updateData: any): Promise<User>;
  deleteUser(userId: number): Promise<boolean>;
  
  // Audio file operations
  createAudioFile(audioFile: InsertAudioFile, userId?: number): Promise<AudioFile>;
  getAudioFile(id: number): Promise<AudioFile | undefined>;
  getAudioFiles(userId?: number, limit?: number, offset?: number): Promise<AudioFile[]>;
  getAllAudioFiles(limit?: number, offset?: number): Promise<AudioFile[]>;
  updateAudioFile(id: number, updates: UpdateAudioFile): Promise<AudioFile | undefined>;
  deleteAudioFile(id: number): Promise<boolean>;
  getAudioFileByShareId(shareId: string): Promise<AudioFile | undefined>;
  searchAudioFiles(query: string): Promise<AudioFile[]>;
  cleanupTemporaryFiles(): Promise<void>;

  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(id: number): Promise<Payment | undefined>;
  getAllPayments(limit?: number, offset?: number): Promise<Payment[]>;
  updatePaymentStatus(id: number, status: string, confirmedBy?: number): Promise<Payment | undefined>;
  updatePaymentReceipt(id: number, receiptImageUrl: string): Promise<Payment | undefined>;

  // Payment settings operations
  getPaymentSettings(): Promise<PaymentSettings | undefined>;
  updatePaymentSettings(settings: UpdatePaymentSettings): Promise<PaymentSettings>;

  // App settings operations
  getAppSettings(): Promise<AppSettings | undefined>;
  updateAppSettings(settings: UpdateAppSettings): Promise<AppSettings>;

  // Admin notifications operations
  createNotification(notification: any): Promise<any>;
  getNotifications(limit?: number, offset?: number): Promise<any[]>;
  getUnreadNotifications(): Promise<any[]>;
  markNotificationAsRead(id: number): Promise<any | undefined>;
  markAllNotificationsAsRead(): Promise<void>;

  // User notifications operations
  getUserNotifications(userId: number): Promise<any[]>;
  getUserUnreadNotifications(userId: number): Promise<any[]>;
  getUserUnreadNotificationsCount(userId: number): Promise<number>;
  markUserNotificationAsRead(userId: number, notificationId: number): Promise<any | undefined>;
  markAllUserNotificationsAsRead(userId: number): Promise<void>;
  deleteUserNotification(userId: number, notificationId: number): Promise<boolean>;
  createUserNotification(userId: number, notification: any): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private audioFiles: Map<number, AudioFile>;
  private payments: Map<number, Payment>;
  private paymentSettings: PaymentSettings | null;
  private appSettings: AppSettings | null;
  private notifications: Map<number, any>;
  private userNotifications: Map<number, any[]>; // userId -> notifications[]
  private currentUserId: number;
  private currentAudioId: number;
  private currentPaymentId: number;
  private currentNotificationId: number;

  constructor() {
    this.users = new Map();
    this.audioFiles = new Map();
    this.payments = new Map();
    this.paymentSettings = null;
    this.appSettings = null;
    this.notifications = new Map();
    this.userNotifications = new Map();
    this.currentUserId = 1;
    this.currentAudioId = 1;
    this.currentPaymentId = 1;
    this.currentNotificationId = 1;
    
    // Create default admin user for demo
    this.createDefaultAdmin();
    this.createDefaultPaymentSettings();
    this.createDefaultAppSettings();
    this.createDefaultNotifications();
    this.createDefaultUserNotifications();
  }

  private async createDefaultAdmin() {
    const adminPassword = await bcrypt.hash("admin123", 10);
    const user1Password = await bcrypt.hash("123456", 10);
    const user2Password = await bcrypt.hash("123456", 10);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Admin user
    const adminUser: User = {
      id: 1,
      username: "admin",
      email: "admin@voicetextpro.com",
      password: adminPassword,
      fullName: "System Administrator",
      isActive: true,
      role: "admin",
      subscriptionType: "premium",
      subscriptionExpiry: null,
      totalAudioFiles: 0,
      totalUsageMinutes: 0,
      createdAt: monthAgo,
      updatedAt: now
    };
    
    // Demo user 1 - Free
    const demoUser1: User = {
      id: 2,
      username: "demo_user",
      email: "demo@example.com",
      password: user1Password,
      fullName: "Người dùng Demo",
      isActive: true,
      role: "user",
      subscriptionType: "free",
      subscriptionExpiry: null,
      totalAudioFiles: 5,
      totalUsageMinutes: 120,
      createdAt: weekAgo,
      updatedAt: now
    };
    
    // Demo user 2 - Pro
    const demoUser2: User = {
      id: 3,
      username: "pro_user",
      email: "pro@example.com",
      password: user2Password,
      fullName: "Người dùng Pro",
      isActive: true,
      role: "user",
      subscriptionType: "pro",
      subscriptionExpiry: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      totalAudioFiles: 25,
      totalUsageMinutes: 500,
      createdAt: monthAgo,
      updatedAt: weekAgo
    };
    
    this.users.set(1, adminUser);
    this.users.set(2, demoUser1);
    this.users.set(3, demoUser2);
    this.currentUserId = 4; // Next user will have ID 4
  }

  private createDefaultPaymentSettings() {
    this.paymentSettings = {
      id: 1,
      bankName: "Ngân hàng TMCP Công Thương Việt Nam",
      accountNumber: "1234567890123456",
      accountName: "NGUYEN VAN A",
      qrCodeUrl: null,
      bankCode: "ICB",
      supportEmail: "support@voicetextpro.com",
      supportPhone: "0123456789",
      proMonthlyPrice: 99000,
      proYearlyPrice: 990000,
      premiumMonthlyPrice: 199000,
      premiumYearlyPrice: 1990000,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private createDefaultAppSettings() {
    this.appSettings = {
      id: 1,
      // Free tier
      freeMaxFiles: 5,
      freeMaxCharacters: 500,
      freeVoices: ['vi-VN-HoaiMyNeural', 'vi-VN-NamMinhNeural'],
      
      // Pro tier  
      proMaxFiles: 100,
      proMaxCharacters: 10000,
      proVoices: ['all'],
      
      // Premium tier
      premiumMaxFiles: 1000,
      premiumMaxCharacters: 50000,
      premiumVoices: ['all'],
      
      // Guest access
      enableGuestAccess: true,
      guestMaxCharacters: 100,
      guestVoices: ['vi-VN-HoaiMyNeural'],
      
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private createDefaultNotifications() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    // Thông báo thanh toán mới
    this.notifications.set(1, {
      id: 1,
      title: "Thanh toán mới cần xử lý",
      message: "Có 1 thanh toán mới chờ xác nhận từ khách hàng. Mã đơn: VTP1748921391046",
      type: "payment",
      isRead: false,
      createdAt: oneHourAgo,
      actionUrl: "/admin?tab=payments"
    });

    // Thông báo người dùng đăng ký
    this.notifications.set(2, {
      id: 2,
      title: "Người dùng mới đăng ký",
      message: "Người dùng 'testuser2' vừa tạo tài khoản thành công",
      type: "user",
      isRead: false,
      createdAt: threeHoursAgo,
      actionUrl: "/admin?tab=users"
    });

    // Thông báo nâng cấp gói
    this.notifications.set(3, {
      id: 3,
      title: "Nâng cấp gói dịch vụ",
      message: "Người dùng 'testuser2' đã nâng cấp từ gói Free lên gói Pro",
      type: "payment",
      isRead: false,
      createdAt: threeHoursAgo,
      actionUrl: "/admin?tab=users"
    });

    // Thông báo hệ thống
    this.notifications.set(4, {
      id: 4,
      title: "Cập nhật hệ thống",
      message: "Hệ thống đã được cập nhật phiên bản mới với tính năng quản lý thông báo",
      type: "system",
      isRead: true,
      createdAt: twoDaysAgo,
      actionUrl: "/admin?tab=overview"
    });

    // Thông báo cảnh báo dung lượng
    this.notifications.set(5, {
      id: 5,
      title: "Cảnh báo dung lượng",
      message: "Dung lượng lưu trữ âm thanh đã sử dụng 85%. Cần kiểm tra và dọn dẹp",
      type: "system",
      isRead: false,
      createdAt: yesterday,
      actionUrl: "/admin?tab=audio"
    });

    // Thông báo người dùng tạo file âm thanh
    this.notifications.set(6, {
      id: 6,
      title: "File âm thanh mới",
      message: "Người dùng 'testuser' đã tạo file âm thanh 'Bài thuyết trình công ty'",
      type: "user",
      isRead: true,
      createdAt: yesterday,
      actionUrl: "/admin?tab=audio"
    });

    // Thông báo lỗi hệ thống
    this.notifications.set(7, {
      id: 7,
      title: "Lỗi API FPT",
      message: "API FPT đã gặp lỗi 3 lần trong 1 giờ qua. Cần kiểm tra kết nối",
      type: "system",
      isRead: false,
      createdAt: now,
      actionUrl: "/admin?tab=overview"
    });

    this.currentNotificationId = 8;
  }

  private createDefaultUserNotifications() {
    // Tạo thông báo demo cho demo users (id 2, 3)
    const userNotifications = [
      {
        id: this.currentNotificationId++,
        userId: 2,
        title: "Chào mừng bạn đến với VoiceText Pro!",
        message: "Tài khoản của bạn đã được tạo thành công. Hãy khám phá các tính năng tuyệt vời của chúng tôi.",
        type: "info",
        isRead: false,
        createdAt: new Date(),
        priority: "normal"
      },
      {
        id: this.currentNotificationId++,
        userId: 2,
        title: "Nâng cấp gói Pro để sử dụng nhiều tính năng hơn",
        message: "Nâng cấp lên gói Pro để có thể điều chỉnh pitch, spell check và nhiều tính năng khác.",
        type: "info",
        isRead: false,
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        priority: "normal"
      },
      {
        id: this.currentNotificationId++,
        userId: 3,
        title: "Chào mừng bạn đến với VoiceText Pro!",
        message: "Tài khoản của bạn đã được tạo thành công. Hãy khám phá các tính năng tuyệt vời của chúng tôi.",
        type: "info",
        isRead: true,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        priority: "normal"
      }
    ];

    userNotifications.forEach(notification => {
      const userId = notification.userId;
      const userNotifs = this.userNotifications.get(userId) || [];
      userNotifs.push(notification);
      this.userNotifications.set(userId, userNotifs);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Check if username or email already exists
    for (const user of Array.from(this.users.values())) {
      if (user.username === insertUser.username) {
        throw new Error("Tên đăng nhập đã tồn tại");
      }
      if (user.email === insertUser.email) {
        throw new Error("Email đã được sử dụng");
      }
    }

    const id = this.currentUserId++;
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const now = new Date();
    
    const user: User = { 
      ...insertUser, 
      id,
      password: hashedPassword,
      fullName: insertUser.fullName || null,
      isActive: true,
      role: "user",
      subscriptionType: "free",
      subscriptionExpiry: null,
      totalAudioFiles: 0,
      totalUsageMinutes: 0,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of Array.from(this.users.values())) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  async authenticateUser(loginData: LoginUser): Promise<User | null> {
    const user = await this.getUserByUsername(loginData.username);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async createAudioFile(insertAudioFile: InsertAudioFile, userId?: number): Promise<AudioFile> {
    const id = this.currentAudioId++;
    const shareId = nanoid(10);
    const isTemporary = !userId; // If no user, it's temporary
    
    const audioFile: AudioFile = {
      id,
      userId: userId || null,
      title: insertAudioFile.title,
      content: insertAudioFile.content,
      voice: insertAudioFile.voice,
      speed: insertAudioFile.speed,
      pitch: insertAudioFile.pitch,
      volume: insertAudioFile.volume,
      format: insertAudioFile.format,
      duration: insertAudioFile.duration,
      fileSize: insertAudioFile.fileSize,
      filePath: null,
      shareId,
      isPublic: insertAudioFile.isPublic,
      isTemporary,
      createdAt: new Date(),
    };
    this.audioFiles.set(id, audioFile);
    return audioFile;
  }

  async getAudioFile(id: number): Promise<AudioFile | undefined> {
    return this.audioFiles.get(id);
  }

  async getAudioFiles(userId?: number, limit = 50, offset = 0): Promise<AudioFile[]> {
    let files = Array.from(this.audioFiles.values());
    
    // Filter by user if userId is provided
    if (userId !== undefined) {
      files = files.filter(file => file.userId === userId);
    }
    
    return files
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  async updateAudioFile(id: number, updates: UpdateAudioFile): Promise<AudioFile | undefined> {
    const existing = this.audioFiles.get(id);
    if (!existing) return undefined;
    
    const updated: AudioFile = { ...existing, ...updates };
    this.audioFiles.set(id, updated);
    return updated;
  }

  async deleteAudioFile(id: number): Promise<boolean> {
    return this.audioFiles.delete(id);
  }

  async getAudioFileByShareId(shareId: string): Promise<AudioFile | undefined> {
    return Array.from(this.audioFiles.values()).find(
      (file) => file.shareId === shareId
    );
  }

  async searchAudioFiles(query: string): Promise<AudioFile[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.audioFiles.values()).filter(
      (file) =>
        file.title.toLowerCase().includes(lowerQuery) ||
        file.content.toLowerCase().includes(lowerQuery) ||
        file.voice.toLowerCase().includes(lowerQuery)
    );
  }

  async getAllAudioFiles(limit = 50, offset = 0): Promise<AudioFile[]> {
    const files = Array.from(this.audioFiles.values());
    
    return files
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  async cleanupTemporaryFiles(): Promise<void> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
    
    for (const [id, file] of Array.from(this.audioFiles.entries())) {
      if (file.isTemporary && file.createdAt < oneHourAgo) {
        this.audioFiles.delete(id);
      }
    }
  }

  async getAllUsers(limit = 50, offset = 0): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  async updateUserSubscription(userId: number, subscriptionType: string, expiryDate?: Date): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      subscriptionType,
      subscriptionExpiry: expiryDate || null,
      updatedAt: new Date()
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserRole(userId: number, role: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      role,
      updatedAt: new Date()
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async deleteUser(userId: number): Promise<boolean> {
    return this.users.delete(userId);
  }

  // Payment operations
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const payment: Payment = {
      id: this.currentPaymentId++,
      ...insertPayment,
      createdAt: new Date(),
    };
    this.payments.set(payment.id, payment);
    return payment;
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getAllPayments(limit = 50, offset = 0): Promise<Payment[]> {
    return Array.from(this.payments.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  async updatePaymentStatus(id: number, status: string, confirmedBy?: number): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;

    const updatedPayment: Payment = {
      ...payment,
      status,
      confirmedBy: confirmedBy || payment.confirmedBy,
      confirmedAt: status === "confirmed" ? new Date() : payment.confirmedAt,
    };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  async updatePaymentReceipt(id: number, receiptImageUrl: string): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;

    const updatedPayment: Payment = {
      ...payment,
      receiptImageUrl,
    };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  // Payment settings operations
  async getPaymentSettings(): Promise<PaymentSettings | undefined> {
    return this.paymentSettings || undefined;
  }

  async updatePaymentSettings(settings: UpdatePaymentSettings): Promise<PaymentSettings> {
    if (!this.paymentSettings) {
      this.createDefaultPaymentSettings();
    }
    
    this.paymentSettings = {
      ...this.paymentSettings!,
      ...settings,
      updatedAt: new Date(),
    };
    
    return this.paymentSettings;
  }

  // App settings operations
  async getAppSettings(): Promise<AppSettings | undefined> {
    if (!this.appSettings) {
      this.createDefaultAppSettings();
    }
    return this.appSettings || undefined;
  }

  async updateAppSettings(settings: UpdateAppSettings): Promise<AppSettings> {
    if (!this.appSettings) {
      this.createDefaultAppSettings();
    }
    
    this.appSettings = {
      ...this.appSettings!,
      ...settings,
      updatedAt: new Date(),
    };
    
    return this.appSettings;
  }

  // Notification operations
  async createNotification(notification: any): Promise<any> {
    const newNotification = {
      id: this.currentNotificationId++,
      ...notification,
      createdAt: new Date(),
    };
    this.notifications.set(newNotification.id, newNotification);
    return newNotification;
  }

  async getNotifications(limit = 50, offset = 0): Promise<any[]> {
    const notifications = Array.from(this.notifications.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit);
    return notifications;
  }

  async getUnreadNotifications(): Promise<any[]> {
    return Array.from(this.notifications.values())
      .filter(notification => !notification.isRead)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async markNotificationAsRead(id: number): Promise<any | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;

    const updatedNotification = { ...notification, isRead: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async markAllNotificationsAsRead(): Promise<void> {
    for (const [id, notification] of this.notifications.entries()) {
      this.notifications.set(id, { ...notification, isRead: true });
    }
  }

  async clearAllNotifications(): Promise<void> {
    this.notifications.clear();
  }

  async updateUser(userId: number, updateData: any): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    
    const updatedUser = { ...user, ...updateData };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // User notification methods
  async getUserNotifications(userId: number): Promise<any[]> {
    const userNotifs = this.userNotifications.get(userId) || [];
    return userNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getUserUnreadNotifications(userId: number): Promise<any[]> {
    const userNotifs = this.userNotifications.get(userId) || [];
    return userNotifs.filter(n => !n.isRead);
  }

  async getUserUnreadNotificationsCount(userId: number): Promise<number> {
    const userNotifs = this.userNotifications.get(userId) || [];
    return userNotifs.filter(n => !n.isRead).length;
  }

  async markUserNotificationAsRead(userId: number, notificationId: number): Promise<any | undefined> {
    const userNotifs = this.userNotifications.get(userId) || [];
    const notificationIndex = userNotifs.findIndex(n => n.id === notificationId);
    
    if (notificationIndex === -1) return undefined;
    
    userNotifs[notificationIndex] = { ...userNotifs[notificationIndex], isRead: true };
    this.userNotifications.set(userId, userNotifs);
    return userNotifs[notificationIndex];
  }

  async markAllUserNotificationsAsRead(userId: number): Promise<void> {
    const userNotifs = this.userNotifications.get(userId) || [];
    const updatedNotifs = userNotifs.map(n => ({ ...n, isRead: true }));
    this.userNotifications.set(userId, updatedNotifs);
  }

  async deleteUserNotification(userId: number, notificationId: number): Promise<boolean> {
    const userNotifs = this.userNotifications.get(userId) || [];
    const filteredNotifs = userNotifs.filter(n => n.id !== notificationId);
    
    if (filteredNotifs.length === userNotifs.length) return false;
    
    this.userNotifications.set(userId, filteredNotifs);
    return true;
  }

  async createUserNotification(userId: number, notification: any): Promise<any> {
    const userNotifs = this.userNotifications.get(userId) || [];
    const newNotification = {
      id: this.currentNotificationId++,
      userId,
      ...notification,
      isRead: false,
      createdAt: new Date()
    };
    
    userNotifs.push(newNotification);
    this.userNotifications.set(userId, userNotifs);
    return newNotification;
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    
    const [user] = await db.insert(users).values({
      username: insertUser.username,
      email: insertUser.email,
      password: hashedPassword,
      fullName: insertUser.fullName,
      role: insertUser.role,
      subscriptionType: insertUser.subscriptionType,
      preferredVoice: 'vi-VN-HoaiMyNeural',
      preferredSpeed: 1.0,
      preferredPitch: 1.0,
      preferredVolume: 1.0,
      preferredFormat: 'mp3',
      isActive: true,
      totalAudioFiles: 0,
      totalUsageMinutes: 0,
      totalCharactersUsed: 0,
      lastLoginAt: null,
      loginCount: 0
    }).returning();
    return user;
  }

  async authenticateUser(loginData: LoginUser): Promise<User | null> {
    const user = await this.getUserByUsername(loginData.username);
    if (!user) return null;

    const isValidPassword = await bcrypt.compare(loginData.password, user.password);
    if (!isValidPassword) return null;

    return user;
  }

  async getAllUsers(limit = 50, offset = 0): Promise<User[]> {
    return await db.select().from(users).limit(limit).offset(offset);
  }

  async updateUserSubscription(userId: number, subscriptionType: string, expiryDate?: Date): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ 
        subscriptionType,
        subscriptionExpiry: expiryDate || null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserRole(userId: number, role: string): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ 
        role,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUser(userId: number, updateData: any): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser) {
      throw new Error("Người dùng không tồn tại");
    }
    
    return updatedUser;
  }

  async deleteUser(userId: number): Promise<boolean> {
    try {
      // Start a transaction to ensure all deletions succeed or fail together
      await db.transaction(async (tx) => {
        // 1. Delete social accounts first
        await tx.delete(socialAccounts).where(eq(socialAccounts.userId, userId));
        
        // 2. Delete user's audio files
        await tx.delete(audioFiles).where(eq(audioFiles.userId, userId));
        
        // 3. Delete user's payment records
        await tx.delete(payments).where(eq(payments.userId, userId));
        
        // 4. Delete user notifications
        await tx.delete(userNotifications).where(eq(userNotifications.userId, userId));
        
        // 5. Finally delete the user
        await tx.delete(users).where(eq(users.id, userId));
      });
      
      return true;
    } catch (error) {
      console.error('Delete user error:', error);
      return false;
    }
  }

  // Audio file operations
  async createAudioFile(insertAudioFile: InsertAudioFile, userId?: number): Promise<AudioFile> {
    const [audioFile] = await db.insert(audioFiles).values({
      ...insertAudioFile,
      userId: userId || insertAudioFile.userId,
      ssmlContent: insertAudioFile.ssmlContent || null,
      quality: insertAudioFile.quality || 'standard',
      playCount: 0,
      tags: insertAudioFile.tags || null
    }).returning();
    return audioFile;
  }

  async getAudioFile(id: number): Promise<AudioFile | undefined> {
    const [audioFile] = await db.select().from(audioFiles).where(eq(audioFiles.id, id));
    return audioFile;
  }

  async getAudioFiles(userId?: number, limit = 50, offset = 0): Promise<AudioFile[]> {
    const query = db.select().from(audioFiles);
    if (userId) {
      query.where(eq(audioFiles.userId, userId));
    }
    return await query.limit(limit).offset(offset).orderBy(desc(audioFiles.createdAt));
  }

  async getAllAudioFiles(limit = 50, offset = 0): Promise<AudioFile[]> {
    return await db
      .select()
      .from(audioFiles)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(audioFiles.createdAt));
  }

  async updateAudioFile(id: number, updates: UpdateAudioFile): Promise<AudioFile | undefined> {
    const [audioFile] = await db.update(audioFiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(audioFiles.id, id))
      .returning();
    return audioFile;
  }

  async deleteAudioFile(id: number): Promise<boolean> {
    const result = await db.delete(audioFiles).where(eq(audioFiles.id, id));
    return result.rowCount > 0;
  }

  async getAudioFileByShareId(shareId: string): Promise<AudioFile | undefined> {
    const [audioFile] = await db.select().from(audioFiles).where(eq(audioFiles.shareId, shareId));
    return audioFile;
  }

  async searchAudioFiles(query: string): Promise<AudioFile[]> {
    return await db.select().from(audioFiles)
      .where(or(
        ilike(audioFiles.title, `%${query}%`),
        ilike(audioFiles.content, `%${query}%`)
      ));
  }

  async cleanupTemporaryFiles(): Promise<void> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await db.delete(audioFiles)
      .where(and(
        isNull(audioFiles.userId),
        lt(audioFiles.createdAt, sevenDaysAgo)
      ));
  }

  // Payment operations
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values({
      ...insertPayment,
      confirmedBy: insertPayment.confirmedBy || null,
      confirmedAt: insertPayment.confirmedAt || null
    }).returning();
    return payment;
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async getAllPayments(limit = 50, offset = 0): Promise<Payment[]> {
    return await db.select().from(payments).limit(limit).offset(offset).orderBy(desc(payments.createdAt));
  }

  async updatePaymentStatus(id: number, status: string, confirmedBy?: number): Promise<Payment | undefined> {
    const [payment] = await db.update(payments)
      .set({ 
        status,
        confirmedBy: confirmedBy || null,
        confirmedAt: status === 'completed' ? new Date() : null
      })
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }

  async updatePaymentReceipt(id: number, receiptImageUrl: string): Promise<Payment | undefined> {
    const [payment] = await db.update(payments)
      .set({ receiptImageUrl })
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }

  // Payment settings operations
  async getPaymentSettings(): Promise<PaymentSettings | undefined> {
    const [settings] = await db.select().from(paymentSettings).limit(1);
    return settings;
  }

  async updatePaymentSettings(updates: UpdatePaymentSettings): Promise<PaymentSettings> {
    const existing = await this.getPaymentSettings();
    if (existing) {
      const [settings] = await db.update(paymentSettings)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(paymentSettings.id, existing.id))
        .returning();
      return settings;
    } else {
      const [settings] = await db.insert(paymentSettings)
        .values(updates as InsertPaymentSettings)
        .returning();
      return settings;
    }
  }

  // App settings operations
  async getAppSettings(): Promise<AppSettings | undefined> {
    const [settings] = await db.select().from(appSettings).limit(1);
    return settings;
  }

  async updateAppSettings(updates: UpdateAppSettings): Promise<AppSettings> {
    const existing = await this.getAppSettings();
    if (existing) {
      const [settings] = await db.update(appSettings)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(appSettings.id, existing.id))
        .returning();
      return settings;
    } else {
      const [settings] = await db.insert(appSettings)
        .values(updates as any)
        .returning();
      return settings;
    }
  }

  // Admin notifications operations
  async createNotification(notification: any): Promise<any> {
    const [newNotification] = await db.insert(adminNotifications)
      .values({
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || null,
        priority: notification.priority || 'normal',
        isRead: false,
        createdAt: new Date()
      })
      .returning();
    return newNotification;
  }

  async getNotifications(limit = 50, offset = 0): Promise<any[]> {
    return await db.select().from(adminNotifications)
      .orderBy(desc(adminNotifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getUnreadNotifications(): Promise<any[]> {
    return await db.select().from(adminNotifications)
      .where(eq(adminNotifications.isRead, false))
      .orderBy(desc(adminNotifications.createdAt));
  }

  async markNotificationAsRead(id: number): Promise<any | undefined> {
    const [notification] = await db.update(adminNotifications)
      .set({ 
        isRead: true,
        readAt: new Date()
      })
      .where(eq(adminNotifications.id, id))
      .returning();
    return notification;
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await db.update(adminNotifications)
      .set({ 
        isRead: true,
        readAt: new Date()
      })
      .where(eq(adminNotifications.isRead, false));
  }

  async clearAllNotifications(): Promise<void> {
    await db.delete(adminNotifications);
  }

  // User notification methods (database implementations)
  async getUserNotifications(userId: number): Promise<any[]> {
    return await db.select().from(userNotifications)
      .where(eq(userNotifications.userId, userId))
      .orderBy(desc(userNotifications.createdAt));
  }

  async getUserUnreadNotifications(userId: number): Promise<any[]> {
    return await db.select().from(userNotifications)
      .where(and(
        eq(userNotifications.userId, userId),
        eq(userNotifications.isRead, false)
      ))
      .orderBy(desc(userNotifications.createdAt));
  }

  async getUserUnreadNotificationsCount(userId: number): Promise<number> {
    const result = await db.select({ count: sql`count(*)` })
      .from(userNotifications)
      .where(and(
        eq(userNotifications.userId, userId),
        eq(userNotifications.isRead, false)
      ));
    return Number(result[0]?.count || 0);
  }

  async markUserNotificationAsRead(userId: number, notificationId: number): Promise<any | undefined> {
    const [notification] = await db.update(userNotifications)
      .set({ isRead: true })
      .where(and(
        eq(userNotifications.id, notificationId),
        eq(userNotifications.userId, userId)
      ))
      .returning();
    return notification;
  }

  async markAllUserNotificationsAsRead(userId: number): Promise<void> {
    await db.update(userNotifications)
      .set({ isRead: true })
      .where(eq(userNotifications.userId, userId));
  }

  async deleteUserNotification(userId: number, notificationId: number): Promise<boolean> {
    const result = await db.delete(userNotifications)
      .where(and(
        eq(userNotifications.id, notificationId),
        eq(userNotifications.userId, userId)
      ));
    return (result.rowCount || 0) > 0;
  }

  async createUserNotification(userId: number, notification: any): Promise<any> {
    const [newNotification] = await db.insert(userNotifications)
      .values({
        userId,
        type: notification.type,
        title: notification.title,
        content: notification.content,
        isRead: false
      })
      .returning();
    return newNotification;
  }
}

export const storage = new DatabaseStorage();
