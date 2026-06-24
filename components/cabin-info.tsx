"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { updateCabinInfoAction } from "@/app/actions/info";

export function CabinInfo({
  content,
  canEdit,
  compact = false,
}: {
  content: string;
  canEdit: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(content);
  const [pending, start] = React.useTransition();

  function save() {
    start(async () => {
      const res = await updateCabinInfoAction(draft);
      if (res.ok) {
        toast.success("Stuginfo sparad.");
        setEditing(false);
        router.refresh();
      } else toast.error(res.error);
    });
  }

  if (compact) {
    return (
      <div className="space-y-3">
        {editing ? (
          <div className="space-y-3">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setDraft(content); setEditing(false); }}
                disabled={pending}
              >Avbryt</Button>
              <Button size="sm" onClick={save} disabled={pending}>
                {pending ? "Sparar…" : "Spara"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
              {content}
            </div>
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute -top-1 right-0 text-muted-foreground"
                onClick={() => setEditing(true)}
              >
                <Pencil className="size-3.5" /> Ändra
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Stuginfo</h1>
        {canEdit && !editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil /> Ändra
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={16}
            className="font-mono text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setDraft(content);
                setEditing(false);
              }}
              disabled={pending}
            >Avbryt</Button>
            <Button onClick={save} disabled={pending}>
              {pending ? "Sparar…" : "Spara"}
            </Button>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-5">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {content}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
