const express = require("express");

const router = express.Router();

const {
  register,
  login,
  registerAdmin,
  googleLogin,
} = require("../controllers/authController");

// Register (Public: Owner + Resident)
router.post("/register", register);

// Register Admin (Requires admin key)
router.post("/register-admin", registerAdmin);

// Login
router.post("/login", login);

// Google Login
router.post("/google", googleLogin);

module.exports = router;
