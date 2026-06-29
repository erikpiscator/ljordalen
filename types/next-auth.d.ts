import type { Role } from "@/lib/types";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      role: Role;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
  }
}
