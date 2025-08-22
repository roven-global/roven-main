const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const WelcomeGift = require("../models/welcomeGiftModel");
const UserReward = require("../models/userRewardModel");
const AdminSetting = require("../models/adminSettingsModel");
const { validateCartItems } = require("../utils/cartValidator");
const {
  generateSecureAnonymousId,
  validateAnonymousId,
} = require("../utils/anonymousId");
const {
  executeWithOptionalTransaction,
} = require("../utils/transactionHandler");

// Security helpers
const sanitizeString = (str) =>
  typeof str === "string" ? str.trim().replace(/[<>\"']/g, "") : "";
const logSecurityEvent = (event, details) => {
  console.log(`[SECURITY][${new Date().toISOString()}][${event}]`, details);
};

// Rate limiting for gift claims
const giftClaimLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 gift claims per windowMs
  message: {
    success: false,
    message: "Too many gift claims. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});


// @desc Test endpoint to verify server functionality
// @route GET /api/welcome-gifts/test
// @access Public
const testWelcomeGiftEndpoint = asyncHandler(async (req, res) => {
  console.log("Welcome gift test endpoint called");
  res.status(200).json({
    success: true,
    message: "Welcome gift test endpoint working",
    timestamp: new Date().toISOString(),
    serverStatus: "running",
  });
});

// @desc Get all welcome gifts
// @route GET /api/welcome-gifts
// @access Public
const getAllWelcomeGifts = asyncHandler(async (req, res) => {
  try {
    console.log("Getting all welcome gifts...");
    const limit = await AdminSetting.getSetting('activeWelcomeGiftLimit', 6); // Default to 6

    const gifts = await WelcomeGift.aggregate([
      { $match: { isActive: true } },
      { $sample: { size: Number(limit) } },
      { $project: { __v: 0 } } // Exclude the __v field
    ]);

    console.log(`Found and sampled ${gifts.length} active welcome gifts.`);
    res.status(200).json({
      success: true,
      data: gifts,
      message: "Welcome gifts retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting welcome gifts:", error);
    throw error;
  }
});

// @desc Get all welcome gifts (admin)
// @route GET /api/admin/welcome-gifts
// @access Private/Admin
const getAllWelcomeGiftsAdmin = asyncHandler(async (req, res) => {
  const gifts = await WelcomeGift.find().sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    data: gifts,
    message: "Welcome gifts retrieved successfully",
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
    message: "Welcome gift retrieved successfully",
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
      title,
      description,
      icon,
      color,
      bgColor,
      reward,
      couponCode,
      rewardType,
      rewardValue,
      maxDiscount,
      minOrderAmount,
      buyQuantity,
      getQuantity,
      applicableCategories,
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
      rewardType: sanitizeString(rewardType) || "percentage",
      rewardValue: parseFloat(rewardValue) || 10,
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
      minOrderAmount: parseFloat(minOrderAmount) || 0,
      buyQuantity: buyQuantity ? parseInt(buyQuantity) : 1,
      getQuantity: getQuantity ? parseInt(getQuantity) : 1,
      applicableCategories: applicableCategories || [],
    };

    // Check if coupon code already exists
    const existingCouponCode = await WelcomeGift.findOne({
      couponCode: sanitizedData.couponCode,
    }).session(session);
    if (existingCouponCode) {
      res.status(400);
      throw new Error(`Coupon code ${sanitizedData.couponCode} already exists`);
    }

    const gift = await WelcomeGift.create([sanitizedData], { session });
    await session.commitTransaction();

    logSecurityEvent("GIFT_CREATED", {
      giftId: gift[0]._id,
      adminId: req.user._id,
    });
    res.status(201).json({
      success: true,
      data: gift,
      message: "Welcome gift created successfully",
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
      res.status(404);
      throw new Error("Welcome gift not found");
    }

    const {
      title,
      description,
      icon,
      color,
      bgColor,
      reward,
      couponCode,
      isActive,
      rewardType,
      rewardValue,
      maxDiscount,
      minOrderAmount,
      buyQuantity,
      getQuantity,
      applicableCategories,
    } = req.body;

    // Build update object with sanitization
    const updateData = {};
    if (title !== undefined) updateData.title = sanitizeString(title);
    if (description !== undefined)
      updateData.description = sanitizeString(description);
    if (icon !== undefined) updateData.icon = sanitizeString(icon);
    if (color !== undefined) updateData.color = sanitizeString(color);
    if (bgColor !== undefined) updateData.bgColor = sanitizeString(bgColor);
    if (reward !== undefined) updateData.reward = sanitizeString(reward);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (rewardType !== undefined)
      updateData.rewardType = sanitizeString(rewardType);
    if (rewardValue !== undefined)
      updateData.rewardValue = parseFloat(rewardValue);
    if (maxDiscount !== undefined)
      updateData.maxDiscount = maxDiscount ? parseFloat(maxDiscount) : null;
    if (minOrderAmount !== undefined)
      updateData.minOrderAmount = parseFloat(minOrderAmount);
    if (buyQuantity !== undefined)
      updateData.buyQuantity = parseInt(buyQuantity);
    if (getQuantity !== undefined)
      updateData.getQuantity = parseInt(getQuantity);
    if (applicableCategories !== undefined)
      updateData.applicableCategories = applicableCategories;

    // Check coupon code conflicts
    if (
      couponCode &&
      sanitizeString(couponCode).toUpperCase() !== gift.couponCode
    ) {
      const existingCouponCode = await WelcomeGift.findOne({
        couponCode: sanitizeString(couponCode).toUpperCase(),
        _id: { $ne: req.params.id },
      }).session(session);
      if (existingCouponCode) {
        res.status(400);
        throw new Error(`Coupon code ${couponCode} already exists`);
      }
      updateData.couponCode = sanitizeString(couponCode).toUpperCase();
    }

    const updatedGift = await WelcomeGift.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true, session }
    );

    await session.commitTransaction();
    logSecurityEvent("GIFT_UPDATED", {
      giftId: req.params.id,
      adminId: req.user._id,
    });

    res.status(200).json({
      success: true,
      data: updatedGift,
      message: "Welcome gift updated successfully",
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
      res.status(404);
      throw new Error("Welcome gift not found");
    }

    // Check if gift has been claimed
    const claimedCount = await UserReward.countDocuments({
      giftId: req.params.id,
    }).session(session);
    if (claimedCount > 0) {
      res.status(400);
      throw new Error("Cannot delete gift that has been claimed by users");
    }

    await WelcomeGift.findByIdAndDelete(req.params.id).session(session);
    await session.commitTransaction();

    logSecurityEvent("GIFT_DELETED", {
      giftId: req.params.id,
      adminId: req.user._id,
    });
    res.status(200).json({
      success: true,
      message: "Welcome gift deleted successfully",
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

  // If activating the gift, check against the limit
  if (!gift.isActive) {
    const limitSetting = await AdminSetting.getSetting('activeWelcomeGiftLimit', 6); // Default to 6 if not set
    const activeGiftLimit = Number(limitSetting);
    const activeGiftsCount = await WelcomeGift.countDocuments({ isActive: true });

    if (activeGiftsCount >= activeGiftLimit) {
      res.status(400);
      throw new Error(`You have reached the limit of ${activeGiftLimit} active welcome gifts. Please deactivate another gift before activating a new one.`);
    }
  }

  gift.isActive = !gift.isActive;
  await gift.save();

  logSecurityEvent("GIFT_STATUS_TOGGLED", {
    giftId: req.params.id,
    newStatus: gift.isActive,
    adminId: req.user._id,
  });

  res.status(200).json({
    success: true,
    data: gift,
    message: `Welcome gift ${
      gift.isActive ? "activated" : "deactivated"
    } successfully`,
  });
});

// @desc Get welcome gifts analytics
// @route GET /api/admin/welcome-gifts/analytics
// @access Private/Admin
const getWelcomeGiftsAnalytics = asyncHandler(async (req, res) => {
  const gifts = await WelcomeGift.find().sort({ createdAt: -1 });
  const totalUsage = gifts.reduce((sum, gift) => sum + gift.usageCount, 0);
  const activeGifts = gifts.filter((gift) => gift.isActive).length;

  const analytics = {
    totalGifts: gifts.length,
    activeGifts,
    totalUsage,
    gifts: gifts.map((gift) => ({
      id: gift._id,
      title: gift.title,
      usageCount: gift.usageCount,
      lastUsed: gift.lastUsed,
      isActive: gift.isActive,
    })),
  };

  res.status(200).json({
    success: true,
    data: analytics,
    message: "Welcome gifts analytics retrieved successfully",
  });
});

// @desc Claim welcome gift - WITH SECURITY FIXES
// @route POST /api/welcome-gifts/:id/claim
// @access Public
const claimWelcomeGift = asyncHandler(async (req, res) => {
  const result = await executeWithOptionalTransaction(async (session) => {
    let { anonymousId } = req.body;
    const clientIP = req.ip || req.connection?.remoteAddress || "unknown";

    // Generate anonymous ID if not provided or invalid
    if (!anonymousId) {
      anonymousId = generateSecureAnonymousId();
      console.log("Generated new anonymous ID for claim:", anonymousId);
    } else if (!validateAnonymousId(anonymousId)) {
      logSecurityEvent("INVALID_ANONYMOUS_ID", { anonymousId, clientIP });
      throw new Error("Invalid anonymous ID. Please refresh and try again.");
    }

    console.log("Claim function - anonymousId details:", {
      anonymousId,
      anonymousIdLength: anonymousId?.length,
      anonymousIdParts: anonymousId?.split("-")?.length,
      isValid: validateAnonymousId(anonymousId),
    });

    // Get gift with optional session for atomic operation
    const gift = session
      ? await WelcomeGift.findById(req.params.id).session(session)
      : await WelcomeGift.findById(req.params.id);

    if (!gift) {
      throw new Error("Welcome gift not found");
    }

    if (!gift.isActive) {
      logSecurityEvent("INACTIVE_GIFT_CLAIM_ATTEMPT", {
        giftId: req.params.id,
        clientIP,
      });
      throw new Error("This welcome gift is not active");
    }

    // Log gift object structure for debugging
    console.log("Gift object structure:", {
      id: gift._id,
      title: gift.title,
      reward: gift.reward,
      rewardText: gift.rewardText,
      description: gift.description,
      hasReward: !!gift.reward,
      hasRewardText: !!gift.rewardText,
      hasDescription: !!gift.description,
    });

    // The pre-check for claimed gifts is removed to prevent race conditions.
    // We now rely on the unique index on the UserReward collection and handle the duplicate key error.

    try {
      const userRewardData = {
        giftId: gift._id,
        rewardTitle: gift.title,
        rewardText: gift.reward || gift.description || "Welcome gift reward",
        wasLoggedIn: !!req.user,
        anonymousId: req.user ? null : anonymousId || null,
        userId: req.user ? req.user._id : null,
        claimedAt: new Date(),
        clientIP: clientIP,
      };

      // Atomically create the reward. This will fail if a unique index is violated.
      const userReward = session
        ? (await UserReward.create([userRewardData], { session }))[0]
        : await UserReward.create(userRewardData);

      console.log("UserReward created successfully:", userReward._id);

      // If successful, increment the usage count for the gift.
      await gift.incrementUsage(session);
      console.log("Gift usage incremented successfully for gift:", gift._id);

      // If the user is logged in, update their user record.
      if (req.user) {
        const User = require("../models/userModel");
        await User.findByIdAndUpdate(
          req.user._id,
          {
            rewardClaimed: true,
            reward: gift._id,
          },
          { session }
        );
        console.log("User record updated for user:", req.user._id);
      }
    } catch (error) {
      // Check for duplicate key error (code 11000)
      if (error.code === 11000) {
        logSecurityEvent("DUPLICATE_CLAIM_ATTEMPT", {
          userId: req.user?._id,
          anonymousId,
          clientIP,
          giftId: gift._id,
          error: error.message,
        });
        // Throw a user-friendly error message.
        throw new Error(
          "You have already claimed a welcome gift. Only one gift per user is allowed."
        );
      }

      // For any other error, log it and re-throw to be handled by the global error handler.
      console.error("Error during reward claim process:", error);
      throw error;
    }

    logSecurityEvent("GIFT_CLAIMED_SUCCESS", {
      giftId: gift._id,
      userId: req.user?._id,
      anonymousId,
      clientIP,
    });

    return {
      gift,
      claimed: true,
      anonymousId,
      userUpdated: !!req.user,
    };
  });

  res.status(200).json({
    success: true,
    data: result,
    message: "Welcome gift claimed successfully",
  });
});

// @desc Check if user should see welcome gift popup
// @route GET /api/welcome-gifts/check-eligibility
// @access Public
const checkWelcomeGiftEligibility = asyncHandler(async (req, res) => {
  const { anonymousId } = req.query;
  let shouldShowPopup = true;
  let reason = "First time visitor";
  const clientIP = req.ip || req.connection?.remoteAddress || "unknown";

  // Validate anonymous ID if provided
  if (anonymousId && !validateAnonymousId(anonymousId)) {
    logSecurityEvent("INVALID_ANONYMOUS_ID_CHECK", { anonymousId, clientIP });
    return res.status(200).json({
      success: true,
      data: {
        shouldShowPopup: false,
        reason: "Invalid session. Please refresh the page.",
        newAnonymousId: generateSecureAnonymousId(),
      },
      message: "Eligibility check completed",
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
        anonymousId: anonymousId || generateSecureAnonymousId(),
      },
      message: "Eligibility check completed",
    });
  } catch (error) {
    logSecurityEvent("ELIGIBILITY_CHECK_ERROR", {
      error: error.message,
      clientIP,
    });
    res.status(500).json({
      success: false,
      message: "Error checking eligibility",
      data: { shouldShowPopup: false },
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
      isUsed: false,
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
    await User.findByIdAndUpdate(
      req.user._id,
      { rewardUsed: true },
      { session }
    );

    await session.commitTransaction();

    logSecurityEvent("REWARD_MARKED_USED", {
      userId: req.user._id,
      rewardId: userReward._id,
    });

    res.status(200).json({
      success: true,
      data: userReward,
      message: "Reward marked as used successfully",
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
    .populate(
      "giftId",
      "title description icon color bgColor rewardType rewardValue couponCode maxDiscount minOrderAmount"
    )
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: userRewards,
    message: "User rewards retrieved successfully",
  });
});

// @desc Validate welcome gift coupon code - WITH SERVER-SIDE VALIDATION
// @route POST /api/welcome-gifts/validate-coupon
// @access Private
const validateWelcomeGiftCoupon = asyncHandler(async (req, res) => {
  const {
    couponCode,
    orderAmount,
    cartItems,
    anonymousId: bodyAnonymousId,
  } = req.body;
  const clientIP = req.ip || req.connection?.remoteAddress || "unknown";

  // Input validation
  if (!couponCode || typeof couponCode !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Valid coupon code is required" });
  }

  if (!Array.isArray(cartItems)) {
    return res
      .status(400)
      .json({ success: false, message: "Valid cart items are required" });
  }

  // Validate and sanitize cart items server-side
  const cartValidation = await validateCartItems(cartItems);
  if (!cartValidation.isValid) {
    logSecurityEvent("INVALID_CART_VALIDATION", {
      userId: req.user?._id,
      clientIP,
      error: cartValidation.message,
      debugCart: Array.isArray(cartItems)
        ? cartItems.map((i) => ({
            productId:
              i && i.productId && typeof i.productId === "object"
                ? i.productId._id || i.productId.id
                : i?.productId,
            quantity: i?.quantity,
            hasVariant: !!i?.variant,
          }))
        : "not-array",
    });
    return res
      .status(400)
      .json({ success: false, message: cartValidation.message });
  }

  const validatedCartItems = cartValidation.validatedItems;

  // Use server-calculated cart total for more accurate validation
  const actualCartTotal = cartValidation.totalCartValue;

  // Security check: verify submitted order amount matches server calculation
  if (orderAmount && Math.abs(actualCartTotal - orderAmount) > 1) {
    // Allow 1 rupee tolerance for rounding
    logSecurityEvent("CART_TOTAL_MISMATCH", {
      userId: req.user?._id,
      submittedTotal: orderAmount,
      actualTotal: actualCartTotal,
      clientIP,
    });
    // Soft-fail: proceed using server total for robustness
  }

  // Find gift by coupon code
  const gift = await WelcomeGift.findOne({
    couponCode: sanitizeString(couponCode).toUpperCase(),
    isActive: true,
  });

  if (!gift) {
    logSecurityEvent("INVALID_COUPON_ATTEMPT", {
      couponCode: sanitizeString(couponCode),
      userId: req.user?._id,
      clientIP,
    });
    return res
      .status(404)
      .json({ success: false, message: "Invalid welcome gift coupon code" });
  }

  // Check if user has claimed this specific gift and if it's unused
  let userReward = await UserReward.findOne({
    userId: req.user._id,
    giftId: gift._id,
    isUsed: false,
  });

  console.log("ValidateWelcomeGiftCoupon: Initial userReward lookup result:", {
    userReward: !!userReward,
    userId: req.user._id,
    giftId: gift._id,
    hasAnonymousId: !!bodyAnonymousId,
  });

  // The primary migration path is now handled by AuthContext upon login.
  // This function should only validate for an already authenticated and migrated user.
  // The inline migration fallback has been removed to simplify the logic.

  if (!userReward) {
    console.log(
      "ValidateWelcomeGiftCoupon: No userReward found for authenticated user",
      {
        userId: req.user?._id,
        giftId: gift._id,
      }
    );

    logSecurityEvent("UNCLAIMED_GIFT_USAGE_ATTEMPT", {
      giftId: gift._id,
      userId: req.user?._id,
      clientIP,
    });
    // Inline migration fallback: attach anonymous reward for this user if present
    if (bodyAnonymousId) {
      const anonymousReward = await UserReward.findOne({
        anonymousId: bodyAnonymousId,
        isUsed: false,
      });
      if (anonymousReward) {
        anonymousReward.userId = req.user._id;
        anonymousReward.anonymousId = null;
        await anonymousReward.save();
        userReward = anonymousReward;
        const User = require("../models/userModel");
        await User.findByIdAndUpdate(req.user._id, {
          rewardClaimed: true,
          reward: anonymousReward.giftId,
        });
        logSecurityEvent("INLINE_GIFT_MIGRATION_SUCCESS", {
          userId: req.user._id,
          giftId: anonymousReward.giftId,
        });
      }
    }

    if (!userReward) {
      return res.status(400).json({
        success: false,
        message:
          "You have not claimed this welcome gift. Please claim a gift first.",
        code: "UNCLAIMED_REWARD",
        debug: {
          hasAnonymousId: !!bodyAnonymousId,
          userId: req.user?._id,
          giftId: gift._id,
        },
      });
    }
  }

  if (userReward.isUsed) {
    logSecurityEvent("USED_GIFT_REUSE_ATTEMPT", {
      giftId: gift._id,
      userId: req.user?._id,
      clientIP,
    });
    return res
      .status(400)
      .json({
        success: false,
        message:
          "This welcome gift has already been redeemed. Cannot use it again.",
      });
  }

  // Server-side discount calculation using validated data
  const validationResult = gift.canBeApplied(
    actualCartTotal,
    validatedCartItems
  );
  if (!validationResult.canApply) {
    return res
      .status(400)
      .json({ success: false, message: validationResult.reason });
  }

  // Calculate shipping discount for free shipping offers
  let shippingDiscount = 0;
  if (gift.rewardType === "free_shipping") {
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
    clientIP,
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
      minOrderAmount: gift.minOrderAmount,
    },
    discountAmount: totalDiscount,
    reason: validationResult.reason,
    finalAmount: finalAmount,
    shippingDiscount: shippingDiscount,
    productDiscount: validationResult.discount,
    canApply: true,
    serverValidated: true, // Flag to indicate server-side validation
  };

  return res.status(200).json({
    success: true,
    data: responseData,
    message: "Welcome gift coupon validated successfully",
  });
});

// @desc Migrate anonymous welcome gift to authenticated user
// @route POST /api/welcome-gifts/migrate-anonymous
// @access Private
const migrateAnonymousGift = asyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User must be logged in to migrate gifts",
      });
    }

    const { anonymousId } = req.body;
    const clientIP = req.ip || req.connection?.remoteAddress || "unknown";

    if (!anonymousId) {
      logSecurityEvent("MISSING_ANONYMOUS_ID", {
        userId: req.user._id,
        clientIP,
      });
      return res.status(400).json({
        success: false,
        message: "Anonymous ID is required",
      });
    }

    // Validate anonymous ID with detailed logging
    const isValidAnonymousId = validateAnonymousId(anonymousId);
    console.log("Migration - Anonymous ID validation:", {
      anonymousId,
      isValidAnonymousId,
      anonymousIdLength: anonymousId?.length,
      anonymousIdParts: anonymousId?.split("-")?.length,
    });

    if (!isValidAnonymousId) {
      logSecurityEvent("INVALID_MIGRATION_ATTEMPT", {
        userId: req.user._id,
        anonymousId,
        clientIP,
      });
      return res.status(400).json({
        success: false,
        message: "Invalid anonymous ID. Please refresh and try again.",
      });
    }

    const result = await executeWithOptionalTransaction(async (session) => {
      // First, let's check what rewards exist for this user and anonymousId
      const existingUserReward = session
        ? await UserReward.findOne({ userId: req.user._id }).session(session)
        : await UserReward.findOne({ userId: req.user._id });

      const anonymousRewards = session
        ? await UserReward.find({ anonymousId }).session(session)
        : await UserReward.find({ anonymousId });

      const unusedAnonymousRewards = session
        ? await UserReward.find({ anonymousId, isUsed: false }).session(session)
        : await UserReward.find({ anonymousId, isUsed: false });

      console.log("Migration Debug:", {
        userId: req.user._id,
        anonymousId,
        anonymousIdLength: anonymousId?.length,
        anonymousIdParts: anonymousId?.split("-")?.length,
        existingUserReward: !!existingUserReward,
        anonymousRewardsCount: anonymousRewards.length,
        unusedAnonymousRewardsCount: unusedAnonymousRewards.length,
        anonymousRewards: anonymousRewards.map((r) => ({
          id: r._id,
          isUsed: r.isUsed,
          giftId: r.giftId,
          rewardTitle: r.rewardTitle,
          storedAnonymousId: r.anonymousId,
          storedAnonymousIdLength: r.anonymousId?.length,
        })),
      });

      // Check if migration is possible with atomic operations
      const canMigrate = session
        ? await UserReward.canMigrateAnonymousGift(
            anonymousId,
            req.user._id,
            session
          )
        : await UserReward.canMigrateAnonymousGift(anonymousId, req.user._id);

      if (!canMigrate) {
        if (existingUserReward) {
          console.log("Migration not needed: User already has a reward", {
            userId: req.user._id,
            existingRewardId: existingUserReward._id,
          });
        } else {
          console.log(
            "Migration not possible: No anonymous gift found for migration",
            {
              userId: req.user._id,
              anonymousId,
              anonymousRewardsFound: anonymousRewards.length,
              unusedRewardsFound: unusedAnonymousRewards.length,
            }
          );
        }

        return {
          success: true,
          data: {
            message:
              "No migration needed - user already has a gift or no anonymous gift found",
            migrated: false,
            userHasReward: !!existingUserReward,
          },
        };
      }

      // Perform atomic migration
      const migratedGift = session
        ? await UserReward.migrateAnonymousGift(
            anonymousId,
            req.user._id,
            session
          )
        : await UserReward.migrateAnonymousGift(anonymousId, req.user._id);

      if (migratedGift) {
        // Update user's rewardClaimed status atomically and get the updated document
        const User = require("../models/userModel");
        const updateOptions = session ? { session, new: true } : { new: true };
        const updatedUser = await User.findByIdAndUpdate(
          req.user._id,
          {
            rewardClaimed: true,
            reward: migratedGift.giftId,
          },
          updateOptions
        ).select("-password");

        logSecurityEvent("GIFT_MIGRATED_SUCCESS", {
          userId: req.user._id,
          anonymousId,
          giftId: migratedGift.giftId,
          clientIP,
        });

        return {
          success: true,
          data: {
            message: "Anonymous welcome gift migrated successfully",
            migrated: true,
            user: updatedUser, // Return the updated user object
          },
        };
      } else {
        throw new Error("Migration failed or user already has a gift");
      }
    });

    res.status(200).json({
      success: result.success,
      data: result.data,
      message: result.data.message || "Migration handled",
    });
  } catch (error) {
    logSecurityEvent("MIGRATION_ERROR", {
      error: error.message,
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
      userId: req.user?._id,
      clientIP: req.ip,
    });
    // Re-throw the error to be caught by the global error handler
    throw error;
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
    message: "Anonymous ID generated successfully",
  });
});

// Apply rate limiting to claim endpoint
const applyGiftClaimLimiter = (req, res, next) => {
  if (req.path.includes("/claim")) {
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
  } catch (error) {
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
  checkRewardStatus,
};
