"use server";
import { getMember, normalizeEmail } from "@/lib/members";
import { createLoginCode, sendLoginCodeEmail } from "@/lib/login-codes";

// `unknown` lets the email-first UI fall through to the request-access flow.
// Like the old lookup, this discloses membership to an unauthenticated caller —
// an accepted trade-off for a private family site (see lib/login-codes.ts).
export type RequestCodeResult =
  | { status: "sent" }
  | { status: "unknown" }
  | { status: "invalid" };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Email a one-time login code to an active member; never grants access itself. */
export async function requestLoginCodeAction(
  emailInput: string,
): Promise<RequestCodeResult> {
  const email = normalizeEmail(emailInput);
  if (!EMAIL_RE.test(email)) return { status: "invalid" };

  const member = await getMember(email);
  if (!member || !member.active) return { status: "unknown" };

  const code = await createLoginCode(email);
  await sendLoginCodeEmail(email, code);
  return { status: "sent" };
}
