"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MemberAvatar } from "@/components/member-avatar";
import { BookingDetailDialog } from "./booking-detail";
import { BookingDialog } from "./booking-dialog";
import { UsageOverview } from "./usage-overview";
import { formatStay, nights, todayStr } from "@/lib/dates";
import { bookingName } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BookingSettings, BookingWithMember } from "@/lib/types";
import type { Me } from "./calendar-board";

function Row({
  booking,
  onClick,
}: {
  booking: BookingWithMember;
  onClick: () => void;
}) {
  const color = booking.member?.color ?? "#888";
  const personName = booking.member?.name ?? booking.memberEmail;
  const label = bookingName(booking.member, personName);
  // When the booking belongs to a family, show who in the family booked it.
  const byPerson = label !== personName ? personName : null;
  const n = nights(booking.start, booking.end);
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ borderColor: color }}
      className="flex w-full items-center gap-3 rounded-lg border border-l-4 bg-card p-3 text-left transition-colors hover:bg-accent/50"
    >
      {booking.member && (
        <MemberAvatar
          avatar={booking.member.avatar}
          name={personName}
          color={color}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-medium">
            {label}
            {byPerson && (
              <span className="ml-1.5 font-normal text-muted-foreground">
                · {byPerson}
              </span>
            )}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {n} {n === 1 ? "natt" : "nätter"}
          </span>
        </div>
        <div className="truncate text-sm text-muted-foreground">
          {formatStay(booking.start, booking.end)}
        </div>
        {booking.note && (
          <div className="truncate text-xs text-muted-foreground/80">
            {booking.note}
          </div>
        )}
      </div>
    </button>
  );
}

export function BookingsList({
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
  const today = todayStr();

  const [filter, setFilter] = React.useState<string>("all");
  const [detail, setDetail] = React.useState<BookingWithMember | null>(null);
  const [edit, setEdit] = React.useState<{
    open: boolean;
    booking: BookingWithMember | null;
  }>({ open: false, booking: null });

  const households = React.useMemo(
    () => Array.from(new Set(bookings.map((b) => b.household))).sort(),
    [bookings],
  );

  const visible = bookings.filter(
    (b) => filter === "all" || b.household === filter,
  );
  const upcoming = visible
    .filter((b) => b.end > today)
    .sort((a, b) => a.start.localeCompare(b.start));
  const past = visible
    .filter((b) => b.end <= today)
    .sort((a, b) => b.start.localeCompare(a.start));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Bokningar</h1>

      {households.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            Alla
          </FilterChip>
          {households.map((h) => (
            <FilterChip
              key={h}
              active={filter === h}
              onClick={() => setFilter(h)}
            >
              {h}
            </FilterChip>
          ))}
        </div>
      )}

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Kommande ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Tidigare ({past.length})</TabsTrigger>
          <TabsTrigger value="usage">Nyttjande</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="space-y-2">
          {upcoming.length === 0 ? (
            <Empty>Inga kommande vistelser. Boka en i kalendern!</Empty>
          ) : (
            upcoming.map((b) => (
              <Row key={b.id} booking={b} onClick={() => setDetail(b)} />
            ))
          )}
        </TabsContent>
        <TabsContent value="past" className="space-y-2">
          {past.length === 0 ? (
            <Empty>Inga tidigare vistelser än.</Empty>
          ) : (
            past.map((b) => (
              <Row key={b.id} booking={b} onClick={() => setDetail(b)} />
            ))
          )}
        </TabsContent>
        <TabsContent value="usage">
          <UsageOverview bookings={bookings} />
        </TabsContent>
      </Tabs>

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
      <BookingDialog
        open={edit.open}
        onOpenChange={(o) => setEdit((s) => ({ ...s, open: o }))}
        mode="edit"
        bookingId={edit.booking?.id}
        initial={{
          start: edit.booking?.start ?? today,
          end: edit.booking?.end ?? today,
          note: edit.booking?.note ?? "",
        }}
        bookings={bookings}
        settings={settings}
        onDone={refresh}
      />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Badge
      variant={active ? "default" : "outline"}
      className={cn("cursor-pointer select-none", !active && "hover:bg-accent")}
      render={<button type="button" onClick={onClick} />}
    >
      {children}
    </Badge>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
