const express = require("express");
const {
  createReview,
  getReviewsForProduct,
  updateReview,
  deleteReview,
  getAllReviews,
  adminUpdateReview,
  adminDeleteReview,
} = require("../controller/reviewController");
const auth = require("../middleware/auth");
const { adminOnly } = require("../middleware/adminOnly");
const router = express.Router();

/**
 * Admin Routes - Require authentication and admin privileges
 */
// Get all reviews for admin
router.route("/admin/all").get(auth, adminOnly, getAllReviews);

// Admin update/delete specific review
router
  .route("/admin/:reviewId")
  .put(auth, adminOnly, adminUpdateReview)
  .delete(auth, adminOnly, adminDeleteReview);

/**
 * User and Public Routes
 */

// Create a new review
router.route("/").post(auth, createReview);

// Update a review
router.route("/:reviewId").put(auth, updateReview);

// Delete a review
router.route("/:reviewId").delete(auth, deleteReview);

// Get all reviews for a specific product (public)
router.route("/:productSlug").get(getReviewsForProduct);

module.exports = router;
