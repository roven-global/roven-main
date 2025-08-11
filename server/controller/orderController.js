const OrderModel = require("../models/orderModel");
const CartModel = require("../models/cartProductModel");
const ProductModel = require("../models/productModel");
const CouponModel = require("../models/couponModel");
const CouponUsageModel = require("../models/couponUsageModel");
const UserReward = require("../models/userRewardModel");
const User = require("../models/userModel");
const WelcomeGift = require("../models/welcomeGiftModel");
const asyncHandler = require("express-async-handler");

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
        appliedWelcomeGift,
        // 1. Get the new 'applyWelcomeGift' flag from the frontend request
        applyWelcomeGift,
    } = req.body;

    if (!shippingAddress) {
        return res.status(400).json({
            success: false,
            message: "Shipping address is required",
        });
    }

    // Get user's cart items
    const cartItems = await CartModel.find({ userId: req.user._id }).populate({
        path: 'productId',
        model: 'Product'
    });

    if (cartItems.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Cart is empty",
        });
    }

    // Get user for reward checking
    const user = await User.findById(req.user._id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found",
        });
    }

    // Calculate totals
    const subtotal = cartItems.reduce((acc, item) => acc + (item.productId.price * item.quantity), 0);
    const shippingCost = subtotal > 499 ? 0 : 40;

    // Handle coupon discount
    let discount = 0;
    let appliedCoupon = null;

    if (couponCode) {
        const coupon = await CouponModel.findOne({
            code: couponCode.toUpperCase(),
            isActive: true
        });

        if (coupon && coupon.isValid) {
            // Check if user can use this coupon
            const canUserUse = await CouponUsageModel.canUserUseCoupon(
                coupon._id,
                req.user._id,
                coupon.perUserLimit
            );

            if (canUserUse) {
                // Check if coupon can be applied to this order
                const userOrderCount = await OrderModel.countDocuments({ user: req.user._id });
                const canBeApplied = coupon.canBeApplied(subtotal, req.user._id, userOrderCount);

                if (canBeApplied.valid) {
                    discount = coupon.calculateDiscount(subtotal);
                    appliedCoupon = coupon._id;
                }
            }
        }
    }

    // Handle welcome gift discount
    let welcomeGiftDiscount = 0;
    let appliedWelcomeGiftId = null;

    if (appliedWelcomeGift) {
        const userReward = await UserReward.findOne({
            userId: req.user._id,
            _id: appliedWelcomeGift.rewardId,
            isUsed: false
        });

        if (userReward) {
            welcomeGiftDiscount = appliedWelcomeGift.discountAmount;
            appliedWelcomeGiftId = userReward._id;
        }
    }

    // 3. ADD THIS BLOCK: Welcome Gift Logic
    if (applyWelcomeGift && user.rewardClaimed && !user.rewardUsed) {
        const userReward = await UserReward.findOne({
            userId: req.user._id,
            isUsed: false
        }).populate('reward');

        if (userReward && userReward.reward) {
            const gift = userReward.reward;
            if (gift.rewardType === 'discount' && gift.value) {
                welcomeGiftDiscount = (subtotal * gift.value) / 100;
            }
            if (gift.rewardType === 'free_shipping') {
                // Note: We're keeping the existing shipping logic for now
                // but this could be extended to handle free shipping rewards
            }
            // 'free_sample' logic can be handled on the frontend cart
        }
    }

    const total = subtotal + shippingCost - discount - welcomeGiftDiscount;

    // Prepare order items
    const orderItems = cartItems.map(item => ({
        product: item.productId._id,
        name: item.productId.name,
        price: item.productId.price,
        quantity: item.quantity,
        image: item.productId.images[0]?.url || "",
        volume: item.productId.volume,
    }));

    // Generate unique order number
    let orderNumber;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
        orderNumber = `ORD${year}${month}${day}${random}`;

        // Check if order number already exists
        const existingOrder = await OrderModel.findOne({ orderNumber });
        if (!existingOrder) {
            isUnique = true;
        }
        attempts++;
    }

    if (!isUnique) {
        return res.status(500).json({
            success: false,
            message: "Failed to generate unique order number. Please try again.",
        });
    }

    // Create order
    const orderData = {
        user: req.user._id,
        orderNumber,
        items: orderItems,
        shippingAddress,
        paymentInfo: {
            method: paymentMethod,
            status: "pending",
        },
        subtotal,
        shippingCost,
        discount,
        welcomeGiftDiscount,
        total,
        notes,
    };

    const newOrder = new OrderModel(orderData);

    try {
        await newOrder.save();
    } catch (error) {
        if (error.code === 11000) {
            // Duplicate key error - try again with a new order number
            return res.status(500).json({
                success: false,
                message: "Order number conflict. Please try again.",
            });
        }
        throw error;
    }

    // Track coupon usage if coupon was applied
    if (appliedCoupon) {
        const couponUsage = new CouponUsageModel({
            coupon: appliedCoupon,
            user: req.user._id,
            order: newOrder._id,
            discountAmount: discount,
            orderAmount: subtotal,
        });
        await couponUsage.save();

        // Update coupon usage count
        await CouponModel.findByIdAndUpdate(appliedCoupon, {
            $inc: { usedCount: 1 }
        });
    }

    // Mark welcome gift as used if applied
    if (appliedWelcomeGiftId) {
        await UserReward.findByIdAndUpdate(appliedWelcomeGiftId, {
            isUsed: true,
            usedAt: new Date()
        });
    }

    // Clear user's cart after successful order creation
    await CartModel.deleteMany({ userId: req.user._id });

    return res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: newOrder,
    });
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
        let totalShippingSavings = 0;

        orders.forEach(order => {
            // Add coupon discounts
            totalCouponSavings += order.discount || 0;

            // Add welcome gift discounts
            totalWelcomeGiftSavings += order.welcomeGiftDiscount || 0;

            // Calculate shipping savings (original shipping cost - actual charged shipping)
            // If subtotal > 499, shipping was free, so savings = 40
            // If subtotal <= 499, shipping was charged, so savings = 0
            const originalShippingCost = 40;
            const shippingSavings = order.subtotal > 499 ? originalShippingCost : 0;
            totalShippingSavings += shippingSavings;
        });

        totalSavings = totalCouponSavings + totalWelcomeGiftSavings + totalShippingSavings;

        return res.json({
            success: true,
            message: "Lifetime savings calculated successfully",
            data: {
                totalSavings,
                breakdown: {
                    couponSavings: totalCouponSavings,
                    welcomeGiftSavings: totalWelcomeGiftSavings,
                    shippingSavings: totalShippingSavings
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

module.exports = {
    createOrder,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    getAllOrders,
    getLifetimeSavings,
};
