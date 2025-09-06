const express = require("express");
const {
  subscribeToNewsletter,
  getSubscribers,
  exportSubscribersAsCSV,
} = require("../controller/newsletterController");

const router = express.Router();

/**
 * Newsletter Routes
 * Handles newsletter subscription and admin management
 */

// Subscribe to newsletter (public)
router.route("/subscribe").post(subscribeToNewsletter);

// Get all subscribers (admin only - requires auth middleware in controller)
router.route("/").get(getSubscribers);

// Export subscribers as CSV (admin only - requires auth middleware in controller)
router.route("/export").get(exportSubscribersAsCSV);

module.exports = router;
