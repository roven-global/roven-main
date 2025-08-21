const mongoose = require("mongoose");
const Product = require("./productModel"); // Import Product model for statics

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
    title: {
      type: String,
      trim: true,
      required: [true, "A review must have a title."],
      maxlength: [100, "Review title cannot exceed 100 characters."],
    },
    comment: {
      type: String,
      trim: true,
      required: [true, "A review must have a comment."],
      maxlength: [1500, "Review comment cannot exceed 1500 characters."],
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

// Post-save hook to recalculate ratings after a new review is saved
reviewSchema.post("save", function () {
  // `this.constructor` refers to the model (Review)
  this.constructor.calculateAverageRatings(this.product);
});

// Post-remove hook to recalculate ratings after a review is deleted
// findOneAndDelete/findByIdAndDelete triggers the 'findOneAndDelete' middleware
reviewSchema.post(/^findOneAnd/, async function (doc) {
    if (doc) {
        await doc.constructor.calculateAverageRatings(doc.product);
    }
});


const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
