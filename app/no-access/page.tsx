import { signOut } from "@/lib/auth";
import { BrandMark } from "@/components/brand";
import { RequestAccess } from "@/components/request-access";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NoAccessPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <BrandMark className="size-8" />
          </div>
          <CardTitle className="text-xl">Du är inte med på listan än</CardTitle>
          <CardDescription>
            Den här stugkalendern är privat för vår familj. Be administratören
            lägga till din Google-e-post och logga in igen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/signin" });
            }}
          >
            <Button type="submit" variant="outline" className="w-full">
              Tillbaka till inloggning
            </Button>
          </form>

          <RequestAccess />
        </CardContent>
      </Card>
    </main>
  );
}
