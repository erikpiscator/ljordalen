import "server-only";
import { db, MEMBERS } from "./firebase";
import { listMembers } from "./members";
import { PALETTE } from "./colors";

// Households own a color; every member of a household shares it. Stored in a
// `households` collection keyed by a normalized (case-insensitive) name.
const HOUSEHOLDS = "households";

export function householdKey(name: string): string {
  return encodeURIComponent(name.trim().toLowerCase());
}

async function pickColor(): Promise<string> {
  const snap = await db.collection(HOUSEHOLDS).get();
  const used = new Set(
    snap.docs.map((d) => (d.data() as { color?: string }).color),
  );
  return PALETTE.find((c) => !used.has(c)) ?? PALETTE[snap.size % PALETTE.length];
}

/** Get the household's color, creating the household (with a fresh color) if new. */
export async function ensureHouseholdColor(name: string): Promise<string> {
  const k = householdKey(name);
  if (!k) return PALETTE[0];
  const ref = db.collection(HOUSEHOLDS).doc(k);
  const snap = await ref.get();
  const existing = snap.exists
    ? (snap.data() as { color?: string }).color
    : undefined;
  if (existing) return existing;
  const color = await pickColor();
  await ref.set({ name: name.trim(), color }, { merge: true });
  return color;
}

/** Set a household's color and apply it to all its members. */
export async function setHouseholdColor(
  name: string,
  color: string,
): Promise<void> {
  const k = householdKey(name);
  if (!k) return;
  await db
    .collection(HOUSEHOLDS)
    .doc(k)
    .set({ name: name.trim(), color }, { merge: true });

  const members = await listMembers();
  const batch = db.batch();
  const now = Date.now();
  for (const m of members) {
    if (householdKey(m.household) === k) {
      batch.update(db.collection(MEMBERS).doc(m.email), {
        color,
        updatedAt: now,
      });
    }
  }
  await batch.commit();
}
