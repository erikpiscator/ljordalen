import "server-only";
import { db } from "./firebase";
import { DEFAULT_SETTINGS } from "./limits";
import type { BookingSettings } from "./types";

const SETTINGS_DOC = () => db.collection("settings").doc("booking");

export async function getSettings(): Promise<BookingSettings> {
  const snap = await SETTINGS_DOC().get();
  if (!snap.exists) return { ...DEFAULT_SETTINGS };
  const data = snap.data() as Partial<BookingSettings>;
  return {
    maxNights: Math.max(0, Math.floor(data.maxNights ?? 0)),
    advanceWindowDays: Math.max(0, Math.floor(data.advanceWindowDays ?? 0)),
  };
}

export async function updateSettings(
  settings: BookingSettings,
): Promise<void> {
  await SETTINGS_DOC().set(
    {
      maxNights: Math.max(0, Math.floor(settings.maxNights)),
      advanceWindowDays: Math.max(0, Math.floor(settings.advanceWindowDays)),
      updatedAt: Date.now(),
    },
    { merge: true },
  );
}
