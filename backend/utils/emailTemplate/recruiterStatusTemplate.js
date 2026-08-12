import { BRANDING, emailLayout } from "../../config/branding.js";

/**
 * Recruiter approval / decline notices.
 *
 * Both now render through the shared JAIN layout. Each template previously
 * carried its own colour scheme (#5cb85c, #d9534f) and signed off as a
 * different institution's placement cell.
 */

export const ApprovalRecruiterRequestTemplate = (recruiterName) =>
  emailLayout({
    heading: "Your recruiter account is approved",
    intro: `Dear ${recruiterName}, the ${BRANDING.office} has approved your recruiter account. You can now post openings and review applicants.`,
    bodyHtml: `<ul style="margin:0;padding-left:20px;font-size:15px;line-height:26px;color:${BRANDING.colors.muted};">
      <li>Post a role with eligibility criteria and a closing date</li>
      <li>Review applicants and open their resumes inline</li>
      <li>Move candidates through shortlisting, interview and offer</li>
    </ul>`,
    cta: { label: "Go to the portal", url: `${BRANDING.portalUrl}/app/dashboard` },
  });

export const DeclineRecruiterRequestTemplate = (recruiterName) =>
  emailLayout({
    heading: "About your recruiter account",
    intro: `Dear ${recruiterName}, after review the ${BRANDING.office} is not able to approve your recruiter account at this time.`,
    footNote: `If you believe this was in error, or would like to provide further details about your organisation, reply to this email or contact us at ${BRANDING.supportEmail}.`,
  });
