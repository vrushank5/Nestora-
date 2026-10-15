const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const profileUpload = require("../middleware/profileUploadMiddleware");
const {
  requireResident,
  getResidentProfile,
  updateResidentProfile,
  uploadResidentProfileImage,
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

router.get("/profile", getResidentProfile);
router.put("/profile", updateResidentProfile);
router.post(
  "/profile/image",
  (req, res, next) => {
    profileUpload.single("image")(req, res, (error) => {
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message || "Unable to upload profile photo",
        });
      }
      return next();
    });
  },
  uploadResidentProfileImage,
);
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
