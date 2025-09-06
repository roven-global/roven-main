const mongoose = require("mongoose");
const addressSubSchema = require("./shared/addressSchema");

/**
 * Address Schema
 * Stores user addresses with default address management
 */
const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    ...addressSubSchema,
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save middleware to ensure only one default address per user
 */
addressSchema.pre("save", async function (next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

/**
 * Indexes for better query performance
 */
addressSchema.index({ user: 1, isActive: 1 });
addressSchema.index({ user: 1, isDefault: 1 });

module.exports = mongoose.model("Address", addressSchema);
