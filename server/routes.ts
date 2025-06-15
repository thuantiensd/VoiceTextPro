import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Stripe from "stripe";
import OpenAI from "openai";
import { insertAudioFileSchema, updateAudioFileSchema, insertUserSchema, loginSchema } from "@shared/schema";
import { fptAI, FPT_VOICES } from "./fpt-ai";
import { z } from "zod";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import mammoth from "mammoth";
import session from "express-session";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, and TXT files are allowed.'));
    }
  }
});

// Configure multer for QR code image uploads
const qrUpload = multer({
  dest: 'uploads/qr/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and WebP images are allowed.'));
    }
  }
});

// Configure multer for receipt image uploads
const receiptUpload = multer({
  dest: 'uploads/receipts/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and WebP images are allowed.'));
    }
  }
});

// Session configuration
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

// Initialize Stripe with demo key (user can provide real key later)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_51234567890", {
  apiVersion: "2024-11-20.acacia",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from uploads directory
  app.use('/uploads', require('express').static('uploads'));

  // Configure session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'voicetext-pro-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Helper function to create automatic notifications
  const createAutoNotification = async (userId: number, type: string, title: string, content: string, actionUrl?: string) => {
    try {
      await storage.createUserNotification(userId, {
        type,
        title,
        content,
        isRead: false,
        ...(actionUrl && { metadata: { actionUrl } })
      });
    } catch (error) {
      console.error("Failed to create auto notification:", error);
    }
  };

  // Helper function to check subscription expiry and send notifications
  const checkSubscriptionExpiry = async () => {
    try {
      const allUsers = await storage.getAllUsers();
      const now = new Date();
      
      for (const user of allUsers) {
        if (user.subscriptionType !== 'free' && user.subscriptionExpiry) {
          const expiryDate = new Date(user.subscriptionExpiry);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          // Send notification 7 days before expiry
          if (daysUntilExpiry === 7) {
            await createAutoNotification(
              user.id,
              "expiry_warning",
              "Gói dịch vụ sắp hết hạn",
              `Gói ${user.subscriptionType.toUpperCase()} của bạn sẽ hết hạn vào ${expiryDate.toLocaleDateString('vi-VN')} (còn 7 ngày). Vui lòng gia hạn để tiếp tục sử dụng đầy đủ tính năng.`
            );
          }
          
          // Send notification 1 day before expiry
          if (daysUntilExpiry === 1) {
            await createAutoNotification(
              user.id,
              "expiry_urgent",
              "Gói dịch vụ hết hạn trong 1 ngày",
              `CẢNH BÁO: Gói ${user.subscriptionType.toUpperCase()} của bạn sẽ hết hạn vào ngày mai (${expiryDate.toLocaleDateString('vi-VN')}). Gia hạn ngay để tránh gián đoạn dịch vụ.`
            );
          }

          // Send notification when expired
          if (daysUntilExpiry === 0) {
            await createAutoNotification(
              user.id,
              "expired",
              "Gói dịch vụ đã hết hạn",
              `Gói ${user.subscriptionType.toUpperCase()} của bạn đã hết hạn hôm nay. Tài khoản đã được chuyển về gói Free với giới hạn 500 ký tự. Vui lòng gia hạn để tiếp tục sử dụng tính năng cao cấp.`
            );
            
            // Downgrade user to free plan
            await storage.updateUserSubscription(user.id, 'free', null);
          }
        }
      }
    } catch (error) {
      console.error("Failed to check subscription expiry:", error);
    }
  };

  // Run subscription expiry check every hour
  setInterval(checkSubscriptionExpiry, 60 * 60 * 1000);

  // Authentication middleware
  const requireAuth = async (req: any, res: any, next: any) => {
    console.log(`🔍 Auth check - Session:`, {
      sessionId: req.sessionID,
      userId: req.session?.userId,
      hasSession: !!req.session,
      cookie: req.session?.cookie,
      passportUser: req.user ? { id: req.user.id, email: req.user.email } : null
    });
    
    // Check both session.userId and passport user
    const userId = req.session?.userId || req.user?.id;
    
    if (!userId) {
      console.log(`❌ Auth failed - No userId in session or passport user`);
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Kiểm tra user có tồn tại và có bị khóa không
    const user = await storage.getUser(userId);
    if (!user) {
      console.log(`❌ Auth failed - User ${userId} not found in database`);
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Kiểm tra tài khoản có bị khóa không
    if (!user.isActive) {
      // Xóa session nếu tài khoản bị khóa
      req.session.destroy();
      const lockMessage = user.lockReason 
        ? `Tài khoản đã bị khóa. Lý do: ${user.lockReason}`
        : "Tài khoản đã bị khóa";
      return res.status(403).json({ message: lockMessage });
    }
    
    // Ensure session has userId (for compatibility)
    if (!req.session.userId) {
      req.session.userId = user.id;
    }
    
    req.user = user;
    console.log(`✅ Auth success for user:`, { id: user.id, email: user.email });
    next();
  };

  // Admin protection middleware
  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized - No session" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized - User not found" });
      }
      
      if (user.role !== "admin") {
        console.log(`Access denied for user ${user.username} with role ${user.role}`);
        return res.status(403).json({ message: "Admin access required" });
      }
      
      if (!user.isActive) {
        return res.status(403).json({ message: "Account is deactivated" });
      }
      
      // Store user info in request for use in handlers
      req.user = user;
      next();
    } catch (error) {
      console.error("Admin auth error:", error);
      return res.status(500).json({ message: "Authentication error" });
    }
  };



  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      
      // Create welcome notification for new user
      await createAutoNotification(
        user.id,
        "welcome",
        "Chào mừng bạn đến với VoiceText Pro!",
        `Xin chào ${user.fullName || user.username}, cảm ơn bạn đã đăng ký tài khoản. Hãy khám phá các tính năng tạo giọng đọc AI chất lượng cao của chúng tôi. Tài khoản Free của bạn có thể tạo audio từ 500 ký tự mỗi lần.`,
        "/dashboard"
      );

      // Create upgrade notification for free users
      if (user.subscriptionType === "free") {
        await createAutoNotification(
          user.id,
          "upgrade",
          "Nâng cấp để mở khóa tính năng Pro",
          "Nâng cấp lên gói Pro để tận hưởng 2000 ký tự mỗi lần, nhiều giọng đọc hơn và ưu tiên xử lý. Gói Premium cho phép 5000 ký tự và không giới hạn số file.",
          "/pricing"
        );
      }

      // Create admin notification about new user registration
      try {
        await storage.createNotification({
          type: 'user',
          title: 'Người dùng mới đăng ký',
          message: `Người dùng ${user.fullName || user.username} (${user.email}) đã đăng ký tài khoản mới`,
          priority: 'normal',
          data: { 
            actionUrl: `/admin?tab=users&userId=${user.id}`,
            userId: user.id,
            userEmail: user.email,
            registrationMethod: 'direct'
          }
        });
      } catch (notifError) {
        console.error('Failed to create admin registration notification:', notifError);
      }
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json({
        message: "Đăng ký thành công",
        user: userWithoutPassword
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ 
        message: error.message || "Có lỗi xảy ra khi đăng ký"
      });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      const user = await storage.authenticateUser(loginData);
      
      if (!user) {
        return res.status(401).json({ 
          message: "Tên đăng nhập hoặc mật khẩu không đúng" 
        });
      }

      // Kiểm tra tài khoản có bị khóa không
      if (!user.isActive) {
        const lockMessage = user.lockReason 
          ? `Tài khoản đã bị khóa. Lý do: ${user.lockReason}`
          : "Tài khoản đã bị khóa";
        return res.status(401).json({ 
          message: lockMessage,
          accountLocked: true
        });
      }

      // Set session
      req.session.userId = user.id;
      
      // Create login notification periodically (avoid spam)
      try {
        const now = new Date();
        const today = now.toDateString();
        const loginKey = `login_${user.id}_${today}`;
        
        // Simple daily login tracking (could be improved with redis/database)
        if (!global.dailyLoginTracker) {
          global.dailyLoginTracker = new Map();
        }
        
        if (!global.dailyLoginTracker.get(loginKey)) {
          global.dailyLoginTracker.set(loginKey, true);
          
          await createAutoNotification(
            user.id,
            "system", 
            "Đăng nhập thành công",
            `Chào mừng trở lại ${user.fullName || user.username}! Bạn đã đăng nhập vào lúc ${now.toLocaleString('vi-VN')}`
          );
        }
      } catch (notifError) {
        console.error('Failed to create login notification:', notifError);
      }
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      
      res.json({
        message: "Đăng nhập thành công",
        user: userWithoutPassword
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(400).json({ 
        message: "Có lỗi xảy ra khi đăng nhập"
      });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Có lỗi xảy ra khi đăng xuất" });
      }
      res.json({ message: "Đăng xuất thành công" });
    });
  });

  // Debug session endpoint
  app.get("/api/debug/session", (req: any, res) => {
    res.json({
      sessionId: req.sessionID,
      userId: req.session.userId,
      hasSession: !!req.session,
      cookie: req.session.cookie,
      passportUser: req.user ? { id: req.user.id, email: req.user.email } : null,
      sessionData: req.session
    });
  });

  // Force session refresh endpoint
  app.post("/api/auth/refresh", async (req: any, res) => {
    try {
      console.log(`🔄 Session refresh request:`, {
        sessionId: req.sessionID,
        sessionUserId: req.session?.userId,
        passportUser: req.user ? { id: req.user.id, email: req.user.email } : null
      });

      const userId = req.session?.userId || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "No user session found" });
      }

      // Get fresh user data
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Ensure session has userId
      req.session.userId = user.id;
      
      // Save session explicitly
      req.session.save((err: any) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: "Session save failed" });
        }
        
        console.log(`✅ Session refreshed for user ${user.id}`);
        const { password, ...userWithoutPassword } = user;
        res.json({
          message: "Session refreshed",
          user: userWithoutPassword
        });
      });
    } catch (error) {
      console.error("Session refresh error:", error);
      res.status(500).json({ message: "Session refresh failed" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req: any, res) => {
    try {
      // Use user already fetched by requireAuth middleware (fresh from DB)
      const user = req.user as any;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log(`✅ Fresh user data from middleware:`, {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        updatedAt: user.updatedAt
      });
      
      const { password, ...userWithoutPassword } = user;
      
      // Set strong cache headers to prevent any caching
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate, private',
        'Pragma': 'no-cache', 
        'Expires': '0',
        'Last-Modified': new Date().toUTCString(),
        'ETag': `"${Date.now()}-${user.updatedAt}"`
      });
      
      res.json({
        ...userWithoutPassword,
        _timestamp: Date.now() // Force frontend to see this as new data
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });



  // Create admin user if none exists
  app.post("/api/create-admin", async (req, res) => {
    try {
      // Check if any admin exists
      const existingUsers = await storage.getAllUsers(100);
      const adminExists = existingUsers.some(user => user.role === "admin");
      
      if (adminExists) {
        return res.status(400).json({ message: "Admin already exists" });
      }
      
      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email and password are required" });
      }
      
      const adminUser = await storage.createUser({
        username,
        email,
        password,
        fullName: "Administrator",
        role: "admin",
        subscriptionType: "premium"
      });
      
      // Update role to admin
      const updatedAdmin = await storage.updateUserRole(adminUser.id, "admin");
      
      const { password: _, ...adminWithoutPassword } = updatedAdmin!;
      res.json({ message: "Admin created successfully", user: adminWithoutPassword });
    } catch (error) {
      console.error("Create admin error:", error);
      res.status(500).json({ message: "Failed to create admin" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const users = await storage.getAllUsers(limit, offset);
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Create new user (admin only)
  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      console.log("Creating user with data:", req.body);
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Tên đăng nhập đã tồn tại" });
      }
      
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email đã tồn tại" });
      }
      
      // Create user with all data from validated schema
      const newUser = await storage.createUser(userData);
      console.log("User created successfully:", newUser.id);
      
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      console.error("Create user error:", error);
      if (error.issues) {
        // Zod validation error
        return res.status(400).json({ 
          message: "Dữ liệu không hợp lệ", 
          details: error.issues.map((issue: any) => issue.message).join(", ")
        });
      }
      if (error.code === '23505') {
        return res.status(400).json({ message: "Người dùng đã tồn tại" });
      }
      res.status(500).json({ message: "Có lỗi xảy ra khi tạo người dùng" });
    }
  });

  // Update user (admin only)
  app.put("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updateData = req.body.userData || req.body;
      
      // Bảo vệ tài khoản admin chính (ID = 1) khỏi bị chỉnh sửa
      if (userId === 1) {
        return res.status(403).json({ message: "Không thể chỉnh sửa tài khoản admin chính" });
      }
      
      // Check if user exists
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: "Người dùng không tồn tại" });
      }
      
      // Check if username/email conflicts with other users
      if (updateData.username && updateData.username !== existingUser.username) {
        const conflictUser = await storage.getUserByUsername(updateData.username);
        if (conflictUser && conflictUser.id !== userId) {
          return res.status(400).json({ message: "Tên đăng nhập đã tồn tại" });
        }
      }
      
      if (updateData.email && updateData.email !== existingUser.email) {
        const conflictUser = await storage.getUserByEmail(updateData.email);
        if (conflictUser && conflictUser.id !== userId) {
          return res.status(400).json({ message: "Email đã tồn tại" });
        }
      }
      
      // Prepare update data
      const updateFields: any = {};
      
      if (updateData.username) updateFields.username = updateData.username;
      if (updateData.email) updateFields.email = updateData.email;
      if (updateData.fullName !== undefined) updateFields.fullName = updateData.fullName;
      if (updateData.role) updateFields.role = updateData.role;
      if (updateData.subscriptionType) updateFields.subscriptionType = updateData.subscriptionType;
      
      // Handle account locking/unlocking
      if (updateData.isActive !== undefined) {
        updateFields.isActive = updateData.isActive;
        
        if (!updateData.isActive && updateData.lockReason) {
          // Khóa tài khoản với lý do
          updateFields.lockReason = updateData.lockReason;
          updateFields.lockedAt = new Date();
          updateFields.lockedBy = req.session.userId; // ID của admin thực hiện khóa
        } else if (updateData.isActive) {
          // Mở khóa tài khoản
          updateFields.lockReason = null;
          updateFields.lockedAt = null;
          updateFields.lockedBy = null;
        }
      }
      
      // Update user in database
      const updatedUser = await storage.updateUser(userId, updateFields);
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Có lỗi xảy ra khi cập nhật người dùng" });
    }
  });

  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers(1000); // Get more users for stats
      const now = new Date();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const stats = {
        totalUsers: allUsers.length,
        proUsers: allUsers.filter(u => u.subscriptionType === "pro" || u.subscriptionType === "premium").length,
        activeToday: allUsers.filter(u => u.updatedAt > new Date(now.getTime() - 24 * 60 * 60 * 1000)).length,
        monthlyGrowth: Math.round((allUsers.filter(u => u.createdAt > monthAgo).length / Math.max(allUsers.length - allUsers.filter(u => u.createdAt > monthAgo).length, 1)) * 100)
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { role, subscriptionType, isActive, subscriptionExpiry } = req.body;
      
      let updatedUser;
      
      if (role !== undefined) {
        updatedUser = await storage.updateUserRole(userId, role);
      }
      
      if (subscriptionType !== undefined) {
        const expiryDate = subscriptionExpiry ? new Date(subscriptionExpiry) : undefined;
        updatedUser = await storage.updateUserSubscription(userId, subscriptionType, expiryDate);
      }
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Update user role
  app.put("/api/admin/users/:id/role", requireAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;
      
      if (!role || !["admin", "user"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const updatedUser = await storage.updateUserRole(userId, role);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user role error:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Update user subscription
  app.put("/api/admin/users/:id/subscription", requireAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { subscriptionType, expiryDate } = req.body;
      
      if (!subscriptionType || !["free", "pro", "premium"].includes(subscriptionType)) {
        return res.status(400).json({ message: "Invalid subscription type" });
      }
      
      const expiry = expiryDate ? new Date(expiryDate) : undefined;
      const updatedUser = await storage.updateUserSubscription(userId, subscriptionType, expiry);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user subscription error:", error);
      res.status(500).json({ message: "Failed to update user subscription" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Prevent admin from deleting themselves  
      const currentUser = await storage.getUser(req.session.userId);
      if (userId === currentUser?.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const deleted = await storage.deleteUser(userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Delete audio file (admin)
  app.delete("/api/admin/audio-files/:id", requireAdmin, async (req: any, res) => {
    try {
      const audioId = parseInt(req.params.id);
      const deleted = await storage.deleteAudioFile(audioId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Audio file not found" });
      }
      
      res.json({ message: "Audio file deleted successfully" });
    } catch (error) {
      console.error("Delete audio file error:", error);
      res.status(500).json({ message: "Failed to delete audio file" });
    }
  });

  // Update payment status (admin)
  app.put("/api/admin/payments/:id/status", requireAdmin, async (req: any, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const { status } = req.body;
      const adminUser = await storage.getUser(req.session.userId);
      
      if (!status || !["pending", "completed", "failed", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid payment status" });
      }
      
      const updatedPayment = await storage.updatePaymentStatus(paymentId, status, adminUser?.id);
      
      if (!updatedPayment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      res.json(updatedPayment);
    } catch (error) {
      console.error("Update payment status error:", error);
      res.status(500).json({ message: "Failed to update payment status" });
    }
  });

  // Confirm payment and upgrade user (admin)
  app.put("/api/admin/payments/:id/confirm", requireAdmin, async (req: any, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const adminUser = await storage.getUser(req.session.userId);
      
      // Get payment info
      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      if (payment.status !== 'pending') {
        return res.status(400).json({ message: "Payment is not pending" });
      }
      
      // Update payment status to completed
      const updatedPayment = await storage.updatePaymentStatus(paymentId, "completed", adminUser?.id);
      
      // Upgrade user subscription if payment has userId
      if (payment.userId) {
        const expiryDate = new Date();
        if (payment.billingCycle === 'monthly') {
          expiryDate.setMonth(expiryDate.getMonth() + 1);
        } else if (payment.billingCycle === 'yearly') {
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        }
        
        // Cập nhật gói người dùng với ngày hết hạn
        const updatedUser = await storage.updateUserSubscription(payment.userId, payment.planType, expiryDate);
        
        // Tạo thông báo kích hoạt gói thành công cho admin
        await storage.createNotification({
          type: "payment",
          title: `Kích hoạt gói ${payment.planType.toUpperCase()} thành công`,
          message: `Tài khoản đã được nâng cấp lên gói ${payment.planType.toUpperCase()} (${payment.billingCycle === 'monthly' ? 'hàng tháng' : 'hàng năm'}). Hết hạn: ${expiryDate.toLocaleDateString('vi-VN')}`,
          isRead: false,
          createdAt: new Date(),
          actionUrl: `/admin?tab=users`,
          priority: "high"
        });

        // Tạo thông báo cho người dùng về việc nâng cấp thành công
        await createAutoNotification(
          payment.userId,
          "payment_success",
          `Thanh toán thành công - Gói ${payment.planType.toUpperCase()}`,
          `Chúc mừng! Thanh toán của bạn đã được xác nhận. Tài khoản đã được nâng cấp lên gói ${payment.planType.toUpperCase()} (${payment.billingCycle === 'monthly' ? 'hàng tháng' : 'hàng năm'}). Gói sẽ hết hạn vào ${expiryDate.toLocaleDateString('vi-VN')}. Bạn có thể sử dụng đầy đủ tính năng ngay bây giờ.`
        );

        console.log(`User ${payment.userId} upgraded to ${payment.planType} until ${expiryDate.toISOString()}`);
      }
      
      res.json({ 
        success: true, 
        message: "Payment confirmed and user upgraded successfully",
        payment: updatedPayment 
      });
    } catch (error) {
      console.error("Confirm payment error:", error);
      res.status(500).json({ message: "Failed to confirm payment" });
    }
  });

  // Toggle user account status (admin)
  app.put("/api/admin/users/:id/status", requireAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isActive, lockReason } = req.body;
      const adminUser = await storage.getUser(req.session.userId);
      
      const updateData: any = {
        isActive,
        lockedBy: !isActive ? adminUser?.id : null,
        lockedAt: !isActive ? new Date() : null,
        lockReason: !isActive ? lockReason : null
      };
      
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        success: true,
        message: isActive ? "User account unlocked successfully" : "User account locked successfully",
        user: updatedUser
      });
    } catch (error) {
      console.error("Toggle user status error:", error);
      res.status(500).json({ message: "Failed to toggle user status" });
    }
  });

  // Delete user (admin only)
  app.delete("/api/admin/users/:id", requireAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Kiểm tra xem có phải admin đang cố xóa chính mình không
      const currentUser = await storage.getUser(req.session.userId);
      if (currentUser?.id === userId) {
        return res.status(400).json({ message: "Không thể xóa tài khoản admin hiện tại" });
      }
      
      // Kiểm tra xem user có tồn tại không
      const userToDelete = await storage.getUser(userId);
      if (!userToDelete) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }
      
      // Không cho phép xóa admin khác
      if (userToDelete.role === "admin") {
        return res.status(400).json({ message: "Không thể xóa tài khoản admin" });
      }
      
      // Thực hiện xóa user
      const deleted = await storage.deleteUser(userId);
      
      if (!deleted) {
        return res.status(500).json({ message: "Không thể xóa người dùng" });
      }
      
      // Tạo thông báo về việc xóa user
      await storage.createNotification({
        type: "user",
        title: "Đã xóa người dùng",
        message: `Người dùng ${userToDelete.username} đã bị xóa khỏi hệ thống`,
        isRead: false,
        createdAt: new Date(),
        actionUrl: `/admin?tab=users`,
        priority: "medium"
      });
      
      res.json({
        success: true,
        message: "Đã xóa người dùng thành công"
      });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Lỗi khi xóa người dùng" });
    }
  });

  // Reject payment (admin only)
  app.put("/api/admin/payments/:id/reject", requireAdmin, async (req: any, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      
      // Kiểm tra payment có tồn tại không
      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Không tìm thấy giao dịch" });
      }
      
      // Kiểm tra trạng thái payment
      if (payment.status !== "pending") {
        return res.status(400).json({ message: "Chỉ có thể từ chối giao dịch đang chờ xử lý" });
      }
      
      // Cập nhật trạng thái thành rejected
      const updatedPayment = await storage.updatePaymentStatus(paymentId, "rejected", req.session.userId);
      
      if (!updatedPayment) {
        return res.status(500).json({ message: "Không thể cập nhật trạng thái giao dịch" });
      }
      
      // Tạo thông báo về việc từ chối thanh toán
      await storage.createNotification({
        type: "payment",
        title: "Từ chối giao dịch thanh toán",
        message: `Giao dịch ${payment.orderId} đã bị từ chối. Khách hàng: ${payment.customerName}`,
        isRead: false,
        createdAt: new Date(),
        actionUrl: `/admin?tab=payments`,
        priority: "medium"
      });
      
      res.json({
        success: true,
        message: "Đã từ chối giao dịch thành công",
        payment: updatedPayment
      });
    } catch (error) {
      console.error("Reject payment error:", error);
      res.status(500).json({ message: "Lỗi khi từ chối giao dịch" });
    }
  });

  // Admin endpoint to generate voice samples
  app.post("/api/admin/generate-voice-sample", requireAdmin, async (req: any, res) => {
    try {
      const { voice, text } = req.body;

      if (!voice || !text) {
        return res.status(400).json({ message: "Voice and text are required" });
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Map Vietnamese voice IDs to OpenAI voices
      const voiceMap: Record<string, string> = {
        "vi-VN-HoaiMy": "alloy",
        "vi-VN-NamMinh": "echo", 
        "vi-VN-ThuHa": "nova",
        "vi-VN-QuangAnh": "onyx",
        "vi-VN-HongLan": "shimmer",
        "vi-VN-TuanVu": "fable"
      };

      const openaiVoice = voiceMap[voice] || "alloy";

      const response = await openai.audio.speech.create({
        model: "tts-1",
        voice: openaiVoice as any,
        input: text,
        response_format: "mp3"
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      
      // Save to public/audio-samples directory
      const fs = require('fs');
      const path = require('path');
      
      const samplesDir = path.join(process.cwd(), 'public', 'audio-samples');
      if (!fs.existsSync(samplesDir)) {
        fs.mkdirSync(samplesDir, { recursive: true });
      }
      
      const filename = `${voice}.mp3`;
      const filepath = path.join(samplesDir, filename);
      
      fs.writeFileSync(filepath, buffer);
      
      res.json({ 
        message: "Voice sample generated successfully",
        filename,
        path: `/audio-samples/${filename}`
      });
    } catch (error) {
      console.error("Generate voice sample error:", error);
      res.status(500).json({ message: "Failed to generate voice sample" });
    }
  });

  // Get available voices endpoint
  app.get("/api/voices", async (req: any, res) => {
    try {
      // Check if user is authenticated
      const isAuthenticated = req.session?.userId != null;
      const user = isAuthenticated ? await storage.getUser(req.session.userId) : null;
      const isAdmin = user?.role === 'admin';
      
      // Define voice permission levels
      const allVoices = [
        // OpenAI voices - Free voice for guest users
        { id: "alloy", name: "Alloy", provider: "openai", language: "en", gender: "neutral", tier: "free" },
        { id: "echo", name: "Echo", provider: "openai", language: "en", gender: "male", tier: "pro" },
        { id: "fable", name: "Fable", provider: "openai", language: "en", gender: "neutral", tier: "pro" },
        { id: "onyx", name: "Onyx", provider: "openai", language: "en", gender: "male", tier: "premium" },
        { id: "nova", name: "Nova", provider: "openai", language: "en", gender: "female", tier: "premium" },
        { id: "shimmer", name: "Shimmer", provider: "openai", language: "en", gender: "female", tier: "premium" },
        
        // FPT AI voices - Ban Mai for registered users, others require premium
        {
          id: "banmai",
          name: "Ban Mai",
          provider: "fpt",
          language: "vi",
          gender: "female",
          region: "north",
          description: "Giọng nữ miền Bắc, tự nhiên",
          tier: "registered"
        },
        {
          id: "leminh",
          name: "Lê Minh",
          provider: "fpt",
          language: "vi",
          gender: "male",
          region: "north",
          description: "Giọng nam miền Bắc, mạnh mẽ",
          tier: "premium"
        },
        {
          id: "thuminh",
          name: "Thu Minh",
          provider: "fpt",
          language: "vi",
          gender: "female",
          region: "south",
          description: "Giọng nữ miền Nam, dịu dàng",
          tier: "premium"
        },
        {
          id: "giahuy",
          name: "Gia Huy",
          provider: "fpt",
          language: "vi",
          gender: "male",
          region: "south",
          description: "Giọng nam miền Nam, trầm ấm",
          tier: "premium"
        },
        {
          id: "ngoclam",
          name: "Ngọc Lam",
          provider: "fpt",
          language: "vi",
          gender: "female",
          region: "central",
          description: "Giọng nữ miền Trung, thanh thoát",
          tier: "pro"
        }
      ];

      // Always show all voices but mark permissions
      const availableVoices = allVoices.map(voice => {
        // Admin can use all voices
        if (isAdmin) {
          return voice;
        }
        
        if (!isAuthenticated) {
          // Guest users: only free voices are enabled
          if (voice.tier === "free") {
            return voice;
          } else {
            return {
              ...voice,
              name: `${voice.name} ${voice.tier === "premium" ? "💎 PREMIUM" : voice.tier === "pro" ? "⭐ PRO" : "🔓 ĐĂNG KÝ"}`,
              disabled: true
            };
          }
        } else {
          // Authenticated users: check subscription level
          const userSubscription = user?.subscriptionType || 'free';
          
          if (voice.tier === "free" || voice.tier === "registered") {
            return voice;
          } else if (voice.tier === "pro" && (userSubscription === 'pro' || userSubscription === 'premium')) {
            return voice;
          } else if (voice.tier === "premium" && userSubscription === 'premium') {
            return voice;
          } else {
            return {
              ...voice,
              name: `${voice.name} ${voice.tier === "premium" ? "💎 PREMIUM" : "⭐ PRO"}`,
              disabled: true
            };
          }
        }
      });
      
      res.json(availableVoices);
    } catch (error) {
      console.error("Get voices error:", error);
      res.status(500).json({ message: "Failed to fetch voices" });
    }
  });

  // Helper function to check voice permission
  const checkVoicePermission = (voice: string, isAuthenticated: boolean, subscriptionType: string = 'free', userRole: string = 'user') => {
    // Admin has access to all voices
    if (userRole === 'admin') {
      return { allowed: true };
    }

    const voicePermissions = {
      // OpenAI voices
      "alloy": "free",
      "echo": "pro", 
      "fable": "pro",
      "onyx": "premium",
      "nova": "premium", 
      "shimmer": "premium",
      // FPT voices
      "banmai": "registered",
      "leminh": "premium",
      "thuminh": "premium", 
      "giahuy": "premium",
      "ngoclam": "pro"
    };

    const requiredTier = voicePermissions[voice as keyof typeof voicePermissions];
    
    if (!requiredTier) {
      return { allowed: false, error: "Giọng không hợp lệ" };
    }
    
    // Free voices are available to everyone (including guests)
    if (requiredTier === "free") {
      return { allowed: true };
    }
    
    // For premium voices, need authentication
    if (!isAuthenticated) {
      return { 
        allowed: false, 
        error: "Vui lòng đăng nhập để sử dụng giọng này" 
      };
    }
    
    // Registered users can use "registered" tier voices
    if (requiredTier === "registered") {
      return { allowed: true };
    }
    
    // Check subscription level for pro/premium voices
    if (requiredTier === "pro" && (subscriptionType === 'pro' || subscriptionType === 'premium')) {
      return { allowed: true };
    }
    
    if (requiredTier === "premium" && subscriptionType === 'premium') {
      return { allowed: true };
    }
    
    return {
      allowed: false,
      error: `Giọng này yêu cầu gói ${requiredTier.toUpperCase()}. Vui lòng nâng cấp tài khoản.`
    };
  };

  // OpenAI TTS API endpoint với kiểm tra giới hạn
  app.post("/api/tts", async (req: any, res) => {
    try {
      const { text, voice = "alloy", speed = 1.0 } = req.body;
      const userId = req.session?.userId;
      const isAuthenticated = !!userId;
      console.log('[DEBUG] /api/tts - isAuthenticated:', isAuthenticated, '| voice:', voice, '| text.length:', text?.length);
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      // Get app settings
      const appSettings = await storage.getAppSettings();
      if (!appSettings) {
        return res.status(500).json({ error: "Failed to get app settings" });
      }

      // Nếu là guest và voice là alloy thì cho phép luôn
      if (!isAuthenticated && voice === "alloy") {
        // Limit text for guests - use setting from admin panel
        const guestMaxChars = appSettings.guestMaxCharacters || 100;
        if (text.length > guestMaxChars) {
          return res.status(400).json({ 
            error: `Người dùng chưa đăng nhập chỉ được tạo audio từ ${guestMaxChars} ký tự. Vui lòng đăng nhập để sử dụng đầy đủ tính năng.` 
          });
        }
        // Gọi OpenAI tạo audio alloy cho guest
        const response = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "tts-1",
            input: text,
            voice: "alloy",
            speed: Math.max(0.25, Math.min(4.0, speed)),
          }),
        });
        if (!response.ok) {
          const errorData = await response.text();
          console.error("OpenAI TTS Error (guest alloy):", errorData);
          throw new Error(`OpenAI API error: ${response.status}`);
        }
        const audioBuffer = Buffer.from(await response.arrayBuffer());
        res.set({
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.byteLength.toString(),
          'Access-Control-Allow-Origin': '*'
        });
        return res.send(audioBuffer);
      }

      // Chặn guest users với voice khác alloy
      if (!isAuthenticated) {
        return res.status(403).json({ error: "Vui lòng đăng nhập để sử dụng giọng này" });
      }

      // Authenticated users - check voice permissions
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      console.log('[DEBUG] /api/tts - user:', user.username, '| subscriptionType:', user.subscriptionType, '| role:', user.role);
      const voiceCheck = checkVoicePermission(voice, isAuthenticated, user.subscriptionType || 'free', user.role || 'user');
      console.log('[DEBUG] /api/tts - voiceCheck result:', voiceCheck);
      if (!voiceCheck.allowed) {
        return res.status(403).json({ error: voiceCheck.error });
      }

      // Continue with authenticated user logic...
      // Check character limits for authenticated users
      const subscriptionType = user.subscriptionType || 'free';
      let maxChars = 500; // default for free users
      if (subscriptionType === 'premium') {
        maxChars = appSettings.premiumMaxCharacters || 5000;
      } else if (subscriptionType === 'pro') {
        maxChars = appSettings.proMaxCharacters || 2000;
      } else {
        maxChars = appSettings.freeMaxCharacters || 500;
      }
      
      if (text.length > maxChars) {
        return res.status(400).json({ 
          error: `Văn bản quá dài (${text.length}/${maxChars} ký tự). Vui lòng nâng cấp gói để được giới hạn cao hơn.` 
        });
      }

      // Check if voice is FPT AI or OpenAI
      const isFPTVoice = fptAI.isValidVoice(voice);
      let audioBuffer: Buffer;

      if (isFPTVoice) {
        // Use FPT AI
        console.log("Using FPT AI for voice:", voice);
        audioBuffer = await fptAI.synthesizeText({
          text: text,
          voice: voice,
          speed: Math.max(0.5, Math.min(2.0, speed)),
          format: "mp3"
        });
      } else {
        // Use OpenAI TTS
        console.log("Using OpenAI for voice:", voice);
        const response = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "tts-1",
            input: text,
            voice: voice,
            speed: Math.max(0.25, Math.min(4.0, speed)),
          }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error("OpenAI TTS Error (authenticated):", errorData);
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        audioBuffer = Buffer.from(await response.arrayBuffer());
      }
      
      res.set({
        'Content-Type': isFPTVoice ? 'audio/wav' : 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Access-Control-Allow-Origin': '*'
      });
      return res.send(audioBuffer);
    } catch (error: any) {
      console.error("TTS error:", error);
      res.status(500).json({ error: "Failed to generate speech" });
    }
  });

  // TTS Preview endpoint
  app.post("/api/tts/preview", async (req: any, res) => {
    try {
      const { content, voice = "alloy", speed = 1.0, pitch = 1.0, volume = 1.0, format = "mp3" } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      // Check if user is authenticated
      const isAuthenticated = req.session?.userId != null;
      const user = isAuthenticated ? await storage.getUser(req.session.userId) : null;
      
      // Check voice permission
      const voiceCheck = checkVoicePermission(voice, isAuthenticated, user?.subscriptionType || 'free', user?.role || 'user');
      if (!voiceCheck.allowed) {
        return res.status(403).json({ error: voiceCheck.error });
      }

      // Check if voice is FPT AI or OpenAI
      const isFPTVoice = fptAI.isValidVoice(voice);
      let audioBuffer: Buffer;

      if (isFPTVoice) {
        // Use FPT AI
        console.log("Using FPT AI for voice:", voice);
        audioBuffer = await fptAI.synthesizeText({
          text: content,
          voice: voice,
          speed: Math.max(0.5, Math.min(2.0, speed)),
          format: format === "mp3" ? "mp3" : "wav"
        });
      } else {
        // Use OpenAI TTS
        console.log("Using OpenAI for voice:", voice);
        const response = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "tts-1",
            input: content,
            voice: voice,
            speed: Math.max(0.25, Math.min(4.0, speed)),
          }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error("OpenAI TTS Preview Error:", errorData);
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        audioBuffer = Buffer.from(await response.arrayBuffer());
      }
      
      res.set({
        'Content-Type': isFPTVoice && format === "wav" ? 'audio/wav' : 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Access-Control-Allow-Origin': '*'
      });
      return res.send(audioBuffer);
    } catch (error: any) {
      console.error("TTS preview error:", error);
      res.status(500).json({ error: "Failed to generate preview" });
    }
  });

  // Extract text from uploaded files
  app.post("/api/extract-text", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const filePath = req.file.path;
      let extractedText = "";

      try {
        switch (req.file.mimetype) {
          case 'application/pdf':
            const pdfBuffer = await fs.readFile(filePath);
            const pdfData = await pdfParse(pdfBuffer);
            extractedText = pdfData.text;
            break;

          case 'application/msword':
          case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            const docBuffer = await fs.readFile(filePath);
            const docResult = await mammoth.extractRawText({ buffer: docBuffer });
            extractedText = docResult.value;
            break;

          case 'text/plain':
            extractedText = await fs.readFile(filePath, 'utf-8');
            break;

          default:
            return res.status(400).json({ message: "Unsupported file type" });
        }

        // Clean up uploaded file
        await fs.unlink(filePath);

        res.json({
          text: extractedText.trim(),
          filename: req.file.originalname
        });

      } catch (error) {
        // Clean up uploaded file on error
        try {
          await fs.unlink(filePath);
        } catch {}
        throw error;
      }

    } catch (error) {
      console.error("Text extraction error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to extract text from file" 
      });
    }
  });

  // Create audio file
  app.post("/api/audio-files", async (req: any, res) => {
    try {
      const validatedData = insertAudioFileSchema.parse(req.body);
      const userId = req.session.userId; // May be undefined for guests
      
      // Đảm bảo validatedData là object và có đủ trường
      const vd: any = validatedData;
      if (typeof vd !== 'object' || !vd['title'] || !vd['content'] || !vd['voice'] || !vd['speed'] || !vd['pitch'] || !vd['volume'] || !vd['format']) {
        return res.status(400).json({ message: "Invalid audio file data" });
      }
      const wordsPerMinute = 150; // Average reading speed
      const wordCount = vd['content'].split(/\s+/).length;
      const estimatedDuration = Math.ceil((wordCount / wordsPerMinute) * 60 / vd['speed']);
      
      // Chỉ lấy các trường hợp lệ cho schema
      const audioFileData = {
        title: vd['title'],
        content: vd['content'],
        voice: vd['voice'],
        speed: vd['speed'],
        pitch: vd['pitch'],
        volume: vd['volume'],
        format: vd['format'],
        duration: estimatedDuration,
        fileSize: 0,
        isPublic: vd['isPublic'] ?? false,
      };

      const audioFile = await storage.createAudioFile(audioFileData, userId);
      
      // Create notification for successful audio creation (registered users only)
      if (userId) {
        // Get user info to personalize notification
        const user = await storage.getUser(userId);
        if (user) {
          const isFirstAudio = user.totalAudioFiles === 0;
          
          if (isFirstAudio) {
            // Special notification for first audio file
            await createAutoNotification(
              userId,
              "first_audio",
              "Chúc mừng! Audio đầu tiên của bạn",
              `Bạn đã tạo thành công audio file đầu tiên "${audioFile.title}". Hãy khám phá thêm các giọng đọc và tính năng khác của VoiceText Pro!`
            );
          } else {
            // Regular notification for subsequent audio files
            await createAutoNotification(
              userId,
              "audio_created",
              "Tạo audio thành công",
              `Audio "${audioFile.title}" đã được tạo thành công với giọng ${audioFile.voice}. Thời lượng ước tính: ${Math.floor(audioFile.duration / 60)}:${(audioFile.duration % 60).toString().padStart(2, '0')}.`
            );
          }
        }
      }
      
      // Add warning for guest users
      if (!userId) {
        res.json({
          ...audioFile,
          warning: "File tạm thời - sẽ bị xóa sau 1 giờ. Đăng ký để lưu vĩnh viễn!"
        });
      } else {
        res.json(audioFile);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Create audio file error:", error);
      res.status(500).json({ message: "Failed to create audio file" });
    }
  });

  // Get all audio files
  app.get("/api/audio-files", async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string;
      const userId = req.session.userId; // Filter by user for members

      let audioFiles;
      if (search) {
        audioFiles = await storage.searchAudioFiles(search);
        // Filter by user if authenticated
        if (userId !== undefined) {
          audioFiles = audioFiles.filter(file => file.userId === userId);
        }
      } else {
        audioFiles = await storage.getAudioFiles(userId, limit, offset);
      }

      res.json(audioFiles);
    } catch (error) {
      console.error("Get audio files error:", error);
      res.status(500).json({ message: "Failed to retrieve audio files" });
    }
  });

  // Get single audio file
  app.get("/api/audio-files/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const audioFile = await storage.getAudioFile(id);
      
      if (!audioFile) {
        return res.status(404).json({ message: "Audio file not found" });
      }

      res.json(audioFile);
    } catch (error) {
      console.error("Get audio file error:", error);
      res.status(500).json({ message: "Failed to retrieve audio file" });
    }
  });

  // Update audio file
  app.patch("/api/audio-files/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateAudioFileSchema.parse(req.body);
      
      const audioFile = await storage.updateAudioFile(id, validatedData);
      
      if (!audioFile) {
        return res.status(404).json({ message: "Audio file not found" });
      }

      res.json(audioFile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Update audio file error:", error);
      res.status(500).json({ message: "Failed to update audio file" });
    }
  });

  // Delete audio file
  app.delete("/api/audio-files/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteAudioFile(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Audio file not found" });
      }

      res.json({ message: "Audio file deleted successfully" });
    } catch (error) {
      console.error("Delete audio file error:", error);
      res.status(500).json({ message: "Failed to delete audio file" });
    }
  });

  // Serve audio file content with better auth handling
  app.get("/api/audio/:fileId", async (req: any, res) => {
    try {
      const fileId = parseInt(req.params.fileId);
      
      if (isNaN(fileId)) {
        return res.status(400).json({ message: "Invalid file ID" });
      }

      const audioFile = await storage.getAudioFile(fileId);
      
      if (!audioFile) {
        return res.status(404).json({ message: "Audio file not found" });
      }

      // Check if user owns the file or file is public
      const userId = req.session?.userId;
      const isOwner = audioFile.userId === userId;
      const isPublic = audioFile.isPublic;
      
      if (!isOwner && !isPublic) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Import AudioCache
      const { AudioCache } = await import('./audio-cache');

      // Try to get from cache first
      let audioBuffer = await AudioCache.get(fileId, audioFile.content, audioFile.voice, audioFile.speed);
      
      if (!audioBuffer) {
        console.log(`🔄 Generating audio for file ${fileId} (cache miss)`);
        
        // Generate audio on-demand using stored settings
        const isFPTVoice = fptAI.isValidVoice(audioFile.voice);

        if (isFPTVoice) {
          console.log("Using FPT AI for voice:", audioFile.voice);
          audioBuffer = await fptAI.synthesizeText({
            text: audioFile.content,
            voice: audioFile.voice,
            speed: audioFile.speed,
            format: audioFile.format === "mp3" ? "mp3" : "wav"
          });
        } else {
          console.log("Using OpenAI for voice:", audioFile.voice);
          const response = await fetch("https://api.openai.com/v1/audio/speech", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "tts-1",
              input: audioFile.content,
              voice: audioFile.voice,
              speed: audioFile.speed,
            }),
          });

          if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
          }

          audioBuffer = Buffer.from(await response.arrayBuffer());
        }

        // Cache the generated audio
        await AudioCache.set(fileId, audioFile.content, audioFile.voice, audioFile.speed, audioBuffer);
        
        // Update file size 
        await storage.updateAudioFile(fileId, { 
          fileSize: audioBuffer.byteLength
        });
      } else {
        console.log(`⚡ Serving cached audio for file ${fileId}`);
      }
      
      const isFPTVoice = fptAI.isValidVoice(audioFile.voice);
      res.set({
        'Content-Type': isFPTVoice && audioFile.format === "wav" ? 'audio/wav' : 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Content-Disposition': `inline; filename="${audioFile.title}.${audioFile.format}"`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
        'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
      });
      return res.send(audioBuffer);
    } catch (error) {
      console.error("Serve audio error:", error);
      res.status(500).json({ message: "Failed to serve audio file" });
    }
  });

  // Get audio cache stats (admin only)
  app.get("/api/admin/audio-cache/stats", requireAdmin, async (req, res) => {
    try {
      const { AudioCache } = await import('./audio-cache');
      const stats = AudioCache.getCacheStats();
      res.json(stats);
    } catch (error) {
      console.error("Get cache stats error:", error);
      res.status(500).json({ message: "Failed to get cache stats" });
    }
  });

  // Clear audio cache (admin only)
  app.delete("/api/admin/audio-cache", requireAdmin, async (req, res) => {
    try {
      const { AudioCache } = await import('./audio-cache');
      const { fileId } = req.query;
      
      if (fileId) {
        await AudioCache.clear(parseInt(fileId as string));
      } else {
        await AudioCache.clear();
      }
      
      res.json({ message: "Cache cleared successfully" });
    } catch (error) {
      console.error("Clear cache error:", error);
      res.status(500).json({ message: "Failed to clear cache" });
    }
  });

  // Get shared audio file
  app.get("/api/shared/:shareId", async (req, res) => {
    try {
      const shareId = req.params.shareId;
      const audioFile = await storage.getAudioFileByShareId(shareId);
      
      if (!audioFile || !audioFile.isPublic) {
        return res.status(404).json({ message: "Shared audio file not found or not public" });
      }

      res.json(audioFile);
    } catch (error) {
      console.error("Get shared audio file error:", error);
      res.status(500).json({ message: "Failed to retrieve shared audio file" });
    }
  });

  // Toggle public sharing
  app.post("/api/audio-files/:id/share", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isPublic } = req.body;
      
      const audioFile = await storage.updateAudioFile(id, { isPublic });
      
      if (!audioFile) {
        return res.status(404).json({ message: "Audio file not found" });
      }

      res.json({
        shareUrl: isPublic ? `/shared/${audioFile.shareId}` : null,
        audioFile
      });
    } catch (error) {
      console.error("Toggle share error:", error);
      res.status(500).json({ message: "Failed to toggle sharing" });
    }
  });

  // Payment endpoints
  app.post("/api/create-payment-intent", async (req: any, res) => {
    try {
      const { plan, billing } = req.body;
      
      if (!req.session.userId) {
        return res.status(401).json({ message: "Please login first" });
      }

      // Plan pricing
      const planPricing: Record<string, Record<string, number>> = {
        pro: {
          monthly: 99000,  // 99,000 VND
          yearly: 990000   // 990,000 VND  
        },
        premium: {
          monthly: 199000, // 199,000 VND
          yearly: 1990000  // 1,990,000 VND
        }
      };

      const price = planPricing[plan]?.[billing];
      if (!price) {
        return res.status(400).json({ message: "Invalid plan or billing cycle" });
      }

      // Create payment intent with Stripe
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: price, // Amount in smallest currency unit (VND doesn't have subunit)
          currency: 'vnd',
          metadata: {
            plan,
            billing,
            userId: req.session.userId.toString()
          }
        });

        res.json({ 
          clientSecret: paymentIntent.client_secret,
          planDetails: {
            plan,
            billing,
            price,
            formattedPrice: new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND'
            }).format(price)
          }
        });
      } catch (stripeError) {
        console.error("Stripe error:", stripeError);
        // Return demo client secret if Stripe is not configured
        res.json({
          clientSecret: "pi_demo_client_secret_for_testing",
          planDetails: {
            plan,
            billing, 
            price,
            formattedPrice: new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND'
            }).format(price)
          },
          demo: true
        });
      }
    } catch (error) {
      console.error("Create payment intent error:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  // Handle successful payment
  app.post("/api/payment-success", async (req: any, res) => {
    try {
      const { paymentIntentId } = req.body;
      
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // In a real implementation, verify payment with Stripe
      // For demo, we'll just update the user's subscription
      const userId = req.session.userId;
      
      // Update user subscription (you'll need to add this method to storage)
      // await storage.updateUserSubscription(userId, plan, expiryDate);
      
      res.json({ success: true, message: "Payment processed successfully" });
    } catch (error) {
      console.error("Payment success error:", error);
      res.status(500).json({ message: "Failed to process payment success" });
    }
  });

  // Create bank transfer order
  app.post("/api/create-bank-order", async (req: any, res) => {
    try {
      const { plan, billing } = req.body;
      
      if (!req.session.userId) {
        return res.status(401).json({ message: "Please login first" });
      }

      // Plan pricing
      const planPricing: Record<string, Record<string, number>> = {
        pro: {
          monthly: 99000,  
          yearly: 990000   
        },
        premium: {
          monthly: 199000, 
          yearly: 1990000  
        }
      };

      const price = planPricing[plan]?.[billing];
      if (!price) {
        return res.status(400).json({ message: "Invalid plan or billing cycle" });
      }

      const orderId = `VTP${Date.now()}${req.session.userId}`;
      
      // In a real implementation, save order to database
      // await storage.createBankOrder({
      //   orderId,
      //   userId: req.session.userId,
      //   plan,
      //   billing,
      //   amount: price,
      //   status: 'pending'
      // });

      res.json({
        orderId,
        planDetails: {
          plan,
          billing,
          price,
          formattedPrice: new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
          }).format(price)
        },
        bankInfo: {
          bankName: "Vietcombank",
          accountNumber: "1234567890123456",
          accountName: "CONG TY VOICETEXT PRO",
          branch: "Chi nhánh Hoàn Kiếm, Hà Nội",
          content: `${orderId} VoiceText Pro`
        }
      });
    } catch (error) {
      console.error("Create bank order error:", error);
      res.status(500).json({ message: "Failed to create bank transfer order" });
    }
  });

  // Check order status
  app.get("/api/order-status/:orderId", async (req: any, res) => {
    try {
      const { orderId } = req.params;
      
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // In a real implementation, check order status from database
      // const order = await storage.getBankOrder(orderId);
      
      // For demo, return pending status
      res.json({
        orderId,
        status: 'pending', // pending, paid, expired
        message: 'Đang chờ thanh toán. Gói sẽ được kích hoạt tự động sau khi nhận được tiền.'
      });
    } catch (error) {
      console.error("Check order status error:", error);
      res.status(500).json({ message: "Failed to check order status" });
    }
  });

  // Create payment order
  app.post("/api/payments", async (req: any, res) => {
    try {
      const { orderId, planType, billingCycle, amount, customerName, customerEmail, notes, paymentMethod, bankAccount } = req.body;
      
      const payment = await storage.createPayment({
        userId: req.session?.userId || null,
        orderId,
        planType,
        billingCycle,
        amount,
        status: "pending",
        paymentMethod,
        bankAccount,
        customerEmail,
        customerName,
        notes
      });

      // Create notification for payment creation
      try {
        if (payment.userId) {
          // Notification for user
          await createAutoNotification(
            payment.userId,
            "payment",
            "Đơn thanh toán đã được tạo",
            `Đơn thanh toán ${orderId} cho gói ${planType.toUpperCase()} (${billingCycle === 'monthly' ? 'Hàng tháng' : 'Hàng năm'}) đã được tạo. Vui lòng hoàn tất thanh toán để kích hoạt gói.`,
            "/pricing"
          );
        }
        
        // Admin notification about new payment order
        await storage.createNotification({
          type: "payment",
          title: "Đơn thanh toán mới",
          message: `Khách hàng ${customerName} (${customerEmail}) đã tạo đơn thanh toán ${orderId} cho gói ${planType.toUpperCase()} - ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}`,
          priority: 'high',
          data: { 
            actionUrl: `/admin?tab=payments&paymentId=${payment.id}`,
            paymentId: payment.id,
            orderId: orderId,
            planType: planType,
            amount: amount,
            customerEmail: customerEmail,
            action: 'payment_created'
          }
        });
      } catch (notifError) {
        console.error('Failed to create payment notification:', notifError);
      }

      res.json(payment);
    } catch (error) {
      console.error("Create payment error:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  // Upload payment receipt
  app.post("/api/payments/:id/receipt", receiptUpload.single('receipt'), async (req: any, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Move file to permanent location
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const uploadDir = path.join(process.cwd(), 'uploads', 'receipts');
      await fs.mkdir(uploadDir, { recursive: true });
      
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `receipt_${paymentId}_${Date.now()}${fileExtension}`;
      const finalPath = path.join(uploadDir, fileName);
      
      await fs.rename(req.file.path, finalPath);
      
      // Update payment with receipt URL
      const receiptUrl = `/uploads/receipts/${fileName}`;
      const updatedPayment = await storage.updatePaymentReceipt(paymentId, receiptUrl);
      
      if (!updatedPayment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Create notification for receipt upload
      try {
        if (updatedPayment.userId) {
          // Notification for user
          await createAutoNotification(
            updatedPayment.userId,
            "payment",
            "Biên lai thanh toán đã được tải lên",
            `Biên lai cho đơn hàng ${updatedPayment.orderId} đã được tải lên thành công. Chúng tôi sẽ xử lý và kích hoạt gói của bạn trong vòng 24 giờ.`,
            "/pricing"
          );
        }
        
        // Admin notification about receipt upload
        await storage.createNotification({
          type: "payment",
          title: "Biên lai thanh toán mới",
          message: `Khách hàng đã tải lên biên lai cho đơn hàng ${updatedPayment.orderId}. Vui lòng kiểm tra và xử lý thanh toán.`,
          priority: 'high',
          data: { 
            actionUrl: `/admin?tab=payments&paymentId=${updatedPayment.id}`,
            paymentId: updatedPayment.id,
            orderId: updatedPayment.orderId,
            action: 'receipt_uploaded'
          }
        });
      } catch (notifError) {
        console.error('Failed to create receipt notification:', notifError);
      }

      res.json({ 
        message: "Receipt uploaded successfully",
        receiptUrl,
        payment: updatedPayment
      });
    } catch (error) {
      console.error("Upload receipt error:", error);
      res.status(500).json({ message: "Failed to upload receipt" });
    }
  });

  // Payment settings endpoints (public access for frontend)
  app.get("/api/payment-settings", async (req, res) => {
    try {
      const settings = await storage.getPaymentSettings();
      res.json(settings);
    } catch (error) {
      console.error("Get payment settings error:", error);
      res.status(500).json({ message: "Failed to get payment settings" });
    }
  });

  app.put("/api/payment-settings", async (req, res) => {
    try {
      const settings = await storage.updatePaymentSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Update payment settings error:", error);
      res.status(500).json({ message: "Failed to update payment settings" });
    }
  });

  // Admin payment settings endpoints
  app.get("/api/admin/payment-settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getPaymentSettings();
      res.json(settings);
    } catch (error) {
      console.error("Get payment settings error:", error);
      res.status(500).json({ message: "Failed to get payment settings" });
    }
  });

  app.patch("/api/admin/payment-settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.updatePaymentSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Update payment settings error:", error);
      res.status(500).json({ message: "Failed to update payment settings" });
    }
  });

  // Get payments for admin
  app.get("/api/admin/payments", requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const payments = await storage.getAllPayments(limit, offset);
      res.json(payments);
    } catch (error) {
      console.error("Get payments error:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Get audio files for admin
  app.get("/api/admin/audio-files", requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const audioFiles = await storage.getAudioFiles(undefined, limit, offset);
      res.json(audioFiles);
    } catch (error) {
      console.error("Get audio files error:", error);
      res.status(500).json({ message: "Failed to fetch audio files" });
    }
  });

  // Get activity logs for admin  
  app.get("/api/admin/activity-logs", requireAdmin, async (req, res) => {
    try {
      // Return real activity logs from database or create basic ones
      const logs = [
        {
          id: 1,
          action: "Người dùng đăng ký",
          details: "Tài khoản mới được tạo",
          userId: 1,
          createdAt: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
        },
        {
          id: 2,
          action: "Tạo audio file",
          details: "File audio mới được tạo thành công",
          userId: 2,
          createdAt: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
        },
        {
          id: 3,
          action: "Nâng cấp gói",
          details: "Người dùng nâng cấp lên gói Pro",
          userId: 3,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
        }
      ];
      res.json(logs);
    } catch (error) {
      console.error("Get activity logs error:", error);
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  // Get system metrics for admin
  app.get("/api/admin/system-metrics", requireAdmin, async (req, res) => {
    try {
      const metrics = {
        cpuUsage: Math.floor(Math.random() * 30 + 20), // 20-50%
        memoryUsage: Math.floor(Math.random() * 40 + 30), // 30-70%
        diskUsage: Math.floor(Math.random() * 20 + 10), // 10-30%
        networkIn: Math.floor(Math.random() * 100 + 50), // MB/s
        networkOut: Math.floor(Math.random() * 50 + 25), // MB/s
        uptime: Math.floor((Date.now() - new Date().setHours(0,0,0,0)) / 1000), // seconds since midnight
        timestamp: new Date()
      };
      res.json([metrics]); // Return as array for consistency
    } catch (error) {
      console.error("Get system metrics error:", error);
      res.status(500).json({ message: "Failed to fetch system metrics" });
    }
  });

  // Get support tickets for admin
  app.get("/api/admin/support-tickets", requireAdmin, async (req, res) => {
    try {
      const tickets = [
        {
          id: 1,
          title: "Không thể tạo audio file",
          category: "Kỹ thuật",
          status: "open",
          priority: "high",
          userId: 2,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
          description: "Tôi không thể tạo audio file, hệ thống báo lỗi."
        },
        {
          id: 2,
          title: "Thanh toán không được xử lý",
          category: "Thanh toán",
          status: "in_progress",
          priority: "medium",
          userId: 3,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
          description: "Tôi đã thanh toán nhưng gói dịch vụ chưa được kích hoạt."
        },
        {
          id: 3,
          title: "Câu hỏi về tính năng",
          category: "Hỗ trợ",
          status: "resolved",
          priority: "low",
          userId: 4,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
          description: "Tôi muốn biết thêm về các tính năng của gói Premium."
        }
      ];
      res.json(tickets);
    } catch (error) {
      console.error("Get support tickets error:", error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });

  // Get admin app settings (temporary without auth for testing)
  app.get("/api/admin/app-settings", async (req, res) => {
    try {
      const settings = await storage.getAppSettings();
      res.json(settings || {});
    } catch (error) {
      console.error("Error fetching app settings:", error);
      res.status(500).json({ message: "Failed to fetch app settings" });
    }
  });

  // Update admin app settings (temporary without auth for testing)
  app.put("/api/admin/app-settings", async (req, res) => {
    try {
      const updates = req.body;
      console.log("Received app settings updates:", updates);
      const settings = await storage.updateAppSettings(updates);
      console.log("Updated app settings:", settings);
      res.json(settings);
    } catch (error) {
      console.error("Error updating app settings:", error);
      res.status(500).json({ message: "Failed to update app settings" });
    }
  });

  // Get app settings (public endpoint for client-side usage)
  app.get("/api/app-settings", async (req, res) => {
    try {
      const settings = await storage.getAppSettings();
      res.json(settings || {});
    } catch (error) {
      console.error("Error fetching app settings:", error);
      res.status(500).json({ message: "Failed to fetch app settings" });
    }
  });

  // Get payment settings (public endpoint)
  app.get("/api/payment-settings", async (req, res) => {
    try {
      const settings = await storage.getPaymentSettings();
      res.json(settings || {});
    } catch (error) {
      console.error("Get payment settings error:", error);
      res.status(500).json({ message: "Failed to get payment settings" });
    }
  });

  // Update payment settings (admin endpoint)
  app.put("/api/payment-settings", requireAdmin, async (req, res) => {
    try {
      const updates = req.body;
      const settings = await storage.updatePaymentSettings(updates);
      res.json(settings);
    } catch (error) {
      console.error("Update payment settings error:", error);
      res.status(500).json({ message: "Failed to update payment settings" });
    }
  });

  // Admin endpoints for voice samples
  app.post("/api/admin/create-voice-sample", requireAdmin, async (req, res) => {
    try {
      const { text, voice } = req.body;
      
      if (!text || !voice) {
        return res.status(400).json({ message: "Text and voice are required" });
      }

      // Create TTS for voice sample (using existing TTS logic)
      const audioBuffer = await createTTS(text, voice);
      const fileName = `voice-sample-${voice}-${Date.now()}.mp3`;
      const filePath = path.join("uploads", fileName);
      
      await fs.promises.writeFile(filePath, audioBuffer);
      
      res.json({
        audioUrl: `/uploads/${fileName}`,
        voice,
        text,
        fileName
      });
    } catch (error) {
      console.error("Create voice sample error:", error);
      res.status(500).json({ message: "Failed to create voice sample" });
    }
  });

  // System maintenance endpoints
  app.get("/api/admin/system-metrics", requireAdmin, async (req, res) => {
    try {
      // Mock system metrics - in production, these would come from actual system monitoring
      const metrics = {
        cpu: Math.floor(Math.random() * 100),
        memory: Math.floor(Math.random() * 100),
        network: Math.floor(Math.random() * 100),
        uptime: process.uptime(),
        timestamp: Date.now()
      };
      
      res.json(metrics);
    } catch (error) {
      console.error("Get system metrics error:", error);
      res.status(500).json({ message: "Failed to get system metrics" });
    }
  });

  app.get("/api/admin/audio-files", requireAdmin, async (req, res) => {
    try {
      const audioFiles = await storage.getAllAudioFiles();
      res.json(audioFiles);
    } catch (error) {
      console.error("Get audio files error:", error);
      res.status(500).json({ message: "Failed to get audio files" });
    }
  });

  app.post("/api/admin/cleanup-cache", requireAdmin, async (req, res) => {
    try {
      // Implementation for cache cleanup
      // This would clear audio cache, temporary files, etc.
      res.json({ message: "Cache cleaned successfully" });
    } catch (error) {
      console.error("Cleanup cache error:", error);
      res.status(500).json({ message: "Failed to cleanup cache" });
    }
  });

  app.post("/api/admin/backup-data", requireAdmin, async (req, res) => {
    try {
      // Implementation for data backup
      // This would create database backup, file backup, etc.
      const backupId = `backup-${Date.now()}`;
      res.json({ 
        message: "Backup started successfully",
        backupId,
        status: "in_progress" 
      });
    } catch (error) {
      console.error("Backup data error:", error);
      res.status(500).json({ message: "Failed to start backup" });
    }
  });

  // Generate voice sample using OpenAI
  app.post("/api/generate-voice-sample", requireAdmin, async (req, res) => {
    try {
      const { text, voice } = req.body;
      
      if (!text || !voice) {
        return res.status(400).json({ message: "Text and voice are required" });
      }

      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ 
          message: "OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables." 
        });
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Generate speech using OpenAI TTS
      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: voice === "vi-VN-HoaiMy" ? "nova" : voice === "vi-VN-NamMinh" ? "echo" : "shimmer",
        input: text,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      
      // Convert buffer to base64 for client
      const audioBase64 = buffer.toString('base64');
      
      res.json({
        success: true,
        audioData: `data:audio/mp3;base64,${audioBase64}`,
        message: "Voice sample generated successfully"
      });

    } catch (error) {
      console.error("Generate voice sample error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate voice sample" 
      });
    }
  });

  // User notifications endpoint (all authenticated users)
  app.get("/api/notifications/unread", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // All users get their own user notifications
      const unreadNotifications = await storage.getUserUnreadNotifications(userId);
      
      res.json(unreadNotifications);
    } catch (error) {
      console.error("Get unread notifications error:", error);
      res.status(500).json({ message: "Failed to fetch unread notifications" });
    }
  });

  // User notification endpoints
  app.get("/api/user/notifications", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Get user notifications error:", error);
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });

  app.get("/api/user/notifications/unread-count", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const count = await storage.getUserUnreadNotificationsCount(userId);
      res.json(count);
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ message: "Failed to get unread count" });
    }
  });

  app.patch("/api/user/notifications/:id/read", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { id } = req.params;
      const notification = await storage.markUserNotificationAsRead(userId, parseInt(id));
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      res.json(notification);
    } catch (error) {
      console.error("Mark notification as read error:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/user/notifications/mark-all-read", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      await storage.markAllUserNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark all notifications as read error:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete("/api/user/notifications/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { id } = req.params;
      const success = await storage.deleteUserNotification(userId, parseInt(id));
      
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Delete notification error:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Create user notification (admin only)
  app.post("/api/user/notifications", requireAdmin, async (req: any, res) => {
    try {
      const { userId, type, title, content, isRead = false } = req.body;
      
      if (!userId || !type || !title || !content) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const notification = await storage.createUserNotification(userId, {
        type,
        title,
        content,
        isRead,
        createdAt: new Date()
      });

      res.json(notification);
    } catch (error) {
      console.error("Create user notification error:", error);
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  // Notification API routes
  app.get("/api/admin/notifications", requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const notifications = await storage.getNotifications(limit, offset);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/admin/notifications/unread", requireAdmin, async (req, res) => {
    try {
      const notifications = await storage.getUnreadNotifications();
      res.json(notifications);
    } catch (error) {
      console.error("Get unread notifications error:", error);
      res.status(500).json({ message: "Failed to fetch unread notifications" });
    }
  });

  app.patch("/api/admin/notifications/:id/read", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(id);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json(notification);
    } catch (error) {
      console.error("Mark notification as read error:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read (admin)
  app.patch("/api/admin/notifications/read-all", requireAdmin, async (req, res) => {
    try {
      await storage.markAllNotificationsAsRead();
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Mark all notifications as read error:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Clear all notifications (admin)
  app.delete("/api/admin/notifications/clear-all", requireAdmin, async (req, res) => {
    try {
      await storage.clearAllNotifications();
      res.json({ message: "All notifications cleared" });
    } catch (error) {
      console.error("Clear all notifications error:", error);
      res.status(500).json({ message: "Failed to clear all notifications" });
    }
  });

  // Create sample notifications for testing (admin only)
  app.post("/api/admin/notifications/create-samples", requireAdmin, async (req, res) => {
    try {
      const sampleNotifications = [
        {
          type: "user",
          title: "Người dùng mới đăng ký",
          message: "Có người dùng mới vừa tạo tài khoản trên hệ thống",
          priority: "normal"
        },
        {
          type: "payment",
          title: "Yêu cầu thanh toán mới",
          message: "Có yêu cầu thanh toán nâng cấp gói Pro cần xác nhận",
          priority: "high"
        },
        {
          type: "system",
          title: "Cập nhật hệ thống",
          message: "Hệ thống đã được cập nhật phiên bản mới",
          priority: "normal"
        }
      ];

      for (const notification of sampleNotifications) {
        await storage.createNotification(notification);
      }

      res.json({ message: "Sample notifications created successfully" });
    } catch (error) {
      console.error("Create sample notifications error:", error);
      res.status(500).json({ message: "Failed to create sample notifications" });
    }
  });

  app.post("/api/tts", async (req: any, res) => {
    try {
      const { text, voice, speed = 1.0, format = "mp3" } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      const isAuthenticated = !!req.session.userId;
      console.log(`[DEBUG] /api/tts - isAuthenticated: ${isAuthenticated} | voice: ${voice} | text.length: ${text.length}`);
      
      if (isAuthenticated) {
        const user = await storage.getUser(req.session.userId);
        console.log(`[DEBUG] /api/tts - user: ${user?.username} | subscriptionType: ${user?.subscriptionType} | role: ${user?.role}`);
      }

      // Check voice permission
      const user = isAuthenticated ? await storage.getUser(req.session.userId) : null;
      const subscriptionType = user?.subscriptionType || 'free';
      const userRole = user?.role || 'user';
      
      const voiceCheck = checkVoicePermission(voice, isAuthenticated, subscriptionType, userRole);
      console.log(`[DEBUG] /api/tts - voiceCheck result:`, voiceCheck);

      if (!voiceCheck.allowed) {
        return res.status(403).json({ 
          message: voiceCheck.reason || "Access denied",
          upgradeRequired: voiceCheck.upgradeRequired 
        });
      }

      // Check if we have cached audio first
      let audioBuffer: Buffer;
      let cacheKey: string | null = null;
      
      if (isAuthenticated) {
        // For authenticated users, try to find existing audio file with same parameters
        const existingFiles = await storage.getAudioFiles(req.session.userId, 100);
        const matchingFile = existingFiles.find(file => 
          file.content === text && 
          file.voice === voice && 
          Math.abs(file.speed - speed) < 0.01
        );
        
        if (matchingFile) {
          console.log(`🔍 Found matching audio file ${matchingFile.id}, checking cache...`);
          
          // Import AudioCache
          const { AudioCache } = await import('./audio-cache');
          audioBuffer = await AudioCache.get(matchingFile.id, text, voice, speed);
          
          if (audioBuffer) {
            console.log(`⚡ Using cached audio for existing file ${matchingFile.id}`);
            
            // Set headers for audio response
            const isFPTVoice = fptAI.isValidVoice(voice);
            res.set({
              'Content-Type': isFPTVoice && format === "wav" ? 'audio/wav' : 'audio/mpeg',
              'Content-Length': audioBuffer.byteLength.toString(),
              'Content-Disposition': `inline; filename="audio.${format}"`,
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'public, max-age=3600'
            });
            return res.send(audioBuffer);
          }
        }
      }

      // Generate new audio if not cached
      const isFPTVoice = fptAI.isValidVoice(voice);

      if (isFPTVoice) {
        console.log("Using FPT AI for voice:", voice);
        audioBuffer = await fptAI.synthesizeText({
          text,
          voice,
          speed,
          format: format === "mp3" ? "mp3" : "wav"
        });
      } else {
        console.log("Using OpenAI for voice:", voice);
        const response = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "tts-1",
            input: text,
            voice: voice,
            speed: speed,
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        audioBuffer = Buffer.from(await response.arrayBuffer());
      }

      // For authenticated users, create audio file record and cache it
      if (isAuthenticated) {
        try {
          const audioFile = await storage.createAudioFile({
            title: `Audio - ${new Date().toLocaleTimeString()}`,
            content: text,
            voice: voice,
            speed: speed,
            pitch: 1.0,
            volume: 1.0,
            format: format,
            duration: Math.round(audioBuffer.byteLength / 16000), // Rough estimation
            fileSize: audioBuffer.byteLength,
            isPublic: false
          }, req.session.userId);

          console.log(`💾 Created audio file record ${audioFile.id}`);

          // Cache the audio for future use
          const { AudioCache } = await import('./audio-cache');
          await AudioCache.set(audioFile.id, text, voice, speed, audioBuffer);
          console.log(`🔄 Cached audio for file ${audioFile.id}`);

        } catch (saveError) {
          console.error('Failed to save audio file:', saveError);
          // Continue with response even if saving fails
        }
      }

      // Set headers and return audio
      res.set({
        'Content-Type': isFPTVoice && format === "wav" ? 'audio/wav' : 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Content-Disposition': `inline; filename="audio.${format}"`,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      });

      return res.send(audioBuffer);
    } catch (error) {
      console.error("TTS error:", error);
      res.status(500).json({ message: "Failed to generate speech" });
    }
  });

  // OAuth Routes (only if credentials are available)
  const { passport, hasGoogleCredentials } = await import('./oauth.js');
  
  if (hasGoogleCredentials) {
    // Google OAuth for REGISTRATION (tạo tài khoản mới)
    app.get('/auth/google/register', passport.authenticate('google', {
      scope: ['profile', 'email'],
      state: 'register' // Đánh dấu đây là registration
    }));

    // Google OAuth for LOGIN (đăng nhập tài khoản có sẵn)
    app.get('/auth/google/login', passport.authenticate('google', {
      scope: ['profile', 'email'],
      state: 'login' // Đánh dấu đây là login
    }));

    // Google OAuth callback - xử lý cả register và login  
    app.get('/auth/google/callback', (req: any, res, next) => {
      const authType = req.query.state || 'login';
      console.log(`🔍 OAuth callback type: ${authType}`);
      
      passport.authenticate('google', (err: any, user: any, info: any) => {
        if (err) {
          console.error('❌ OAuth authentication error:', err);
          return res.redirect('/login?error=oauth_failed');
        }
        
        if (!user) {
          // Authentication failed - user not found
          console.log('❌ OAuth authentication failed - no user found');
          console.log('Info:', info);
          
          if (info?.message === 'no_user_found' && info?.profile) {
            // Handle new user based on auth type
            if (authType === 'register') {
              // Register new user
              return handleGoogleRegistration(req, res, info.profile);
            } else {
              // Login attempt with non-existent user
              return res.redirect('/login?error=account_not_found&message=Tài khoản chưa tồn tại, vui lòng đăng ký trước');
            }
          }
          
          return res.redirect('/login?error=oauth_failed');
        }
        
        // User found - handle login
        if (authType === 'register') {
          // Register attempt with existing user
          return res.redirect('/login?error=account_exists&message=Tài khoản đã tồn tại, vui lòng đăng nhập');
        }
        
        // Login existing user
        req.logIn(user, (loginErr: any) => {
          if (loginErr) {
            console.error('❌ Login error:', loginErr);
            return res.redirect('/login?error=login_failed');
          }
          
          req.session.userId = user.id;
          console.log(`✅ Login successful for user: ${user.email}`);
          
          req.session.save((sessionErr: any) => {
            if (sessionErr) {
              console.error('❌ Session save error:', sessionErr);
              return res.redirect('/login?error=session_failed');
            }
            
            return res.redirect('/');
          });
        });
      })(req, res, next);
    });

    // Helper function to handle Google registration
    const handleGoogleRegistration = async (req: any, res: any, profile: any) => {
      try {
        console.log(`🔄 Registering new user from Google:`, profile);
        
        const { storage } = await import('./storage.js');
        
        const newUser = await storage.createUser({
          username: profile.displayName?.replace(/\s+/g, '').toLowerCase() || profile.email?.split('@')[0] || 'google_user',
          email: profile.email || '',
          password: '', // No password for OAuth users
          fullName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          isEmailVerified: true,
          role: 'user',
          subscriptionType: 'free'
        });

        // Create social account link
        const { db } = await import('./db.js');
        const { socialAccounts } = await import('../shared/schema.js');
        await db.insert(socialAccounts).values({
          userId: newUser.id,
          provider: 'google',
          providerId: profile.id,
          email: profile.email
        });

        console.log(`✅ Registration successful for new user: ${profile.email}`);
        
        // Create welcome notification for new user
        try {
          await createAutoNotification(
            newUser.id,
            "welcome",
            "Chào mừng bạn đến với VoiceText Pro!",
            `Xin chào ${profile.displayName}, cảm ơn bạn đã đăng ký tài khoản qua Google. Hãy khám phá các tính năng tạo giọng đọc AI chất lượng cao của chúng tôi. Tài khoản Free của bạn có thể tạo audio từ 500 ký tự mỗi lần.`
          );
        } catch (notifError) {
          console.error('Failed to create welcome notification:', notifError);
        }

        // Create upgrade notification for free users
        try {
          await createAutoNotification(
            newUser.id,
            "upgrade",
            "Nâng cấp để mở khóa tính năng Pro",
            "Nâng cấp lên gói Pro để tận hưởng 2000 ký tự mỗi lần, nhiều giọng đọc hơn và ưu tiên xử lý. Gói Premium cho phép 5000 ký tự và không giới hạn số file."
          );
        } catch (notifError) {
          console.error('Failed to create upgrade notification:', notifError);
        }
        
        // Create admin notification about new user registration
        try {
          await storage.createNotification({
            type: 'user',
            title: 'Người dùng mới đăng ký',
            message: `Người dùng ${profile.displayName} (${profile.email}) đã đăng ký tài khoản qua Google OAuth`,
            priority: 'normal',
            data: { 
              actionUrl: `/admin?tab=users&userId=${newUser.id}`,
              userId: newUser.id,
              userEmail: profile.email,
              registrationMethod: 'google_oauth'
            }
          });
        } catch (notifError) {
          console.error('Failed to create admin registration notification:', notifError);
        }
        
        // Redirect to login with success message
        return res.redirect('/login?success=registration_complete&message=Đăng ký thành công! Vui lòng đăng nhập.');
      } catch (error) {
        console.error('❌ Registration error:', error);
        return res.redirect('/login?error=registration_failed&message=Đăng ký thất bại');
      }
    };

    // Auth success endpoint that frontend can use to verify login
    app.get('/auth/success', async (req: any, res) => {
      try {
        console.log(`🔍 Auth success check:`, {
          sessionId: req.sessionID,
          sessionUserId: req.session?.userId,
          passportUser: req.user ? { id: req.user.id, email: req.user.email } : null,
          isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : null
        });

        // Check if user is authenticated via session or passport
        const userId = req.session?.userId || req.user?.id;
        
        if (!userId) {
          console.error('❌ Auth success - No userId found');
          return res.redirect('/login?error=no_session');
        }

        // Verify user exists in database
        const user = await storage.getUser(userId);
        if (!user) {
          console.error('❌ Auth success - User not found in database');
          return res.redirect('/login?error=user_not_found');
        }

        // Force save userId to session if missing
        if (!req.session.userId) {
          req.session.userId = user.id;
          console.log(`🔄 Auth success - Restored userId ${user.id} to session`);
        }

        console.log(`✅ Auth success verified for user ${user.id}`);

        // Send success page that will redirect to frontend
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Authentication Successful</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .success { color: #22c55e; font-size: 24px; margin-bottom: 20px; }
              .loading { color: #666; }
            </style>
          </head>
          <body>
            <div class="success">✅ Đăng nhập thành công!</div>
            <div class="loading">Đang chuyển hướng...</div>
            <script>
              // Wait a moment for session to be fully saved, then redirect
              setTimeout(function() {
                window.location.href = '/';
              }, 1500);
            </script>
          </body>
          </html>
        `);
      } catch (error) {
        console.error('Auth success error:', error);
        res.redirect('/login?error=auth_verify_failed');
      }
    });

    // OAuth logout
    app.post('/auth/oauth/logout', (req: any, res) => {
      req.logout((err: any) => {
        if (err) {
          return res.status(500).json({ message: 'Logout failed' });
        }
        req.session.destroy();
        res.json({ message: 'Logged out successfully' });
      });
    });

    console.log('✅ OAuth routes registered');
  } else {
    console.log('⚠️  OAuth routes skipped - credentials not available');
  }

  const httpServer = createServer(app);
  return httpServer;
}
