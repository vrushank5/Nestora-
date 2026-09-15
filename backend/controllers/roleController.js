const Role = require("../models/Role");

// Create Role
const createRole = async (req, res) => {
  try {
    const { roleName, isActive } = req.body;

    if (!roleName) {
      return res.status(400).json({
        success: false,
        message: "Role name is required",
      });
    }

    // Check if role already exists
    const existingRole = await Role.findOne({ roleName });

    if (existingRole) {
      return res.status(409).json({
        success: false,
        message: "Role already exists",
      });
    }

    // Generate next roleId
    const lastRole = await Role.findOne().sort({ roleId: -1 });

    const roleId = lastRole ? lastRole.roleId + 1 : 1;

    const role = await Role.create({
      roleId,
      roleName,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: role,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create role",
      error: error.message,
    });
  }
};

// Get All Roles
const getRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ roleId: 1 });

    res.status(200).json({
      success: true,
      data: roles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get roles",
      error: error.message,
    });
  }
};

// Get Role By ID
const getRoleById = async (req, res) => {
  try {
    const role = await Role.findOne({
      roleId: req.params.id,
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.status(200).json({
      success: true,
      data: role,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get role",
      error: error.message,
    });
  }
};

// Update Role
const updateRole = async (req, res) => {
  try {
    const { roleName, isActive } = req.body;

    const role = await Role.findOneAndUpdate(
      { roleId: req.params.id },
      {
        ...(roleName !== undefined && { roleName }),
        ...(isActive !== undefined && { isActive }),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: role,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update role",
      error: error.message,
    });
  }
};

// Delete Role
const deleteRole = async (req, res) => {
  try {
    const role = await Role.findOneAndDelete({
      roleId: req.params.id,
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete role",
      error: error.message,
    });
  }
};

module.exports = {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
};