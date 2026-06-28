"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { createMember, getMember, normalizeEmail } from "@/lib/members";
import {
  createAccessRequest,
  deleteAccessRequest,
  getAccessRequest,
} from "@/lib/access-requests";
import { notifyAccessApproved, notifyAccessRequest } from "@/lib/notify";

export type Result = { ok: true } | { ok: false; error: string };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Public (unauthenticated) action: someone who isn't on the allowlist asks an
 * admin to let them in. Never grants access — it only records a pending request
 * and notifies the admins, who approve it from the admin page.
 */
export async function requestAccessAction(input: {
  name: string;
  email: string;
  message?: string;
}): Promise<Result> {
  const email = normalizeEmail(input.email);
  const name = input.name.trim();

  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Ange en giltig e-postadress." };
  }
  if (!name) return { ok: false, error: "Ange ditt namn." };

  // Already a member? Don't leak whether they're active — just point them home.
  const existing = await getMember(email);
  if (existing) {
    return {
      ok: false,
      error: "Den här e-posten har redan åtkomst. Försök logga in.",
    };
  }

  const request = await createAccessRequest({
    email,
    name,
    message: input.message,
  });

  // Don't let an email hiccup lose the request — it's already saved.
  await notifyAccessRequest(request);
  return { ok: true };
}

// --- Admin: review requests ----------------------------------------------

export async function approveRequestAction(email: string): Promise<Result> {
  await requireAdmin();
  const target = normalizeEmail(email);
  const request = await getAccessRequest(target);
  if (!request) {
    return { ok: false, error: "Förfrågan hittades inte." };
  }
  if (!(await getMember(target))) {
    await createMember({ email: target, name: request.name, role: "member" });
  }
  await deleteAccessRequest(target);
  await notifyAccessApproved(target, request.name);
  revalidatePath("/admin");
  revalidatePath("/family");
  return { ok: true };
}

export async function rejectRequestAction(email: string): Promise<Result> {
  await requireAdmin();
  await deleteAccessRequest(normalizeEmail(email));
  revalidatePath("/admin");
  return { ok: true };
}
