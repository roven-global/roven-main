const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

/**
 * JWT Refresh Token Generator
 * Generates secure refresh tokens and updates user model
 */
const generateRefreshToken = asyncHandler(async (userId) => {
  const token = await jwt.sign(
    { id: userId },
    process.env.SECRET_KEY_REFRESH_TOKEN,
    { expiresIn: "30d" }
  );

  await userModel.updateOne({ _id: userId }, { refresh_token: token });

  return token;
});

module.exports = generateRefreshToken;
