const express = require("express");
const { getOverviewStats, getCustomers } = require("../controller/adminController");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

// Admin-only routes
router.route("/overview").get(auth, adminOnly, getOverviewStats);
router.route("/customers").get(auth, adminOnly, getCustomers);

module.exports = router;