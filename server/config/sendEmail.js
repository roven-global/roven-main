const { Resend } = require("resend");
const dotenv = require("dotenv");
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ name, sendTo, subject, html }) => {
  if (!sendTo || !subject || !html) {
    const errorMsg = "sendTo, subject, and html are required fields.";
    console.error("[sendEmail] Validation Error:", errorMsg);
    return { success: false, error: errorMsg };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: `${name || "Acme"} <onboarding@resend.dev>`,
      to: Array.isArray(sendTo) ? sendTo : [sendTo],
      subject,
      html,
    });
    if (error) {
      console.error("[sendEmail] Email send error:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("[sendEmail] Unexpected error:", err.message || err);
    return { success: false, error: err.message || err };
  }
};

module.exports = sendEmail;
