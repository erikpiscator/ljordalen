import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig, devLoginEnabled } from "./auth.config";
import {
  ensureMember,
  getMember,
  normalizeEmail,
  resolveMemberForAuth,
} from "./members";
import { verifyPassword } from "./credentials";
import type { Role } from "./types";

// Email + password sign-in. Defined here (Node runtime) — not in auth.config —
// so its Firestore + bcrypt verification never leaks into the edge middleware.
const passwordProvider = Credentials({
  id: "password",
  name: "Lösenord",
  credentials: { email: {}, password: {} },
  authorize: async (creds) => {
    const email = normalizeEmail(String(creds?.email ?? ""));
    const password = String(creds?.password ?? "");
    if (!email || !password) return null;
    const member = await getMember(email);
    if (!member || !member.active) return null;
    if (!(await verifyPassword(email, password))) return null;
    return { id: member.email, email: member.email, name: member.name };
  },
});

// Node-runtime NextAuth instance. Adds the Firestore-backed allowlist gate and
// enriches the session with the member's role + household.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [...authConfig.providers, passwordProvider],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (!user.email) return false;
      // Dev login bypasses the allowlist and auto-provisions the member.
      if (devLoginEnabled && account?.provider === "dev") {
        await ensureMember(user.email, user.name);
        return true;
      }
      // Password sign-in already verified the member + password in authorize().
      if (account?.provider === "password") return true;
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
