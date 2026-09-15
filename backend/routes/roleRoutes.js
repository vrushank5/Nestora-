const express = require("express");

const {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
} = require("../controllers/roleController");

const router = express.Router();

// Create Role
router.post("/", createRole);

// Get All Roles
router.get("/", getRoles);

// Get Role By ID
router.get("/:id", getRoleById);

// Update Role
router.put("/:id", updateRole);

// Delete Role
router.delete("/:id", deleteRole);

module.exports = router;