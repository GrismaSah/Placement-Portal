import { BRANDING, detailRows, emailLayout } from "../config/branding.js";

/** Package figure in Indian conventions — "₹12.5 L", not "1250000". */
const money = (n) => {
  if (!n) return null;
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  return `₹${Number(n).toLocaleString("en-IN")}`;
};

export const NewJobPostedNotificationTemplate = (doc, studentName) => {
  const salary =
    money(doc?.fixedSalary) ||
    (doc?.salaryFrom && doc?.salaryTo
      ? `${money(doc.salaryFrom)} – ${money(doc.salaryTo)}`
      : null);

  const rows = [
    ["Company", doc?.company],
    ["Role", doc?.title],
    ["Location", [doc?.city, doc?.country].filter(Boolean).join(", ")],
    ["Category", doc?.category],
    salary ? ["Package", salary] : null,
    doc?.applicationDeadline
      ? [
          "Apply by",
          new Date(doc.applicationDeadline).toLocaleDateString("en-IN", {
            dateStyle: "medium",
          }),
        ]
      : null,
  ].filter(Boolean);

  return emailLayout({
    heading: `${doc?.company} is hiring: ${doc?.title}`,
    intro: `Dear ${studentName || "student"}, a new opening has just been posted on the ${BRANDING.product}.`,
    bodyHtml: detailRows(rows),
    // Deep-links to the actual posting. The previous template pointed at a
    // PLACEMENT_WEBSITE_URL env var that is not set anywhere in the project,
    // so the button rendered as href="undefined".
    cta: {
      label: "View and apply",
      url: `${BRANDING.portalUrl}/app/jobs/${doc?._id ?? ""}`,
    },
    footNote:
      "You're receiving this because you're registered as a student on the portal.",
  });
};
