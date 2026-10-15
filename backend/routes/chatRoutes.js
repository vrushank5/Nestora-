const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const {
  claimConversation,
  getConversationMessages,
  getConversations,
  getSupportQueue,
  handoffToHuman,
  sendMessage,
  startOwnerConversation,
  startSupportConversation,
} = require("../controllers/chatController");

const router = express.Router();
const messageWindows = new Map();
const MESSAGE_WINDOW_MS = 60_000;
const MAX_WRITES_PER_WINDOW = 20;

const requireActiveChatUser = async (req, res, next) => {
  try {
    const userId = Number(req.user?.userId);
    const roleId = Number(req.user?.roleId);
    if (!Number.isSafeInteger(userId) || userId <= 0 || ![1, 2, 3].includes(roleId)) {
      return res.status(403).json({ success: false, message: "Chat access is not available for this account." });
    }
    const user = await User.findOne({ userId, roleId, isActive: true }).select("userId roleId").lean();
    if (!user) {
      return res.status(403).json({ success: false, message: "Chat access is not available for this account." });
    }
    return next();
  } catch (error) {
    console.error("requireActiveChatUser error:", error);
    return res.status(500).json({ success: false, message: "Unable to verify chat access" });
  }
};

const limitChatWrites = (req, res, next) => {
  const userId = Number(req.user?.userId);
  const now = Date.now();
  const current = messageWindows.get(userId);
  const windowState = !current || now - current.startedAt >= MESSAGE_WINDOW_MS
    ? { startedAt: now, count: 0 }
    : current;
  if (windowState.count >= MAX_WRITES_PER_WINDOW) {
    return res.status(429).json({
      success: false,
      message: "You're sending messages too quickly. Please wait a moment.",
    });
  }
  windowState.count += 1;
  messageWindows.set(userId, windowState);
  if (messageWindows.size > 10000) {
    for (const [key, value] of messageWindows) {
      if (now - value.startedAt >= MESSAGE_WINDOW_MS) messageWindows.delete(key);
    }
  }
  return next();
};

router.use(authMiddleware, requireActiveChatUser);
router.get("/conversations", getConversations);
router.get("/conversations/queue", getSupportQueue);
router.post("/conversations/owner", limitChatWrites, startOwnerConversation);
router.post("/conversations/support", limitChatWrites, startSupportConversation);
router.get("/conversations/:id/messages", getConversationMessages);
router.post("/conversations/:id/messages", limitChatWrites, sendMessage);
router.post("/conversations/:id/handoff", limitChatWrites, handoffToHuman);
router.post("/conversations/:id/claim", limitChatWrites, claimConversation);

module.exports = router;
