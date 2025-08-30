// userController.js

const UserModel = require("../models/userModel");
const ProductModel = require("../models/productModel");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../config/sendEmail");
const generateAccessToken = require("../utils/generateAccessToken");
const generateRefreshToken = require("../utils/generateRefreshToken");
const uploadImageCloudinary = require("../utils/uploadImageCloudinary");
const generateOTP = require("../utils/generateOTP");
const forgotPasswordTemplate = require("../utils/forgotPasswordTemplate");
const validator = require("validator");

// --- Helpers ---
const sanitizeString = (val) => (typeof val === "string" ? val.trim() : "");
const logDebug = (context, obj) =>
  console.log(`[USER][DEBUG][${context}]`, obj);
const logError = (context, msg) =>
  console.error(`[USER][ERROR][${context}] ${msg}`);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const mobileRegex = /^[6-9]\d{9}$/; // India-specific: 10 digits starting with 6-9

const isEmail = (val) => emailRegex.test((val || "").trim());
const isMobile = (val) => mobileRegex.test((val || "").trim());

// ----- Registration -----
const registerUser = asyncHandler(async (req, res) => {
  let { name, email, mobile, password, emailOrMobile } = req.body || {};
  name = sanitizeString(name);
  email = sanitizeString(email);
  mobile = sanitizeString(mobile);
  emailOrMobile = sanitizeString(emailOrMobile);
  password = sanitizeString(password);

  logDebug("register--incoming", req.body);

  if (!name) return res.status(400).json({ message: "Name is required." });

  // Auto-detect field
  if (!email && !mobile && emailOrMobile) {
    if (isEmail(emailOrMobile)) email = emailOrMobile;
    else if (isMobile(emailOrMobile)) mobile = emailOrMobile;
    else
      return res
        .status(400)
        .json({ message: "Please provide a valid email or mobile number." });
    logDebug("register--auto-detection", { email, mobile });
  }

  // Misplaced mobile in email field
  if (email && isMobile(email)) {
    mobile = email;
    email = undefined;
    logDebug("register--fixed-mobile-in-email", { mobile });
  }

  if (!email && !mobile)
    return res
      .status(400)
      .json({ message: "Email or mobile number is required." });

  if (email && !isEmail(email))
    return res.status(400).json({ message: `Invalid email format: ${email}` });

  if (mobile && !isMobile(mobile))
    return res
      .status(400)
      .json({ message: `Invalid mobile number: ${mobile}` });

  if (!password)
    return res.status(400).json({ message: "Password is required." });

  if (email) {
    const existingEmail = await UserModel.findOne({ email });
    if (existingEmail)
      return res.status(400).json({
        message: `This email address (${email}) is already registered.`,
      });
  }
  if (mobile) {
    const existingMobile = await UserModel.findOne({ mobile });
    if (existingMobile)
      return res.status(400).json({
        message: `This mobile number (${mobile}) is already registered.`,
      });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  try {
    const newUser = await UserModel.create({
      name,
      email,
      mobile,
      password: hashedPassword,
    });
    logDebug("register--success", { userId: newUser._id });
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email || null,
        mobile: newUser.mobile || null,
      },
    });
  } catch (err) {
    if (err.code === 11000 && err.keyValue) {
      const field = Object.keys(err.keyValue)[0];
      const value = err.keyValue[field];
      logError("register--duplicate", `Duplicate ${field}: ${value}`);
      return res.status(400).json({
        message: `This ${
          field === "email" ? "email address" : "mobile number"
        } (${value}) is already registered.`,
      });
    }
    logError("register--unknown", err.message);
    throw err;
  }
});

// ----- Login -----
const cookiesOption = {
  httpOnly: true,
  secure: true,
  sameSite: "None",
};

