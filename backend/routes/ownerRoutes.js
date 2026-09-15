const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  requireOwner,
  getOwnerData,
  getOwnerSummary,
  getOwnerMenu,
  updateOwnerMenu,
} = require("../controllers/ownerController");

const router = express.Router();
router.use(authMiddleware, requireOwner);
router.get("/summary", getOwnerSummary);
router.get("/menu", getOwnerMenu);
router.put("/menu", updateOwnerMenu);
router.get("/:collection", getOwnerData);

module.exports = router;
