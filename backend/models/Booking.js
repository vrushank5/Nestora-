const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      sparse: true,
    },
    residentId: { type: Number, index: true },
    ownerId: { type: Number, index: true },
    propertyId: { type: Number, index: true },
    roomId: { type: Number, index: true },

    // Denormalized display fields (populated at insert or from JOIN)
    resident: { type: String, trim: true },
    property: { type: String, trim: true },
    room: { type: String, trim: true },

    date: { type: String },         // Move-in date as dd/mm/yyyy
    amount: { type: Number, default: 0 },
    payment: {
      type: String,
      enum: ["Paid", "Pending", "Refunded", "Failed"],
      default: "Pending",
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Active", "Completed", "Cancelled"],
      default: "Pending",
    },
  },
  { strict: false, timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema, "booking");
