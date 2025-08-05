// uploadImageCloudinary.js file
const asyncHandler = require("express-async-handler");
const cloudinary = require("cloudinary").v2;

// Ensure Cloudinary config is set
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  throw new Error("Cloudinary environment variables are not set.");
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

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder }, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        })
        .end(buffer);
    });
  }
);

module.exports = uploadImageCloudinary;
