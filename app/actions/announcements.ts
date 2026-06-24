"use server";
import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/session";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncement,
} from "@/lib/announcements";
import { notifyAnnouncement } from "@/lib/notify";

export type Result = { ok: true } | { ok: false; error: string };

export async function postAnnouncementAction(body: string): Promise<Result> {
  const member = await requireMember();
  const b = body.trim();
  if (!b) return { ok: false, error: "Write something first." };
  if (b.length > 2000) {
    return { ok: false, error: "That's a bit too long (2000 chars max)." };
  }
  await createAnnouncement(member.email, b);
  await notifyAnnouncement(member, b);
  revalidatePath("/announcements");
  return { ok: true };
}

export async function deleteAnnouncementAction(id: string): Promise<Result> {
  const member = await requireMember();
  const a = await getAnnouncement(id);
  if (!a) return { ok: true };
  if (a.authorEmail !== member.email && member.role !== "admin") {
    return { ok: false, error: "You can only delete your own posts." };
  }
  await deleteAnnouncement(id);
  revalidatePath("/announcements");
  return { ok: true };
}
