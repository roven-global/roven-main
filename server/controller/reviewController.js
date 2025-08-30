const asyncHandler = require("express-async-handler");
const Review = require("../models/reviewModel");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, review } = req.body;
  const userId = req.user._id;

  // 1. Check if the user has already reviewed this product
  const alreadyReviewed = await Review.findOne({
    product: productId,
    user: userId,
  });

  if (alreadyReviewed) {
    res.status(400);
    throw new Error("You have already submitted a review for this product.");
  }

  // 2. Create and save the new review
  const newReview = await Review.create({
    product: productId,
    user: userId,
    rating,
    review,
  });

  if (newReview) {
    res.status(201).json({
      success: true,
      message: "Review submitted successfully.",
      data: newReview,
    });
  } else {
    res.status(400);
    throw new Error("Invalid review data.");
  }
});

// @desc    Get reviews for a product
// @route   GET /api/reviews/:productSlug
// @access  Public
const getReviewsForProduct = asyncHandler(async (req, res) => {
  const { productSlug } = req.params;
  const {
    page = 1,
    limit = 5,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Find the product by slug to get its ID
  const product = await Product.findOne({ slug: productSlug });

  if (!product) {
    res.status(404);
    throw new Error("Product not found.");
  }

  const productId = product._id;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

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

// @desc    Update a review
// @route   PUT /api/reviews/:reviewId
// @access  Private
const updateReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { rating, review } = req.body;
  const userId = req.user._id;

  // Find the review and check if it belongs to the user
  const existingReview = await Review.findById(reviewId);

  if (!existingReview) {
    res.status(404);
    throw new Error("Review not found.");
  }

  if (existingReview.user.toString() !== userId.toString()) {
    res.status(403);
    throw new Error("You can only update your own reviews.");
  }

  // Update the review
  const updatedReview = await Review.findByIdAndUpdate(
    reviewId,
    { rating, review },
    { new: true, runValidators: true }
  );

  if (updatedReview) {
    res.json({
      success: true,
      message: "Review updated successfully.",
      data: updatedReview,
    });
  } else {
    res.status(400);
    throw new Error("Failed to update review.");
  }
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:reviewId
// @access  Private
const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user._id;

  // Find the review and check if it belongs to the user
  const existingReview = await Review.findById(reviewId);

  if (!existingReview) {
    res.status(404);
    throw new Error("Review not found.");
  }

  if (existingReview.user.toString() !== userId.toString()) {
    res.status(403);
    throw new Error("You can only delete your own reviews.");
  }

  // Delete the review
  await Review.findByIdAndDelete(reviewId);

  res.json({
    success: true,
    message: "Review deleted successfully.",
  });
});

// @desc    Get all reviews (admin)
// @route   GET /api/reviews/admin/all
// @access  Private/Admin
const getAllReviews = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    search = "",
  } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  let query = {};
  if (search) {
    query = { review: { $regex: search, $options: "i" } };
  }

  const reviews = await Review.find(query)
    .populate("user", "name email")
    .populate("product", "name")
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  const totalReviews = await Review.countDocuments(query);
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

// @desc    Update a review (admin)
// @route   PUT /api/reviews/admin/:reviewId
// @access  Private/Admin
const adminUpdateReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { rating, review } = req.body;

  const existingReview = await Review.findById(reviewId);

  if (!existingReview) {
    res.status(404);
    throw new Error("Review not found.");
  }

  const updatedReview = await Review.findByIdAndUpdate(
    reviewId,
    { rating, review },
    { new: true, runValidators: true }
  );

  if (updatedReview) {
    res.json({
      success: true,
      message: "Review updated successfully by admin.",
      data: updatedReview,
    });
  } else {
    res.status(400);
    throw new Error("Failed to update review.");
  }
});

// @desc    Delete a review (admin)
// @route   DELETE /api/reviews/admin/:reviewId
// @access  Private/Admin
const adminDeleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);

  if (!review) {
    res.status(404);
    throw new Error("Review not found.");
  }

  await Review.findByIdAndDelete(reviewId);

  res.json({
    success: true,
    message: "Review deleted successfully by admin.",
  });
});

module.exports = {
  createReview,
  getReviewsForProduct,
  updateReview,
  deleteReview,
  getAllReviews,
  adminUpdateReview,
  adminDeleteReview,
};
