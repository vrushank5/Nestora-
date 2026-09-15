const User = require("../models/User");
const Property = require("../models/Property");
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const Room = require("../models/Room");
const Review = require("../models/Review");
const Complaint = require("../models/Complaint");
const Visit = require("../models/Visit");

const requireAdmin = (req, res, next) => {
  if (Number(req.user?.roleId) !== 1) {
    return res
      .status(403)
      .json({ success: false, message: "Admin access required" });
  }
  return next();
};

const getResidents = async (req, res) => {
  try {
    const residents = await User.find({ roleId: 3 })
      .select("userId name email mobile isActive createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: residents.map((resident) => ({
        id: resident.userId,
        name: resident.name,
        email: resident.email,
        phone: resident.mobile,
        property: "Not assigned",
        room: "Not assigned",
        booking: "Not assigned",
        moveIn: "Not available",
        paymentStatus: "Pending",
        status: resident.isActive ? "Active" : "Inactive",
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load residents",
    });
  }
};

const getOwners = async (req, res) => {
  try {
    const owners = await User.find({ roleId: 2 })
      .select("userId name email mobile isActive createdAt")
      .sort({ createdAt: -1 })
      .lean();
    const properties = await Property.find().select("ownerId").lean();
    const propertyCounts = properties.reduce((counts, property) => {
      counts[property.ownerId] = (counts[property.ownerId] || 0) + 1;
      return counts;
    }, {});

    return res.json({
      success: true,
      data: owners.map((owner) => ({
        id: owner.userId,
        name: owner.name,
        email: owner.email,
        business: "Nestora Partner",
        phone: owner.mobile,
        properties: propertyCounts[owner.userId] || 0,
        status: owner.isActive ? "Active" : "Inactive",
      })),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load owners" });
  }
};

const emptyAdminCollection = (req, res) =>
  res.json({ success: true, data: [] });

const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("userId roleId name email mobile isActive createdAt")
      .sort({ createdAt: -1 })
      .lean();
    return res.json({
      success: true,
      data: users.map((user) => ({
        id: user.userId,
        name: user.name,
        email: user.email,
        role:
          Number(user.roleId) === 1
            ? "Admin"
            : Number(user.roleId) === 2
              ? "Owner"
              : "Resident",
        phone: user.mobile,
        verified: Boolean(user.isActive),
        status: user.isActive ? "Active" : "Suspended",
        joined: user.createdAt
          ? new Date(user.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "Unknown",
      })),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load users" });
  }
};

const getAdminProperties = async (req, res) => {
  try {
    const properties = await Property.find().sort({ propertyId: -1 }).lean();
    return res.json({
      success: true,
      data: properties.map((property) => ({
        id: property.propertyId,
        name: property.name,
        location: property.location,
        city: property.city,
        area: property.area,
        gender: property.gender,
        price: property.price,
        rating: property.rating,
        occupancy: property.occupancy,
        image: property.images?.[0] || "",
        ownerId: property.ownerId,
        status: property.isActive ? "Active" : "Inactive",
        verificationStatus: "Pending",
      })),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load properties" });
  }
};

const getAdminSummary = async (req, res) => {
  try {
    const [
      totalUsers,
      residents,
      owners,
      properties,
      pendingProperties,
      bookings,
      payments,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ roleId: 3 }),
      User.countDocuments({ roleId: 2 }),
      Property.countDocuments(),
      Property.countDocuments({ isActive: true }),
      Booking.countDocuments(),
      Payment.find().select("amount status").lean(),
    ]);
    const paidPayments = payments.filter(
      (payment) => String(payment.status || "").toLowerCase() === "paid",
    );
    const revenue = paidPayments.reduce(
      (total, payment) =>
        total + Number(String(payment.amount || 0).replace(/[^0-9.]/g, "")),
      0,
    );
    return res.json({
      success: true,
      data: {
        totalUsers,
        residents,
        owners,
        properties,
        pendingProperties,
        bookings,
        revenue,
        verifiedProperties: pendingProperties,
        pendingReviews: 0,
        rejectedListings: 0,
        totalBeds: 0,
        occupiedBeds: 0,
        availableBeds: 0,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load admin summary" });
  }
};

const getPropertyVerifications = async (req, res) => {
  try {
    const properties = await Property.find().sort({ createdAt: -1 }).lean();
    return res.json({
      success: true,
      data: properties.map((property) => ({
        id: property.propertyId,
        name: property.name,
        location: property.location,
        owner: `Owner #${property.ownerId}`,
        submittedDate: property.createdAt
          ? new Date(property.createdAt).toLocaleDateString("en-GB")
          : "Unknown",
        type: property.gender || "Unisex",
        price: property.price,
        image: property.images?.[0] || "",
        status: "Pending",
        checklist: {
          ownerId: true,
          address: true,
          images: property.images?.length > 0,
          details: Boolean(property.description),
          roomDetails: property.roomTypes?.length > 0,
          contactInfo: true,
        },
      })),
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to load property verifications",
      });
  }
};

const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 }).lean();
    const data = payments.map((payment) => ({
      id: payment.transactionId || payment.id || String(payment._id),
      resident: payment.resident || payment.residentName || "Unknown resident",
      property: payment.property || payment.propertyName || "Unknown property",
      booking: payment.booking || payment.bookingId || "Not linked",
      amount: payment.amount || 0,
      method: payment.method || payment.paymentMethod || "Unknown",
      date: payment.date || payment.createdAt,
      status: payment.status || "Pending",
    }));
    const paid = data.filter(
      (payment) => payment.status.toLowerCase() === "paid",
    );
    return res.json({
      success: true,
      data,
      summary: {
        revenue: paid.reduce(
          (total, payment) =>
            total + Number(String(payment.amount).replace(/[^0-9.]/g, "")),
          0,
        ),
        successful: paid.length,
        pending: data.filter(
          (payment) => payment.status.toLowerCase() === "pending",
        ).length,
        failed: data.filter(
          (payment) => payment.status.toLowerCase() === "failed",
        ).length,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load payments" });
  }
};

const getAdminRooms = async (req, res) => {
  try {
    const rooms = await Room.find().sort({ propertyId: 1, roomId: -1 }).lean();
    return res.json({ success: true, data: rooms });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load rooms" });
  }
};

const getAdminReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: reviews });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load reviews" });
  }
};

const getAdminComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: complaints });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load complaints" });
  }
};

const getAdminVisits = async (req, res) => {
  try {
    const visits = await Visit.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: visits });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load visits" });
  }
};

module.exports = {
  getResidents,
  getOwners,
  getUsers,
  getAdminProperties,
  getAdminSummary,
  getPropertyVerifications,
  getPayments,
  getAdminRooms,
  getAdminReviews,
  getAdminComplaints,
  getAdminVisits,
  requireAdmin,
  emptyAdminCollection,
};
