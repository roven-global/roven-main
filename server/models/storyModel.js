const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Story title is required"],
      trim: true,
      maxLength: [100, "Story title cannot exceed 100 characters"],
    },
    media: {
      type: {
        type: String,
        enum: ["image", "video"],
        required: [true, "Media type is required"],
      },
      public_id: {
        type: String,
        required: [true, "Media public_id is required"],
      },
      url: {
        type: String,
        required: [true, "Media URL is required"],
      },
      duration: {
        type: Number, // Duration in seconds for videos
        default: 0,
      },
    },
    highlight: {
      type: Boolean,
      default: false,
    },
    highlightTitle: {
      type: String,
      trim: true,
      maxLength: [30, "Highlight title cannot exceed 30 characters"],
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expirationDate: {
      type: Date,
      default: null, // null means no expiration
    },
    link: {
      type: String,
      trim: true,
    },
    linkText: {
      type: String,
      trim: true,
      maxLength: [20, "Link text cannot exceed 20 characters"],
    },
    views: {
      type: Number,
      default: 0,
    },
    viewDetails: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null, // null for anonymous users
        },
        userAgent: {
          type: String,
          default: "",
        },
        ipAddress: {
          type: String,
          default: "",
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
        isAnonymous: {
          type: Boolean,
          default: true,
        },
      },
    ],
    clicks: {
      type: Number,
      default: 0,
    },
    clickDetails: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null, // null for anonymous users
        },
        userAgent: {
          type: String,
          default: "",
        },
        ipAddress: {
          type: String,
          default: "",
        },
        clickedAt: {
          type: Date,
          default: Date.now,
        },
        isAnonymous: {
          type: Boolean,
          default: true,
        },
      },
    ],
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
storySchema.index({ order: 1, isActive: 1, expirationDate: 1 });
storySchema.index({ highlight: 1, isActive: 1 });
storySchema.index({ createdAt: -1 });

// Virtual for checking if story is expired
storySchema.virtual("isExpired").get(function () {
  if (!this.expirationDate) return false;
  return new Date() > this.expirationDate;
});

// Method to check if story should be visible
storySchema.methods.isVisible = function () {
  return this.isActive && !this.isExpired;
};

// Pre-save middleware to set default expiration (24 hours from creation)
storySchema.pre("save", function (next) {
  if (this.isNew && !this.expirationDate) {
    // Set default expiration to 24 hours from now
    this.expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model("Story", storySchema);
