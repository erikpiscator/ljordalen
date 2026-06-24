// Booking-limit logic. Pure (no server/DOM deps) so it can run on the server
// (enforcement) and in client components (live dialog feedback).
import { addDays, nights, todayStr } from "./dates";
import type { BookingSettings } from "./types";

export const DEFAULT_SETTINGS: BookingSettings = {
  maxNights: 0,
  advanceWindowDays: 0,
};

/** The latest arrival date a member may book, or null if unlimited. */
export function maxArrivalDate(settings: BookingSettings): string | null {
  return settings.advanceWindowDays > 0
    ? addDays(todayStr(), settings.advanceWindowDays)
    : null;
}

/**
 * Check a requested stay against the booking rules (they apply to everyone,
 * admins included). Returns an error message, or null if the stay is allowed.
 */
export function checkLimits(
  start: string,
  end: string,
  settings: BookingSettings,
): string | null {
  if (settings.maxNights > 0) {
    const n = nights(start, end);
    if (n > settings.maxNights) {
      return `Vistelser är begränsade till ${settings.maxNights} ${
        settings.maxNights === 1 ? "natt" : "nätter"
      }.`;
    }
  }

  const latest = maxArrivalDate(settings);
  if (latest && start > latest) {
    return `Du kan boka högst ${settings.advanceWindowDays} dagar framåt.`;
  }

  return null;
}
