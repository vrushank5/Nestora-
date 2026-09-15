const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {},
  { strict: false, timestamps: true },
);

module.exports = mongoose.model("Payment", paymentSchema, "payment");
