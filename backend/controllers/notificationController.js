const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { notifyActiveRole } = require("../services/notificationService");
const { emitNotificationRead } = require("../services/chatRealtime");

const normalizeNotification = (notification) => ({
  id: String(notification._id),
  type: notification.type,
  title: notification.title,
  message: notification.message,
  link: notification.link || "",
  read: Boolean(notification.readAt),
  readAt: notification.readAt,
  createdAt: notification.createdAt,
});

const getNotifications = async (req, res) => {
  try {
    const recipientId = Number(req.user.userId);
    const roleId = Number(req.user.roleId);
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipientId, roleId }).sort({ createdAt: -1 }).limit(100).lean(),
      Notification.countDocuments({ recipientId, roleId, readAt: null }),
    ]);
    return res.json({
      success: true,
      data: notifications.map(normalizeNotification),
      unreadCount,
    });
  } catch (error) {
    console.error("getNotifications error:", error);
    return res.status(500).json({ success: false, message: "Unable to load notifications" });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipientId: Number(req.user.userId),
      roleId: Number(req.user.roleId),
      readAt: null,
    });
    return res.json({ success: true, data: { unreadCount } });
  } catch (error) {
    console.error("getUnreadCount error:", error);
    return res.status(500).json({ success: false, message: "Unable to load notification count" });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipientId: Number(req.user.userId),
        roleId: Number(req.user.roleId),
        readAt: null,
      },
      { $set: { readAt: new Date() } },
      { new: true },
    ).lean();
    if (!notification) {
      const existing = await Notification.exists({
        _id: req.params.id,
        recipientId: Number(req.user.userId),
        roleId: Number(req.user.roleId),
      });
      if (!existing) {
        return res.status(404).json({ success: false, message: "Notification not found" });
      }
    }
    if (notification) {
      emitNotificationRead(Number(req.user.userId), [notification._id]);
    }
    return res.json({ success: true, data: notification ? normalizeNotification(notification) : null });
  } catch (error) {
    console.error("markNotificationRead error:", error);
    return res.status(500).json({ success: false, message: "Unable to mark notification as read" });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const filter = {
      recipientId: Number(req.user.userId),
      roleId: Number(req.user.roleId),
      readAt: null,
    };
    const unreadIds = await Notification.find(filter).distinct("_id");
    const result = await Notification.updateMany(filter,
      { $set: { readAt: new Date() } },
    );
    emitNotificationRead(Number(req.user.userId), unreadIds);
    return res.json({ success: true, data: { modifiedCount: result.modifiedCount } });
  } catch (error) {
    console.error("markAllNotificationsRead error:", error);
    return res.status(500).json({ success: false, message: "Unable to mark notifications as read" });
  }
};

const broadcastNotification = async (req, res) => {
  try {
    if (Number(req.user.roleId) !== 1) {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    const type = typeof req.body?.type === "string" ? req.body.type.toLowerCase() : "system";
    const audience = req.body?.audience;
    const roleIdsByAudience = {
      all: [1, 2, 3],
      residents: [3],
      owners: [2],
      admins: [1],
    };
    if (!title || title.length > 120 || !message || message.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Title is required (up to 120 characters) and message is required (up to 1000 characters).",
      });
    }
    if (!["system", "booking", "payment", "complaint", "property", "visit", "message", "review", "account", "promotion"].includes(type)) {
      return res.status(400).json({ success: false, message: "Choose a valid notification type." });
    }
    if (!roleIdsByAudience[audience]) {
      return res.status(400).json({ success: false, message: "Choose a valid target audience." });
    }
    const actorId = Number(req.user.userId);
    const actor = await User.findOne({ userId: actorId, roleId: 1 }).select("userId").lean();
    if (!actor) {
      return res.status(403).json({ success: false, message: "Admin account is unavailable." });
    }

    let recipients = 0;
    for (const roleId of roleIdsByAudience[audience]) {
      recipients += await notifyActiveRole(roleId, {
        type,
        title,
        message,
        actorId,
        actorRoleId: 1,
      });
    }
    return res.status(201).json({
      success: true,
      message: `Notification delivered to ${recipients} active account${recipients === 1 ? "" : "s"}.`,
      data: { recipients },
    });
  } catch (error) {
    console.error("broadcastNotification error:", error);
    return res.status(500).json({ success: false, message: "Unable to send broadcast notification" });
  }
};

module.exports = {
  broadcastNotification,
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
};
