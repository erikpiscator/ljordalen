"use client";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { sv } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { BookingWithMember } from "@/lib/types";

const fmt = (d: Date) => format(d, "yyyy-MM-dd");
// Swedish weekday initials: mån, tis, ons, tor, fre, lör, sön.
const WD = ["M", "T", "O", "T", "F", "L", "S"];

export function YearView({
  year,
  occupancy,
  onPickMonth,
}: {
  year: number;
  occupancy: Map<string, BookingWithMember>;
  onPickMonth: (first: Date) => void;
}) {
  const months = Array.from({ length: 12 }, (_, m) => new Date(year, m, 1));
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
      {months.map((first) => (
        <MiniMonth
          key={first.getMonth()}
          first={first}
          occupancy={occupancy}
          onPick={() => onPickMonth(first)}
        />
      ))}
    </div>
  );
}

function MiniMonth({
  first,
  occupancy,
  onPick,
}: {
  first: Date;
  occupancy: Map<string, BookingWithMember>;
  onPick: () => void;
}) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(first), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(first), { weekStartsOn: 1 }),
  });

  return (
    <button
      type="button"
      onClick={onPick}
      className="rounded-lg border p-3 text-left transition-colors hover:bg-accent/40"
    >
      <div className="mb-2 text-sm font-medium capitalize">
        {format(first, "MMMM", { locale: sv })}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {WD.map((w, i) => (
          <div
            key={i}
            className="text-center text-[10px] text-muted-foreground"
          >
            {w}
          </div>
        ))}
        {days.map((d) => {
          const ds = fmt(d);
          const occ = occupancy.get(ds);
          const inMonth = isSameMonth(d, first);
          const color = occ?.member?.color ?? "#888888";
          return (
            <div
              key={ds}
              style={occ ? { backgroundColor: `${color}40` } : undefined}
              className={cn(
                "flex aspect-square items-center justify-center rounded-[3px] text-[10px] leading-none",
                !inMonth && "opacity-0",
                isToday(d) && inMonth && "font-bold ring-1 ring-foreground/50",
              )}
            >
              {inMonth ? format(d, "d") : ""}
            </div>
          );
        })}
      </div>
    </button>
  );
}
