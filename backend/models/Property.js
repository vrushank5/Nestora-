const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    propertyId: {
      type: Number,
      unique: true,
      required: true,
    },

    ownerId: {
      type: Number,
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    city: {
      type: String,
      default: "Ahmedabad",
      trim: true,
      maxlength: 100,
      index: true,
    },

    area: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    reviews: {
      type: Number,
      default: 0,
    },

    price: {
      type: String,
      required: true,
      trim: true,
    },

    priceValue: {
      type: Number,
      required: true,
      min: 0,
    },

    // Security deposit amount
    securityDeposit: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    amenities: {
      type: [String],
      default: [],
    },

    roomTypes: {
      type: [String],
      default: [],
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Unisex"],
      default: "Unisex",
    },

    occupancy: {
      type: String,
      default: "New listing",
    },

    description: {
      type: String,
      default: "",
      maxlength: 3000,
    },

    // Multiple property images
    // Can contain local paths and online URLs
    images: {
      type: [String],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Property",
  propertySchema,
  "property"
);