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
  getProductVariants,
  updateVariantStock,
} = require("../controller/productController");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const productUpload = require("../middleware/multer").productUpload;
const router = express.Router();

// Public routes
router.route("/all").get(getAllProducts);
router.route("/search").get(searchProducts);
router.route("/featured").get(getFeaturedProducts);
router.route("/category/:categoryId").get(getProductsByCategory);
router.route("/:identifier").get(getProductById);
router.route("/:id/variants").get(getProductVariants);

// Admin-only routes (require authentication and admin privileges)
router.route("/create").post(auth, adminOnly, productUpload, createProduct);
router.route("/bulk-delete").delete(auth, adminOnly, bulkDeleteProducts);
router.route("/:id").put(auth, adminOnly, productUpload, updateProduct);
router.route("/:id").delete(auth, adminOnly, deleteProduct);
router.route("/:id/variant/:variantSku/stock").put(auth, adminOnly, updateVariantStock);

module.exports = router;
