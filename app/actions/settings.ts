"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { updateSettings } from "@/lib/settings";
import type { BookingSettings } from "@/lib/types";

export type Result = { ok: true } | { ok: false; error: string };

export async function updateSettingsAction(
  input: BookingSettings,
): Promise<Result> {
  await requireAdmin();
  const maxNights = Math.max(0, Math.floor(Number(input.maxNights) || 0));
  const advanceWindowDays = Math.max(
    0,
    Math.floor(Number(input.advanceWindowDays) || 0),
  );
  await updateSettings({ maxNights, advanceWindowDays });
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/bookings");
  return { ok: true };
}
