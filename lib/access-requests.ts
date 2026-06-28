import "server-only";
import { db, ACCESS_REQUESTS } from "./firebase";
import { normalizeEmail } from "./members";
import type { AccessRequest } from "./types";

export interface CreateAccessRequestInput {
  email: string;
  name: string;
  message?: string;
}

/**
 * Record (or refresh) a pending access request. Keyed by normalized email so a
 * person can't pile up duplicate requests — re-requesting just updates the note
 * and timestamp.
 */
export async function createAccessRequest(
  input: CreateAccessRequestInput,
): Promise<AccessRequest> {
  const email = normalizeEmail(input.email);
  const request: AccessRequest = {
    email,
    name: input.name.trim() || email,
    message: (input.message ?? "").trim().slice(0, 500),
    createdAt: Date.now(),
  };
  await db.collection(ACCESS_REQUESTS).doc(email).set(request);
  return request;
}

export async function getAccessRequest(
  email: string,
): Promise<AccessRequest | null> {
  const snap = await db
    .collection(ACCESS_REQUESTS)
    .doc(normalizeEmail(email))
    .get();
  return snap.exists ? (snap.data() as AccessRequest) : null;
}

/** Pending requests, oldest first. */
export async function listAccessRequests(): Promise<AccessRequest[]> {
  const snap = await db
    .collection(ACCESS_REQUESTS)
    .orderBy("createdAt", "asc")
    .get();
  return snap.docs.map((d) => d.data() as AccessRequest);
}

export async function deleteAccessRequest(email: string): Promise<void> {
  await db.collection(ACCESS_REQUESTS).doc(normalizeEmail(email)).delete();
}
