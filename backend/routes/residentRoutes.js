const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  requireResident,
  getResidentSummary,
  getResidentData,
  createResidentBooking,
  cancelResidentBooking,
  createResidentPayment,
  createResidentVisit,
  paypalCreateOrder,
  paypalCaptureOrder,
} = require("../controllers/residentController");

const router = express.Router();
router.use(authMiddleware, requireResident);

router.get("/summary", getResidentSummary);
router.post("/bookings", createResidentBooking);
router.patch("/bookings/:id/cancel", cancelResidentBooking);
router.post("/payments", createResidentPayment);
router.post("/visits", createResidentVisit);

// PayPal payment routes
router.post("/payments/paypal/create-order", paypalCreateOrder);
router.post("/payments/paypal/capture-order", paypalCaptureOrder);

router.get("/:collection", getResidentData);

module.exports = router;
