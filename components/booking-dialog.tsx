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
  // Convert the half-open stored range into an inclusive from..to for display:
  // the visible "to" is the last night = end - 1 day.
  const [range, setRange] = React.useState<DateRange | undefined>();
  const [note, setNote] = React.useState(initial.note);
  const [pending, startTransition] = React.useTransition();

  // Reset local state whenever the dialog is (re)opened with new initial data.
  React.useEffect(() => {
    if (open) {
      setRange({
        from: parseISO(initial.start),
        to: addDays(parseISO(initial.end), -1),
      });
      setNote(initial.note);
    }
  }, [open, initial.start, initial.end, initial.note]);

  const today = startOfDay(new Date());

  const latestArrival = maxArrivalDate(settings);

  // Disable past days, any night already taken, and days beyond the
  // advance-booking window.
  const disabled = React.useMemo(() => {
    const taken = (day: Date) => {
      const d = fmt(day);
      return bookings.some(
        (b) => b.id !== bookingId && d >= b.start && d < b.end,
      );
    };
    const matchers: import("react-day-picker").Matcher[] = [
      { before: today },
      taken,
    ];
    if (latestArrival) matchers.push({ after: parseISO(latestArrival) });
    return matchers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, bookingId, latestArrival]);

  const nightCount =
    range?.from && range?.to
      ? differenceInCalendarDays(range.to, range.from) + 1
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
      end: fmt(addDays(range.to, 1)), // back to exclusive end
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
            onSelect={setRange}
            disabled={disabled}
            excludeDisabled
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
