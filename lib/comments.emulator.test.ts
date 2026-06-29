import { describe, expect, it } from "vitest";
import {
  commentParticipants,
  createComment,
  deleteComment,
  getComment,
  listComments,
} from "./comments";

// Each test works under a fresh announcement id so they don't collide; the
// Admin SDK routes to the Firestore emulator via FIRESTORE_EMULATOR_HOST.
const newId = () => `test-${Math.random().toString(36).slice(2)}`;

describe("comments data layer (emulator)", () => {
  it("creates and lists comments oldest-first", async () => {
    const aid = newId();
    const first = await createComment(aid, "anna@x.se", "först", null);
    const second = await createComment(aid, "bo@x.se", "sen", null);

    const list = await listComments(aid);
    expect(list.map((c) => c.id)).toEqual([first.id, second.id]);
    expect(list[0].body).toBe("först");
    expect(list[0].parentId).toBeNull();
  });

  it("stores parentId for replies", async () => {
    const aid = newId();
    const parent = await createComment(aid, "anna@x.se", "fråga", null);
    const reply = await createComment(aid, "bo@x.se", "svar", parent.id);

    const fetched = await getComment(aid, reply.id);
    expect(fetched?.parentId).toBe(parent.id);
  });

  it("hard-deletes a leaf comment", async () => {
    const aid = newId();
    const c = await createComment(aid, "anna@x.se", "ta bort mig", null);
    await deleteComment(aid, c.id);
    expect(await getComment(aid, c.id)).toBeNull();
    expect(await listComments(aid)).toHaveLength(0);
  });

  it("soft-deletes (tombstone) a comment that still has replies", async () => {
    const aid = newId();
    const parent = await createComment(aid, "anna@x.se", "förälder", null);
    await createComment(aid, "bo@x.se", "barn", parent.id);

    await deleteComment(aid, parent.id);

    const fetched = await getComment(aid, parent.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.deleted).toBe(true);
    expect(fetched?.body).toBe("");
    // Both the tombstone and the reply remain.
    expect(await listComments(aid)).toHaveLength(2);
  });

  it("collects distinct comment participants", async () => {
    const aid = newId();
    await createComment(aid, "anna@x.se", "1", null);
    await createComment(aid, "bo@x.se", "2", null);
    await createComment(aid, "anna@x.se", "3", null);

    const participants = await commentParticipants(aid);
    expect(participants.sort()).toEqual(["anna@x.se", "bo@x.se"]);
  });
});
