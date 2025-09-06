const mongoose = require("mongoose");

/**
 * Coupon Schema
 * Schema for discount coupons with usage tracking and validation
 */
const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [20, "Coupon code cannot exceed 20 characters"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Coupon name is required"],
      trim: true,
      maxlength: [100, "Coupon name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: [true, "Coupon type is required"],
    },
    value: {
      type: Number,
      required: [true, "Coupon value is required"],
      min: [0, "Value cannot be negative"],
    },
    // For percentage coupons, max discount amount
    maxDiscount: {
      type: Number,
      min: [0, "Max discount cannot be negative"],
    },
    // Minimum order amount required
    minOrderAmount: {
      type: Number,
      required: [true, "Minimum order amount is required"],
      min: [0, "Minimum order amount cannot be negative"],
    },
    // Maximum order amount limit
    maxOrderAmount: {
      type: Number,
      min: [0, "Maximum order amount cannot be negative"],
    },
    // Usage limits
    usageLimit: {
      type: Number,
      required: [true, "Usage limit is required"],
      min: [1, "Usage limit must be at least 1"],
    },
    usedCount: {
      type: Number,
      default: 0,
      min: [0, "Used count cannot be negative"],
    },
    // Per user usage limit
    perUserLimit: {
      type: Number,
      default: 1,
      min: [1, "Per user limit must be at least 1"],
    },
    // Valid date range
    validFrom: {
      type: Date,
      required: [true, "Valid from date is required"],
    },
    validTo: {
      type: Date,
      required: [true, "Valid to date is required"],
    },
    // Applicable categories (empty means all categories)
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    // Applicable products (empty means all products)
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    // Excluded categories
    excludedCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    // Excluded products
    excludedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    // First time user only
    firstTimeUserOnly: {
      type: Boolean,
      default: false,
    },
    // Active status
    isActive: {
      type: Boolean,
      default: true,
    },
    // Created by admin
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
couponSchema.index({ isActive: 1, validFrom: 1, validTo: 1 });
couponSchema.index({ usageLimit: 1, usedCount: 1 });

// Virtual for checking if coupon is valid
couponSchema.virtual("isValid").get(function () {
  const now = new Date();
  return (
    this.isActive &&
    this.usedCount < this.usageLimit &&
    now >= this.validFrom &&
    now <= this.validTo
  );
});

// Virtual for remaining usage
couponSchema.virtual("remainingUsage").get(function () {
  return Math.max(0, this.usageLimit - this.usedCount);
});

// Method to check if coupon can be applied to an order
couponSchema.methods.canBeApplied = function (
  orderAmount,
  userId,
  userOrderCount = 0,
  cartItems = []
) {
  // Check basic validity
  if (!this.isValid) {
    return { valid: false, message: "Coupon is not valid" };
  }

  // Check order amount
  if (orderAmount < this.minOrderAmount) {
    return {
      valid: false,
      message: `Minimum order amount of ₹${this.minOrderAmount} required`,
    };
  }

  if (this.maxOrderAmount && orderAmount > this.maxOrderAmount) {
    return {
      valid: false,
      message: `Maximum order amount of ₹${this.maxOrderAmount} exceeded`,
    };
  }

  // Check first time user restriction
  if (this.firstTimeUserOnly && userOrderCount > 0) {
    return {
      valid: false,
      message: "This coupon is only for first-time users",
    };
  }

  // Check product and category restrictions
  const hasApplicableProducts = this.applicableProducts.length > 0;
  const hasApplicableCategories = this.applicableCategories.length > 0;

  if (hasApplicableProducts || hasApplicableCategories) {
    const isApplicable = cartItems.some((item) => {
      const productId = item.productId._id || item.productId;
      const categoryId = item.productId.category;

      const productMatch = hasApplicableProducts
        ? this.applicableProducts.some((pId) => pId.equals(productId))
        : false;
      const categoryMatch = hasApplicableCategories
        ? this.applicableCategories.some((cId) => cId.equals(categoryId))
        : false;

      return productMatch || categoryMatch;
    });

    if (!isApplicable) {
      return {
        valid: false,
        message: "Coupon is not applicable to any items in your cart.",
      };
    }
  }

  return { valid: true, message: "Coupon can be applied" };
};

// Method to calculate discount amount
couponSchema.methods.calculateDiscount = function (orderAmount) {
  let discount = 0;

  if (this.type === "percentage") {
    discount = (orderAmount * this.value) / 100;
    if (this.maxDiscount) {
      discount = Math.min(discount, this.maxDiscount);
    }
  } else if (this.type === "fixed") {
    discount = Math.min(this.value, orderAmount);
  }

  return Math.round(discount * 100) / 100; // Round to 2 decimal places
};

/**
 * Pre-save middleware to validate date ranges
 */
couponSchema.pre("save", function (next) {
  if (this.validTo <= this.validFrom) {
    return next(new Error("Valid to date must be after valid from date"));
  }
  next();
});

module.exports = mongoose.model("Coupon", couponSchema);
