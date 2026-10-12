const Property = require("../models/Property");

/*
========================================
HELPER FUNCTIONS
========================================
*/

// Safe array parser for JSON or FormData string inputs
const parseArrayField = (val) => {
  if (Array.isArray(val)) return val;

  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);

      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      return val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  return [];
};


// Convert MongoDB property into clean API response
const normalizeProperty = (property) => {
  return {
    id: property.propertyId,
    propertyId: property.propertyId,
    ownerId: property.ownerId,

    name: property.name,
    city: property.city,
    area: property.area,
    location: property.location,

    rating: Number(property.rating ?? 0),
    reviews: Number(property.reviews ?? 0),

    price: property.price
      ? String(property.price).replace(/₹|Rs\.?/g, '$')
      : `$${(property.priceValue ?? 0).toLocaleString('en-US')}/month`,
    priceValue: Number(property.priceValue ?? 0),

    // SECURITY DEPOSIT
    securityDeposit: Number(property.securityDeposit ?? 0),

    amenities: Array.isArray(property.amenities)
      ? property.amenities
      : [],

    roomTypes: Array.isArray(property.roomTypes)
      ? property.roomTypes
      : [],

    gender: property.gender || "Unisex",
    occupancy: property.occupancy || "New listing",

    description: property.description || "",

    // Multiple images
    images: Array.isArray(property.images)
      ? property.images
      : [],

    isActive: property.isActive,

    createdAt: property.createdAt,
    updatedAt: property.updatedAt,
  };
};


/*
========================================
GET ALL ACTIVE PROPERTIES
PUBLIC
========================================

GET /api/properties
*/

