import { animalGrid, getAnimal, GRID } from "@/lib/avatars";
import { cn } from "@/lib/utils";

// The avatar is displayed clipped to a circle. A 16x16 square's corners fall
// outside the inscribed circle, so features near the edges (ears!) get sliced.
// We fill the background to the full square (becomes the circle) but draw the
// animal scaled inward so every feature lands inside the circle.
const ART_SCALE = 0.82;
const ART_OFFSET = (GRID * (1 - ART_SCALE)) / 2;

/** Renders a preset animal as crisp pixel-art SVG, sized to fit a circle. */
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
      <g transform={`translate(${ART_OFFSET} ${ART_OFFSET}) scale(${ART_SCALE})`}>
        {grid.map((row, y) =>
          row.map((c, x) =>
            c ? (
              <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={c} />
            ) : null,
          ),
        )}
      </g>
    </svg>
  );
}
