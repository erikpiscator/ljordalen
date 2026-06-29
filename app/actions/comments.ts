"use server";
import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/session";
import { getAnnouncement } from "@/lib/announcements";
import {
  commentParticipants,
  createComment,
  deleteComment,
  getComment,
} from "@/lib/comments";
import { toggleReaction } from "@/lib/reactions";
import { notifyComment } from "@/lib/notify";
import {
  isReactionEmoji,
  isReactionTarget,
  validateCommentBody,
} from "@/lib/comment-tree";
import type { ReactionTarget } from "@/lib/types";

export type Result = { ok: true } | { ok: false; error: string };

export async function postCommentAction(
  announcementId: string,
  body: string,
  parentId: string | null = null,
): Promise<Result> {
  const member = await requireMember();

  const valid = validateCommentBody(body);
  if (!valid.ok) return valid;

  const announcement = await getAnnouncement(announcementId);
  if (!announcement) return { ok: false, error: "Anslaget finns inte längre." };

  if (parentId) {
    const parent = await getComment(announcementId, parentId);
    if (!parent) {
      return { ok: false, error: "Kommentaren du svarar på finns inte längre." };
    }
  }

  await createComment(announcementId, member.email, valid.value, parentId);

  // Notify the post author and everyone already in the thread (actor excluded
  // inside notifyComment).
  const participants = await commentParticipants(announcementId);
  const recipients = [announcement.authorEmail, ...participants];
  await notifyComment(member, valid.value, announcement.body, recipients);

  revalidatePath("/announcements");
  return { ok: true };
}

export async function deleteCommentAction(
  announcementId: string,
  commentId: string,
): Promise<Result> {
  const member = await requireMember();
  const comment = await getComment(announcementId, commentId);
  if (!comment) return { ok: true };
  if (comment.authorEmail !== member.email && member.role !== "admin") {
    return { ok: false, error: "Du kan bara ta bort dina egna kommentarer." };
  }
  await deleteComment(announcementId, commentId);
  revalidatePath("/announcements");
  return { ok: true };
}

export async function toggleReactionAction(
  announcementId: string,
  targetType: ReactionTarget,
  targetId: string,
  emoji: string,
): Promise<Result> {
  const member = await requireMember();
  if (!isReactionTarget(targetType) || !isReactionEmoji(emoji)) {
    return { ok: false, error: "Ogiltig reaktion." };
  }

  if (targetType === "comment") {
    const comment = await getComment(announcementId, targetId);
    if (!comment) return { ok: false, error: "Kommentaren finns inte längre." };
  } else {
    const announcement = await getAnnouncement(announcementId);
    if (!announcement) {
      return { ok: false, error: "Anslaget finns inte längre." };
    }
  }

  await toggleReaction(announcementId, targetType, targetId, member.email, emoji);
  revalidatePath("/announcements");
  return { ok: true };
}
