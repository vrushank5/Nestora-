const mongoose = require("mongoose");

const pgTypeSchema = new mongoose.Schema(
  {
    pgTypeId: {
      type: Number,
      unique: true,
      required: true,
    },

    pgTypeName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PgType", pgTypeSchema, "pgtype");
