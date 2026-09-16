#!/usr/bin/env node
/**
 * Local preview server for site/dist/.
 *
 * Deliberately serves .well-known/ and applies the same Content-Type and CORS headers that
 * public/_headers asks the host for, so a local check and a production check look the same.
 * Node standard library only; this is not part of the deployed site.
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { DIST_DIR } from "./lib.mjs";

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

createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  let path = join(DIST_DIR, normalize(url).replace(/^(\.\.[/\\])+/, ""));

  if (existsSync(path) && statSync(path).isDirectory()) path = join(path, "index.html");
  if (!existsSync(path) || !statSync(path).isFile()) path = join(DIST_DIR, "404.html");

  const ext = extname(path).toLowerCase();
  res.setHeader("Content-Type", types[ext] ?? "application/octet-stream");
  // Mirrors public/_headers so `curl -I` locally matches what the host is asked to send.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.statusCode = path.endsWith("404.html") ? 404 : 200;
  createReadStream(path).pipe(res);
}).listen(port, host, () => {
  process.stdout.write(
    `\n  serving site/dist on http://${host}:${port}\n` +
      `  identity anchor: http://${host}:${port}/.well-known/xrp-ledger.toml\n\n`,
  );
});
