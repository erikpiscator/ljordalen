import NextAuth from "next-auth";
import { authConfig, devLoginEnabled } from "./auth.config";
import { ensureMember, resolveMemberForAuth } from "./members";
import type { Role } from "./types";

// Node-runtime NextAuth instance. Adds the Firestore-backed allowlist gate and
// enriches the session with the member's role + household.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (!user.email) return false;
      // Dev login bypasses the allowlist and auto-provisions the member.
      if (devLoginEnabled && account?.provider === "dev") {
        await ensureMember(user.email, user.name);
        return true;
      }
      // Allowlist enforcement: only known/active members (or bootstrap admins)
      // may sign in. Returning false sends them to the /no-access page.
      const member = await resolveMemberForAuth(user.email, user.name);
      return Boolean(member);
    },
    async jwt({ token, user }) {
      // Hit Firestore only on initial sign-in (when `user` is present) so the
      // edge middleware never needs Node-only deps.
      if (user?.email) {
        const member = await resolveMemberForAuth(user.email, user.name);
        if (member) {
          token.email = member.email;
          token.name = member.name;
          token.role = member.role;
          token.household = member.household;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.email) session.user.email = token.email;
        session.user.name = (token.name as string) ?? session.user.name;
        session.user.role = (token.role as Role) ?? "member";
        session.user.household = (token.household as string) ?? "";
      }
      return session;
    },
  },
});
