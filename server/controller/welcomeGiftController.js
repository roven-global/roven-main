const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const WelcomeGift = require("../models/welcomeGiftModel");
const UserReward = require("../models/userRewardModel");
const ProductModel = require("../models/productModel");
const { generateSecureAnonymousId, validateAnonymousId } = require("../utils/anonymousId");

// Check if MongoDB instance supports transactions
const supportsTransactions = () => {
  try {
    return mongoose.connection.readyState === 1 && 
           mongoose.connection.db.serverConfig.s.description.type === 'ReplicaSetWithPrimary';
  } catch {
    return false;
  }
};

// Helper function to execute with or without transactions
const executeWithOptionalTransaction = async (callback) => {
  if (supportsTransactions()) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const result = await callback(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } else {
    // Execute without transactions for local development
    return await callback(null);
  }
};

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

// Server-side cart validation
const validateCartItems = async (cartItems) => {
  if (!Array.isArray(cartItems)) return { isValid: false, message: "Invalid cart items format" };
  
  if (cartItems.length === 0) {
    return { isValid: false, message: "Cart is empty. Please add items to your cart before applying coupons." };
  }
  
  const validatedItems = [];
  let totalCartValue = 0;
  
  for (const item of cartItems) {
    try {
      const productId = (item && item.productId && typeof item.productId === 'object')
        ? (item.productId._id || item.productId.id)
        : item?.productId;
      const product = await ProductModel.findById(productId);
      if (!product) continue;
      
      let actualPrice = product.price;
      if (item.variant?.sku && product.variants?.length > 0) {
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
      logSecurityEvent("CART_VALIDATION_ERROR", { item, error: error.message });
    }
  }
  
  if (validatedItems.length === 0) {
    return { isValid: false, message: "No valid items found in cart. Please ensure cart has valid products." };
  }
  
  return { 
    isValid: validatedItems.length > 0, 
    validatedItems,
    totalCartValue: Math.round(totalCartValue * 100) / 100
  };
};

// @desc Test endpoint to verify server functionality
// @route GET /api/welcome-gifts/test
// @access Public
const testWelcomeGiftEndpoint = asyncHandler(async (req, res) => {
  console.log('Welcome gift test endpoint called');
  res.status(200).json({
    success: true,
    message: "Welcome gift test endpoint working",
    timestamp: new Date().toISOString(),
    serverStatus: "running"
  });
});

// @desc Get all welcome gifts
// @route GET /api/welcome-gifts
// @access Public
const getAllWelcomeGifts = asyncHandler(async (req, res) => {
  try {
    console.log('Getting all welcome gifts...');
    const gifts = await WelcomeGift.find({ isActive: true }).sort({ order: 1 }).select('-__v');
    console.log(`Found ${gifts.length} active welcome gifts`);
    res.status(200).json({
      success: true,
      data: gifts,
      message: "Welcome gifts retrieved successfully"
    });
  } catch (error) {
    console.error('Error getting welcome gifts:', error);
    throw error;
  }
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
    let { anonymousId } = req.body;
    const clientIP = req.ip || req.connection?.remoteAddress || 'unknown';

    // Generate anonymous ID if not provided or invalid
    if (!anonymousId) {
      anonymousId = generateSecureAnonymousId();
      console.log('Generated new anonymous ID for claim:', anonymousId);
    } else if (!validateAnonymousId(anonymousId)) {
      await session.abortTransaction();
      logSecurityEvent("INVALID_ANONYMOUS_ID", { anonymousId, clientIP });
      res.status(400);
      throw new Error("Invalid anonymous ID. Please refresh and try again.");
    }
    
    console.log('Claim function - anonymousId details:', {
      anonymousId,
      anonymousIdLength: anonymousId?.length,
      anonymousIdParts: anonymousId?.split('-')?.length,
      isValid: validateAnonymousId(anonymousId)
    });

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
    
    // Log gift object structure for debugging
    console.log('Gift object structure:', {
      id: gift._id,
      title: gift.title,
      reward: gift.reward,
      rewardText: gift.rewardText,
      description: gift.description,
      hasReward: !!gift.reward,
      hasRewardText: !!gift.rewardText,
      hasDescription: !!gift.description
    });

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
    try {
      console.log('Incrementing gift usage for gift:', gift._id);
      await gift.incrementUsage(session);
      console.log('Gift usage incremented successfully');
    } catch (incrementError) {
      console.error('Error incrementing gift usage:', incrementError);
      await session.abortTransaction();
      throw new Error('Failed to update gift usage. Please try again.');
    }

    const userRewardData = {
      giftId: gift._id,
      rewardTitle: gift.title,
      rewardText: gift.reward || gift.rewardText || gift.description || 'Welcome gift reward',
      wasLoggedIn: !!req.user,
      anonymousId: anonymousId || null,
      claimedAt: new Date(),
      clientIP: clientIP
    };

    // Ensure either userId or anonymousId is set (but not both)
    if (req.user) {
      userRewardData.userId = req.user._id;
      userRewardData.anonymousId = null; // Remove anonymousId for authenticated users
    } else {
      userRewardData.userId = null; // Ensure userId is null for anonymous users
    }

    console.log('Creating UserReward with data:', {
      giftId: userRewardData.giftId,
      rewardTitle: userRewardData.rewardTitle,
      wasLoggedIn: userRewardData.wasLoggedIn,
      hasAnonymousId: !!userRewardData.anonymousId,
      anonymousId: userRewardData.anonymousId,
      userId: userRewardData.userId,
      clientIP: userRewardData.clientIP
    });

    if (req.user) {
      const User = require("../models/userModel");
      await User.findByIdAndUpdate(req.user._id, {
        rewardClaimed: true,
        reward: gift._id
      }, { session });
    }

    try {
      console.log('Attempting to create UserReward with session:', {
        sessionId: session.id,
        userRewardData: JSON.stringify(userRewardData, null, 2)
      });
      
      // Log the exact data being sent to UserReward.create
      console.log('UserReward data validation check:', {
        hasGiftId: !!userRewardData.giftId,
        hasRewardTitle: !!userRewardData.rewardTitle,
        hasRewardText: !!userRewardData.rewardText,
        hasWasLoggedIn: userRewardData.wasLoggedIn !== undefined,
        hasAnonymousId: userRewardData.anonymousId !== null,
        hasUserId: userRewardData.userId !== null,
        hasClaimedAt: !!userRewardData.claimedAt,
        hasClientIP: !!userRewardData.clientIP
      });
      
      const userReward = await UserReward.create([userRewardData], { session });
      console.log('UserReward created successfully:', userReward);
      
      await session.commitTransaction();
      console.log('Transaction committed successfully');
    } catch (createError) {
      console.error('Error creating UserReward:', createError);
      console.error('Error details:', {
        name: createError.name,
        message: createError.message,
        code: createError.code,
        keyPattern: createError.keyPattern,
        keyValue: createError.keyValue,
        stack: createError.stack
      });
      
      // Log the exact data that failed
      console.error('Failed UserReward data:', userRewardData);
      
      await session.abortTransaction();
      throw new Error(`Failed to create reward record: ${createError.message}`);
    }

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
  const clientIP = req.ip || req.connection?.remoteAddress || 'unknown';

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
    const { couponCode, orderAmount, cartItems, anonymousId: bodyAnonymousId } = req.body;
    const clientIP = req.ip || req.connection?.remoteAddress || 'unknown';

    // Input validation
    if (!couponCode || typeof couponCode !== 'string') {
      return res.status(400).json({ success: false, message: "Valid coupon code is required" });
    }

    if (!Array.isArray(cartItems)) {
      return res.status(400).json({ success: false, message: "Valid cart items are required" });
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
      return res.status(400).json({ success: false, message: cartValidation.message });
    }

    const validatedCartItems = cartValidation.validatedItems;
    
    // Use server-calculated cart total for more accurate validation
    const actualCartTotal = cartValidation.totalCartValue;
    
    // Security check: verify submitted order amount matches server calculation
    if (orderAmount && Math.abs(actualCartTotal - orderAmount) > 1) { // Allow 1 rupee tolerance for rounding
      logSecurityEvent("CART_TOTAL_MISMATCH", {
        userId: req.user?._id,
        submittedTotal: orderAmount,
        actualTotal: actualCartTotal,
        clientIP
      });
      // Soft-fail: proceed using server total for robustness
    }

    // Find gift by coupon code
    const gift = await WelcomeGift.findOne({
      couponCode: sanitizeString(couponCode).toUpperCase(),
      isActive: true
    });

    if (!gift) {
      logSecurityEvent("INVALID_COUPON_ATTEMPT", { 
        couponCode: sanitizeString(couponCode), 
        userId: req.user?._id, 
        clientIP 
      });
      return res.status(404).json({ success: false, message: "Invalid welcome gift coupon code" });
    }

    // Check if user has claimed this specific gift and if it's unused
    let userReward = await UserReward.findOne({
      userId: req.user._id,
      giftId: gift._id,
      isUsed: false,
    });

    console.log('ValidateWelcomeGiftCoupon: Initial userReward lookup result:', {
      userReward: !!userReward,
      userId: req.user._id,
      giftId: gift._id,
      hasAnonymousId: !!bodyAnonymousId
    });

    // The primary migration path is now handled by AuthContext upon login.
    // This function should only validate for an already authenticated and migrated user.
    // The inline migration fallback has been removed to simplify the logic.

    if (!userReward) {
      console.log('ValidateWelcomeGiftCoupon: No userReward found for authenticated user', {
        userId: req.user?._id,
        giftId: gift._id,
      });
      
      logSecurityEvent("UNCLAIMED_GIFT_USAGE_ATTEMPT", {
        giftId: gift._id,
        userId: req.user?._id,
        clientIP
      });
      // Inline migration fallback: attach anonymous reward for this user if present
      if (bodyAnonymousId) {
        const anonymousReward = await UserReward.findOne({ anonymousId: bodyAnonymousId, isUsed: false });
        if (anonymousReward) {
          anonymousReward.userId = req.user._id;
          anonymousReward.anonymousId = null;
          await anonymousReward.save();
          userReward = anonymousReward;
          const User = require("../models/userModel");
          await User.findByIdAndUpdate(req.user._id, { rewardClaimed: true, reward: anonymousReward.giftId });
          logSecurityEvent("INLINE_GIFT_MIGRATION_SUCCESS", { userId: req.user._id, giftId: anonymousReward.giftId });
        }
      }

      if (!userReward) {
        return res.status(400).json({
          success: false,
          message: "You have not claimed this welcome gift. Please claim a gift first.",
          code: "UNCLAIMED_REWARD",
          debug: {
            hasAnonymousId: !!bodyAnonymousId,
            userId: req.user?._id,
            giftId: gift._id
          }
        });
      }
    }

    if (userReward.isUsed) {
      logSecurityEvent("USED_GIFT_REUSE_ATTEMPT", {
        giftId: gift._id,
        userId: req.user?._id,
        clientIP
      });
      return res.status(400).json({ success: false, message: "This welcome gift has already been redeemed. Cannot use it again." });
    }

    // Server-side discount calculation using validated data
    const validationResult = gift.canBeApplied(actualCartTotal, validatedCartItems);
    if (!validationResult.canApply) {
      return res.status(400).json({ success: false, message: validationResult.reason });
    }

    // Calculate shipping discount for free shipping offers
    let shippingDiscount = 0;
    if (gift.rewardType === 'free_shipping') {
      // Use server-side shipping calculation logic
      shippingDiscount = actualCartTotal < 1000 ? 49 : 0;
    }

    const serverTotal = actualCartTotal;
    const totalDiscount = validationResult.discount + shippingDiscount;
    const finalAmount = Math.max(0, serverTotal - totalDiscount);

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

    return res.status(200).json({
      success: true,
      data: responseData,
      message: "Welcome gift coupon validated successfully"
    });
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
    const clientIP = req.ip || req.connection?.remoteAddress || 'unknown';

    if (!anonymousId) {
      await session.abortTransaction();
      logSecurityEvent("MISSING_ANONYMOUS_ID", { 
        userId: req.user._id, 
        clientIP 
      });
      res.status(400);
      throw new Error("Anonymous ID is required");
    }
    
    // Validate anonymous ID with detailed logging
    const isValidAnonymousId = validateAnonymousId(anonymousId);
    console.log('Migration - Anonymous ID validation:', {
      anonymousId,
      isValidAnonymousId,
      anonymousIdLength: anonymousId?.length,
      anonymousIdParts: anonymousId?.split('-')?.length
    });
    
    if (!isValidAnonymousId) {
      await session.abortTransaction();
      logSecurityEvent("INVALID_MIGRATION_ATTEMPT", { 
        userId: req.user._id, 
        anonymousId, 
        clientIP 
      });
      res.status(400);
      throw new Error("Invalid anonymous ID. Please refresh and try again.");
    }

    // First, let's check what rewards exist for this user and anonymousId
    const existingUserReward = await UserReward.findOne({ userId: req.user._id });
    const anonymousRewards = await UserReward.find({ anonymousId });
    const unusedAnonymousRewards = await UserReward.find({ anonymousId, isUsed: false });
    
    console.log('Migration Debug:', {
      userId: req.user._id,
      anonymousId,
      anonymousIdLength: anonymousId?.length,
      anonymousIdParts: anonymousId?.split('-')?.length,
      existingUserReward: !!existingUserReward,
      anonymousRewardsCount: anonymousRewards.length,
      unusedAnonymousRewardsCount: unusedAnonymousRewards.length,
      anonymousRewards: anonymousRewards.map(r => ({ 
        id: r._id, 
        isUsed: r.isUsed, 
        giftId: r.giftId,
        rewardTitle: r.rewardTitle,
        storedAnonymousId: r.anonymousId,
        storedAnonymousIdLength: r.anonymousId?.length
      }))
    });
    
    // Also check for any rewards with similar anonymous IDs (for debugging)
    if (anonymousRewards.length === 0 && anonymousId) {
      // Try to find rewards with similar anonymous IDs
      const similarRewards = await UserReward.find({
        anonymousId: { $regex: anonymousId.substring(0, 20) }
      });
      console.log('Similar anonymous IDs found:', similarRewards.map(r => ({
        id: r._id,
        anonymousId: r.anonymousId,
        anonymousIdLength: r.anonymousId?.length
      })));
      
      // Also try to find any rewards that might have been stored with a different format
      const allAnonymousRewards = await UserReward.find({
        anonymousId: { $exists: true, $ne: null }
      });
      console.log('All anonymous rewards in database:', allAnonymousRewards.map(r => ({
        id: r._id,
        anonymousId: r.anonymousId,
        anonymousIdLength: r.anonymousId?.length,
        createdAt: r.createdAt
      })));
    }

    // Check if migration is possible with atomic operations
    const canMigrate = await UserReward.canMigrateAnonymousGift(anonymousId, req.user._id, session);
    if (!canMigrate) {
      await session.abortTransaction();
      
      if (existingUserReward) {
        console.log('Migration not needed: User already has a reward', {
          userId: req.user._id,
          existingRewardId: existingUserReward._id
        });
      } else {
        console.log('Migration not possible: No anonymous gift found for migration', {
          userId: req.user._id,
          anonymousId,
          anonymousRewardsFound: anonymousRewards.length,
          unusedRewardsFound: unusedAnonymousRewards.length
        });
      }
      
      // Return success to prevent frontend errors for legitimate cases
      return res.status(200).json({
        success: true,
        data: {
          message: "No migration needed - user already has a gift or no anonymous gift found",
          migrated: false,
          userHasReward: !!existingUserReward
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

// @desc Generate a new anonymous ID
// @route GET /api/welcome-gifts/anonymous-id
// @access Public
const getAnonymousId = asyncHandler(async (req, res) => {
  const anonymousId = generateSecureAnonymousId();
  res.status(200).json({
    success: true,
    data: { anonymousId },
    message: "Anonymous ID generated successfully"
  });
});

// Apply rate limiting to claim endpoint
const applyGiftClaimLimiter = (req, res, next) => {
  if (req.path.includes('/claim')) {
    return giftClaimLimiter(req, res, next);
  }
  next();
};

// Check if a user has an active, unused welcome gift
const checkRewardStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const unusedReward = await UserReward.findOne({
      userId: userId,
      isUsed: false,
      giftId: { $exists: true }, // Specifically check for welcome gifts
    }).populate("giftId");

    if (unusedReward) {
      res.status(200).json({
        success: true,
        hasUnusedReward: true,
        rewardDetails: unusedReward.giftId, // Send the details of the WelcomeGift
      });
    } else {
      res
        .status(200)
        .json({ success: true, hasUnusedReward: false, rewardDetails: null });
    }
  } catch (error)
 {
    console.error("Error in checkRewardStatus:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
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
  testWelcomeGiftEndpoint,
  getAnonymousId,
  checkRewardStatus
};
