const express = require("express");
const router = express.Router();
const {
  getAllHighlights,
  getAllHighlightsAdmin,
  getSingleHighlight,
  createHighlight,
  updateHighlight,
  deleteHighlight,
  toggleHighlightActive,
} = require("../controller/highlightController");
const { isAdmin } = require("../middleware/adminOnly");

// Public routes
router.get("/", getAllHighlights);
router.get("/:id", getSingleHighlight);

// Admin only routes
router.get("/admin/all", isAdmin, getAllHighlightsAdmin);
router.post("/", isAdmin, createHighlight);
router.put("/:id", isAdmin, updateHighlight);
router.delete("/:id", isAdmin, deleteHighlight);
router.patch("/:id/toggle", isAdmin, toggleHighlightActive);

module.exports = router;