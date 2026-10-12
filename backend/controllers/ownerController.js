const User = require("../models/User");
const Property = require("../models/Property");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Review = require("../models/Review");
const Menu = require("../models/Menu");
const Complaint = require("../models/Complaint");
const Visit = require("../models/Visit");
const bcrypt = require("bcryptjs");

const defaultOwnerSettings = {
  notifications: {
    bookingRequests: true,
    paymentUpdates: true,
    residentMessages: true,
    productUpdates: false,
  },
  properties: {
    defaultCity: "Ahmedabad",
    defaultAllowedGender: "Unisex",
  },
  payments: {
    payoutMethod: "bank-transfer",
    payoutEmail: "",
  },
  privacy: {
    shareContactWithResidents: true,
    personalizedInsights: true,
  },
};

const requireOwner = (req, res, next) => {
  if (Number(req.user?.roleId) !== 2)
    return res
      .status(403)
      .json({ success: false, message: "Owner access required" });
  return next();
};

const getOwnerBookingQuery = async (ownerId) => {
  const propertyIds = await Property.find({ ownerId }).distinct("propertyId");
  return { $or: [{ ownerId }, { propertyId: { $in: propertyIds } }] };
};

const getOwnerData = async (req, res) => {
  try {
    const ownerId = Number(req.user.userId);
    const collection = req.params.collection;

    if (collection === "reviews") {
      const ownerProperties = await Property.find({ ownerId })
        .select("propertyId")
        .lean();
      const propertyIds = ownerProperties.map((p) => p.propertyId);
      const records = await Review.find({
        propertyId: { $in: propertyIds },
        isActive: true,
      })
        .sort({ createdAt: -1 })
        .lean();
      return res.json({ success: true, data: records });
    }

    if (collection === "bookings") {
      const records = await Booking.find(await getOwnerBookingQuery(ownerId))
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

const updateOwnerBookingStatus = async (req, res) => {
  try {
    const ownerId = Number(req.user.userId);
    const { id } = req.params;
    const { status } = req.body;
    if (!["Approved", "Cancelled"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid booking status" });
    }

    const booking = await Booking.findOne({
      $and: [
        await getOwnerBookingQuery(ownerId),
        {
          $or: [
            { bookingId: id },
            { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
          ],
        },
      ],
    });
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    booking.ownerId = ownerId;
    booking.status = status;
    await booking.save();
    return res.json({ success: true, data: booking });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to update booking status" });
  }
};

const getOwnerSummary = async (req, res) => {
  try {
    const ownerId = Number(req.user.userId);
    const bookingQuery = await getOwnerBookingQuery(ownerId);
    const [
      properties,
      bookings,
      payments,
      residents,
      complaints,
      reviews,
      visits,
    ] = await Promise.all([
      Property.find({ ownerId })
        .select("isActive priceValue occupancy rating")
        .lean(),
      Booking.find(bookingQuery).lean(),
      Payment.find({ ownerId }).lean(),
      User.find({ roleId: 3, ownerId }).countDocuments(),
      Complaint.countDocuments({ ownerId }),
      Review.countDocuments({ ownerId }),
      Visit.countDocuments({ ownerId }),
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
        pendingBookings: bookings.filter(
          (booking) => String(booking.status || "").toLowerCase() === "pending",
        ).length,
        residents,
        payments: payments.length,
        pendingPayments: payments.filter(
          (payment) => String(payment.status || "").toLowerCase() === "pending",
        ).length,
        complaints,
        reviews,
        visits,
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

const getOwnerSettings = async (req, res) => {
  try {
    const owner = await User.findOne({
      userId: Number(req.user.userId),
      roleId: 2,
    })
      .select("email ownerSettings")
      .lean();
    if (!owner) {
      return res.status(404).json({ success: false, message: "Owner account not found" });
    }

    const settings = owner.ownerSettings || {};
    return res.json({
      success: true,
      data: {
        notifications: { ...defaultOwnerSettings.notifications, ...settings.notifications },
        properties: { ...defaultOwnerSettings.properties, ...settings.properties },
        payments: {
          ...defaultOwnerSettings.payments,
          ...settings.payments,
          payoutEmail: settings.payments?.payoutEmail || owner.email,
        },
        privacy: { ...defaultOwnerSettings.privacy, ...settings.privacy },
      },
    });
  } catch (error) {
    console.error("getOwnerSettings error:", error);
    return res.status(500).json({ success: false, message: "Failed to load owner settings" });
  }
};

const updateOwnerSettings = async (req, res) => {
  const { notifications, properties, payments, privacy } = req.body || {};
  const booleanFields = [
    notifications?.bookingRequests,
    notifications?.paymentUpdates,
    notifications?.residentMessages,
    notifications?.productUpdates,
    privacy?.shareContactWithResidents,
    privacy?.personalizedInsights,
  ];
  const valid =
    notifications &&
    properties &&
    payments &&
    privacy &&
    booleanFields.every((value) => typeof value === "boolean") &&
    typeof properties.defaultCity === "string" &&
    properties.defaultCity.trim().length > 0 &&
    properties.defaultCity.trim().length <= 100 &&
    ["Unisex", "Male", "Female"].includes(properties.defaultAllowedGender) &&
    ["bank-transfer", "upi"].includes(payments.payoutMethod) &&
    typeof payments.payoutEmail === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payments.payoutEmail.trim());

  if (!valid) {
    return res.status(400).json({ success: false, message: "Invalid owner settings" });
  }

  try {
    const owner = await User.findOneAndUpdate(
      { userId: Number(req.user.userId), roleId: 2 },
      {
        $set: {
          ownerSettings: {
            notifications: {
              bookingRequests: notifications.bookingRequests,
              paymentUpdates: notifications.paymentUpdates,
              residentMessages: notifications.residentMessages,
              productUpdates: notifications.productUpdates,
            },
            properties: {
              defaultCity: properties.defaultCity.trim(),
              defaultAllowedGender: properties.defaultAllowedGender,
            },
            payments: {
              payoutMethod: payments.payoutMethod,
              payoutEmail: payments.payoutEmail.trim().toLowerCase(),
            },
            privacy: {
              shareContactWithResidents: privacy.shareContactWithResidents,
              personalizedInsights: privacy.personalizedInsights,
            },
          },
        },
      },
      { new: true, runValidators: true },
    )
      .select("email ownerSettings")
      .lean();
    if (!owner) {
      return res.status(404).json({ success: false, message: "Owner account not found" });
    }
    const savedSettings = owner.ownerSettings || {};
    return res.json({
      success: true,
      data: {
        notifications: { ...defaultOwnerSettings.notifications, ...savedSettings.notifications },
        properties: { ...defaultOwnerSettings.properties, ...savedSettings.properties },
        payments: {
          ...defaultOwnerSettings.payments,
          ...savedSettings.payments,
          payoutEmail: savedSettings.payments?.payoutEmail || owner.email,
        },
        privacy: { ...defaultOwnerSettings.privacy, ...savedSettings.privacy },
      },
    });
  } catch (error) {
    console.error("updateOwnerSettings error:", error);
    return res.status(500).json({ success: false, message: "Failed to save owner settings" });
  }
};

const changeOwnerPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    newPassword.length < 8
  ) {
    return res.status(400).json({
      success: false,
      message: "Enter your current password and a new password of at least 8 characters",
    });
  }

  try {
    const owner = await User.findOne({ userId: Number(req.user.userId), roleId: 2 });
    if (!owner) {
      return res.status(404).json({ success: false, message: "Owner account not found" });
    }

    const currentPasswordMatches = await bcrypt.compare(currentPassword, owner.password);
    if (!currentPasswordMatches) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "Choose a new password different from your current password",
      });
    }

    owner.password = await bcrypt.hash(newPassword, 12);
    await owner.save();
    return res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("changeOwnerPassword error:", error);
    return res.status(500).json({ success: false, message: "Failed to update password" });
  }
};

const getOwnerMenu = async (req, res) => {
  try {
    const menu = await Menu.find({ ownerId: Number(req.user.userId) })
      .sort({ day: 1 })
      .lean();
    return res.json({ success: true, data: menu });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load menu" });
  }
};

const updateOwnerMenu = async (req, res) => {
  try {
    const { day, breakfast = "", lunch = "", dinner = "" } = req.body;
    if (!day)
      return res
        .status(400)
        .json({ success: false, message: "Menu day is required" });
    const menu = await Menu.findOneAndUpdate(
      { ownerId: Number(req.user.userId), day },
      { ownerId: Number(req.user.userId), day, breakfast, lunch, dinner },
      { new: true, upsert: true, runValidators: true },
    ).lean();
    return res.json({ success: true, data: menu });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to save menu" });
  }
};

module.exports = {
  requireOwner,
  getOwnerData,
  updateOwnerBookingStatus,
  getOwnerSummary,
  getOwnerSettings,
  updateOwnerSettings,
  changeOwnerPassword,
  getOwnerMenu,
  updateOwnerMenu,
};
