import { CalendarBoard } from "@/components/calendar-board";
import { listBookings, withMembers } from "@/lib/bookings";
import { getSettings } from "@/lib/settings";
import { requireMember } from "@/lib/session";

export default async function CalendarPage() {
  const member = await requireMember();
  const [bookings, settings] = await Promise.all([
    withMembers(await listBookings()),
    getSettings(),
  ]);

  return (
    <CalendarBoard
      bookings={bookings}
      me={{ email: member.email, isAdmin: member.role === "admin" }}
      settings={settings}
    />
  );
}
