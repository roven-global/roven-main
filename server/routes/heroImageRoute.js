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

// Public route to get all hero images
router.get("/", getHeroImages);

// Admin routes to upload and delete images
router.post(
  "/upload",
  auth,
  adminOnly,
  upload.fields([
    { name: 'desktopImage', maxCount: 1 },
    { name: 'mobileImage', maxCount: 1 }
  ]),
  uploadHeroImage
);
router.delete("/:id", auth, adminOnly, deleteHeroImage);

module.exports = router;
