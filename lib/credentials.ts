import "server-only";
import { db } from "./firebase";
import { normalizeEmail } from "./members";

// Password hashes live in their own collection, keyed by email — NEVER on the
// member document (member docs are sent to the client, so a hash there would
// leak). bcrypt is imported lazily to keep module load light.
const CREDENTIALS = "credentials";

export async function setPassword(email: string, plain: string): Promise<void> {
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(plain, 10);
  await db
    .collection(CREDENTIALS)
    .doc(normalizeEmail(email))
    .set({ passwordHash, updatedAt: Date.now() });
}

export async function hasPassword(email: string): Promise<boolean> {
  const snap = await db.collection(CREDENTIALS).doc(normalizeEmail(email)).get();
  return snap.exists && Boolean(snap.data()?.passwordHash);
}

export async function verifyPassword(
  email: string,
  plain: string,
): Promise<boolean> {
  const snap = await db.collection(CREDENTIALS).doc(normalizeEmail(email)).get();
  const hash = snap.exists ? (snap.data()?.passwordHash as string) : null;
  if (!hash) return false;
  const bcrypt = await import("bcryptjs");
  return bcrypt.compare(plain, hash);
}
