const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

/**
 * JWT Access Token Generator
 * Generates secure access tokens for user authentication
 */

const generateAccessToken = asyncHandler(async (userId) => {
  return await jwt.sign({ id: userId }, process.env.SECRET_KEY_ACCESS_TOKEN, {
    expiresIn: "5h",
  });
});

module.exports = generateAccessToken;
