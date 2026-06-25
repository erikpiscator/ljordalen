"use client";
import * as React from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpWithPasswordAction } from "@/app/actions/password";

export function PasswordAuth() {
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function passwordSignIn(): Promise<boolean> {
    try {
      const res = await signIn("password", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        toast.error("Fel e-post eller lösenord.");
        return false;
      }
      return true;
    } catch {
      toast.error("Fel e-post eller lösenord.");
      return false;
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const res = await signUpWithPasswordAction({ name, email, password });
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
      }
      if (await passwordSignIn()) {
        window.location.href = "/";
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 border-t pt-4">
      <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
        {mode === "signin"
          ? "…eller logga in med e-post"
          : "Skapa ett konto med e-post"}
      </p>
      <form onSubmit={onSubmit} className="space-y-2">
        {mode === "signup" && (
          <div className="space-y-1">
            <Label htmlFor="pw-name" className="text-xs">
              Namn
            </Label>
            <Input
              id="pw-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}
        <div className="space-y-1">
          <Label htmlFor="pw-email" className="text-xs">
            E-post
          </Label>
          <Input
            id="pw-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pw-password" className="text-xs">
            Lösenord
          </Label>
          <Input
            id="pw-password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button
          type="submit"
          variant="secondary"
          className="w-full"
          disabled={busy}
        >
          {busy
            ? "…"
            : mode === "signup"
              ? "Skapa konto"
              : "Logga in"}
        </Button>
      </form>
      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-foreground"
      >
        {mode === "signin"
          ? "Har du inget konto? Skapa ett"
          : "Har du redan ett konto? Logga in"}
      </button>
    </div>
  );
}
