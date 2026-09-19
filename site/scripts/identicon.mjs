/**
 * Address-derived tadpole avatars. Same r-address always paints the same
 * image; different addresses look random. Used instead of the Greenhead
 * duck for new accounts.
 *
 * Public card URLs use the SHA-256 prefix, not the classic address.
 */
import { createHash } from "node:crypto";

const ADDR_RE = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;
const HASH_RE = /^[a-f0-9]{16}$/;
const PATH_RE = /^\/identicon\/(?:r[1-9A-HJ-NP-Za-km-z]{24,34}|[a-f0-9]{16})\.svg$/;

export function identiconHash(address) {
  if (!ADDR_RE.test(String(address || ""))) return "";
  return createHash("sha256").update(String(address)).digest("hex").slice(0, 16);
}

export function identiconPath(address) {
  const hash = identiconHash(address);
  return hash ? `/identicon/${hash}.svg` : "";
}

export function isIdenticonPath(value) {
  return PATH_RE.test(String(value || "").trim());
}

export function identiconSeed(key) {
  const text = String(key || "").trim();
  if (ADDR_RE.test(text)) return identiconHash(text);
  if (HASH_RE.test(text)) return text;
  return "";
}

function hsl(h, s, l) {
  return `hsl(${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%)`;
}

function renderSvg(seed) {
  const b = createHash("sha256").update(seed).digest();
  const hue = (b[0] * 360) / 256;
  const bg = hsl(hue, 28 + (b[1] % 16), 13 + (b[2] % 8));
  const shapes = [];
  for (let i = 0; i < 4; i += 1) {
    const o = 3 + i * 6;
    const sh = (hue + 28 + b[o] * 1.25) % 360;
    const color = hsl(sh, 58 + (b[o + 1] % 22), 44 + (b[o + 2] % 20));
    const cx = 10 + (b[o + 3] % 44);
    const cy = 10 + (b[o + 4] % 44);
    const w = 24 + (b[o + 1] % 34);
    const h = 24 + (b[o + 2] % 34);
    const rot = (b[o + 5] * 360) / 256;
    shapes.push(
      `<rect x="${(cx - w / 2).toFixed(1)}" y="${(cy - h / 2).toFixed(1)}" width="${w}" height="${h}" rx="${4 + (b[o] % 8)}" fill="${color}" transform="rotate(${rot.toFixed(1)} ${cx} ${cy})" opacity="0.94"/>`,
    );
  }
  const accentHue = (hue + 140 + b[27]) % 360;
  const accent = hsl(accentHue, 70, 56);
  const r = 8 + (b[28] % 10);
  shapes.push(`<circle cx="${16 + (b[29] % 32)}" cy="${16 + (b[30] % 32)}" r="${r}" fill="${accent}" opacity="0.88"/>`);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Generated tadpole avatar">
  <defs><clipPath id="c"><circle cx="32" cy="32" r="32"/></clipPath></defs>
  <g clip-path="url(#c)">
    <rect width="64" height="64" fill="${bg}"/>
    ${shapes.join("\n    ")}
  </g>
</svg>
`;
}

export function identiconSvg(key) {
  const seed = identiconSeed(key);
  return seed ? renderSvg(seed) : "";
}

export function handleIdenticon(req, res, url) {
  if (!PATH_RE.test(url || "")) return false;
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET, HEAD");
    res.end();
    return true;
  }
  const key = String(url).slice("/identicon/".length, -".svg".length);
  const svg = identiconSvg(key);
  if (!svg) {
    res.statusCode = 404;
    res.end();
    return true;
  }
  res.statusCode = 200;
  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  if (req.method === "HEAD") {
    res.end();
    return true;
  }
  res.end(svg);
  return true;
}
