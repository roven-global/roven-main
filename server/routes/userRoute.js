const express = require("express");
const {
  registerUser,
  verifyEmail,
  login,
  logout,
  uploadAvatar,
  updateUserDetails,
  forgotPassword,
  verifyForgotPasswordOtp,
  resetPassword,
  refreshToken,
  getUserDetails,
  getUserProfileStats,
  toggleWishlist,
  getWishlist,
  claimReward,
  useReward,
  getUserReward,
} = require("../controller/userController");
const auth = require("../middleware/auth");
const upload = require("../middleware/multer");
const { adminOnly } = require("../middleware/adminOnly");
const router = express.Router();

// User registration
router.route("/register").post(registerUser);

// Email verification
router.route("/verify-email").post(verifyEmail);

// User login
router.route("/login").post(login);

// Forgot password flow
router.route("/forgot-password").post(forgotPassword);
router.route("/verify-forgot-password-otp").post(verifyForgotPasswordOtp);
router.route("/reset-password").post(resetPassword);

// Refresh access token
router.route("/refresh-token").post(refreshToken);

/**
 * Protected Routes - Require authentication
 */

// User logout
router.route("/logout").post(auth, logout);

// Get user details
router.route("/details").get(auth, getUserDetails);

// Update user details
router.route("/update-user").put(auth, updateUserDetails);

// Upload user avatar
router.route("/upload-avatar").put(auth, upload.single("avatar"), uploadAvatar);

// Profile-specific routes (alternative endpoints)
router.route("/profile").get(auth, getUserDetails);
router.route("/profile/update").put(auth, updateUserDetails);
router
  .route("/profile/avatar")
  .put(auth, upload.single("avatar"), uploadAvatar);
router.route("/profile/stats").get(auth, getUserProfileStats);

// Wishlist management
router.route("/wishlist").post(auth, toggleWishlist).get(auth, getWishlist);

// Reward management
router.route("/claim-reward").post(auth, claimReward);
router.route("/use-reward").post(auth, useReward);
router.route("/reward").get(auth, getUserReward);

module.exports = router;
