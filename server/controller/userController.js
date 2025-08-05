// userController.js file
const UserModel = require("../models/userModel");
const ProductModel = require("../models/productModel");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../config/sendEmail");
const verifyEmailTemplate = require("../utils/verifyEmailTemplate");
const generateAccessToken = require("../utils/generateAccessToken");
const generateRefreshToken = require("../utils/generateRefreshToken");
const uploadImageCloudinary = require("../utils/uploadImageCloudinary");
const generateOTP = require("../utils/generateOTP");
const forgotPasswordTemplate = require("../utils/forgotPasswordTemplate");
const validator = require("validator");
const xss = require("xss-clean/lib/xss");

/**
Registers a new user, sends verification email, and returns user info.
@route POST /api/user/register
*/
const registerUser = asyncHandler(async (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      success: false,
      message:
        "Invalid or missing request body. Please send JSON with name, email, and password.",
    });
  }
  let { name, email, password } = req.body || {};

  // Sanitize input
  name = validator.trim(validator.escape(name || ""));
  email = validator.normalizeEmail(email || "");
  password = validator.trim(password || "");

  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please fill in all fields (name, email, password).",
    });
  }
  if (!validator.isLength(name, { min: 2, max: 50 })) {
    return res.status(400).json({ success: false, message: "Name must be 2-50 characters." });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ success: false, message: "Invalid email address." });
  }
  if (!validator.isStrongPassword(password, { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })) {
    return res.status(400).json({ success: false, message: "Password must be at least 8 characters and include uppercase, lowercase, number, and symbol." });
  }

  // Check if user already exists
  const user = await UserModel.findOne({ email });
  if (user) {
    return res.status(409).json({
      success: false,
      message:
        "User already registered! Please login or use a different email.",
    });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);

  const payload = {
    name,
    email,
    password: hashPassword,
  };

  const newUser = new UserModel(payload);
  await newUser.save();

  try {
    const verifyEmailUrl = `${process.env.FRONTEND_URL}/verify-email?code=${newUser._id}`;
    await sendEmail({
      sendTo: email,
      subject: "Verify your email from Blinkit",
      html: verifyEmailTemplate({
        name,
        url: verifyEmailUrl,
      }),
    });
    return res.status(201).json({
      success: true,
      message: "User registered successfully. Verification email sent.",
      data: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message:
        "User registered, but failed to send verification email. Please try again later.",
      error: err.message || err,
    });
  }
});

/**
Verifies a user's email using a code.
@route POST /api/user/verify-email
*/
const verifyEmail = asyncHandler(async (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res
      .status(400)
      .json({ success: false, message: "Missing request body." });
  }
  let { code } = req.body || {};
  code = validator.trim(validator.escape(code || ""));
  if (!code) {
    return res.status(400).json({ success: false, message: "Verification code is required." });
  }
  const user = await UserModel.findById(code);
  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired verification code.",
    });
  }
  if (user.verify_email) {
    return res
      .status(200)
      .json({ success: true, message: "Email already verified." });
  }
  await UserModel.updateOne({ _id: code }, { verify_email: true });
  return res.json({ success: true, message: "Email verified successfully." });
});

const cookiesOption = {
  httpOnly: true,
  secure: true,
  sameSite: "None",
};
/**
Logs in a user and returns access and refresh tokens.
@route POST /api/user/login
*/
const login = asyncHandler(async (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      success: false,
      message: "Please provide both email and password.",
    });
  }
  let { email, password } = req.body || {};
  email = validator.normalizeEmail(email || "");
  password = validator.trim(password || "");

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Please fill in all fields (email, password)." });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ success: false, message: "Invalid email address." });
  }
  const user = await UserModel.findOne({ email });
  if (!user) {
    return res.status(400).json({
      success: false,
      message: "User not registered! Please register first.",
    });
  }
  if (user.status !== "Active") {
    return res.status(403).json({
      success: false,
      message: "Account not active. Please contact Admin.",
    });
  }
  const checkPass = await bcrypt.compare(password, user.password);
  if (!checkPass) {
    return res.status(400).json({
      success: false,
      message: "Incorrect password! Please try again.",
    });
  }
  const accessToken = await generateAccessToken(user._id);
  const refreshToken = await generateRefreshToken(user._id);

  res.cookie("accessToken", accessToken, cookiesOption);
  res.cookie("refreshToken", refreshToken, cookiesOption);
  return res.json({
    success: true,
    message: "Login successful.",
    data: {
      accessToken,
      refreshToken,
    },
  });
});

