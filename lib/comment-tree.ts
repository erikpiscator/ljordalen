// Pure, framework-free logic for comment threads and emoji reactions. Kept free
// of `server-only` and Firestore so it can be imported by client components and
// exercised directly in unit tests.

import type { Avatar, Comment, Reaction, ReactionTarget } from "./types";

/** The fixed emoji palette members can react with. Order is the display order. */
export const REACTION_EMOJIS = ["👍", "❤️", "😂", "🎉", "😮", "😢"] as const;

/** Longest reasonable comment, matching the announcement body limit. */
export const MAX_COMMENT_LENGTH = 2000;

/** A comment author's display info, mirroring announcements' author shape. */
export interface CommentAuthor {
  name: string;
  color: string;
  avatar: Avatar;
}

/** A comment plus its resolved author and nested replies. */
export interface CommentNode extends Comment {
  author: CommentAuthor | null;
  /** 0 for top-level comments, +1 per level of nesting. */
  depth: number;
  children: CommentNode[];
}

/** Reactions of one emoji on one target, with the current member's state. */
export interface GroupedReaction {
  emoji: string;
  count: number;
  /** Whether the current member is one of the reactors. */
  mine: boolean;
}

/**
 * Build a Reddit-style nested tree from a flat list of comments.
 *
 * - Replies attach under their `parentId`; comments whose parent is missing
 *   (e.g. it was hard-deleted) re-attach to the top level so they aren't lost.
 * - Each level is sorted oldest-first by `createdAt`.
 * - Soft-deleted tombstones are kept in place so their replies stay reachable.
 */
export function buildCommentTree(
  comments: Comment[],
  membersByEmail: Map<string, CommentAuthor>,
): CommentNode[] {
  const nodes = new Map<string, CommentNode>();
  for (const c of comments) {
    nodes.set(c.id, {
      ...c,
      author: membersByEmail.get(c.authorEmail) ?? null,
      depth: 0,
      children: [],
    });
  }

  const roots: CommentNode[] = [];
  for (const node of nodes.values()) {
    const parent =
      node.parentId != null ? nodes.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  const byCreatedAt = (a: CommentNode, b: CommentNode) =>
    a.createdAt - b.createdAt || a.id.localeCompare(b.id);

  const sortAndDepth = (level: CommentNode[], depth: number) => {
    level.sort(byCreatedAt);
    for (const n of level) {
      n.depth = depth;
      sortAndDepth(n.children, depth + 1);
    }
  };
  sortAndDepth(roots, 0);

  return roots;
}

/**
 * Group a flat reaction list into `targetId -> emoji buckets`, ordered by count
 * (then palette order, then emoji) so the most-used reaction shows first.
 */
export function groupReactions(
  reactions: Reaction[],
  meEmail: string,
): Map<string, GroupedReaction[]> {
  // targetId -> emoji -> { count, mine }
  const byTarget = new Map<string, Map<string, { count: number; mine: boolean }>>();

  for (const r of reactions) {
    let emojis = byTarget.get(r.targetId);
    if (!emojis) {
      emojis = new Map();
      byTarget.set(r.targetId, emojis);
    }
    const cur = emojis.get(r.emoji) ?? { count: 0, mine: false };
    cur.count += 1;
    if (r.memberEmail === meEmail) cur.mine = true;
    emojis.set(r.emoji, cur);
  }

  const paletteIndex = (e: string) => {
    const i = (REACTION_EMOJIS as readonly string[]).indexOf(e);
    return i === -1 ? REACTION_EMOJIS.length : i;
  };

  const out = new Map<string, GroupedReaction[]>();
  for (const [targetId, emojis] of byTarget) {
    const grouped: GroupedReaction[] = [...emojis.entries()]
      .map(([emoji, { count, mine }]) => ({ emoji, count, mine }))
      .sort(
        (a, b) =>
          b.count - a.count ||
          paletteIndex(a.emoji) - paletteIndex(b.emoji) ||
          a.emoji.localeCompare(b.emoji),
      );
    out.set(targetId, grouped);
  }
  return out;
}

/** Reactions for a single target, or an empty list. */
export function reactionsFor(
  grouped: Map<string, GroupedReaction[]>,
  targetId: string,
): GroupedReaction[] {
  return grouped.get(targetId) ?? [];
}

export type CommentValidation =
  | { ok: true; value: string }
  | { ok: false; error: string };

/** Trim and length-check a comment body. Mirrors the announcement rules. */
export function validateCommentBody(body: string): CommentValidation {
  const b = body.trim();
  if (!b) return { ok: false, error: "Skriv något först." };
  if (b.length > MAX_COMMENT_LENGTH) {
    return { ok: false, error: "Lite för långt (max 2000 tecken)." };
  }
  return { ok: true, value: b };
}

/** Whether an emoji is part of the allowed reaction palette. */
export function isReactionEmoji(emoji: string): boolean {
  return (REACTION_EMOJIS as readonly string[]).includes(emoji);
}

/** Whether a string is a valid reaction target type. */
export function isReactionTarget(value: string): value is ReactionTarget {
  return value === "post" || value === "comment";
}
