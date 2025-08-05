// categoryRoute.js file
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

// Public routes
router.route("/all").get(getAllCategories);
router.route("/hierarchy").get(getCategoryHierarchy);
router.route("/search").get(searchCategories);
router.route("/:identifier").get(getCategoryById);

// Admin-only routes (require authentication and admin privileges)
router.route("/create").post(auth, adminOnly, upload.single("image"), createCategory);
router.route("/bulk-delete").delete(auth, adminOnly, bulkDeleteCategories);
router.route("/:id").put(auth, adminOnly, upload.single("image"), updateCategory);
router.route("/:id").delete(auth, adminOnly, deleteCategory);

module.exports = router;
