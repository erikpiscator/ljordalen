"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireMember } from "@/lib/session";
import {
  createMember,
  getMember,
  normalizeEmail,
  removeMember,
  updateMember,
} from "@/lib/members";
import { PRESET_IDS } from "@/lib/avatars";
import type { Role } from "@/lib/types";

export type Result = { ok: true } | { ok: false; error: string };

// --- Own profile ----------------------------------------------------------

export async function updateOwnProfileAction(input: {
  name: string;
}): Promise<Result> {
  const member = await requireMember();
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Ditt namn får inte vara tomt." };
  await updateMember(member.email, { name });
  revalidatePath("/profile");
  revalidatePath("/");
  return { ok: true };
}

export async function setPresetAvatarAction(presetId: string): Promise<Result> {
  const member = await requireMember();
  if (!PRESET_IDS.includes(presetId)) {
    return { ok: false, error: "Okänd avatar." };
  }
  await updateMember(member.email, {
    avatar: { type: "preset", value: presetId },
  });
  revalidatePath("/profile");
  revalidatePath("/");
  return { ok: true };
}

/** Set an alternative email used for notifications (empty clears it). */
export async function setNotifyEmailAction(email: string): Promise<Result> {
  const member = await requireMember();
  const e = email.trim().toLowerCase();
  if (e && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
    return { ok: false, error: "Ange en giltig e-postadress." };
  }
  await updateMember(member.email, { notifyEmail: e });
  revalidatePath("/profile");
  return { ok: true };
}

// --- Admin: family management --------------------------------------------

export async function addMemberAction(input: {
  email: string;
  name: string;
  role?: Role;
}): Promise<Result> {
  await requireAdmin();
  const email = normalizeEmail(input.email);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: "Ange en giltig e-postadress." };
  }
  if (!input.name.trim()) {
    return { ok: false, error: "Ange ett namn." };
  }
  if (await getMember(email)) {
    return { ok: false, error: "Personen finns redan på listan." };
  }
  await createMember({
    email,
    name: input.name,
    role: input.role,
  });
  revalidatePath("/admin");
  revalidatePath("/family");
  return { ok: true };
}

export async function updateMemberAction(
  email: string,
  patch: Partial<{
    name: string;
    color: string;
    role: Role;
    active: boolean;
  }>,
): Promise<Result> {
  const admin = await requireAdmin();
  const target = normalizeEmail(email);

  // Guard against an admin locking themselves out.
  if (target === admin.email) {
    if (patch.active === false) {
      return { ok: false, error: "Du kan inte inaktivera dig själv." };
    }
    if (patch.role && patch.role !== "admin") {
      return { ok: false, error: "Du kan inte ta bort din egen admin-roll." };
    }
  }

  await updateMember(target, patch);
  revalidatePath("/admin");
  revalidatePath("/family");
  revalidatePath("/");
  return { ok: true };
}

/** Hard-remove a member (keeps past stays, cancels upcoming ones). */
export async function removeMemberAction(email: string): Promise<Result> {
  const admin = await requireAdmin();
  const target = normalizeEmail(email);
  if (target === admin.email) {
    return { ok: false, error: "Du kan inte ta bort dig själv." };
  }
  await removeMember(target);
  revalidatePath("/admin");
  revalidatePath("/family");
  revalidatePath("/");
  revalidatePath("/bookings");
  return { ok: true };
}
