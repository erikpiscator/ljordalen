import { animalGrid, getAnimal, GRID } from "@/lib/avatars";
import { cn } from "@/lib/utils";

/** Renders a preset animal as crisp pixel-art SVG. */
export function PixelAvatar({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  const grid = animalGrid(id);
  const bg = getAnimal(id)?.bg ?? "#eeeeee";
  return (
    <svg
      viewBox={`0 0 ${GRID} ${GRID}`}
      className={cn("h-full w-full", className)}
      shapeRendering="crispEdges"
      role="img"
      aria-label={getAnimal(id)?.label ?? "avatar"}
    >
      <rect width={GRID} height={GRID} fill={bg} />
      {grid.map((row, y) =>
        row.map((c, x) =>
          c ? (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={c} />
          ) : null,
        ),
      )}
    </svg>
  );
}
