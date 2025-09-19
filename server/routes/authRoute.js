const express = require("express");
const passport = require("passport");
const router = express.Router();
const generateAccessToken = require("../utils/generateAccessToken");
const generateRefreshToken = require("../utils/generateRefreshToken");

/**
 * Auth Routes
 * Handles OAuth authentication with Google
 */

/**
 * Cookie configuration for secure token storage
 */
const cookiesOption = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  maxAge: 5 * 60 * 60 * 1000, // 5 hours for access token
};

/**
 * Google OAuth Routes
 */

// Initiate Google OAuth authentication
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google OAuth callback handler
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
  }),
  async (req, res) => {
    // Successful authentication
    const user = req.user;
    const accessToken = await generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);

    const refreshTokenOptions = {
      ...cookiesOption,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for refresh token
    };

    res.cookie("accessToken", accessToken, cookiesOption);
    res.cookie("refreshToken", refreshToken, refreshTokenOptions);

    // Redirect to the frontend
    res.redirect(process.env.FRONTEND_URL);
  }
);

module.exports = router;
