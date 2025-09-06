const express = require("express");
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
const router = express.Router();

/**
 * Welcome Gift Routes
 * Handles welcome gift management, claiming, and admin operations
 */

const {
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
  getAnonymousId,
  checkRewardStatus,
} = require("../controller/welcomeGiftController");

const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

/**
 * Custom key generator for rate limiting that uses user ID when available
 */
const userAwareKeyGenerator = (req) => {
  if (req.user?._id) return `user-${req.user._id}`;
  return ipKeyGenerator(req);
};

/**
 * Rate limiting configurations for different endpoint types
 */

const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator, // IPv6 safe
});

// Rate limiting for eligibility checks (more restrictive)
const eligibilityLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 eligibility checks per 5 minutes
  message: {
    success: false,
    message: "Too many eligibility checks. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator, // IPv6 safe
});

// Rate limiting for coupon validation
const couponValidationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each user to 20 coupon validations per 15 minutes
  message: {
    success: false,
    message: "Too many coupon validation attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userAwareKeyGenerator, // User ID or safe IP
});

/**
 * Middleware functions for input validation and sanitization
 */

// Input validation middleware
const validateGiftId = (req, res, next) => {
  const { id } = req.params;
  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: "Invalid gift ID format",
    });
  }
  next();
};

// Sanitize anonymous ID middleware
const sanitizeAnonymousId = (req, res, next) => {
  if (req.body.anonymousId) {
    req.body.anonymousId =
      typeof req.body.anonymousId === "string"
        ? req.body.anonymousId.trim()
        : undefined;
  }
  if (req.query.anonymousId) {
    req.query.anonymousId =
      typeof req.query.anonymousId === "string"
        ? req.query.anonymousId.trim()
        : undefined;
  }
  next();
};

/**
 * Public Routes - No authentication required
 */

// Get all active welcome gifts
router.get("/", publicApiLimiter, getAllWelcomeGifts);

// Get anonymous ID for guest users
router.get("/anonymous-id", publicApiLimiter, getAnonymousId);

// Check welcome gift eligibility
router.get(
  "/check-eligibility",
  eligibilityLimiter,
  sanitizeAnonymousId,
  checkWelcomeGiftEligibility
);

/**
 * Authenticated Routes - Require user authentication
 */

// Claim a welcome gift
router.post(
  "/:id/claim",
  validateGiftId,
  sanitizeAnonymousId,
  applyGiftClaimLimiter,
  claimWelcomeGift
);

// Validate welcome gift coupon
router.post(
  "/validate-coupon",
  auth,
  couponValidationLimiter,
  validateWelcomeGiftCoupon
);

// Migrate anonymous gift to authenticated user
router.post(
  "/migrate-anonymous",
  auth,
  sanitizeAnonymousId,
  migrateAnonymousGift
);

// Check user's reward status
router.get("/status", auth, checkRewardStatus);

// Get user's claimed rewards
router.get("/user-rewards", auth, getUserRewards);

// Mark reward as used
router.post("/mark-used", auth, markRewardAsUsed);

/**
 * Admin Routes - Require authentication and admin privileges
 */

// Get all welcome gifts for admin
router.get("/admin/all", auth, adminOnly, getAllWelcomeGiftsAdmin);

// Get welcome gift analytics
router.get("/admin/analytics", auth, adminOnly, getWelcomeGiftsAnalytics);

// Create new welcome gift
router.post("/admin", auth, adminOnly, createWelcomeGift);

// Admin routes with ID validation
router.get("/admin/:id", validateGiftId, auth, adminOnly, getWelcomeGiftById);
router.put("/admin/:id", validateGiftId, auth, adminOnly, updateWelcomeGift);
router.delete("/admin/:id", validateGiftId, auth, adminOnly, deleteWelcomeGift);
router.patch(
  "/admin/:id/toggle",
  validateGiftId,
  auth,
  adminOnly,
  toggleWelcomeGiftStatus
);

/**
 * Security middleware to prevent route enumeration
 */
router.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

module.exports = router;
