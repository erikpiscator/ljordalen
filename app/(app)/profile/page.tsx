import { ProfileEditor } from "@/components/profile-editor";
import { listHouseholds } from "@/lib/members";
import { requireMember } from "@/lib/session";

export default async function ProfilePage() {
  const member = await requireMember();
  const households = await listHouseholds();
  return (
    <ProfileEditor
      email={member.email}
      name={member.name}
      household={member.household}
      notifyEmail={member.notifyEmail ?? ""}
      color={member.color}
      avatar={member.avatar}
      households={households}
    />
  );
}
