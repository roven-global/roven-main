const CouponModel = require("../models/couponModel");
const CouponUsageModel = require("../models/couponUsageModel");
const OrderModel = require("../models/orderModel");
const ProductModel = require("../models/productModel");
const asyncHandler = require("express-async-handler");

// Server-side cart validation (duplicated from welcome gift controller for now)
const validateCartItems = async (cartItems) => {
    if (!Array.isArray(cartItems)) return { isValid: false, message: "Invalid cart items format" };

    const validatedItems = [];
    let totalCartValue = 0;

    for (const item of cartItems) {
        try {
            const productId = (item && item.productId && typeof item.productId === 'object')
                ? (item.productId._id || item.productId.id)
                : item?.productId;
            if (!productId) continue;

            const product = await ProductModel.findById(productId);
            if (!product) continue;

            let actualPrice = product.price;
            if (item.variant?.sku && Array.isArray(product.variants) && product.variants.length > 0) {
                const variant = product.variants.find(v => v.sku === item.variant.sku);
                if (variant) actualPrice = variant.price;
            }

            const quantity = Math.max(1, Math.min(99, parseInt(item.quantity) || 1));
            const itemTotal = actualPrice * quantity;
            totalCartValue += itemTotal;

            validatedItems.push({
                ...item,
                actualPrice,
                quantity,
                itemTotal
            });
        } catch (error) {
            // skip invalid item
        }
    }

    return {
        isValid: validatedItems.length > 0,
        validatedItems,
        totalCartValue: Math.round(totalCartValue * 100) / 100,
    };
};

/**
 * Validate coupon code
 * @route POST /api/coupon/validate
 */
const validateCoupon = asyncHandler(async (req, res) => {
    const { code, orderAmount, cartItems } = req.body;

    if (!code) {
        return res.status(400).json({
            success: false,
            message: "Coupon code is required",
        });
    }

    if (!Array.isArray(cartItems)) {
        return res.status(400).json({
            success: false,
            message: "Valid cart items are required",
        });
    }

    // Validate and recompute cart on server
    const cartValidation = await validateCartItems(cartItems);
    if (!cartValidation.isValid) {
        return res.status(400).json({
            success: false,
            message: cartValidation.message || "Invalid cart",
        });
    }

    const actualCartTotal = cartValidation.totalCartValue;

    // Optional: verify submitted order amount matches server calc (tolerance 1)
    if (orderAmount && Math.abs(actualCartTotal - orderAmount) > 1) {
        return res.status(400).json({
            success: false,
            message: "Cart total mismatch. Please refresh and try again.",
        });
    }

    // Find the coupon
    const coupon = await CouponModel.findOne({
        code: String(code).toUpperCase(),
        isActive: true,
    });

    if (!coupon) {
        return res.status(404).json({
            success: false,
            message: "Invalid coupon code",
        });
    }

    // Check if coupon is valid
    if (!coupon.isValid) {
        return res.status(400).json({
            success: false,
            message: "Coupon is not valid or has expired",
        });
    }

    // Get user's order count for first-time user check
    let userOrderCount = 0;
    if (req.user) {
        userOrderCount = await OrderModel.countDocuments({ user: req.user._id });
    }

    // Check if coupon can be applied using server total
    const canBeApplied = coupon.canBeApplied(actualCartTotal, req.user?._id, userOrderCount);
    if (!canBeApplied.valid) {
        return res.status(400).json({
            success: false,
            message: canBeApplied.message,
        });
    }

    // Check if user has already used this coupon
    if (req.user) {
        const canUserUse = await CouponUsageModel.canUserUseCoupon(
            coupon._id,
            req.user._id,
            coupon.perUserLimit
        );
        if (!canUserUse) {
            return res.status(400).json({
                success: false,
                message: `You have already used this coupon ${coupon.perUserLimit} time(s)`,
            });
        }
    }

    // Calculate discount based on server total
    const discountAmount = coupon.calculateDiscount(actualCartTotal);

    return res.json({
        success: true,
        message: "Coupon is valid",
        data: {
            coupon: {
                _id: coupon._id,
                code: coupon.code,
                name: coupon.name,
                description: coupon.description,
                type: coupon.type,
                value: coupon.value,
                maxDiscount: coupon.maxDiscount,
            },
            discountAmount,
            finalAmount: Math.max(0, actualCartTotal - discountAmount),
        },
    });
});

