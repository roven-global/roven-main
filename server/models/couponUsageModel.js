const mongoose = require("mongoose");

const couponUsageSchema = new mongoose.Schema(
  {
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: [0, "Discount amount cannot be negative"],
    },
    orderAmount: {
      type: Number,
      required: true,
      min: [0, "Order amount cannot be negative"],
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique coupon-user combinations
couponUsageSchema.index({ coupon: 1, user: 1 });

// Index for efficient queries
couponUsageSchema.index({ user: 1, usedAt: -1 });
couponUsageSchema.index({ coupon: 1, usedAt: -1 });

// Method to get usage count for a user
couponUsageSchema.statics.getUserUsageCount = function (couponId, userId) {
  return this.countDocuments({ coupon: couponId, user: userId });
};

// Method to check if user can use coupon
couponUsageSchema.statics.canUserUseCoupon = async function (couponId, userId, perUserLimit) {
  const usageCount = await this.getUserUsageCount(couponId, userId);
  return usageCount < perUserLimit;
};

module.exports = mongoose.model("CouponUsage", couponUsageSchema);
