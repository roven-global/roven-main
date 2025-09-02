const asyncHandler = require("express-async-handler");
const HeroImage = require("../models/heroImageModel");
const uploadImageCloudinary = require("../utils/uploadImageCloudinary");
const cloudinary = require("cloudinary").v2;

// @desc    Upload a new hero image
// @route   POST /api/hero-images/upload
// @access  Private/Admin
const uploadHeroImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No image file provided.");
  }

  const result = await uploadImageCloudinary(req.file);

  const newImage = await HeroImage.create({
    public_id: result.public_id,
    url: result.secure_url,
  });

  res.status(201).json({
    success: true,
    message: "Hero image uploaded successfully",
    data: newImage
  });
});

// @desc    Get all hero images
// @route   GET /api/hero-images
// @access  Public
const getHeroImages = asyncHandler(async (req, res) => {
  const images = await HeroImage.find({}).sort({ createdAt: -1 });
  res.status(200).json(images);
});

// @desc    Delete a hero image
// @route   DELETE /api/hero-images/:id
// @access  Private/Admin
const deleteHeroImage = asyncHandler(async (req, res) => {
  const image = await HeroImage.findById(req.params.id);

  if (!image) {
    res.status(404);
    throw new Error("Image not found.");
  }

  // Delete from DB first to ensure it's removed from the site
  await image.deleteOne();

  // Then, attempt to delete from Cloudinary
  try {
    await cloudinary.uploader.destroy(image.public_id);
  } catch (error) {
    // Log the error, but don't cause the request to fail,
    // as the image is already removed from our database.
    console.error(`Failed to delete image from Cloudinary (public_id: ${image.public_id}):`, error);
  }

  res.status(200).json({ message: "Image deleted successfully." });
});

module.exports = {
  uploadHeroImage,
  getHeroImages,
  deleteHeroImage,
};
