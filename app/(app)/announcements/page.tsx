import { Announcements } from "@/components/announcements";
import { listAnnouncements } from "@/lib/announcements";
import { requireMember } from "@/lib/session";

export default async function AnnouncementsPage() {
  const member = await requireMember();
  const items = await listAnnouncements();
  return (
    <Announcements
      items={items}
      me={{ email: member.email, isAdmin: member.role === "admin" }}
    />
  );
}