/**
 * Get active coupons (public)
 * @route GET /api/coupon/active
 */
const getActiveCoupons = asyncHandler(async (req, res) => {
    const currentDate = new Date();

    const coupons = await CouponModel.find({
        isActive: true,
        validFrom: { $lte: currentDate },
        validTo: { $gte: currentDate },
        $expr: { $lt: ["$usedCount", "$usageLimit"] }
    }).select('code name description type value maxDiscount minOrderAmount validTo firstTimeUserOnly');

    return res.json({
        success: true,
        data: coupons,
    });
});

/**
 * Get all coupons (admin only)
 * @route GET /api/coupon/all
 */
const getAllCoupons = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search = "", status = "" } = req.query;

    const query = {};

    if (search) {
        query.$or = [
            { code: { $regex: search, $options: "i" } },
            { name: { $regex: search, $options: "i" } },
        ];
    }

    if (status === "active") {
        query.isActive = true;
    } else if (status === "inactive") {
        query.isActive = false;
    }

    const skip = (page - 1) * limit;

    const coupons = await CouponModel.find(query)
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await CouponModel.countDocuments(query);

    return res.json({
        success: true,
        data: {
            coupons,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit),
            },
        },
    });
});

/**
 * Get coupon by ID (admin only)
 * @route GET /api/coupon/:id
 */
const getCouponById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const coupon = await CouponModel.findById(id)
        .populate("createdBy", "name email")
        .populate("applicableCategories", "name")
        .populate("applicableProducts", "name")
        .populate("excludedCategories", "name")
        .populate("excludedProducts", "name");

    if (!coupon) {
        return res.status(404).json({
            success: false,
            message: "Coupon not found",
        });
    }

    return res.json({
        success: true,
        data: coupon,
    });
});

/**
 * Create new coupon (admin only)
 * @route POST /api/coupon/create
 */
const createCoupon = asyncHandler(async (req, res) => {
    const {
        code,
        name,
        description,
        type,
        value,
        maxDiscount,
        minOrderAmount,
        maxOrderAmount,
        usageLimit,
        perUserLimit = 1,
        validFrom,
        validTo,
        applicableCategories = [],
        applicableProducts = [],
        excludedCategories = [],
        excludedProducts = [],
        firstTimeUserOnly = false,
    } = req.body;

    // Check if coupon code already exists
    const existingCoupon = await CouponModel.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
        return res.status(400).json({
            success: false,
            message: "Coupon code already exists",
        });
    }

    // Validate percentage coupon
    if (type === "percentage" && (value <= 0 || value > 100)) {
        return res.status(400).json({
            success: false,
            message: "Percentage value must be between 1 and 100",
        });
    }

    // Validate fixed coupon
    if (type === "fixed" && value <= 0) {
        return res.status(400).json({
            success: false,
            message: "Fixed value must be greater than 0",
        });
    }

    const couponData = {
        code: code.toUpperCase(),
        name,
        description,
        type,
        value,
        maxDiscount,
        minOrderAmount,
        maxOrderAmount,
        usageLimit,
        perUserLimit,
        validFrom: new Date(validFrom),
        validTo: new Date(validTo),
        applicableCategories,
        applicableProducts,
        excludedCategories,
        excludedProducts,
        firstTimeUserOnly,
        createdBy: req.user._id,
    };

    const newCoupon = new CouponModel(couponData);
    await newCoupon.save();

    return res.status(201).json({
        success: true,
        message: "Coupon created successfully",
        data: newCoupon,
    });
});

/**
 * Update coupon (admin only)
 * @route PUT /api/coupon/:id
 */
