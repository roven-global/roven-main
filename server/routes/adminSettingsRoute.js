const express = require("express");
const router = express.Router();
const { getSetting, updateSetting } = require("../controller/adminSettingsController");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

// All routes in this file are protected and for admins only
router.use(auth, adminOnly);

// @route   GET /api/admin/settings/:key
// @desc    Get a setting by its key
router.get("/:key", getSetting);

// @route   PUT /api/admin/settings/:key
// @desc    Update or create a setting
router.put("/:key", updateSetting);

module.exports = router;
