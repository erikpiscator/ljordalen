"use client";
import * as React from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestLoginCodeAction } from "@/app/actions/login";
import { RequestAccess } from "@/components/request-access";
import { OtpInput } from "@/components/otp-input";

/**
 * Email-first, passwordless sign-in: the person enters their address, we email
 * an active member a one-time code, and they enter it to log in. An unknown
 * address falls through to the request-access flow. This is the alternative to
 * Google for family members without a Google account; Google stays the primary
 * button above this.
 */
type Step =
  | { name: "collapsed" }
  | { name: "email" }
  | { name: "code"; email: string }
  | { name: "request"; email: string };

export function EmailFirst() {
  // Collapsed by default so Google stays the one prominent action; email login
  // is a quiet link that expands the flow.
  const [step, setStep] = React.useState<Step>({ name: "collapsed" });
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function onContinue(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await requestLoginCodeAction(email);
      if (res.status === "sent") {
        setCode("");
        setStep({ name: "code", email });
      } else if (res.status === "unknown") {
        setStep({ name: "request", email });
      } else {
        toast.error("Ange en giltig e-postadress.");
      }
    } finally {
      setBusy(false);
    }
  }

  // Takes the code explicitly so auto-submit can pass the freshly-completed
  // value without waiting for the `code` state to flush. The `busy` guard stops
  // a double submit when auto-complete and the button race.
  async function verify(theCode: string) {
    if (theCode.length < 6 || busy) return;
    setBusy(true);
    try {
      const res = await signIn("otp", { email, code: theCode, redirect: false });
      if (res?.error) {
        toast.error("Fel eller utgången kod.");
        return;
      }
      window.location.href = "/";
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true);
    try {
      const res = await requestLoginCodeAction(email);
      if (res.status === "sent") toast.success("Ny kod skickad.");
      else toast.error("Kunde inte skicka en ny kod.");
    } finally {
      setBusy(false);
    }
  }

  function backToEmail() {
    setCode("");
    setStep({ name: "email" });
  }

  // The chosen address with a quiet "change" link, shown on steps past email.
  const emailRow = (
    <div className="mb-3 flex items-center justify-between gap-2 text-xs">
      <span className="truncate text-muted-foreground">{email}</span>
      <button
        type="button"
        onClick={backToEmail}
        className="shrink-0 text-muted-foreground underline hover:text-foreground"
      >
        Ändra
      </button>
    </div>
  );

  // The quiet "new here" entry, shown beneath the login options.
  const requestFooter = (
    <div className="mt-4 border-t pt-4 text-center">
      <button
        type="button"
        onClick={() => setStep({ name: "request", email })}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        Inte med i familjen än?{" "}
        <span className="text-foreground underline">Be om åtkomst</span>
      </button>
    </div>
  );

  if (step.name === "collapsed") {
    return (
      <>
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setStep({ name: "email" })}
            className="text-sm font-medium text-primary hover:underline"
          >
            Logga in med e-post i stället
          </button>
        </div>
        {requestFooter}
      </>
    );
  }

  if (step.name === "request") {
    return (
      <div className="mt-4 border-t pt-4">
        {emailRow}
        <RequestAccess
          initialOpen
          initialEmail={email}
          notice="Den här e-posten är inte med på listan än. Be administratören om åtkomst nedan."
        />
      </div>
    );
  }

  if (step.name === "code") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          verify(code);
        }}
        className="mt-4 space-y-3 border-t pt-4"
      >
        {emailRow}
        <p className="text-center text-xs text-muted-foreground">
          Vi har mejlat en inloggningskod. Ange den här.
        </p>
        <OtpInput
          value={code}
          onChange={setCode}
          onComplete={(v) => verify(v)}
          disabled={busy}
          autoFocus
        />
        <Button
          type="submit"
          variant="secondary"
          className="w-full"
          disabled={busy || code.length < 6}
        >
          {busy ? "…" : "Logga in"}
        </Button>
        <button
          type="button"
          onClick={resend}
          disabled={busy}
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          Skicka ny kod
        </button>
      </form>
    );
  }

  // step.name === "email"
  return (
    <>
      <form onSubmit={onContinue} className="mt-4 space-y-2 border-t pt-4">
        <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
          Logga in med e-post
        </p>
        <div className="space-y-1">
          <Label htmlFor="ef-email" className="text-xs">
            E-post
          </Label>
          <Input
            id="ef-email"
            type="email"
            autoComplete="email"
            placeholder="namn@exempel.se"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button type="submit" variant="secondary" className="w-full" disabled={busy}>
          {busy ? "…" : "Skicka kod"}
        </Button>
      </form>
      {requestFooter}
    </>
  );
}
