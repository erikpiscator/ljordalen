"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Trash2, UserPlus } from "lucide-react";
import { MemberAvatar } from "@/components/member-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  addMemberAction,
  removeMemberAction,
  setHouseholdColorAction,
  updateMemberAction,
} from "@/app/actions/members";
import { PALETTE } from "@/lib/colors";
import { cn } from "@/lib/utils";
import type { Member } from "@/lib/types";

export function MemberTable({
  members,
  meEmail,
}: {
  members: Member[];
  meEmail: string;
}) {
  return (
    <div className="space-y-4">
      <AddMember />
      <div className="space-y-3">
        {members.map((m) => (
          <MemberRow key={m.email} member={m} isSelf={m.email === meEmail} />
        ))}
      </div>
    </div>
  );
}

function AddMember() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [household, setHousehold] = React.useState("");
  const [pending, start] = React.useTransition();

  function submit() {
    start(async () => {
      const res = await addMemberAction({ email, name, household });
      if (res.ok) {
        toast.success(`${name || email} tillagd.`);
        setEmail("");
        setName("");
        setHousehold("");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Lägg till en familjemedlem</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="m-email">Google-e-post</Label>
            <Input
              id="m-email"
              type="email"
              placeholder="name@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-name">Namn</Label>
            <Input
              id="m-name"
              placeholder="Anna"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-house">
              Familj{" "}
              <span className="font-normal text-muted-foreground">
                (valfritt)
              </span>
            </Label>
            <Input
              id="m-house"
              placeholder="De kan välja själva senare"
              value={household}
              onChange={(e) => setHousehold(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button onClick={submit} disabled={pending || !email || !name}>
            <UserPlus /> Lägg till
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MemberRow({ member, isSelf }: { member: Member; isSelf: boolean }) {
  const router = useRouter();
  const [name, setName] = React.useState(member.name);
  const [household, setHousehold] = React.useState(member.household);
  const [pending, start] = React.useTransition();

  const [confirmingRemove, setConfirmingRemove] = React.useState(false);

  function save(patch: Parameters<typeof updateMemberAction>[1], msg?: string) {
    start(async () => {
      const res = await updateMemberAction(member.email, patch);
      if (res.ok) {
        if (msg) toast.success(msg);
        router.refresh();
      } else toast.error(res.error);
    });
  }

  function setColor(c: string) {
    start(async () => {
      // Color belongs to the household; for an unassigned member fall back
      // to setting just their own color.
      const res = member.household.trim()
        ? await setHouseholdColorAction(member.household, c)
        : await updateMemberAction(member.email, { color: c });
      if (res.ok) router.refresh();
      else toast.error(res.error);
    });
  }

  function remove() {
    start(async () => {
      const res = await removeMemberAction(member.email);
      if (res.ok) {
        toast.success(`${member.name} borttagen.`);
        router.refresh();
      } else toast.error(res.error);
    });
  }

  const nameDirty = name.trim() !== member.name;
  const houseDirty = household.trim() !== member.household;

  return (
    <Card className={cn(!member.active && "opacity-60")}>
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
        <MemberAvatar
          avatar={member.avatar}
          name={member.name}
          color={member.color}
          ring
        />

        <div className="grid flex-1 gap-2 sm:grid-cols-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => nameDirty && save({ name: name.trim() })}
          />
          <Input
            value={household}
            onChange={(e) => setHousehold(e.target.value)}
            onBlur={() => houseDirty && save({ household: household.trim() })}
          />
        </div>

        <div className="flex items-center gap-1.5" title="Familjens färg">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Sätt färg ${c}`}
              onClick={() => setColor(c)}
              className={cn(
                "size-5 rounded-full ring-2 ring-transparent transition hover:scale-110",
                member.color === c && "ring-foreground/40",
              )}
              style={{ backgroundColor: c }}
            >
              {member.color === c && (
                <Check className="size-3 text-white" strokeWidth={3} />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={member.role === "admin" ? "default" : "outline"}
            className="cursor-pointer select-none"
            render={
              <button
                type="button"
                onClick={() =>
                  save({ role: member.role === "admin" ? "member" : "admin" })
                }
              />
            }
          >
            {member.role === "admin" ? "admin" : "medlem"}
          </Badge>
          <Button
            variant={member.active ? "outline" : "default"}
            size="sm"
            disabled={pending || isSelf}
            onClick={() =>
              save(
                { active: !member.active },
                member.active ? "Medlem inaktiverad." : "Medlem återaktiverad.",
              )
            }
          >
            {member.active ? "Inaktivera" : "Återaktivera"}
          </Button>
          {confirmingRemove ? (
            <div className="flex items-center gap-1">
              <Button
                variant="destructive"
                size="sm"
                disabled={pending}
                onClick={remove}
              >Bekräfta</Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmingRemove(false)}
              >Nej</Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Ta bort medlem"
              disabled={isSelf}
              onClick={() => setConfirmingRemove(true)}
            >
              <Trash2 className="text-destructive" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
