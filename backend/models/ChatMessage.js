const mongoose = require("mongoose");

const propertyCardSchema = new mongoose.Schema(
  {
    propertyId: { type: Number, required: true },
    name: { type: String, required: true },
    city: { type: String, default: "" },
    area: { type: String, default: "" },
    rent: { type: Number, required: true },
    roomTypes: { type: [String], default: [] },
    amenities: { type: [String], default: [] },
  },
  { _id: false },
);

const chatMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderId: { type: Number, default: null },
    senderRole: {
      type: String,
      enum: ["resident", "owner", "admin", "assistant"],
      required: true,
    },
    content: { type: String, required: true, trim: true, maxlength: 1000 },
    clientMessageId: { type: String, default: null, maxlength: 80 },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatMessage",
      default: null,
      index: true,
    },
    properties: { type: [propertyCardSchema], default: [] },
    readBy: { type: [Number], default: [] },
  },
  { timestamps: true },
);

chatMessageSchema.index({ conversationId: 1, createdAt: -1, _id: -1 });
chatMessageSchema.index(
  { conversationId: 1, senderId: 1, clientMessageId: 1 },
  {
    unique: true,
    partialFilterExpression: { clientMessageId: { $type: "string" } },
  },
);

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
