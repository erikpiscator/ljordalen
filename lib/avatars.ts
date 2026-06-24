// Pixel-art animal avatars.
//
// Each animal is described as a short list of drawing primitives (discs,
// ellipses, triangles, rects) painted in order onto a 16x16 grid, then
// rasterized to square pixels. This keeps the data compact and the results
// consistent and cute, while producing genuine pixel art (crisp squares).
//
// This module is pure (no Node/DOM deps) so it can run on the server, in
// client components, and when generating SVG strings for emails.

export const GRID = 16;

type Pt = [number, number];

type Op =
  | { t: "disc"; cx: number; cy: number; r: number; c: string }
  | { t: "ellipse"; cx: number; cy: number; rx: number; ry: number; c: string }
  | { t: "rect"; x0: number; y0: number; x1: number; y1: number; c: string }
  | { t: "tri"; pts: [Pt, Pt, Pt]; c: string };

export interface AnimalSpec {
  id: string;
  label: string;
  /** Background fill behind the animal. */
  bg: string;
  ops: Op[];
}

// --- Animal catalog -------------------------------------------------------

export const PRESET_ANIMALS: AnimalSpec[] = [
  {
    id: "fox",
    label: "Räv",
    bg: "#FFE6D2",
    ops: [
      { t: "tri", pts: [[2.5, 0.5], [2.5, 7], [7, 5.5]], c: "#E8763A" },
      { t: "tri", pts: [[13.5, 0.5], [13.5, 7], [9, 5.5]], c: "#E8763A" },
      { t: "tri", pts: [[4, 2], [4, 6], [6.5, 5.5]], c: "#FBC8A6" },
      { t: "tri", pts: [[12, 2], [12, 6], [9.5, 5.5]], c: "#FBC8A6" },
      { t: "ellipse", cx: 8, cy: 8.5, rx: 6, ry: 5.4, c: "#F4884E" },
      { t: "ellipse", cx: 8, cy: 11.5, rx: 4.2, ry: 3.4, c: "#FFF4EC" },
      { t: "disc", cx: 5.4, cy: 8, r: 1.1, c: "#2A211C" },
      { t: "disc", cx: 10.6, cy: 8, r: 1.1, c: "#2A211C" },
      { t: "disc", cx: 8, cy: 10.4, r: 1, c: "#2A211C" },
    ],
  },
  {
    id: "bear",
    label: "Björn",
    bg: "#F1E4D5",
    ops: [
      { t: "disc", cx: 3.5, cy: 3.5, r: 2.4, c: "#9B6A43" },
      { t: "disc", cx: 12.5, cy: 3.5, r: 2.4, c: "#9B6A43" },
      { t: "disc", cx: 3.5, cy: 3.5, r: 1.1, c: "#C99B6E" },
      { t: "disc", cx: 12.5, cy: 3.5, r: 1.1, c: "#C99B6E" },
      { t: "ellipse", cx: 8, cy: 9, rx: 6, ry: 5.6, c: "#9B6A43" },
      { t: "ellipse", cx: 8, cy: 11.5, rx: 3.6, ry: 3, c: "#E4C9A8" },
      { t: "disc", cx: 5.5, cy: 8, r: 1, c: "#2A211C" },
      { t: "disc", cx: 10.5, cy: 8, r: 1, c: "#2A211C" },
      { t: "disc", cx: 8, cy: 10.5, r: 1.1, c: "#3A2A24" },
    ],
  },
  {
    id: "panda",
    label: "Panda",
    bg: "#E7EEF0",
    ops: [
      { t: "disc", cx: 3.5, cy: 3.2, r: 2.3, c: "#2B2B2B" },
      { t: "disc", cx: 12.5, cy: 3.2, r: 2.3, c: "#2B2B2B" },
      { t: "ellipse", cx: 8, cy: 9, rx: 6, ry: 5.6, c: "#F7F7F7" },
      { t: "ellipse", cx: 5.4, cy: 8, rx: 1.7, ry: 2.1, c: "#2B2B2B" },
      { t: "ellipse", cx: 10.6, cy: 8, rx: 1.7, ry: 2.1, c: "#2B2B2B" },
      { t: "disc", cx: 5.4, cy: 8.2, r: 0.8, c: "#FFFFFF" },
      { t: "disc", cx: 10.6, cy: 8.2, r: 0.8, c: "#FFFFFF" },
      { t: "disc", cx: 8, cy: 11, r: 1, c: "#2B2B2B" },
    ],
  },
  {
    id: "rabbit",
    label: "Kanin",
    bg: "#FBE6EF",
    ops: [
      { t: "ellipse", cx: 5.5, cy: 3, rx: 1.5, ry: 3, c: "#F3F1F4" },
      { t: "ellipse", cx: 10.5, cy: 3, rx: 1.5, ry: 3, c: "#F3F1F4" },
      { t: "ellipse", cx: 5.5, cy: 3, rx: 0.7, ry: 2.1, c: "#F7C0D5" },
      { t: "ellipse", cx: 10.5, cy: 3, rx: 0.7, ry: 2.1, c: "#F7C0D5" },
      { t: "ellipse", cx: 8, cy: 9.5, rx: 5.4, ry: 5, c: "#F8F6F8" },
      { t: "disc", cx: 5.8, cy: 9, r: 1, c: "#3A2A30" },
      { t: "disc", cx: 10.2, cy: 9, r: 1, c: "#3A2A30" },
      { t: "disc", cx: 8, cy: 11, r: 0.9, c: "#EC8FB2" },
    ],
  },
  {
    id: "cat",
    label: "Katt",
    bg: "#E7E9FB",
    ops: [
      { t: "tri", pts: [[2.5, 1], [2.5, 6.5], [7, 5.5]], c: "#8C8C9E" },
      { t: "tri", pts: [[13.5, 1], [13.5, 6.5], [9, 5.5]], c: "#8C8C9E" },
      { t: "tri", pts: [[4, 2.5], [4, 6], [6.3, 5.5]], c: "#F2C0CE" },
      { t: "tri", pts: [[12, 2.5], [12, 6], [9.7, 5.5]], c: "#F2C0CE" },
      { t: "ellipse", cx: 8, cy: 9, rx: 5.8, ry: 5.4, c: "#9B9BAD" },
      { t: "disc", cx: 5.6, cy: 8.5, r: 1.1, c: "#27331F" },
      { t: "disc", cx: 10.4, cy: 8.5, r: 1.1, c: "#27331F" },
      { t: "disc", cx: 8, cy: 10.6, r: 0.8, c: "#EC8FA8" },
      { t: "rect", x0: 1, y0: 10, x1: 4, y1: 10.6, c: "#6F6F80" },
      { t: "rect", x0: 12, y0: 10, x1: 15, y1: 10.6, c: "#6F6F80" },
    ],
  },
  {
    id: "owl",
    label: "Uggla",
    bg: "#ECE4F8",
    ops: [
      { t: "tri", pts: [[3, 1.5], [6.5, 1.5], [5, 4.5]], c: "#7E64A6" },
      { t: "tri", pts: [[13, 1.5], [9.5, 1.5], [11, 4.5]], c: "#7E64A6" },
      { t: "ellipse", cx: 8, cy: 9, rx: 6, ry: 5.8, c: "#8A6FB0" },
      { t: "disc", cx: 5.4, cy: 8, r: 2.3, c: "#F4ECDD" },
      { t: "disc", cx: 10.6, cy: 8, r: 2.3, c: "#F4ECDD" },
      { t: "disc", cx: 5.4, cy: 8, r: 1, c: "#2A211C" },
      { t: "disc", cx: 10.6, cy: 8, r: 1, c: "#2A211C" },
      { t: "tri", pts: [[7, 9.5], [9, 9.5], [8, 11.5]], c: "#F2B23C" },
    ],
  },
  {
    id: "frog",
    label: "Groda",
    bg: "#E2F3D7",
    ops: [
      { t: "disc", cx: 5, cy: 4.5, r: 2.3, c: "#7CC36A" },
      { t: "disc", cx: 11, cy: 4.5, r: 2.3, c: "#7CC36A" },
      { t: "disc", cx: 5, cy: 4.3, r: 1.2, c: "#FFFFFF" },
      { t: "disc", cx: 11, cy: 4.3, r: 1.2, c: "#FFFFFF" },
      { t: "disc", cx: 5, cy: 4.5, r: 0.6, c: "#22311C" },
      { t: "disc", cx: 11, cy: 4.5, r: 0.6, c: "#22311C" },
      { t: "ellipse", cx: 8, cy: 10, rx: 6, ry: 4.6, c: "#7CC36A" },
      { t: "ellipse", cx: 8, cy: 11.5, rx: 3.4, ry: 1.8, c: "#9BD98A" },
      { t: "disc", cx: 6.2, cy: 12, r: 0.45, c: "#22311C" },
      { t: "disc", cx: 9.8, cy: 12, r: 0.45, c: "#22311C" },
    ],
  },
  {
    id: "penguin",
    label: "Pingvin",
    bg: "#DBEEF5",
    ops: [
      { t: "ellipse", cx: 8, cy: 8.5, rx: 5.6, ry: 6, c: "#3A3F4B" },
      { t: "ellipse", cx: 8, cy: 10, rx: 3.6, ry: 4.4, c: "#F7F7F4" },
      { t: "disc", cx: 5.8, cy: 7, r: 1, c: "#1C1F26" },
      { t: "disc", cx: 10.2, cy: 7, r: 1, c: "#1C1F26" },
      { t: "tri", pts: [[6.8, 8.5], [9.2, 8.5], [8, 10.2]], c: "#F4A23B" },
    ],
  },
];

