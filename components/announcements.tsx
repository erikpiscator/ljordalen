"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { MemberAvatar } from "@/components/member-avatar";
import { ReactionBar } from "@/components/reaction-bar";
import { CommentThread } from "@/components/comment-thread";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  deleteAnnouncementAction,
  postAnnouncementAction,
} from "@/app/actions/announcements";
import type { AnnouncementWithAuthor } from "@/lib/announcements";
import type { CommentNode, GroupedReaction } from "@/lib/comment-tree";

type Me = { email: string; isAdmin: boolean };

/** An announcement plus its thread and reactions, keyed for one card. */
export interface PostView {
  announcement: AnnouncementWithAuthor;
  comments: CommentNode[];
  /** targetId -> grouped reactions (the post id, and each comment id). */
  reactions: Record<string, GroupedReaction[]>;
}

function AnnouncementCard({ post, me }: { post: PostView; me: Me }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const a = post.announcement;
  const name = a.author?.name ?? a.authorEmail;
  const canDelete = me.isAdmin || a.authorEmail === me.email;

  function remove() {
    start(async () => {
      const res = await deleteAnnouncementAction(a.id);
      if (res.ok) router.refresh();
      else toast.error(res.error);
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 py-4">
        <div className="flex items-start gap-3">
          {a.author && (
            <MemberAvatar
              avatar={a.author.avatar}
              name={name}
              color={a.author.color}
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(a.createdAt), {
                  addSuffix: true,
                  locale: sv,
                })}
              </span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm">{a.body}</p>
          </div>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Ta bort"
              disabled={pending}
              onClick={remove}
            >
              <Trash2 className="text-destructive" />
            </Button>
          )}
        </div>

        <ReactionBar
          announcementId={a.id}
          targetType="post"
          targetId={a.id}
          reactions={post.reactions[a.id] ?? []}
        />

        <Separator />

        <CommentThread
          announcementId={a.id}
          comments={post.comments}
          reactions={post.reactions}
          me={me}
        />
      </CardContent>
    </Card>
  );
}

export function Announcements({
  posts,
  me,
}: {
  posts: PostView[];
  me: Me;
}) {
  const router = useRouter();
  const [body, setBody] = React.useState("");
  const [pending, start] = React.useTransition();

  function post() {
    const b = body.trim();
    if (!b) return;
    start(async () => {
      const res = await postAnnouncementAction(b);
      if (res.ok) {
        setBody("");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Anslag</h1>

      <Card>
        <CardContent className="space-y-2 py-4">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Dela något med familjen…"
            rows={3}
          />
          <div className="flex justify-end">
            <Button onClick={post} disabled={pending || !body.trim()}>
              Publicera
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Inga anslag än. Var först med att posta!
          </div>
        ) : (
          posts.map((p) => (
            <AnnouncementCard key={p.announcement.id} post={p} me={me} />
          ))
        )}
      </div>
    </div>
  );
}
