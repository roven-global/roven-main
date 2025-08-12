const asyncHandler = require("express-async-handler");
const WelcomeGift = require("../models/welcomeGiftModel");
const UserReward = require("../models/userRewardModel");

// @desc    Get all welcome gifts
// @route   GET /api/welcome-gifts
// @access  Public
const getAllWelcomeGifts = asyncHandler(async (req, res) => {
  const gifts = await WelcomeGift.find({ isActive: true }).sort({ order: 1 });

  res.status(200).json({
    success: true,
    data: gifts,
    message: "Welcome gifts retrieved successfully"
  });
});

// @desc    Get all welcome gifts (admin)
// @route   GET /api/admin/welcome-gifts
// @access  Private/Admin
const getAllWelcomeGiftsAdmin = asyncHandler(async (req, res) => {
  const gifts = await WelcomeGift.find().sort({ order: 1 });

  res.status(200).json({
    success: true,
    data: gifts,
    message: "Welcome gifts retrieved successfully"
  });
});

// @desc    Get single welcome gift
// @route   GET /api/admin/welcome-gifts/:id
// @access  Private/Admin
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

// @desc    Create welcome gift
// @route   POST /api/admin/welcome-gifts
// @access  Private/Admin
const createWelcomeGift = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    icon,
    color,
    bgColor,
    reward,
    couponCode,
    order,
    rewardType,
    rewardValue,
    maxDiscount,
    minOrderAmount
  } = req.body;

  // Check if order already exists
  const existingGift = await WelcomeGift.findOne({ order });
  if (existingGift) {
    res.status(400);
    throw new Error(`Gift with order ${order} already exists`);
  }

  // Check if coupon code already exists
  const existingCouponCode = await WelcomeGift.findOne({ couponCode: couponCode.toUpperCase() });
  if (existingCouponCode) {
    res.status(400);
    throw new Error(`Coupon code ${couponCode} already exists`);
  }

  const gift = await WelcomeGift.create({
    title,
    description,
    icon,
    color,
    bgColor,
    reward,
    couponCode: couponCode.toUpperCase(),
    order,
    rewardType: rewardType || 'percentage',
    rewardValue: rewardValue || 10,
    maxDiscount: maxDiscount || null,
    minOrderAmount: minOrderAmount || 0
  });

  res.status(201).json({
    success: true,
    data: gift,
    message: "Welcome gift created successfully"
  });
});

// @desc    Update welcome gift
// @route   PUT /api/admin/welcome-gifts/:id
// @access  Private/Admin
const updateWelcomeGift = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    icon,
    color,
    bgColor,
    reward,
    couponCode,
    order,
    isActive,
    rewardType,
    rewardValue,
    maxDiscount,
    minOrderAmount
  } = req.body;

  const gift = await WelcomeGift.findById(req.params.id);

  if (!gift) {
    res.status(404);
    throw new Error("Welcome gift not found");
  }

  // Check if order is being changed and if it conflicts with another gift
  if (order && order !== gift.order) {
    const existingGift = await WelcomeGift.findOne({ order, _id: { $ne: req.params.id } });
    if (existingGift) {
      res.status(400);
      throw new Error(`Gift with order ${order} already exists`);
    }
  }

  // Check if coupon code is being changed and if it conflicts with another gift
  if (couponCode && couponCode.toUpperCase() !== gift.couponCode) {
    const existingCouponCode = await WelcomeGift.findOne({
      couponCode: couponCode.toUpperCase(),
      _id: { $ne: req.params.id }
    });
    if (existingCouponCode) {
      res.status(400);
      throw new Error(`Coupon code ${couponCode} already exists`);
    }
  }

  const updatedGift = await WelcomeGift.findByIdAndUpdate(
    req.params.id,
    {
      title,
      description,
      icon,
      color,
      bgColor,
      reward,
      couponCode: couponCode ? couponCode.toUpperCase() : gift.couponCode,
      order,
      isActive,
      rewardType: rewardType || gift.rewardType,
      rewardValue: rewardValue !== undefined ? rewardValue : gift.rewardValue,
      maxDiscount: maxDiscount !== undefined ? maxDiscount : gift.maxDiscount,
      minOrderAmount: minOrderAmount !== undefined ? minOrderAmount : gift.minOrderAmount
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: updatedGift,
    message: "Welcome gift updated successfully"
  });
});