const getProperties = async (req, res) => {
  try {
    const {
      search,
      city,
      area,
      gender,
      roomType,
      roomTypes,
      amenity,
      amenities,
      minPrice,
      maxPrice,
      minRating,
      sort,
      page,
      limit,
    } = req.query;

    const filter = { isActive: true };

    // Search query across name, city, area, location
    if (search && typeof search === "string" && search.trim()) {
      const searchRegex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
      filter.$or = [
        { name: searchRegex },
        { city: searchRegex },
        { area: searchRegex },
        { location: searchRegex },
        { description: searchRegex },
      ];
    }

    // City filter
    if (city && typeof city === "string" && city.trim()) {
      filter.city = new RegExp(
        `^${city.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        "i"
      );
    }

    // Area filter
    if (area && typeof area === "string" && area.trim()) {
      filter.area = new RegExp(
        `^${area.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        "i"
      );
    }

    // Gender filter
    if (
      gender &&
      typeof gender === "string" &&
      ["Male", "Female", "Unisex"].includes(gender.trim())
    ) {
      filter.gender = gender.trim();
    }

    // Room type filter
    const roomTypeFilter = roomType || roomTypes;
    if (roomTypeFilter) {
      const types = Array.isArray(roomTypeFilter)
        ? roomTypeFilter
        : String(roomTypeFilter)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
      if (types.length > 0) {
        filter.roomTypes = { $in: types };
      }
    }

    // Amenity filter
    const amenityFilter = amenity || amenities;
    if (amenityFilter) {
      const items = Array.isArray(amenityFilter)
        ? amenityFilter
        : String(amenityFilter)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
      if (items.length > 0) {
        filter.amenities = { $in: items };
      }
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.priceValue = {};
      if (minPrice !== undefined && !isNaN(Number(minPrice))) {
        filter.priceValue.$gte = Math.max(0, Number(minPrice));
      }
      if (maxPrice !== undefined && !isNaN(Number(maxPrice))) {
        filter.priceValue.$lte = Number(maxPrice);
      }
      if (Object.keys(filter.priceValue).length === 0) {
        delete filter.priceValue;
      }
    }

    // Min rating filter
    if (minRating !== undefined && !isNaN(Number(minRating))) {
      filter.rating = { $gte: Number(minRating) };
    }

    // Sorting
    let sortOptions = { propertyId: -1 };
    if (sort === "price_asc") {
      sortOptions = { priceValue: 1, propertyId: -1 };
    } else if (sort === "price_desc") {
      sortOptions = { priceValue: -1, propertyId: -1 };
    } else if (sort === "rating_desc") {
      sortOptions = { rating: -1, propertyId: -1 };
    } else if (sort === "newest") {
      sortOptions = { propertyId: -1 };
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const usePagination =
      !isNaN(pageNum) && pageNum > 0 && !isNaN(limitNum) && limitNum > 0;

    let query = Property.find(filter).sort(sortOptions);

    if (usePagination) {
      const skip = (pageNum - 1) * limitNum;
      query = query.skip(skip).limit(limitNum);
    }

    const properties = await query.lean();
    const normalized = properties.map(normalizeProperty);

    if (usePagination) {
      const total = await Property.countDocuments(filter);
      return res.status(200).json({
        success: true,
        message: "Properties fetched successfully",
        data: normalized,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Properties fetched successfully",
      data: normalized,
    });
  } catch (error) {
    console.error("Get properties error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/*
========================================
GET SINGLE PROPERTY
PUBLIC
========================================

GET /api/properties/:id
*/

const getPropertyById = async (req, res) => {
  try {
    const propertyId = Number(req.params.id);

    // Validate ID
    if (!Number.isInteger(propertyId) || propertyId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID",
      });
    }

    const property = await Property.findOne({
      propertyId,
      isActive: true,
    }).lean();

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Property fetched successfully",
      data: normalizeProperty(property),
    });
  } catch (error) {
    console.error("Get property by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/*
========================================
GET OWNER PROPERTIES
PROTECTED
========================================

GET /api/properties/owner/my

Owner ID comes from JWT.
DO NOT take ownerId from req.body.
*/

const getOwnerProperties = async (req, res) => {
  try {
    if (!req.user || req.user.userId === undefined) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const ownerId = Number(req.user.userId);

    if (!Number.isInteger(ownerId) || ownerId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid user identity",
      });
    }

    const properties = await Property.find({
      ownerId,
    })
      .sort({ propertyId: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Owner properties fetched successfully",
      data: properties.map(normalizeProperty),
    });
  } catch (error) {
    console.error("Get owner properties error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/*
========================================
CREATE PROPERTY
PROTECTED
========================================

POST /api/properties

Owner ID comes from JWT.
*/

const createProperty = async (req, res) => {
  try {
    /*
    ----------------------------------------
    GET OWNER ID FROM JWT
    ----------------------------------------
    */

    if (!req.user || req.user.userId === undefined) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (![1, 2].includes(Number(req.user.roleId))) {
      return res.status(403).json({
        success: false,
        message: "Only Property Owners or Admins can create listings",
      });
    }

    const ownerId = Number(req.user.userId);


    /*
    ----------------------------------------
    GET REQUEST DATA
    ----------------------------------------
    */

    let {
      name,
      city = "Ahmedabad",
      area,
      location,
      price,
      priceValue,
      securityDeposit = 0,
      amenities = [],
      roomTypes = [],
      gender = "Unisex",
      occupancy = "New listing",
      description = "",
      images = [],
    } = req.body;


    /*
    ----------------------------------------
    PROCESS UPLOADED IMAGES
    ----------------------------------------
    */

    const uploadedImages = (req.files || []).map(
      (file) => `/uploads/properties/${file.filename}`
    );


    /*
    ----------------------------------------
    PROCESS ONLINE IMAGES
    ----------------------------------------
    */

    const parsedImages = parseArrayField(images);

    const cleanImages = [
      ...parsedImages,
      ...uploadedImages,
    ]
      .filter((img) => typeof img === "string")
      .map((img) => img.trim())
      .filter(Boolean);


    /*
    ----------------------------------------
    PROCESS AMENITIES
    ----------------------------------------
    */

    const cleanAmenities = parseArrayField(amenities)
      .filter((item) => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);


    /*
    ----------------------------------------
    PROCESS ROOM TYPES
    ----------------------------------------
    */

    const cleanRoomTypes = parseArrayField(roomTypes)
      .filter((item) => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);


    /*
    ----------------------------------------
    REQUIRED VALIDATION
    ----------------------------------------
    */

    if (
      !name ||
      !area ||
      !location ||
      !price ||
      priceValue === undefined ||
      priceValue === null
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, area, location, price, and priceValue are required",
      });
    }


    /*
    ----------------------------------------
    STRING VALIDATION
    ----------------------------------------
    */

    if (
      typeof name !== "string" ||
      typeof area !== "string" ||
      typeof location !== "string" ||
      typeof price !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid property data",
      });
    }


    /*
    ----------------------------------------
    PRICE VALIDATION
    ----------------------------------------
    */

    const numericPrice = Number(priceValue);

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        success: false,
        message:
          "priceValue must be a valid number greater than or equal to 0",
      });
    }


    /*
    ----------------------------------------
    SECURITY DEPOSIT VALIDATION
    ----------------------------------------
    */

    const numericSecurityDeposit = Number(securityDeposit);

    if (
      !Number.isFinite(numericSecurityDeposit) ||
      numericSecurityDeposit < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "securityDeposit must be a valid number greater than or equal to 0",
      });
    }


    /*
    ----------------------------------------
    GENDER VALIDATION
    ----------------------------------------
    */

    const allowedGender = [
      "Male",
      "Female",
      "Unisex",
    ];

    if (!allowedGender.includes(gender)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gender",
      });
    }


    /*
    ----------------------------------------
    GENERATE PROPERTY ID
    ----------------------------------------
    */

    const lastProperty = await Property.findOne()
      .sort({ propertyId: -1 })
      .select("propertyId")
      .lean();

    const propertyId = lastProperty
      ? Number(lastProperty.propertyId) + 1
      : 1;


    /*
    ----------------------------------------
    CREATE PROPERTY
    ----------------------------------------
    */

    const property = await Property.create({
      propertyId,

      // IMPORTANT:
      // ownerId comes from JWT
      ownerId,

      name: name.trim(),

      city:
        typeof city === "string" && city.trim()
          ? city.trim()
          : "Ahmedabad",

      area: area.trim(),

      location: location.trim(),

      rating: 0,

      reviews: 0,

      price: price.trim(),

      priceValue: numericPrice,

      // SECURITY DEPOSIT
      securityDeposit: numericSecurityDeposit,

      amenities: cleanAmenities,

      roomTypes: cleanRoomTypes,

      gender,

      occupancy:
        typeof occupancy === "string"
          ? occupancy.trim()
          : "New listing",

      description:
        typeof description === "string"
          ? description.trim()
          : "",

      // Multiple images
      images: cleanImages,

      isActive: true,
    });


    /*
    ----------------------------------------
    SUCCESS RESPONSE
    ----------------------------------------
    */

    return res.status(201).json({
      success: true,
      message: "Property created successfully",
      data: normalizeProperty(property),
    });
  } catch (error) {
    console.error("Create property error:", error);


    /*
    ----------------------------------------
    DUPLICATE PROPERTY ID
    ----------------------------------------
    */

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Property ID already exists. Please try again.",
      });
    }


    /*
    ----------------------------------------
    MONGOOSE VALIDATION ERROR
    ----------------------------------------
    */

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err) => err.message
      );

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: messages,
      });
    }


    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/*
========================================
UPDATE PROPERTY
PROTECTED
========================================

PUT /api/properties/:id

Only the owner of the property can update it.
*/