export const PRESET_IDS = PRESET_ANIMALS.map((a) => a.id);

const ANIMAL_BY_ID = new Map(PRESET_ANIMALS.map((a) => [a.id, a]));

export function getAnimal(id: string): AnimalSpec | undefined {
  return ANIMAL_BY_ID.get(id);
}

// --- Rasterizer -----------------------------------------------------------

function pointInTri(px: number, py: number, [a, b, c]: [Pt, Pt, Pt]): boolean {
  const d = (p1: Pt, p2: Pt, p3: Pt) =>
    (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
  const d1 = d([px, py], a, b);
  const d2 = d([px, py], b, c);
  const d3 = d([px, py], c, a);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

function hit(op: Op, x: number, y: number): boolean {
  switch (op.t) {
    case "disc": {
      const dx = x - op.cx;
      const dy = y - op.cy;
      return dx * dx + dy * dy <= op.r * op.r;
    }
    case "ellipse": {
      const dx = (x - op.cx) / op.rx;
      const dy = (y - op.cy) / op.ry;
      return dx * dx + dy * dy <= 1;
    }
    case "rect":
      return x >= op.x0 && x <= op.x1 && y >= op.y0 && y <= op.y1;
    case "tri":
      return pointInTri(x, y, op.pts);
  }
}

/** Rasterize an animal to a GRID×GRID array of hex colors (or null = bg). */
export function animalGrid(id: string): (string | null)[][] {
  const spec = ANIMAL_BY_ID.get(id);
  const grid: (string | null)[][] = Array.from({ length: GRID }, () =>
    Array.from({ length: GRID }, () => null as string | null),
  );
  if (!spec) return grid;
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const cx = x + 0.5;
      const cy = y + 0.5;
      for (let i = spec.ops.length - 1; i >= 0; i--) {
        if (hit(spec.ops[i], cx, cy)) {
          grid[y][x] = spec.ops[i].c;
          break;
        }
      }
    }
  }
  return grid;
}

/** Build a standalone SVG string for an animal (used in emails). */
export function animalSvg(id: string, size = 64): string {
  const spec = ANIMAL_BY_ID.get(id);
  const bg = spec?.bg ?? "#eee";
  const grid = animalGrid(id);
  let rects = "";
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const c = grid[y][x];
      if (c) rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${c}"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${GRID} ${GRID}" shape-rendering="crispEdges"><rect width="${GRID}" height="${GRID}" fill="${bg}"/>${rects}</svg>`;
}

// --- Defaults -------------------------------------------------------------

/** Deterministic default animal id derived from an email, so new members
 *  always have a stable, non-empty avatar. */
export function defaultAvatarFor(email: string): string {
  let h = 0;
  for (let i = 0; i < email.length; i++) {
    h = (h * 31 + email.charCodeAt(i)) >>> 0;
  }
  return PRESET_IDS[h % PRESET_IDS.length];
}
