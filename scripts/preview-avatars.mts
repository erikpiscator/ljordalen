import sharp from "sharp";
import { PRESET_ANIMALS, animalSvg } from "../lib/avatars";

const cell = 96;
const gap = 16;
const cols = 4;
const rows = Math.ceil(PRESET_ANIMALS.length / cols);
const W = cols * cell + (cols + 1) * gap;
const H = rows * (cell + 28) + (rows + 1) * gap;

const tiles = await Promise.all(
  PRESET_ANIMALS.map(async (a, i) => {
    const x = gap + (i % cols) * (cell + gap);
    const y = gap + Math.floor(i / cols) * (cell + 28 + gap);
    // Round each avatar into a circle.
    const svg = animalSvg(a.id, cell);
    const png = await sharp(Buffer.from(svg))
      .resize(cell, cell)
      .composite([
        {
          input: Buffer.from(
            `<svg><circle cx="${cell / 2}" cy="${cell / 2}" r="${cell / 2}"/></svg>`,
          ),
          blend: "dest-in",
        },
      ])
      .png()
      .toBuffer();
    return { png, x, y, label: a.label };
  }),
);

const labels = tiles
  .map(
    (t) =>
      `<text x="${t.x + cell / 2}" y="${t.y + cell + 18}" font-family="sans-serif" font-size="14" fill="#333" text-anchor="middle">${t.label}</text>`,
  )
  .join("");

const base = await sharp({
  create: {
    width: W,
    height: H,
    channels: 4,
    background: { r: 245, g: 245, b: 247, alpha: 1 },
  },
})
  .composite([
    ...tiles.map((t) => ({ input: t.png, left: t.x, top: t.y })),
    { input: Buffer.from(`<svg width="${W}" height="${H}">${labels}</svg>`), left: 0, top: 0 },
  ])
  .png()
  .toBuffer();

await sharp(base).toFile("preview-avatars.png");
console.log(`Wrote preview-avatars.png (${W}x${H})`);
