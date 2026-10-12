const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      unique: true,
      required: true,
    },

    roleId: {
      type: Number,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
    },

    gender: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    occupation: {
      type: String,
      required: true,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    imageUrl: {
      type: String,
      default: "",
    },

    ownerSettings: {
      notifications: {
        bookingRequests: { type: Boolean, default: true },
        paymentUpdates: { type: Boolean, default: true },
        residentMessages: { type: Boolean, default: true },
        productUpdates: { type: Boolean, default: false },
      },
      properties: {
        defaultCity: { type: String, trim: true, default: "Ahmedabad" },
        defaultAllowedGender: {
          type: String,
          enum: ["Unisex", "Male", "Female"],
          default: "Unisex",
        },
      },
      payments: {
        payoutMethod: {
          type: String,
          enum: ["bank-transfer", "upi"],
          default: "bank-transfer",
        },
        payoutEmail: { type: String, trim: true, lowercase: true, default: "" },
      },
      privacy: {
        shareContactWithResidents: { type: Boolean, default: true },
        personalizedInsights: { type: Boolean, default: true },
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);