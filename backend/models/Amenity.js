const mongoose = require("mongoose");

const amenitySchema = new mongoose.Schema(
  {
    amenityId: {
      type: Number,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    icon: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      default: "General",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Amenity", amenitySchema, "amenity");
