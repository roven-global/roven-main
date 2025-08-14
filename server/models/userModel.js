// server/models/userModel.js

const mongoose = require("mongoose");

const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Provide name"],
    },
    email: {
      type: String,
      required: function () { return !this.mobile; },
      unique: true,
      sparse: true,
      match: [emailRegex, "Please provide a valid email address"],
      set: v => v === "" ? undefined : v,
      default: undefined,
    },
    password: {
      type: String,
      // Password is not required if signing up with Google
      required: function () { return !this.googleId; },
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values, but unique if a value exists
    },
    avatar: {
      type: String,
      default: "https://res.cloudinary.com/dkq55s6t8/image/upload/v1717398335/Roven/Avatar/default_avatar.png",
    },
    // Add these fields for efficient reward checking
    rewardClaimed: {
      type: Boolean,
      default: false,
    },
    rewardUsed: {
      type: Boolean,
      default: false,
    },
    // You can keep this reference if you want to store more detailed reward history
    reward: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserReward",
    },
    mobile: {
      type: String,
      required: function () { return !this.email; },
      unique: true,
      sparse: true,
      match: [/^[6-9]\d{9}$/, "Please provide a valid 10-digit Indian mobile number"],
      set: v => v === "" ? undefined : v, 
      default: undefined,
    },
    phone: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    refresh_token: {
      type: String,
      default: "",
    },
    verify_email: {
      type: Boolean,
      default: false,
    },
    last_login_date: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active",
    },
    address_details: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "address",
      },
    ],
    shopping_cart: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "cartProduct",
      },
    ],
    orderHistory: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "order",
      },
    ],
    forgot_password_otp: {
      type: String,
      default: "",
    },
    forgot_password_expiry: {
      type: Date,
      default: null,
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },
    wishlist: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }]
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields for auditing
  }
);

module.exports = mongoose.model("User", userSchema);