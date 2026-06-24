import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

// Dev-only login: enabled when DEV_LOGIN=true and NOT in production. Lets you
// sign in as any family member locally without setting up Google OAuth.
export const devLoginEnabled =
  process.env.DEV_LOGIN === "true" && process.env.NODE_ENV !== "production";

const providers: NextAuthConfig["providers"] = [Google];

if (devLoginEnabled) {
  providers.push(
    Credentials({
      id: "dev",
      name: "Dev",
      credentials: { email: {}, name: {} },
      // Edge-safe: no DB access here. Member provisioning happens in the
      // signIn/jwt callbacks (Node runtime) in ./auth.ts.
      authorize: async (creds) => {
        const email = String(creds?.email ?? "").toLowerCase().trim();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return null;
        const name = String(creds?.name ?? "").trim() || email.split("@")[0];
        return { id: email, email, name };
      },
    }),
  );
}

// Edge-safe NextAuth config: no Firebase/Node imports here, so it can be used
// by the proxy (which runs on the edge runtime). The Firestore-backed
// callbacks live in ./auth.ts and run only in the Node runtime.
export const authConfig = {
  trustHost: true,
  providers,
  pages: {
    signIn: "/signin",
    // Sign-in denied (not on the family allowlist) lands here.
    error: "/no-access",
  },
  callbacks: {
    // Gate every route behind a session. The allowlist itself is enforced at
    // sign-in (see ./auth.ts), so a non-member can never obtain a session.
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isPublic = pathname === "/signin" || pathname === "/no-access";
      if (isPublic) return true;
      return Boolean(auth?.user);
    },
  },
} satisfies NextAuthConfig;
