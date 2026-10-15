const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const profileUpload = require("../middleware/profileUploadMiddleware");
const {
  requireOwner,
  getOwnerProfile,
  updateOwnerProfile,
  uploadOwnerProfileImage,
  getOwnerData,
  updateOwnerBookingStatus,
  getOwnerSummary,
  getOwnerSettings,
  updateOwnerSettings,
  changeOwnerPassword,
  getOwnerMenu,
  updateOwnerMenu,
} = require("../controllers/ownerController");

const router = express.Router();
router.use(authMiddleware, requireOwner);
router.get("/profile", getOwnerProfile);
router.put("/profile", updateOwnerProfile);
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
  uploadOwnerProfileImage,
);
router.get("/summary", getOwnerSummary);
router.get("/settings", getOwnerSettings);
router.put("/settings", updateOwnerSettings);
router.post("/settings/password", changeOwnerPassword);
router.get("/menu", getOwnerMenu);
router.put("/menu", updateOwnerMenu);
router.patch("/bookings/:id/status", updateOwnerBookingStatus);
router.get("/:collection", getOwnerData);

module.exports = router;
