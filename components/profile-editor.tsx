"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { MemberAvatar } from "@/components/member-avatar";
import { PixelAvatar } from "@/components/pixel-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  setNotifyEmailAction,
  setPresetAvatarAction,
  updateOwnProfileAction,
} from "@/app/actions/members";
import { PRESET_ANIMALS } from "@/lib/avatars";
import { cn } from "@/lib/utils";
import type { Avatar } from "@/lib/types";

export function ProfileEditor({
  email,
  name: initialName,
  notifyEmail: initialNotifyEmail,
  color,
  avatar,
}: {
  email: string;
  name: string;
  notifyEmail: string;
  color: string;
  avatar: Avatar;
}) {
  const router = useRouter();
  const [name, setName] = React.useState(initialName);
  const [notifyEmail, setNotifyEmail] = React.useState(initialNotifyEmail);
  const [savingName, startSaveName] = React.useTransition();
  const [savingNotify, startSaveNotify] = React.useTransition();
  const [pickingPreset, startPreset] = React.useTransition();
  const [uploading, setUploading] = React.useState(false);
  const [hovered, setHovered] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const selectedId = avatar.type === "preset" ? avatar.value : null;
  const previewLabel = PRESET_ANIMALS.find(
    (a) => a.id === (hovered ?? selectedId),
  )?.label;

  function saveName() {
    startSaveName(async () => {
      const res = await updateOwnProfileAction({ name });
      if (res.ok) {
        toast.success("Namnet sparat.");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  function saveNotify() {
    startSaveNotify(async () => {
      const res = await setNotifyEmailAction(notifyEmail);
      if (res.ok) {
        toast.success("Notis-e-post sparad.");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  function choosePreset(id: string) {
    startPreset(async () => {
      const res = await setPresetAvatarAction(id);
      if (res.ok) router.refresh();
      else toast.error(res.error);
    });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/avatar", { method: "POST", body });
      const data = await res.json();
      if (res.ok) {
        toast.success("Bilden uppdaterad!");
        router.refresh();
      } else {
        toast.error(data.error ?? "Uppladdningen misslyckades.");
      }
    } catch {
      toast.error("Uppladdningen misslyckades.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Din profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <MemberAvatar
              avatar={avatar}
              name={name}
              color={color}
              ring
              className="size-20"
            />
            <div className="text-sm">
              <div className="font-medium">{name}</div>
              <div className="text-muted-foreground">{email}</div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Visningsnamn</Label>
            <div className="flex gap-2">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="max-w-xs"
              />
              <Button
                onClick={saveName}
                disabled={savingName || name.trim() === initialName.trim()}
              >
                Spara
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notify">
              Notis-e-post{" "}
              <span className="font-normal text-muted-foreground">(valfritt)</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="notify"
                type="email"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                placeholder="din@epost.se"
                className="max-w-xs"
              />
              <Button
                onClick={saveNotify}
                disabled={
                  savingNotify ||
                  notifyEmail.trim() === initialNotifyEmail.trim()
                }
              >
                Spara
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Används för aviseringar om du vill ha dem till en annan adress än
              den du loggar in med.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profilbild</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={onFile}
            />
            <Button
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              <Upload /> {uploading ? "Laddar upp…" : "Ladda upp en bild"}
            </Button>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Kvadratisk funkar bäst · PNG, JPEG eller WebP · upp till 5 MB
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <Label>…eller välj en pixelkompis</Label>
              <span className="min-h-4 text-xs font-medium text-muted-foreground tabular-nums">
                {previewLabel}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2 rounded-xl border bg-muted/30 p-3 sm:grid-cols-10">
              {PRESET_ANIMALS.map((animal) => {
                const active =
                  avatar.type === "preset" && avatar.value === animal.id;
                return (
                  <button
                    key={animal.id}
                    type="button"
                    title={animal.label}
                    aria-label={animal.label}
                    aria-pressed={active}
                    disabled={pickingPreset}
                    onClick={() => choosePreset(animal.id)}
                    onMouseEnter={() => setHovered(animal.id)}
                    onMouseLeave={() =>
                      setHovered((h) => (h === animal.id ? null : h))
                    }
                    onFocusCapture={() => setHovered(animal.id)}
                    onBlur={() =>
                      setHovered((h) => (h === animal.id ? null : h))
                    }
                    className={cn(
                      "mx-auto aspect-square w-full max-w-12 overflow-hidden rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-background transition hover:scale-110 focus-visible:outline-none focus-visible:ring-ring",
                      active && "ring-primary hover:scale-105",
                    )}
                  >
                    <PixelAvatar id={animal.id} />
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
