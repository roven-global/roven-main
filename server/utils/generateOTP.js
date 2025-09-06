/**
 * OTP Generator Utility
 * Generates secure 6-digit OTP for authentication
 */
const generateOTP = () => {
  return Math.floor(Math.random() * 900000) + 100000;
};

module.exports = generateOTP;
