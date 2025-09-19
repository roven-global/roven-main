const express = require("express");
const router = express.Router();
const {
  getSetting,
  updateSetting,
  initializeDefaultSettings,
} = require("../controller/adminSettingsController");
const auth = require("../middleware/auth");
const { adminOnly } = require("../middleware/adminOnly");

// All routes in this file are protected and for admins only
router.use(auth, adminOnly);

// Initialize default settings
router.post("/initialize", initializeDefaultSettings);

// Get a setting by its key
router.get("/:key", getSetting);

// Update or create a setting
router.put("/:key", updateSetting);

module.exports = router;
