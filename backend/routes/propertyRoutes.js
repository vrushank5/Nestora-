const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getOwnerProperties,
  adminUpdatePropertyStatus,
  adminDeleteProperty,
} = require("../controllers/propertyController");


/*
==================================================
PUBLIC ROUTES
==================================================
*/

// Get all active properties
// GET /api/properties
router.get(
  "/",
  getProperties
);


// Get logged-in owner's properties
// IMPORTANT: Must be before /:id
// GET /api/properties/owner/my
router.get(
  "/owner/my",
  authMiddleware,
  getOwnerProperties
);


// Get single property
// GET /api/properties/:id
router.get(
  "/:id",
  getPropertyById
);


/*
==================================================
OWNER ROUTES
==================================================
*/

// Create property
// POST /api/properties
//
// Supports:
// - Online image URLs
// - Multiple local images
//
router.post(
  "/",
  authMiddleware,
  upload.array("images", 10),
  createProperty
);


/*
==================================================
OWNER + ADMIN ROUTES
==================================================
*/

// Update property
// PUT /api/properties/:id
//
// Supports:
// - Online image URLs
// - Multiple local images
//
router.put(
  "/:id",
  authMiddleware,
  upload.array("images", 10),
  updateProperty
);


// Delete property
// DELETE /api/properties/:id
router.delete(
  "/:id",
  authMiddleware,
  deleteProperty
);


/*
==================================================
ADMIN ROUTES
==================================================
*/

// Admin update property status
router.put(
  "/admin/:id/status",
  authMiddleware,
  adminUpdatePropertyStatus
);

// Admin delete property
router.delete(
  "/admin/:id",
  authMiddleware,
  adminDeleteProperty
);


module.exports = router;