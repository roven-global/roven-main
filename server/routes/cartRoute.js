const express = require("express");
const {
  addToCart,
  updateCartItem,
  removeCartItem,
  mergeCart,
  getCart,
} = require("../controller/cartController");
const auth = require("../middleware/auth");
const router = express.Router();

/**
 * Cart Routes
 * Handles shopping cart management for authenticated users
 */

// All routes require authentication
router.use(auth);

// Get user's cart
router.route("/").get(getCart);

// Add item to cart
router.route("/add").post(addToCart);

// Merge guest cart with user cart
router.route("/merge").post(mergeCart);

// Update cart item quantity
router.route("/:cartItemId").put(updateCartItem);

// Remove item from cart
router.route("/:cartItemId").delete(removeCartItem);

module.exports = router;
