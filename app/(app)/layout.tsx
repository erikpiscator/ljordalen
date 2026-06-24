import Link from "next/link";
import { Users } from "lucide-react";
import { AppNav, type NavUser } from "@/components/app-nav";
import { requireMember } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const member = await requireMember();
  const user: NavUser = {
    name: member.name,
    email: member.email,
    household: member.household,
    color: member.color,
    avatar: member.avatar,
    isAdmin: member.role === "admin",
  };
  const needsHousehold = !member.household?.trim();

  return (
    <div className="flex min-h-full flex-col">
      <AppNav user={user} />
      {needsHousehold && (
        <Link
          href="/profile"
          className="flex items-center justify-center gap-2 border-b bg-primary/10 px-4 py-2 text-sm text-foreground hover:bg-primary/15"
        >
          <Users className="size-4 shrink-0 text-primary" />
          <span>
            Välj din familj så alla vet vem som är vem —{" "}
            <span className="font-medium underline underline-offset-2">
              ställ in
            </span>
          </span>
        </Link>
      )}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