// @desc    Delete welcome gift
// @route   DELETE /api/admin/welcome-gifts/:id
// @access  Private/Admin
const deleteWelcomeGift = asyncHandler(async (req, res) => {
  const gift = await WelcomeGift.findById(req.params.id);

  if (!gift) {
    res.status(404);
    throw new Error("Welcome gift not found");
  }

  await WelcomeGift.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Welcome gift deleted successfully"
  });
});

// @desc    Toggle welcome gift status
// @route   PATCH /api/admin/welcome-gifts/:id/toggle
// @access  Private/Admin
const toggleWelcomeGiftStatus = asyncHandler(async (req, res) => {
  const gift = await WelcomeGift.findById(req.params.id);

  if (!gift) {
    res.status(404);
    throw new Error("Welcome gift not found");
  }

  gift.isActive = !gift.isActive;
  await gift.save();

  res.status(200).json({
    success: true,
    data: gift,
    message: `Welcome gift ${gift.isActive ? 'activated' : 'deactivated'} successfully`
  });
});

// @desc    Reorder welcome gifts
// @route   PUT /api/admin/welcome-gifts/reorder
// @access  Private/Admin
const reorderWelcomeGifts = asyncHandler(async (req, res) => {
  const { orders } = req.body; // Array of { id, order }

  if (!Array.isArray(orders)) {
    res.status(400);
    throw new Error("Orders must be an array");
  }

  // Update each gift's order
  for (const { id, order } of orders) {
    await WelcomeGift.findByIdAndUpdate(id, { order });
  }

  const updatedGifts = await WelcomeGift.find().sort({ order: 1 });

  res.status(200).json({
    success: true,
    data: updatedGifts,
    message: "Welcome gifts reordered successfully"
  });
});

// @desc    Get welcome gifts analytics
// @route   GET /api/admin/welcome-gifts/analytics
// @access  Private/Admin
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

// @desc    Claim welcome gift
// @route   POST /api/welcome-gifts/:id/claim
// @access  Public
const claimWelcomeGift = asyncHandler(async (req, res) => {
  const { anonymousId } = req.body;
  const gift = await WelcomeGift.findById(req.params.id);

  if (!gift) {
    res.status(404);
    throw new Error("Welcome gift not found");
  }

  if (!gift.isActive) {
    res.status(400);
    throw new Error("This welcome gift is not active");
  }

  // Check if user has already claimed any welcome gift
  if (req.user) {
    // For authenticated users, check if they've already claimed any gift
    const canClaim = await UserReward.canUserClaimGift(req.user._id);
    if (!canClaim) {
      res.status(400);
      throw new Error("You have already claimed a welcome gift. Only one gift per user is allowed.");
    }
  } else if (anonymousId) {
    // For anonymous users, check if they've already claimed any gift
    const hasClaimed = await UserReward.hasAnonymousUserClaimed(anonymousId);
    if (hasClaimed) {
      res.status(400);
      throw new Error("You have already claimed a welcome gift. Only one gift per user is allowed.");
    }
  }

  // Increment gift usage count
  await gift.incrementUsage();

  // Create user reward record
  const userRewardData = {
    giftId: gift._id,
    rewardTitle: gift.title,
    rewardText: gift.reward,
    wasLoggedIn: !!req.user,
    anonymousId: anonymousId || null
  };

  if (req.user) {
    userRewardData.userId = req.user._id;

    // Update user's rewardClaimed status
    const User = require("../models/userModel");
    await User.findByIdAndUpdate(req.user._id, {
      rewardClaimed: true,
      reward: gift._id
    });
  }

  await UserReward.create(userRewardData);

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
});

// @route   GET /api/welcome-gifts/check-eligibility
// @desc    Check if user should see welcome gift popup
// @access  Public
const checkWelcomeGiftEligibility = asyncHandler(async (req, res) => {
  const { anonymousId } = req.query;

  let shouldShowPopup = true;
  let reason = "First time visitor";

  // If user is logged in, check their reward usage
  if (req.user) {
    const canClaim = await UserReward.canUserClaimGift(req.user._id);
    if (!canClaim) {
      shouldShowPopup = false;
      reason = "User has already claimed a welcome gift";
    }
  }
  // If anonymous user, check if they've claimed any reward
  else if (anonymousId) {
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
      anonymousId
    },
    message: "Eligibility check completed"
  });
});

