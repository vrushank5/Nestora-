const PgType = require("../models/PgType");

const normalizePgTypeName = (value) => {
  if (typeof value !== "string") return value;
  return value.trim();
};

const buildCaseInsensitiveExactMatcher = (value) => ({
  $regex: `^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
  $options: "i",
});

// Create PG Type
const createPgType = async (req, res) => {
  try {
    const { pgTypeName, isActive } = req.body;
    const normalizedPgTypeName = normalizePgTypeName(pgTypeName);

    if (!normalizedPgTypeName) {
      return res.status(400).json({
        success: false,
        message: "PG type name is required",
      });
    }

    const existingPgType = await PgType.findOne({
      pgTypeName: buildCaseInsensitiveExactMatcher(normalizedPgTypeName),
    });

    if (existingPgType) {
      return res.status(409).json({
        success: false,
        message: "PG type already exists",
      });
    }

    const lastPgType = await PgType.findOne().sort({ pgTypeId: -1 });
    const pgTypeId = lastPgType ? lastPgType.pgTypeId + 1 : 1;

    const pgType = await PgType.create({
      pgTypeId,
      pgTypeName: normalizedPgTypeName,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      message: "PG type created successfully",
      data: pgType,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create PG type",
      error: error.message,
    });
  }
};

// Get All PG Types
const getPgTypes = async (req, res) => {
  try {
    const pgTypes = await PgType.find().sort({ pgTypeId: 1 });

    res.status(200).json({
      success: true,
      data: pgTypes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get PG types",
      error: error.message,
    });
  }
};

// Get PG Type By ID
const getPgTypeById = async (req, res) => {
  try {
    const pgType = await PgType.findOne({ pgTypeId: req.params.id });

    if (!pgType) {
      return res.status(404).json({
        success: false,
        message: "PG type not found",
      });
    }

    res.status(200).json({
      success: true,
      data: pgType,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get PG type",
      error: error.message,
    });
  }
};

// Update PG Type
const updatePgType = async (req, res) => {
  try {
    const { pgTypeName, isActive } = req.body;
    const normalizedPgTypeName = normalizePgTypeName(pgTypeName);

    if (normalizedPgTypeName !== undefined && !normalizedPgTypeName) {
      return res.status(400).json({
        success: false,
        message: "PG type name is required",
      });
    }

    if (normalizedPgTypeName !== undefined) {
      const duplicatePgType = await PgType.findOne({
        pgTypeId: { $ne: Number(req.params.id) },
        pgTypeName: buildCaseInsensitiveExactMatcher(normalizedPgTypeName),
      });

      if (duplicatePgType) {
        return res.status(409).json({
          success: false,
          message: "PG type already exists",
        });
      }
    }

    const pgType = await PgType.findOneAndUpdate(
      { pgTypeId: req.params.id },
      {
        ...(normalizedPgTypeName !== undefined && {
          pgTypeName: normalizedPgTypeName,
        }),
        ...(isActive !== undefined && { isActive }),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!pgType) {
      return res.status(404).json({
        success: false,
        message: "PG type not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "PG type updated successfully",
      data: pgType,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update PG type",
      error: error.message,
    });
  }
};

// Delete PG Type
const deletePgType = async (req, res) => {
  try {
    const pgType = await PgType.findOneAndDelete({ pgTypeId: req.params.id });

    if (!pgType) {
      return res.status(404).json({
        success: false,
        message: "PG type not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "PG type deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete PG type",
      error: error.message,
    });
  }
};

module.exports = {
  createPgType,
  getPgTypes,
  getPgTypeById,
  updatePgType,
  deletePgType,
};
