// auth.js file
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

/**
 * Express middleware to authenticate requests using JWT access token.
 * Checks for token in cookies or Authorization header.
 * Attaches user info to req.user if valid.
 */
const auth = async (req, res, next) => {
  try {
    console.log('🔐 Auth middleware called');
    console.log('🔐 Cookies:', req.cookies);
    console.log('🔐 Authorization header:', req.headers.authorization);

    // Get token from cookie or Authorization header
    let token = req.cookies?.accessToken;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    console.log('🔐 Token found:', !!token);

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ success: false, message: "No token provided. Authorization denied." });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);
    console.log('🔐 Token decoded:', decoded);

    // Attach user info to request (optional: fetch from DB for fresh data)
    req.user = await User.findById(decoded.id).select("-password");
    console.log('🔐 User found:', !!req.user);
    console.log('🔐 User ID:', req.user?._id);

    if (!req.user) {
      console.log('❌ User not found in database');
      return res.status(401).json({ success: false, message: "User not found. Authorization denied." });
    }

    console.log('✅ Auth successful, calling next()');
    next();
  } catch (err) {
    console.error('❌ Auth error:', err);
    return res.status(401).json({ success: false, message: "Invalid or expired token.", error: err.message });
  }
};

module.exports = auth;