const updateProperty = async (req, res) => {
  try {
    /*
    ----------------------------------------
    AUTHENTICATION
    ----------------------------------------
    */

    if (!req.user || req.user.userId === undefined) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const ownerId = Number(req.user.userId);
    const propertyId = Number(req.params.id);

    if (!Number.isInteger(ownerId) || ownerId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid user identity",
      });
    }

    if (!Number.isInteger(propertyId) || propertyId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID",
      });
    }


    /*
    ----------------------------------------
    FIND PROPERTY
    ----------------------------------------
    */

    const property = await Property.findOne({
      propertyId,
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }


    /*
    ----------------------------------------
    OWNER SECURITY CHECK
    ----------------------------------------
    */

    const isOwner = Number(property.ownerId) === ownerId;
    const isAdmin = Number(req.user.roleId) === 1;
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to update this property",
      });
    }


    /*
    ----------------------------------------
    PROCESS UPLOADED IMAGES
    ----------------------------------------
    */

    const uploadedImages = (req.files || []).map(
      (file) => `/uploads/properties/${file.filename}`
    );


    /*
    ----------------------------------------
    PROCESS FORM DATA
    ----------------------------------------
    */

    if (typeof req.body.isActive === "string") {
      req.body.isActive =
        req.body.isActive === "true";
    }


    if (typeof req.body.priceValue === "string") {
      req.body.priceValue =
        Number(req.body.priceValue);
    }


    if (
      typeof req.body.securityDeposit ===
      "string"
    ) {
      req.body.securityDeposit =
        Number(req.body.securityDeposit);
    }


    if (req.body.amenities !== undefined) {
      req.body.amenities =
        parseArrayField(req.body.amenities);
    }


    if (req.body.roomTypes !== undefined) {
      req.body.roomTypes =
        parseArrayField(req.body.roomTypes);
    }


    /*
    ----------------------------------------
    PROCESS IMAGES
    ----------------------------------------
    */

    if (
      req.body.images !== undefined ||
      uploadedImages.length > 0
    ) {
      const existing =
        req.body.images !== undefined
          ? parseArrayField(req.body.images)
          : property.images;

      req.body.images = [
        ...existing,
        ...uploadedImages,
      ];
    }


    /*
    ----------------------------------------
    ALLOWED FIELDS
    ----------------------------------------
    */

    const allowedFields = [
      "name",
      "city",
      "area",
      "location",
      "price",
      "priceValue",
      "securityDeposit",
      "amenities",
      "roomTypes",
      "gender",
      "occupancy",
      "description",
      "images",
      "isActive",
    ];


    /*
    ----------------------------------------
    UPDATE FIELDS
    ----------------------------------------
    */

    for (const field of allowedFields) {
      if (req.body[field] === undefined) {
        continue;
      }


      /*
      ----------------------------------------
      STRING FIELDS
      ----------------------------------------
      */

      if (
        [
          "name",
          "city",
          "area",
          "location",
          "price",
          "occupancy",
          "description",
        ].includes(field)
      ) {
        if (
          typeof req.body[field] !== "string"
        ) {
          return res.status(400).json({
            success: false,
            message: `${field} must be a string`,
          });
        }

        property[field] =
          req.body[field].trim();
      }


      /*
      ----------------------------------------
      PRICE
      ----------------------------------------
      */

      else if (field === "priceValue") {
        const value =
          Number(req.body[field]);

        if (
          !Number.isFinite(value) ||
          value < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "priceValue must be a valid number greater than or equal to 0",
          });
        }

        property[field] = value;
      }


      /*
      ----------------------------------------
      SECURITY DEPOSIT
      ----------------------------------------
      */

      else if (
        field === "securityDeposit"
      ) {
        const value =
          Number(req.body[field]);

        if (
          !Number.isFinite(value) ||
          value < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "securityDeposit must be a valid number greater than or equal to 0",
          });
        }

        property[field] = value;
      }


      /*
      ----------------------------------------
      ARRAYS
      ----------------------------------------
      */

      else if (
        field === "amenities" ||
        field === "roomTypes" ||
        field === "images"
      ) {
        if (
          !Array.isArray(req.body[field])
        ) {
          return res.status(400).json({
            success: false,
            message:
              `${field} must be an array`,
          });
        }

        property[field] =
          req.body[field]
            .filter(
              (item) =>
                typeof item === "string"
            )
            .map((item) =>
              item.trim()
            )
            .filter(Boolean);
      }


      /*
      ----------------------------------------
      GENDER
      ----------------------------------------
      */

      else if (field === "gender") {
        const allowedGender = [
          "Male",
          "Female",
          "Unisex",
        ];

        if (
          !allowedGender.includes(
            req.body[field]
          )
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid gender",
          });
        }

        property[field] =
          req.body[field];
      }


      /*
      ----------------------------------------
      ACTIVE STATUS
      ----------------------------------------
      */

      else if (field === "isActive") {
        if (
          typeof req.body[field] !==
          "boolean"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "isActive must be true or false",
          });
        }

        property[field] =
          req.body[field];
      }
    }


    /*
    ----------------------------------------
    SAVE
    ----------------------------------------
    */

    await property.save();


    /*
    ----------------------------------------
    SUCCESS
    ----------------------------------------
    */

    return res.status(200).json({
      success: true,
      message:
        "Property updated successfully",
      data: normalizeProperty(property),
    });
  } catch (error) {
    console.error(
      "Update property error:",
      error
    );


    if (
      error.name ===
      "ValidationError"
    ) {
      const messages =
        Object.values(
          error.errors
        ).map(
          (err) => err.message
        );

      return res.status(400).json({
        success: false,
        message:
          "Validation failed",
        errors: messages,
      });
    }


    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/*
========================================
DELETE PROPERTY
PROTECTED
========================================

DELETE /api/properties/:id

Soft delete:
isActive = false

The property is NOT permanently removed.
*/

const deleteProperty = async (req, res) => {
  try {
    /*
    ----------------------------------------
    AUTHENTICATION
    ----------------------------------------
    */

    if (!req.user || req.user.userId === undefined) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const ownerId = Number(req.user.userId);
    const propertyId = Number(req.params.id);

    if (!Number.isInteger(ownerId) || ownerId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid user identity",
      });
    }

    if (!Number.isInteger(propertyId) || propertyId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID",
      });
    }


    /*
    ----------------------------------------
    FIND PROPERTY
    ----------------------------------------
    */

    const property = await Property.findOne({
      propertyId,
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }


    /*
    ----------------------------------------
    OWNER SECURITY CHECK
    ----------------------------------------
    */

    const isOwner = Number(property.ownerId) === ownerId;
    const isAdmin = Number(req.user.roleId) === 1;
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to delete this property",
      });
    }


    /*
    ----------------------------------------
    SOFT DELETE
    ----------------------------------------
    */

    property.isActive = false;

    await property.save();


    return res.status(200).json({
      success: true,
      message:
        "Property deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete property error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/*
========================================
ADMIN PROPERTY MANAGEMENT
PROTECTED (Admin only)
========================================
*/

const adminUpdatePropertyStatus = async (req, res) => {
  try {
    if (!req.user || Number(req.user.roleId) !== 1) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const propertyId = Number(req.params.id);
    if (!Number.isInteger(propertyId) || propertyId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID",
      });
    }

    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean",
      });
    }

    const property = await Property.findOne({ propertyId });
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    property.isActive = isActive;
    await property.save();

    return res.status(200).json({
      success: true,
      message: `Property ${isActive ? "activated" : "deactivated"} successfully`,
      data: normalizeProperty(property),
    });
  } catch (error) {
    console.error("Admin update property status error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const adminDeleteProperty = async (req, res) => {
  try {
    if (!req.user || Number(req.user.roleId) !== 1) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const propertyId = Number(req.params.id);
    if (!Number.isInteger(propertyId) || propertyId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID",
      });
    }

    const property = await Property.findOne({ propertyId });
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    property.isActive = false;
    await property.save();

    return res.status(200).json({
      success: true,
      message: "Property deactivated by admin",
    });
  } catch (error) {
    console.error("Admin delete property error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/*
========================================
EXPORTS
========================================
*/

module.exports = {
  getProperties,
  getPropertyById,
  getOwnerProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  adminUpdatePropertyStatus,
  adminDeleteProperty,
};