// @desc    Mark reward as used (when user places order or uses coupon)
// @route   POST /api/welcome-gifts/mark-used
// @access  Private
const markRewardAsUsed = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error("User must be logged in to mark reward as used");
  }

  const userReward = await UserReward.findOne({
    userId: req.user._id,
    isUsed: false
  });

  if (!userReward) {
    res.status(404);
    throw new Error("No unused reward found for this user");
  }

  if (userReward.isUsed) {
    res.status(400);
    throw new Error("Welcome gift already used");
  }

  await userReward.markAsUsed();

  // Track gift usage
  const gift = await WelcomeGift.findById(userReward.giftId);
  if (gift) {
    await gift.incrementUsage();
  }

  res.status(200).json({
    success: true,
    data: userReward,
    message: "Reward marked as used successfully"
  });
});

// @desc    Get user's claimed rewards
// @route   GET /api/welcome-gifts/user-rewards
// @access  Private
const getUserRewards = asyncHandler(async (req, res) => {
  console.log('\n=== getUserRewards API Called ===');
  console.log('Request headers:', req.headers);
  console.log('Request user:', req.user);
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);

  if (!req.user) {
    console.log('❌ No user in request - authentication failed');
    res.status(401);
    throw new Error("User must be logged in");
  }

  console.log('✅ User authenticated:', req.user._id);
  console.log('getUserRewards: Fetching rewards for user:', req.user._id);

  const userRewards = await UserReward.find({ userId: req.user._id })
    .populate('giftId', 'title description icon color bgColor rewardType rewardValue couponCode')
    .sort({ createdAt: -1 });

  console.log('getUserRewards: Found rewards:', userRewards.length);
  console.log('getUserRewards: Raw userRewards:', JSON.stringify(userRewards, null, 2));

  userRewards.forEach((reward, index) => {
    console.log(`Reward ${index + 1}:`, {
      id: reward._id,
      giftId: reward.giftId,
      rewardTitle: reward.rewardTitle,
      isUsed: reward.isUsed,
      wasLoggedIn: reward.wasLoggedIn
    });
  });

  res.status(200).json({
    success: true,
    data: userRewards,
    message: "User rewards retrieved successfully"
  });
});

// @desc    Validate welcome gift coupon code
// @route   POST /api/welcome-gifts/validate-coupon
// @access  Private
const validateWelcomeGiftCoupon = asyncHandler(async (req, res) => {
  try {
    console.log('\n=== validateWelcomeGiftCoupon API Called ===');
    console.log('Request body:', req.body);
    console.log('Request user:', req.user);
    console.log('Request headers:', req.headers);
    console.log('Request cookies:', req.cookies);

    const { couponCode, orderAmount, cartItems } = req.body;

    if (!couponCode) {
      console.log('❌ No coupon code provided');
      res.status(400);
      throw new Error("Coupon code is required");
    }

    if (!orderAmount || orderAmount <= 0) {
      console.log('❌ Invalid order amount:', orderAmount);
      res.status(400);
      throw new Error("Valid order amount is required");
    }

    console.log('✅ Input validation passed');

    // Find the welcome gift by coupon code
    console.log('🔍 Searching for gift with coupon code:', couponCode.toUpperCase());
    const gift = await WelcomeGift.findOne({
      couponCode: couponCode.toUpperCase(),
      isActive: true
    });

    if (!gift) {
      console.log('❌ Gift not found for coupon code:', couponCode.toUpperCase());
      res.status(404);
      throw new Error("Invalid welcome gift coupon code");
    }

    console.log('✅ Gift found:', {
      _id: gift._id,
      title: gift.title,
      couponCode: gift.couponCode,
      rewardType: gift.rewardType
    });

    // Check if user has claimed this specific gift and if it's unused
    let userReward = null;
    if (req.user) {
      console.log('✅ User is logged in:', req.user._id);
      console.log('🔍 Looking for user reward for gift:', gift._id);

      // First, check if user has claimed this specific gift
      userReward = await UserReward.findOne({
        userId: req.user._id,
        giftId: gift._id
      });

      console.log('🔍 User reward found:', userReward ? 'YES' : 'NO');

      if (!userReward) {
        // Check if user might have an anonymous gift that needs migration
        const anonymousId = req.body.anonymousId;
        if (anonymousId) {
          console.log('🔍 Checking for anonymous gift with ID:', anonymousId);
          const anonymousGift = await UserReward.findOne({ anonymousId, giftId: gift._id });
          if (anonymousGift) {
            console.log('❌ Found anonymous gift, suggesting migration');
            res.status(400);
            throw new Error("You have an anonymous welcome gift. Please refresh the page or try again to migrate it to your account.");
          }
        }

        console.log('❌ User has not claimed this gift');
        res.status(400);
        throw new Error("You have not claimed this welcome gift. Please claim a gift first.");
      }

      if (userReward.isUsed) {
        console.log('❌ Gift is already used');
        res.status(400);
        throw new Error("This welcome gift has already been redeemed. Cannot use it again.");
      }

      console.log('✅ Gift validation successful');
    } else {
      console.log('❌ No user in request');
      res.status(401);
      throw new Error("Please log in to use welcome gift coupons");
    }

    // Use the enhanced calculation method from the model
    console.log('🔍 Calling gift.canBeApplied with:', { orderAmount, cartItems });
    const validationResult = gift.canBeApplied(orderAmount, cartItems);
    console.log('✅ Validation result:', validationResult);

    if (!validationResult.canApply) {
      console.log('❌ Gift cannot be applied:', validationResult.reason);
      res.status(400);
      throw new Error(validationResult.reason);
    }

    // For free shipping, we need to calculate the shipping cost
    let shippingDiscount = 0;
    if (gift.rewardType === 'free_shipping') {
      const shippingCost = orderAmount < 1000 ? 49 : 0;
      shippingDiscount = shippingCost;
      console.log('🚚 Free shipping discount calculated:', shippingDiscount);
    }

    // Calculate final discount (including shipping for free shipping type)
    const totalDiscount = validationResult.discount + shippingDiscount;
    const finalAmount = orderAmount - totalDiscount;

    console.log('💰 Final calculations:', {
      totalDiscount,
      finalAmount,
      shippingDiscount,
      productDiscount: validationResult.discount
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
      canApply: true
    };

    console.log('✅ Sending successful response');
    res.status(200).json({
      success: true,
      data: responseData,
      message: "Welcome gift coupon validated successfully"
    });

  } catch (error) {
    console.error('❌ Error in validateWelcomeGiftCoupon:', error);
    console.error('❌ Error stack:', error.stack);

    // If error already has a status, don't override it
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }

    throw error;
  }
});

