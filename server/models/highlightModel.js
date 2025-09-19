const mongoose = require("mongoose");

const highlightSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Highlight title is required"],
      trim: true,
      maxLength: [50, "Highlight title cannot exceed 50 characters"],
    },
    coverImage: {
      type: String,
      default: null, // URL to cover image
    },
    stories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Story",
      },
    ],
    rank: {
      type: Number,
      default: 1,
      min: [1, "Rank must be at least 1"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
      maxLength: [200, "Description cannot exceed 200 characters"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
highlightSchema.index({ rank: 1, isActive: 1 });
highlightSchema.index({ isActive: 1, createdAt: -1 });

// Virtual for story count
highlightSchema.virtual("storyCount").get(function () {
  return this.stories.length;
});

// Method to check if highlight should be visible
highlightSchema.methods.isVisible = function () {
  return this.isActive && this.stories.length > 0;
};

module.exports = mongoose.model("Highlight", highlightSchema);