const OrderModel = require("../models/orderModel");
const CartModel = require("../models/cartProductModel");
const CouponModel = require("../models/couponModel");
const CouponUsageModel = require("../models/couponUsageModel");
const UserReward = require("../models/userRewardModel");
const User = require("../models/userModel");
const ProductModel = require("../models/productModel");
const asyncHandler = require("express-async-handler");
const {
  executeWithOptionalTransaction,
} = require("../utils/transactionHandler");

// Server-side calculation engine
const calculateOrderTotals = async (cartItems, user, couponCode, applyWelcomeGift) => {
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
        throw new Error("Cart is empty or invalid");
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of cartItems) {
        const product = await ProductModel.findById(item.productId?._id || item.productId);
        if (!product) continue;

        let unitPrice = product.price;
        if (item.variant?.sku && Array.isArray(product.variants)) {
            const variant = product.variants.find(v => v.sku === item.variant.sku);
            if (variant) unitPrice = variant.price;
        }

        const quantity = Math.max(1, Math.min(99, parseInt(item.quantity) || 1));
        subtotal += unitPrice * quantity;
        orderItems.push({
            product: product._id,
            name: product.name,
            price: unitPrice,
            quantity,
            image: product.images[0]?.url || "",
            volume: item.variant?.volume || product.volume,
            variant: item.variant ? { sku: item.variant.sku, volume: item.variant.volume } : undefined,
        });
    }

    if (orderItems.length === 0) throw new Error("No valid items in cart");

    let couponDiscount = 0;
    let appliedCoupon = null;
    if (couponCode && user) {
        const coupon = await CouponModel.findOne({ code: String(couponCode).toUpperCase(), isActive: true });
        if (coupon?.isValid) {
            const canUse = await CouponUsageModel.canUserUseCoupon(coupon._id, user._id, coupon.perUserLimit);
            const userOrderCount = await OrderModel.countDocuments({ user: user._id });
            const canApply = coupon.canBeApplied(subtotal, user._id, userOrderCount);
            if (canUse && canApply.valid) {
                couponDiscount = coupon.calculateDiscount(subtotal);
                appliedCoupon = coupon;
            }
        }
    }
    
    let welcomeGiftDiscount = 0;
    let appliedWelcomeGiftId = null;
    if (applyWelcomeGift && user?.rewardClaimed && !user?.rewardUsed) {
        const userReward = await UserReward.findOne({ userId: user._id, isUsed: false }).populate('giftId');
        if (userReward?.giftId) {
            const gift = userReward.giftId;
            const validation = gift.canBeApplied(subtotal, orderItems);
            if (validation.canApply) {
                welcomeGiftDiscount = validation.discount || 0;
                appliedWelcomeGiftId = userReward._id;
            }
        }
    }
    
    const shippingCost = 0; // All shipping is free
    const totalDiscount = couponDiscount + welcomeGiftDiscount;
    const finalTotal = Math.max(0, subtotal - totalDiscount);

    return {
        items: orderItems,
        subtotal,
        shippingCost,
        discounts: {
            coupon: couponDiscount,
            welcomeGift: welcomeGiftDiscount,
            total: totalDiscount,
        },
        finalTotal,
        appliedCoupon: appliedCoupon ? { _id: appliedCoupon._id, code: appliedCoupon.code, name: appliedCoupon.name } : null,
        appliedWelcomeGiftId,
    };
};

/**
 * Create new order
 * @route POST /api/order/create
 */
const createOrder = asyncHandler(async (req, res) => {
  const {
    shippingAddress,
    paymentMethod = "online",
    notes,
    couponCode,
    applyWelcomeGift,
  } = req.body;

  if (!shippingAddress) {
    return res.status(400).json({
      success: false,
      message: "Shipping address is required",
    });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const cartItems = await CartModel.find({ userId: req.user._id }).populate(
    "productId"
  );
  if (cartItems.length === 0) {
    return res.status(400).json({ success: false, message: "Cart is empty" });
  }

  // All database operations are now wrapped in a transaction
  const newOrder = await executeWithOptionalTransaction(async (session) => {
    const totals = await calculateOrderTotals(
      cartItems,
      user,
      couponCode,
      applyWelcomeGift
    );

    let orderNumber;
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
      orderNumber = `ORD${year}${month}${day}${random}`;
      const existingOrder = await OrderModel.findOne({ orderNumber }).session(
        session
      );
      if (!existingOrder) isUnique = true;
      attempts++;
    }

    if (!isUnique) {
      throw new Error(
        "Failed to generate unique order number. Please try again."
      );
    }

    const orderData = {
      user: req.user._id,
      orderNumber,
      items: totals.items,
      shippingAddress,
      paymentInfo: { method: paymentMethod, status: "pending" },
      subtotal: totals.subtotal,
      shippingCost: totals.shippingCost,
      discount: totals.discounts.coupon,
      welcomeGiftDiscount: totals.discounts.welcomeGift,
      total: totals.finalTotal,
      notes,
    };

    const order = new OrderModel(orderData);
    await order.save({ session });

    if (totals.appliedCoupon) {
      const couponUsage = new CouponUsageModel({
        coupon: totals.appliedCoupon._id,
        user: req.user._id,
        order: order._id,
        discountAmount: totals.discounts.coupon,
        orderAmount: totals.subtotal,
      });
      await couponUsage.save({ session });
      await CouponModel.findByIdAndUpdate(
        totals.appliedCoupon._id,
        { $inc: { usedCount: 1 } },
        { session }
      );
    }

    if (totals.appliedWelcomeGiftId) {
      await UserReward.findByIdAndUpdate(
        totals.appliedWelcomeGiftId,
        { isUsed: true, usedAt: new Date() },
        { session }
      );
    }

    await CartModel.deleteMany({ userId: req.user._id }).session(session);

    return order; // Return the created order from the transaction
  });

  if (newOrder) {
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: newOrder,
    });
  } else {
    // This else block will likely not be hit if errors are thrown correctly, but serves as a fallback.
    res.status(500).json({
      success: false,
      message: "Order creation failed. Please try again.",
    });
  }
});

