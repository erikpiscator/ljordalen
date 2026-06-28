import { MemberTable } from "@/components/member-table";
import { AccessRequests } from "@/components/access-requests";
import { BookingLimits } from "@/components/booking-limits";
import { listMembers } from "@/lib/members";
import { listAccessRequests } from "@/lib/access-requests";
import { getSettings } from "@/lib/settings";
import { requireAdmin } from "@/lib/session";

export default async function AdminPage() {
  const admin = await requireAdmin();
  const [members, requests, settings] = await Promise.all([
    listMembers(),
    listAccessRequests(),
    getSettings(),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Admin</h1>
      {requests.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">
            Åtkomstförfrågningar
          </h2>
          <AccessRequests requests={requests} />
        </section>
      )}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Medlemmar</h2>
        <MemberTable members={members} meEmail={admin.email} />
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Bokningsregler</h2>
        <BookingLimits settings={settings} />
      </section>
    </div>
  );
}
