const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  saveAddress,
  getUserAddresses,
  getDefaultAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controller/addressController");

/**
 * Address Routes
 * Handles user address management for authenticated users
 */

// All routes require authentication
router.use(auth);

// Save new address
router.post("/save", saveAddress);

// Get user's addresses
router.get("/user", getUserAddresses);

// Get user's default address
router.get("/default", getDefaultAddress);

// Set default address
router.put("/:id/default", setDefaultAddress);

// Update address
router.put("/:id", updateAddress);

// Delete address
router.delete("/:id", deleteAddress);

module.exports = router;
