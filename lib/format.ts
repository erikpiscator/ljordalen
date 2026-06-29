// The label shown for a booking: the member's own name. Pure (client + server
// safe). Kept as a helper so callers don't each repeat the null fallback.
export function bookingName(
  member: { name: string } | null,
  fallback = "",
): string {
  return member?.name ?? fallback;
}
