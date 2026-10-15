const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const {
  broadcastNotification,
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} = require("../controllers/notificationController");

const router = express.Router();

const requireActiveNotificationUser = async (req, res, next) => {
  try {
    const userId = Number(req.user?.userId);
    const roleId = Number(req.user?.roleId);
    if (!Number.isSafeInteger(userId) || userId <= 0 || ![1, 2, 3].includes(roleId)) {
      return res.status(403).json({ success: false, message: "Notification access is not available." });
    }
    const user = await User.findOne({ userId, roleId, isActive: true }).select("userId").lean();
    if (!user) {
      return res.status(403).json({ success: false, message: "Notification access is not available." });
    }
    return next();
  } catch (error) {
    console.error("requireActiveNotificationUser error:", error);
    return res.status(500).json({ success: false, message: "Unable to verify notification access" });
  }
};

router.use(authMiddleware, requireActiveNotificationUser);
router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);
router.post("/broadcast", broadcastNotification);

module.exports = router;
