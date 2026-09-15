const mongoose = require("mongoose");

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MongoDB Connection Skipped: MONGO_URI is missing");
    return false;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected Successfully");
    return true;
  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);
    return false;
  }
};

module.exports = connectDB;
