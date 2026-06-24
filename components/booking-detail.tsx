"use client";
import * as React from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { MemberAvatar } from "@/components/member-avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cancelBookingAction } from "@/app/actions/bookings";
import { formatStay, nights, todayStr } from "@/lib/dates";
import { bookingName } from "@/lib/format";
import type { BookingWithMember } from "@/lib/types";
import type { Me } from "./calendar-board";

export function BookingDetailDialog({
  booking,
  me,
  onOpenChange,
  onEdit,
  onDone,
}: {
  booking: BookingWithMember | null;
  me: Me;
  onOpenChange: (open: boolean) => void;
  onEdit: (b: BookingWithMember) => void;
  onDone: () => void;
}) {
  const [pending, startTransition] = React.useTransition();
  const [confirming, setConfirming] = React.useState(false);

  React.useEffect(() => {
    if (booking) setConfirming(false);
  }, [booking]);

  if (!booking) return null;

  const isOwner = booking.memberEmail === me.email;
  const ended = booking.end <= todayStr();
  const canModify = me.isAdmin || (isOwner && !ended);
  const color = booking.member?.color ?? "#888";
  const personName = booking.member?.name ?? booking.memberEmail;
  const label = bookingName(booking.member, personName);
  const byPerson = label !== personName ? personName : null;
  const n = nights(booking.start, booking.end);

  function cancel() {
    startTransition(async () => {
      const res = await cancelBookingAction(booking!.id);
      if (res.ok) {
        toast.success("Bokningen avbokad.");
        onOpenChange(false);
        onDone();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={!!booking} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {booking.member && (
              <MemberAvatar
                avatar={booking.member.avatar}
                name={personName}
                color={color}
                ring
              />
            )}
            <div className="flex flex-col">
              <span>{label}</span>
              {byPerson && (
                <span className="text-sm font-normal text-muted-foreground">
                  Bokad av {byPerson}
                </span>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <div
            className="rounded-md border-l-4 bg-muted/50 px-3 py-2"
            style={{ borderColor: color }}
          >
            <div className="font-medium">{formatStay(booking.start, booking.end)}</div>
            <div className="text-sm text-muted-foreground">
              {n} {n === 1 ? "natt" : "nätter"}
            </div>
          </div>
          {booking.note && (
            <p className="whitespace-pre-wrap rounded-md bg-muted/50 px-3 py-2 text-sm">
              {booking.note}
            </p>
          )}
        </div>

        {canModify && (
          <DialogFooter className="sm:justify-between">
            {confirming ? (
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">
                  Avboka denna vistelse?
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirming(false)}
                    disabled={pending}
                  >
                    Behåll
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={cancel}
                    disabled={pending}
                  >
                    {pending ? "Avbokar…" : "Ja, avboka"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex w-full items-center justify-end gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirming(true)}
                >
                  <Trash2 /> Avboka
                </Button>
                <Button size="sm" onClick={() => onEdit(booking)}>
                  <Pencil /> Ändra
                </Button>
              </div>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
