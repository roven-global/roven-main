const express = require("express");
const {
  createReview,
  getReviewsForProduct,
} = require("../controller/reviewController");
const auth = require("../middleware/auth");
const router = express.Router();

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private
router.route("/").post(auth, createReview);

// @route   GET /api/reviews/:productId
// @desc    Get all reviews for a specific product
// @access  Public
router.route("/:productId").get(getReviewsForProduct);

module.exports = router;
