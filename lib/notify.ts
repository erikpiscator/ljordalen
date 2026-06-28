import "server-only";
import { bootstrapAdminEmails, listMembers, notifyAddress } from "./members";
import { sendEmail } from "./email";
import { formatStay, nights } from "./dates";
import { bookingName } from "./format";
import type { AccessRequest, Booking, Member } from "./types";

export type BookingEvent = "created" | "updated" | "cancelled";

function appUrl(): string {
  return (process.env.APP_URL || process.env.AUTH_URL || "http://localhost:3000")
    .replace(/\/$/, "");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function button(): string {
  return `<p style="margin:20px 0 0">
    <a href="${appUrl()}" style="background:#111;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:14px">Öppna kalendern</a>
  </p>`;
}

function renderBookingEmail(
  event: BookingEvent,
  booking: Booking,
  actor: Member,
): string {
  const who = bookingName(actor, actor.name);
  const headline =
    event === "created"
      ? `${who} bokade stugan`
      : event === "updated"
        ? `${who} ändrade en bokning`
        : `${who} avbokade en bokning`;
  const n = nights(booking.start, booking.end);
  const note = booking.note
    ? `<p style="margin:8px 0;color:#444"><strong>Notering:</strong> ${escapeHtml(booking.note)}</p>`
    : "";
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto">
    <div style="border-left:4px solid ${actor.color};padding:4px 16px;margin-bottom:16px">
      <h2 style="margin:0 0 4px;font-size:18px;color:#111">${headline}</h2>
      <p style="margin:0;color:#666;font-size:14px">${escapeHtml(actor.name)}</p>
    </div>
    <p style="margin:8px 0;font-size:16px;color:#111"><strong>${formatStay(booking.start, booking.end)}</strong></p>
    <p style="margin:8px 0;color:#444">${n} ${n === 1 ? "natt" : "nätter"}</p>
    ${note}
    ${button()}
  </div>`;
}

function renderAnnouncementEmail(author: Member, body: string): string {
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto">
    <div style="border-left:4px solid ${author.color};padding:4px 16px;margin-bottom:16px">
      <h2 style="margin:0 0 4px;font-size:18px;color:#111">Nytt anslag</h2>
      <p style="margin:0;color:#666;font-size:14px">${escapeHtml(author.name)}</p>
    </div>
    <p style="margin:8px 0;white-space:pre-wrap;color:#222">${escapeHtml(body)}</p>
    ${button()}
  </div>`;
}

/** Email all other active members about a booking change. */
export async function notifyBooking(
  event: BookingEvent,
  booking: Booking,
  actor: Member,
): Promise<void> {
  const members = await listMembers();
  const recipients = members
    .filter((m) => m.active && m.email !== actor.email)
    .map(notifyAddress);
  if (recipients.length === 0) return;

  const who = bookingName(actor, actor.name);
  const verb =
    event === "created" ? "bokade" : event === "updated" ? "ändrade" : "avbokade";
  await sendEmail({
    to: recipients,
    subject: `${who} ${verb} stugan — ${formatStay(booking.start, booking.end)}`,
    html: renderBookingEmail(event, booking, actor),
  });
}

/**
 * The addresses to notify when someone requests access. Active admins' notify
 * addresses (respecting each admin's notis-e-post), or — only before any admin
 * member exists — the bootstrap ADMIN_EMAILS so the very first admin is still
 * reachable. The env list is a fallback, not an addition, so an admin who set a
 * notis-e-post isn't also emailed at their login address.
 */
async function adminRecipients(): Promise<string[]> {
  const members = await listMembers();
  const admins = members.filter((m) => m.active && m.role === "admin");
  if (admins.length > 0) {
    return Array.from(new Set(admins.map(notifyAddress)));
  }
  return bootstrapAdminEmails();
}

function renderAccessRequestEmail(req: AccessRequest): string {
  const note = req.message
    ? `<p style="margin:8px 0;color:#444"><strong>Meddelande:</strong> ${escapeHtml(req.message)}</p>`
    : "";
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto">
    <div style="border-left:4px solid #111;padding:4px 16px;margin-bottom:16px">
      <h2 style="margin:0 0 4px;font-size:18px;color:#111">Ny åtkomstförfrågan</h2>
      <p style="margin:0;color:#666;font-size:14px">Någon vill gå med i stugkalendern</p>
    </div>
    <p style="margin:8px 0;font-size:16px;color:#111"><strong>${escapeHtml(req.name)}</strong></p>
    <p style="margin:8px 0;color:#444">${escapeHtml(req.email)}</p>
    ${note}
    <p style="margin:16px 0 0;color:#666;font-size:13px">Godkänn eller avvisa under Admin → Förfrågningar.</p>
    ${button()}
  </div>`;
}

/** Email the admins that someone has requested access. */
export async function notifyAccessRequest(req: AccessRequest): Promise<void> {
  const recipients = await adminRecipients();
  if (recipients.length === 0) return;
  await sendEmail({
    to: recipients,
    subject: `Åtkomstförfrågan från ${req.name}`,
    html: renderAccessRequestEmail(req),
  });
}

function renderAccessApprovedEmail(name: string): string {
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto">
    <div style="border-left:4px solid #111;padding:4px 16px;margin-bottom:16px">
      <h2 style="margin:0 0 4px;font-size:18px;color:#111">Du är inne!</h2>
      <p style="margin:0;color:#666;font-size:14px">Hej ${escapeHtml(name)}</p>
    </div>
    <p style="margin:8px 0;color:#444">Din åtkomst till stugkalendern är godkänd. Logga in med Google eller med en e-postkod för att komma igång.</p>
    ${button()}
  </div>`;
}

/** Tell a requester their access was approved and they can sign in now. */
export async function notifyAccessApproved(
  email: string,
  name: string,
): Promise<void> {
  await sendEmail({
    to: [email],
    subject: "Din åtkomst till Hoelskogen 52 är godkänd",
    html: renderAccessApprovedEmail(name),
  });
}

/** Email all other active members about a new announcement. */
export async function notifyAnnouncement(
  author: Member,
  body: string,
): Promise<void> {
  const members = await listMembers();
  const recipients = members
    .filter((m) => m.active && m.email !== author.email)
    .map(notifyAddress);
  if (recipients.length === 0) return;

  await sendEmail({
    to: recipients,
    subject: `Nytt anslag från ${author.name}`,
    html: renderAnnouncementEmail(author, body),
  });
}
