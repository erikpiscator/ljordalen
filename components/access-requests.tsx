"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  approveRequestAction,
  rejectRequestAction,
} from "@/app/actions/access";
import type { AccessRequest } from "@/lib/types";

export function AccessRequests({ requests }: { requests: AccessRequest[] }) {
  if (requests.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Inga väntande förfrågningar.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <RequestRow key={r.email} request={r} />
      ))}
    </div>
  );
}

function RequestRow({ request }: { request: AccessRequest }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();

  function act(
    fn: (email: string) => Promise<{ ok: boolean; error?: string }>,
    msg: string,
  ) {
    start(async () => {
      const res = await fn(request.email);
      if (res.ok) {
        toast.success(msg);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{request.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {request.email}
          </p>
          {request.message && (
            <p className="mt-1 text-sm text-muted-foreground">
              “{request.message}”
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              act(approveRequestAction, `${request.name} tillagd.`)
            }
          >
            <Check /> Godkänn
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => act(rejectRequestAction, "Förfrågan avvisad.")}
          >
            <X /> Avvisa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
