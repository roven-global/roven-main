const asyncHandler = require("express-async-handler");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

// Create a reusable transporter using SMTP
let transporter;
const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465; // true for 465, false for other ports
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "Missing SMTP configuration. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in environment variables."
    );
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return transporter;
};

/**
 * Send an email using Nodemailer (SMTP)
 */
const sendEmail = asyncHandler(
  async ({ name, sendTo, subject, html, from }) => {
    if (!sendTo || !subject || !html) {
      const errorMsg = "sendTo, subject, and html are required fields.";
      console.error("[sendEmail] Validation Error:", errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      const tx = getTransporter();

      const defaultFromName = name || process.env.FROM_NAME || "Roven";
      const defaultFromEmail =
        process.env.FROM_EMAIL ||
        process.env.SMTP_FROM ||
        process.env.SMTP_USER;
      const fromAddress = from || `${defaultFromName} <${defaultFromEmail}>`;

      const info = await tx.sendMail({
        from: fromAddress,
        to: Array.isArray(sendTo) ? sendTo : [sendTo],
        subject,
        html,
      });

      return { success: true, data: info };
    } catch (err) {
      console.error(
        "[sendEmail] SMTP error:",
        err && err.message ? err.message : err
      );
      return { success: false, error: err && err.message ? err.message : err };
    }
  }
);

module.exports = sendEmail;