const login = asyncHandler(async (req, res) => {
  let { email, mobile, password, emailOrMobile } = req.body || {};
  email = sanitizeString(email);
  mobile = sanitizeString(mobile);
  emailOrMobile = sanitizeString(emailOrMobile);
  password = sanitizeString(password);

  logDebug("login--incoming", req.body);

  if (!email && !mobile && emailOrMobile) {
    if (isEmail(emailOrMobile)) email = emailOrMobile;
    else if (isMobile(emailOrMobile)) mobile = emailOrMobile;
    else
      return res
        .status(400)
        .json({ message: "Please provide a valid email or mobile number." });
  }

  if (email && isMobile(email)) {
    mobile = email;
    email = undefined;
  }

  if (!email && !mobile)
    return res
      .status(400)
      .json({ message: "Email or mobile number is required." });
  if (email && !isEmail(email))
    return res.status(400).json({ message: `Invalid email format: ${email}` });
  if (mobile && !isMobile(mobile))
    return res
      .status(400)
      .json({ message: `Invalid mobile number: ${mobile}` });
  if (!password)
    return res.status(400).json({ message: "Password is required." });

  const user = await UserModel.findOne(email ? { email } : { mobile });
  if (!user)
    return res.status(400).json({
      message: `No account found with this ${
        email ? "email address" : "mobile number"
      }.`,
    });

  if (user.status !== "Active")
    return res
      .status(403)
      .json({ message: "Account is not active. Please contact support." });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch)
    return res
      .status(400)
      .json({ message: "Incorrect password. Please try again." });

  const accessToken = await generateAccessToken(user._id);
  const refreshToken = await generateRefreshToken(user._id);

  res.cookie("accessToken", accessToken, cookiesOption);
  res.cookie("refreshToken", refreshToken, cookiesOption);

  logDebug("login--success", { userId: user._id });
  return res.json({
    success: true,
    message: "Login successful.",
    data: { accessToken, refreshToken, userId: user._id },
  });
});

// ----- Logout -----
const logout = asyncHandler(async (req, res) => {
  res.clearCookie("accessToken", cookiesOption);
  res.clearCookie("refreshToken", cookiesOption);
  return res.json({ success: true, message: "Logged out successfully." });
});

// ----- Update User Details -----
const updateUserDetails = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.userId;
  if (!userId)
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: User ID missing." });

  const { name, email, mobile, phone, address, password } = req.body || {};
  logDebug("updateUser--incoming", req.body);

  let updateFields = {};
  if (name && sanitizeString(name) !== "")
    updateFields.name = sanitizeString(name);

  if (email) {
    const cleanEmail = sanitizeString(email);
    if (!isEmail(cleanEmail))
      return res
        .status(400)
        .json({ message: `Invalid email format: ${cleanEmail}` });
    const existing = await UserModel.findOne({ email: cleanEmail });
    if (existing && String(existing._id) !== String(userId)) {
      return res.status(409).json({
        success: false,
        message: `Email (${cleanEmail}) is already in use by another account.`,
      });
    }
    updateFields.email = cleanEmail;
  }
  if (mobile) {
    const cleanMobile = sanitizeString(mobile);
    if (!isMobile(cleanMobile))
      return res
        .status(400)
        .json({ message: `Invalid mobile number: ${cleanMobile}` });
    const existingMobile = await UserModel.findOne({ mobile: cleanMobile });
    if (existingMobile && String(existingMobile._id) !== String(userId)) {
      return res.status(409).json({
        success: false,
        message: `Mobile number (${cleanMobile}) is already in use by another account.`,
      });
    }
    updateFields.mobile = cleanMobile;
  }
  if (phone !== undefined) updateFields.phone = sanitizeString(phone);
  if (address !== undefined) updateFields.address = sanitizeString(address);

  if (password) {
    const salt = await bcrypt.genSalt(10);
    updateFields.password = await bcrypt.hash(sanitizeString(password), salt);
  }
  if (Object.keys(updateFields).length === 0)
    return res.status(400).json({
      success: false,
      message: "No valid fields provided for update.",
    });

  const updateUser = await UserModel.findByIdAndUpdate(userId, updateFields, {
    new: true,
  }).select("-password");
  if (!updateUser)
    return res.status(404).json({ success: false, message: "User not found." });

  logDebug("updateUser--success", updateFields);
  return res.json({
    success: true,
    message: "Updated user successfully.",
    data: updateUser,
  });
});

// ----- Avatar Upload -----
const uploadAvatar = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.userId;
  const image = req.file;
  if (!userId)
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: User ID missing." });
  if (!image)
    return res
      .status(400)
      .json({ success: false, message: "No image file uploaded." });

  try {
    const upload = await uploadImageCloudinary(image);
    const updateUser = await UserModel.findByIdAndUpdate(
      userId,
      { avatar: upload.url },
      { new: true }
    );
    if (!updateUser)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    return res.json({
      success: true,
      message: "Profile image uploaded successfully.",
      data: { _id: userId, avatar: upload.url },
    });
  } catch (err) {
    logError("avatar-upload", err.message);
    return res.status(500).json({
      success: false,
      message: "Image upload failed.",
      error: err.message,
    });
  }
});

