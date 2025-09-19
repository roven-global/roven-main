const express = require("express");
const {
  getOverviewStats,
  getCustomers,
} = require("../controller/adminController");
const auth = require("../middleware/auth");
const { adminOnly } = require("../middleware/adminOnly");

const router = express.Router();

// Get admin dashboard overview statistics
router.route("/overview").get(auth, adminOnly, getOverviewStats);

// Get customer list with pagination and filtering
router.route("/customers").get(auth, adminOnly, getCustomers);

module.exports = router;
