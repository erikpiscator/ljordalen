"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Megaphone, Users } from "lucide-react";
import { BrandWordmark } from "@/components/brand";
import { MemberAvatar } from "@/components/member-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/actions/auth";
import type { Avatar } from "@/lib/types";

export interface NavUser {
  name: string;
  email: string;
  household: string;
  color: string;
  avatar: Avatar;
  isAdmin: boolean;
}

const links = [
  { href: "/", label: "Hem", icon: Home },
  { href: "/calendar", label: "Kalender", icon: CalendarDays },
  { href: "/announcements", label: "Anslag", icon: Megaphone },
  { href: "/family", label: "Familj", icon: Users },
];

export function AppNav({ user }: { user: NavUser }) {
  const pathname = usePathname();

  const allLinks = links;

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-2 px-4">
        <Link href="/" className="mr-2">
          <BrandWordmark className="text-base" />
        </Link>

        <nav className="flex items-center gap-1">
          {allLinks.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
              <MemberAvatar
                avatar={user.avatar}
                name={user.name}
                color={user.color}
                ring
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="truncate">{user.name}</span>
                    <span className="truncate text-xs font-normal text-muted-foreground">
                      {user.household}
                    </span>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/profile" />}>
                Profil &amp; avatar
              </DropdownMenuItem>
              {user.isAdmin && (
                <DropdownMenuItem render={<Link href="/admin" />}>
                  Admin
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  void signOutAction();
                }}
              >
                Logga ut
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
