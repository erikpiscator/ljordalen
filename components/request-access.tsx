"use client";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requestAccessAction } from "@/app/actions/access";

/**
 * Lets a family member who isn't on the allowlist yet ask the admin for access,
 * straight from the sign-in page. Collapsed by default so it stays out of the
 * way of the normal sign-in flow. Can be opened pre-filled (with an optional
 * notice) when someone tries to sign in with an email that isn't on the list —
 * remount with a new `key` to apply fresh `initial*` values.
 */
export function RequestAccess({
  initialOpen = false,
  initialName = "",
  initialEmail = "",
  notice,
}: {
  initialOpen?: boolean;
  initialName?: string;
  initialEmail?: string;
  notice?: string;
} = {}) {
  const [open, setOpen] = React.useState(initialOpen);
  const [name, setName] = React.useState(initialName);
  const [email, setEmail] = React.useState(initialEmail);
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await requestAccessAction({ name, email, message });
      if (res.ok) {
        setSent(true);
        toast.success("Förfrågan skickad. Administratören hör av sig.");
      } else {
        toast.error(res.error);
      }
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <p className="mt-4 border-t pt-4 text-center text-xs text-muted-foreground">
        Tack! Din förfrågan är skickad. Du kan logga in så snart administratören
        lagt till dig.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 w-full border-t pt-4 text-center text-xs text-muted-foreground hover:text-foreground"
      >
        Inte med än? Be om åtkomst
      </button>
    );
  }

  return (
    <div className="mt-4 border-t pt-4">
      {notice && (
        <p className="mb-2 rounded-md bg-muted px-3 py-2 text-center text-xs text-foreground">
          {notice}
        </p>
      )}
      <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
        Be administratören om åtkomst
      </p>
      <form onSubmit={onSubmit} className="space-y-2">
        <div className="space-y-1">
          <Label htmlFor="ra-name" className="text-xs">
            Namn
          </Label>
          <Input
            id="ra-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ra-email" className="text-xs">
            E-post
          </Label>
          <Input
            id="ra-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ra-message" className="text-xs">
            Meddelande{" "}
            <span className="font-normal text-muted-foreground">(valfritt)</span>
          </Label>
          <Textarea
            id="ra-message"
            rows={2}
            placeholder="T.ex. vem du är i familjen"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          variant="secondary"
          className="w-full"
          disabled={busy}
        >
          {busy ? "…" : "Skicka förfrågan"}
        </Button>
      </form>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-foreground"
      >
        Avbryt
      </button>
    </div>
  );
}
