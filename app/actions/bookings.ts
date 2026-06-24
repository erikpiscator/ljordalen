"use server";
import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/session";
import {
  BookingConflictError,
  createBooking,
  deleteBooking,
  getBooking,
  updateBooking,
} from "@/lib/bookings";
import { notifyBooking } from "@/lib/notify";
import { getSettings } from "@/lib/settings";
import { checkLimits } from "@/lib/limits";
import { todayStr, validateRange } from "@/lib/dates";

export type ActionResult = { ok: true } | { ok: false; error: string };

export interface BookingFormInput {
  start: string;
  end: string;
  note?: string;
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/bookings");
}

export async function createBookingAction(
  input: BookingFormInput,
): Promise<ActionResult> {
  const member = await requireMember();
  const err = validateRange(input.start, input.end);
  if (err) return { ok: false, error: err };

  const limitErr = checkLimits(input.start, input.end, await getSettings());
  if (limitErr) return { ok: false, error: limitErr };

  try {
    const booking = await createBooking({
      start: input.start,
      end: input.end,
      memberEmail: member.email,
      household: member.household,
      note: (input.note ?? "").trim(),
    });
    await notifyBooking("created", booking, member);
    refresh();
    return { ok: true };
  } catch (e) {
    if (e instanceof BookingConflictError) return { ok: false, error: e.message };
    console.error("createBooking failed:", e);
    return { ok: false, error: "Något gick fel. Försök igen." };
  }
}

export async function updateBookingAction(
  id: string,
  input: BookingFormInput,
): Promise<ActionResult> {
  const member = await requireMember();
  const existing = await getBooking(id);
  if (!existing) return { ok: false, error: "Den bokningen finns inte längre." };

  const isOwner = existing.memberEmail === member.email;
  const isAdmin = member.role === "admin";
  if (!isOwner && !isAdmin) {
    return { ok: false, error: "Du kan bara ändra dina egna bokningar." };
  }
  // Members can't edit a stay that has already ended; admins can.
  if (!isAdmin && existing.end <= todayStr()) {
    return { ok: false, error: "Den vistelsen har redan avslutats." };
  }

  const err = validateRange(input.start, input.end, { allowPast: isAdmin });
  if (err) return { ok: false, error: err };

  const limitErr = checkLimits(input.start, input.end, await getSettings());
  if (limitErr) return { ok: false, error: limitErr };

  try {
    const booking = await updateBooking(id, {
      start: input.start,
      end: input.end,
      memberEmail: existing.memberEmail,
      household: existing.household,
      note: (input.note ?? "").trim(),
    });
    await notifyBooking("updated", booking, member);
    refresh();
    return { ok: true };
  } catch (e) {
    if (e instanceof BookingConflictError) return { ok: false, error: e.message };
    console.error("updateBooking failed:", e);
    return { ok: false, error: "Något gick fel. Försök igen." };
  }
}

export async function cancelBookingAction(id: string): Promise<ActionResult> {
  const member = await requireMember();
  const existing = await getBooking(id);
  if (!existing) return { ok: true }; // already gone

  const isOwner = existing.memberEmail === member.email;
  const isAdmin = member.role === "admin";
  if (!isOwner && !isAdmin) {
    return { ok: false, error: "Du kan bara avboka dina egna bokningar." };
  }
  if (!isAdmin && existing.end <= todayStr()) {
    return { ok: false, error: "Den vistelsen har redan avslutats." };
  }

  try {
    await deleteBooking(id);
    await notifyBooking("cancelled", existing, member);
    refresh();
    return { ok: true };
  } catch (e) {
    console.error("cancelBooking failed:", e);
    return { ok: false, error: "Något gick fel. Försök igen." };
  }
}
