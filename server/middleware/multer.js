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
 * Story-specific upload middleware
 * Handles story media uploads with file type validation
 */
const storyUpload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for videos
    files: 1, // Only one file at a time
  },
  fileFilter: (req, file, cb) => {
    // Define allowed file types
    const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png"];
    const allowedVideoTypes = ["video/mp4", "video/webm"];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type. Only ${allowedImageTypes.join(
            ", "
          )} and ${allowedVideoTypes.join(", ")} are allowed.`
        ),
        false
      );
    }
  },
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
module.exports.storyUpload = storyUpload;
