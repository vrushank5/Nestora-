const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema({}, { strict: false, timestamps: true });

module.exports = mongoose.model("Visit", visitSchema, "visit");
