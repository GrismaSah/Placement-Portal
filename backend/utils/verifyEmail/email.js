import transporter from "../email.config.js";
import { Verification_Email_Template } from "./verificationEmailTemplate.js";
import { BRANDING } from "../../config/branding.js";

/** True only when SMTP credentials are actually present. Module-local. */
const emailConfigured = () =>
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
    // The code itself has to be in here. Recruiter and Admin sign-in mints a
    // fresh code and clears it on use, so if an undeliverable code were only
    // announced and never shown, those accounts would be permanently
    // unreachable rather than merely inconvenienced. This is the documented
    // fallback (see .env.example) and the only recovery path without SMTP.
    // It does mean a live code reaches the log — acceptable only because it
    // happens solely when the alternative is a locked-out account.
    console.warn(
      `[email] SMTP not configured — cannot deliver a code to ${email}. ` +
        `Set NODEMAIL_EMAIL and NODEMAIL_PASSWORD. Code: ${verificationCode}`
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
    // Same reasoning as the not-configured branch: a code that was minted but
    // could not be delivered still has to be recoverable by the operator.
    console.error(
      `[email] Failed to send verification code to ${email}: ${error.message}. ` +
        `Code: ${verificationCode}`
    );
    return { sent: false, reason: "send-failed" };
  }
};
