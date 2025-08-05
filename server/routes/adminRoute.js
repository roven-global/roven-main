const express = require("express");
const { getOverviewStats } = require("../controller/adminController");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

// Admin-only routes
router.route("/overview").get(auth, adminOnly, getOverviewStats);

module.exports = router;