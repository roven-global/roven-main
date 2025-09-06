const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
  getLifetimeSavings,
  getOrderQuote,
} = require("../controller/orderController");

// Create new order
router.post("/create", auth, createOrder);

// Get user's orders
router.get("/user", auth, getUserOrders);

// Get user's lifetime savings
router.get("/lifetime-savings", auth, getLifetimeSavings);

// Get order quote
router.post("/quote", auth, getOrderQuote);

// Admin routes (requires auth + admin) - must come before /:id routes
router.get("/all", auth, adminOnly, getAllOrders);

// Get order by ID (requires auth)
router.get("/:id", auth, getOrderById);

// Cancel order
router.put("/:id/cancel", auth, cancelOrder);

/**
 * Admin Routes - Require authentication and admin privileges
 */

// Get all orders
router.get("/all", auth, adminOnly, getAllOrders);

// Update order status
router.put("/:id/status", auth, adminOnly, updateOrderStatus);

module.exports = router;
