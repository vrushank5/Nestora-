const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  toggleFavorite,
  removeFavorite,
  getUserFavorites,
  checkFavorite,
} = require("../controllers/favoriteController");

const router = express.Router();

router.use(authMiddleware);

// Get user's favorites
router.get("/", getUserFavorites);

// Check if property is favorited
router.get("/check/:propertyId", checkFavorite);

// Toggle favorite (Add or Remove)
router.post("/toggle", toggleFavorite);
router.post("/", toggleFavorite);

// Remove favorite by propertyId
router.delete("/:propertyId", removeFavorite);

module.exports = router;
