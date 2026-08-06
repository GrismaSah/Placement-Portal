/**
 * Institutional identity for everything the backend sends out.
 *
 * The portal was built for a different institution and that branding was
 * hardcoded across eight email templates and four sender strings. Anything
 * user-visible must come from here. Mirrors frontend/src/constants/brand.js.
 */

export const BRANDING = {
  name: "JAIN (Deemed-to-be University)",
  shortName: "JAIN",
  office: "JAIN Training & Placement Office",
  sender: "JAIN-PLACEMENT-CELL",
  product: "JAIN Placement Portal",

  supportEmail: process.env.SUPPORT_EMAIL || "placements@jainuniversity.ac.in",
  website: "https://www.jainuniversity.ac.in",
  // Students must register with <enrollment>@<this domain> — ties every
  // account to a real institutional mailbox instead of an arbitrary address.
  studentEmailDomain: "jainuniversity.ac.in",
  portalUrl: process.env.FRONTEND_URL || "http://localhost:5173",

  address:
    "#44/4, District Fund Road, Jayanagar 9th Block, Bengaluru, Karnataka 560069",

  colors: {
    navy: "#111E42",
    navyDeep: "#0A1330",
    gold: "#F6C100",
    ink: "#1E1916",
    muted: "#525579",
    hairline: "#E4E5E9",
    surface: "#FFFFFF",
    canvas: "#F4F6FA",
    success: "#067A55",
    danger: "#B42318",
  },
};

const { colors: c } = BRANDING;

/**
 * One HTML shell for every transactional email.
 *
 * Table-based and fully inline-styled on purpose — Outlook and Gmail strip
 * <style> blocks and do not support flex or grid. The previous templates each
 * invented their own layout and colour (#007bff, #4CAF50, #d9534f), so a user
 * received four differently-branded emails from the same portal.
 */
export function emailLayout({ heading, intro, bodyHtml = "", cta, footNote }) {
  const ctaHtml = cta
    ? `<tr><td style="padding:8px 0 4px;">
         <a href="${cta.url}" style="display:inline-block;background:${c.gold};color:${c.navy};font-weight:700;font-size:15px;text-decoration:none;padding:13px 28px;border-radius:10px;">${cta.label}</a>
       </td></tr>`
    : "";

  const footNoteHtml = footNote
    ? `<tr><td style="padding-top:18px;font-size:13px;line-height:20px;color:${c.muted};">${footNote}</td></tr>`
    : "";

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${heading}</title></head>
<body style="margin:0;padding:0;background:${c.canvas};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.canvas};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${c.surface};border-radius:16px;overflow:hidden;border:1px solid ${c.hairline};font-family:Helvetica,Arial,sans-serif;">

        <!-- Header -->
        <tr><td style="background:${c.navy};padding:28px 32px;">
          <span style="color:#FFFFFF;font-size:26px;font-weight:800;letter-spacing:1.5px;">JAIN</span><span style="color:${c.gold};font-size:26px;font-weight:800;">.</span>
          <div style="color:rgba(255,255,255,0.65);font-size:10px;letter-spacing:2.4px;font-weight:600;margin-top:4px;">DEEMED-TO-BE UNIVERSITY</div>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="font-size:21px;line-height:28px;font-weight:700;color:${c.ink};padding-bottom:12px;">${heading}</td></tr>
            ${intro ? `<tr><td style="font-size:15px;line-height:24px;color:${c.muted};padding-bottom:20px;">${intro}</td></tr>` : ""}
            ${bodyHtml ? `<tr><td style="padding-bottom:20px;">${bodyHtml}</td></tr>` : ""}
            ${ctaHtml}
            ${footNoteHtml}
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:${c.canvas};padding:22px 32px;border-top:1px solid ${c.hairline};">
          <div style="font-size:13px;font-weight:600;color:${c.ink};">${BRANDING.office}</div>
          <div style="font-size:12px;line-height:19px;color:${c.muted};margin-top:5px;">${BRANDING.address}</div>
          <div style="font-size:12px;color:${c.muted};margin-top:10px;">
            Questions? <a href="mailto:${BRANDING.supportEmail}" style="color:${c.navy};">${BRANDING.supportEmail}</a>
          </div>
        </td></tr>

      </table>
      <div style="max-width:560px;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:${c.muted};padding:16px 8px;text-align:center;">
        You are receiving this because you have an account on the ${BRANDING.product}.
      </div>
    </td></tr>
  </table>
</body></html>`;
}

/** Big monospaced digits for verification codes. */
export function codeBlock(code) {
  return `<div style="background:${c.canvas};border:1px dashed ${c.hairline};border-radius:12px;padding:18px;text-align:center;">
    <div style="font-family:'Courier New',monospace;font-size:32px;font-weight:700;letter-spacing:9px;color:${c.navy};">${code}</div>
  </div>`;
}

/** Label/value rows, used by the job-posted and status emails. */
export function detailRows(rows) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${c.hairline};border-radius:12px;">
    ${rows
      .map(
        ([label, value], i) => `<tr>
      <td style="padding:12px 16px;font-size:13px;color:${c.muted};${i ? `border-top:1px solid ${c.hairline};` : ""}">${label}</td>
      <td style="padding:12px 16px;font-size:14px;font-weight:600;color:${c.ink};text-align:right;${i ? `border-top:1px solid ${c.hairline};` : ""}">${value}</td>
    </tr>`
      )
      .join("")}
  </table>`;
}

export default BRANDING;
