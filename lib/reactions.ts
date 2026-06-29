import "server-only";
import { db, ANNOUNCEMENTS, REACTIONS } from "./firebase";
import { normalizeEmail } from "./members";
import { isReactionEmoji } from "./comment-tree";
import type { Reaction, ReactionTarget } from "./types";

function reactionsCol(announcementId: string) {
  return db.collection(ANNOUNCEMENTS).doc(announcementId).collection(REACTIONS);
}

/**
 * Deterministic doc id so toggling is idempotent: a member can hold at most one
 * doc per (target, emoji), and add/remove map cleanly to set/delete.
 */
function reactionId(targetId: string, email: string, emoji: string): string {
  return `${targetId}__${email}__${emoji}`;
}

/** Every reaction on an announcement — for the post and all of its comments. */
export async function listReactions(
  announcementId: string,
): Promise<Reaction[]> {
  const snap = await reactionsCol(announcementId).get();
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Reaction, "id">),
  }));
}

/**
 * Toggle a member's emoji reaction on a target. Returns true if the reaction is
 * now present (added), false if it was removed. Invalid emojis are ignored.
 */
export async function toggleReaction(
  announcementId: string,
  targetType: ReactionTarget,
  targetId: string,
  email: string,
  emoji: string,
): Promise<boolean> {
  if (!isReactionEmoji(emoji)) return false;
  const member = normalizeEmail(email);
  const ref = reactionsCol(announcementId).doc(
    reactionId(targetId, member, emoji),
  );
  const existing = await ref.get();
  if (existing.exists) {
    await ref.delete();
    return false;
  }
  const data: Omit<Reaction, "id"> = {
    targetType,
    targetId,
    memberEmail: member,
    emoji,
    createdAt: Date.now(),
  };
  await ref.set(data);
  return true;
}
