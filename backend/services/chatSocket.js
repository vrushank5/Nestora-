const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const User = require("../models/User");
const { setChatIo } = require("./chatRealtime");

const attachChatSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: "*" },
    transports: ["websocket", "polling"],
  });
  const secret = process.env.JWT_SECRET || "nestora_jwt_secret_key_2026";

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (typeof token !== "string" || !token) {
        return next(new Error("Authentication required"));
      }
      const decoded = jwt.verify(token, secret);
      const userId = Number(decoded.userId);
      const roleId = Number(decoded.roleId);
      if (!Number.isSafeInteger(userId) || userId <= 0 || ![1, 2, 3].includes(roleId)) {
        return next(new Error("Invalid authentication token"));
      }
      const user = await User.findOne({ userId, roleId, isActive: true })
        .select("userId roleId")
        .lean();
      if (!user) return next(new Error("Account is inactive or unavailable"));
      socket.data.user = { userId: user.userId, roleId: user.roleId };
      return next();
    } catch (error) {
      return next(new Error("Invalid authentication token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.data.user.userId}`);
  });

  setChatIo(io);
  return io;
};

module.exports = attachChatSocket;
