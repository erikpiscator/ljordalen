"use server";
import {
  allowlistRole,
  createMember,
  getMember,
  normalizeEmail,
} from "@/lib/members";
import { hasPassword, setPassword } from "@/lib/credentials";

export type Result = { ok: true } | { ok: false; error: string };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Create a password for an allowlisted email. Works whether the member already
 * exists (e.g. added by an admin / via Google) or is new but on the allowlist.
 * Sign-in itself is handled by the NextAuth "password" provider.
 */
export async function signUpWithPasswordAction(input: {
  name: string;
  email: string;
  password: string;
}): Promise<Result> {
  const email = normalizeEmail(input.email);
  const name = input.name.trim();
  const password = input.password;

  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Ange en giltig e-postadress." };
  }
  if (!name) return { ok: false, error: "Ange ditt namn." };
  if (password.length < 8) {
    return { ok: false, error: "Lösenordet måste vara minst 8 tecken." };
  }

  const existing = await getMember(email);
  const role = existing ? existing.role : allowlistRole(email);
  if (!existing && role === null) {
    return {
      ok: false,
      error: "Den här e-posten är inte inbjuden. Be administratören lägga till dig.",
    };
  }
  if (await hasPassword(email)) {
    return { ok: false, error: "Det finns redan ett konto. Logga in i stället." };
  }

  if (!existing) {
    await createMember({ email, name, role: role ?? "member" });
  }
  await setPassword(email, password);
  return { ok: true };
}
