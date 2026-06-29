"use client";
import * as React from "react";
import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfDay,
} from "date-fns";
import type { DateRange } from "react-day-picker";
import { sv } from "date-fns/locale";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createBookingAction,
  updateBookingAction,
  type BookingFormInput,
} from "@/app/actions/bookings";
import { maxArrivalDate } from "@/lib/limits";
import { cn } from "@/lib/utils";
import type { BookingSettings, BookingWithMember } from "@/lib/types";

const fmt = (d: Date) => format(d, "yyyy-MM-dd");

export interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  /** Half-open range: start inclusive, end exclusive (both "yyyy-MM-dd"). */
  initial: { start: string; end: string; note: string };
  bookingId?: string;
  /** All bookings — their nights are disabled (self excluded on edit). */
  bookings: BookingWithMember[];
  settings: BookingSettings;
  onDone: () => void;
}

export function BookingDialog({
  open,
  onOpenChange,
  mode,
  initial,
  bookingId,
  bookings,
  settings,
  onDone,
}: BookingDialogProps) {
  // The picker's "to" is the departure day = the exclusive end, so the stored
  // half-open range maps straight onto from..to with no off-by-one.
  const [range, setRange] = React.useState<DateRange | undefined>();
  const [note, setNote] = React.useState(initial.note);
  const [pending, startTransition] = React.useTransition();

  // Reset local state whenever the dialog is (re)opened with new initial data.
  React.useEffect(() => {
    if (open) {
      setRange({
        from: parseISO(initial.start),
        to: parseISO(initial.end),
      });
      setNote(initial.note);
    }
  }, [open, initial.start, initial.end, initial.note]);

  const today = startOfDay(new Date());

  const latestArrival = maxArrivalDate(settings);

  // A night already taken by another booking (self excluded when editing).
  const isBookedNight = React.useCallback(
    (day: Date) => {
      const d = fmt(day);
      return bookings.some(
        (b) => b.id !== bookingId && d >= b.start && d < b.end,
      );
    },
    [bookings, bookingId],
  );

  // Only hard limits are disabled. Occupancy is enforced in handleSelect instead
  // of via `disabled`, so a checkout day may still land on the day another stay
  // begins (same-day handover) — its first night isn't part of this range.
  const disabled = React.useMemo(() => {
    const matchers: import("react-day-picker").Matcher[] = [{ before: today }];
    if (latestArrival) matchers.push({ after: parseISO(latestArrival) });
    return matchers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestArrival]);

  function rangeHasConflict(from: Date, to: Date): boolean {
    const n = differenceInCalendarDays(to, from);
    for (let i = 0; i < n; i++) {
      if (isBookedNight(addDays(from, i))) return true;
    }
    return false;
  }

  function handleSelect(r: DateRange | undefined) {
    if (
      r?.from &&
      r?.to &&
      differenceInCalendarDays(r.to, r.from) > 0 &&
      rangeHasConflict(r.from, r.to)
    ) {
      toast.error("Perioden krockar med en annan bokning. Välj på nytt.");
      setRange(undefined);
      return;
    }
    setRange(r);
  }

  // `to` is the departure day (exclusive), so nights = whole days between.
  const nightCount =
    range?.from && range?.to
      ? differenceInCalendarDays(range.to, range.from)
      : 0;

  const overMax = settings.maxNights > 0 && nightCount > settings.maxNights;

  function submit() {
    if (!range?.from || !range?.to) {
      toast.error("Välj ankomst- och avresedag.");
      return;
    }
    if (overMax) {
      toast.error(
        `Vistelser är begränsade till ${settings.maxNights} ${
          settings.maxNights === 1 ? "natt" : "nätter"
        }.`,
      );
      return;
    }
    const input: BookingFormInput = {
      start: fmt(range.from),
      end: fmt(range.to), // `to` is already the exclusive departure day
      note,
    };
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createBookingAction(input)
          : await updateBookingAction(bookingId!, input);
      if (res.ok) {
        toast.success(mode === "create" ? "Stugan bokad!" : "Bokningen uppdaterad.");
        onOpenChange(false);
        onDone();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Boka stugan" : "Ändra bokning"}
          </DialogTitle>
          <DialogDescription>
            Välj ankomst- och avresedag. Avresedagen är ledig för nästa familj.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3">
          <Calendar
            mode="range"
            required={false}
            selected={range}
            onSelect={handleSelect}
            disabled={disabled}
            modifiers={{ booked: isBookedNight }}
            modifiersClassNames={{
              booked:
                "[&_button]:line-through [&_button]:text-muted-foreground [&_button]:opacity-50",
            }}
            weekStartsOn={1}
            numberOfMonths={1}
            defaultMonth={parseISO(initial.start)}
            locale={sv}
            className="rounded-md border"
          />
          <div className="w-full">
            <Label htmlFor="note" className="mb-1.5">
              Notering <span className="text-muted-foreground">(valfritt)</span>
            </Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tar med hunden, kommer sent…"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="sm:justify-between sm:items-center">
          <span
            className={cn(
              "text-sm text-muted-foreground",
              overMax && "text-destructive",
            )}
          >
            {overMax
              ? `Max ${settings.maxNights} ${settings.maxNights === 1 ? "natt" : "nätter"}`
              : nightCount > 0
                ? `${nightCount} ${nightCount === 1 ? "natt" : "nätter"}`
                : "Välj datum"}
          </span>
          <Button
            onClick={submit}
            disabled={pending || nightCount < 1 || overMax}
          >
            {pending ? "Sparar…" : mode === "create" ? "Boka" : "Spara"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
