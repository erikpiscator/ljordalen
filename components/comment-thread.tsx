"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { MemberAvatar } from "@/components/member-avatar";
import { ReactionBar } from "@/components/reaction-bar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteCommentAction,
  postCommentAction,
} from "@/app/actions/comments";
import type { CommentNode, GroupedReaction } from "@/lib/comment-tree";
import { cn } from "@/lib/utils";

type Me = { email: string; isAdmin: boolean };
type ReactionMap = Record<string, GroupedReaction[]>;

function timeAgo(ts: number): string {
  return formatDistanceToNow(new Date(ts), { addSuffix: true, locale: sv });
}

/** A reply / new-comment box. `parentId` null posts a top-level comment. */
function CommentComposer({
  announcementId,
  parentId,
  placeholder,
  submitLabel,
  autoFocus = false,
  onDone,
  onCancel,
}: {
  announcementId: string;
  parentId: string | null;
  placeholder: string;
  submitLabel: string;
  autoFocus?: boolean;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [body, setBody] = React.useState("");
  const [pending, start] = React.useTransition();

  function submit() {
    const b = body.trim();
    if (!b) return;
    start(async () => {
      const res = await postCommentAction(announcementId, b, parentId);
      if (res.ok) {
        setBody("");
        router.refresh();
        onDone?.();
      } else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-1.5">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={2}
        autoFocus={autoFocus}
      />
      <div className="flex justify-end gap-1.5">
        {onCancel && (
          <Button variant="ghost" size="sm" disabled={pending} onClick={onCancel}>
            Avbryt
          </Button>
        )}
        <Button size="sm" disabled={pending || !body.trim()} onClick={submit}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

function CommentNodeView({
  announcementId,
  node,
  reactions,
  me,
}: {
  announcementId: string;
  node: CommentNode;
  reactions: ReactionMap;
  me: Me;
}) {
  const router = useRouter();
  const [replying, setReplying] = React.useState(false);
  const [pending, start] = React.useTransition();

  const name = node.author?.name ?? node.authorEmail;
  const canDelete =
    !node.deleted && (me.isAdmin || node.authorEmail === me.email);

  function remove() {
    start(async () => {
      const res = await deleteCommentAction(announcementId, node.id);
      if (res.ok) router.refresh();
      else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2.5">
        {node.deleted ? (
          <div className="size-7 shrink-0 rounded-full bg-muted" aria-hidden />
        ) : node.author ? (
          <MemberAvatar
            avatar={node.author.avatar}
            name={name}
            color={node.author.color}
            className="size-7"
          />
        ) : (
          <div className="size-7 shrink-0 rounded-full bg-muted" aria-hidden />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {node.deleted ? "—" : name}
            </span>
            <span className="text-xs text-muted-foreground">
              {timeAgo(node.createdAt)}
            </span>
          </div>

          {node.deleted ? (
            <p className="mt-0.5 text-sm text-muted-foreground italic">
              [borttaget]
            </p>
          ) : (
            <p className="mt-0.5 text-sm whitespace-pre-wrap">{node.body}</p>
          )}

          <div className="mt-1.5 flex items-center gap-2">
            {!node.deleted && (
              <ReactionBar
                announcementId={announcementId}
                targetType="comment"
                targetId={node.id}
                reactions={reactions[node.id] ?? []}
              />
            )}
            <Button
              variant="ghost"
              size="xs"
              disabled={pending}
              onClick={() => setReplying((v) => !v)}
            >
              Svara
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Ta bort kommentar"
                disabled={pending}
                onClick={remove}
              >
                <Trash2 className="text-destructive" />
              </Button>
            )}
          </div>

          {replying && (
            <div className="mt-2">
              <CommentComposer
                announcementId={announcementId}
                parentId={node.id}
                placeholder={`Svara ${node.deleted ? "" : name}…`}
                submitLabel="Svara"
                autoFocus
                onDone={() => setReplying(false)}
                onCancel={() => setReplying(false)}
              />
            </div>
          )}
        </div>
      </div>

      {node.children.length > 0 && (
        <div
          className={cn(
            "ml-3.5 space-y-3 border-l border-border/70 pl-3 sm:ml-4 sm:pl-4",
          )}
        >
          {node.children.map((child) => (
            <CommentNodeView
              key={child.id}
              announcementId={announcementId}
              node={child}
              reactions={reactions}
              me={me}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** The full comment section for one announcement. */
export function CommentThread({
  announcementId,
  comments,
  reactions,
  me,
}: {
  announcementId: string;
  comments: CommentNode[];
  reactions: ReactionMap;
  me: Me;
}) {
  const count = countComments(comments);
  return (
    <div className="space-y-3">
      {count > 0 && (
        <p className="text-xs font-medium text-muted-foreground">
          {count} {count === 1 ? "kommentar" : "kommentarer"}
        </p>
      )}
      {comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((node) => (
            <CommentNodeView
              key={node.id}
              announcementId={announcementId}
              node={node}
              reactions={reactions}
              me={me}
            />
          ))}
        </div>
      )}
      <CommentComposer
        announcementId={announcementId}
        parentId={null}
        placeholder="Skriv en kommentar…"
        submitLabel="Kommentera"
      />
    </div>
  );
}

function countComments(nodes: CommentNode[]): number {
  let n = 0;
  for (const node of nodes) {
    if (!node.deleted) n += 1;
    n += countComments(node.children);
  }
  return n;
}
