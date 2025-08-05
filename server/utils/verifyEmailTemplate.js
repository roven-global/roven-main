/**
 * Generates an HTML email template for email verification.
 */
const verifyEmailTemplate = ({ name, url } = {}) => {
    const displayName = name || "User";
    const displayUrl = url || "#";
    return `
      <div style="font-family: Arial, sans-serif;">
        <p>Dear ${displayName},</p>
        <p>Thank you for registering with Blinkit.</p>
        <a href="${displayUrl}" style="display:inline-block;padding:10px 20px;color:white;background:blue;text-decoration:none;border-radius:4px;margin-top:10px;">
          Verify Email
        </a>
        <p style="font-size:12px;color:#888;margin-top:20px;">If you did not request this, please ignore this email.</p>
      </div>
    `;
  };
  
  module.exports = verifyEmailTemplate;
  