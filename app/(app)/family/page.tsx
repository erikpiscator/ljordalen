import { FamilyDirectory } from "@/components/family-directory";
import { listMembers } from "@/lib/members";
import { requireMember } from "@/lib/session";

export default async function FamilyPage() {
  await requireMember();
  const members = await listMembers();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Familj</h1>
      <FamilyDirectory members={members} />
    </div>
  );
}
