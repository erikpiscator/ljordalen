import { ProfileEditor } from "@/components/profile-editor";
import { requireMember } from "@/lib/session";

export default async function ProfilePage() {
  const member = await requireMember();
  return (
    <ProfileEditor
      email={member.email}
      name={member.name}
      notifyEmail={member.notifyEmail ?? ""}
      color={member.color}
      avatar={member.avatar}
    />
  );
}
