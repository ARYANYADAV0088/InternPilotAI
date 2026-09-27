import express from "express";
import authMiddleware from "../middleware/authMiddleware";
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../controllers/notificationController";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getMyNotifications);
router.get("/unread-count", getUnreadCount);
router.put("/:id/read", markAsRead);
router.put("/mark-all-read", markAllAsRead);

export default router;
