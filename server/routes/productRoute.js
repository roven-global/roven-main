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
  getProductVariants,
  updateVariantStock,
  getRelatedProducts,
} = require("../controller/productController");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const productUpload = require("../middleware/multer").productUpload;
const router = express.Router();

// Get all products with pagination and filtering
router.route("/all").get(getAllProducts);

// Search products
router.route("/search").get(searchProducts);

// Get featured products
router.route("/featured").get(getFeaturedProducts);

// Get related products
router.route("/related/:id").get(getRelatedProducts);

// Get products by category
router.route("/category/:categoryId").get(getProductsByCategory);

// Get product by ID or slug
router.route("/:identifier").get(getProductById);

// Get product variants
router.route("/:id/variants").get(getProductVariants);

/**
 * Admin Routes - Require authentication and admin privileges
 */

// Create new product
router.route("/create").post(auth, adminOnly, productUpload, createProduct);

// Bulk delete products
router.route("/bulk-delete").delete(auth, adminOnly, bulkDeleteProducts);

// Update product
router.route("/:id").put(auth, adminOnly, productUpload, updateProduct);

// Delete product
router.route("/:id").delete(auth, adminOnly, deleteProduct);

// Update variant stock
router
  .route("/:id/variant/:variantSku/stock")
  .put(auth, adminOnly, updateVariantStock);

module.exports = router;
