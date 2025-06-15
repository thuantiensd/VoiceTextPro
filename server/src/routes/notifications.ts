import { Router } from "express";
import { db } from "../db";
import { notifications } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { authenticateToken } from "../middleware/auth";
import { z } from "zod";

const router = Router();

// Get all notifications for current user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userNotifications = await db.query.notifications.findMany({
      where: eq(notifications.userId, req.user.id),
      orderBy: [desc(notifications.createdAt)]
    });
    
    res.json(userNotifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get unread notifications count
router.get("/unread", authenticateToken, async (req, res) => {
  try {
    const unreadNotifications = await db.query.notifications.findMany({
      where: and(
        eq(notifications.userId, req.user.id),
        eq(notifications.isRead, false)
      )
    });
    
    res.json(unreadNotifications);
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Mark a notification as read
router.patch("/:id/read", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify notification belongs to user
    const notification = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.id, parseInt(id)),
        eq(notifications.userId, req.user.id)
      )
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, parseInt(id)));

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Mark all notifications as read
router.patch("/read-all", authenticateToken, async (req, res) => {
  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, req.user.id));

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete all notifications
router.delete("/clear-all", authenticateToken, async (req, res) => {
  try {
    await db
      .delete(notifications)
      .where(eq(notifications.userId, req.user.id));

    res.json({ success: true });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a notification (internal use)
export const createNotification = async (data: {
  userId: number;
  type: 'payment' | 'user' | 'system' | 'audio';
  title: string;
  message: string;
  metadata?: any;
}) => {
  try {
    const [notification] = await db
      .insert(notifications)
      .values({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        isRead: false,
        metadata: data.metadata
      })
      .returning();

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

export default router; 