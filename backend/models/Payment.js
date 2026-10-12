const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    transactionId: { type: String, unique: true, sparse: true },
    bookingId: { type: String, index: true },
    residentId: { type: Number, index: true },
    propertyId: { type: Number, index: true },

    // Denormalized display fields
    resident: { type: String, trim: true },
    property: { type: String, trim: true },
    booking: { type: String, trim: true },

    amount: { type: Number, default: 0 },
    method: { type: String, trim: true, default: "Online Gateway" },
    date: { type: String },
    status: {
      type: String,
      enum: ["Paid", "Pending", "Failed", "Refunded"],
      default: "Pending",
    },
  },
  { strict: false, timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema, "payment");
