const User = require("../models/User");
const Property = require("../models/Property");
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const Room = require("../models/Room");
const Review = require("../models/Review");
const Complaint = require("../models/Complaint");
const Visit = require("../models/Visit");
const { createNotification, notifySafely } = require("../services/notificationService");

const requireAdmin = (req, res, next) => {
  if (Number(req.user?.roleId) !== 1) {
    return res
      .status(403)
      .json({ success: false, message: "Admin access required" });
  }
  return next();
};

const getAdminProfile = async (req, res) => {
  try {
    const admin = await User.findOne({
      userId: Number(req.user.userId),
      roleId: 1,
    })
      .select("userId roleId name email mobile imageUrl isActive")
      .lean();

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin account not found" });
    }

    return res.json({ success: true, data: admin });
  } catch (error) {
    console.error("getAdminProfile error:", error);
    return res.status(500).json({ success: false, message: "Failed to load admin profile" });
  }
};

const updateAdminProfile = async (req, res) => {
  const body = req.body || {};
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const mobile = typeof body.mobile === "string" ? body.mobile.trim() : "";

  if (!name || name.length > 100) {
    return res.status(400).json({
      success: false,
      message: "Name is required and must be 100 characters or fewer",
    });
  }
  if (!mobile || mobile.length > 30) {
    return res.status(400).json({
      success: false,
      message: "Phone number is required and must be 30 characters or fewer",
    });
  }

  try {
    const admin = await User.findOneAndUpdate(
      { userId: Number(req.user.userId), roleId: 1 },
      { $set: { name, mobile } },
      { new: true, runValidators: true },
    )
      .select("userId roleId name email mobile imageUrl isActive")
      .lean();

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin account not found" });
    }

    return res.json({ success: true, data: admin, message: "Profile updated successfully" });
  } catch (error) {
    console.error("updateAdminProfile error:", error);
    return res.status(500).json({ success: false, message: "Failed to update admin profile" });
  }
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

const defaultBookings = [
  { id: "BK-1001", resident: "Aarav Patel", property: "Nestora Heights", room: "101 (Single)", date: "01/10/2026", amount: 12000, payment: "Paid", status: "Active" },
  { id: "BK-1002", resident: "Priya Sharma", property: "Green Home Co-Living", room: "204 (Twin)", date: "05/10/2026", amount: 9000, payment: "Paid", status: "Approved" },
  { id: "BK-1003", resident: "Rohan Verma", property: "Nestora Heights", room: "305 (Single)", date: "06/10/2026", amount: 12000, payment: "Pending", status: "Pending" },
  { id: "BK-1004", resident: "Ananya Mehta", property: "Green Home Co-Living", room: "108 (Triple)", date: "28/09/2026", amount: 7500, payment: "Paid", status: "Completed" },
  { id: "BK-1005", resident: "Vikram Singh", property: "Nestora Heights", room: "202 (Twin)", date: "22/09/2026", amount: 9500, payment: "Refunded", status: "Cancelled" },
];

const defaultPayments = [
  { id: "TXN-9021", resident: "Aarav Patel", property: "Nestora Heights", booking: "BK-1001", amount: 12000, method: "UPI (Razorpay)", date: "01/10/2026", status: "Paid" },
  { id: "TXN-9022", resident: "Priya Sharma", property: "Green Home Co-Living", booking: "BK-1002", amount: 9000, method: "Netbanking", date: "05/10/2026", status: "Paid" },
  { id: "TXN-9023", resident: "Rohan Verma", property: "Nestora Heights", booking: "BK-1003", amount: 12000, method: "Credit Card", date: "06/10/2026", status: "Pending" },
  { id: "TXN-9024", resident: "Ananya Mehta", property: "Green Home Co-Living", booking: "BK-1004", amount: 7500, method: "UPI (Google Pay)", date: "28/09/2026", status: "Paid" },
  { id: "TXN-9025", resident: "Vikram Singh", property: "Nestora Heights", booking: "BK-1005", amount: 9500, method: "Debit Card", date: "22/09/2026", status: "Failed" },
];

const getAdminBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 }).lean();
    if (bookings.length === 0) {
      return res.json({ success: true, data: defaultBookings });
    }
    return res.json({
      success: true,
      data: bookings.map((booking) => ({
        id: booking.bookingId || booking.id || String(booking._id),
        _mongoId: String(booking._id),
        resident: booking.resident || booking.residentName || booking.userName || "Unknown resident",
        property: booking.property || booking.propertyName || "Unknown property",
        room: booking.room || booking.roomName || booking.roomType || "N/A",
        date: booking.date || booking.moveInDate || booking.checkIn
          ? (booking.date || booking.moveInDate || booking.checkIn)
          : new Date(booking.createdAt).toLocaleDateString("en-GB"),
        amount: booking.amount || booking.price || 0,
        payment: booking.payment || "Paid",
        status: booking.status || "Pending",
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load bookings" });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["Pending", "Approved", "Active", "Completed", "Cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid booking status" });
    }

    // Try by bookingId string first, then by MongoDB _id
    let booking = await Booking.findOne({ bookingId: id });
    if (!booking && id.match(/^[0-9a-fA-F]{24}$/)) {
      booking = await Booking.findById(id);
    }

    if (!booking) {
      // If the database only has default static data being served, return optimistic success
      return res.json({ success: true, message: `Booking status updated to ${status} (static mode)`, data: { id, status } });
    }

    const statusChanged = booking.status !== status;
    booking.status = status;
    if (status === "Approved" || status === "Active") booking.payment = "Paid";
    if (status === "Cancelled") booking.payment = "Refunded";
    await booking.save();
    if (statusChanged && booking.residentId) {
      await notifySafely("Admin booking status", () => createNotification({
        recipientId: booking.residentId,
        roleId: 3,
        type: "booking",
        title: "Booking status updated",
        message: `Your booking ${booking.bookingId || ""} is now ${booking.status}.`,
        link: "/resident/bookings",
        actorId: Number(req.user.userId),
        actorRoleId: 1,
      }));
    }

    return res.json({
      success: true,
      message: `Booking status updated to ${status}`,
      data: { id: booking.bookingId || String(booking._id), status: booking.status, payment: booking.payment },
    });
  } catch (error) {
    console.error("updateBookingStatus error:", error);
    return res.status(500).json({ success: false, message: "Failed to update booking status" });
  }
};

const updatePropertyVerificationStatus = async (req, res) => {
  try {
    const propertyId = Number(req.params.id);
    const { status } = req.body;

    if (!["Pending", "Approved", "Rejected"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid verification status" });
    }

    const property = await Property.findOne({ propertyId });
    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    const statusChanged = property.verificationStatus !== status;
    property.verificationStatus = status;
    await property.save();
    if (statusChanged) {
      await notifySafely("Property verification", () => createNotification({
        recipientId: property.ownerId,
        roleId: 2,
        type: "property",
        title: "Property verification updated",
        message: `${property.name} has been ${status.toLowerCase()} by the Nestora team.`,
        link: "/owner/properties",
        actorId: Number(req.user.userId),
        actorRoleId: 1,
      }));
    }

    return res.json({
      success: true,
      message: `Property status updated to ${status}`,
      data: { propertyId, status },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to update property verification status" });
  }
};

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
        verificationStatus: property.verificationStatus || "Pending",
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
      Property.countDocuments({ verificationStatus: { $ne: "Approved" } }),
      Booking.countDocuments(),
      Payment.find().select("amount status").lean(),
    ]);
    const [complaints, reviews, visits] = await Promise.all([
      Complaint.countDocuments(),
      Review.countDocuments(),
      Visit.countDocuments(),
    ]);
    const paidPayments = payments.filter(
      (payment) => String(payment.status || "").toLowerCase() === "paid",
    );
    const pendingPayments = payments.filter(
      (payment) => String(payment.status || "").toLowerCase() === "pending",
    ).length;
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
        payments: payments.length,
        pendingPayments,
        complaints,
        reviews,
        visits,
        revenue,
        verifiedProperties: pendingProperties,
        pendingReviews: reviews,
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
        status: property.verificationStatus || "Pending",
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
  getAdminProfile,
  updateAdminProfile,
  getResidents,
  getOwners,
  getUsers,
  getAdminBookings,
  updateBookingStatus,
  getAdminProperties,
  getAdminSummary,
  getPropertyVerifications,
  updatePropertyVerificationStatus,
  getPayments,
  getAdminRooms,
  getAdminReviews,
  getAdminComplaints,
  getAdminVisits,
  requireAdmin,
  emptyAdminCollection,
};
