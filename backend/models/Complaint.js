const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({}, { strict: false, timestamps: true });

module.exports = mongoose.model("Complaint", complaintSchema, "complaint");