// ----- Forgot Password, OTP, Reset Password -----
const forgotPassword = asyncHandler(async (req, res) => {
  let email = sanitizeString(req.body.email);
  let mobile = sanitizeString(req.body.mobile);

  if (!email && !mobile)
    return res
      .status(400)
      .json({ success: false, message: "Email or mobile number is required." });

  try {
    const user = email
      ? await UserModel.findOne({ email })
      : await UserModel.findOne({ mobile });
    if (!user) {
      const field = email ? "email address" : "mobile number";
      return res.json({
        success: true,
        message: `If the ${field} exists, an OTP has been sent.`,
      });
    }
    const otp = generateOTP();
    const expireTime = new Date(Date.now() + 15 * 60 * 1000);

    await UserModel.findByIdAndUpdate(user._id, {
      forgot_password_otp: otp,
      forgot_password_expiry: expireTime.toISOString(),
    });

    if (email) {
      await sendEmail({
        sendTo: email,
        subject: "Forgot password - Roven Global",
        html: forgotPasswordTemplate({ name: user.name, otp }),
      });
    } else if (mobile) {
      logDebug("forgotPassword--smsOTP", `OTP for ${mobile}: ${otp}`);
    }

    const field = email ? "email address" : "mobile number";
    return res.json({
      success: true,
      message: `If the ${field} exists, an OTP has been sent.`,
    });
  } catch (err) {
    logError("forgotPassword", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to process forgot password request.",
      error: err.message,
    });
  }
});

const verifyForgotPasswordOtp = asyncHandler(async (req, res) => {
  let otp = sanitizeString(req.body.otp);
  let email = sanitizeString(req.body.email);
  let mobile = sanitizeString(req.body.mobile);

  if (!otp || (!email && !mobile))
    return res.status(400).json({
      success: false,
      message: "OTP and email OR mobile are required.",
    });

  const user = email
    ? await UserModel.findOne({ email })
    : await UserModel.findOne({ mobile });
  if (!user || !user.forgot_password_otp || !user.forgot_password_expiry) {
    const field = email ? "email address" : "mobile number";
    return res
      .status(400)
      .json({ success: false, message: `Invalid OTP or ${field}.` });
  }

  if (String(user.forgot_password_otp) !== String(otp))
    return res.status(400).json({ success: false, message: "Invalid OTP." });

  const expireTime = new Date(user.forgot_password_expiry);
  if (Date.now() > expireTime.getTime())
    return res
      .status(400)
      .json({ success: false, message: "OTP has expired." });

  await UserModel.findByIdAndUpdate(user._id, {
    forgot_password_otp: null,
    forgot_password_expiry: null,
  });

  return res.json({ success: true, message: "OTP verified successfully." });
});

const resetPassword = asyncHandler(async (req, res) => {
  let newPassword = sanitizeString(req.body.newPassword);
  let confirmPassword = sanitizeString(req.body.confirmPassword);
  let email = sanitizeString(req.body.email);
  let mobile = sanitizeString(req.body.mobile);

  if (!newPassword || !confirmPassword || (!email && !mobile))
    return res
      .status(400)
      .json({ success: false, message: "All fields are required." });

  if (newPassword !== confirmPassword)
    return res
      .status(400)
      .json({ success: false, message: "Passwords do not match." });

  const user = email
    ? await UserModel.findOne({ email })
    : await UserModel.findOne({ mobile });
  if (!user) {
    const field = email ? "email address" : "mobile number";
    return res
      .status(400)
      .json({ success: false, message: `${field} is not available.` });
  }

  // Check if user has completed OTP verification (OTP should be null after verification)
  if (user.forgot_password_otp !== null) {
    return res.status(400).json({
      success: false,
      message: "Please complete OTP verification before resetting password.",
    });
  }
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

// ----- Refresh Token -----
const refreshToken = asyncHandler(async (req, res) => {
  let token = req.cookies.refreshToken;
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") token = parts[1];
  }
  token = validator.trim(token || "");
  if (!token)
    return res
      .status(401)
      .json({ success: false, message: "Refresh token missing or invalid." });

  try {
    const payload = jwt.verify(token, process.env.SECRET_KEY_REFRESH_TOKEN);
    const newAccessToken = await generateAccessToken(
      payload.userId || payload._id || payload.id
    );
    res.cookie("accessToken", newAccessToken, cookiesOption);
    return res.json({
      success: true,
      accessToken: newAccessToken,
      message: "New access token issued.",
    });
  } catch (err) {
    logError("refreshToken", err.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token.",
      error: err.message,
    });
  }
});

// ----- Get User Details -----
const getUserDetails = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.userId;
  if (!userId)
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: User ID missing." });

  try {
    const user = await UserModel.findById(userId)
      .select("-password")
      .populate({
        path: "reward",
        populate: {
          path: "reward",
          model: "WelcomeGift",
        },
      });

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    return res.json({ success: true, data: user });
  } catch (error) {
    logError("getUserDetails", error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching user details",
      error: error.message,
    });
  }
});