/**
 * Get user orders
 * @route GET /api/order/user
 */
const getUserOrders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;

    const filter = { user: req.user._id, isActive: true };
    if (status) filter.orderStatus = status;

    const skip = (page - 1) * limit;

    const orders = await OrderModel.find(filter)
        .populate("items.product", "name images")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const totalOrders = await OrderModel.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / limit);

    return res.json({
        success: true,
        message: "Orders retrieved successfully",
        data: {
            orders,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalOrders,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        },
    });
});

/**
 * Get order by ID
 * @route GET /api/order/:id
 */
const getOrderById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const order = await OrderModel.findOne({
        _id: id,
        user: req.user._id,
    }).populate("items.product", "name images volume");

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found",
        });
    }

    return res.json({
        success: true,
        message: "Order retrieved successfully",
        data: order,
    });
});

/**
 * Update order status (Admin only)
 * @route PUT /api/order/:id/status
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { orderStatus } = req.body;

    if (!orderStatus) {
        return res.status(400).json({
            success: false,
            message: "Order status is required",
        });
    }

    const order = await OrderModel.findById(id);

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found",
        });
    }

    order.orderStatus = orderStatus;
    await order.save();

    return res.json({
        success: true,
        message: "Order status updated successfully",
        data: order,
    });
});

/**
 * Cancel order
 * @route PUT /api/order/:id/cancel
 */
const cancelOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const order = await OrderModel.findOne({
        _id: id,
        user: req.user._id,
    });

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found",
        });
    }

    if (order.orderStatus !== "pending") {
        return res.status(400).json({
            success: false,
            message: "Order cannot be cancelled at this stage",
        });
    }

    order.orderStatus = "cancelled";
    await order.save();

    return res.json({
        success: true,
        message: "Order cancelled successfully",
        data: order,
    });
});

/**
 * Get all orders (Admin only)
 * @route GET /api/order/all
 */
const getAllOrders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, search } = req.query;

    const filter = { isActive: true };
    if (status) filter.orderStatus = status;
    if (search) {
        filter.$or = [
            { orderNumber: { $regex: search, $options: "i" } },
            { "shippingAddress.firstName": { $regex: search, $options: "i" } },
            { "shippingAddress.lastName": { $regex: search, $options: "i" } },
            { "shippingAddress.email": { $regex: search, $options: "i" } },
        ];
    }

    const skip = (page - 1) * limit;

    const orders = await OrderModel.find(filter)
        .populate("user", "name email")
        .populate("items.product", "name images")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const totalOrders = await OrderModel.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / limit);

    return res.json({
        success: true,
        message: "Orders retrieved successfully",
        data: {
            orders,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalOrders,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        },
    });
});

/**
 * Get lifetime savings for a user
 * @route GET /api/order/lifetime-savings
 */
const getLifetimeSavings = asyncHandler(async (req, res) => {
    try {
        // Get all completed orders for the user
        const orders = await OrderModel.find({
            user: req.user._id,
            orderStatus: { $in: ["delivered", "shipped", "processing"] }, // Only count orders that are not cancelled/pending
            isActive: true
        });

        let totalSavings = 0;
        let totalCouponSavings = 0;
        let totalWelcomeGiftSavings = 0;

        orders.forEach(order => {
            // Add coupon discounts
            totalCouponSavings += order.discount || 0;

            // Add welcome gift discounts
            totalWelcomeGiftSavings += order.welcomeGiftDiscount || 0;

        });

        totalSavings = totalCouponSavings + totalWelcomeGiftSavings;

        return res.json({
            success: true,
            message: "Lifetime savings calculated successfully",
            data: {
                totalSavings,
                breakdown: {
                    couponSavings: totalCouponSavings,
                    welcomeGiftSavings: totalWelcomeGiftSavings
                },
                totalOrders: orders.length
            }
        });
    } catch (error) {
        console.error("Error calculating lifetime savings:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to calculate lifetime savings"
        });
    }
});

/**
 * Quote current cart totals with server-side validation
 * @route POST /api/order/quote
 */
const getOrderQuote = asyncHandler(async (req, res) => {
    const { cartItems = [], couponCode, applyWelcomeGift } = req.body || {};
    try {
        const quote = await calculateOrderTotals(cartItems, req.user, couponCode, applyWelcomeGift);
        return res.json({ success: true, data: quote });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
});

module.exports = {
    createOrder,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    getAllOrders,
    getLifetimeSavings,
    getOrderQuote,
};
