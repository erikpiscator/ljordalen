"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Dev-only login. Posts straight to the NextAuth credentials callback (with a
// fetched CSRF token) as a real form navigation, so the browser honors the
// Set-Cookie + redirect. This sidesteps a NextAuth v5 quirk where the
// Credentials provider doesn't set a session when invoked via a Server Action.
export function DevSignIn() {
  const [name, setName] = React.useState("Erik");
  const [email, setEmail] = React.useState("erik.piscator@protonmail.com");
  const [busy, setBusy] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { csrfToken } = await fetch("/api/auth/csrf").then((r) => r.json());
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/auth/callback/dev";
    const add = (n: string, v: string) => {
      const i = document.createElement("input");
      i.type = "hidden";
      i.name = n;
      i.value = v;
      form.appendChild(i);
    };
    add("csrfToken", csrfToken);
    add("email", email);
    add("name", name);
    add("callbackUrl", "/");
    document.body.appendChild(form);
    form.submit();
  }

  return (
    <div className="mt-6 border-t pt-4">
      <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
        Dev-läge — logga in som vem som helst
      </p>
      <form onSubmit={onSubmit} className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="dev-name" className="text-xs">Namn</Label>
            <Input
              id="dev-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="dev-email" className="text-xs">E-post</Label>
            <Input
              id="dev-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <Button
          type="submit"
          variant="secondary"
          className="w-full"
          disabled={busy}
        >
          {busy ? "Loggar in…" : "Dev-inloggning"}
        </Button>
      </form>
    </div>
  );
}
