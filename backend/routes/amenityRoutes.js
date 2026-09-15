const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getAmenities,
  createAmenity,
  updateAmenity,
  deleteAmenity,
} = require("../controllers/amenityController");

const router = express.Router();

// Get all active amenities (Public)
router.get("/", getAmenities);

// Create amenity (Protected)
router.post("/", authMiddleware, createAmenity);

// Update amenity (Protected)
router.put("/:id", authMiddleware, updateAmenity);

// Delete amenity (Protected)
router.delete("/:id", authMiddleware, deleteAmenity);

module.exports = router;
