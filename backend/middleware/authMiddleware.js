const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required",
      });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    const secret = process.env.JWT_SECRET || "nestora_jwt_secret_key_2026";
    const decoded = jwt.verify(token, secret);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.name === "TokenExpiredError" ? "Token expired, please log in again" : "Invalid authorization token",
    });
  }
};

module.exports = authMiddleware;