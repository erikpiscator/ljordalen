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
    color: member.color,
    avatar: member.avatar,
    isAdmin: member.role === "admin",
  };

  return (
    <div className="flex min-h-full flex-col">
      <AppNav user={user} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
