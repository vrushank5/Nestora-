const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ["assistant", "owner", "support"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["bot", "human", "closed"],
      default: "bot",
      index: true,
    },
    residentId: { type: Number, required: true, index: true },
    ownerId: { type: Number, default: null, index: true },
    propertyId: { type: Number, default: null, index: true },
    assignedAdminId: { type: Number, default: null, index: true },
    searchActive: { type: Boolean, default: false },
    pendingSearchField: {
      type: String,
      enum: ["city", "area", "budget", "roomType", "gender", null],
      default: null,
    },
    skippedSearchFields: { type: [String], default: [] },
    searchPreferences: {
      city: { type: String, default: "" },
      area: { type: String, default: "" },
      budget: { type: Number, default: null },
      roomType: { type: String, default: "" },
      gender: { type: String, default: "" },
    },
    lastMessageText: { type: String, default: "" },
    lastMessageAt: { type: Date, default: null },
    lastSenderRole: { type: String, default: "" },
    unreadResident: { type: Number, default: 0 },
    unreadOwner: { type: Number, default: 0 },
    unreadAdmin: { type: Number, default: 0 },
  },
  { timestamps: true },
);

conversationSchema.index({ residentId: 1, lastMessageAt: -1 });
conversationSchema.index({ ownerId: 1, status: 1, lastMessageAt: -1 });
conversationSchema.index({ assignedAdminId: 1, status: 1, lastMessageAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
