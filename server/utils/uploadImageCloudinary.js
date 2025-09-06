const asyncHandler = require("express-async-handler");
const cloudinary = require("cloudinary").v2;

/**
 * Cloudinary Image Upload Utility
 * Handles secure image uploads to Cloudinary with automatic optimization
 */

if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET ||
  process.env.CLOUDINARY_CLOUD_NAME === "dummy"
) {
  console.warn(
    "Cloudinary environment variables are not properly set. Image upload will be disabled."
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image to Cloudinary with automatic optimization
 * @param {Buffer|File} image - Image buffer or file object
 * @param {string} folder - Cloudinary folder path
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadImageCloudinary = asyncHandler(
  async (image, folder = "uploads") => {
    if (!image) throw new Error("No image provided for upload.");

    const buffer = image?.buffer || Buffer.from(await image.arrayBuffer());

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: folder,
            resource_type: "auto",
            quality: "auto",
            fetch_format: "auto",
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        )
        .end(buffer);
    });
  }
);

module.exports = uploadImageCloudinary;
