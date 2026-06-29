import { Announcements, type PostView } from "@/components/announcements";
import { listAnnouncements } from "@/lib/announcements";
import { listComments } from "@/lib/comments";
import { listReactions } from "@/lib/reactions";
import { listMembers } from "@/lib/members";
import {
  buildCommentTree,
  groupReactions,
  type CommentAuthor,
} from "@/lib/comment-tree";
import { requireMember } from "@/lib/session";

export default async function AnnouncementsPage() {
  const member = await requireMember();
  const [items, members] = await Promise.all([
    listAnnouncements(),
    listMembers(),
  ]);

  const byEmail = new Map<string, CommentAuthor>(
    members.map((m) => [
      m.email,
      { name: m.name, color: m.color, avatar: m.avatar },
    ]),
  );

  // Family scale is small — load each post's thread + reactions in parallel.
  const posts: PostView[] = await Promise.all(
    items.map(async (a): Promise<PostView> => {
      const [comments, reactions] = await Promise.all([
        listComments(a.id),
        listReactions(a.id),
      ]);
      return {
        announcement: a,
        comments: buildCommentTree(comments, byEmail),
        reactions: Object.fromEntries(groupReactions(reactions, member.email)),
      };
    }),
  );

  return (
    <Announcements
      posts={posts}
      me={{ email: member.email, isAdmin: member.role === "admin" }}
    />
  );
}
