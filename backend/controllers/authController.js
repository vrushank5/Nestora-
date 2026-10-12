const User = require("../models/User");
const Role = require("../models/Role");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  "256310634339-0606u1kl806cgnqtu96og4u243jssvo9.apps.googleusercontent.com";

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// =====================================================
// REGISTER USER
// POST /api/auth/register
// Owner + Resident allowed
// Admin registration NOT allowed
// =====================================================

const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      mobile,
      gender,
      address,
      occupation,
      roleId,
      imageUrl,
    } = req.body;

    // =================================================
    // 1. Check required fields
    // =================================================

    if (
      !name ||
      !email ||
      !password ||
      !mobile ||
      !gender ||
      !address ||
      !occupation ||
      !roleId
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // =================================================
    // 2. Clean input
    // =================================================

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = mobile.trim();
    const cleanGender = gender.trim();
    const cleanAddress = address.trim();
    const cleanOccupation = occupation.trim();
    const selectedRoleId = Number(roleId);

    // =================================================
    // 3. Validate role
    // =================================================

    // Only Owner (2) and Resident (3) can register.
    // Admin (1) is NOT allowed through public registration.

    if (![2, 3].includes(selectedRoleId)) {
      return res.status(403).json({
        success: false,
        message: "Only Owner or Resident can register",
      });
    }

    // =================================================
    // 4. Check role exists and is active
    // =================================================

    const role = await Role.findOne({
      roleId: selectedRoleId,
      isActive: true,
    });

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Invalid or inactive role",
      });
    }

    // =================================================
    // 5. Check email format
    // =================================================

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    // =================================================
    // 6. Validate password
    // =================================================

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // =================================================
    // 7. Check email already exists
    // =================================================

    const existingUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // =================================================
    // 8. Generate new user ID
    // =================================================

    const lastUser = await User.findOne().sort({ userId: -1 }).select("userId");

    const userId = lastUser ? lastUser.userId + 1 : 1;

    // =================================================
    // 9. Hash password
    // =================================================

    const hashedPassword = await bcrypt.hash(password, 12);

    // =================================================
    // 10. Create user
    // =================================================

    const user = await User.create({
      userId,

      roleId: selectedRoleId,

      name: cleanName,

      email: cleanEmail,

      password: hashedPassword,

      mobile: cleanMobile,

      gender: cleanGender,

      address: cleanAddress,

      occupation: cleanOccupation,

      imageUrl: imageUrl || "",

      isActive: true,
    });

    // =================================================
    // 11. Registration response
    // =================================================

    return res.status(201).json({
      success: true,
      message: "Registration successful",

      user: {
        userId: user.userId,
        roleId: user.roleId,
        roleName: role.roleName,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        gender: user.gender,
        address: user.address,
        occupation: user.occupation,
        imageUrl: user.imageUrl,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);

    // Duplicate value error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email or User ID already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// LOGIN USER
// POST /api/auth/login
// =====================================================

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // =================================================
    // 1. Check required fields
    // =================================================

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // =================================================
    // 2. Clean email
    // =================================================

    const cleanEmail = email.trim().toLowerCase();

    // =================================================
    // 3. Find user
    // =================================================

    const user = await User.findOne({
      email: cleanEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // =================================================
    // 4. Check user active status
    // =================================================

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    const ADMIN_EMAIL = "nestora2671@gmail.com";
    if (cleanEmail === ADMIN_EMAIL && user.roleId !== 1) {
      user.roleId = 1;
      await user.save();
    } else if (user.roleId === 1 && cleanEmail !== ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: "Admin access is strictly restricted to nestora2671@gmail.com",
      });
    }

    // =================================================
    // 5. Check password
    // =================================================

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // =================================================
    // 6. Find user's role
    // =================================================

    const role = await Role.findOne({
      roleId: user.roleId,
      isActive: true,
    });

    if (!role) {
      return res.status(403).json({
        success: false,
        message: "User role is invalid or inactive",
      });
    }

    // =================================================
    // 7. Create JWT
    // =================================================

    const token = jwt.sign(
      {
        userId: user.userId,
        roleId: user.roleId,
        roleName: role.roleName,
        email: user.email,
      },

      process.env.JWT_SECRET || "nestora_jwt_secret_key_2026",

      {
        expiresIn: "1d",
      },
    );

    // =================================================
    // 8. Login response
    // =================================================

    return res.status(200).json({
      success: true,
      message: "Login successful",

      token,

      user: {
        userId: user.userId,
        roleId: user.roleId,
        roleName: role.roleName,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        gender: user.gender,
        address: user.address,
        occupation: user.occupation,
        imageUrl: user.imageUrl,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// REGISTER ADMIN USER
// POST /api/auth/register-admin
// Requires secret admin key
// =====================================================

const registerAdmin = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      mobile,
      gender,
      address,
      occupation,
      adminKey,
      imageUrl,
    } = req.body;

    // =================================================
    // 1. Validate admin key
    // =================================================

    const validAdminKey =
      process.env.ADMIN_REGISTRATION_KEY || "nestora-admin-2024";

    if (!adminKey || adminKey !== validAdminKey) {
      return res.status(403).json({
        success: false,
        message: "Invalid or missing admin registration key",
      });
    }

    // =================================================
    // 2. Check required fields
    // =================================================

    if (
      !name ||
      !email ||
      !password ||
      !mobile ||
      !gender ||
      !address ||
      !occupation
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // =================================================
    // 3. Clean input
    // =================================================

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = mobile.trim();
    const cleanGender = gender.trim();
    const cleanAddress = address.trim();
    const cleanOccupation = occupation.trim();

    // =================================================
    // 4. Check email format
    // =================================================

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    // =================================================
    // 5. Validate password
    // =================================================

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // =================================================
    // 6. Check email already exists
    // =================================================

    const existingUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // =================================================
    // 7. Get admin role (roleId = 1)
    // =================================================

    const role = await Role.findOne({
      roleId: 1,
      isActive: true,
    });

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Admin role is not available",
      });
    }

    // =================================================
    // 8. Generate new user ID
    // =================================================

    const lastUser = await User.findOne().sort({ userId: -1 }).select("userId");

    const userId = lastUser ? lastUser.userId + 1 : 1;

    // =================================================
    // 9. Hash password
    // =================================================

    const hashedPassword = await bcrypt.hash(password, 12);

    // =================================================
    // 10. Create admin user
    // =================================================

    const user = await User.create({
      userId,
      roleId: 1,
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      mobile: cleanMobile,
      gender: cleanGender,
      address: cleanAddress,
      occupation: cleanOccupation,
      imageUrl: imageUrl || "",
      isActive: true,
    });

    // =================================================
    // 11. Admin registration response
    // =================================================

    return res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      user: {
        userId: user.userId,
        roleId: user.roleId,
        roleName: role.roleName,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        gender: user.gender,
        address: user.address,
        occupation: user.occupation,
        imageUrl: user.imageUrl,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Admin Registration Error:", error);

    // Duplicate value error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email or User ID already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// GOOGLE LOGIN
// POST /api/auth/google
// Auto-registers new users as Resident
// Existing users login with their current role (including admin)
// =====================================================

const googleLogin = async (req, res) => {
  try {
    const { token, roleId: requestedRoleId } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Google token is required",
      });
    }

    // Verify token with Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name ? name.trim() : "Google User";

    // Check if user exists with this email (any role)
    let user = await User.findOne({
      email: cleanEmail,
    });

    const ADMIN_EMAIL = "nestora2671@gmail.com";

    // Strictly restrict Admin role (roleId = 1) to nestora2671@gmail.com
    if (cleanEmail === ADMIN_EMAIL) {
      // Auto-assign Admin role (1) for this specific email
      if (!user) {
        const adminRole = await Role.findOne({ roleId: 1, isActive: true });
        if (!adminRole) {
          return res.status(400).json({
            success: false,
            message: "Admin role is not available",
          });
        }
        const lastUser = await User.findOne().sort({ userId: -1 }).select("userId");
        const userId = lastUser ? lastUser.userId + 1 : 1;
        const randomPassword = Math.random().toString(36).slice(-15);
        const hashedPassword = await bcrypt.hash(randomPassword, 12);

        user = await User.create({
          userId,
          roleId: 1,
          name: cleanName,
          email: cleanEmail,
          password: hashedPassword,
          mobile: "Not provided",
          gender: "Other",
          address: "Not provided",
          occupation: "System Admin",
          imageUrl: picture || "",
          isActive: true,
        });
      } else if (user.roleId !== 1) {
        user.roleId = 1;
        await user.save();
      }
    } else {
      // Any other email trying to access Admin role is rejected
      if (Number(requestedRoleId) === 1 || (user && user.roleId === 1)) {
        return res.status(403).json({
          success: false,
          message: "Admin access is strictly restricted to nestora2671@gmail.com",
        });
      }

      const targetRoleId = [2, 3].includes(Number(requestedRoleId)) ? Number(requestedRoleId) : 3;

      // If user doesn't exist, register with target role (Owner or Resident)
      if (!user) {
        const targetRole = await Role.findOne({
          roleId: targetRoleId,
          isActive: true,
        });

        if (!targetRole) {
          return res.status(400).json({
            success: false,
            message: "Selected role is not available",
          });
        }

        const lastUser = await User.findOne().sort({ userId: -1 }).select("userId");
        const userId = lastUser ? lastUser.userId + 1 : 1;
        const randomPassword = Math.random().toString(36).slice(-15);
        const hashedPassword = await bcrypt.hash(randomPassword, 12);

        user = await User.create({
          userId,
          roleId: targetRoleId,
          name: cleanName,
          email: cleanEmail,
          password: hashedPassword,
          mobile: "Not provided",
          gender: "Other",
          address: "Not provided",
          occupation: "Not provided",
          imageUrl: picture || "",
          isActive: true,
        });
      }
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    // Find user's role (could be admin, owner, or resident)
    const role = await Role.findOne({
      roleId: user.roleId,
      isActive: true,
    });

    if (!role) {
      return res.status(403).json({
        success: false,
        message: "User role is invalid or inactive",
      });
    }

    // Create JWT
    const jwtToken = jwt.sign(
      {
        userId: user.userId,
        roleId: user.roleId,
        roleName: role.roleName,
        email: user.email,
      },
      process.env.JWT_SECRET || "nestora_jwt_secret_key_2026",
      {
        expiresIn: "1d",
      },
    );

    return res.status(200).json({
      success: true,
      message: "Google Login successful",
      token: jwtToken,
      user: {
        userId: user.userId,
        roleId: user.roleId,
        roleName: role.roleName,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        gender: user.gender,
        address: user.address,
        occupation: user.occupation,
        imageUrl: user.imageUrl,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during Google Login",
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  register,
  login,
  registerAdmin,
  googleLogin,
};
