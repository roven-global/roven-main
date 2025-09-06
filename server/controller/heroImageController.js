const asyncHandler = require("express-async-handler");
const HeroImage = require("../models/heroImageModel");
const uploadImageCloudinary = require("../utils/uploadImageCloudinary");
const cloudinary = require("cloudinary").v2;

/**
 * Upload hero image for desktop and/or mobile
 * @route POST /api/hero-images/upload
 */
const uploadHeroImage = asyncHandler(async (req, res) => {
  if (!req.files || (!req.files.desktopImage && !req.files.mobileImage)) {
    res.status(400);
    throw new Error(
      "At least one image file (desktop or mobile) must be provided."
    );
  }

  // Validate file types
  const validateFile = (file) => {
    if (!file || !file.mimetype) return false;
    return file.mimetype.startsWith("image/");
  };

  if (req.files.desktopImage && !validateFile(req.files.desktopImage[0])) {
    res.status(400);
    throw new Error("Desktop file must be a valid image.");
  }

  if (req.files.mobileImage && !validateFile(req.files.mobileImage[0])) {
    res.status(400);
    throw new Error("Mobile file must be a valid image.");
  }

  try {
    let desktopResult = null;
    let mobileResult = null;

    // Upload desktop image if provided
    if (req.files.desktopImage) {
      desktopResult = await uploadImageCloudinary(
        req.files.desktopImage[0],
        "hero-images/desktop"
      );
    }

    // Upload mobile image if provided
    if (req.files.mobileImage) {
      mobileResult = await uploadImageCloudinary(
        req.files.mobileImage[0],
        "hero-images/mobile"
      );
    }

    // Determine the main URL and public_id
    const mainUrl = desktopResult
      ? desktopResult.secure_url
      : mobileResult.secure_url;
    const mainPublicId = desktopResult
      ? desktopResult.public_id
      : mobileResult.public_id;

    // Create hero image with available versions
    const newImage = await HeroImage.create({
      public_id: mainPublicId,
      url: mainUrl,
      mobileUrl: mobileResult ? mobileResult.secure_url : null,
      desktopUrl: desktopResult ? desktopResult.secure_url : null,
      alt: req.body.alt || "Hero Image",
    });

    res.status(201).json({
      success: true,
      message: "Hero image(s) uploaded successfully",
      data: newImage,
    });
  } catch (error) {
    console.error("Hero image upload error:", error);
    res.status(500);
    throw new Error("Failed to upload hero image: " + error.message);
  }
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
    // Delete desktop image if it exists
    if (image.desktopUrl && image.public_id) {
      await cloudinary.uploader.destroy(image.public_id);
    }

    // Delete mobile image if it exists and has a different public_id
    if (image.mobileUrl && image.mobileUrl !== image.desktopUrl) {
      // Extract public_id from mobile URL more reliably
      const urlParts = image.mobileUrl.split("/");
      const filename = urlParts[urlParts.length - 1];
      const mobilePublicId = filename.split(".")[0];

      if (mobilePublicId && mobilePublicId !== image.public_id) {
        try {
          await cloudinary.uploader.destroy(mobilePublicId);
        } catch (mobileDeleteError) {
          console.error(
            `Failed to delete mobile image from Cloudinary (public_id: ${mobilePublicId}):`,
            mobileDeleteError
          );
        }
      }
    }
  } catch (error) {
    // Log the error, but don't cause the request to fail,
    // as the image is already removed from our database.
    console.error(
      `Failed to delete desktop image from Cloudinary (public_id: ${image.public_id}):`,
      error
    );
  }

  res.status(200).json({ message: "Image deleted successfully." });
});

module.exports = {
  uploadHeroImage,
  getHeroImages,
  deleteHeroImage,
};
