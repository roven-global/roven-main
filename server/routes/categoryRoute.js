const express = require("express");
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  bulkDeleteCategories,
  getCategoryHierarchy,
  searchCategories,
} = require("../controller/categoryController");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const upload = require("../middleware/multer");
const router = express.Router();

// Get all categories
router.route("/all").get(getAllCategories);

// Get category hierarchy
router.route("/hierarchy").get(getCategoryHierarchy);

// Search categories
router.route("/search").get(searchCategories);

// Get category by ID or slug
router.route("/:identifier").get(getCategoryById);

/**
 * Admin Routes - Require authentication and admin privileges
 */

// Create new category
router
  .route("/create")
  .post(auth, adminOnly, upload.single("image"), createCategory);

// Bulk delete categories
router.route("/bulk-delete").delete(auth, adminOnly, bulkDeleteCategories);

// Update category
router
  .route("/:id")
  .put(auth, adminOnly, upload.single("image"), updateCategory);

// Delete category
router.route("/:id").delete(auth, adminOnly, deleteCategory);

module.exports = router;
