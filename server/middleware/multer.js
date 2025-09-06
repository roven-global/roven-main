const multer = require("multer");

/**
 * File Upload Middleware
 * Handles file uploads with memory storage and size limits
 */
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

/**
 * Product-specific upload middleware
 * Handles multiple product images and ingredient images with field validation
 */
const productUpload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
}).fields([
  { name: "images", maxCount: 10 },
  { name: "ingredientImages[0]", maxCount: 1 },
  { name: "ingredientImages[1]", maxCount: 1 },
  { name: "ingredientImages[2]", maxCount: 1 },
  { name: "ingredientImages[3]", maxCount: 1 },
  { name: "ingredientImages[4]", maxCount: 1 },
  { name: "ingredientImages[5]", maxCount: 1 },
  { name: "ingredientImages[6]", maxCount: 1 },
  { name: "ingredientImages[7]", maxCount: 1 },
  { name: "ingredientImages[8]", maxCount: 1 },
  { name: "ingredientImages[9]", maxCount: 1 },
]);

module.exports = upload;
module.exports.productUpload = productUpload;
