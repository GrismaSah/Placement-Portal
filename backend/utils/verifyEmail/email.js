import transporter from "../email.config.js";
import { Verification_Email_Template } from "./verificationEmailTemplate.js";
import { BRANDING } from "../../config/branding.js";

/** True only when SMTP credentials are actually present. */
export const emailConfigured = () =>
  Boolean(process.env.NODEMAIL_EMAIL && process.env.NODEMAIL_PASSWORD);

/**
 * Send a verification code.
 *
 * Returns whether it was actually delivered instead of swallowing the result.
 * The previous version logged failures and returned nothing, so registration
 * reported "check your inbox" even when no mail server was configured and no
 * email could ever arrive — leaving the account permanently unverifiable with
 * no signal to the user or the operator.
 */
export const sendVerificationCode = async (email, verificationCode) => {
  if (!emailConfigured()) {
    // Visible to the project owner in the platform logs, so an account can
    // still be activated manually while SMTP is being set up.
    console.warn(
      `[email] SMTP not configured — cannot deliver a code to ${email}. ` +
        `Set NODEMAIL_EMAIL and NODEMAIL_PASSWORD.`
    );
    return { sent: false, reason: "not-configured" };
  }

  try {
    await transporter.sendMail({
      from: `"${BRANDING.sender}" <${process.env.NODEMAIL_EMAIL}>`,
      to: email,
      subject: `Your ${BRANDING.shortName} verification code`,
      text: `Your verification code is ${verificationCode}. Enter it in the ${BRANDING.product} to verify your email.`,
      html: Verification_Email_Template.replace(
        "{verificationCode}",
        verificationCode
      ),
    });
    return { sent: true };
  } catch (error) {
    console.error("[email] Failed to send verification code:", error.message);
    return { sent: false, reason: "send-failed" };
  }
};
