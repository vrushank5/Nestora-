const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientId: { type: Number, required: true, index: true },
    roleId: { type: Number, required: true, enum: [1, 2, 3], index: true },
    type: {
      type: String,
      required: true,
      enum: ["system", "booking", "payment", "complaint", "property", "visit", "message", "review", "account", "promotion"],
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    link: { type: String, default: "", maxlength: 200 },
    actorId: { type: Number, default: null },
    actorRoleId: { type: Number, default: null, enum: [1, 2, 3, null] },
    readAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

notificationSchema.index({ recipientId: 1, roleId: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
