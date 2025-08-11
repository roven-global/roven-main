const express = require("express");
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
  validateWelcomeGiftCoupon
} = require("../controller/welcomeGiftController");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

// Public routes
router.get("/", getAllWelcomeGifts);
router.get("/check-eligibility", checkWelcomeGiftEligibility);
router.post("/:id/claim", claimWelcomeGift);
router.post("/validate-coupon", validateWelcomeGiftCoupon);

// Admin routes - specific routes first, then parameterized routes
router.get("/admin/all", auth, adminOnly, getAllWelcomeGiftsAdmin);
router.get("/admin/analytics", auth, adminOnly, getWelcomeGiftsAnalytics);
router.put("/admin/reorder", auth, adminOnly, reorderWelcomeGifts);
router.post("/admin", auth, adminOnly, createWelcomeGift);
router.patch("/admin/:id/toggle", auth, adminOnly, toggleWelcomeGiftStatus);
router.get("/admin/:id", auth, adminOnly, getWelcomeGiftById);
router.put("/admin/:id", auth, adminOnly, updateWelcomeGift);
router.delete("/admin/:id", auth, adminOnly, deleteWelcomeGift);

// User reward routes
router.get("/user-rewards", auth, getUserRewards);
router.post("/mark-used", auth, markRewardAsUsed);

module.exports = router;
