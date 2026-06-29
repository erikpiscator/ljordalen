import { MemberAvatar } from "@/components/member-avatar";
import { Card, CardContent } from "@/components/ui/card";
import type { Member } from "@/lib/types";

/** Read-only directory of the family's members. Visible to every member. */
export function FamilyDirectory({ members }: { members: Member[] }) {
  const active = members
    .filter((m) => m.active)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-wrap gap-x-5 gap-y-3">
          {active.map((m) => (
            <div key={m.email} className="flex items-center gap-2">
              <MemberAvatar avatar={m.avatar} name={m.name} color={m.color} />
              <span className="text-sm">{m.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
