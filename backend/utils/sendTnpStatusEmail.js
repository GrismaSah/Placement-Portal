import transporter from "./email.config.js";
import { ApprovalTnpRequestTemplate, DeclineTnpRequestTemplate } from "./emailTemplate/tnpStatusTemplate.js";

export const sendTnpStatusEmailApproved = async (doc) => {
  const mailOptions = {
    from: `"NITA-PLACEMENT-CELL" <${process.env.NODEMAIL_EMAIL}>`,
    to: doc.email,
    subject: "TNP Request Approved",
    text: `Dear ${doc.name},\n\nYour TNP request has been approved. Please proceed with the next steps or contact the TPO for further guidance.\n\nBest regards,\nNITA Placement Cell`,
    html: ApprovalTnpRequestTemplate(doc.name),
  };
  try {
    await transporter.sendMail(mailOptions);
    // console.log(`Approval email sent to ${doc.email}`);
  } catch (error) {
    console.error("Error sending approval email:", error);
  }
};


export const sendTnpStatusEmailDeclined = async (doc) => {
  const mailOptions = {
    from: `"NITA-PLACEMENT-CELL" <${process.env.NODEMAIL_EMAIL}>`,
    to: doc.email,
    subject: "TNP Request Declined",
    text: `Dear ${doc.name},\n\nWe regret to inform you that your TNP request has been declined. Please contact the TPO for further clarification.\n\nBest regards,\nNITA Placement Cell`,
    html: DeclineTnpRequestTemplate(doc.name),
  };
  try {
    await transporter.sendMail(mailOptions);
    // console.log(`Decline email sent to ${doc.email}`);
  } catch (error) {
    console.error("Error sending decline email:", error);
  }
};

