import "server-only";
import { db } from "./firebase";
import { listMembers } from "./members";
import type { Avatar } from "./types";

const COL = "announcements";

export interface Announcement {
  id: string;
  authorEmail: string;
  body: string;
  createdAt: number;
}

export interface AnnouncementWithAuthor extends Announcement {
  author: { name: string; color: string; avatar: Avatar } | null;
}

export async function listAnnouncements(): Promise<AnnouncementWithAuthor[]> {
  const snap = await db
    .collection(COL)
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();
  const items = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Announcement, "id">),
  }));

  const members = await listMembers();
  const byEmail = new Map(members.map((m) => [m.email, m]));
  return items.map((a) => {
    const m = byEmail.get(a.authorEmail);
    return {
      ...a,
      author: m ? { name: m.name, color: m.color, avatar: m.avatar } : null,
    };
  });
}

export async function getAnnouncement(
  id: string,
): Promise<Announcement | null> {
  const snap = await db.collection(COL).doc(id).get();
  return snap.exists
    ? { id: snap.id, ...(snap.data() as Omit<Announcement, "id">) }
    : null;
}

export async function createAnnouncement(
  authorEmail: string,
  body: string,
): Promise<void> {
  await db.collection(COL).add({ authorEmail, body, createdAt: Date.now() });
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await db.collection(COL).doc(id).delete();
}
