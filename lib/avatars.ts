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
  {
    id: "dog",
    label: "Hund",
    bg: "#FFF8EA",
    ops: [
      { t: "ellipse", cx: 3, cy: 9.5, rx: 2.3, ry: 4, c: "#B8702A" },
      { t: "ellipse", cx: 13, cy: 9.5, rx: 2.3, ry: 4, c: "#B8702A" },
      { t: "ellipse", cx: 8, cy: 8, rx: 5.3, ry: 5, c: "#D08A3A" },
      { t: "ellipse", cx: 8, cy: 11.5, rx: 3.5, ry: 2.5, c: "#E8B870" },
      { t: "disc", cx: 5.6, cy: 7.2, r: 1.1, c: "#2A1408" },
      { t: "disc", cx: 10.4, cy: 7.2, r: 1.1, c: "#2A1408" },
      { t: "disc", cx: 6.0, cy: 6.8, r: 0.4, c: "#FFFFFF" },
      { t: "disc", cx: 10.8, cy: 6.8, r: 0.4, c: "#FFFFFF" },
      { t: "ellipse", cx: 8, cy: 10.6, rx: 1.4, ry: 1.0, c: "#1A0A04" },
    ],
  },
  {
    id: "mouse",
    label: "Mus",
    bg: "#F2F0F8",
    ops: [
      { t: "disc", cx: 4, cy: 4, r: 3, c: "#9898B0" },
      { t: "disc", cx: 12, cy: 4, r: 3, c: "#9898B0" },
      { t: "disc", cx: 4, cy: 4, r: 1.7, c: "#C890A8" },
      { t: "disc", cx: 12, cy: 4, r: 1.7, c: "#C890A8" },
      { t: "ellipse", cx: 8, cy: 9.5, rx: 5.5, ry: 5, c: "#A8A8C0" },
      { t: "disc", cx: 5.6, cy: 8.8, r: 1.1, c: "#1A1A2A" },
      { t: "disc", cx: 10.4, cy: 8.8, r: 1.1, c: "#1A1A2A" },
      { t: "disc", cx: 8, cy: 11, r: 1.0, c: "#CC4488" },
    ],
  },
  {
    id: "duck",
    label: "Anka",
    bg: "#FEFCE8",
    ops: [
      { t: "disc", cx: 8, cy: 4.5, r: 4, c: "#F0C020" },
      { t: "ellipse", cx: 8, cy: 9.5, rx: 5.5, ry: 5, c: "#F0C020" },
      { t: "ellipse", cx: 8, cy: 11.5, rx: 3.5, ry: 2.5, c: "#FEFCE8" },
      { t: "disc", cx: 5.5, cy: 8.5, r: 1.1, c: "#14120C" },
      { t: "disc", cx: 10.5, cy: 8.5, r: 1.1, c: "#14120C" },
      { t: "tri", pts: [[6.2, 9.8], [9.8, 9.8], [8, 11.8]], c: "#E87820" },
    ],
  },
  {
    id: "raccoon",
    label: "Tvättbjörn",
    bg: "#ECEDE8",
    ops: [
      { t: "disc", cx: 3.5, cy: 3, r: 2.3, c: "#606060" },
      { t: "disc", cx: 12.5, cy: 3, r: 2.3, c: "#606060" },
      { t: "disc", cx: 3.5, cy: 3, r: 1.0, c: "#D8C8B8" },
      { t: "disc", cx: 12.5, cy: 3, r: 1.0, c: "#D8C8B8" },
      { t: "ellipse", cx: 8, cy: 9, rx: 5.8, ry: 5.6, c: "#909090" },
      { t: "ellipse", cx: 5.2, cy: 8.2, rx: 2.5, ry: 1.8, c: "#282828" },
      { t: "ellipse", cx: 10.8, cy: 8.2, rx: 2.5, ry: 1.8, c: "#282828" },
      { t: "disc", cx: 5.2, cy: 8.2, r: 1.1, c: "#FFFFFF" },
      { t: "disc", cx: 10.8, cy: 8.2, r: 1.1, c: "#FFFFFF" },
      { t: "disc", cx: 5.2, cy: 8.2, r: 0.55, c: "#1A1A2A" },
      { t: "disc", cx: 10.8, cy: 8.2, r: 0.55, c: "#1A1A2A" },
      { t: "ellipse", cx: 8, cy: 11.5, rx: 3.4, ry: 2.8, c: "#C8C8B8" },
      { t: "disc", cx: 8, cy: 10.8, r: 0.9, c: "#3A3030" },
    ],
  },
  {
    id: "tiger",
    label: "Tiger",
    bg: "#FFF3E8",
    ops: [
      { t: "tri", pts: [[2.5, 1], [2.5, 6.5], [7, 5.5]], c: "#E8863A" },
      { t: "tri", pts: [[13.5, 1], [13.5, 6.5], [9, 5.5]], c: "#E8863A" },
      { t: "tri", pts: [[4, 2.5], [4, 6], [6.3, 5.5]], c: "#FFC0A0" },
      { t: "tri", pts: [[12, 2.5], [12, 6], [9.7, 5.5]], c: "#FFC0A0" },
      { t: "ellipse", cx: 8, cy: 9, rx: 5.8, ry: 5.4, c: "#E8863A" },
      { t: "rect", x0: 3.5, y0: 6, x1: 5.5, y1: 6.8, c: "#2A1808" },
      { t: "rect", x0: 10.5, y0: 6, x1: 12.5, y1: 6.8, c: "#2A1808" },
      { t: "rect", x0: 6.2, y0: 4.8, x1: 7.2, y1: 5.6, c: "#2A1808" },
      { t: "rect", x0: 8.8, y0: 4.8, x1: 9.8, y1: 5.6, c: "#2A1808" },
      { t: "ellipse", cx: 8, cy: 11.5, rx: 3.6, ry: 2.8, c: "#FFF0E0" },
      { t: "disc", cx: 5.6, cy: 8.5, r: 1.1, c: "#2A1808" },
      { t: "disc", cx: 10.4, cy: 8.5, r: 1.1, c: "#2A1808" },
      { t: "disc", cx: 8, cy: 10.8, r: 0.9, c: "#C03050" },
    ],
  },
  {
    id: "hedgehog",
    label: "Igelkott",
    bg: "#F3EAD9",
    ops: [
      { t: "ellipse", cx: 8, cy: 8, rx: 6, ry: 5.6, c: "#6E4B2A" },
      { t: "tri", pts: [[1.5, 8], [4, 7.5], [2.2, 3]], c: "#7E5832" },
      { t: "tri", pts: [[4, 7], [6.4, 6.5], [5, 1.8]], c: "#5E3F22" },
      { t: "tri", pts: [[6.6, 6], [9.4, 6], [8, 1]], c: "#7E5832" },
      { t: "tri", pts: [[9.6, 6.5], [12, 7], [11, 1.8]], c: "#5E3F22" },
      { t: "tri", pts: [[12, 7.5], [14.5, 8], [13.8, 3]], c: "#7E5832" },
      { t: "ellipse", cx: 8, cy: 11, rx: 4.4, ry: 3.8, c: "#E8CFA8" },
      { t: "disc", cx: 6.4, cy: 10.4, r: 0.95, c: "#2A1C10" },
      { t: "disc", cx: 9.6, cy: 10.4, r: 0.95, c: "#2A1C10" },
      { t: "disc", cx: 6.7, cy: 10.1, r: 0.3, c: "#FFFFFF" },
      { t: "disc", cx: 9.9, cy: 10.1, r: 0.3, c: "#FFFFFF" },
      { t: "ellipse", cx: 8, cy: 12.8, rx: 1.6, ry: 1.3, c: "#D8B488" },
      { t: "disc", cx: 8, cy: 12.8, r: 0.8, c: "#2A1C10" },
    ],
  },
  {
    id: "moose",
    label: "Älg",
    bg: "#EDE4D6",
    ops: [
      { t: "tri", pts: [[0.5, 0.8], [4.5, 4.2], [1, 5]], c: "#C9A36B" },
      { t: "tri", pts: [[15.5, 0.8], [11.5, 4.2], [15, 5]], c: "#C9A36B" },
      { t: "rect", x0: 1.2, y0: 1, x1: 3.4, y1: 2, c: "#C9A36B" },
      { t: "rect", x0: 12.6, y0: 1, x1: 14.8, y1: 2, c: "#C9A36B" },
      { t: "ellipse", cx: 3.3, cy: 6.2, rx: 1.6, ry: 2.2, c: "#7A5230" },
      { t: "ellipse", cx: 12.7, cy: 6.2, rx: 1.6, ry: 2.2, c: "#7A5230" },
      { t: "ellipse", cx: 8, cy: 7.6, rx: 4.6, ry: 4.4, c: "#8A5E37" },
      { t: "ellipse", cx: 8, cy: 12, rx: 3.4, ry: 3, c: "#A57A4E" },
      { t: "disc", cx: 6.1, cy: 7.4, r: 1, c: "#241509" },
      { t: "disc", cx: 9.9, cy: 7.4, r: 1, c: "#241509" },
      { t: "disc", cx: 6.4, cy: 7.1, r: 0.3, c: "#FFFFFF" },
      { t: "disc", cx: 10.2, cy: 7.1, r: 0.3, c: "#FFFFFF" },
      { t: "disc", cx: 6.8, cy: 12.2, r: 0.55, c: "#3A2614" },
      { t: "disc", cx: 9.2, cy: 12.2, r: 0.55, c: "#3A2614" },
    ],
  },
  {
    id: "deer",
    label: "Rådjur",
    bg: "#F6ECDD",
    ops: [
      { t: "ellipse", cx: 3.6, cy: 4, rx: 1.5, ry: 2.7, c: "#C98E54" },
      { t: "ellipse", cx: 12.4, cy: 4, rx: 1.5, ry: 2.7, c: "#C98E54" },
      { t: "ellipse", cx: 3.6, cy: 4.2, rx: 0.7, ry: 1.9, c: "#F4D7B8" },
      { t: "ellipse", cx: 12.4, cy: 4.2, rx: 0.7, ry: 1.9, c: "#F4D7B8" },
      { t: "ellipse", cx: 8, cy: 9, rx: 5.4, ry: 5, c: "#D89C5E" },
      { t: "ellipse", cx: 8, cy: 11.6, rx: 3, ry: 2.6, c: "#F4E0C6" },
      { t: "disc", cx: 4.6, cy: 9.4, r: 0.55, c: "#F4E0C6" },
      { t: "disc", cx: 11.4, cy: 9.4, r: 0.55, c: "#F4E0C6" },
      { t: "disc", cx: 5.9, cy: 8.4, r: 1, c: "#2A1A0C" },
      { t: "disc", cx: 10.1, cy: 8.4, r: 1, c: "#2A1A0C" },
      { t: "disc", cx: 6.2, cy: 8.1, r: 0.3, c: "#FFFFFF" },
      { t: "disc", cx: 10.4, cy: 8.1, r: 0.3, c: "#FFFFFF" },
      { t: "ellipse", cx: 8, cy: 11.2, rx: 1.1, ry: 0.85, c: "#3A2414" },
    ],
  },
  {
    id: "koala",
    label: "Koala",
    bg: "#E9E9EC",
    ops: [
      { t: "disc", cx: 3, cy: 5, r: 2.9, c: "#9AA0A6" },
      { t: "disc", cx: 13, cy: 5, r: 2.9, c: "#9AA0A6" },
      { t: "disc", cx: 3, cy: 5.2, r: 1.7, c: "#CFC4CC" },
      { t: "disc", cx: 13, cy: 5.2, r: 1.7, c: "#CFC4CC" },
      { t: "ellipse", cx: 8, cy: 9, rx: 5.6, ry: 5.4, c: "#A7ADB3" },
      { t: "disc", cx: 5.5, cy: 8.2, r: 1.05, c: "#26292E" },
      { t: "disc", cx: 10.5, cy: 8.2, r: 1.05, c: "#26292E" },
      { t: "disc", cx: 5.8, cy: 7.9, r: 0.32, c: "#FFFFFF" },
      { t: "disc", cx: 10.8, cy: 7.9, r: 0.32, c: "#FFFFFF" },
      { t: "ellipse", cx: 8, cy: 11, rx: 1.9, ry: 2.3, c: "#3A3E44" },
    ],
  },
  {
    id: "pig",
    label: "Gris",
    bg: "#FBE7EE",
    ops: [
      { t: "tri", pts: [[2.8, 1.8], [6.2, 3.4], [3.2, 6]], c: "#E89BB4" },
      { t: "tri", pts: [[13.2, 1.8], [9.8, 3.4], [12.8, 6]], c: "#E89BB4" },
      { t: "ellipse", cx: 8, cy: 9, rx: 5.8, ry: 5.2, c: "#F2AEC6" },
      { t: "ellipse", cx: 8, cy: 10.8, rx: 2.5, ry: 1.9, c: "#E88FB0" },
      { t: "disc", cx: 7.1, cy: 10.8, r: 0.5, c: "#B85C7E" },
      { t: "disc", cx: 8.9, cy: 10.8, r: 0.5, c: "#B85C7E" },
      { t: "disc", cx: 5.8, cy: 8, r: 1, c: "#3A1A28" },
      { t: "disc", cx: 10.2, cy: 8, r: 1, c: "#3A1A28" },
      { t: "disc", cx: 6.1, cy: 7.7, r: 0.3, c: "#FFFFFF" },
      { t: "disc", cx: 10.5, cy: 7.7, r: 0.3, c: "#FFFFFF" },
    ],
  },
  {
    id: "sheep",
    label: "Får",
    bg: "#E4EFE0",
    ops: [
      { t: "disc", cx: 4, cy: 5, r: 2.3, c: "#FBFAF6" },
      { t: "disc", cx: 12, cy: 5, r: 2.3, c: "#FBFAF6" },
      { t: "disc", cx: 3.4, cy: 9, r: 2.3, c: "#FBFAF6" },
      { t: "disc", cx: 12.6, cy: 9, r: 2.3, c: "#FBFAF6" },
      { t: "disc", cx: 8, cy: 3.8, r: 2.5, c: "#FBFAF6" },
      { t: "ellipse", cx: 8, cy: 10, rx: 5, ry: 4.6, c: "#FFFFFF" },
      { t: "ellipse", cx: 3.9, cy: 9.4, rx: 1.4, ry: 0.95, c: "#5C544E" },
      { t: "ellipse", cx: 12.1, cy: 9.4, rx: 1.4, ry: 0.95, c: "#5C544E" },
      { t: "ellipse", cx: 8, cy: 9.8, rx: 3.4, ry: 3.5, c: "#6E6760" },
      { t: "disc", cx: 6.6, cy: 9.2, r: 0.95, c: "#FFFFFF" },
      { t: "disc", cx: 9.4, cy: 9.2, r: 0.95, c: "#FFFFFF" },
      { t: "disc", cx: 6.6, cy: 9.3, r: 0.45, c: "#1A1A1A" },
      { t: "disc", cx: 9.4, cy: 9.3, r: 0.45, c: "#1A1A1A" },
      { t: "disc", cx: 8, cy: 11.2, r: 0.7, c: "#1A1A1A" },
    ],
  },
  {
    id: "chick",
    label: "Kyckling",
    bg: "#FEF6D8",
    ops: [
      { t: "tri", pts: [[7, 0.4], [9, 0.4], [8, 2.6]], c: "#F4C518" },
      { t: "ellipse", cx: 8, cy: 9, rx: 5.6, ry: 5.4, c: "#FBD63E" },
      { t: "disc", cx: 4.9, cy: 10.2, r: 1, c: "#F8B6C0" },
      { t: "disc", cx: 11.1, cy: 10.2, r: 1, c: "#F8B6C0" },
      { t: "disc", cx: 6, cy: 8, r: 1.15, c: "#22180A" },
      { t: "disc", cx: 10, cy: 8, r: 1.15, c: "#22180A" },
      { t: "disc", cx: 6.4, cy: 7.6, r: 0.35, c: "#FFFFFF" },
      { t: "disc", cx: 10.4, cy: 7.6, r: 0.35, c: "#FFFFFF" },
      { t: "tri", pts: [[6.6, 9.7], [9.4, 9.7], [8, 11.4]], c: "#F0902A" },
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
