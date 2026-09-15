const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      unique: true,
      required: true,
    },

    roleId: {
      type: Number,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
    },

    gender: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    occupation: {
      type: String,
      required: true,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    imageUrl: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);