import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Notification from "../models/Notification";
import mongoose from "mongoose";

export const getMyNotifications = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const notifications = await Notification.find({
      userId: req.userId,
    })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      userId: req.userId,
      read: false,
    });

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUnreadCount = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const unreadCount = await Notification.countDocuments({
      userId: req.userId,
      read: false,
    });

    res.json({ count: unreadCount });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(String(req.params.id))) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.userId,
      },
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Marked as read", notification });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const markAllAsRead = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    await Notification.updateMany(
      { userId: req.userId, read: false },
      { $set: { read: true } }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
