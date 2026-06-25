import "server-only";
import { db, MEMBERS, BOOKINGS } from "./firebase";
import { defaultAvatarFor } from "./avatars";
import { PALETTE } from "./colors";
import { todayStr } from "./dates";
import type { Avatar, Member, Role } from "./types";

// Pleasant, distinct household colors handed out in order as members join.
export const DEFAULT_COLORS = PALETTE;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** The address to send notifications to (alternative email, or the login one). */
export function notifyAddress(m: Member): string {
  return m.notifyEmail?.trim() || m.email;
}

function emailSet(value: string | undefined): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((e) => normalizeEmail(e))
      .filter(Boolean),
  );
}

function adminEmails(): Set<string> {
  return emailSet(process.env.ADMIN_EMAILS);
}

/** Non-admin emails permitted to sign in; auto-provisioned as regular members. */
function allowedEmails(): Set<string> {
  return emailSet(process.env.ALLOWED_EMAILS);
}

/** The role an email is allowlisted for via env vars, or null if not listed. */
export function allowlistRole(email: string): Role | null {
  const n = normalizeEmail(email);
  if (adminEmails().has(n)) return "admin";
  if (allowedEmails().has(n)) return "member";
  return null;
}

export async function getMember(email: string): Promise<Member | null> {
  const snap = await db.collection(MEMBERS).doc(normalizeEmail(email)).get();
  return snap.exists ? (snap.data() as Member) : null;
}

export async function listMembers(): Promise<Member[]> {
  const snap = await db.collection(MEMBERS).orderBy("name").get();
  return snap.docs.map((d) => d.data() as Member);
}

/** Distinct, non-empty household names — for the "join an existing family" picker. */
export async function listHouseholds(): Promise<string[]> {
  const members = await listMembers();
  return Array.from(
    new Set(members.map((m) => m.household?.trim()).filter((h): h is string => !!h)),
  ).sort((a, b) => a.localeCompare(b));
}

async function pickColor(): Promise<string> {
  const members = await listMembers();
  const used = new Set(members.map((m) => m.color));
  return DEFAULT_COLORS.find((c) => !used.has(c)) ?? DEFAULT_COLORS[members.length % DEFAULT_COLORS.length];
}

export interface CreateMemberInput {
  email: string;
  name: string;
  household?: string;
  color?: string;
  role?: Role;
}

export async function createMember(input: CreateMemberInput): Promise<Member> {
  const email = normalizeEmail(input.email);
  const now = Date.now();
  const member: Member = {
    email,
    notifyEmail: "",
    name: input.name.trim() || email,
    // Household is optional — members choose/create their family themselves.
    household: (input.household ?? "").trim(),
    color: input.color ?? (await pickColor()),
    role: input.role ?? "member",
    active: true,
    avatar: { type: "preset", value: defaultAvatarFor(email) },
    createdAt: now,
    updatedAt: now,
  };
  await db.collection(MEMBERS).doc(email).set(member);
  return member;
}

export async function updateMember(
  email: string,
  patch: Partial<
    Pick<
      Member,
      "name" | "notifyEmail" | "household" | "color" | "role" | "active" | "avatar"
    >
  >,
): Promise<void> {
  await db
    .collection(MEMBERS)
    .doc(normalizeEmail(email))
    .set({ ...patch, updatedAt: Date.now() }, { merge: true });
}

export async function setAvatar(email: string, avatar: Avatar): Promise<void> {
  await updateMember(email, { avatar });
}

/**
 * Hard-remove a member: deletes their record and cancels their upcoming
 * bookings (past stays are kept for history). Run as one batch.
 */
export async function removeMember(email: string): Promise<void> {
  const e = normalizeEmail(email);
  const today = todayStr();
  const bookings = await db
    .collection(BOOKINGS)
    .where("memberEmail", "==", e)
    .get();

  const batch = db.batch();
  for (const doc of bookings.docs) {
    if ((doc.data().end ?? "") > today) batch.delete(doc.ref);
  }
  batch.delete(db.collection(MEMBERS).doc(e));
  await batch.commit();
}

/**
 * Resolve the member record at sign-in time, enforcing the allowlist.
 * Auto-provisions an admin record for any email listed in ADMIN_EMAILS so the
 * first family admin can get in before any member exists. Returns null when
 * the email is not allowed (no record and not a bootstrap admin), or inactive.
 */
export async function resolveMemberForAuth(
  email: string,
  name?: string | null,
): Promise<Member | null> {
  const normalized = normalizeEmail(email);
  const existing = await getMember(normalized);
  if (existing) return existing.active ? existing : null;

  if (adminEmails().has(normalized)) {
    return createMember({
      email: normalized,
      name: name ?? normalized.split("@")[0],
      role: "admin",
    });
  }
  if (allowedEmails().has(normalized)) {
    return createMember({
      email: normalized,
      name: name ?? normalized.split("@")[0],
      role: "member",
    });
  }
  return null;
}

/**
 * Dev-only: ensure a member exists for any email, auto-provisioning one if
 * missing (admin if listed in ADMIN_EMAILS, otherwise a regular member).
 * Used by the dev login to let you sign in as anyone without the allowlist.
 */
export async function ensureMember(
  email: string,
  name?: string | null,
): Promise<Member> {
  const normalized = normalizeEmail(email);
  const existing = await getMember(normalized);
  if (existing) return existing;
  return createMember({
    email: normalized,
    name: name ?? normalized.split("@")[0],
    role: adminEmails().has(normalized) ? "admin" : "member",
  });
}
