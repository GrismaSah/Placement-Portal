import { Register_Successful_Template } from "../RegisterSuccessfulTemplate.js";
import transporter from "../email.config.js";
import { BRANDING } from "../../config/branding.js";

export const sentRegisteredEmail = async (doc) => {
  const mailOptions = {
    from: `"${BRANDING.sender}" <${process.env.NODEMAIL_EMAIL}>`,
    to: doc.email,
    subject: `Welcome to the ${BRANDING.product}`,
    text: `Hello ${doc.name},\n\nYour ${BRANDING.product} account has been created. You can sign in and get started right away.\n\nRegards,\n${BRANDING.office}`,
    html: Register_Successful_Template(doc),
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
};
