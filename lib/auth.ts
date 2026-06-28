import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig, devLoginEnabled } from "./auth.config";
import {
  ensureMember,
  getMember,
  normalizeEmail,
  resolveMemberForAuth,
} from "./members";
import { verifyLoginCode } from "./login-codes";
import type { Role } from "./types";

// Passwordless email sign-in: the member receives a one-time code and enters it.
// Defined here (Node runtime) — not in auth.config — so its Firestore + bcrypt
// verification never leaks into the edge middleware.
const otpProvider = Credentials({
  id: "otp",
  name: "E-postkod",
  credentials: { email: {}, code: {} },
  authorize: async (creds) => {
    const email = normalizeEmail(String(creds?.email ?? ""));
    const code = String(creds?.code ?? "").trim();
    if (!email || !code) return null;
    const member = await getMember(email);
    if (!member || !member.active) return null;
    if (!(await verifyLoginCode(email, code))) return null;
    return { id: member.email, email: member.email, name: member.name };
  },
});

// Node-runtime NextAuth instance. Adds the Firestore-backed allowlist gate and
// enriches the session with the member's role + household.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [...authConfig.providers, otpProvider],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (!user.email) return false;
      // Dev login bypasses the allowlist and auto-provisions the member.
      if (devLoginEnabled && account?.provider === "dev") {
        await ensureMember(user.email, user.name);
        return true;
      }
      // OTP sign-in already verified the member + live code in authorize().
      if (account?.provider === "otp") return true;
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
