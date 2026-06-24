"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateSettingsAction } from "@/app/actions/settings";
import type { BookingSettings } from "@/lib/types";

export function BookingLimits({ settings }: { settings: BookingSettings }) {
  const router = useRouter();
  const [maxNights, setMaxNights] = React.useState(String(settings.maxNights));
  const [advance, setAdvance] = React.useState(
    String(settings.advanceWindowDays),
  );
  const [pending, start] = React.useTransition();

  const dirty =
    Number(maxNights) !== settings.maxNights ||
    Number(advance) !== settings.advanceWindowDays;

  function save() {
    start(async () => {
      const res = await updateSettingsAction({
        maxNights: Number(maxNights) || 0,
        advanceWindowDays: Number(advance) || 0,
      });
      if (res.ok) {
        toast.success("Bokningsregler sparade.");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bokningsregler</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Gäller alla medlemmar (även administratörer). Sätt ett värde till{" "}
          <strong>0</strong> för ingen gräns.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="max-nights">Max antal nätter per vistelse</Label>
            <Input
              id="max-nights"
              type="number"
              min={0}
              value={maxNights}
              onChange={(e) => setMaxNights(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="advance">Boka upp till (dagar framåt)</Label>
            <Input
              id="advance"
              type="number"
              min={0}
              value={advance}
              onChange={(e) => setAdvance(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={save} disabled={pending || !dirty}>
            Spara regler
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
