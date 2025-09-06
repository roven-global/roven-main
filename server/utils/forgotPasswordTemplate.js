/**
 * Email Template Utility
 * Generates HTML email templates for user communications
 */
const forgotPasswordTemplate = ({ name, otp }) => {
  return `
      <div>
        <p>Dear ${name},</p>
        <p>You requested a password reset. Please use the following OTP code to reset your password.</p>
        <div style="font-size: 2em; font-weight: bold; margin: 16px 0;">${otp}</div>
        <p>This OTP is valid for 15 minutes only. Enter this OTP on the Roven Global website to proceed with resetting your password.</p>
        <br/>
        <p>Thanks</p>
        <p>Roven Global</p>
      </div>
    `;
};

module.exports = forgotPasswordTemplate;
