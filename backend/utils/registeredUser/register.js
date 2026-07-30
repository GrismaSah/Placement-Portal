import { Register_Successful_Template } from "../RegisterSuccessfulTemplate.js";
import transporter from "../email.config.js";

export const sentRegisteredEmail = async (doc) => {
  const mailOptions = {
    from: `"NITA-PLACEMENT-CELL" <${process.env.NODEMAIL_EMAIL}>`,
    to: doc.email,
    subject: "Account Created",
    text: `Hello ${doc.name},\n\nYour account has been successfully created. You can now access all our features and resources.\n\nRegards,\nTeam NITA Placement Cell`,
    html: Register_Successful_Template(doc),
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
};
