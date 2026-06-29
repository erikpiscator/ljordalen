import "server-only";
import { db, BOOKINGS } from "./firebase";
import { listMembers } from "./members";
import { rangesOverlap } from "./dates";
import type { Booking, BookingWithMember, Member } from "./types";

export class BookingConflictError extends Error {
  constructor(message = "Datumen är redan bokade.") {
    super(message);
    this.name = "BookingConflictError";
  }
}

function docToBooking(id: string, data: FirebaseFirestore.DocumentData): Booking {
  return {
    id,
    start: data.start,
    end: data.end,
    memberEmail: data.memberEmail,
    note: data.note ?? "",
    createdAt: data.createdAt ?? 0,
    updatedAt: data.updatedAt ?? 0,
  };
}

export async function getBooking(id: string): Promise<Booking | null> {
  const snap = await db.collection(BOOKINGS).doc(id).get();
  return snap.exists ? docToBooking(snap.id, snap.data()!) : null;
}

export async function listBookings(): Promise<Booking[]> {
  const snap = await db.collection(BOOKINGS).orderBy("start").get();
  return snap.docs.map((d) => docToBooking(d.id, d.data()));
}

/** Bookings overlapping a [from, to) window, e.g. a visible calendar month. */
export async function listBookingsInRange(
  from: string,
  to: string,
): Promise<Booking[]> {
  // Any booking starting before the window end, kept if it ends after the
  // window start. (Single-field inequality only — Firestore friendly.)
  const snap = await db
    .collection(BOOKINGS)
    .where("start", "<", to)
    .orderBy("start")
    .get();
  return snap.docs
    .map((d) => docToBooking(d.id, d.data()))
    .filter((b) => b.end > from);
}

/** Attach each booking's owner display info for rendering. */
export async function withMembers(
  bookings: Booking[],
): Promise<BookingWithMember[]> {
  const members = await listMembers();
  const byEmail = new Map<string, Member>(members.map((m) => [m.email, m]));
  return bookings.map((b) => {
    const m = byEmail.get(b.memberEmail);
    return {
      ...b,
      member: m ? { name: m.name, color: m.color, avatar: m.avatar } : null,
    };
  });
}

export interface BookingInput {
  start: string;
  end: string;
  memberEmail: string;
  note?: string;
}

/**
 * Create or update a booking, rejecting any overlap with an existing stay.
 * The conflict check + write run in a single Firestore transaction so two
 * simultaneous bookings can never both win the same dates.
 */
async function writeBooking(
  input: BookingInput,
  id?: string,
): Promise<Booking> {
  const now = Date.now();
  const ref = id
    ? db.collection(BOOKINGS).doc(id)
    : db.collection(BOOKINGS).doc();

  await db.runTransaction(async (tx) => {
    const candidates = await tx.get(
      db.collection(BOOKINGS).where("start", "<", input.end),
    );
    const conflict = candidates.docs.some((d) => {
      if (d.id === ref.id) return false; // ignore self on edit
      const b = d.data();
      return rangesOverlap(input.start, input.end, b.start, b.end);
    });
    if (conflict) throw new BookingConflictError();

    if (id) {
      tx.set(
        ref,
        {
          start: input.start,
          end: input.end,
          note: input.note ?? "",
          updatedAt: now,
        },
        { merge: true },
      );
    } else {
      tx.set(ref, {
        start: input.start,
        end: input.end,
        memberEmail: input.memberEmail,
        note: input.note ?? "",
        createdAt: now,
        updatedAt: now,
      });
    }
  });

  const created = await getBooking(ref.id);
  if (!created) throw new Error("Booking write failed");
  return created;
}

export function createBooking(input: BookingInput): Promise<Booking> {
  return writeBooking(input);
}

export function updateBooking(
  id: string,
  input: BookingInput,
): Promise<Booking> {
  return writeBooking(input, id);
}

export async function deleteBooking(id: string): Promise<void> {
  await db.collection(BOOKINGS).doc(id).delete();
}
