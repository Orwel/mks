import { readFile } from "node:fs/promises";
import { join } from "node:path";

import sharp from "sharp";

const SIZE = 512;
const RADIUS = 96;
const PADDING = 44;

const root = process.cwd();
const sourcePath = join(root, "public/brand/favicon-source.png");
const outputPath = join(root, "public/brand/favicon.png");

const roundedWhite = Buffer.from(
  `<svg width="${SIZE}" height="${SIZE}">
    <rect width="${SIZE}" height="${SIZE}" rx="${RADIUS}" ry="${RADIUS}" fill="#ffffff"/>
  </svg>`,
);

const sourceBuffer = await readFile(sourcePath);
const logoMax = SIZE - PADDING * 2;

const logo = await sharp(sourceBuffer)
  .resize(logoMax, logoMax, { fit: "inside" })
  .png()
  .toBuffer();

const { width: logoWidth, height: logoHeight } = await sharp(logo).metadata();
const left = Math.round((SIZE - logoWidth) / 2);
const top = Math.round((SIZE - logoHeight) / 2);

await sharp(roundedWhite)
  .resize(SIZE, SIZE)
  .composite([{ input: logo, left, top }])
  .png()
  .toFile(outputPath);

console.log(`Favicon generado: ${outputPath} (${SIZE}x${SIZE})`);
