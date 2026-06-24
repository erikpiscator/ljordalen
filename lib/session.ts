import "server-only";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { getMember } from "./members";
import type { Member } from "./types";

/** The signed-in member's full record, or null if not signed in. */
export async function currentMember(): Promise<Member | null> {
  const session = await auth();
  if (!session?.user?.email) return null;
  return getMember(session.user.email);
}

/** Require a signed-in member; redirect to sign-in otherwise. */
export async function requireMember(): Promise<Member> {
  const member = await currentMember();
  if (!member) redirect("/signin");
  return member;
}

/** Require an admin; redirect home for non-admins. */
export async function requireAdmin(): Promise<Member> {
  const member = await requireMember();
  if (member.role !== "admin") redirect("/");
  return member;
}
