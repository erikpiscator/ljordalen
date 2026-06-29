"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SmilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toggleReactionAction } from "@/app/actions/comments";
import { REACTION_EMOJIS, type GroupedReaction } from "@/lib/comment-tree";
import type { ReactionTarget } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Grouped emoji reactions with a popover to add one. Reused for both an
 * announcement (targetType "post") and individual comments ("comment").
 */
export function ReactionBar({
  announcementId,
  targetType,
  targetId,
  reactions,
}: {
  announcementId: string;
  targetType: ReactionTarget;
  targetId: string;
  reactions: GroupedReaction[];
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [open, setOpen] = React.useState(false);

  function toggle(emoji: string) {
    setOpen(false);
    start(async () => {
      const res = await toggleReactionAction(
        announcementId,
        targetType,
        targetId,
        emoji,
      );
      if (res.ok) router.refresh();
      else toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          disabled={pending}
          onClick={() => toggle(r.emoji)}
          aria-pressed={r.mine}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors disabled:opacity-50",
            r.mine
              ? "border-primary/40 bg-primary/10 text-foreground"
              : "border-border text-muted-foreground hover:bg-muted",
          )}
        >
          <span>{r.emoji}</span>
          <span className="tabular-nums">{r.count}</span>
        </button>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Lägg till reaktion"
            />
          }
        >
          <SmilePlus />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto flex-row gap-0.5 p-1.5">
          {REACTION_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              disabled={pending}
              onClick={() => toggle(e)}
              aria-label={`Reagera med ${e}`}
              className="rounded-md p-1 text-lg leading-none transition-colors hover:bg-muted disabled:opacity-50"
            >
              {e}
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}
