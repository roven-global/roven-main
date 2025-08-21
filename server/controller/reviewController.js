const asyncHandler = require("express-async-handler");
const Review = require("../models/reviewModel");
const Order = require("../models/orderModel");

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, title, comment } = req.body;
  const userId = req.user._id;

  // 1. Check if the product exists and has been purchased by the user
  const hasPurchased = await Order.findOne({
    user: userId,
    "items.product": productId,
    orderStatus: "delivered", // Or whatever status signifies a completed order
  });

  if (!hasPurchased) {
    res.status(403);
    throw new Error("You can only review products you have purchased.");
  }

  // 2. Check if the user has already reviewed this product
  const alreadyReviewed = await Review.findOne({
    product: productId,
    user: userId,
  });

  if (alreadyReviewed) {
    res.status(400);
    throw new Error("You have already submitted a review for this product.");
  }

  // 3. Create and save the new review
  const review = await Review.create({
    product: productId,
    user: userId,
    rating,
    title,
    comment,
  });

  if (review) {
    res.status(201).json({
      success: true,
      message: "Review submitted successfully.",
      data: review,
    });
  } else {
    res.status(400);
    throw new Error("Invalid review data.");
  }
});

// @desc    Get reviews for a product
// @route   GET /api/reviews/:productId
// @access  Public
const getReviewsForProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { page = 1, limit = 5, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const reviews = await Review.find({ product: productId })
    .populate("user", "name avatar") // Populate user's name and avatar
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  const totalReviews = await Review.countDocuments({ product: productId });
  const totalPages = Math.ceil(totalReviews / limitNum);

  res.json({
    success: true,
    message: "Reviews retrieved successfully.",
    data: {
      reviews,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalReviews,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    },
  });
});

module.exports = {
  createReview,
  getReviewsForProduct,
};
