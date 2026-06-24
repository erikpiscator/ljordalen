"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  addDays,
  addMonths,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { sv } from "date-fns/locale";
import { ChevronLeft, ChevronRight, ListChecks, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MemberAvatar } from "@/components/member-avatar";
import { BookingDialog } from "./booking-dialog";
import { BookingDetailDialog } from "./booking-detail";
import { BookingsList } from "./bookings-list";
import { YearView } from "./year-view";
import { bookingName } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BookingSettings, BookingWithMember } from "@/lib/types";

const fmt = (d: Date) => format(d, "yyyy-MM-dd");
const WEEKDAYS = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

export interface Me {
  email: string;
  isAdmin: boolean;
}

export function CalendarBoard({
  bookings,
  me,
  settings,
}: {
  bookings: BookingWithMember[];
  me: Me;
  settings: BookingSettings;
}) {
  const router = useRouter();
  const refresh = () => router.refresh();

  const [month, setMonth] = React.useState(() => startOfMonth(new Date()));
  const [view, setView] = React.useState<"month" | "year">("month");
  const [showBookings, setShowBookings] = React.useState(false);
  const [create, setCreate] = React.useState({ open: false, start: "", end: "" });
  const [detail, setDetail] = React.useState<BookingWithMember | null>(null);
  const [edit, setEdit] = React.useState<{
    open: boolean;
    booking: BookingWithMember | null;
  }>({ open: false, booking: null });

  const days = React.useMemo(() => {
    const from = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const to = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start: from, end: to });
  }, [month]);

  // dateStr -> the booking occupying that night.
  const occupancy = React.useMemo(() => {
    const map = new Map<string, BookingWithMember>();
    for (const b of bookings) {
      let d = parseISO(b.start);
      const end = parseISO(b.end);
      while (d < end) {
        map.set(fmt(d), b);
        d = addDays(d, 1);
      }
    }
    return map;
  }, [bookings]);

  const todayStr = fmt(new Date());

  function openCreate(start: string) {
    setCreate({ open: true, start, end: fmt(addDays(parseISO(start), 1)) });
  }

  function onDayClick(dateStr: string, occupant?: BookingWithMember) {
    if (occupant) {
      setDetail(occupant);
    } else if (dateStr >= todayStr) {
      openCreate(dateStr);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight capitalize">
            {view === "month"
              ? format(month, "MMMM yyyy", { locale: sv })
              : format(month, "yyyy")}
          </h1>
          <div className="flex rounded-md border p-0.5">
            {([
              ["month", "Månad"],
              ["year", "År"],
            ] as const).map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  "rounded px-2 py-0.5 text-xs font-medium transition-colors",
                  view === v
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMonth(startOfMonth(new Date()))}
          >
            Idag
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={view === "month" ? "Föregående månad" : "Föregående år"}
            onClick={() =>
              setMonth(view === "month" ? addMonths(month, -1) : addYears(month, -1))
            }
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={view === "month" ? "Nästa månad" : "Nästa år"}
            onClick={() =>
              setMonth(view === "month" ? addMonths(month, 1) : addYears(month, 1))
            }
          >
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBookings(true)}
          >
            <ListChecks /> Bokningar
          </Button>
          <Button size="sm" onClick={() => openCreate(todayStr)}>
            <Plus /> Boka
          </Button>
        </div>
      </div>

      {view === "year" ? (
        <YearView
          year={month.getFullYear()}
          occupancy={occupancy}
          onPickMonth={(first) => {
            setMonth(startOfMonth(first));
            setView("month");
          }}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border">
        <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-medium text-muted-foreground">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-2">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dateStr = fmt(day);
            const occupant = occupancy.get(dateStr);
            const inMonth = isSameMonth(day, month);
            const past = dateStr < todayStr;
            const isArrival = occupant?.start === dateStr;
            const color = occupant?.member?.color ?? "#888";
            const clickable = occupant || !past;
            return (
              <button
                key={dateStr}
                type="button"
                disabled={!clickable}
                onClick={() => onDayClick(dateStr, occupant)}
                style={
                  occupant
                    ? {
                        backgroundColor: `${color}22`,
                        boxShadow: isArrival
                          ? `inset 3px 0 0 ${color}`
                          : undefined,
                      }
                    : undefined
                }
                className={cn(
                  "relative flex min-h-16 flex-col gap-1 border-b border-r p-1.5 text-left transition-colors sm:min-h-20",
                  "[&:nth-child(7n)]:border-r-0",
                  !inMonth && "bg-muted/20 text-muted-foreground/50",
                  past && !occupant && "text-muted-foreground/40",
                  clickable && "hover:bg-accent/60 cursor-pointer",
                  !clickable && "cursor-default",
                )}
              >
                <span
                  className={cn(
                    "text-xs font-medium",
                    isToday(day) &&
                      "flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground",
                  )}
                >
                  {format(day, "d")}
                </span>
                {occupant && isArrival && occupant.member && (
                  <div className="flex items-center gap-1 overflow-hidden">
                    <MemberAvatar
                      avatar={occupant.member.avatar}
                      name={occupant.member.name}
                      className="size-5 shrink-0"
                    />
                    <span className="truncate text-xs font-medium">
                      {bookingName(occupant.member)}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

          <p className="text-center text-xs text-muted-foreground">
            Tryck på en ledig dag för att boka · tryck på en bokning för detaljer
          </p>
        </>
      )}

      <BookingDialog
        open={create.open}
        onOpenChange={(o) => setCreate((s) => ({ ...s, open: o }))}
        mode="create"
        initial={{ start: create.start, end: create.end, note: "" }}
        bookings={bookings}
        settings={settings}
        onDone={refresh}
      />

      <BookingDialog
        open={edit.open}
        onOpenChange={(o) => setEdit((s) => ({ ...s, open: o }))}
        mode="edit"
        bookingId={edit.booking?.id}
        initial={{
          start: edit.booking?.start ?? todayStr,
          end: edit.booking?.end ?? fmt(addDays(new Date(), 1)),
          note: edit.booking?.note ?? "",
        }}
        bookings={bookings}
        settings={settings}
        onDone={refresh}
      />

      <BookingDetailDialog
        booking={detail}
        me={me}
        onOpenChange={(o) => !o && setDetail(null)}
        onEdit={(b) => {
          setDetail(null);
          setEdit({ open: true, booking: b });
        }}
        onDone={refresh}
      />

      <Dialog open={showBookings} onOpenChange={setShowBookings}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader className="mr-6">
            <DialogTitle>Bokningar</DialogTitle>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto">
            <BookingsList
              bookings={bookings}
              me={me}
              settings={settings}
              hideTitle
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
