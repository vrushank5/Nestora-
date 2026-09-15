const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getRoomsByProperty,
  createRoom,
  updateRoom,
  deleteRoom,
  getOwnerRooms,
  getAdminRooms,
} = require("../controllers/roomController");

const router = express.Router();

// Get rooms by property ID (Public)
router.get("/property/:propertyId", getRoomsByProperty);

// Get owner's rooms (Protected)
router.get("/owner/my", authMiddleware, getOwnerRooms);

// Admin get all rooms (Protected)
router.get("/admin/all", authMiddleware, getAdminRooms);

// Create room (Protected, Owner)
router.post("/", authMiddleware, createRoom);

// Update room (Protected, Owner)
router.put("/:id", authMiddleware, updateRoom);

// Delete room (Protected, Owner)
router.delete("/:id", authMiddleware, deleteRoom);

module.exports = router;