// ----- Profile Stats -----
const getUserProfileStats = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.userId;
  if (!userId)
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: User ID missing." });

  const user = await UserModel.findById(userId)
    .populate("orderHistory")
    .populate("shopping_cart");
  if (!user)
    return res.status(404).json({ success: false, message: "User not found." });

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

// ----- Wishlist -----
const toggleWishlist = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const productId = sanitizeString(req.body.productId);

  logDebug("wishlist--toggle--incoming", { userId, productId });

  if (!userId)
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: User ID missing." });
  if (!productId)
    return res
      .status(400)
      .json({ success: false, message: "Product ID is required." });

  const user = await UserModel.findById(userId);
  if (!user)
    return res.status(404).json({ success: false, message: "User not found." });

  const productExists = await ProductModel.findById(productId);
  if (!productExists)
    return res
      .status(404)
      .json({ success: false, message: "Product not found." });

  const index = user.wishlist.indexOf(productId);
  if (index > -1) {
    user.wishlist.splice(index, 1);
    await user.save();
    return res.json({
      success: true,
      message: "Product removed from wishlist.",
      wishlist: user.wishlist,
    });
  } else {
    user.wishlist.push(productId);
    await user.save();
    return res.json({
      success: true,
      message: "Product added to wishlist.",
      wishlist: user.wishlist,
    });
  }
});

const getWishlist = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId)
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: User ID missing." });

  const user = await UserModel.findById(userId).populate({
    path: "wishlist",
    model: "Product",
    populate: {
      path: "category",
      model: "Category",
    },
  });
  if (!user)
    return res.status(404).json({ success: false, message: "User not found." });

  return res.json({ success: true, wishlist: user.wishlist });
});

// ----- Reward Claim/Use -----
const claimReward = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const rewardId = sanitizeString(req.body.rewardId);

  if (!userId)
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: User ID missing." });
  if (!rewardId)
    return res
      .status(400)
      .json({ success: false, message: "Reward ID is required." });

  try {
    const user = await UserModel.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    if (user.rewardClaimed)
      return res.status(400).json({
        success: false,
        message: "User has already claimed a reward.",
      });
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { rewardClaimed: true, reward: rewardId },
      { new: true }
    ).select("-password");
    return res.json({
      success: true,
      message: "Reward claimed successfully.",
      data: updatedUser,
    });
  } catch (error) {
    logError("claimReward", error.message);
    return res.status(500).json({
      success: false,
      message: "Error claiming reward",
      error: error.message,
    });
  }
});

const useReward = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId)
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: User ID missing." });
  try {
    const user = await UserModel.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    if (!user.rewardClaimed)
      return res.status(400).json({
        success: false,
        message: "User has not claimed any reward yet.",
      });
    if (user.rewardUsed)
      return res.status(400).json({
        success: false,
        message: "Reward has already been used.",
      });
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { rewardUsed: true },
      { new: true }
    ).select("-password");
    return res.json({
      success: true,
      message: "Reward used successfully.",
      data: updatedUser,
    });
  } catch (error) {
    logError("useReward", error.message);
    return res.status(500).json({
      success: false,
      message: "Error using reward",
      error: error.message,
    });
  }
});

const getUserReward = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: User ID missing." });
  }

  try {
    // We need to import the UserReward model to query it.
    const UserRewardModel = require("../models/userRewardModel");
    const userReward = await UserRewardModel.findOne({
      userId: userId,
      isUsed: false,
    }).populate("giftId");

    if (userReward && userReward.giftId) {
      // Return the details of the gift itself
      return res.json({ success: true, data: userReward.giftId });
    } else {
      // If no active reward, return null
      return res.json({ success: true, data: null });
    }
  } catch (error) {
    logError("getUserReward", error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching user reward",
      error: error.message,
    });
  }
});

module.exports = {
  registerUser,
  verifyEmail: asyncHandler(async (req, res) => {
    if (!req.body || typeof req.body !== "object")
      return res
        .status(400)
        .json({ success: false, message: "Missing request body." });
    let { code } = req.body || {};
    code = validator.trim(validator.escape(code || ""));
    if (!code)
      return res
        .status(400)
        .json({ success: false, message: "Verification code is required." });
    const user = await UserModel.findById(code);
    if (!user)
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code.",
      });
    if (user.verify_email)
      return res
        .status(200)
        .json({ success: true, message: "Email already verified." });
    await UserModel.updateOne({ _id: code }, { verify_email: true });
    return res.json({ success: true, message: "Email verified successfully." });
  }),
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
  claimReward,
  useReward,
  getUserReward,
};
