import { BookingsList } from "@/components/bookings-list";
import { listBookings, withMembers } from "@/lib/bookings";
import { getSettings } from "@/lib/settings";
import { requireMember } from "@/lib/session";

export default async function BookingsPage() {
  const member = await requireMember();
  const [bookings, settings] = await Promise.all([
    withMembers(await listBookings()),
    getSettings(),
  ]);

  return (
    <BookingsList
      bookings={bookings}
      me={{ email: member.email, isAdmin: member.role === "admin" }}
      settings={settings}
    />
  );
}
