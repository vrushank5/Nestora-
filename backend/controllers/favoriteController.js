const Favorite = require("../models/Favorite");
const Property = require("../models/Property");

// Toggle Favorite (Add if not present, Remove if present)
const toggleFavorite = async (req, res) => {
  try {
    if (!req.user || req.user.userId === undefined) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const userId = Number(req.user.userId);
    const propertyId = Number(req.body.propertyId);

    if (!Number.isInteger(propertyId) || propertyId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID",
      });
    }

    // Check if property exists
    const property = await Property.findOne({ propertyId, isActive: true });
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    const existingFav = await Favorite.findOne({ userId, propertyId });

    if (existingFav) {
      await Favorite.deleteOne({ _id: existingFav._id });
      return res.status(200).json({
        success: true,
        saved: false,
        message: "Removed from favorites",
      });
    } else {
      const lastFav = await Favorite.findOne().sort({ favoriteId: -1 }).lean();
      const favoriteId = lastFav ? Number(lastFav.favoriteId) + 1 : 1;

      const fav = await Favorite.create({
        favoriteId,
        userId,
        propertyId,
      });

      return res.status(201).json({
        success: true,
        saved: true,
        message: "Added to favorites",
        data: fav,
      });
    }
  } catch (error) {
    console.error("Toggle favorite error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Remove Favorite
const removeFavorite = async (req, res) => {
  try {
    if (!req.user || req.user.userId === undefined) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const userId = Number(req.user.userId);
    const propertyId = Number(req.params.propertyId);

    if (!Number.isInteger(propertyId) || propertyId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID",
      });
    }

    await Favorite.deleteOne({ userId, propertyId });

    return res.status(200).json({
      success: true,
      saved: false,
      message: "Removed from favorites",
    });
  } catch (error) {
    console.error("Remove favorite error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get User's Favorite Properties
const getUserFavorites = async (req, res) => {
  try {
    if (!req.user || req.user.userId === undefined) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const userId = Number(req.user.userId);
    const favorites = await Favorite.find({ userId }).sort({ createdAt: -1 }).lean();
    const propertyIds = favorites.map((f) => f.propertyId);

    const properties = await Property.find({
      propertyId: { $in: propertyIds },
      isActive: true,
    }).lean();

    return res.status(200).json({
      success: true,
      data: properties,
    });
  } catch (error) {
    console.error("Get user favorites error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Check if Property is Favorited
const checkFavorite = async (req, res) => {
  try {
    if (!req.user || req.user.userId === undefined) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const userId = Number(req.user.userId);
    const propertyId = Number(req.params.propertyId);

    if (!Number.isInteger(propertyId) || propertyId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID",
      });
    }

    const fav = await Favorite.findOne({ userId, propertyId });

    return res.status(200).json({
      success: true,
      isFavorite: Boolean(fav),
    });
  } catch (error) {
    console.error("Check favorite error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  toggleFavorite,
  removeFavorite,
  getUserFavorites,
  checkFavorite,
};
