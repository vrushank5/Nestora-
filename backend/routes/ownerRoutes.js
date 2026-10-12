const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  requireOwner,
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
router.get("/summary", getOwnerSummary);
router.get("/settings", getOwnerSettings);
router.put("/settings", updateOwnerSettings);
router.post("/settings/password", changeOwnerPassword);
router.get("/menu", getOwnerMenu);
router.put("/menu", updateOwnerMenu);
router.patch("/bookings/:id/status", updateOwnerBookingStatus);
router.get("/:collection", getOwnerData);

module.exports = router;