const updateCoupon = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const coupon = await CouponModel.findById(id);
    if (!coupon) {
        return res.status(404).json({
            success: false,
            message: "Coupon not found",
        });
    }

    // If code is being updated, check for uniqueness
    if (updateData.code && updateData.code !== coupon.code) {
        const existingCoupon = await CouponModel.findOne({
            code: updateData.code.toUpperCase(),
            _id: { $ne: id }
        });
        if (existingCoupon) {
            return res.status(400).json({
                success: false,
                message: "Coupon code already exists",
            });
        }
        updateData.code = updateData.code.toUpperCase();
    }

    // Validate percentage coupon
    if (updateData.type === "percentage" && (updateData.value <= 0 || updateData.value > 100)) {
        return res.status(400).json({
            success: false,
            message: "Percentage value must be between 1 and 100",
        });
    }

    // Validate fixed coupon
    if (updateData.type === "fixed" && updateData.value <= 0) {
        return res.status(400).json({
            success: false,
            message: "Fixed value must be greater than 0",
        });
    }

    // Convert date strings to Date objects
    if (updateData.validFrom) {
        updateData.validFrom = new Date(updateData.validFrom);
    }
    if (updateData.validTo) {
        updateData.validTo = new Date(updateData.validTo);
    }

    const updatedCoupon = await CouponModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    );

    return res.json({
        success: true,
        message: "Coupon updated successfully",
        data: updatedCoupon,
    });
});

/**
 * Delete coupon (admin only)
 * @route DELETE /api/coupon/:id
 */
const deleteCoupon = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const coupon = await CouponModel.findById(id);
    if (!coupon) {
        return res.status(404).json({
            success: false,
            message: "Coupon not found",
        });
    }

    // Check if coupon has been used
    const usageCount = await CouponUsageModel.countDocuments({ coupon: id });
    if (usageCount > 0) {
        return res.status(400).json({
            success: false,
            message: "Cannot delete coupon that has been used. Deactivate it instead.",
        });
    }

    await CouponModel.findByIdAndDelete(id);

    return res.json({
        success: true,
        message: "Coupon deleted successfully",
    });
});

/**
 * Toggle coupon status (admin only)
 * @route PATCH /api/coupon/:id/toggle
 */
const toggleCouponStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const coupon = await CouponModel.findById(id);
    if (!coupon) {
        return res.status(404).json({
            success: false,
            message: "Coupon not found",
        });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    return res.json({
        success: true,
        message: `Coupon ${coupon.isActive ? "activated" : "deactivated"} successfully`,
        data: coupon,
    });
});

/**
 * Remove applied coupon from cart/order
 * @route POST /api/coupon/remove
 */
const removeCoupon = asyncHandler(async (req, res) => {
    const { couponCode } = req.body;

    if (!couponCode) {
        return res.status(400).json({
            success: false,
            message: "Coupon code is required",
        });
    }

    // Find the coupon
    const coupon = await CouponModel.findOne({
        code: couponCode.toUpperCase(),
        isActive: true
    });

    if (!coupon) {
        return res.status(404).json({
            success: false,
            message: "Coupon not found",
        });
    }

    // For now, we'll just return success since the frontend will handle the state
    // In a real implementation, you might want to track applied coupons in the database
    return res.json({
        success: true,
        message: "Coupon removed successfully",
        data: {
            coupon: {
                _id: coupon._id,
                code: coupon.code,
                name: coupon.name,
            },
        },
    });
});

/**
 * Get coupon usage statistics (admin only)
 * @route GET /api/coupon/:id/usage
 */
const getCouponUsage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const coupon = await CouponModel.findById(id);
    if (!coupon) {
        return res.status(404).json({
            success: false,
            message: "Coupon not found",
        });
    }

    const skip = (page - 1) * limit;

    const usage = await CouponUsageModel.find({ coupon: id })
        .populate("user", "name email")
        .populate("order", "orderNumber total")
        .sort({ usedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const totalUsage = await CouponUsageModel.countDocuments({ coupon: id });

    // Calculate total discount given
    const totalDiscount = await CouponUsageModel.aggregate([
        { $match: { coupon: coupon._id } },
        { $group: { _id: null, total: { $sum: "$discountAmount" } } }
    ]);

    return res.json({
        success: true,
        data: {
            coupon,
            usage,
            statistics: {
                totalUsage,
                totalDiscount: totalDiscount[0]?.total || 0,
                remainingUsage: coupon.remainingUsage,
            },
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalUsage / limit),
                totalItems: totalUsage,
                itemsPerPage: parseInt(limit),
            },
        },
    });
});

module.exports = {
    validateCoupon,
    getActiveCoupons,
    getAllCoupons,
    getCouponById,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    toggleCouponStatus,
    getCouponUsage,
    removeCoupon,
};
