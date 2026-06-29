import "server-only";
import { randomInt } from "node:crypto";
import { db, LOGIN_CODES } from "./firebase";
import { normalizeEmail } from "./members";
import { sendEmail } from "./email";
import { emailLayout } from "./email-render";

// One-time login codes for passwordless email sign-in. The code is never stored
// in the clear — only a bcrypt hash, keyed by email, alongside an expiry and an
// attempt counter. Codes are short-lived and single-use.
const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/**
 * Create a fresh login code for an email, store its hash (replacing any prior
 * code), and return the plaintext to be emailed. In dev the code is logged so
 * you can sign in without a configured mail provider.
 */
export async function createLoginCode(email: string): Promise<string> {
  const e = normalizeEmail(email);
  const code = generateCode();
  const bcrypt = await import("bcryptjs");
  const codeHash = await bcrypt.hash(code, 10);
  await db.collection(LOGIN_CODES).doc(e).set({
    codeHash,
    expiresAt: Date.now() + CODE_TTL_MS,
    attempts: 0,
    createdAt: Date.now(),
  });
  if (process.env.NODE_ENV !== "production") {
    console.info(`[login code] ${e} → ${code}`);
  }
  return code;
}

/**
 * Verify a submitted code: enforces expiry and the attempt cap, compares the
 * hash, and consumes the code on success. Returns true only for a valid, live
 * code; a wrong code burns one attempt.
 */
export async function verifyLoginCode(
  email: string,
  code: string,
): Promise<boolean> {
  const ref = db.collection(LOGIN_CODES).doc(normalizeEmail(email));
  const snap = await ref.get();
  if (!snap.exists) return false;
  const data = snap.data() as {
    codeHash: string;
    expiresAt: number;
    attempts: number;
  };

  if (Date.now() > data.expiresAt || data.attempts >= MAX_ATTEMPTS) {
    await ref.delete();
    return false;
  }

  const bcrypt = await import("bcryptjs");
  if (await bcrypt.compare(code, data.codeHash)) {
    await ref.delete();
    return true;
  }
  await ref.update({ attempts: data.attempts + 1 });
  return false;
}

/** Email a login code to the member. */
export async function sendLoginCodeEmail(
  email: string,
  code: string,
): Promise<void> {
  const html = emailLayout({
    heading: "Din inloggningskod",
    subheading: "Ange koden nedan för att logga in. Den gäller i 10 minuter.",
    bodyHtml: `
      <div style="margin:4px 0 0;background:#f6f6f4;border:1px solid #ececec;border-radius:10px;padding:18px;text-align:center">
        <span style="font-size:30px;font-weight:700;letter-spacing:8px;color:#111111;font-family:ui-monospace,SFMono-Regular,Menlo,monospace">${code}</span>
      </div>
      <p style="margin:14px 0 0;font-size:12px;color:#999999">Ange koden på sidan där du angav din e-post. Bad du inte om koden kan du ignorera mejlet.</p>`,
  });
  await sendEmail({
    to: [email],
    subject: "Din inloggningskod till Hoelskogen 52",
    html,
  });
}
