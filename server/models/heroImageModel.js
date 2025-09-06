const mongoose = require("mongoose");

/**
 * Hero Image Schema
 * Schema for hero banner images with device-specific variants
 */
const heroImageSchema = new mongoose.Schema(
  {
    public_id: {
      type: String,
      required: true,
      unique: true,
    },
    url: {
      type: String,
      required: true,
    },
    // Add these new fields for different device images
    mobileUrl: {
      type: String,
      required: false, // Optional, falls back to main url
    },
    desktopUrl: {
      type: String,
      required: false, // Optional, falls back to main url
    },
    alt: {
      type: String,
      default: "Hero Image",
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HeroImage", heroImageSchema);
