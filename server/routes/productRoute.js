// productRoute.js file
const express = require("express");
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  getProductsByCategory,
  searchProducts,
  getFeaturedProducts,
} = require("../controller/productController");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const upload = require("../middleware/multer");
const router = express.Router();

// Public routes
router.route("/all").get(getAllProducts);
router.route("/search").get(searchProducts);
router.route("/featured").get(getFeaturedProducts);
router.route("/category/:categoryId").get(getProductsByCategory);
router.route("/:identifier").get(getProductById);

// Admin-only routes (require authentication and admin privileges)
router.route("/create").post(auth, adminOnly, upload.array("images", 10), createProduct);
router.route("/bulk-delete").delete(auth, adminOnly, bulkDeleteProducts);
router.route("/:id").put(auth, adminOnly, upload.array("images", 10), updateProduct);
router.route("/:id").delete(auth, adminOnly, deleteProduct);

module.exports = router;
