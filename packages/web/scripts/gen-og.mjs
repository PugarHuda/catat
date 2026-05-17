/**
 * Generates packages/web/public/og.png — the 1200×630 social-preview
 * image referenced by og:image / twitter:image in index.html.
 *
 * Run: node scripts/gen-og.mjs   (from packages/web/)
 *
 * Why a script and not a committed binary: the PNG is a build artifact
 * derived from this SVG. Keeping the SVG as the source of truth means
 * tweaking the card = editing this file + re-running, no image editor.
 *
 * Rasterized with `sharp` (librsvg under the hood). Text uses a generic
 * sans stack — the brand identity in an OG card is carried by colour and
 * layout far more than the exact hand-font, and embedding webfonts into
 * a headless SVG rasterizer is brittle.
 */
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../public/og.png');

const W = 1200;
const H = 630;

// ─── palette (mirrors src/index.css theme tokens) ──────────────────────
const C = {
  paper: '#f4ecd6',
  paperHi: '#f8f0da',
  paperEdge: '#e9dfc1',
  ink: '#2b2823',
  inkSoft: '#6b6457',
  blue: '#2f6f9f',
  red: '#c2452f',
  green: '#5c8a3a',
};

const SANS = "Verdana, 'Segoe UI', 'DejaVu Sans', sans-serif";

// Faint ruled-paper horizontal lines, like the app's notebook aesthetic.
const ruleLines = Array.from({ length: Math.floor(H / 48) }, (_, i) => {
  const y = 48 * (i + 1);
  return `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${C.blue}" stroke-opacity="0.07" stroke-width="1"/>`;
}).join('');

// A chip = rounded rect outline + centred label. Slight rotation gives
// the hand-pinned sticker feel.
function chip(x, label, color, rotate) {
  const w = label.length * 15 + 36;
  return `
    <g transform="translate(${x} 524) rotate(${rotate} ${w / 2} 24)">
      <rect width="${w}" height="48" rx="9" fill="#ffffff" stroke="${color}" stroke-width="2.5"/>
      <text x="${w / 2}" y="32" text-anchor="middle" font-family="${SANS}"
            font-size="21" font-weight="700" fill="${color}" letter-spacing="1">${label}</text>
    </g>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="${C.paperHi}"/>
      <stop offset="0.45" stop-color="${C.paper}"/>
      <stop offset="1" stop-color="${C.paperEdge}"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${ruleLines}
  <!-- notebook margin rule -->
  <line x1="132" y1="0" x2="132" y2="${H}" stroke="${C.red}" stroke-opacity="0.18" stroke-width="2"/>

  <!-- brand glyph: rounded card with a 'c', drop shadow -->
  <g transform="translate(80 64)">
    <rect x="3" y="5" width="58" height="58" rx="14" fill="${C.ink}" fill-opacity="0.18"/>
    <g transform="rotate(-4 29 29)">
      <rect width="58" height="58" rx="14" fill="#ffffff" stroke="${C.ink}" stroke-width="3"/>
      <text x="29" y="44" text-anchor="middle" font-family="${SANS}"
            font-size="40" font-weight="700" fill="${C.blue}">c</text>
    </g>
  </g>
  <text x="158" y="106" font-family="${SANS}" font-size="46" font-weight="700" fill="${C.ink}">catat</text>
  <text x="324" y="106" font-family="${SANS}" font-size="15" fill="${C.inkSoft}" letter-spacing="2">EST. 2026</text>

  <!-- headline -->
  <text font-family="${SANS}" font-weight="800" fill="${C.ink}" font-size="68">
    <tspan x="80" y="270">Forms with</tspan>
    <tspan x="80" y="348"><tspan fill="${C.green}">cryptographic proof</tspan>,</tspan>
    <tspan x="80" y="426">not vendor promises.</tspan>
  </text>

  <!-- sub -->
  <text x="82" y="478" font-family="${SANS}" font-size="24" fill="${C.inkSoft}">
    Walrus-native feedback platform — stored on Walrus, sealed via Seal, proven on Sui.
  </text>

  <!-- chips -->
  ${chip(80, 'SUI', C.blue, -3)}
  ${chip(196, 'WALRUS', C.green, 2)}
  ${chip(368, 'SEAL', C.red, -1.5)}

  <!-- url pill -->
  <g transform="translate(862 524)">
    <rect width="258" height="48" rx="10" fill="#ffffff" stroke="${C.inkSoft}" stroke-width="2.5" stroke-dasharray="6 4"/>
    <text x="129" y="32" text-anchor="middle" font-family="${SANS}"
          font-size="19" font-weight="700" fill="${C.ink}">catat-walrus.vercel.app</text>
  </g>
</svg>`;

const png = await sharp(Buffer.from(svg)).png().toBuffer();
writeFileSync(OUT, png);
console.log(`[gen-og] wrote ${OUT} (${(png.length / 1024).toFixed(1)} KB, ${W}×${H})`);
