import "server-only";
import { bootstrapAdminEmails, listMembers, notifyAddress } from "./members";
import { sendEmail } from "./email";
import { appUrl, emailLayout, escapeHtml } from "./email-render";
import { formatStay, nights } from "./dates";
import { bookingName } from "./format";
import type { AccessRequest, Booking, Member } from "./types";

/** Shorten a body to a one-line preview for email context. */
function snippet(text: string, max = 140): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length > max ? `${oneLine.slice(0, max - 1)}…` : oneLine;
}

export type BookingEvent = "created" | "updated" | "cancelled";

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
    ? `<p style="margin:10px 0 0;color:#444444;font-size:14px"><strong>Notering:</strong> ${escapeHtml(booking.note)}</p>`
    : "";
  return emailLayout({
    heading: headline,
    subheading: escapeHtml(actor.name),
    accent: actor.color,
    bodyHtml: `
      <p style="margin:0;font-size:16px;color:#111111"><strong>${formatStay(booking.start, booking.end)}</strong></p>
      <p style="margin:6px 0 0;color:#666666;font-size:14px">${n} ${n === 1 ? "natt" : "nätter"}</p>
      ${note}`,
    cta: { label: "Öppna kalendern" },
  });
}

function renderAnnouncementEmail(author: Member, body: string): string {
  return emailLayout({
    heading: "Nytt anslag",
    subheading: escapeHtml(author.name),
    accent: author.color,
    bodyHtml: `<p style="margin:0;white-space:pre-wrap;color:#333333;font-size:15px;line-height:1.6">${escapeHtml(body)}</p>`,
    cta: { label: "Öppna kalendern" },
  });
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
    ? `<p style="margin:10px 0 0;color:#444444;font-size:14px"><strong>Meddelande:</strong> ${escapeHtml(req.message)}</p>`
    : "";
  return emailLayout({
    heading: "Ny åtkomstförfrågan",
    subheading: "Någon vill gå med i stugkalendern",
    bodyHtml: `
      <p style="margin:0;font-size:16px;color:#111111"><strong>${escapeHtml(req.name)}</strong></p>
      <p style="margin:4px 0 0;color:#666666;font-size:14px">${escapeHtml(req.email)}</p>
      ${note}`,
    cta: { label: "Granska i admin", href: `${appUrl()}/admin` },
  });
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
  return emailLayout({
    heading: "Du är inne!",
    subheading: `Hej ${escapeHtml(name)}`,
    bodyHtml: `<p style="margin:0;color:#444444;font-size:15px;line-height:1.6">Din åtkomst till stugkalendern är godkänd. Logga in med Google eller med en e-postkod för att komma igång.</p>`,
    cta: { label: "Logga in", href: `${appUrl()}/signin` },
  });
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

function renderCommentEmail(
  author: Member,
  commentBody: string,
  postSnippet: string,
): string {
  return emailLayout({
    heading: "Ny kommentar",
    subheading: escapeHtml(author.name),
    accent: author.color,
    bodyHtml: `
      <p style="margin:0 0 12px;color:#888888;font-size:13px">På anslaget: <em>${escapeHtml(postSnippet)}</em></p>
      <p style="margin:0;white-space:pre-wrap;color:#333333;font-size:15px;line-height:1.6">${escapeHtml(commentBody)}</p>`,
    cta: { label: "Öppna anslag", href: `${appUrl()}/announcements` },
  });
}

/**
 * Email the people involved in a thread about a new comment: the announcement
 * author plus everyone who has already commented. `recipientEmails` are member
 * login emails; the comment author is excluded and addresses are resolved
 * through each member's notis-e-post.
 */
export async function notifyComment(
  author: Member,
  commentBody: string,
  announcementBody: string,
  recipientEmails: string[],
): Promise<void> {
  const wanted = new Set(recipientEmails);
  wanted.delete(author.email);
  if (wanted.size === 0) return;

  const members = await listMembers();
  const recipients = members
    .filter((m) => m.active && wanted.has(m.email))
    .map(notifyAddress);
  if (recipients.length === 0) return;

  await sendEmail({
    to: recipients,
    subject: `${author.name} kommenterade ett anslag`,
    html: renderCommentEmail(author, commentBody, snippet(announcementBody)),
  });
}
