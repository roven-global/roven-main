const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

/**
 * Coupon Routes
 * Handles coupon validation, management, and admin operations
 */
const {
  getCouponAnalytics,
  validateCoupon,
  getActiveCoupons,
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  getCouponUsage,
  removeCoupon,
} = require("../controller/couponController");

/**
 * Public Routes - No authentication required
 */

// Validate coupon code
router.post("/validate", validateCoupon);

// Get all active coupons
router.get("/active", getActiveCoupons);

// Remove coupon from cart
router.post("/remove", removeCoupon);

/**
 * Admin Routes - Require authentication and admin privileges
 */
router.use(auth);
router.use(adminOnly);

// Get all coupons
router.get("/all", getAllCoupons);

// Get coupon by ID
router.get("/:id", getCouponById);

// Create new coupon
router.post("/create", createCoupon);

// Update coupon
router.put("/:id", updateCoupon);

// Delete coupon
router.delete("/:id", deleteCoupon);

// Toggle coupon status
router.patch("/:id/toggle", toggleCouponStatus);

// Get coupon usage statistics
router.get("/:id/usage", getCouponUsage);

// Get coupon analytics summary
router.get("/analytics/summary", getCouponAnalytics);

module.exports = router;
