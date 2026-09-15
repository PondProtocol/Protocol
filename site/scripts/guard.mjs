#!/usr/bin/env node
/**
 * Publication guard. Runs against site/dist/ after a build and fails on anything that should
 * never reach a public host.
 *
 * The allowlist in content.config.json is the primary control: the build has no way to discover a
 * document that is not listed there. This script is the independent second check, aimed at the
 * failure mode the allowlist cannot catch - somebody pasting internal analysis into an authored
 * page in site/content/.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { DIST_DIR, WELL_KNOWN_PATH, fail, loadConfig } from "./lib.mjs";

if (!existsSync(DIST_DIR)) fail(`no site/dist — run "npm run build" first`);

const config = loadConfig();
const failures = [];
const checks = [];

function check(name, ok, detail = "") {
  checks.push({ name, ok, detail });
  if (!ok) failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

/* ------------------------------------------------------- collect built files */

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    entry.isDirectory() ? walk(full) : files.push(full);
  }
})(DIST_DIR);

const textFiles = files.filter((f) => /\.(html|css|txt|toml|json|xml|js|svg)$/i.test(f));

/* ------------------------------------------------------------------- checks */

// 1. The identity anchor exists at exactly the XLS-26 path.
const wellKnown = join(DIST_DIR, WELL_KNOWN_PATH);
check(
  `/${WELL_KNOWN_PATH} exists at the exact path`,
  existsSync(wellKnown) && statSync(wellKnown).isFile(),
  existsSync(wellKnown) ? "" : "missing from build output",
);

// 2. No forbidden marker anywhere in the output.
for (const marker of config.forbiddenMarkers.strings) {
  const hits = textFiles.filter((f) => readFileSync(f, "utf8").includes(marker));
  check(
    `no output contains "${marker}"`,
    hits.length === 0,
    hits.map((f) => relative(DIST_DIR, f)).join(", "),
  );
}

// 3. Every published page in the allowlist actually produced a file, and nothing else did.
const published = config.pages.filter((p) => p.publish);
const expected = new Set(
  published.map((p) => (p.url === "/" ? "index.html" : `${p.url.replace(/^\/|\/$/g, "")}/index.html`)),
);
const built = new Set(
  files.map((f) => relative(DIST_DIR, f)).filter((f) => f.endsWith("index.html")),
);
const missing = [...expected].filter((f) => !built.has(f));
const unexpected = [...built].filter((f) => !expected.has(f));
check("every allowlisted page was built", missing.length === 0, missing.join(", "));
check("no page was built that is not allowlisted", unexpected.length === 0, unexpected.join(", "));

// 4. No excluded document leaked in. Match on a distinctive line from each excluded source.
for (const entry of config.excluded) {
  const source = join(DIST_DIR, "..", "imported", `${entry.repo}__${entry.path.replace(/\//g, "_")}`);
  check(
    `excluded ${entry.repo}/${entry.path} was not vendored`,
    !existsSync(source),
    existsSync(source) ? "found a vendored copy of an excluded document" : "",
  );
}

// 5. No navigable link may point at a placeholder domain.
//
// Scoped to href/src attributes on purpose. The imported repository documents legitimately discuss
// their own example.com placeholders in prose and code spans - that is honest status reporting, and
// flagging it would train everyone to ignore this check. What must never ship is a link a reader
// can click that goes somewhere fictional.
const placeholderDomains = [/example\.com/i, /REPLACE-WITH-YOUR-DOMAIN/i, /<domain>/i];
const linkHits = [];
for (const file of textFiles.filter((f) => f.endsWith(".html"))) {
  const body = readFileSync(file, "utf8");
  for (const [, attr] of body.matchAll(/(?:href|src)="([^"]*)"/g)) {
    if (placeholderDomains.some((re) => re.test(attr))) {
      linkHits.push(`${relative(DIST_DIR, file)} -> ${attr}`);
    }
  }
}
check("no navigable link points at a placeholder domain", linkHits.length === 0, linkHits.join(", "));

// 6. The identity anchor must not claim a placeholder domain as its own website.
//
// While the domain is undecided the file is expected to carry the placeholder plus TODO markers,
// so this check only asserts that the TODOs are still there to be found. verify-live.mjs is what
// refuses a real deployment that still has them.
if (existsSync(wellKnown)) {
  const toml = readFileSync(wellKnown, "utf8");
  const hasPlaceholder = /REPLACE-WITH-YOUR-DOMAIN/.test(toml);
  const hasTodo = /TODO/.test(toml);
  check(
    "xrp-ledger.toml placeholders are marked TODO",
    !hasPlaceholder || hasTodo,
    "the file contains a placeholder domain but no TODO marker, so nothing flags it before deploy",
  );
}

// 7. Pre-launch wording must be present while launchStatus is not live.
const index = join(DIST_DIR, "index.html");
if (config.site.launchStatus !== "live") {
  check(
    "pre-launch notice is rendered on the landing page",
    existsSync(index) && readFileSync(index, "utf8").includes("has not launched"),
  );
  check(
    "verify page states no $PND has been issued",
    existsSync(join(DIST_DIR, "verify", "index.html")) &&
      readFileSync(join(DIST_DIR, "verify", "index.html"), "utf8").includes("has not been issued"),
  );
}

// 8. Verifying the issuer is a core function of the site, so it must be reachable in one click
//    from the landing page and present in the persistent header on every page.
check(
  "landing page links to /verify/",
  existsSync(index) && readFileSync(index, "utf8").includes('href="/verify/"'),
);

const pagesMissingVerifyLink = files
  .filter((f) => f.endsWith("index.html") || f.endsWith("404.html"))
  .filter((f) => !readFileSync(f, "utf8").includes('href="/verify/" class="cta"'))
  .map((f) => relative(DIST_DIR, f));
check(
  "every page carries the verify link in its header",
  pagesMissingVerifyLink.length === 0,
  pagesMissingVerifyLink.join(", "),
);

// 9. The canonical issuer address must appear on the verify page. It is the whole point of it.
const verifyPage = join(DIST_DIR, "verify", "index.html");
check(
  "verify page shows the canonical issuer address",
  existsSync(verifyPage) && readFileSync(verifyPage, "utf8").includes(config.site.issuerAddress),
);

/* ------------------------------------------------------------------ report */

process.stdout.write(`\n  Publication guard\n  ${"-".repeat(58)}\n`);
for (const c of checks) {
  process.stdout.write(
    `  ${c.ok ? "pass" : "FAIL"}  ${c.name}${c.detail && !c.ok ? `\n          ${c.detail}` : ""}\n`,
  );
}

if (failures.length) fail(`${failures.length} guard check(s) failed — not safe to publish`);
process.stdout.write(`\n  ${checks.length} checks passed\n\n`);
