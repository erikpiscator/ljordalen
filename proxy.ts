import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Next 16 renamed the `middleware` convention to `proxy`. The NextAuth `auth`
// handler doubles as the proxy: its `authorized` callback (in authConfig)
// redirects unauthenticated users to /signin.
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  // Run on everything except Next internals, the auth API, and static assets.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
