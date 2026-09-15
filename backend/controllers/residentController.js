const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Review = require("../models/Review");
const Complaint = require("../models/Complaint");
const Visit = require("../models/Visit");

const requireResident = (req, res, next) => {
  if (Number(req.user?.roleId) !== 3) return res.status(403).json({ success: false, message: "Resident access required" });
  return next();
};

const getResidentData = async (req, res) => {
  try {
    const Model = { bookings: Booking, payments: Payment, reviews: Review, complaints: Complaint, visits: Visit }[req.params.collection];
    if (!Model) return res.json({ success: true, data: [] });
    const data = await Model.find({ $or: [{ residentId: Number(req.user.userId) }, { userId: Number(req.user.userId) }] }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load resident data" });
  }
};

module.exports = { requireResident, getResidentData };