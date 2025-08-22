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
  buyQuantity: {
    type: Number,
    default: 1,
    min: [1, "Buy quantity must be at least 1"],
  },
  getQuantity: {
    type: Number,
    default: 1,
    min: [1, "Get quantity must be at least 1"],
  },
  applicableCategories: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Category',
    default: [],
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

// Create index for better performance on queries for active gifts
welcomeGiftSchema.index({ isActive: 1 });


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

// Dynamic BOGO calculation for "Buy X, Get Y Free" (Multiplier Logic)
welcomeGiftSchema.methods.calculateBOGODiscount = function (cartItems) {
  const buyQuantity = this.buyQuantity || 1;
  const getQuantity = this.getQuantity || 1;
  const applicableCategories = this.applicableCategories || [];

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return 0;
  }

  // Filter cart items if applicableCategories is specified
  const eligibleItems = applicableCategories.length > 0
    ? cartItems.filter(item => 
        item.productId && item.productId.category && applicableCategories.some(catId => catId.equals(item.productId.category))
      )
    : cartItems;

  const allItems = [];
  // Create a flat list of all eligible items with their prices
  eligibleItems.forEach(item => {
    const quantity = parseInt(item.quantity) || 1;
    let price = 0;

    if (item.productId && typeof item.productId === 'object') {
      price = item.actualPrice || item.variant?.price || item.productId?.price || item.price || 0;
    } else {
      price = item.actualPrice || item.price || 0;
    }
    price = parseFloat(price) || 0;

    if (price > 0) {
      for (let i = 0; i < quantity; i++) {
        allItems.push({ price });
      }
    }
  });

  // BOGO offer requires at least 'buyQuantity' items
  if (allItems.length < buyQuantity) {
    return 0;
  }

  // Sort items by price, cheapest first
  allItems.sort((a, b) => a.price - b.price);

  // Calculate how many times the offer can be applied
  const numberOfTimesOfferApplies = Math.floor(allItems.length / buyQuantity);
  if (numberOfTimesOfferApplies === 0) {
    return 0;
  }

  // Determine the total number of items to get for free
  const totalFreeItems = numberOfTimesOfferApplies * getQuantity;

  // Take the cheapest 'totalFreeItems' from the sorted list
  const itemsToDiscount = allItems.slice(0, totalFreeItems);

  // Sum the prices of the cheapest items to get the total discount
  const totalDiscount = itemsToDiscount.reduce((sum, item) => sum + item.price, 0);

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

    const buyQuantity = this.buyQuantity || 1;
    if (totalItems < buyQuantity) {
      return {
        canApply: false,
        reason: `BOGO offer requires at least ${buyQuantity} items in cart`
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
