const User = require("../models/User");
const Property = require("../models/Property");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Review = require("../models/Review");
const Menu = require("../models/Menu");

const requireOwner = (req, res, next) => {
  if (Number(req.user?.roleId) !== 2)
    return res
      .status(403)
      .json({ success: false, message: "Owner access required" });
  return next();
};

const getOwnerData = async (req, res) => {
  try {
    const ownerId = Number(req.user.userId);
    const collection = req.params.collection;

    if (collection === "reviews") {
      const ownerProperties = await Property.find({ ownerId }).select("propertyId").lean();
      const propertyIds = ownerProperties.map((p) => p.propertyId);
      const records = await Review.find({ propertyId: { $in: propertyIds }, isActive: true })
        .sort({ createdAt: -1 })
        .lean();
      return res.json({ success: true, data: records });
    }

    const query = { ownerId };
    const Model = {
      bookings: Booking,
      payments: Payment,
      residents: User,
    }[collection];
    if (!Model) return res.json({ success: true, data: [] });
    const records = await Model.find(query).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: records });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load owner data" });
  }
};

const getOwnerSummary = async (req, res) => {
  try {
    const ownerId = Number(req.user.userId);
    const [properties, bookings, payments, residents] = await Promise.all([
      Property.find({ ownerId })
        .select("isActive priceValue occupancy rating")
        .lean(),
      Booking.find({ ownerId }).lean(),
      Payment.find({ ownerId }).lean(),
      User.find({ roleId: 3, ownerId }).countDocuments(),
    ]);
    const paid = payments.filter(
      (payment) => String(payment.status || "").toLowerCase() === "paid",
    );
    const revenue = paid.reduce(
      (sum, payment) =>
        sum + Number(String(payment.amount || 0).replace(/[^0-9.]/g, "")),
      0,
    );
    return res.json({
      success: true,
      data: {
        properties: properties.length,
        activeProperties: properties.filter(
          (property) => property.isActive !== false,
        ).length,
        bookings: bookings.length,
        residents,
        revenue,
        averageRent: properties.length
          ? Math.round(
              properties.reduce(
                (sum, property) => sum + Number(property.priceValue || 0),
                0,
              ) / properties.length,
            )
          : 0,
        occupancy: 0,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load owner summary" });
  }
};

const getOwnerMenu = async (req, res) => {
  try {
    const menu = await Menu.find({ ownerId: Number(req.user.userId) }).sort({ day: 1 }).lean();
    return res.json({ success: true, data: menu });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load menu" });
  }
};

const updateOwnerMenu = async (req, res) => {
  try {
    const { day, breakfast = "", lunch = "", dinner = "" } = req.body;
    if (!day) return res.status(400).json({ success: false, message: "Menu day is required" });
    const menu = await Menu.findOneAndUpdate(
      { ownerId: Number(req.user.userId), day },
      { ownerId: Number(req.user.userId), day, breakfast, lunch, dinner },
      { new: true, upsert: true, runValidators: true },
    ).lean();
    return res.json({ success: true, data: menu });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to save menu" });
  }
};

module.exports = { requireOwner, getOwnerData, getOwnerSummary, getOwnerMenu, updateOwnerMenu };
