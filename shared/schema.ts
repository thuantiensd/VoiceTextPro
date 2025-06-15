import { pgTable, text, serial, integer, boolean, timestamp, real, varchar, jsonb, date, decimal, bigint, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password"),
  fullName: text("full_name"),
  isActive: boolean("is_active").notNull().default(true),
  lockReason: text("lock_reason"), // Lý do khóa tài khoản
  lockedAt: timestamp("locked_at"), // Thời gian khóa
  lockedBy: integer("locked_by"), // ID admin thực hiện khóa
  role: text("role").notNull().default("user"), // user, admin
  subscriptionType: text("subscription_type").notNull().default("free"), // free, pro, premium
  subscriptionExpiry: timestamp("subscription_expiry"),
  totalAudioFiles: integer("total_audio_files").notNull().default(0),
  totalUsageMinutes: integer("total_usage_minutes").notNull().default(0),
  // User preferences
  preferredVoice: text("preferred_voice").default("alloy"),
  preferredSpeed: real("preferred_speed").default(1.0),
  preferredPitch: real("preferred_pitch").default(1.0),
  preferredVolume: real("preferred_volume").default(1.0),
  preferredFormat: text("preferred_format").default("mp3"),
  // OAuth fields
  avatarUrl: text("avatar_url"),
  isEmailVerified: boolean("is_email_verified").default(false),
  // Usage statistics
  totalCharactersUsed: integer("total_characters_used").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Social accounts for OAuth login
export const socialAccounts = pgTable("social_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  provider: text("provider").notNull(), // google, facebook, github
  providerId: text("provider_id").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const audioFiles = pgTable("audio_files", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // null for guests
  title: text("title").notNull(),
  content: text("content").notNull(),
  voice: text("voice").notNull(),
  speed: real("speed").notNull().default(1.0),
  pitch: real("pitch").notNull().default(1.0),
  volume: real("volume").notNull().default(1.0),
  format: text("format").notNull().default("mp3"),
  duration: integer("duration").notNull().default(0), // in seconds
  fileSize: integer("file_size").notNull().default(0), // in bytes
  filePath: text("file_path"),
  shareId: text("share_id").unique(),
  isPublic: boolean("is_public").notNull().default(false),
  isTemporary: boolean("is_temporary").notNull().default(false), // true for guest files
  // Advanced features
  ssmlContent: text("ssml_content"), // SSML version of content
  quality: text("quality").default("standard"), // standard, premium
  playCount: integer("play_count").default(0),
  tags: text("tags"), // comma-separated tags
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Text templates for common use cases
export const textTemplates = pgTable("text_templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // "advertisement", "podcast", "education", "news"
  isPublic: boolean("is_public").default(false),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Playlists for organizing audio files
export const playlists = pgTable("playlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false),
  shareId: text("share_id").unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Junction table for playlist items
export const playlistItems = pgTable("playlist_items", {
  id: serial("id").primaryKey(),
  playlistId: integer("playlist_id").references(() => playlists.id).notNull(),
  audioFileId: integer("audio_file_id").references(() => audioFiles.id).notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Batch processing jobs
export const batchJobs = pgTable("batch_jobs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  totalFiles: integer("total_files").notNull(),
  completedFiles: integer("completed_files").default(0),
  failedFiles: integer("failed_files").default(0),
  settings: text("settings"), // JSON string of voice settings
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  orderId: text("order_id").notNull().unique(),
  planType: text("plan_type").notNull(), // "pro" or "premium"
  billingCycle: text("billing_cycle").notNull(), // "monthly" or "yearly"
  amount: integer("amount").notNull(), // in VND
  status: text("status").notNull().default("pending"), // "pending", "confirmed", "cancelled"
  paymentMethod: text("payment_method").notNull().default("bank_transfer"),
  bankAccount: text("bank_account").default("1234567890123456"),
  customerEmail: text("customer_email"),
  customerName: text("customer_name"),
  notes: text("notes"),
  receiptImageUrl: text("receipt_image_url"), // URL of uploaded receipt image
  confirmedBy: integer("confirmed_by").references(() => users.id),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const paymentSettings = pgTable("payment_settings", {
  id: serial("id").primaryKey(),
  bankName: text("bank_name").notNull().default("Ngân hàng TMCP Công Thương Việt Nam"),
  accountNumber: text("account_number").notNull().default("1234567890123456"),
  accountName: text("account_name").notNull().default("NGUYEN VAN A"),
  qrCodeUrl: text("qr_code_url"),
  bankCode: text("bank_code").notNull().default("ICB"),
  supportEmail: text("support_email").default("support@voicetextpro.com"),
  supportPhone: text("support_phone").default("0123456789"),
  proMonthlyPrice: integer("pro_monthly_price").notNull().default(99000),
  proYearlyPrice: integer("pro_yearly_price").notNull().default(990000),
  premiumMonthlyPrice: integer("premium_monthly_price").notNull().default(199000),
  premiumYearlyPrice: integer("premium_yearly_price").notNull().default(1990000),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// App Settings for managing quotas and limits
export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  
  // Free tier limits
  freeMaxFiles: integer("free_max_files").default(5),
  freeMaxCharacters: integer("free_max_characters").default(500),
  freeVoices: text("free_voices").array().default(['vi-VN-HoaiMyNeural', 'vi-VN-NamMinhNeural']),
  
  // Pro tier limits  
  proMaxFiles: integer("pro_max_files").default(100),
  proMaxCharacters: integer("pro_max_characters").default(10000),
  proVoices: text("pro_voices").array().default(['all']),
  
  // Premium tier limits
  premiumMaxFiles: integer("premium_max_files").default(1000),
  premiumMaxCharacters: integer("premium_max_characters").default(50000),
  premiumVoices: text("premium_voices").array().default(['all']),
  
  // General settings
  enableGuestAccess: boolean("enable_guest_access").default(true),
  guestMaxCharacters: integer("guest_max_characters").default(100),
  guestVoices: text("guest_voices").array().default(['vi-VN-HoaiMyNeural']),
  
  // Banner settings
  enableUpgradeBanner: boolean("enable_upgrade_banner").default(true),
  bannerTitle: text("banner_title").default("Nâng cấp VoiceText Pro"),
  bannerDescription: text("banner_description").default("Tận hưởng không giới hạn ký tự và giọng đọc chất lượng cao"),
  bannerButtonText: text("banner_button_text").default("Nâng cấp ngay"),
});

// User notifications table
export const userNotifications = pgTable("user_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // welcome, upgrade, payment_success, expiry_warning, etc.
  title: text("title").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = z.object({
  username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự").optional(),
  role: z.enum(["user", "admin"]).default("user").optional(),
  subscriptionType: z.enum(["free", "pro", "premium"]).default("free").optional(),
  avatarUrl: z.string().url("Avatar URL không hợp lệ").optional().nullable(),
  isEmailVerified: z.boolean().default(false).optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Vui lòng nhập tên đăng nhập"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export const insertAudioFileSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().min(1, "Content is required").max(5000, "Content too long"),
  voice: z.string().min(1, "Voice is required"),
  speed: z.number().min(0.5).max(2.0),
  pitch: z.number().min(0.5).max(2.0),
  volume: z.number().min(0).max(1),
  format: z.enum(["mp3", "wav", "ogg"]),
  duration: z.number().min(0).default(0),
  fileSize: z.number().min(0).default(0),
  isPublic: z.boolean().default(false),
});

export const updateAudioFileSchema = insertAudioFileSchema.partial();

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  confirmedBy: true,
  confirmedAt: true,
  createdAt: true,
});

// Template schemas
export const insertTextTemplateSchema = createInsertSchema(textTemplates).omit({
  id: true,
  usageCount: true,
  createdAt: true,
});

export const insertPlaylistSchema = createInsertSchema(playlists).omit({
  id: true,
  shareId: true,
  createdAt: true,
});

export const insertBatchJobSchema = createInsertSchema(batchJobs).omit({
  id: true,
  status: true,
  completedFiles: true,
  failedFiles: true,
  createdAt: true,
  completedAt: true,
});

// User preferences schema
export const userPreferencesSchema = z.object({
  preferredVoice: z.string().optional(),
  preferredSpeed: z.number().min(0.5).max(2.0).optional(),
  preferredPitch: z.number().min(0.5).max(2.0).optional(),
  preferredVolume: z.number().min(0).max(1).optional(),
  preferredFormat: z.enum(["mp3", "wav", "ogg"]).optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;
export type User = typeof users.$inferSelect;
export type InsertAudioFile = z.infer<typeof insertAudioFileSchema>;
export type UpdateAudioFile = z.infer<typeof updateAudioFileSchema>;
export type AudioFile = typeof audioFiles.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// New types
export type TextTemplate = typeof textTemplates.$inferSelect;
export type InsertTextTemplate = z.infer<typeof insertTextTemplateSchema>;
export type Playlist = typeof playlists.$inferSelect;
export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type PlaylistItem = typeof playlistItems.$inferSelect;
export type BatchJob = typeof batchJobs.$inferSelect;
export type InsertBatchJob = z.infer<typeof insertBatchJobSchema>;
export type UserPreferences = z.infer<typeof userPreferencesSchema>;

// User notifications schema
export const insertUserNotificationSchema = createInsertSchema(userNotifications).omit({
  id: true,
  createdAt: true,
});

export type UserNotification = typeof userNotifications.$inferSelect;
export type InsertUserNotification = z.infer<typeof insertUserNotificationSchema>;

export const insertPaymentSettingsSchema = createInsertSchema(paymentSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updatePaymentSettingsSchema = insertPaymentSettingsSchema.partial();

export type PaymentSettings = typeof paymentSettings.$inferSelect;
export type InsertPaymentSettings = z.infer<typeof insertPaymentSettingsSchema>;
export type UpdatePaymentSettings = z.infer<typeof updatePaymentSettingsSchema>;

// Analytics và activity logs
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(), // 'create_audio', 'login', 'upgrade', etc.
  details: jsonb("details"), // Additional data about the action
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const systemMetrics = pgTable("system_metrics", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  totalUsers: integer("total_users").default(0),
  activeUsers: integer("active_users").default(0),
  newSignups: integer("new_signups").default(0),
  totalAudioFiles: integer("total_audio_files").default(0),
  audioMinutesGenerated: decimal("audio_minutes_generated", { precision: 10, scale: 2 }).default("0"),
  charactersProcessed: bigint("characters_processed", { mode: "number" }).default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const voiceUsageStats = pgTable("voice_usage_stats", {
  id: serial("id").primaryKey(),
  voiceId: varchar("voice_id", { length: 50 }).notNull(),
  usageCount: integer("usage_count").default(0),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Support system
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // 'bug', 'feature', 'payment', 'general'
  priority: varchar("priority", { length: 20 }).default("medium"), // 'low', 'medium', 'high', 'urgent'
  status: varchar("status", { length: 20 }).default("open"), // 'open', 'in_progress', 'resolved', 'closed'
  assignedTo: integer("assigned_to").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ticketMessages = pgTable("ticket_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => supportTickets.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id),
  message: text("message").notNull(),
  isInternal: boolean("is_internal").default(false), // For admin-only notes
  createdAt: timestamp("created_at").defaultNow(),
});

// Type definitions for new tables
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;
export type SystemMetric = typeof systemMetrics.$inferSelect;
export type InsertSystemMetric = typeof systemMetrics.$inferInsert;
export type VoiceUsageStat = typeof voiceUsageStats.$inferSelect;
export type InsertVoiceUsageStat = typeof voiceUsageStats.$inferInsert;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;
export type TicketMessage = typeof ticketMessages.$inferSelect;
export type InsertTicketMessage = typeof ticketMessages.$inferInsert;

// App Settings types
export type AppSettings = typeof appSettings.$inferSelect;
export type InsertAppSettings = typeof appSettings.$inferInsert;
export type UpdateAppSettings = Partial<InsertAppSettings>;

export const insertAppSettingsSchema = createInsertSchema(appSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateAppSettingsSchema = insertAppSettingsSchema.partial();

// Admin notifications table
export const adminNotifications = pgTable("admin_notifications", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 50 }).notNull(), // 'user_register', 'payment_request', 'system_alert'
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  data: jsonb("data"), // Extra data for the notification
  isRead: boolean("is_read").default(false),
  priority: varchar("priority", { length: 20 }).default("normal"), // 'low', 'normal', 'high', 'urgent'
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
});

export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = typeof adminNotifications.$inferInsert;