/**
Logs out a user.
@route POST /api/user/logout
*/
const logout = asyncHandler(async (req, res) => {
  res.clearCookie("accessToken", cookiesOption);
  res.clearCookie("refreshToken", cookiesOption);
  return res.json({ success: true, message: "Logged out successfully." });
});

/**
Uploads a user's avatar image to cloud storage and updates user profile.
@route POST /api/user/upload-avatar
*/
const uploadAvatar = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.userId; // Support both req.user and req.userId from auth middleware
  const image = req.file;

  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: User ID missing." });
  }
  if (!image) {
    return res
      .status(400)
      .json({ success: false, message: "No image file uploaded." });
  }

  let upload;
  try {
    upload = await uploadImageCloudinary(image);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Image upload failed.",
      error: err.message,
    });
  }

  const updateUser = await UserModel.findByIdAndUpdate(
    userId,
    { avatar: upload.url },
    { new: true }
  );

  if (!updateUser) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  return res.json({
    success: true,
    message: "Profile image uploaded successfully.",
    data: { _id: userId, avatar: upload.url },
  });
});

/**
Updates user details (name, email, mobile, password).
@route PUT /api/user/update-user
*/
const updateUserDetails = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.userId; // auth middleware
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: User ID missing.",
    });
  }
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      success: false,
      message: "Missing or invalid request body.",
    });
  }
  const { name, email, mobile, phone, address, password } = req.body;

  let updateFields = {};
  if (name) updateFields.name = name;
  if (email) {
    // Check if email is already used by another user
    const existing = await UserModel.findOne({ email });
    if (existing && String(existing._id) !== String(userId)) {
      return res
        .status(409)
        .json({
          success: false,
          message: "Email is already in use by another account.",
        });
    }
    updateFields.email = email;
  }
  if (mobile) updateFields.mobile = mobile;
  if (phone !== undefined) updateFields.phone = phone;
  if (address !== undefined) updateFields.address = address;
  if (password) {
    const salt = await bcrypt.genSalt(10);
    updateFields.password = await bcrypt.hash(password, salt);
  }
  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({
      success: false,
      message: "No valid fields provided for update.",
    });
  }
  const updateUser = await UserModel.findByIdAndUpdate(userId, updateFields, {
    new: true,
  }).select("-password");
  if (!updateUser) {
    return res.status(404).json({ success: false, message: "User not found." });
  }
  return res.json({
    success: true,
    message: "Updated user successfully.",
    data: updateUser,
  });
});

/**
Handles forgot password functionality.
@route POST /api/user/forgot-password
*/
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required." });
  }
  try {
    const user = await UserModel.findOne({ email });
    // For security, always return success even if user not found
    if (!user) {
      return res.json({
        success: true,
        message: "If the email exists, an OTP has been sent.",
      });
    }
    const otp = generateOTP();
    const expireTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    await UserModel.findByIdAndUpdate(user._id, {
      forgot_password_otp: otp,
      forgot_password_expiry: expireTime.toISOString(),
    });

    await sendEmail({
      sendTo: email,
      subject: "Forgot password from Blinkit",
      html: forgotPasswordTemplate({ name: user.name, otp }),
    });
    return res.json({
      success: true,
      message: "If the email exists, an OTP has been sent.",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to process forgot password request.",
      error: err.message,
    });
  }
});

/**
Verifies the OTP for forgot password functionality.
@route POST /api/user/verify-forgot-password-otp
*/
const verifyForgotPasswordOtp = asyncHandler(async (req, res) => {
  const { otp, email } = req.body || {};
  if (!otp || !email) {
    return res
      .status(400)
      .json({ success: false, message: "OTP and email are required." });
  }

  const user = await UserModel.findOne({ email });
  if (!user || !user.forgot_password_otp || !user.forgot_password_expiry) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid OTP or email." });
  }

  // Check if OTP matches
  if (String(user.forgot_password_otp) !== String(otp)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid OTP or email." });
  }

  // Check if OTP is expired
  const expireTime = new Date(user.forgot_password_expiry);
  if (Date.now() > expireTime.getTime()) {
    return res
      .status(400)
      .json({ success: false, message: "OTP has expired." });
  }

  // Optionally, clear OTP fields after successful verification
  await UserModel.findByIdAndUpdate(user._id, {
    forgot_password_otp: null,
    forgot_password_expiry: null,
  });

  return res.json({ success: true, message: "OTP verified successfully." });
});

