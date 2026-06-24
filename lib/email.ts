import "server-only";
import { Resend } from "resend";

// Thin Resend wrapper. If RESEND_API_KEY / RESEND_FROM are not configured the
// app still works — emails are simply skipped (and logged in dev).
const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM;

const client = apiKey ? new Resend(apiKey) : null;

export function emailEnabled(): boolean {
  return Boolean(client && from);
}

export interface SendArgs {
  to: string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendArgs): Promise<void> {
  const recipients = Array.from(new Set(to.filter(Boolean)));
  if (recipients.length === 0) return;

  if (!client || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[email skipped] "${subject}" → ${recipients.join(", ")}`);
    }
    return;
  }

  try {
    await client.emails.send({ from, to: recipients, subject, html });
  } catch (err) {
    // Never let a notification failure break a booking.
    console.error("Failed to send email:", err);
  }
}
