let io;

const setChatIo = (socketServer) => {
  io = socketServer;
};

const emitChatMessage = (conversation, message) => {
  if (!io) return;
  const recipients = new Set([
    conversation.residentId,
    conversation.ownerId,
    conversation.assignedAdminId,
  ].filter((id) => Number.isInteger(Number(id)) && Number(id) > 0));
  const payload = message.toObject ? message.toObject() : message;
  for (const userId of recipients) {
    io.to(`user:${userId}`).emit("chat:message", payload);
    io.to(`user:${userId}`).emit("chat:conversation-updated", {
      _id: String(conversation._id),
      lastMessageText: conversation.lastMessageText,
      lastMessageAt: conversation.lastMessageAt,
      lastSenderRole: conversation.lastSenderRole,
      status: conversation.status,
      type: conversation.type,
      residentId: conversation.residentId,
      ownerId: conversation.ownerId,
      propertyId: conversation.propertyId,
      assignedAdminId: conversation.assignedAdminId,
      unreadResident: conversation.unreadResident,
      unreadOwner: conversation.unreadOwner,
      unreadAdmin: conversation.unreadAdmin,
    });
  }
};

const emitConversationState = (conversation) => {
  if (!io) return;
  const recipients = new Set([
    conversation.residentId,
    conversation.ownerId,
    conversation.assignedAdminId,
  ].filter((id) => Number.isInteger(Number(id)) && Number(id) > 0));
  const payload = {
    _id: String(conversation._id),
    status: conversation.status,
    type: conversation.type,
    residentId: conversation.residentId,
    ownerId: conversation.ownerId,
    propertyId: conversation.propertyId,
    assignedAdminId: conversation.assignedAdminId,
    unreadResident: conversation.unreadResident,
    unreadOwner: conversation.unreadOwner,
    unreadAdmin: conversation.unreadAdmin,
  };
  for (const userId of recipients) {
    io.to(`user:${userId}`).emit("chat:conversation-state", payload);
  }
};

const emitChatRead = (conversation, readerId, messageIds) => {
  if (!io) return;
  const recipients = new Set([
    conversation.residentId,
    conversation.ownerId,
    conversation.assignedAdminId,
  ].filter((id) => Number.isInteger(Number(id)) && Number(id) > 0));
  const payload = {
    conversationId: String(conversation._id),
    readerId,
    messageIds: messageIds.map(String),
  };
  for (const userId of recipients) {
    io.to(`user:${userId}`).emit("chat:read", payload);
  }
};

const emitNotification = (recipientId, notification) => {
  if (!io) return;
  const payload = notification.toObject ? notification.toObject() : notification;
  io.to(`user:${recipientId}`).emit("notification:new", {
    id: String(payload._id),
    type: payload.type,
    title: payload.title,
    message: payload.message,
    link: payload.link || "",
    read: Boolean(payload.readAt),
    readAt: payload.readAt || null,
    createdAt: payload.createdAt,
  });
};

const emitNotificationRead = (recipientId, notificationIds = null) => {
  if (!io) return;
  io.to(`user:${recipientId}`).emit("notification:read", {
    ids: notificationIds?.map(String) || null,
  });
};

module.exports = {
  emitChatMessage,
  emitChatRead,
  emitConversationState,
  emitNotification,
  emitNotificationRead,
  setChatIo,
};
