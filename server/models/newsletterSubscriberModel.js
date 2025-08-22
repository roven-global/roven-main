const mongoose = require("mongoose");

const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

const newsletterSubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [emailRegex, "Please provide a valid email address"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("NewsletterSubscriber", newsletterSubscriberSchema);
