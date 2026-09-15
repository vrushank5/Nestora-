const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    favoriteId: {
      type: Number,
      unique: true,
      required: true,
    },
    userId: {
      type: Number,
      required: true,
      index: true,
    },
    propertyId: {
      type: Number,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound unique index so a user cannot favorite the same property twice
favoriteSchema.index({ userId: 1, propertyId: 1 }, { unique: true });

module.exports = mongoose.model("Favorite", favoriteSchema, "favorite");
