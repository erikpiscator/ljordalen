// Shared domain types for the cabin booking app.

export type Role = "admin" | "member";

export type AvatarKind = "preset" | "upload";

export interface Avatar {
  type: AvatarKind;
  /** Preset id (e.g. "fox") when type === "preset", else a Cloud Storage URL. */
  value: string;
}

export interface Member {
  /** Lowercased Google email — also the Firestore document id. */
  email: string;
  /** Optional alternative email for notifications (falls back to `email`). */
  notifyEmail?: string;
  name: string;
  household: string;
  /** Hex color used to identify this member/household across the UI. */
  color: string;
  role: Role;
  active: boolean;
  avatar: Avatar;
  createdAt: number;
  updatedAt: number;
}

export interface Booking {
  id: string;
  /** Arrival day, inclusive — "YYYY-MM-DD". */
  start: string;
  /** Departure day, EXCLUSIVE — "YYYY-MM-DD". */
  end: string;
  memberEmail: string;
  household: string;
  note: string;
  createdAt: number;
  updatedAt: number;
}

/** A booking enriched with its owner's display info for rendering. */
export interface BookingWithMember extends Booking {
  member: Pick<Member, "name" | "color" | "avatar" | "household"> | null;
}

/** Admin-configurable booking rules. 0 means "no limit". */
export interface BookingSettings {
  /** Max nights per stay for members (admins are exempt). */
  maxNights: number;
  /** How many days ahead members may book (admins are exempt). */
  advanceWindowDays: number;
}
