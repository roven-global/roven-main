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

// Create new order (requires auth)
router.post("/create", auth, createOrder);

// Get user orders (requires auth)
router.get("/user", auth, getUserOrders);

// Get lifetime savings (requires auth)
router.get("/lifetime-savings", auth, getLifetimeSavings);

// Get server-authoritative order quote (requires auth)
router.post("/quote", auth, getOrderQuote);

// Admin routes (requires auth + admin) - must come before /:id routes
router.get("/all", auth, adminOnly, getAllOrders);

// Get order by ID (requires auth)
router.get("/:id", auth, getOrderById);

// Cancel order (requires auth)
router.put("/:id/cancel", auth, cancelOrder);

// Update order status (Admin only)
router.put("/:id/status", auth, adminOnly, updateOrderStatus);

module.exports = router;
