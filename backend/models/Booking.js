const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {},
  { strict: false, timestamps: true },
);

module.exports = mongoose.model("Booking", bookingSchema, "booking");
