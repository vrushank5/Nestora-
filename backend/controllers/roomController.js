const Room = require("../models/Room");
const Property = require("../models/Property");

// Get Rooms by Property ID (Public / Resident)
const getRoomsByProperty = async (req, res) => {
  try {
    const propertyId = Number(req.params.propertyId);

    if (!Number.isInteger(propertyId) || propertyId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID",
      });
    }

    const rooms = await Room.find({ propertyId, isActive: true })
      .sort({ roomNumber: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    console.error("Get rooms by property error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Create Room (Owner)
const createRoom = async (req, res) => {
  try {
    if (!req.user || req.user.userId === undefined) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const ownerId = Number(req.user.userId);
    const { propertyId, roomNumber, roomType, capacity, price, status } = req.body;

    const numericPropertyId = Number(propertyId);
    const numericCapacity = Number(capacity);
    const numericPrice = Number(price);

    if (!Number.isInteger(numericPropertyId) || numericPropertyId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID",
      });
    }

    if (!roomNumber || typeof roomNumber !== "string" || !roomNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: "Room number is required",
      });
    }

    if (!roomType || typeof roomType !== "string" || !roomType.trim()) {
      return res.status(400).json({
        success: false,
        message: "Room type is required",
      });
    }

    if (!Number.isFinite(numericCapacity) || numericCapacity < 1) {
      return res.status(400).json({
        success: false,
        message: "Capacity must be a positive number",
      });
    }

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a valid non-negative number",
      });
    }

    // Verify owner owns this property
    const property = await Property.findOne({ propertyId: numericPropertyId });
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    if (Number(property.ownerId) !== ownerId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to create rooms for this property",
      });
    }

    // Generate roomId
    const lastRoom = await Room.findOne().sort({ roomId: -1 }).lean();
    const roomId = lastRoom ? Number(lastRoom.roomId) + 1 : 1;

    const room = await Room.create({
      roomId,
      propertyId: numericPropertyId,
      roomNumber: roomNumber.trim(),
      roomType: roomType.trim(),
      capacity: numericCapacity,
      occupiedCount: 0,
      availableCount: numericCapacity,
      price: numericPrice,
      status: status && ["Available", "Occupied", "Under Maintenance"].includes(status) ? status : "Available",
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Room created successfully",
      data: room,
    });
  } catch (error) {
    console.error("Create room error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update Room (Owner)
const updateRoom = async (req, res) => {
  try {
    if (!req.user || req.user.userId === undefined) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const ownerId = Number(req.user.userId);
    const roomId = Number(req.params.id);

    if (!Number.isInteger(roomId) || roomId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid room ID",
      });
    }

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // Verify ownership via Property
    const property = await Property.findOne({ propertyId: room.propertyId });
    if (!property || Number(property.ownerId) !== ownerId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this room",
      });
    }

    const { roomNumber, roomType, capacity, occupiedCount, price, status, isActive } = req.body;

    if (roomNumber !== undefined && typeof roomNumber === "string" && roomNumber.trim()) {
      room.roomNumber = roomNumber.trim();
    }
    if (roomType !== undefined && typeof roomType === "string" && roomType.trim()) {
      room.roomType = roomType.trim();
    }
    if (capacity !== undefined && Number.isFinite(Number(capacity)) && Number(capacity) >= 1) {
      room.capacity = Number(capacity);
    }
    if (occupiedCount !== undefined && Number.isFinite(Number(occupiedCount)) && Number(occupiedCount) >= 0) {
      room.occupiedCount = Number(occupiedCount);
    }
    if (price !== undefined && Number.isFinite(Number(price)) && Number(price) >= 0) {
      room.price = Number(price);
    }
    if (status !== undefined && ["Available", "Occupied", "Under Maintenance"].includes(status)) {
      room.status = status;
    }
    if (isActive !== undefined && typeof isActive === "boolean") {
      room.isActive = isActive;
    }

    room.availableCount = Math.max(0, room.capacity - room.occupiedCount);
    await room.save();

    return res.status(200).json({
      success: true,
      message: "Room updated successfully",
      data: room,
    });
  } catch (error) {
    console.error("Update room error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete Room (Owner)
const deleteRoom = async (req, res) => {
  try {
    if (!req.user || req.user.userId === undefined) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const ownerId = Number(req.user.userId);
    const roomId = Number(req.params.id);

    if (!Number.isInteger(roomId) || roomId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid room ID",
      });
    }

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const property = await Property.findOne({ propertyId: room.propertyId });
    if (!property || Number(property.ownerId) !== ownerId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this room",
      });
    }

    room.isActive = false;
    await room.save();

    return res.status(200).json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error) {
    console.error("Delete room error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get Owner's Rooms across all properties
const getOwnerRooms = async (req, res) => {
  try {
    if (!req.user || req.user.userId === undefined) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const ownerId = Number(req.user.userId);
    const ownerProperties = await Property.find({ ownerId }).select("propertyId").lean();
    const propertyIds = ownerProperties.map((p) => p.propertyId);

    const rooms = await Room.find({ propertyId: { $in: propertyIds } }).sort({ propertyId: 1, roomNumber: 1 }).lean();

    return res.status(200).json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    console.error("Get owner rooms error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Admin: Get all rooms
const getAdminRooms = async (req, res) => {
  try {
    const rooms = await Room.find().sort({ propertyId: 1, roomId: -1 }).lean();
    return res.status(200).json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    console.error("Get admin rooms error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getRoomsByProperty,
  createRoom,
  updateRoom,
  deleteRoom,
  getOwnerRooms,
  getAdminRooms,
};
