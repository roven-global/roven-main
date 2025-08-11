const mongoose = require("mongoose");

const welcomeGiftSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [50, "Title cannot exceed 50 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
    icon: {
      type: String,
      required: [true, "Icon is required"],
      trim: true,
      enum: [
        "Percent",
        "Truck",
        "Gift",
        "Star",
        "DollarSign",
        "Clock",
        "Heart",
        "Shield",
        "Zap",
        "Award"
      ],
      default: "Gift"
    },
    color: {
      type: String,
      required: [true, "Color is required"],
      trim: true,
      default: "text-blue-600"
    },
    bgColor: {
      type: String,
      required: [true, "Background color is required"],
      trim: true,
      default: "bg-blue-50 hover:bg-blue-100"
    },
    reward: {
      type: String,
      required: [true, "Reward text is required"],
      trim: true,
      maxlength: [100, "Reward text cannot exceed 100 characters"],
    },
    // Add coupon code field for welcome gifts
    couponCode: {
      type: String,
      required: [true, "Coupon code is required"],
      trim: true,
      unique: true,
      uppercase: true,
      maxlength: [20, "Coupon code cannot exceed 20 characters"],
    },
    // Enhanced reward structure
    rewardType: {
      type: String,
      required: [true, "Reward type is required"],
      enum: ["percentage", "fixed_amount", "free_shipping", "buy_one_get_one"],
      default: "percentage"
    },
    rewardValue: {
      type: Number,
      required: [true, "Reward value is required"],
      min: [0, "Reward value cannot be negative"],
    },
    // For percentage: 10 means 10%
    // For fixed_amount: 100 means ₹100
    // For free_shipping: value should be 0 (boolean-like)
    // For BOGO: value should be 1 (means buy 1 get 1 free)
    maxDiscount: {
      type: Number,
      default: null, // Maximum discount for percentage type
    },
    minOrderAmount: {
      type: Number,
      default: 0, // Minimum order amount to apply this reward
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      required: [true, "Order is required"],
      min: [1, "Order must be at least 1"],
      max: [6, "Order cannot exceed 6"],
      unique: true,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: [0, "Usage count cannot be negative"],
    },
    lastUsed: {
      type: Date,
      default: null,
    }
  },
  {
    timestamps: true,
  }
);

// Ensure only 6 gifts can exist
welcomeGiftSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    if (count >= 6) {
      throw new Error('Maximum 6 welcome gifts allowed');
    }
  }
  next();
});

// Update usage count when gift is claimed
welcomeGiftSchema.methods.incrementUsage = async function () {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

// Enhanced discount calculation method similar to coupon model
welcomeGiftSchema.methods.calculateDiscount = function (subtotal, cartItems = []) {
  if (subtotal < this.minOrderAmount) {
    return {
      discount: 0,
      reason: `Minimum order amount of ₹${this.minOrderAmount} required`,
      isValid: false
    };
  }

  let discount = 0;
  let reason = '';

  switch (this.rewardType) {
    case 'percentage':
      discount = (subtotal * this.rewardValue) / 100;
      if (this.maxDiscount && discount > this.maxDiscount) {
        discount = this.maxDiscount;
        reason = `${this.rewardValue}% off (max ₹${this.maxDiscount})`;
      } else {
        reason = `${this.rewardValue}% off`;
      }
      break;

    case 'fixed_amount':
      discount = Math.min(this.rewardValue, subtotal);
      reason = `₹${this.rewardValue} off`;
      break;

    case 'free_shipping':
      // For free shipping, we need to know the shipping cost
      // This will be handled by the controller
      discount = 0;
      reason = 'Free shipping';
      break;

    case 'buy_one_get_one':
      discount = this.calculateBOGODiscount(cartItems);
      reason = 'Buy One Get One Free';
      break;

    default:
      discount = 0;
      reason = 'Unknown reward type';
  }

  return {
    discount: Math.round(discount * 100) / 100, // Round to 2 decimal places
    reason,
    isValid: discount > 0,
    finalAmount: subtotal - discount
  };
};

// Calculate BOGO discount
welcomeGiftSchema.methods.calculateBOGODiscount = function (cartItems) {
  if (!cartItems || cartItems.length === 0) {
    return 0;
  }

  let totalDiscount = 0;

  // Group items by product ID to handle quantities
  const itemGroups = {};
  cartItems.forEach(item => {
    const productId = item.productId._id || item.productId;
    const price = item.variant?.price || item.productId?.price || item.price;
    const quantity = item.quantity || 1;

    if (!itemGroups[productId]) {
      itemGroups[productId] = {
        price: price,
        quantity: 0
      };
    }
    itemGroups[productId].quantity += quantity;
  });

  // Calculate BOGO discount for each product group
  Object.values(itemGroups).forEach(group => {
    const pairs = Math.floor(group.quantity / 2);
    const discountPerPair = group.price;
    totalDiscount += pairs * discountPerPair;
  });

  return totalDiscount;
};

// Validate if the welcome gift can be applied
welcomeGiftSchema.methods.canBeApplied = function (subtotal, cartItems = []) {
  if (!this.isActive) {
    return {
      canApply: false,
      reason: 'This welcome gift is not active'
    };
  }

  if (subtotal < this.minOrderAmount) {
    return {
      canApply: false,
      reason: `Minimum order amount of ₹${this.minOrderAmount} required`
    };
  }

  const discountCalculation = this.calculateDiscount(subtotal, cartItems);

  if (!discountCalculation.isValid) {
    return {
      canApply: false,
      reason: discountCalculation.reason
    };
  }

  return {
    canApply: true,
    reason: discountCalculation.reason,
    discount: discountCalculation.discount,
    finalAmount: discountCalculation.finalAmount
  };
};

// Get formatted display text for the reward
welcomeGiftSchema.methods.getDisplayText = function () {
  switch (this.rewardType) {
    case 'percentage':
      return `${this.rewardValue}% Off`;
    case 'fixed_amount':
      return `₹${this.rewardValue} Off`;
    case 'free_shipping':
      return 'Free Shipping';
    case 'buy_one_get_one':
      return 'Buy One Get One Free';
    default:
      return this.reward;
  }
};

// Get coupon code display
welcomeGiftSchema.methods.getCouponDisplay = function () {
  return this.couponCode || 'N/A';
};

module.exports = mongoose.model("WelcomeGift", welcomeGiftSchema);