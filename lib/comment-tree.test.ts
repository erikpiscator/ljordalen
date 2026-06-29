import { describe, expect, it } from "vitest";
import {
  REACTION_EMOJIS,
  buildCommentTree,
  groupReactions,
  isReactionEmoji,
  isReactionTarget,
  reactionsFor,
  validateCommentBody,
  type CommentAuthor,
} from "./comment-tree";
import type { Avatar, Comment, Reaction } from "./types";

const avatar: Avatar = { type: "preset", value: "fox" };

function author(name: string): CommentAuthor {
  return { name, color: "#abc", avatar };
}

const members = new Map<string, CommentAuthor>([
  ["anna@x.se", author("Anna")],
  ["bo@x.se", author("Bo")],
]);

function comment(partial: Partial<Comment> & { id: string }): Comment {
  return {
    authorEmail: "anna@x.se",
    body: "hej",
    parentId: null,
    createdAt: 0,
    ...partial,
  };
}

function reaction(partial: Partial<Reaction> & { id: string }): Reaction {
  return {
    targetType: "post",
    targetId: "post1",
    memberEmail: "anna@x.se",
    emoji: "👍",
    createdAt: 0,
    ...partial,
  };
}

describe("buildCommentTree", () => {
  it("returns an empty array for no comments", () => {
    expect(buildCommentTree([], members)).toEqual([]);
  });

  it("nests replies under their parent and resolves authors", () => {
    const tree = buildCommentTree(
      [
        comment({ id: "a", authorEmail: "anna@x.se", createdAt: 1 }),
        comment({ id: "b", parentId: "a", authorEmail: "bo@x.se", createdAt: 2 }),
      ],
      members,
    );

    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe("a");
    expect(tree[0].author?.name).toBe("Anna");
    expect(tree[0].depth).toBe(0);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].id).toBe("b");
    expect(tree[0].children[0].author?.name).toBe("Bo");
    expect(tree[0].children[0].depth).toBe(1);
  });

  it("orders siblings oldest-first by createdAt", () => {
    const tree = buildCommentTree(
      [
        comment({ id: "late", createdAt: 30 }),
        comment({ id: "early", createdAt: 10 }),
        comment({ id: "mid", createdAt: 20 }),
      ],
      members,
    );
    expect(tree.map((n) => n.id)).toEqual(["early", "mid", "late"]);
  });

  it("supports deep chains and assigns increasing depth", () => {
    const tree = buildCommentTree(
      [
        comment({ id: "1", createdAt: 1 }),
        comment({ id: "2", parentId: "1", createdAt: 2 }),
        comment({ id: "3", parentId: "2", createdAt: 3 }),
        comment({ id: "4", parentId: "3", createdAt: 4 }),
      ],
      members,
    );
    let node = tree[0];
    for (let depth = 0; depth < 4; depth++) {
      expect(node.depth).toBe(depth);
      if (depth < 3) {
        expect(node.children).toHaveLength(1);
        node = node.children[0];
      } else {
        expect(node.children).toHaveLength(0);
      }
    }
  });

  it("re-attaches orphans (missing parent) to the top level", () => {
    const tree = buildCommentTree(
      [comment({ id: "orphan", parentId: "gone", createdAt: 5 })],
      members,
    );
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe("orphan");
    expect(tree[0].depth).toBe(0);
  });

  it("keeps a deleted tombstone and its children", () => {
    const tree = buildCommentTree(
      [
        comment({ id: "p", deleted: true, body: "", createdAt: 1 }),
        comment({ id: "c", parentId: "p", body: "still here", createdAt: 2 }),
      ],
      members,
    );
    expect(tree).toHaveLength(1);
    expect(tree[0].deleted).toBe(true);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].body).toBe("still here");
  });

  it("leaves author null for unknown emails", () => {
    const tree = buildCommentTree(
      [comment({ id: "x", authorEmail: "ghost@x.se" })],
      members,
    );
    expect(tree[0].author).toBeNull();
  });
});

describe("groupReactions", () => {
  it("groups by target and emoji with counts", () => {
    const grouped = groupReactions(
      [
        reaction({ id: "1", emoji: "👍", memberEmail: "anna@x.se" }),
        reaction({ id: "2", emoji: "👍", memberEmail: "bo@x.se" }),
        reaction({ id: "3", emoji: "❤️", memberEmail: "bo@x.se" }),
      ],
      "anna@x.se",
    );
    const post = grouped.get("post1")!;
    const thumbs = post.find((r) => r.emoji === "👍")!;
    expect(thumbs.count).toBe(2);
    expect(thumbs.mine).toBe(true);
    const heart = post.find((r) => r.emoji === "❤️")!;
    expect(heart.count).toBe(1);
    expect(heart.mine).toBe(false);
  });

  it("separates reactions by targetId", () => {
    const grouped = groupReactions(
      [
        reaction({ id: "1", targetId: "post1", emoji: "👍" }),
        reaction({ id: "2", targetId: "c1", targetType: "comment", emoji: "🎉" }),
      ],
      "anna@x.se",
    );
    expect(grouped.get("post1")).toHaveLength(1);
    expect(grouped.get("c1")![0].emoji).toBe("🎉");
  });

  it("sorts by count desc, then palette order", () => {
    const grouped = groupReactions(
      [
        // ❤️ appears once, 😂 appears twice -> 😂 should come first by count.
        reaction({ id: "1", emoji: "❤️", memberEmail: "anna@x.se" }),
        reaction({ id: "2", emoji: "😂", memberEmail: "anna@x.se" }),
        reaction({ id: "3", emoji: "😂", memberEmail: "bo@x.se" }),
        // 👍 also once; ties with ❤️ on count, but 👍 precedes ❤️ in palette.
        reaction({ id: "4", emoji: "👍", memberEmail: "bo@x.se" }),
      ],
      "anna@x.se",
    );
    expect(grouped.get("post1")!.map((r) => r.emoji)).toEqual(["😂", "👍", "❤️"]);
  });

  it("reactionsFor returns an empty list for unknown targets", () => {
    const grouped = groupReactions([], "anna@x.se");
    expect(reactionsFor(grouped, "nope")).toEqual([]);
  });
});

describe("validateCommentBody", () => {
  it("rejects empty / whitespace-only bodies", () => {
    expect(validateCommentBody("")).toMatchObject({ ok: false });
    expect(validateCommentBody("   \n ")).toMatchObject({ ok: false });
  });

  it("trims and accepts a normal body", () => {
    expect(validateCommentBody("  hej  ")).toEqual({ ok: true, value: "hej" });
  });

  it("rejects bodies over 2000 chars", () => {
    expect(validateCommentBody("a".repeat(2001))).toMatchObject({ ok: false });
    expect(validateCommentBody("a".repeat(2000))).toMatchObject({ ok: true });
  });
});

describe("reaction palette guards", () => {
  it("isReactionEmoji only accepts palette emojis", () => {
    expect(REACTION_EMOJIS.every((e) => isReactionEmoji(e))).toBe(true);
    expect(isReactionEmoji("🦊")).toBe(false);
    expect(isReactionEmoji("")).toBe(false);
  });

  it("isReactionTarget only accepts post/comment", () => {
    expect(isReactionTarget("post")).toBe(true);
    expect(isReactionTarget("comment")).toBe(true);
    expect(isReactionTarget("announcement")).toBe(false);
  });
});
