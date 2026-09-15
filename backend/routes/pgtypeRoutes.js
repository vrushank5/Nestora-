const express = require("express");

const {
  createPgType,
  getPgTypes,
  getPgTypeById,
  updatePgType,
  deletePgType,
} = require("../controllers/pgtypeController");

const router = express.Router();

// Create PG Type
router.post("/", createPgType);

// Get All PG Types
router.get("/", getPgTypes);

// Get PG Type By ID
router.get("/:id", getPgTypeById);

// Update PG Type
router.put("/:id", updatePgType);

// Delete PG Type
router.delete("/:id", deletePgType);

module.exports = router;
