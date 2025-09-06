const mongoose = require("mongoose");
const Product = require("./productModel");

/**
 * Review Schema
 * Schema for product reviews with rating and text feedback
 */
const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Review must belong to a product."],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user."],
    },
    rating: {
      type: Number,
      required: [true, "A review must have a rating."],
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      trim: true,
      required: [true, "A review must have a review text."],
      maxlength: [1500, "Review text cannot exceed 1500 characters."],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Prevent duplicate reviews: one user can only review a specific product once
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Static method to calculate average ratings and update the product
reviewSchema.statics.calculateAverageRatings = async function (productId) {
  const stats = await this.aggregate([
    {
      $match: { product: productId },
    },
    {
      $group: {
        _id: "$product",
        numOfReviews: { $sum: 1 },
        averageRating: { $avg: "$rating" },
      },
    },
  ]);

  try {
    if (stats.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        "ratings.numOfReviews": stats[0].numOfReviews,
        "ratings.average": stats[0].averageRating,
      });
    } else {
      // If no reviews exist, reset the product's rating stats
      await Product.findByIdAndUpdate(productId, {
        "ratings.numOfReviews": 0,
        "ratings.average": 0, // Or a default like 4.5 if you prefer
      });
    }
  } catch (error) {
    console.error("Error updating product ratings:", error);
  }
};

/**
 * Post-save middleware to recalculate product ratings
 */
reviewSchema.post("save", function () {
  // `this.constructor` refers to the model (Review)
  this.constructor.calculateAverageRatings(this.product);
});

/**
 * Post-delete middleware to recalculate product ratings after review deletion
 */
reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) {
    await doc.constructor.calculateAverageRatings(doc.product);
  }
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
