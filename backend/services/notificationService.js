const User = require("../models/User");
const Notification = require("../models/Notification");
const { emitNotification } = require("./chatRealtime");

const createNotification = async ({
  recipientId,
  roleId,
  type = "system",
  title,
  message,
  link = "",
  actorId = null,
  actorRoleId = null,
}) => {
  const recipient = Number(recipientId);
  const role = Number(roleId);
  if (!Number.isSafeInteger(recipient) || recipient <= 0 || ![1, 2, 3].includes(role)) {
    throw new Error("A valid notification recipient is required");
  }
  if (role === 2) {
    const settingByType = {
      booking: "bookingRequests",
      payment: "paymentUpdates",
      message: "residentMessages",
    };
    const setting = settingByType[type];
    if (setting) {
      const owner = await User.findOne({ userId: recipient, roleId: 2 })
        .select("ownerSettings.notifications")
        .lean();
      if (owner?.ownerSettings?.notifications?.[setting] === false) return null;
    }
  }
  const notification = await Notification.create({
    recipientId: recipient,
    roleId: role,
    type,
    title,
    message,
    link,
    actorId: actorId == null ? null : Number(actorId),
    actorRoleId: actorRoleId == null ? null : Number(actorRoleId),
  });
  emitNotification(recipient, notification);
  return notification;
};

const notifyActiveRole = async (roleId, notification) => {
  const role = Number(roleId);
  if (![1, 2, 3].includes(role)) throw new Error("Invalid notification audience role");
  const users = await User.find({ roleId: role, isActive: true }).select("userId").lean();
  if (!users.length) return 0;
  const documents = users.map((user) => ({
    recipientId: user.userId,
    roleId: role,
    ...notification,
  }));
  const created = await Notification.insertMany(documents);
  for (const item of created) emitNotification(item.recipientId, item);
  return created.length;
};

const notifySafely = async (label, operation) => {
  try {
    await operation();
  } catch (error) {
    console.error(`${label} notification failed:`, error);
  }
};

module.exports = { createNotification, notifyActiveRole, notifySafely };
