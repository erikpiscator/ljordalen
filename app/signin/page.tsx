import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { devLoginEnabled } from "@/lib/auth.config";
import { BrandMark } from "@/components/brand";
import { DevSignIn } from "@/components/dev-signin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BrandMark className="size-8" />
          </div>
          <CardTitle className="text-2xl">Ljørdalen</CardTitle>
          <CardDescription>
            Familjens stugbokningskalender. Logga in för att se vem som är där och boka din vistelse.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <Button type="submit" className="w-full" size="lg">
              <GoogleGlyph />
              Fortsätt med Google
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Åtkomst är begränsad till familjemedlemmar. Kommer du inte in, be
            administratören lägga till dig.
          </p>

          {devLoginEnabled && <DevSignIn />}
        </CardContent>
      </Card>
    </main>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#FFC107" d="M21.8 10.2H12v3.9h5.6c-.5 2.5-2.6 3.9-5.6 3.9a6 6 0 1 1 0-12c1.5 0 2.9.6 3.9 1.5l2.8-2.8A10 10 0 1 0 12 22c5 0 9.6-3.6 9.6-10 0-.6 0-1.2-.2-1.8z" />
      <path fill="#FF3D00" d="M3.2 7.3l3.2 2.3A6 6 0 0 1 12 6c1.5 0 2.9.6 3.9 1.5l2.8-2.8A10 10 0 0 0 3.2 7.3z" />
      <path fill="#4CAF50" d="M12 22c2.6 0 5-1 6.8-2.6l-3.1-2.6c-.9.6-2.1 1-3.7 1-3 0-5.1-1.4-5.6-3.9l-3.2 2.5A10 10 0 0 0 12 22z" />
      <path fill="#1976D2" d="M21.8 10.2H12v3.9h5.6c-.3 1.2-.9 2.1-1.9 2.8l3.1 2.6c1.8-1.7 2.9-4.2 2.9-7.5 0-.6 0-1.2-.2-1.8z" />
    </svg>
  );
}
