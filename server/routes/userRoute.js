// userRoute.js file
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
} = require("../controller/userController");
const auth = require("../middleware/auth");
const upload = require("../middleware/multer");
const adminOnly = require("../middleware/adminOnly");
const router = express.Router();

// Public routes
router.route("/register").post(registerUser);
router.route("/verify-email").post(verifyEmail);
router.route("/login").post(login);
router.route("/forgot-password").post(forgotPassword);
router.route("/verify-forgot-password-otp").post(verifyForgotPasswordOtp);
router.route("/reset-password").post(resetPassword);
router.route("/refresh-token").post(refreshToken);

// POST /api/user/refresh-token - Get a new access token using a valid refresh token
router.route("/refresh-token").post(refreshToken);

// Protected routes (require authentication)
router.route("/logout").post(auth, logout);
router.route("/details").get(auth, getUserDetails);
router.route("/upload-avatar").put(auth, upload.single("avatar"), uploadAvatar);
router.route("/update-user").put(auth, updateUserDetails);

// Profile-specific routes (for all authenticated users)
router.route("/profile").get(auth, getUserDetails);
router.route("/profile/update").put(auth, updateUserDetails);
router
  .route("/profile/avatar")
  .put(auth, upload.single("avatar"), uploadAvatar);
router.route("/profile/stats").get(auth, getUserProfileStats);

// Wishlist routes
router.route("/wishlist").post(auth, toggleWishlist).get(auth, getWishlist);

module.exports = router;
