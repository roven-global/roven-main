const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const WelcomeGift = require("../models/welcomeGiftModel");
const UserReward = require("../models/userRewardModel");
const ProductModel = require("../models/productModel");

// Security helpers
const sanitizeString = (str) => typeof str === 'string' ? str.trim().replace(/[<>\"']/g, '') : '';
const logSecurityEvent = (event, details) => {
  console.log(`[SECURITY][${new Date().toISOString()}][${event}]`, details);
};

// Rate limiting for gift claims
const giftClaimLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 gift claims per windowMs
  message: { success: false, message: "Too many gift claims. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Anonymous ID validation with cryptographic signature
const generateSecureAnonymousId = () => {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  const data = `${timestamp}-${randomBytes}`;
  const signature = crypto.createHmac('sha256', process.env.ANONYMOUS_SECRET || 'fallback-secret')
    .update(data).digest('hex').substring(0, 16);
  return `${data}-${signature}`;
};

const validateAnonymousId = (anonymousId) => {
  if (!anonymousId || typeof anonymousId !== 'string') return false;
  const parts = anonymousId.split('-');
  // Accept both 3-part (timestamp-random-signature) and 4-part variants; use last part as signature
  if (parts.length < 3) return false;

  const timestamp = parts[0];
  const randomPart = parts[1];
  const signature = parts[parts.length - 1];
  const data = `${timestamp}-${randomPart}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.ANONYMOUS_SECRET || 'fallback-secret')
    .update(data)
    .digest('hex')
    .substring(0, 16);

  // Check signature match (timing-safe) and timestamp age (< 24h)
  let isValidSignature = false;
  try {
    isValidSignature = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (e) {
    return false;
  }
  const ts = parseInt(timestamp);
  const isValidTimestamp = Number.isFinite(ts) && (Date.now() - ts) < (24 * 60 * 60 * 1000);

  return isValidSignature && isValidTimestamp;
};

// Server-side cart validation
const validateCartItems = async (cartItems) => {
  if (!Array.isArray(cartItems)) return { isValid: false, message: "Invalid cart items format" };
  
  const validatedItems = [];
  for (const item of cartItems) {
    try {
      const product = await ProductModel.findById(item.productId || item.productId?._id);
      if (!product) continue;
      
      let actualPrice = product.price;
      if (item.variant?.sku && product.variants?.length > 0) {
        const variant = product.variants.find(v => v.sku === item.variant.sku);
        if (variant) actualPrice = variant.price;
      }
      
      validatedItems.push({
        ...item,
        actualPrice,
        quantity: Math.max(1, Math.min(99, parseInt(item.quantity) || 1))
      });
    } catch (error) {
      logSecurityEvent("CART_VALIDATION_ERROR", { item, error: error.message });
    }
  }
  
  return { isValid: true, validatedItems };
};

// @desc Get all welcome gifts
// @route GET /api/welcome-gifts
// @access Public
const getAllWelcomeGifts = asyncHandler(async (req, res) => {
  const gifts = await WelcomeGift.find({ isActive: true }).sort({ order: 1 }).select('-__v');
  res.status(200).json({
    success: true,
    data: gifts,
    message: "Welcome gifts retrieved successfully"
  });
});

// @desc Get all welcome gifts (admin)
// @route GET /api/admin/welcome-gifts
// @access Private/Admin
const getAllWelcomeGiftsAdmin = asyncHandler(async (req, res) => {
  const gifts = await WelcomeGift.find().sort({ order: 1 });
  res.status(200).json({
    success: true,
    data: gifts,
    message: "Welcome gifts retrieved successfully"
  });
});

// @desc Get single welcome gift
// @route GET /api/admin/welcome-gifts/:id
// @access Private/Admin
const getWelcomeGiftById = asyncHandler(async (req, res) => {
  const gift = await WelcomeGift.findById(req.params.id);
  if (!gift) {
    res.status(404);
    throw new Error("Welcome gift not found");
  }
  res.status(200).json({
    success: true,
    data: gift,
    message: "Welcome gift retrieved successfully"
  });
});

// @desc Create welcome gift
// @route POST /api/admin/welcome-gifts
// @access Private/Admin
const createWelcomeGift = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      title, description, icon, color, bgColor, reward, couponCode, order,
      rewardType, rewardValue, maxDiscount, minOrderAmount
    } = req.body;

    // Sanitize inputs
    const sanitizedData = {
      title: sanitizeString(title),
      description: sanitizeString(description),
      icon: sanitizeString(icon),
      color: sanitizeString(color),
      bgColor: sanitizeString(bgColor),
      reward: sanitizeString(reward),
      couponCode: sanitizeString(couponCode).toUpperCase(),
      order: parseInt(order),
      rewardType: sanitizeString(rewardType) || 'percentage',
      rewardValue: parseFloat(rewardValue) || 10,
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
      minOrderAmount: parseFloat(minOrderAmount) || 0
    };

    // Check if order already exists
    const existingGift = await WelcomeGift.findOne({ order: sanitizedData.order }).session(session);
    if (existingGift) {
      await session.abortTransaction();
      res.status(400);
      throw new Error(`Gift with order ${sanitizedData.order} already exists`);
    }

    // Check if coupon code already exists
    const existingCouponCode = await WelcomeGift.findOne({ 
      couponCode: sanitizedData.couponCode 
    }).session(session);
    if (existingCouponCode) {
      await session.abortTransaction();
      res.status(400);
      throw new Error(`Coupon code ${sanitizedData.couponCode} already exists`);
    }

    const gift = await WelcomeGift.create([sanitizedData], { session });
    await session.commitTransaction();

    logSecurityEvent("GIFT_CREATED", { giftId: gift[0]._id, adminId: req.user._id });
    res.status(201).json({
      success: true,
      data: gift,
      message: "Welcome gift created successfully"
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// @desc Update welcome gift
// @route PUT /api/admin/welcome-gifts/:id
// @access Private/Admin
const updateWelcomeGift = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const gift = await WelcomeGift.findById(req.params.id).session(session);
    if (!gift) {
      await session.abortTransaction();
      res.status(404);
      throw new Error("Welcome gift not found");
    }

    const {
      title, description, icon, color, bgColor, reward, couponCode, order,
      isActive, rewardType, rewardValue, maxDiscount, minOrderAmount
    } = req.body;

    // Build update object with sanitization
    const updateData = {};
    if (title !== undefined) updateData.title = sanitizeString(title);
    if (description !== undefined) updateData.description = sanitizeString(description);
    if (icon !== undefined) updateData.icon = sanitizeString(icon);
    if (color !== undefined) updateData.color = sanitizeString(color);
    if (bgColor !== undefined) updateData.bgColor = sanitizeString(bgColor);
    if (reward !== undefined) updateData.reward = sanitizeString(reward);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (rewardType !== undefined) updateData.rewardType = sanitizeString(rewardType);
    if (rewardValue !== undefined) updateData.rewardValue = parseFloat(rewardValue);
    if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount ? parseFloat(maxDiscount) : null;
    if (minOrderAmount !== undefined) updateData.minOrderAmount = parseFloat(minOrderAmount);

    // Check order conflicts
    if (order && parseInt(order) !== gift.order) {
      const existingGift = await WelcomeGift.findOne({ 
        order: parseInt(order), 
        _id: { $ne: req.params.id } 
      }).session(session);
      if (existingGift) {
        await session.abortTransaction();
        res.status(400);
        throw new Error(`Gift with order ${order} already exists`);
      }
      updateData.order = parseInt(order);
    }

    // Check coupon code conflicts
    if (couponCode && sanitizeString(couponCode).toUpperCase() !== gift.couponCode) {
      const existingCouponCode = await WelcomeGift.findOne({
        couponCode: sanitizeString(couponCode).toUpperCase(),
        _id: { $ne: req.params.id }
      }).session(session);
      if (existingCouponCode) {
        await session.abortTransaction();
        res.status(400);
        throw new Error(`Coupon code ${couponCode} already exists`);
      }
      updateData.couponCode = sanitizeString(couponCode).toUpperCase();
    }

    const updatedGift = await WelcomeGift.findByIdAndUpdate(
      req.params.id, updateData, { new: true, runValidators: true, session }
    );

    await session.commitTransaction();
    logSecurityEvent("GIFT_UPDATED", { giftId: req.params.id, adminId: req.user._id });

    res.status(200).json({
      success: true,
      data: updatedGift,
      message: "Welcome gift updated successfully"
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// @desc Delete welcome gift
// @route DELETE /api/admin/welcome-gifts/:id
// @access Private/Admin
const deleteWelcomeGift = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const gift = await WelcomeGift.findById(req.params.id).session(session);
    if (!gift) {
      await session.abortTransaction();
      res.status(404);
      throw new Error("Welcome gift not found");
    }

    // Check if gift has been claimed
    const claimedCount = await UserReward.countDocuments({ giftId: req.params.id }).session(session);
    if (claimedCount > 0) {
      await session.abortTransaction();
      res.status(400);
      throw new Error("Cannot delete gift that has been claimed by users");
    }

    await WelcomeGift.findByIdAndDelete(req.params.id).session(session);
    await session.commitTransaction();

    logSecurityEvent("GIFT_DELETED", { giftId: req.params.id, adminId: req.user._id });
    res.status(200).json({
      success: true,
      message: "Welcome gift deleted successfully"
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// @desc Toggle welcome gift status
// @route PATCH /api/admin/welcome-gifts/:id/toggle
// @access Private/Admin
const toggleWelcomeGiftStatus = asyncHandler(async (req, res) => {
  const gift = await WelcomeGift.findById(req.params.id);
  if (!gift) {
    res.status(404);
    throw new Error("Welcome gift not found");
  }

  gift.isActive = !gift.isActive;
  await gift.save();

  logSecurityEvent("GIFT_STATUS_TOGGLED", { 
    giftId: req.params.id, 
    newStatus: gift.isActive, 
    adminId: req.user._id 
  });

  res.status(200).json({
    success: true,
    data: gift,
    message: `Welcome gift ${gift.isActive ? 'activated' : 'deactivated'} successfully`
  });
});

// @desc Reorder welcome gifts
// @route PUT /api/admin/welcome-gifts/reorder
// @access Private/Admin
const reorderWelcomeGifts = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orders } = req.body;
    if (!Array.isArray(orders)) {
      await session.abortTransaction();
      res.status(400);
      throw new Error("Orders must be an array");
    }

    // Validate all orders exist and are unique
    const orderValues = orders.map(o => parseInt(o.order));
    const uniqueOrders = [...new Set(orderValues)];
    if (orderValues.length !== uniqueOrders.length) {
      await session.abortTransaction();
      res.status(400);
      throw new Error("Duplicate order values not allowed");
    }

    // Update each gift's order atomically
    for (const { id, order } of orders) {
      await WelcomeGift.findByIdAndUpdate(id, { order: parseInt(order) }, { session });
    }

    const updatedGifts = await WelcomeGift.find().sort({ order: 1 }).session(session);
    await session.commitTransaction();

    logSecurityEvent("GIFTS_REORDERED", { adminId: req.user._id, orderCount: orders.length });
    res.status(200).json({
      success: true,
      data: updatedGifts,
      message: "Welcome gifts reordered successfully"
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// @desc Get welcome gifts analytics
// @route GET /api/admin/welcome-gifts/analytics
// @access Private/Admin
const getWelcomeGiftsAnalytics = asyncHandler(async (req, res) => {
  const gifts = await WelcomeGift.find().sort({ order: 1 });
  const totalUsage = gifts.reduce((sum, gift) => sum + gift.usageCount, 0);
  const activeGifts = gifts.filter(gift => gift.isActive).length;

  const analytics = {
    totalGifts: gifts.length,
    activeGifts,
    totalUsage,
    gifts: gifts.map(gift => ({
      id: gift._id,
      title: gift.title,
      usageCount: gift.usageCount,
      lastUsed: gift.lastUsed,
      isActive: gift.isActive
    }))
  };

  res.status(200).json({
    success: true,
    data: analytics,
    message: "Welcome gifts analytics retrieved successfully"
  });
});

// @desc Claim welcome gift - WITH SECURITY FIXES
// @route POST /api/welcome-gifts/:id/claim
// @access Public
const claimWelcomeGift = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { anonymousId } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;

    // Validate anonymous ID if provided
    if (anonymousId && !validateAnonymousId(anonymousId)) {
      await session.abortTransaction();
      logSecurityEvent("INVALID_ANONYMOUS_ID", { anonymousId, clientIP });
      res.status(400);
      throw new Error("Invalid anonymous ID. Please refresh and try again.");
    }

    // Get gift with session for atomic operation
    const gift = await WelcomeGift.findById(req.params.id).session(session);
    if (!gift) {
      await session.abortTransaction();
      res.status(404);
      throw new Error("Welcome gift not found");
    }

    if (!gift.isActive) {
      await session.abortTransaction();
      logSecurityEvent("INACTIVE_GIFT_CLAIM_ATTEMPT", { giftId: req.params.id, clientIP });
      res.status(400);
      throw new Error("This welcome gift is not active");
    }

    // Check claim eligibility with atomic operations
    if (req.user) {
      const canClaim = await UserReward.canUserClaimGift(req.user._id, session);
      if (!canClaim) {
        await session.abortTransaction();
        logSecurityEvent("MULTIPLE_CLAIM_ATTEMPT", { userId: req.user._id, clientIP });
        res.status(400);
        throw new Error("You have already claimed a welcome gift. Only one gift per user is allowed.");
      }
    } else if (anonymousId) {
      const hasClaimed = await UserReward.hasAnonymousUserClaimed(anonymousId, session);
      if (hasClaimed) {
        await session.abortTransaction();
        logSecurityEvent("ANONYMOUS_MULTIPLE_CLAIM", { anonymousId, clientIP });
        res.status(400);
        throw new Error("You have already claimed a welcome gift. Only one gift per user is allowed.");
      }
    }

    // Atomic increment and reward creation
    await gift.incrementUsage(session);

    const userRewardData = {
      giftId: gift._id,
      rewardTitle: gift.title,
      rewardText: gift.reward,
      wasLoggedIn: !!req.user,
      anonymousId: anonymousId || null,
      claimedAt: new Date(),
      clientIP: clientIP
    };

    if (req.user) {
      userRewardData.userId = req.user._id;
      const User = require("../models/userModel");
      await User.findByIdAndUpdate(req.user._id, {
        rewardClaimed: true,
        reward: gift._id
      }, { session });
    }

    const userReward = await UserReward.create([userRewardData], { session });
    await session.commitTransaction();

    logSecurityEvent("GIFT_CLAIMED_SUCCESS", {
      giftId: gift._id,
      userId: req.user?._id,
      anonymousId,
      clientIP
    });

    res.status(200).json({
      success: true,
      data: {
        gift,
        claimed: true,
        anonymousId,
        userUpdated: !!req.user
      },
      message: "Welcome gift claimed successfully"
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// @desc Check if user should see welcome gift popup
// @route GET /api/welcome-gifts/check-eligibility
// @access Public
const checkWelcomeGiftEligibility = asyncHandler(async (req, res) => {
  const { anonymousId } = req.query;
  let shouldShowPopup = true;
  let reason = "First time visitor";
  const clientIP = req.ip || req.connection.remoteAddress;

  // Validate anonymous ID if provided
  if (anonymousId && !validateAnonymousId(anonymousId)) {
    logSecurityEvent("INVALID_ANONYMOUS_ID_CHECK", { anonymousId, clientIP });
    return res.status(200).json({
      success: true,
      data: {
        shouldShowPopup: false,
        reason: "Invalid session. Please refresh the page.",
        newAnonymousId: generateSecureAnonymousId()
      },
      message: "Eligibility check completed"
    });
  }

  try {
    if (req.user) {
      const canClaim = await UserReward.canUserClaimGift(req.user._id);
      if (!canClaim) {
        shouldShowPopup = false;
        reason = "User has already claimed a welcome gift";
      }
    } else if (anonymousId) {
      const hasClaimed = await UserReward.hasAnonymousUserClaimed(anonymousId);
      if (hasClaimed) {
        shouldShowPopup = false;
        reason = "Anonymous user has already claimed a welcome gift";
      }
    }

    res.status(200).json({
      success: true,
      data: {
        shouldShowPopup,
        reason,
        anonymousId: anonymousId || generateSecureAnonymousId()
      },
      message: "Eligibility check completed"
    });
  } catch (error) {
    logSecurityEvent("ELIGIBILITY_CHECK_ERROR", { error: error.message, clientIP });
    res.status(500).json({
      success: false,
      message: "Error checking eligibility",
      data: { shouldShowPopup: false }
    });
  }
});

// @desc Mark reward as used (when user places order or uses coupon)
// @route POST /api/welcome-gifts/mark-used
// @access Private
const markRewardAsUsed = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error("User must be logged in to mark reward as used");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userReward = await UserReward.findOne({
      userId: req.user._id,
      isUsed: false
    }).session(session);

    if (!userReward) {
      await session.abortTransaction();
      res.status(404);
      throw new Error("No unused reward found for this user");
    }

    if (userReward.isUsed) {
      await session.abortTransaction();
      res.status(400);
      throw new Error("Welcome gift already used");
    }

    await userReward.markAsUsed(session);
    
    // Update user status atomically
    const User = require("../models/userModel");
    await User.findByIdAndUpdate(req.user._id, { rewardUsed: true }, { session });

    await session.commitTransaction();

    logSecurityEvent("REWARD_MARKED_USED", { 
      userId: req.user._id, 
      rewardId: userReward._id 
    });

    res.status(200).json({
      success: true,
      data: userReward,
      message: "Reward marked as used successfully"
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// @desc Get user's claimed rewards
// @route GET /api/welcome-gifts/user-rewards
// @access Private
const getUserRewards = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error("User must be logged in");
  }

  const userRewards = await UserReward.find({ userId: req.user._id })
    .populate('giftId', 'title description icon color bgColor rewardType rewardValue couponCode maxDiscount minOrderAmount')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: userRewards,
    message: "User rewards retrieved successfully"
  });
});

// @desc Validate welcome gift coupon code - WITH SERVER-SIDE VALIDATION
// @route POST /api/welcome-gifts/validate-coupon
// @access Private
const validateWelcomeGiftCoupon = asyncHandler(async (req, res) => {
  try {
    const { couponCode, orderAmount, cartItems, anonymousId: bodyAnonymousId } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;

    // Input validation
    if (!couponCode || typeof couponCode !== 'string') {
      res.status(400);
      throw new Error("Valid coupon code is required");
    }

    if (!orderAmount || orderAmount <= 0 || !Number.isFinite(orderAmount)) {
      res.status(400);
      throw new Error("Valid order amount is required");
    }

    if (!Array.isArray(cartItems)) {
      res.status(400);
      throw new Error("Valid cart items are required");
    }

    // Validate and sanitize cart items server-side
    const cartValidation = await validateCartItems(cartItems);
    if (!cartValidation.isValid) {
      logSecurityEvent("INVALID_CART_VALIDATION", { 
        userId: req.user?._id, 
        clientIP, 
        error: cartValidation.message,
        debugCart: Array.isArray(cartItems) ? cartItems.map(i => ({
          productId: (i && i.productId && typeof i.productId === 'object') ? (i.productId._id || i.productId.id) : i?.productId,
          quantity: i?.quantity,
          hasVariant: !!i?.variant,
        })) : 'not-array'
      });
    }
    if (!cartValidation.isValid) {
      logSecurityEvent("INVALID_CART_VALIDATION", { 
        userId: req.user._id, 
        clientIP, 
        error: cartValidation.message 
      });
      res.status(400);
      throw new Error(cartValidation.message);
    }

    const validatedCartItems = cartValidation.validatedItems;
    
    // Calculate actual cart total server-side
    const actualCartTotal = validatedCartItems.reduce((total, item) => 
      total + (item.actualPrice * item.quantity), 0
    );

    // Security check: verify submitted order amount matches server calculation
    if (Math.abs(actualCartTotal - orderAmount) > 1) { // Allow 1 rupee tolerance for rounding
      logSecurityEvent("CART_TOTAL_MISMATCH", {
        userId: req.user._id,
        submittedTotal: orderAmount,
        actualTotal: actualCartTotal,
        clientIP
      });
      res.status(400);
      throw new Error("Cart total mismatch. Please refresh and try again.");
    }

    // Find gift by coupon code
    const gift = await WelcomeGift.findOne({
      couponCode: sanitizeString(couponCode).toUpperCase(),
      isActive: true
    });

    if (!gift) {
      logSecurityEvent("INVALID_COUPON_ATTEMPT", { 
        couponCode: sanitizeString(couponCode), 
        userId: req.user._id, 
        clientIP 
      });
      res.status(404);
      throw new Error("Invalid welcome gift coupon code");
    }

    // Check if user has claimed this specific gift and if it's unused
    let userReward = await UserReward.findOne({
      userId: req.user._id,
      giftId: gift._id
    });

    // Fallback: if user has not claimed but request includes a valid anonymousId
    if (!userReward && bodyAnonymousId) {
      const isValidAnon = validateAnonymousId(bodyAnonymousId);
      if (isValidAnon) {
        // Ensure user does not already have any reward to avoid unique index violations
        const existingForUser = await UserReward.findOne({ userId: req.user._id });
        if (!existingForUser) {
          const anonReward = await UserReward.findOne({
            anonymousId: bodyAnonymousId,
            giftId: gift._id,
            isUsed: false
          });
          if (anonReward) {
            try {
              // Migrate inline to unblock usage after login
              anonReward.userId = req.user._id;
              anonReward.migrationData = {
                originalAnonymousId: bodyAnonymousId,
                migratedAt: new Date(),
                migratedFrom: 'anonymous'
              };
              anonReward.anonymousId = undefined;
              await anonReward.save();
              userReward = anonReward;
            } catch (migrationError) {
              logSecurityEvent('INLINE_MIGRATION_ERROR', {
                error: migrationError.message,
                userId: req.user._id,
                giftId: gift._id,
                clientIP
              });
              // fall through; userReward remains null
            }
          }
        }
      }
    }

    if (!userReward) {
      logSecurityEvent("UNCLAIMED_GIFT_USAGE_ATTEMPT", {
        giftId: gift._id,
        userId: req.user._id,
        clientIP
      });
      return res.status(400).json({
        success: false,
        message: "You have not claimed this welcome gift. Please claim a gift first.",
        code: "UNCLAIMED_REWARD"
      });
    }

    if (userReward.isUsed) {
      logSecurityEvent("USED_GIFT_REUSE_ATTEMPT", {
        giftId: gift._id,
        userId: req.user._id,
        clientIP
      });
      res.status(400);
      throw new Error("This welcome gift has already been redeemed. Cannot use it again.");
    }

    // Server-side discount calculation using validated data
    const validationResult = gift.canBeApplied(actualCartTotal, validatedCartItems);
    if (!validationResult.canApply) {
      res.status(400);
      throw new Error(validationResult.reason);
    }

    // Calculate shipping discount for free shipping offers
    let shippingDiscount = 0;
    if (gift.rewardType === 'free_shipping') {
      // Use server-side shipping calculation logic
      shippingDiscount = actualCartTotal < 1000 ? 49 : 0;
    }

    const totalDiscount = validationResult.discount + shippingDiscount;
    const finalAmount = Math.max(0, actualCartTotal - totalDiscount);

    logSecurityEvent("COUPON_VALIDATED_SUCCESS", {
      giftId: gift._id,
      userId: req.user._id,
      discountAmount: totalDiscount,
      clientIP
    });

    const responseData = {
      gift: {
        _id: gift._id,
        title: gift.title,
        description: gift.description,
        icon: gift.icon,
        color: gift.color,
        bgColor: gift.bgColor,
        reward: gift.reward,
        couponCode: gift.couponCode,
        rewardType: gift.rewardType,
        rewardValue: gift.rewardValue,
        maxDiscount: gift.maxDiscount,
        minOrderAmount: gift.minOrderAmount
      },
      discountAmount: totalDiscount,
      reason: validationResult.reason,
      finalAmount: finalAmount,
      shippingDiscount: shippingDiscount,
      productDiscount: validationResult.discount,
      canApply: true,
      serverValidated: true // Flag to indicate server-side validation
    };

    res.status(200).json({
      success: true,
      data: responseData,
      message: "Welcome gift coupon validated successfully"
    });
  } catch (error) {
    logSecurityEvent("COUPON_VALIDATION_ERROR", {
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
      userId: req.user?._id,
      clientIP: req.ip,
      requestBody: process.env.NODE_ENV === 'production' ? undefined : req.body
    });
    throw error;
  }
});

// @desc Migrate anonymous welcome gift to authenticated user
// @route POST /api/welcome-gifts/migrate-anonymous
// @access Private
const migrateAnonymousGift = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) {
      await session.abortTransaction();
      res.status(401);
      throw new Error("User must be logged in to migrate gifts");
    }

    const { anonymousId } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;

    if (!anonymousId || !validateAnonymousId(anonymousId)) {
      await session.abortTransaction();
      logSecurityEvent("INVALID_MIGRATION_ATTEMPT", { 
        userId: req.user._id, 
        anonymousId, 
        clientIP 
      });
      res.status(400);
      throw new Error("Valid anonymous ID is required");
    }

    // Check if migration is possible with atomic operations
    const canMigrate = await UserReward.canMigrateAnonymousGift(anonymousId, req.user._id, session);
    if (!canMigrate) {
      await session.abortTransaction();
      // Return success to prevent frontend errors for legitimate cases
      return res.status(200).json({
        success: true,
        data: {
          message: "No migration needed - user already has a gift or no anonymous gift found",
          migrated: false
        },
        message: "Migration check completed successfully"
      });
    }

    // Perform atomic migration
    const migratedGift = await UserReward.migrateAnonymousGift(anonymousId, req.user._id, session);
    if (migratedGift) {
      // Update user's rewardClaimed status atomically
      const User = require("../models/userModel");
      await User.findByIdAndUpdate(req.user._id, {
        rewardClaimed: true,
        reward: migratedGift.giftId
      }, { session });

      await session.commitTransaction();

      logSecurityEvent("GIFT_MIGRATED_SUCCESS", {
        userId: req.user._id,
        anonymousId,
        giftId: migratedGift.giftId,
        clientIP
      });

      res.status(200).json({
        success: true,
        data: {
          migratedGift,
          message: "Anonymous welcome gift migrated successfully",
          migrated: true
        },
        message: "Welcome gift migrated successfully"
      });
    } else {
      await session.abortTransaction();
      res.status(400);
      throw new Error("Migration failed or user already has a gift");
    }
  } catch (error) {
    await session.abortTransaction();
    logSecurityEvent("MIGRATION_ERROR", {
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
      userId: req.user?._id,
      clientIP: req.ip
    });
    // Fail soft: return success with migrated=false so frontend UX continues smoothly
    return res.status(200).json({
      success: true,
      data: {
        migrated: false,
        message: "Migration not possible at this time"
      },
      message: "Migration handled"
    });
  } finally {
    session.endSession();
  }
});

// Apply rate limiting to claim endpoint
const applyGiftClaimLimiter = (req, res, next) => {
  if (req.path.includes('/claim')) {
    return giftClaimLimiter(req, res, next);
  }
  next();
};

module.exports = {
  getAllWelcomeGifts,
  getAllWelcomeGiftsAdmin,
  getWelcomeGiftById,
  createWelcomeGift,
  updateWelcomeGift,
  deleteWelcomeGift,
  toggleWelcomeGiftStatus,
  reorderWelcomeGifts,
  getWelcomeGiftsAnalytics,
  claimWelcomeGift,
  checkWelcomeGiftEligibility,
  markRewardAsUsed,
  getUserRewards,
  validateWelcomeGiftCoupon,
  migrateAnonymousGift,
  applyGiftClaimLimiter,
  generateSecureAnonymousId,
  validateAnonymousId 
};
