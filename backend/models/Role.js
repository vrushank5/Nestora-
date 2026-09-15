const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    roleId: {
      type: Number,
      unique: true,
      required: true,
    },

    roleName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  }
);

module.exports = mongoose.model("Role", roleSchema, "role");