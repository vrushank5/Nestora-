const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { requireResident, getResidentData } = require("../controllers/residentController");

const router = express.Router();
router.use(authMiddleware, requireResident);
router.get("/:collection", getResidentData);

module.exports = router;