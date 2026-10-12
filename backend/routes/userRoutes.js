const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
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
} = require("../controllers/userController");

const router = express.Router();

router.use(authMiddleware, requireAdmin);
router.get("/residents", getResidents);
router.get("/owners", getOwners);
router.get("/users", getUsers);
router.get("/admin/properties", getAdminProperties);
router.get("/admin/summary", getAdminSummary);
router.get("/bookings", getAdminBookings);
router.patch("/bookings/:id/status", updateBookingStatus);
router.get("/rooms", getAdminRooms);
router.get("/payments", getPayments);
router.get("/property-verifications", getPropertyVerifications);
router.put("/property-verifications/:id/status", updatePropertyVerificationStatus);
router.get("/complaints", getAdminComplaints);
router.get("/reviews", getAdminReviews);
router.get("/visits", getAdminVisits);
router.get("/blogs", emptyAdminCollection);
router.get("/faqs", emptyAdminCollection);

module.exports = router;
