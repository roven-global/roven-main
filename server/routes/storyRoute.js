const express = require("express");
const multer = require("multer");
const router = express.Router();
const {
  getAllStories,
  getAllStoriesAdmin,
  getSingleStory,
  createStory,
  updateStory,
  deleteStory,
  updateStoryOrder,
  incrementStoryViews,
  getStoryViews,
  incrementStoryClicks,
  getStoryClicks,
  toggleStoryHighlight,
} = require("../controller/storyController");
const { isAdmin } = require("../middleware/adminOnly");
const { storyUpload } = require("../middleware/multer");

// Public routes
router.get("/", getAllStories);
router.get("/:id", getSingleStory);
router.patch("/:id/views", incrementStoryViews);
router.patch("/:id/clicks", incrementStoryClicks);

// Admin only routes
router.get("/admin/all", isAdmin, getAllStoriesAdmin);
router.get("/admin/:id/views", isAdmin, getStoryViews);
router.get("/admin/:id/clicks", isAdmin, getStoryClicks);
router.post("/upload", isAdmin, storyUpload.single("media"), createStory);
router.post("/admin/create", isAdmin, storyUpload.single("media"), createStory);
router.put("/admin/:id", isAdmin, storyUpload.single("media"), updateStory);
router.delete("/admin/:id", isAdmin, deleteStory);
router.patch("/admin/order", isAdmin, updateStoryOrder);
router.patch("/admin/:id/highlight", isAdmin, toggleStoryHighlight);

// Error handling middleware for multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 50MB.",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files. Only one file is allowed.",
      });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name. Use "media" as the field name.',
      });
    }
  }

  if (error.message.includes("Invalid file type")) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  next(error);
});

module.exports = router;
