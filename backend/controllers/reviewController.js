const Review = require("../models/Review");
const Property = require("../models/Property");

// Helper function to update Property rating & review count
const updatePropertyRatingStats = async (propertyId) => {
  try {
    const stats = await Review.aggregate([
      { $match: { propertyId: Number(propertyId), isActive: true } },
      {
        $group: {
          _id: "$propertyId",
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      const avg = Math.round(stats[0].avgRating * 10) / 10;
      const count = stats[0].totalReviews;
      await Property.updateOne(
        { propertyId: Number(propertyId) },
        { rating: avg, reviews: count }
      );
    } else {
      await Property.updateOne(
        { propertyId: Number(propertyId) },
        { rating: 0, reviews: 0 }
      );
    }
  } catch (err) {
    console.error("Error updating property rating stats:", err);
  }
};

// Create Review (Resident)
const createReview = async (req, res) => {
  try {
    if (!req.user || req.user.userId === undefined) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const userId = Number(req.user.userId);
    const { propertyId, rating, comment } = req.body;

    const numericPropertyId = Number(propertyId);
    const numericRating = Number(rating);

    if (!Number.isInteger(numericPropertyId) || numericPropertyId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID",
      });
    }

    if (
      !Number.isFinite(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a number between 1 and 5",
      });
    }

    if (!comment || typeof comment !== "string" || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment is required",
      });
    }

    // Check if property exists
    const property = await Property.findOne({
      propertyId: numericPropertyId,
      isActive: true,
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Generate auto-incrementing reviewId
    const lastReview = await Review.findOne().sort({ reviewId: -1 }).lean();
    const reviewId = lastReview ? Number(lastReview.reviewId) + 1 : 1;

    const review = await Review.create({
      reviewId,
      propertyId: numericPropertyId,
      userId,
      rating: numericRating,
      comment: comment.trim(),
      isActive: true,
    });

    // Update Property rating & reviews count
    await updatePropertyRatingStats(numericPropertyId);

    return res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: review,
    });
  } catch (error) {
    console.error("Create review error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get Reviews by Property ID
const getPropertyReviews = async (req, res) => {
  try {
    const propertyId = Number(req.params.propertyId || req.query.propertyId);

    if (!Number.isInteger(propertyId) || propertyId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID",
      });
    }

    const reviews = await Review.find({ propertyId, isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error("Get property reviews error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get Logged-in Resident's Reviews
const getResidentReviews = async (req, res) => {
  try {
    if (!req.user || req.user.userId === undefined) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const userId = Number(req.user.userId);
    const reviews = await Review.find({ userId, isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error("Get resident reviews error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get Owner's Properties Reviews
const getOwnerReviews = async (req, res) => {
  try {
    if (!req.user || req.user.userId === undefined) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const ownerId = Number(req.user.userId);
    const ownerProperties = await Property.find({ ownerId })
      .select("propertyId")
      .lean();
    const propertyIds = ownerProperties.map((p) => p.propertyId);

    const reviews = await Review.find({
      propertyId: { $in: propertyIds },
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error("Get owner reviews error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Reply to Review (Owner)
const replyToReview = async (req, res) => {
  try {
    if (!req.user || req.user.userId === undefined) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const ownerId = Number(req.user.userId);
    const reviewId = Number(req.params.id);
    const { ownerReply } = req.body;

    if (!Number.isInteger(reviewId) || reviewId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    if (!ownerReply || typeof ownerReply !== "string" || !ownerReply.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reply content is required",
      });
    }

    const review = await Review.findOne({ reviewId, isActive: true });
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Verify ownership of the property
    const property = await Property.findOne({ propertyId: review.propertyId });
    if (!property || Number(property.ownerId) !== ownerId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to reply to reviews for this property",
      });
    }

    review.ownerReply = ownerReply.trim();
    await review.save();

    return res.status(200).json({
      success: true,
      message: "Reply saved successfully",
      data: review,
    });
  } catch (error) {
    console.error("Reply to review error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete Review (Resident creator or Admin)
const deleteReview = async (req, res) => {
  try {
    if (!req.user || req.user.userId === undefined) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const userId = Number(req.user.userId);
    const roleId = Number(req.user.roleId);
    const reviewId = Number(req.params.id);

    if (!Number.isInteger(reviewId) || reviewId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    const review = await Review.findOne({ reviewId, isActive: true });
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Check authorization (must be author of review or Admin)
    if (Number(review.userId) !== userId && roleId !== 1) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this review",
      });
    }

    review.isActive = false;
    await review.save();

    // Recalculate Property rating stats
    await updatePropertyRatingStats(review.propertyId);

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Delete review error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Admin: Get all reviews
const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error("Get all reviews error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  createReview,
  getPropertyReviews,
  getResidentReviews,
  getOwnerReviews,
  replyToReview,
  deleteReview,
  getAllReviews,
};