// @desc    Migrate anonymous welcome gift to authenticated user
// @route   POST /api/welcome-gifts/migrate-anonymous
// @access  Private
const migrateAnonymousGift = asyncHandler(async (req, res) => {
  try {
    console.log('\n=== migrateAnonymousGift API Called ===');
    console.log('Request body:', req.body);
    console.log('Request user:', req.user);

    if (!req.user) {
      console.log('❌ No user in request');
      res.status(401);
      throw new Error("User must be logged in to migrate gifts");
    }

    const { anonymousId } = req.body;

    if (!anonymousId) {
      console.log('❌ No anonymousId provided');
      res.status(400);
      throw new Error("Anonymous ID is required");
    }

    console.log('✅ Input validation passed');
    console.log('🔍 Checking if migration is possible for:', { anonymousId, userId: req.user._id });

    // Check if migration is possible
    const canMigrate = await UserReward.canMigrateAnonymousGift(anonymousId, req.user._id);
    console.log('🔍 Migration check result:', canMigrate);

    if (!canMigrate) {
      console.log('ℹ️ Migration not possible - user may already have a gift or no anonymous gift found');
      console.log('ℹ️ This is normal, returning success to prevent frontend errors');

      // Return success instead of error - this is a normal case
      res.status(200).json({
        success: true,
        data: {
          message: "No migration needed - user already has a gift or no anonymous gift found",
          migrated: false
        },
        message: "Migration check completed successfully"
      });
      return;
    }

    console.log('✅ Migration check passed, performing migration');

    // Perform the migration
    const migratedGift = await UserReward.migrateAnonymousGift(anonymousId, req.user._id);
    console.log('🔍 Migration result:', migratedGift);

    if (migratedGift) {
      console.log('✅ Migration successful, updating user status');

      // Update user's rewardClaimed status
      const User = require("../models/userModel");
      await User.findByIdAndUpdate(req.user._id, {
        rewardClaimed: true,
        reward: migratedGift.giftId
      });

      console.log('✅ User status updated successfully');

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
      console.log('❌ Migration returned null/undefined');
      res.status(400);
      throw new Error("Migration failed or user already has a gift");
    }

  } catch (error) {
    console.error('❌ Error in migrateAnonymousGift:', error);
    console.error('❌ Error stack:', error.stack);

    // If error already has a status, don't override it
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }

    throw error;
  }
});

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
  migrateAnonymousGift
};
