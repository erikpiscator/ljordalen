// The label shown for a booking: the family/household name when the person
// belongs to one, otherwise just their own name. Pure (client + server safe).
export function bookingName(
  member: { name: string; household?: string } | null,
  fallback = "",
): string {
  if (!member) return fallback;
  return member.household?.trim() || member.name;
}
