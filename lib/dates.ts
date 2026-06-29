// Date helpers. Bookings use plain "YYYY-MM-DD" strings (no time-of-day) to
// avoid timezone/DST bugs. Ranges are half-open: [start, end) so that one
// family leaving on the same day another arrives is NOT a conflict.

export const TIMEZONE = "Europe/Stockholm";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateStr(s: string): boolean {
  if (!ISO_DATE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Today in the cabin's timezone, as "YYYY-MM-DD". */
export function todayStr(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Convert a "YYYY-MM-DD" string to a UTC-midnight Date for arithmetic. */
export function parseDateStr(s: string): Date {
  return new Date(`${s}T00:00:00Z`);
}

export function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(s: string, days: number): string {
  const d = parseDateStr(s);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateStr(d);
}

/** Whole nights between arrival (inclusive) and departure (exclusive). */
export function nights(start: string, end: string): number {
  const ms = parseDateStr(end).getTime() - parseDateStr(start).getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * Do two half-open ranges [aStart, aEnd) and [bStart, bEnd) overlap?
 * Back-to-back ranges (aEnd === bStart) do NOT overlap.
 */
export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Validate a booking range; returns an error message or null if OK. */
export function validateRange(
  start: string,
  end: string,
  opts: { allowPast?: boolean } = {},
): string | null {
  if (!isValidDateStr(start) || !isValidDateStr(end)) {
    return "Välj giltiga datum.";
  }
  if (end <= start) {
    return "Avresan måste vara efter ankomsten (minst en natt).";
  }
  if (!opts.allowPast && start < todayStr()) {
    return "Du kan inte boka datum som har passerat.";
  }
  return null;
}

/** Format a stay for display, e.g. "fre 12 dec – sön 14 dec 2025". */
export function formatStay(start: string, end: string): string {
  const fmt = (s: string, withYear = false): string =>
    new Intl.DateTimeFormat("sv-SE", {
      timeZone: "UTC",
      weekday: "short",
      day: "numeric",
      month: "short",
      ...(withYear ? { year: "numeric" } : {}),
    }).format(parseDateStr(s));
  // `end` is the exclusive departure day — show it as the checkout date.
  return `${fmt(start)} – ${fmt(end, true)}`;
}
