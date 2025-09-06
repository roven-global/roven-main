const mongoose = require("mongoose");

/**
 * Cart Product Schema
 * Schema for items in user's shopping cart with variant support
 */
const cartproductSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, "Quantity must be at least 1"],
    },
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    // Variant information for products with variants
    variant: {
      sku: {
        type: String,
        trim: true,
        uppercase: true,
      },
      volume: {
        type: String,
        trim: true,
      },
      price: {
        type: Number,
        min: [0, "Price cannot be negative"],
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique product-variant combinations per user
cartproductSchema.index(
  { userId: 1, productId: 1, "variant.sku": 1 },
  { unique: true }
);

module.exports = mongoose.model("cartProduct", cartproductSchema);
