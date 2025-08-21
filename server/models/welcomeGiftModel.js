const mongoose = require("mongoose");

const welcomeGiftSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    maxlength: [50, "Title cannot exceed 50 characters"],
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9\s\-_.,!?()]+$/.test(v);
      },
      message: "Title contains invalid characters"
    }
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true,
    maxlength: [200, "Description cannot exceed 200 characters"],
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9\s\-_.,!?()%₹]+$/.test(v);
      },
      message: "Description contains invalid characters"
    }
  },
  icon: {
    type: String,
    required: [true, "Icon is required"],
    trim: true,
    enum: {
      values: ["Percent", "Truck", "Gift", "Star", "DollarSign", "Clock", "Heart", "Shield", "Zap", "Award"],
      message: "Invalid icon type"
    },
    default: "Gift"
  },
  color: {
    type: String,
    required: [true, "Color is required"],
    trim: true,
    validate: {
      validator: function(v) {
        return /^text-(green|blue|purple|yellow|red|indigo|pink|orange)-600$/.test(v);
      },
      message: "Invalid color format"
    },
    default: "text-blue-600"
  },
  bgColor: {
    type: String,
    required: [true, "Background color is required"],
    trim: true,
    validate: {
      validator: function(v) {
        return /^bg-(green|blue|purple|yellow|red|indigo|pink|orange)-50 hover:bg-(green|blue|purple|yellow|red|indigo|pink|orange)-100$/.test(v);
      },
      message: "Invalid background color format"
    },
    default: "bg-blue-50 hover:bg-blue-100"
  },
  reward: {
    type: String,
    required: [true, "Reward text is required"],
    trim: true,
    maxlength: [100, "Reward text cannot exceed 100 characters"],
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9\s\-_.,!?()%₹]+$/.test(v);
      },
      message: "Reward text contains invalid characters"
    }
  },
  couponCode: {
    type: String,
    required: [true, "Coupon code is required"],
    trim: true,
    unique: true,
    uppercase: true,
    maxlength: [20, "Coupon code cannot exceed 20 characters"],
    minlength: [3, "Coupon code must be at least 3 characters"],
    validate: {
      validator: function(v) {
        return /^[A-Z0-9]+$/.test(v);
      },
      message: "Coupon code must contain only uppercase letters and numbers"
    }
  },
  rewardType: {
    type: String,
    required: [true, "Reward type is required"],
    enum: {
      values: ["percentage", "fixed_amount", "buy_one_get_one"],
      message: "Invalid reward type"
    },
    default: "percentage"
  },
  rewardValue: {
    type: Number,
    required: [true, "Reward value is required"],
    min: [0, "Reward value cannot be negative"],
    max: [100000, "Reward value is too high"],
    validate: {
      validator: function(v) {
        return Number.isFinite(v) && v >= 0;
      },
      message: "Reward value must be a valid positive number"
    }
  },
  maxDiscount: {
    type: Number,
    default: null,
    min: [0, "Max discount cannot be negative"],
    max: [100000, "Max discount is too high"],
    validate: {
      validator: function(v) {
        if (v === null || v === undefined) return true;
        return Number.isFinite(v) && v >= 0;
      },
      message: "Max discount must be a valid positive number or null"
    }
  },
  minOrderAmount: {
    type: Number,
    default: 0,
    min: [0, "Min order amount cannot be negative"],
    max: [100000, "Min order amount is too high"],
    validate: {
      validator: function(v) {
        return Number.isFinite(v) && v >= 0;
      },
      message: "Min order amount must be a valid positive number"
    }
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    required: [true, "Order is required"],
    min: [1, "Order must be at least 1"],
    unique: true,
    validate: {
      validator: function(v) {
        return Number.isInteger(v) && v >= 1;
      },
      message: "Order must be an integer greater than or equal to 1"
    }
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
}, {
  timestamps: true,
});

// Create compound index for better performance
welcomeGiftSchema.index({ isActive: 1, order: 1 });


// Update usage count when gift is claimed (with session support)
welcomeGiftSchema.methods.incrementUsage = async function (session = null) {
  this.usageCount += 1;
  this.lastUsed = new Date();
  const options = session ? { session } : {};
  return this.save(options);
};

// Server-side discount calculation with security validations
welcomeGiftSchema.methods.calculateDiscount = function (subtotal, cartItems = []) {
  // 1. Validate inputs
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return { discount: 0, reason: "Invalid subtotal amount", isValid: false };
  }

  // 2. Check minimum order amount
  if (subtotal < this.minOrderAmount) {
    return {
      discount: 0,
      reason: `Minimum order of ₹${this.minOrderAmount} required`,
      isValid: false,
    };
  }

  // 3. Special validation for BOGO
  if (this.rewardType === 'buy_one_get_one') {
    const totalItems = (cartItems || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
    if (totalItems < 2) {
      return {
        discount: 0,
        reason: 'BOGO requires at least 2 items',
        isValid: false,
      };
    }
  }

  let discount = 0;
  let reason = '';

  // 4. Calculate discount based on type
  switch (this.rewardType) {
    case 'percentage':
      ({ discount, reason } = this.calculatePercentageDiscount(subtotal));
      break;

    case 'fixed_amount':
      ({ discount, reason } = this.calculateFixedDiscount(subtotal));
      break;

    case 'buy_one_get_one':
      discount = this.calculateBOGODiscount(cartItems);
      reason = 'Buy One Get One Free';
      break;

    default:
      discount = 0;
      reason = 'Unknown reward type';
  }

  // 5. Final validation and formatting
  discount = Math.max(0, Math.min(discount, subtotal)); // Ensure discount is valid
  discount = Math.round(discount * 100) / 100;

  return {
    discount,
    reason,
    isValid: discount > 0,
    finalAmount: subtotal - discount,
  };
};

