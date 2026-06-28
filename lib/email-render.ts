import "server-only";

// Shared, branded HTML shell for every email the app sends, so they all look
// like they come from the same place. Email clients are picky — inline styles
// only, light background, a max-width card. Keep colors literal (no CSS vars).

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function appUrl(): string {
  return (process.env.APP_URL || process.env.AUTH_URL || "http://localhost:3000")
    .replace(/\/$/, "");
}

export interface EmailLayoutOpts {
  /** Big line at the top of the card body. */
  heading: string;
  /** Muted line under the heading (already-escaped or plain text). */
  subheading?: string;
  /** Hex color for the left accent bar (e.g. a member's color). */
  accent?: string;
  /** Pre-built, safe HTML for the message body. */
  bodyHtml: string;
  /** Optional call-to-action button; href defaults to the app root. */
  cta?: { label: string; href?: string };
}

export function emailLayout({
  heading,
  subheading,
  accent,
  bodyHtml,
  cta,
}: EmailLayoutOpts): string {
  const bar = accent ?? "#111827";
  const button = cta
    ? `<a href="${cta.href ?? appUrl()}" style="display:inline-block;margin-top:20px;background:#111111;color:#ffffff;text-decoration:none;padding:11px 18px;border-radius:8px;font-size:14px;font-weight:500">${escapeHtml(cta.label)}</a>`
    : "";
  return `
<div style="background:#f4f3ee;padding:24px 12px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #ececec;border-radius:14px;overflow:hidden">
    <div style="padding:18px 24px;border-bottom:1px solid #f1f1f1">
      <p style="margin:0;font-size:15px;font-weight:700;color:#111111;letter-spacing:-0.01em">Hoelskogen 52</p>
      <p style="margin:2px 0 0;font-size:12px;color:#9a9a9a">Ljørdalen</p>
    </div>
    <div style="padding:24px;border-left:3px solid ${bar}">
      <h1 style="margin:0 0 ${subheading ? "2px" : "12px"};font-size:18px;color:#111111">${escapeHtml(heading)}</h1>
      ${subheading ? `<p style="margin:0 0 14px;font-size:14px;color:#777777">${subheading}</p>` : ""}
      ${bodyHtml}
      ${button}
    </div>
    <div style="padding:14px 24px;border-top:1px solid #f1f1f1">
      <p style="margin:0;font-size:12px;color:#a8a8a8">Du får det här mejlet eftersom du är med i Hoelskogen 52:s stugkalender.</p>
    </div>
  </div>
</div>`;
}
