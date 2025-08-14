const express = require("express");
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
const router = express.Router();

const {
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
  migrateAnonymousGift,
  applyGiftClaimLimiter
} = require("../controller/welcomeGiftController");

const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

// Helper for user-aware rate limiting
const userAwareKeyGenerator = (req) => {
  // If user is authenticated, use their ID
  if (req.user?._id) return `user-${req.user._id}`;
  // Otherwise use the safe IP generator
  return ipKeyGenerator(req);
};

// Rate limiting for public endpoints
const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, message: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator, // IPv6 safe
});

// Rate limiting for eligibility checks (more restrictive)
const eligibilityLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 eligibility checks per 5 minutes
  message: { success: false, message: "Too many eligibility checks. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator, // IPv6 safe
});

// Rate limiting for coupon validation
const couponValidationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each user to 20 coupon validations per 15 minutes
  message: { success: false, message: "Too many coupon validation attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userAwareKeyGenerator, // User ID or safe IP
});

// Input validation middleware
const validateGiftId = (req, res, next) => {
  const { id } = req.params;
  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: "Invalid gift ID format"
    });
  }
  next();
};

// Sanitize anonymous ID middleware
const sanitizeAnonymousId = (req, res, next) => {
  if (req.body.anonymousId) {
    req.body.anonymousId = typeof req.body.anonymousId === 'string'
      ? req.body.anonymousId.trim()
      : undefined;
  }
  if (req.query.anonymousId) {
    req.query.anonymousId = typeof req.query.anonymousId === 'string'
      ? req.query.anonymousId.trim()
      : undefined;
  }
  next();
};

// Public routes (with rate limiting)
router.get("/", publicApiLimiter, getAllWelcomeGifts);
router.get("/check-eligibility", eligibilityLimiter, sanitizeAnonymousId, checkWelcomeGiftEligibility);

// Gift claiming with additional security
router.post("/:id/claim",
  validateGiftId,
  sanitizeAnonymousId,
  applyGiftClaimLimiter,
  claimWelcomeGift
);

// Protected routes (require authentication)
router.post("/validate-coupon",
  auth,
  couponValidationLimiter,
  validateWelcomeGiftCoupon
);

router.post("/migrate-anonymous",
  auth,
  sanitizeAnonymousId,
  migrateAnonymousGift
);

// User reward routes
router.get("/user-rewards", auth, getUserRewards);
router.post("/mark-used", auth, markRewardAsUsed);

// Admin routes - specific routes first, then parameterized routes
router.get("/admin/all", auth, adminOnly, getAllWelcomeGiftsAdmin);
router.get("/admin/analytics", auth, adminOnly, getWelcomeGiftsAnalytics);
router.put("/admin/reorder", auth, adminOnly, reorderWelcomeGifts);
router.post("/admin", auth, adminOnly, createWelcomeGift);

// Admin routes with ID validation
router.get("/admin/:id", validateGiftId, auth, adminOnly, getWelcomeGiftById);
router.put("/admin/:id", validateGiftId, auth, adminOnly, updateWelcomeGift);
router.delete("/admin/:id", validateGiftId, auth, adminOnly, deleteWelcomeGift);
router.patch("/admin/:id/toggle", validateGiftId, auth, adminOnly, toggleWelcomeGiftStatus);

// Security middleware to prevent route enumeration
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found"
  });
});

module.exports = router;
