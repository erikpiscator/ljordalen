import { describe, expect, it } from "vitest";
import { listReactions, toggleReaction } from "./reactions";

const newId = () => `test-${Math.random().toString(36).slice(2)}`;

describe("reactions data layer (emulator)", () => {
  it("adds then removes a reaction on toggle (idempotent)", async () => {
    const aid = newId();
    const added = await toggleReaction(aid, "post", aid, "anna@x.se", "👍");
    expect(added).toBe(true);
    let list = await listReactions(aid);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      targetType: "post",
      targetId: aid,
      memberEmail: "anna@x.se",
      emoji: "👍",
    });

    const removed = await toggleReaction(aid, "post", aid, "anna@x.se", "👍");
    expect(removed).toBe(false);
    list = await listReactions(aid);
    expect(list).toHaveLength(0);
  });

  it("toggling twice from the same member never duplicates", async () => {
    const aid = newId();
    await toggleReaction(aid, "post", aid, "anna@x.se", "❤️");
    await toggleReaction(aid, "post", aid, "anna@x.se", "❤️");
    await toggleReaction(aid, "post", aid, "anna@x.se", "❤️");
    // odd number of toggles -> present exactly once
    expect(await listReactions(aid)).toHaveLength(1);
  });

  it("normalizes the member email before keying", async () => {
    const aid = newId();
    await toggleReaction(aid, "post", aid, "Anna@X.se", "👍");
    // Toggling with a differently-cased email hits the same doc and removes it.
    const removed = await toggleReaction(aid, "post", aid, "anna@x.se", "👍");
    expect(removed).toBe(false);
    expect(await listReactions(aid)).toHaveLength(0);
  });

  it("ignores emojis outside the palette", async () => {
    const aid = newId();
    const added = await toggleReaction(aid, "post", aid, "anna@x.se", "🦊");
    expect(added).toBe(false);
    expect(await listReactions(aid)).toHaveLength(0);
  });

  it("keeps post and comment reactions, and members, separate", async () => {
    const aid = newId();
    await toggleReaction(aid, "post", aid, "anna@x.se", "👍");
    await toggleReaction(aid, "comment", "c1", "anna@x.se", "👍");
    await toggleReaction(aid, "comment", "c1", "bo@x.se", "👍");

    const list = await listReactions(aid);
    expect(list).toHaveLength(3);
    expect(list.filter((r) => r.targetType === "post")).toHaveLength(1);
    expect(list.filter((r) => r.targetId === "c1")).toHaveLength(2);
  });
});
