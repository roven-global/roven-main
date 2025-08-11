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
  const { title, description, icon, color, bgColor, reward, order } = req.body;

  // Check if order already exists
  const existingGift = await WelcomeGift.findOne({ order });
  if (existingGift) {
    res.status(400);
    throw new Error(`Gift with order ${order} already exists`);
  }

  const gift = await WelcomeGift.create({
    title,
    description,
    icon,
    color,
    bgColor,
    reward,
    order
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
  const { title, description, icon, color, bgColor, reward, order, isActive } = req.body;

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

  const updatedGift = await WelcomeGift.findByIdAndUpdate(
    req.params.id,
    {
      title,
      description,
      icon,
      color,
      bgColor,
      reward,
      order,
      isActive
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

// @desc    Claim welcome gift (enhanced logic)
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
  }

  await UserReward.create(userRewardData);

  res.status(200).json({
    success: true,
    data: {
      gift,
      claimed: true,
      anonymousId
    },
    message: "Welcome gift claimed successfully"
  });
});

// @desc    Check if user should see welcome gift popup
// @route   GET /api/welcome-gifts/check-eligibility
// @access  Public
const checkWelcomeGiftEligibility = asyncHandler(async (req, res) => {
  const { anonymousId } = req.query;

  let shouldShowPopup = true;
  let reason = "First time visitor";

  // If user is logged in, check their reward usage
  if (req.user) {
    const hasUsedReward = await UserReward.hasUserUsedAnyReward(req.user._id);
    if (hasUsedReward) {
      shouldShowPopup = false;
      reason = "User has already used a reward";
    }
  }
  // If anonymous user, check if they've claimed any reward
  else if (anonymousId) {
    const hasClaimed = await UserReward.findOne({ anonymousId });
    if (hasClaimed) {
      shouldShowPopup = false;
      reason = "Anonymous user has already claimed a reward";
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

  await userReward.markAsUsed();

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
  if (!req.user) {
    res.status(401);
    throw new Error("User must be logged in");
  }

  const userRewards = await UserReward.find({ userId: req.user._id })
    .populate('giftId', 'title description icon color bgColor')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: userRewards,
    message: "User rewards retrieved successfully"
  });
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
  getUserRewards
};
