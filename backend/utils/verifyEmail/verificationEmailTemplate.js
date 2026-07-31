import { BRANDING, codeBlock, emailLayout } from "../../config/branding.js";

/**
 * Email verification code.
 *
 * Stays an exported string rather than a function because the caller in
 * verifyEmail/email.js substitutes `{verificationCode}` itself.
 */
export const Verification_Email_Template = emailLayout({
  heading: "Confirm your email address",
  intro: `Welcome to the ${BRANDING.product}. Enter the code below to verify your email and activate your account.`,
  bodyHtml: codeBlock("{verificationCode}"),
  footNote: `If you didn't request this, you can safely ignore this email. Never share this code with anyone — including staff at ${BRANDING.shortName}.`,
});
