const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    reviewId: {
      type: Number,
      unique: true,
      required: true,
    },
    propertyId: {
      type: Number,
      required: true,
      index: true,
    },
    userId: {
      type: Number,
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    ownerReply: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema, "review");

