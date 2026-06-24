import { addDays, parseISO } from "date-fns";
import type { BookingWithMember } from "@/lib/types";

const fmtYear = (d: Date) => d.getFullYear();

interface Row {
  household: string;
  color: string;
  nights: number;
}

/**
 * A calm, non-competitive overview of cabin usage this year. Rows are sorted
 * alphabetically (never ranked) and there's deliberately no "most/least" — it's
 * just a shared picture of how the cabin's been used, to help everyone plan.
 */
export function UsageOverview({
  bookings,
}: {
  bookings: BookingWithMember[];
}) {
  const year = fmtYear(new Date());

  const byHousehold = new Map<string, Row>();
  for (const b of bookings) {
    let d = parseISO(b.start);
    const end = parseISO(b.end);
    while (d < end) {
      if (fmtYear(d) === year) {
        const household = b.member?.household || b.household || "No family yet";
        const row =
          byHousehold.get(household) ??
          {
            household,
            color: b.member?.color ?? "#888888",
            nights: 0,
          };
        row.nights += 1;
        byHousehold.set(household, row);
      }
      d = addDays(d, 1);
    }
  }

  const rows = [...byHousehold.values()].sort((a, b) =>
    a.household.localeCompare(b.household),
  );
  const total = rows.reduce((sum, r) => sum + r.nights, 0);
  const max = Math.max(1, ...rows.map((r) => r.nights));

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Inga nätter bokade för {year} än.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-medium">Nätter i stugan {year}</h2>
        <p className="text-xs text-muted-foreground">
          En enkel översikt som hjälper alla att planera. {total}{" "}
          {total === 1 ? "natt" : "nätter"} bokade hittills.
        </p>
      </div>
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.household} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-sm">
              {r.household}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(r.nights / max) * 100}%`,
                  backgroundColor: r.color,
                }}
              />
            </div>
            <span className="w-12 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
              {r.nights}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
