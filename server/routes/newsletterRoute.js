const express = require("express");
const { 
  subscribeToNewsletter, 
  getSubscribers,
  exportSubscribersAsCSV
} = require("../controller/newsletterController");

const router = express.Router();

router.route("/subscribe").post(subscribeToNewsletter);
router.route("/").get(getSubscribers);
router.route("/export").get(exportSubscribersAsCSV);

module.exports = router;
