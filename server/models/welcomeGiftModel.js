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
welcomeGiftSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    if (count >= 6) {
      return next(new Error('Maximum 6 welcome gifts allowed'));
    }
  }
  next();
});

// Update usage count when gift is claimed
welcomeGiftSchema.methods.incrementUsage = async function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return await this.save();
};

module.exports = mongoose.model("WelcomeGift", welcomeGiftSchema);
