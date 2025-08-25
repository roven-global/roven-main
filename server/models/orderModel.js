const mongoose = require("mongoose");
const addressSubSchema = require("./shared/addressSchema");

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, "Quantity must be at least 1"],
  },
  image: {
    type: String,
    required: true,
  },
  volume: {
    type: String,
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    items: [orderItemSchema],
    shippingAddress: {
      type: new mongoose.Schema(addressSubSchema, { _id: false }),
      required: true,
    },
    paymentInfo: {
      id: {
        type: String,
      },
      status: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending",
      },
      method: {
        type: String,
        enum: ["online", "cod"],
        default: "online",
      },
    },
    orderStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    subtotal: {
      type: Number,
      required: true,
    },
    shippingCost: {
      type: Number,
      required: true,
      default: 0,
    },
    discount: {
      type: Number,
      required: true,
      default: 0,
    },
    welcomeGiftDiscount: {
      type: Number,
      required: true,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate order number before saving (fallback)
orderSchema.pre("save", function (next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    this.orderNumber = `ORD${year}${month}${day}${random}`;
  }
  next();
});

// Virtual for order status timeline
orderSchema.virtual("statusTimeline").get(function () {
  const timeline = [
    {
      status: "pending",
      label: "Order Placed",
      description: "Your order has been placed successfully",
    },
    {
      status: "processing",
      label: "Processing",
      description: "Your order is being processed",
    },
    {
      status: "shipped",
      label: "Shipped",
      description: "Your order has been shipped",
    },
    {
      status: "delivered",
      label: "Delivered",
      description: "Your order has been delivered",
    },
  ];

  const currentIndex = timeline.findIndex(item => item.status === this.orderStatus);
  return timeline.slice(0, currentIndex + 1);
});

// Ensure virtuals are included in JSON output
orderSchema.set("toJSON", { virtuals: true });
orderSchema.set("toObject", { virtuals: true });

// Index for better query performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ "paymentInfo.status": 1 });

module.exports = mongoose.model("Order", orderSchema);