import transporter from "./email.config.js";
import { ApprovalTnpRequestTemplate, DeclineTnpRequestTemplate } from "./emailTemplate/tnpStatusTemplate.js";
import { BRANDING } from "../config/branding.js";

export const sendTnpStatusEmailApproved = async (doc) => {
  const mailOptions = {
    from: `"${BRANDING.sender}" <${process.env.NODEMAIL_EMAIL}>`,
    to: doc.email,
    subject: "Your recruiter account is approved",
    text: `Dear ${doc.name},\n\nThe ${BRANDING.office} has approved your recruiter account. You can now post openings and review applicants.\n\nBest regards,\n${BRANDING.office}`,
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
    from: `"${BRANDING.sender}" <${process.env.NODEMAIL_EMAIL}>`,
    to: doc.email,
    subject: "About your recruiter account",
    text: `Dear ${doc.name},\n\nAfter review, the ${BRANDING.office} is not able to approve your recruiter account at this time. Please contact ${BRANDING.supportEmail} for further clarification.\n\nBest regards,\n${BRANDING.office}`,
    html: DeclineTnpRequestTemplate(doc.name),
  };
  try {
    await transporter.sendMail(mailOptions);
    // console.log(`Decline email sent to ${doc.email}`);
  } catch (error) {
    console.error("Error sending decline email:", error);
  }
};