/**
Resets the user's password after OTP verification.
@route POST /api/user/reset-password
*/
const resetPassword = asyncHandler(async (req, res) => {
  const { newPassword, confirmPassword, email } = req.body || {};

  if (!newPassword || !confirmPassword || !email) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required." });
  }

  if (newPassword !== confirmPassword) {
    return res
      .status(400)
      .json({ success: false, message: "Passwords do not match." });
  }

  const user = await UserModel.findOne({ email });
  if (!user) {
    return res
      .status(400)
      .json({ success: false, message: "Email is not available." });
  }

  // Prevent reusing the same password
  const isSame = await bcrypt.compare(newPassword, user.password);
  if (isSame) {
    return res.status(400).json({
      success: false,
      message: "New password must be different from the old password.",
    });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await UserModel.findByIdAndUpdate(user._id, {
    password: hashedPassword,
    forgot_password_otp: null,
    forgot_password_expiry: null,
  });

  return res.json({ success: true, message: "Password updated successfully." });
});

/**
Handles refresh token logic: validates the refresh token and issues a new access token if valid.
@route POST /api/user/refresh-token
*/
const refreshToken = asyncHandler(async (req, res) => {
  let token = req.cookies.refreshToken;
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1];
    }
  }
  token = validator.trim(token || "");
  if (!token) {
    return res.status(401).json({ success: false, message: "Refresh token missing or invalid." });
  }

  try {
    // Verify the refresh token
    const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    // Issue a new access token
    const newAccessToken = await generateAccessToken(
      payload.userId || payload._id || payload.id
    );

    // Set the new access token in cookie
    res.cookie("accessToken", newAccessToken, cookiesOption);

    return res.json({
      success: true,
      accessToken: newAccessToken,
      message: "New access token issued.",
    });
  } catch (err) {
    return res
      .status(401)
      .json({
        success: false,
        message: "Invalid or expired refresh token.",
        error: err.message,
      });
  }
});

/**
Returns the current user's details.
@route GET /api/user/details
*/
const getUserDetails = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.userId;
  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: User ID missing." });
  }
  const user = await UserModel.findById(userId).select("-password");
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }
  return res.json({ success: true, data: user });
});

/**
Returns user profile statistics.
@route GET /api/user/profile/stats
*/
const getUserProfileStats = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.userId;
  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: User ID missing." });
  }

  const user = await UserModel.findById(userId)
    .populate("orderHistory")
    .populate("shopping_cart");
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  const stats = {
    totalOrders: user.orderHistory?.length || 0,
    cartItems: user.shopping_cart?.length || 0,
    memberSince: user.createdAt,
    lastLogin: user.last_login_date,
    emailVerified: user.verify_email,
    accountStatus: user.status,
  };

  return res.json({ success: true, data: stats });
});

/**
Toggles a product in the user's wishlist.
@route POST /api/user/wishlist
*/
const toggleWishlist = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { productId } = req.body;

  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: User ID missing." });
  }

  if (!productId) {
    return res
      .status(400)
      .json({ success: false, message: "Product ID is required." });
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  const productExists = await ProductModel.findById(productId);
  if (!productExists) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found." });
  }

  const index = user.wishlist.indexOf(productId);
  if (index > -1) {
    // Product is in wishlist, remove it
    user.wishlist.splice(index, 1);
    await user.save();
    return res.json({
      success: true,
      message: "Product removed from wishlist.",
      wishlist: user.wishlist,
    });
  } else {
    // Product is not in wishlist, add it
    user.wishlist.push(productId);
    await user.save();
    return res.json({
      success: true,
      message: "Product added to wishlist.",
      wishlist: user.wishlist,
    });
  }
});

/**
Retrieves the user's wishlist.
@route GET /api/user/wishlist
*/
const getWishlist = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: User ID missing." });
  }

  const user = await UserModel.findById(userId).populate({
    path: "wishlist",
    model: "Product",
    populate: {
      path: "category",
      model: "Category",
    },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  return res.json({ success: true, wishlist: user.wishlist });
});

module.exports = {
  registerUser,
  verifyEmail,
  login,
  logout,
  uploadAvatar,
  updateUserDetails,
  forgotPassword,
  verifyForgotPasswordOtp,
  resetPassword,
  refreshToken,
  getUserDetails,
  getUserProfileStats,
  toggleWishlist,
  getWishlist,
};