// Enhanced BOGO calculation with security validations
welcomeGiftSchema.methods.calculateBOGODiscount = function (cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return 0;
  }

  let totalDiscount = 0;
  const processedItems = [];

  // Validate and process each cart item
  cartItems.forEach(item => {
    let productId, price, quantity;

    // Handle different cart item structures safely
    try {
      if (item.productId && typeof item.productId === 'object') {
        productId = item.productId._id || item.productId;
        price = item.actualPrice || item.variant?.price || item.productId?.price || item.price || 0;
      } else if (item.productId) {
        productId = item.productId;
        price = item.actualPrice || item.price || 0;
      } else {
        productId = item._id || 'unknown';
        price = item.actualPrice || item.price || 0;
      }

      quantity = parseInt(item.quantity) || 1;
      price = parseFloat(price) || 0;

      // Validate price and quantity
      if (price > 0 && quantity > 0 && quantity <= 99) {
        processedItems.push({ productId, price, quantity });
      }
    } catch (error) {
      console.error('Error processing BOGO item:', error);
    }
  });

  if (processedItems.length === 0) return 0;

  // Group items by product ID and calculate BOGO discount
  const itemGroups = {};
  processedItems.forEach(item => {
    if (!itemGroups[item.productId]) {
      itemGroups[item.productId] = { price: item.price, quantity: 0 };
    }
    itemGroups[item.productId].quantity += item.quantity;
  });

  // Calculate discount for each product group
  Object.values(itemGroups).forEach(group => {
    const pairs = Math.floor(group.quantity / 2);
    const discountPerPair = group.price;
    totalDiscount += pairs * discountPerPair;
  });

  return Math.round(totalDiscount * 100) / 100;
};

// Calculate fixed amount discount with validation
welcomeGiftSchema.methods.calculateFixedDiscount = function (subtotal) {
  let discount = Number.isFinite(this.rewardValue) ? this.rewardValue : 0;
  // Fixed discount cannot exceed subtotal
  discount = Math.max(0, Math.min(discount, subtotal));
  const reason = `₹${this.rewardValue} off`;
  return { discount, reason };
};

// Calculate percentage discount with optional cap (maxDiscount)
welcomeGiftSchema.methods.calculatePercentageDiscount = function (subtotal) {
  const percentageValue = Number.isFinite(this.rewardValue) ? this.rewardValue : 0;
  let discount = (subtotal * percentageValue) / 100;
  const hasCap = Number.isFinite(this.maxDiscount) && this.maxDiscount > 0;
  if (hasCap) {
    discount = Math.min(discount, this.maxDiscount);
  }
  discount = Math.max(0, Math.min(discount, subtotal));
  const reason = hasCap
    ? `${percentageValue}% off (max ₹${this.maxDiscount})`
    : `${percentageValue}% off`;
  return { discount: Math.round(discount * 100) / 100, reason };
};

// Enhanced validation for gift application
welcomeGiftSchema.methods.canBeApplied = function (subtotal, cartItems = []) {
  // Basic validations
  if (!this.isActive) {
    return {
      canApply: false,
      reason: 'This welcome gift is not active'
    };
  }

  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return {
      canApply: false,
      reason: 'Invalid order amount'
    };
  }

  if (subtotal < this.minOrderAmount) {
    return {
      canApply: false,
      reason: `Minimum order amount of ₹${this.minOrderAmount} required`
    };
  }

  // Special handling for BOGO rewards
  if (this.rewardType === 'buy_one_get_one') {
    const totalItems = cartItems.reduce((sum, item) => {
      const quantity = parseInt(item.quantity) || 1;
      return sum + Math.min(quantity, 99); // Cap quantity for security
    }, 0);

    if (totalItems < 2) {
      return {
        canApply: false,
        reason: 'BOGO offer requires at least 2 items in cart'
      };
    }
  }

  // Calculate discount
  const discountCalculation = this.calculateDiscount(subtotal, cartItems);
  
  return {
    canApply: discountCalculation.isValid,
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

// Prevent modification of critical fields after creation
welcomeGiftSchema.pre('findOneAndUpdate', function() {
  // Prevent modification of usage statistics through direct updates
  this.getUpdate().$unset = this.getUpdate().$unset || {};
  delete this.getUpdate().usageCount;
  delete this.getUpdate().lastUsed;
});

module.exports = mongoose.model("WelcomeGift", welcomeGiftSchema);
