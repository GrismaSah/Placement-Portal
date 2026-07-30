import transporter from "../email.config.js";
import { Verification_Email_Template } from "./verificationEmailTemplate.js";


export const sendVerificationCode = async (email, verificationCode) => {
    // console.log("Sending verification code to:", email);
    // console.log("Verification code:", verificationCode);
  try {
    const response = await transporter.sendMail({
      from: `"NITA-PLACEMENT-CELL" <${process.env.NODEMAIL_EMAIL}>`, // sender address
      to: email, // list of receivers
      subject: "Verify Your Email", // Subject line
      text: "Verify Your Email", // plain text body
      
      html: Verification_Email_Template.replace("{verificationCode}", verificationCode), // html body
    });

    // console.log("Message sent: %s", response.messageId);
  } catch (error) {
    console.error("Error sending verification code:", error);
  }
};