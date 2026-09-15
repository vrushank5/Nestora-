const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema({
  ownerId: { type: Number, required: true },
  day: { type: String, required: true },
  breakfast: { type: String, default: "" },
  lunch: { type: String, default: "" },
  dinner: { type: String, default: "" },
}, { timestamps: true });

menuSchema.index({ ownerId: 1, day: 1 }, { unique: true });

module.exports = mongoose.model("Menu", menuSchema, "menu");
