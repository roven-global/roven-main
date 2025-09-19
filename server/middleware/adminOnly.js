const auth = require("./auth");

/**
 * Admin Authorization Middleware
 * Ensures only authenticated users with ADMIN role can access protected routes
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "ADMIN") {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Admin access only.",
  });
};

/**
 * Combined middleware that first authenticates, then checks admin role
 */
const isAdmin = [auth, adminOnly];

module.exports = { adminOnly, isAdmin };
