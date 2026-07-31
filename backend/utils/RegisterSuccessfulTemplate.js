import { BRANDING, emailLayout } from "../config/branding.js";

export const Register_Successful_Template = (doc) =>
  emailLayout({
    heading: "Your account is ready",
    intro: `Dear ${doc?.firstname || doc?.name}, your ${BRANDING.product} account has been created. You can sign in and get started right away.`,
    bodyHtml: `<ul style="margin:0;padding-left:20px;font-size:15px;line-height:26px;color:${BRANDING.colors.muted};">
      <li>Complete your profile and build your resume</li>
      <li>Browse verified openings from our recruiting partners</li>
      <li>Track every application from submission to offer</li>
    </ul>`,
    cta: { label: "Go to the portal", url: `${BRANDING.portalUrl}/app/dashboard` },
    footNote: "This is an automated message — please don't reply to it.",
  });
