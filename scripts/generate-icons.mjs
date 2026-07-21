/**
 * Generate branded PWA / favicon / OG images — dependency-free.
 *
 * Uses Next's bundled `next/og` (Satori + resvg) to rasterise a React tree to
 * PNG. No sharp / imagemagick / network needed. Run locally on macOS:
 *
 *   node scripts/generate-icons.mjs
 *
 * Outputs (committed to the repo):
 *   app/apple-icon.png              180x180  (Next apple-touch-icon convention)
 *   public/icons/icon-192.png       192x192  (PWA "any")
 *   public/icons/icon-512.png       512x512  (PWA "any")
 *   public/icons/icon-maskable.png  512x512  (PWA "maskable", full-bleed safe zone)
 *   public/og.png                   1200x630 (OpenGraph / Twitter card)
 */
import { ImageResponse } from "next/og.js";
import React from "react";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const BG = "#0f0f11";
const ACCENT = "#ffb27a";
const INK = "#0f0f11";
const MUTED = "#a7a7ae";

// Optional serif font for the OG wordmark (local macOS path; skipped if absent).
const GEORGIA = "/System/Library/Fonts/Supplemental/Georgia.ttf";
let serif = null;
if (existsSync(GEORGIA)) {
  serif = { name: "Georgia", data: await readFile(GEORGIA), weight: 700, style: "normal" };
}

/** The Kairos broadcast glyph (matches components/BrandMark.tsx). */
function glyph(px, color = INK) {
  const bar = (x, y, w, h, o = 1) =>
    React.createElement("rect", { x, y, width: w, height: h, rx: w / 2, fill: color, opacity: o });
  return React.createElement(
    "svg",
    { width: px, height: px, viewBox: "0 0 24 24" },
    bar(11, 6, 2, 12),
    bar(7, 8.5, 2, 7, 0.85),
    bar(15, 8.5, 2, 7, 0.85),
    bar(3, 10.5, 2, 3, 0.55),
    bar(19, 10.5, 2, 3, 0.55)
  );
}

const flexCenter = { display: "flex", alignItems: "center", justifyContent: "center" };

/** App tile: dark canvas + rounded accent tile + glyph. */
function tile(size) {
  const tileSize = Math.round(size * 0.66);
  return React.createElement(
    "div",
    { style: { width: size, height: size, background: BG, ...flexCenter } },
    React.createElement(
      "div",
      {
        style: {
          width: tileSize,
          height: tileSize,
          background: ACCENT,
          borderRadius: Math.round(size * 0.22),
          ...flexCenter,
        },
      },
      glyph(Math.round(tileSize * 0.62))
    )
  );
}

/** Maskable: full-bleed accent, glyph within the ~80% safe zone. */
function maskable(size) {
  return React.createElement(
    "div",
    { style: { width: size, height: size, background: ACCENT, ...flexCenter } },
    glyph(Math.round(size * 0.5))
  );
}

/** Apple touch icon: full-bleed accent (iOS applies its own rounding). */
function apple(size) {
  return React.createElement(
    "div",
    { style: { width: size, height: size, background: ACCENT, ...flexCenter } },
    glyph(Math.round(size * 0.56))
  );
}

/** OG card: dark canvas, accent tile, wordmark + tagline. */
function ogCard() {
  const children = [
    React.createElement(
      "div",
      {
        key: "tile",
        style: { width: 132, height: 132, background: ACCENT, borderRadius: 30, ...flexCenter },
      },
      glyph(84)
    ),
  ];
  if (serif) {
    children.push(
      React.createElement(
        "div",
        { key: "txt", style: { display: "flex", flexDirection: "column", marginLeft: 40 } },
        React.createElement(
          "div",
          { style: { fontFamily: "Georgia", fontSize: 92, fontWeight: 700, color: "#f4f4f5", lineHeight: 1 } },
          "Kairos"
        ),
        React.createElement(
          "div",
          { style: { fontFamily: "Georgia", fontSize: 34, color: MUTED, marginTop: 18 } },
          "Le Financial Times, chaque matin en audio"
        )
      )
    );
  }
  return React.createElement(
    "div",
    {
      style: {
        width: 1200,
        height: 630,
        background: BG,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
      },
    },
    ...children
  );
}

async function render(el, w, h) {
  const resp = new ImageResponse(el, {
    width: w,
    height: h,
    fonts: serif ? [serif] : [],
  });
  return Buffer.from(await resp.arrayBuffer());
}

await mkdir("public/icons", { recursive: true });

const jobs = [
  ["app/apple-icon.png", apple(180), 180, 180],
  ["public/icons/icon-192.png", tile(192), 192, 192],
  ["public/icons/icon-512.png", tile(512), 512, 512],
  ["public/icons/icon-maskable.png", maskable(512), 512, 512],
  ["public/og.png", ogCard(), 1200, 630],
];

for (const [out, el, w, h] of jobs) {
  const buf = await render(el, w, h);
  await writeFile(out, buf);
  console.log(`✓ ${out} (${buf.length.toLocaleString()} bytes)`);
}
console.log(serif ? "Serif OG wordmark: ON" : "Serif OG wordmark: skipped (font not found)");
