import transporter from "../email.config.js";
import { Verification_Email_Template } from "./verificationEmailTemplate.js";
import { BRANDING } from "../../config/branding.js";

export const sendVerificationCode = async (email, verificationCode) => {
  try {
    await transporter.sendMail({
      from: `"${BRANDING.sender}" <${process.env.NODEMAIL_EMAIL}>`,
      to: email,
      subject: `Your ${BRANDING.shortName} verification code`,
      text: `Your verification code is ${verificationCode}. Enter it in the ${BRANDING.product} to verify your email.`,
      html: Verification_Email_Template.replace("{verificationCode}", verificationCode),
    });

    // console.log("Message sent: %s", response.messageId);
  } catch (error) {
    console.error("Error sending verification code:", error);
  }
};