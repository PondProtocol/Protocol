#!/usr/bin/env node
/**
 * Serves site/dist/. Used for local preview (`npm run serve`) and as the Autoscale
 * production process (`cd site && node scripts/serve.mjs`).
 *
 * Deliberately serves .well-known/ (Replit Static omits that directory) and applies the
 * same Content-Type and CORS headers that public/_headers asks a static host for, so a
 * local check and a production check look the same. Node standard library only.
 *
 * Also answers /health, /api/session, /api/profile/*, /api/card/*, and /api/xaman/* .
 * Those routes need this process (Autoscale). The Xaman API secret stays
 * here — it is never written into site/dist. Session cookies are signed
 * here. Tadpole profiles are a JSON file this process can persist and
 * are visible only to an active Xaman session.
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { pipeline } from "node:stream";
import { createGzip } from "node:zlib";
import { DIST_DIR } from "./lib.mjs";
import { handleProfiles, isCardPage, isProfilePage } from "./profiles.mjs";
import { handleSession, touchSession } from "./session.mjs";
import { handleApi } from "./xaman.mjs";

const port = Number(process.env.PORT ?? 8080);
const host = process.env.HOST ?? "0.0.0.0";

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
  // XLS-26's usual choice for xrp-ledger.toml is text/plain; public/_headers
  // sets the same on the live path. Other .toml files, if any, follow it.
  ".toml": "text/plain; charset=utf-8",
};

if (!existsSync(DIST_DIR)) {
  process.stderr.write(`no site/dist — run "npm run build" first\n`);
  process.exit(1);
}

createServer(async (req, res) => {
  const url = decodeURIComponent((req.url ?? "/").split("?")[0]);

  try {
    if (await handleSession(req, res, url)) return;
    if (await handleProfiles(req, res, url, { readSession: touchSession })) return;
    if (await handleApi(req, res, url)) return;
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.end(JSON.stringify({ error: "server_error", message: "Request failed." }));
    process.stderr.write(`serve.mjs: ${error instanceof Error ? error.stack : error}\n`);
    return;
  }

  let path = join(DIST_DIR, normalize(url).replace(/^(\.\.[/\\])+/, ""));
  if (isProfilePage(url)) path = join(DIST_DIR, "profile", "index.html");
  if (isCardPage(url)) path = join(DIST_DIR, "card", "index.html");

  if (existsSync(path) && statSync(path).isDirectory()) path = join(path, "index.html");
  if (!existsSync(path) || !statSync(path).isFile()) path = join(DIST_DIR, "404.html");

  const ext = extname(path).toLowerCase();
  res.setHeader("Content-Type", types[ext] ?? "application/octet-stream");
  // Mirrors public/_headers so `curl -I` locally matches what the host is asked to send.
  res.setHeader("Access-Control-Allow-Origin", "*");
  if ([".css", ".js", ".svg", ".png"].includes(ext)) {
    res.setHeader("Cache-Control", "public, max-age=3600");
  }
  res.statusCode = path.endsWith("404.html") ? 404 : 200;
  const wantsGzip = String(req.headers["accept-encoding"] || "").includes("gzip");
  const compressible = [".html", ".css", ".js", ".svg", ".json", ".txt", ".toml"].includes(ext);
  if (wantsGzip && compressible) {
    res.setHeader("Content-Encoding", "gzip");
    res.setHeader("Vary", "Accept-Encoding");
    pipeline(createReadStream(path), createGzip({ level: 6 }), res, (error) => {
      if (error) res.destroy(error);
    });
    return;
  }
  createReadStream(path).pipe(res);
}).listen(port, host, () => {
  process.stdout.write(
    `\n  serving site/dist on http://${host}:${port}\n` +
      `  identity anchor: http://${host}:${port}/.well-known/xrp-ledger.toml\n` +
      `  health:          http://${host}:${port}/health\n\n`,
  );
});
