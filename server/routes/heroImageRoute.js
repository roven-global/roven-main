const express = require("express");
const router = express.Router();
const {
  uploadHeroImage,
  getHeroImages,
  deleteHeroImage,
} = require("../controller/heroImageController");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const upload = require("../middleware/multer");

// Get all hero images
router.get("/", getHeroImages);

// Upload hero images (desktop and mobile)
router.post(
  "/upload",
  auth,
  adminOnly,
  upload.fields([
    { name: "desktopImage", maxCount: 1 },
    { name: "mobileImage", maxCount: 1 },
  ]),
  uploadHeroImage
);

// Delete hero image
router.delete("/:id", auth, adminOnly, deleteHeroImage);

module.exports = router;
