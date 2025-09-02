// uploadImageCloudinary.js file
const asyncHandler = require("express-async-handler");
const cloudinary = require("cloudinary").v2;

// Ensure Cloudinary config is set
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET ||
  process.env.CLOUDINARY_CLOUD_NAME === "dummy"
) {
  console.warn("Cloudinary environment variables are not properly set. Image upload will be disabled.");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImageCloudinary = asyncHandler(
  async (image, folder = "blinkit-cloud") => {
    if (!image) throw new Error("No image provided for upload.");

    const buffer = image?.buffer || Buffer.from(await image.arrayBuffer());

    const options = {
      folder,
      transformation: [
        { width: 1200, crop: "limit" },
        { quality: "auto", fetch_format: "auto" },
      ],
    };

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(options, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        })
        .end(buffer);
    });
  }
);

module.exports = uploadImageCloudinary;
