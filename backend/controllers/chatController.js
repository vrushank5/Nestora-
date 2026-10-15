const crypto = require("crypto");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const ChatMessage = require("../models/ChatMessage");
const Complaint = require("../models/Complaint");
const Conversation = require("../models/Conversation");
const Payment = require("../models/Payment");
const Property = require("../models/Property");
const Room = require("../models/Room");
const User = require("../models/User");
const Visit = require("../models/Visit");
const { generateBotReply } = require("../services/chatBot");
const {
  emitChatMessage,
  emitChatRead,
  emitConversationState,
} = require("../services/chatRealtime");
const {
  createNotification,
  notifyActiveRole,
  notifySafely,
} = require("../services/notificationService");

const roleName = (roleId) => ({ 1: "admin", 2: "owner", 3: "resident" })[Number(roleId)];
const idFor = (req) => Number(req.user.userId);
const getUnreadField = (role) => `unread${role.charAt(0).toUpperCase()}${role.slice(1)}`;

const canAccessConversation = (conversation, user) => {
  const userId = Number(user.userId);
  const roleId = Number(user.roleId);
  if (roleId === 3) return conversation.residentId === userId;
  if (roleId === 2) {
    return conversation.type === "owner" && conversation.ownerId === userId;
  }
  return roleId === 1 && conversation.assignedAdminId === userId;
};

const getConversation = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ success: false, message: "Conversation not found" });
    return null;
  }
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation || !canAccessConversation(conversation, req.user)) {
    res.status(404).json({ success: false, message: "Conversation not found" });
    return null;
  }
  return conversation;
};

const publicConversation = (conversation, role) => ({
  id: String(conversation._id),
  type: conversation.type,
  status: conversation.status,
  residentId: conversation.residentId,
  ownerId: conversation.ownerId,
  propertyId: conversation.propertyId,
  assignedAdminId: conversation.assignedAdminId,
  lastMessageText: conversation.lastMessageText,
  lastMessageAt: conversation.lastMessageAt,
  lastSenderRole: conversation.lastSenderRole,
  unreadCount: Number(conversation[getUnreadField(role)] || 0),
});

