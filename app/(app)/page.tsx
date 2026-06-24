import { formatDistanceToNow, parseISO, format } from "date-fns";
import { sv } from "date-fns/locale";
import { CalendarDays, Megaphone, MapPin } from "lucide-react";
import Link from "next/link";
import { CabinInfo } from "@/components/cabin-info";
import { MemberAvatar } from "@/components/member-avatar";
import { BrandWordmark } from "@/components/brand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listBookings, withMembers } from "@/lib/bookings";
import { listAnnouncements } from "@/lib/announcements";
import { getCabinInfo } from "@/lib/info";
import { requireMember } from "@/lib/session";
import { todayStr, formatStay, nights } from "@/lib/dates";
import { bookingName } from "@/lib/format";
import type { BookingWithMember } from "@/lib/types";
import type { AnnouncementWithAuthor } from "@/lib/announcements";

export default async function HomePage() {
  const member = await requireMember();
  const today = todayStr();
  const thisYear = today.slice(0, 4);

  const [bookings, info, announcements] = await Promise.all([
    withMembers(await listBookings()),
    getCabinInfo(),
    listAnnouncements(),
  ]);

  const current = bookings.find((b) => b.start <= today && today < b.end) ?? null;

  const next = bookings
    .filter((b) => b.start > today)
    .sort((a, b) => a.start.localeCompare(b.start))[0] ?? null;

  const myNext = bookings
    .filter((b) => b.memberEmail === member.email && b.end > today)
    .sort((a, b) => a.start.localeCompare(b.start))[0] ?? null;

  const latestAnnouncement = announcements[0] ?? null;

  const yearBookings = bookings.filter((b) => b.start.startsWith(thisYear));
  const householdMap = new Map<string, { nights: number; color: string }>();
  for (const b of yearBookings) {
    const n = nights(b.start, b.end);
    const color = b.member?.color ?? "#888";
    const name = b.household || "Okänd";
    const prev = householdMap.get(name);
    if (prev) prev.nights += n;
    else householdMap.set(name, { nights: n, color });
  }
  const stats = Array.from(householdMap.entries())
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.nights - a.nights);
  const maxNights = stats[0]?.nights ?? 1;

  const showMyNext =
    myNext &&
    myNext.id !== current?.id &&
    myNext.id !== next?.id;

  return (
    <div className="space-y-6">
      {/* Cabin info banner */}
      <div className="rounded-xl border bg-gradient-to-br from-amber-50 to-orange-50 p-5 dark:from-amber-950/20 dark:to-orange-950/20">
        <div className="mb-3">
          <BrandWordmark className="text-base" />
        </div>
        <CabinInfo
          content={info}
          canEdit={member.role === "admin"}
          compact
        />
      </div>

      {/* At-a-glance grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Current occupancy or next booking */}
        {current ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <span className="inline-block size-1.5 rounded-full bg-green-500" />
                Stugan är belagd nu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BookingSnippet booking={current} />
              <p className="mt-2 text-xs text-muted-foreground">
                Avreser{" "}
                {format(parseISO(current.end), "EEEE d MMM", { locale: sv })}
              </p>
            </CardContent>
          </Card>
        ) : next ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <CalendarDays className="size-3.5" />
                Nästa vistelse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BookingSnippet booking={next} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-start gap-2 pt-6">
              <p className="text-sm text-muted-foreground">
                Inga kommande vistelser.
              </p>
              <Link
                href="/calendar"
                className="text-sm font-medium text-primary hover:underline"
              >
                Boka stugan →
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Latest announcement */}
        {latestAnnouncement ? (
          <AnnouncementCard announcement={latestAnnouncement} />
        ) : (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Inga anslag än.
            </CardContent>
          </Card>
        )}

        {/* My next booking — only when it differs from the cards above */}
        {showMyNext && (
          <Card className="sm:col-span-2 sm:max-w-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <MapPin className="size-3.5" />
                Din nästa vistelse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BookingSnippet booking={myNext} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Year usage stats */}
      {stats.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nyttjande {thisYear}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.map(({ name, nights: n, color }) => (
              <div key={name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{name}</span>
                  <span className="text-muted-foreground">
                    {n} {n === 1 ? "natt" : "nätter"}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(n / maxNights) * 100}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BookingSnippet({ booking }: { booking: BookingWithMember }) {
  const n = nights(booking.start, booking.end);
  const name = bookingName(
    booking.member,
    booking.member?.name ?? booking.memberEmail,
  );
  return (
    <div className="flex items-start gap-3">
      {booking.member && (
        <MemberAvatar
          avatar={booking.member.avatar}
          name={booking.member.name}
          color={booking.member.color}
          className="mt-0.5 shrink-0"
        />
      )}
      <div className="min-w-0">
        <p className="truncate font-medium">{name}</p>
        <p className="text-sm text-muted-foreground">
          {formatStay(booking.start, booking.end)}
        </p>
        <p className="text-sm text-muted-foreground">
          {n} {n === 1 ? "natt" : "nätter"}
        </p>
        {booking.note && (
          <p className="mt-1 truncate text-xs text-muted-foreground/80">
            {booking.note}
          </p>
        )}
      </div>
    </div>
  );
}

function AnnouncementCard({
  announcement,
}: {
  announcement: AnnouncementWithAuthor;
}) {
  const age = formatDistanceToNow(new Date(announcement.createdAt), {
    addSuffix: true,
    locale: sv,
  });
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Megaphone className="size-3.5" />
          Senaste anslaget
        </CardTitle>
      </CardHeader>
      <CardContent>
        {announcement.author && (
          <div className="mb-2 flex items-center gap-2">
            <MemberAvatar
              avatar={announcement.author.avatar}
              name={announcement.author.name}
              color={announcement.author.color}
              className="size-6 shrink-0"
            />
            <span className="text-sm font-medium">
              {announcement.author.name}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">{age}</span>
          </div>
        )}
        <p className="line-clamp-3 text-sm text-foreground/80">
          {announcement.body}
        </p>
        <Link
          href="/announcements"
          className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
        >
          Se alla anslag →
        </Link>
      </CardContent>
    </Card>
  );
}
