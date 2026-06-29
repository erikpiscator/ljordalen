import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PixelAvatar } from "./pixel-avatar";
import { cn } from "@/lib/utils";
import type { Avatar as AvatarT } from "@/lib/types";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * A member's avatar rendered as a circle. Uploaded photos use AvatarImage (with
 * an initials fallback); preset animals render as inline pixel-art SVG. Pass a
 * `color` to draw a thin member-colored ring.
 */
export function MemberAvatar({
  avatar,
  name,
  color,
  className,
  ring = false,
}: {
  avatar: AvatarT;
  name: string;
  color?: string;
  className?: string;
  ring?: boolean;
}) {
  return (
    <Avatar
      className={cn("size-9", className)}
      style={
        ring && color
          ? { boxShadow: `0 0 0 2px var(--background), 0 0 0 4px ${color}` }
          : undefined
      }
    >
      {avatar.type === "upload" ? (
        <>
          <AvatarImage src={avatar.value} alt={name} />
          <AvatarFallback style={color ? { backgroundColor: color, color: "#fff" } : undefined}>
            {initials(name)}
          </AvatarFallback>
        </>
      ) : (
        <PixelAvatar id={avatar.value} />
      )}
    </Avatar>
  );
}