const createAssistantConversation = async (residentId) => {
  const conversation = await Conversation.findOneAndUpdate(
    { key: `assistant:${residentId}` },
    {
      $setOnInsert: {
        key: `assistant:${residentId}`,
        type: "assistant",
        status: "bot",
        residentId,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  const welcomeId = `welcome:${String(conversation._id)}`;
  try {
    const message = await ChatMessage.create({
      conversationId: conversation._id,
      senderRole: "assistant",
      clientMessageId: welcomeId,
      content: "Hi! I'm the Nestora Assistant. I can help you find PGs, check your bookings and payments, or guide you through visits and complaints. What can I help with?",
      readBy: [residentId],
    });
    conversation.lastMessageText = message.content;
    conversation.lastMessageAt = message.createdAt;
    conversation.lastSenderRole = "assistant";
    await conversation.save();
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
  return conversation;
};

const requireChatRole = (req, res, roles) => {
  if (!roles.includes(Number(req.user.roleId))) {
    res.status(403).json({ success: false, message: "You do not have permission to access this chat." });
    return false;
  }
  return true;
};

const getConversations = async (req, res) => {
  try {
    const userId = idFor(req);
    const role = roleName(req.user.roleId);
    if (role === "resident") await createAssistantConversation(userId);
    const query = role === "resident"
      ? { residentId: userId }
      : role === "owner"
        ? { ownerId: userId, type: "owner" }
        : { assignedAdminId: userId };
    const conversations = await Conversation.find(query)
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .limit(100)
      .lean();
    const properties = role === "resident"
      ? await getOwnerOptions(userId)
      : [];
    const propertyIds = [...new Set(conversations.map((conversation) => conversation.propertyId).filter(Boolean))];
    const residentIds = [...new Set(conversations.map((conversation) => conversation.residentId).filter(Boolean))];
    const [conversationProperties, residents] = await Promise.all([
      propertyIds.length
        ? Property.find({ propertyId: { $in: propertyIds } }).select("propertyId name city area").lean()
        : [],
      residentIds.length
        ? User.find({ userId: { $in: residentIds } }).select("userId name").lean()
        : [],
    ]);
    const propertyById = new Map(conversationProperties.map((property) => [property.propertyId, property]));
    const residentById = new Map(residents.map((resident) => [resident.userId, resident]));
    return res.json({
      success: true,
      data: conversations.map((conversation) => {
        const property = propertyById.get(conversation.propertyId);
        const resident = residentById.get(conversation.residentId);
        return {
          ...publicConversation(conversation, role),
          title: conversation.type === "assistant"
            ? "Nestora Assistant"
            : conversation.type === "support"
              ? "Nestora Support"
              : role === "resident"
                ? property?.name || "Property owner"
                : resident?.name || "Resident",
          subtitle: conversation.type === "assistant"
            ? "Automated help"
            : conversation.type === "support"
              ? conversation.assignedAdminId ? "Support agent" : "Human support"
              : [property?.area, property?.city].filter(Boolean).join(", "),
        };
      }),
      ownerOptions: properties,
    });
  } catch (error) {
    console.error("getConversations error:", error);
    return res.status(500).json({ success: false, message: "Failed to load conversations" });
  }
};

const getSupportQueue = async (req, res) => {
  try {
    if (!requireChatRole(req, res, [1])) return;
    const conversations = await Conversation.find({
      status: "human",
      assignedAdminId: null,
      $or: [{ type: "support" }, { type: "assistant", ownerId: null }],
    })
      .sort({ lastMessageAt: 1, createdAt: 1 })
      .limit(100)
      .lean();
    const residentIds = [...new Set(conversations.map((conversation) => conversation.residentId))];
    const residents = residentIds.length
      ? await User.find({ userId: { $in: residentIds } }).select("userId name").lean()
      : [];
    const residentById = new Map(residents.map((resident) => [resident.userId, resident]));
    return res.json({
      success: true,
      data: conversations.map((conversation) => ({
        ...publicConversation(conversation, "admin"),
        title: residentById.get(conversation.residentId)?.name || "Resident",
        subtitle: conversation.type === "assistant" ? "Assistant handoff" : "Support request",
      })),
    });
  } catch (error) {
    console.error("getSupportQueue error:", error);
    return res.status(500).json({ success: false, message: "Failed to load support queue" });
  }
};

const getOwnerOptions = async (residentId) => {
  const bookings = await Booking.find({ residentId })
    .select("propertyId")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  const propertyIds = [...new Set(bookings.map((booking) => Number(booking.propertyId)).filter(Number.isFinite))];
  if (!propertyIds.length) return [];
  return Property.find({ propertyId: { $in: propertyIds }, isActive: true })
    .select("propertyId name city area")
    .lean();
};

const getConversationMessages = async (req, res) => {
  try {
    let conversation = await getConversation(req, res);
    if (!conversation) return;
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const filter = { conversationId: conversation._id };
    if (req.query.before) {
      if (!mongoose.isValidObjectId(req.query.before)) {
        return res.status(400).json({ success: false, message: "Invalid message cursor" });
      }
      const beforeMessage = await ChatMessage.findOne({
        _id: req.query.before,
        conversationId: conversation._id,
      }).select("createdAt").lean();
      if (!beforeMessage) {
        return res.status(400).json({ success: false, message: "Invalid message cursor" });
      }
      filter.$or = [
        { createdAt: { $lt: beforeMessage.createdAt } },
        { createdAt: beforeMessage.createdAt, _id: { $lt: beforeMessage._id } },
      ];
    }
    const messages = await ChatMessage.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean();
    const role = roleName(req.user.roleId);
    const userId = idFor(req);
    const unreadIds = messages
      .filter((message) => message.senderId !== userId && !message.readBy.includes(userId))
      .map((message) => message._id);
    await ChatMessage.updateMany(
      { conversationId: conversation._id, senderId: { $ne: userId }, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } },
    );
    await Conversation.updateOne(
      { _id: conversation._id },
      { $set: { [getUnreadField(role)]: 0 } },
    );
    conversation = await Conversation.findById(conversation._id);
    if (unreadIds.length) {
      emitChatRead(conversation, userId, unreadIds);
      emitConversationState(conversation);
    }
    return res.json({
      success: true,
      data: messages.reverse().map((message) =>
        message.senderId !== userId
          ? { ...message, readBy: [...new Set([...(message.readBy || []), userId])] }
          : message
      ),
      hasMore: messages.length === limit,
    });
  } catch (error) {
    console.error("getConversationMessages error:", error);
    return res.status(500).json({ success: false, message: "Failed to load messages" });
  }
};

const emitPersistedMessage = async (conversation, message, senderRole) => {
  const update = {
    $set: {
      lastMessageText: message.content,
      lastMessageAt: message.createdAt,
      lastSenderRole: senderRole,
    },
  };
  const increment = {};
  if (senderRole === "resident") {
    if (conversation.type === "owner") increment.unreadOwner = 1;
    if ((conversation.type === "support" || conversation.type === "assistant") && conversation.assignedAdminId) {
      increment.unreadAdmin = 1;
    }
  } else {
    increment.unreadResident = 1;
  }
  if (Object.keys(increment).length) update.$inc = increment;
  await Conversation.updateOne({ _id: conversation._id }, update);
  const updatedConversation = await Conversation.findById(conversation._id);
  emitChatMessage(updatedConversation, message);
  return updatedConversation;
};

const sendMessage = async (req, res) => {
  try {
    if (!requireChatRole(req, res, [1, 2, 3])) return;
    let conversation = await getConversation(req, res);
    if (!conversation) return;
    const content = typeof req.body?.content === "string"
      ? req.body.content.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim()
      : "";
    if (!content || content.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Messages must contain 1 to 1000 characters.",
      });
    }
    if (conversation.status === "closed") {
      return res.status(409).json({ success: false, message: "This conversation is closed." });
    }
    const senderRole = roleName(req.user.roleId);
    if (senderRole === "admin" && conversation.assignedAdminId !== idFor(req)) {
      return res.status(403).json({ success: false, message: "This conversation is not assigned to you." });
    }
    const clientMessageId = typeof req.body.clientMessageId === "string" &&
      /^[a-zA-Z0-9_-]{8,80}$/.test(req.body.clientMessageId)
      ? req.body.clientMessageId
      : crypto.randomUUID();
    const prior = await ChatMessage.findOne({
      conversationId: conversation._id,
      senderId: idFor(req),
      clientMessageId,
    }).lean();
    if (prior) {
      const reply = await ChatMessage.findOne({
        conversationId: conversation._id,
        replyTo: prior._id,
      }).lean();
      return res.json({
        success: true,
        data: reply ? [prior, reply] : [prior],
        duplicate: true,
      });
    }

    let userMessage;
    try {
      userMessage = await ChatMessage.create({
        conversationId: conversation._id,
        senderId: idFor(req),
        senderRole,
        content,
        clientMessageId,
        readBy: [idFor(req)],
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      const persistedMessage = await ChatMessage.findOne({
        conversationId: conversation._id,
        senderId: idFor(req),
        clientMessageId,
      }).lean();
      if (!persistedMessage) throw error;
      const reply = await ChatMessage.findOne({
        conversationId: conversation._id,
        replyTo: persistedMessage._id,
      }).lean();
      return res.json({
        success: true,
        data: reply ? [persistedMessage, reply] : [persistedMessage],
        duplicate: true,
      });
    }
    conversation = await emitPersistedMessage(conversation, userMessage, senderRole);

    const responseMessages = [userMessage];
    if (senderRole === "resident" && conversation.type === "owner" && conversation.ownerId) {
      await notifySafely("Incoming resident message", () => createNotification({
        recipientId: conversation.ownerId,
        roleId: 2,
        type: "message",
        title: "New resident message",
        message: content.slice(0, 180),
        link: "/owner/messages",
        actorId: idFor(req),
        actorRoleId: 3,
      }));
    } else if (
      senderRole === "resident" &&
      (conversation.type === "support" || (conversation.type === "assistant" && conversation.status === "human")) &&
      !conversation.assignedAdminId
    ) {
      await notifySafely("Unassigned support message", () => notifyActiveRole(1, {
        type: "message",
        title: "New resident support message",
        message: "A resident sent a message in the unassigned support queue.",
        link: "/admin/notifications",
        actorId: idFor(req),
        actorRoleId: 3,
      }));
    } else if (senderRole === "owner" || senderRole === "admin") {
      await notifySafely("Incoming reply", () => createNotification({
        recipientId: conversation.residentId,
        roleId: 3,
        type: "message",
        title: senderRole === "owner" ? "New reply from property owner" : "New support reply",
        message: content.slice(0, 180),
        link: "/resident/messages",
        actorId: idFor(req),
        actorRoleId: Number(req.user.roleId),
      }));
    }
    if (senderRole === "resident" && conversation.type === "assistant" && conversation.status === "bot") {
      const reply = await generateBotReply({
        conversation,
        content,
        residentId: conversation.residentId,
      });
      if (reply.cancelled) {
        conversation = await Conversation.findById(conversation._id);
        return res.status(201).json({
          success: true,
          data: responseMessages,
          conversation: publicConversation(conversation, senderRole),
        });
      }
      const botMessage = await ChatMessage.create({
        conversationId: conversation._id,
        senderRole: "assistant",
        replyTo: userMessage._id,
        content: reply.content,
        properties: reply.properties,
        readBy: [conversation.residentId],
      });
      const savedReply = await Conversation.updateOne(
        { _id: conversation._id, status: "bot" },
        {
          $set: {
            lastMessageText: botMessage.content,
            lastMessageAt: botMessage.createdAt,
            lastSenderRole: "assistant",
          },
        },
      );
      if (savedReply.matchedCount !== 1) {
        await ChatMessage.deleteOne({ _id: botMessage._id });
        conversation = await Conversation.findById(conversation._id);
        return res.status(201).json({
          success: true,
          data: responseMessages,
          conversation: publicConversation(conversation, senderRole),
        });
      }
      conversation = await Conversation.findById(conversation._id);
      responseMessages.push(botMessage);
      emitChatMessage(conversation, botMessage);
    }
    return res.status(201).json({
      success: true,
      data: responseMessages,
      conversation: publicConversation(conversation, senderRole),
    });
  } catch (error) {
    console.error("sendMessage error:", error);
    return res.status(500).json({ success: false, message: "Failed to send message" });
  }
};

const startOwnerConversation = async (req, res) => {
  try {
    if (!requireChatRole(req, res, [3])) return;
    const propertyId = Number(req.body?.propertyId);
    if (!Number.isSafeInteger(propertyId) || propertyId <= 0) {
      return res.status(400).json({ success: false, message: "Choose a valid property." });
    }
    const property = await Property.findOne({ propertyId, isActive: true })
      .select("propertyId ownerId")
      .lean();
    if (!property) {
      return res.status(404).json({ success: false, message: "Active property not found." });
    }
    const residentId = idFor(req);
    const conversation = await Conversation.findOneAndUpdate(
      { key: `owner:${residentId}:${propertyId}` },
      {
        $setOnInsert: {
          key: `owner:${residentId}:${propertyId}`,
          type: "owner",
          status: "human",
          residentId,
          ownerId: Number(property.ownerId),
          propertyId,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return res.status(201).json({ success: true, data: publicConversation(conversation, "resident") });
  } catch (error) {
    console.error("startOwnerConversation error:", error);
    return res.status(500).json({ success: false, message: "Failed to start owner conversation" });
  }
};

const startSupportConversation = async (req, res) => {
  try {
    if (!requireChatRole(req, res, [3])) return;
    const residentId = idFor(req);
    const conversation = await Conversation.findOneAndUpdate(
      { key: `support:${residentId}` },
      {
        $setOnInsert: {
          key: `support:${residentId}`,
          type: "support",
          status: "human",
          residentId,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return res.status(201).json({ success: true, data: publicConversation(conversation, "resident") });
  } catch (error) {
    console.error("startSupportConversation error:", error);
    return res.status(500).json({ success: false, message: "Failed to contact support" });
  }
};

const handoffToHuman = async (req, res) => {
  try {
    if (!requireChatRole(req, res, [3])) return;
    let conversation = await getConversation(req, res);
    if (!conversation) return;
    if (conversation.status === "closed") {
      return res.status(409).json({ success: false, message: "This conversation is closed." });
    }
    if (conversation.type === "owner") {
      return res.status(409).json({
        success: false,
        message: "This conversation already connects you with the property owner.",
      });
    }
    conversation = await Conversation.findOneAndUpdate(
      { _id: conversation._id, status: { $ne: "closed" } },
      { $set: { status: "human" } },
      { new: true },
    );
    if (!conversation) {
      return res.status(409).json({ success: false, message: "This conversation is closed." });
    }
    emitConversationState(conversation);
    await notifySafely("Human support handoff", () => notifyActiveRole(1, {
      type: "message",
      title: "Resident requested human support",
      message: "A resident conversation is waiting for a support agent.",
      link: "/admin/notifications",
      actorId: idFor(req),
      actorRoleId: 3,
    }));
    return res.json({
      success: true,
      data: publicConversation(conversation, "resident"),
      message: "The assistant has stopped replying. Your conversation is available for a human support agent to claim.",
    });
  } catch (error) {
    console.error("handoffToHuman error:", error);
    return res.status(500).json({ success: false, message: "Failed to request human support" });
  }
};

const claimConversation = async (req, res) => {
  try {
    if (!requireChatRole(req, res, [1])) return;
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }
    const conversation = await Conversation.findOneAndUpdate(
      {
        _id: req.params.id,
        status: "human",
        assignedAdminId: null,
        $or: [{ type: "support" }, { type: "assistant", ownerId: null }],
      },
      { $set: { assignedAdminId: idFor(req) } },
      { new: true },
    );
    if (!conversation) {
      return res.status(409).json({
        success: false,
        message: "This support conversation is unavailable or already assigned.",
      });
    }
    emitConversationState(conversation);
    return res.json({ success: true, data: publicConversation(conversation, "admin") });
  } catch (error) {
    console.error("claimConversation error:", error);
    return res.status(500).json({ success: false, message: "Failed to claim conversation" });
  }
};

module.exports = {
  canAccessConversation,
  claimConversation,
  getConversationMessages,
  getConversations,
  getSupportQueue,
  handoffToHuman,
  sendMessage,
  startOwnerConversation,
  startSupportConversation,
};
