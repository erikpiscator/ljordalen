"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { setCabinInfo } from "@/lib/info";

export type Result = { ok: true } | { ok: false; error: string };

export async function updateCabinInfoAction(content: string): Promise<Result> {
  await requireAdmin();
  if (content.length > 5000) {
    return { ok: false, error: "That's a bit too long (5000 chars max)." };
  }
  await setCabinInfo(content);
  revalidatePath("/info");
  return { ok: true };
}
