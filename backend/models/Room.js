const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: Number,
      unique: true,
      required: true,
    },
    propertyId: {
      type: Number,
      required: true,
      index: true,
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },
    roomType: {
      type: String,
      required: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    occupiedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    availableCount: {
      type: Number,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Available", "Occupied", "Under Maintenance"],
      default: "Available",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Pre-save hook to calculate availableCount if not explicitly specified
roomSchema.pre("save", function (next) {
  if (this.availableCount === undefined || this.availableCount === null) {
    this.availableCount = Math.max(0, this.capacity - (this.occupiedCount || 0));
  }
  next();
});

module.exports = mongoose.model("Room", roomSchema, "room");
