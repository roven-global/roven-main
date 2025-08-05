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
    // Get token from cookie or Authorization header
    let token = req.cookies?.accessToken;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided. Authorization denied." });
    }
    // Verify token
    const decoded = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);
    // Attach user info to request (optional: fetch from DB for fresh data)
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      return res.status(401).json({ success: false, message: "User not found. Authorization denied." });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token.", error: err.message });
  }
};

module.exports = auth;