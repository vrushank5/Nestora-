const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createReview,
  getPropertyReviews,
  getResidentReviews,
  getOwnerReviews,
  replyToReview,
  deleteReview,
  getAllReviews,
} = require("../controllers/reviewController");

const router = express.Router();

// Get reviews by property ID (Public)
router.get("/property/:propertyId", getPropertyReviews);

// Get resident reviews (Protected)
router.get("/resident", authMiddleware, getResidentReviews);

// Get owner reviews (Protected)
router.get("/owner", authMiddleware, getOwnerReviews);

// Admin get all reviews (Protected)
router.get("/admin/all", authMiddleware, getAllReviews);

// Create review (Protected)
router.post("/", authMiddleware, createReview);

// Owner reply to review (Protected)
router.put("/:id/reply", authMiddleware, replyToReview);

// Delete review (Protected)
router.delete("/:id", authMiddleware, deleteReview);

module.exports = router;
