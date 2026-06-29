import "server-only";
import { db, ANNOUNCEMENTS, COMMENTS } from "./firebase";
import type { Comment } from "./types";

function commentsCol(announcementId: string) {
  return db.collection(ANNOUNCEMENTS).doc(announcementId).collection(COMMENTS);
}

/** All comments on an announcement, oldest-first (tree shape is built in UI). */
export async function listComments(
  announcementId: string,
): Promise<Comment[]> {
  const snap = await commentsCol(announcementId).orderBy("createdAt", "asc").get();
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Comment, "id">),
  }));
}

export async function getComment(
  announcementId: string,
  commentId: string,
): Promise<Comment | null> {
  const snap = await commentsCol(announcementId).doc(commentId).get();
  return snap.exists
    ? { id: snap.id, ...(snap.data() as Omit<Comment, "id">) }
    : null;
}

export async function createComment(
  announcementId: string,
  authorEmail: string,
  body: string,
  parentId: string | null,
): Promise<Comment> {
  const data: Omit<Comment, "id"> = {
    authorEmail,
    body,
    parentId,
    createdAt: Date.now(),
  };
  const ref = await commentsCol(announcementId).add(data);
  return { id: ref.id, ...data };
}

/**
 * Delete a comment. If it still has replies, keep a tombstone (cleared body,
 * `deleted: true`) so the thread below it stays reachable; otherwise hard-delete.
 */
export async function deleteComment(
  announcementId: string,
  commentId: string,
): Promise<void> {
  const ref = commentsCol(announcementId).doc(commentId);
  const children = await commentsCol(announcementId)
    .where("parentId", "==", commentId)
    .limit(1)
    .get();

  if (children.empty) {
    await ref.delete();
  } else {
    await ref.set(
      { deleted: true, body: "", editedAt: Date.now() },
      { merge: true },
    );
  }
}

/** Distinct author emails of everyone who has commented on an announcement. */
export async function commentParticipants(
  announcementId: string,
): Promise<string[]> {
  const comments = await listComments(announcementId);
  return Array.from(new Set(comments.map((c) => c.authorEmail)));
}
