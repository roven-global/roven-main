const express = require("express");
const {
  createReview,
  getReviewsForProduct,
  updateReview,
  deleteReview,
} = require("../controller/reviewController");
const auth = require("../middleware/auth");
const router = express.Router();

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private
router.route("/").post(auth, createReview);

// @route   PUT /api/reviews/:reviewId
// @desc    Update a review
// @access  Private
router.route("/:reviewId").put(auth, updateReview);

// @route   DELETE /api/reviews/:reviewId
// @desc    Delete a review
// @access  Private
router.route("/:reviewId").delete(auth, deleteReview);

// @route   GET /api/reviews/:productSlug
// @desc    Get all reviews for a specific product
// @access  Public
router.route("/:productSlug").get(getReviewsForProduct);

module.exports = router;
