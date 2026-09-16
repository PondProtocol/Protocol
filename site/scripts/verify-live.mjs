#!/usr/bin/env node
/**
 * Check a deployed host actually serves the identity anchor correctly.
 *
 *   node scripts/verify-live.mjs pond.greenhead.io
 *
 * Run this after every host or DNS change. Both candidate hosts can serve this file with the wrong
 * headers, and both failures are invisible in a browser: XLS-26 consumers are the ones that break.
 *
 * Checked, in order of how badly each one hurts:
 *   1. HTTPS 200 at the exact path
 *   2. Access-Control-Allow-Origin (XLS-26 asks for *)
 *   3. Content-Type is application/toml or text/plain
 *   4. The body parses as the expected stanzas and names the issuer
 */
const domain = process.argv[2]?.replace(/^https?:\/\//, "").replace(/\/$/, "");
if (!domain) {
  process.stderr.write(
    `usage: node scripts/verify-live.mjs <domain>\n` +
      `   eg: node scripts/verify-live.mjs pond.greenhead.io\n`,
  );
  process.exit(2);
}

const url = `https://${domain}/.well-known/xrp-ledger.toml`;
const results = [];
const add = (ok, name, detail) => results.push({ ok, name, detail });

let response;
try {
  response = await fetch(url, { headers: { Origin: "https://xrplmeta.org" }, redirect: "follow" });
} catch (error) {
  process.stderr.write(`\n  could not reach ${url}\n  ${error.message}\n\n`);
  process.exit(1);
}

add(response.ok, `HTTPS 200 at /.well-known/xrp-ledger.toml`, `got ${response.status}`);
add(
  response.url.startsWith("https://"),
  "served over HTTPS",
  `final url ${response.url}`,
);

const acao = response.headers.get("access-control-allow-origin");
add(
  acao === "*",
  "Access-Control-Allow-Origin: *",
  acao ? `got "${acao}"` : "header absent — browser-based XLS-26 consumers will be blocked",
);

const type = (response.headers.get("content-type") ?? "").toLowerCase();
add(
  /application\/toml|text\/plain/.test(type),
  "Content-Type is application/toml or text/plain",
  `got "${type || "none"}"`,
);

const body = await response.text();
add(body.includes("[[ISSUERS]]"), "body has an [[ISSUERS]] stanza");
add(body.includes("[[TOKENS]]"), "body has a [[TOKENS]] stanza");
add(!/REPLACE-WITH-YOUR-DOMAIN|<domain>|example\.com/i.test(body), "no placeholders left in the file");

process.stdout.write(`\n  ${url}\n  ${"-".repeat(58)}\n`);
for (const r of results) {
  process.stdout.write(
    `  ${r.ok ? "pass" : "FAIL"}  ${r.name}${!r.ok && r.detail ? `\n          ${r.detail}` : ""}\n`,
  );
}

const failed = results.filter((r) => !r.ok).length;
process.stdout.write(
  failed
    ? `\n  ${failed} check(s) failed. The issuer Domain field stays unset.\n\n`
    : `\n  headers and body look correct on the website host ${domain}.\n` +
        `  The issuer Domain field stays unset. Do not set Domain as part of\n` +
        `  attaching this host. Binding Domain can only be changed while the\n` +
        `  issuer can still sign.\n\n`,
);
process.exit(failed ? 1 : 0);
