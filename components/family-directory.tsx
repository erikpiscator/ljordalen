import { MemberAvatar } from "@/components/member-avatar";
import { Card, CardContent } from "@/components/ui/card";
import type { Member } from "@/lib/types";

function Person({ m }: { m: Member }) {
  return (
    <div className="flex items-center gap-2">
      <MemberAvatar avatar={m.avatar} name={m.name} color={m.color} />
      <span className="text-sm">{m.name}</span>
    </div>
  );
}

/** Read-only directory of who's in which family. Visible to every member. */
export function FamilyDirectory({ members }: { members: Member[] }) {
  const active = members.filter((m) => m.active);

  const groups = new Map<string, Member[]>();
  for (const m of active) {
    const key = m.household?.trim() || "";
    const arr = groups.get(key) ?? [];
    arr.push(m);
    groups.set(key, arr);
  }

  const named = [...groups.entries()]
    .filter(([k]) => k !== "")
    .sort((a, b) => a[0].localeCompare(b[0]));
  const unassigned = groups.get("") ?? [];

  return (
    <div className="space-y-3">
      {named.map(([household, ms]) => (
        <Card key={household}>
          <CardContent className="py-4">
            <div className="mb-3 flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: ms[0].color }}
              />
              <h3 className="font-medium">{household}</h3>
              <span className="text-xs text-muted-foreground">
                {ms.length} {ms.length === 1 ? "person" : "personer"}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-3">
              {ms.map((m) => (
                <Person key={m.email} m={m} />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {unassigned.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <h3 className="mb-3 font-medium text-muted-foreground">
              Ingen familj vald än
            </h3>
            <div className="flex flex-wrap gap-x-5 gap-y-3">
              {unassigned.map((m) => (
                <Person key={m.email} m={m} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
