const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const {
    validateCoupon,
    getAllCoupons,
    getCouponById,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    toggleCouponStatus,
    getCouponUsage,
} = require("../controller/couponController");

// Public route - validate coupon (no auth required)
router.post("/validate", validateCoupon);

// Admin routes - require authentication and admin privileges
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

module.exports = router;
