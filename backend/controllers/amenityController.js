const Amenity = require("../models/Amenity");

// Get All Amenities (Public)
const getAmenities = async (req, res) => {
  try {
    const amenities = await Amenity.find({ isActive: true })
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: amenities,
    });
  } catch (error) {
    console.error("Get amenities error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Create Amenity
const createAmenity = async (req, res) => {
  try {
    const { name, icon, category } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Amenity name is required",
      });
    }

    const cleanName = name.trim();
    const existing = await Amenity.findOne({
      name: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Amenity already exists",
      });
    }

    const lastAmenity = await Amenity.findOne().sort({ amenityId: -1 }).lean();
    const amenityId = lastAmenity ? Number(lastAmenity.amenityId) + 1 : 1;

    const amenity = await Amenity.create({
      amenityId,
      name: cleanName,
      icon: typeof icon === "string" ? icon.trim() : "",
      category: typeof category === "string" ? category.trim() : "General",
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Amenity created successfully",
      data: amenity,
    });
  } catch (error) {
    console.error("Create amenity error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update Amenity
const updateAmenity = async (req, res) => {
  try {
    const amenityId = Number(req.params.id);
    if (!Number.isInteger(amenityId) || amenityId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amenity ID",
      });
    }

    const amenity = await Amenity.findOne({ amenityId });
    if (!amenity) {
      return res.status(404).json({
        success: false,
        message: "Amenity not found",
      });
    }

    const { name, icon, category, isActive } = req.body;

    if (name !== undefined && typeof name === "string" && name.trim()) {
      amenity.name = name.trim();
    }
    if (icon !== undefined && typeof icon === "string") {
      amenity.icon = icon.trim();
    }
    if (category !== undefined && typeof category === "string") {
      amenity.category = category.trim();
    }
    if (isActive !== undefined && typeof isActive === "boolean") {
      amenity.isActive = isActive;
    }

    await amenity.save();

    return res.status(200).json({
      success: true,
      message: "Amenity updated successfully",
      data: amenity,
    });
  } catch (error) {
    console.error("Update amenity error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete Amenity
const deleteAmenity = async (req, res) => {
  try {
    const amenityId = Number(req.params.id);
    if (!Number.isInteger(amenityId) || amenityId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amenity ID",
      });
    }

    const amenity = await Amenity.findOne({ amenityId });
    if (!amenity) {
      return res.status(404).json({
        success: false,
        message: "Amenity not found",
      });
    }

    amenity.isActive = false;
    await amenity.save();

    return res.status(200).json({
      success: true,
      message: "Amenity deleted successfully",
    });
  } catch (error) {
    console.error("Delete amenity error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getAmenities,
  createAmenity,
  updateAmenity,
  deleteAmenity,
};
