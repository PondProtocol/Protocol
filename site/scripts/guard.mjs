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
import {
  DIST_DIR,
  IMPORTED_DIR,
  SITE_ROOT,
  WELL_KNOWN_PATH,
  bodyHash,
  fail,
  loadConfig,
  parseFrontMatter,
  sourceRoots,
} from "./lib.mjs";

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
const verifyHtml = existsSync(verifyPage) ? readFileSync(verifyPage, "utf8") : "";
check("verify page shows the canonical issuer address", verifyHtml.includes(config.site.issuerAddress));

// 10. Canonical direct links are the primary anti-impersonation mitigation, because search on at
//     least one major front-end does not reliably surface a token that has a working page. They
//     must actually render, and every one of them must appear.
const links = config.canonicalLinks?.links ?? [];
check("verify page renders the canonical link list", links.length > 0 && verifyHtml.includes("canon-list"));
const missingLinks = links.filter((l) => !verifyHtml.includes(l.url)).map((l) => l.label);
check("every canonical link is rendered", missingLinks.length === 0, missingLinks.join(", "));

// 11. An unverified link must never be presented as though somebody had checked it. A confidently
//     shown dead link teaches readers that this page cannot be trusted, which defeats its purpose.
if (links.some((l) => l.status !== "verified")) {
  check("unverified canonical links carry a visible warning", verifyHtml.includes("canon-warning"));
  const unbadged = links
    .filter((l) => l.status !== "verified")
    .filter((l) => !verifyHtml.includes("status-warn"))
    .map((l) => l.label);
  check("unverified links are badged", unbadged.length === 0, unbadged.join(", "));
}

const badStatus = links.filter((l) => !["verified", "unverified"].includes(l.status));
check(
  "every canonical link has a valid status",
  badStatus.length === 0,
  badStatus.map((l) => `${l.label}: "${l.status}"`).join(", "),
);

// 12. Vendored snapshot integrity, independent of the same check in build.mjs. Needs no access to
//     the sibling repositories, so it holds on the deploy host too. Upstream drift is a separate
//     concern handled by `sync --check` in CI; see scripts/sync.mjs.
const vendored = existsSync(IMPORTED_DIR) ? readdirSync(IMPORTED_DIR).filter((f) => !f.startsWith(".")) : [];
const tampered = [];
const unhashed = [];
for (const name of vendored) {
  const { data, body } = parseFrontMatter(readFileSync(join(IMPORTED_DIR, name), "utf8"));
  if (!data.source_sha256) unhashed.push(name);
  else if (bodyHash(body) !== data.source_sha256) tampered.push(name);
}
check("every vendored copy records a source hash", unhashed.length === 0, unhashed.join(", "));
check("no vendored copy was edited by hand", tampered.length === 0, tampered.join(", "));

// 13. A pin means the site renders documentation from an unmerged branch. That is sometimes the
//     right call — it is right today — but it must never be silent, so a pin without a recorded
//     reason fails, and every pin is echoed into the log below.
const roots = sourceRoots(config, SITE_ROOT);
const pins = Object.entries(roots).filter(([, r]) => r.ref !== "main" && r.ref !== "worktree");
const unexplained = pins.filter(([, r]) => !r.pinnedReason).map(([n]) => n);
check("every pinned source repository records a reason", unexplained.length === 0, unexplained.join(", "));

// 14. Regression test for the specific false claim that shipped in the first revision of this PR.
//     pnd/main and protocol/main both stated Default Ripple was enabled on the issuer, when the
//     live account has Flags 0. Publishing that tells readers holders can pay each other in $PND.
//     Pinned to a string rather than a document so it survives the documents being reorganised.
//     Patterns run against tag-stripped text, not raw HTML. A markdown table cell becomes
//     `<td>Default Ripple</td><td>Enabled on the issuer</td>`, so a pattern written against the
//     markdown pipe syntax would never match the built output and the check would silently pass
//     forever. Normalising first is what makes this assertion real.
const asText = (html) =>
  html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;|&#\d+;/gi, " ")
    .replace(/\s+/g, " ");

const falseClaims = [
  { pattern: /Default Ripple enabled \(so balances can ripple/i, what: "described as enabled in prose" },
  { pattern: /Default Ripple\s+Enabled on the issuer/i, what: "tabulated as enabled" },
  { pattern: /Default Ripple[^.]{0,40}\bis (?:set|enabled)\b/i, what: "asserted as currently set" },
];
for (const { pattern, what } of falseClaims) {
  const hits = textFiles
    .filter((f) => f.endsWith(".html"))
    .filter((f) => pattern.test(asText(readFileSync(f, "utf8"))))
    .map((f) => relative(DIST_DIR, f));
  check(
    `no page claims the issuer is configured (${what})`,
    hits.length === 0,
    hits.length
      ? `${hits.join(", ")} — the live issuer has Flags 0, so holder-to-holder $PND payments do not work`
      : "",
  );
}

/* ------------------------------------------------------------------ report */

process.stdout.write(`\n  Publication guard\n  ${"-".repeat(58)}\n`);
for (const c of checks) {
  process.stdout.write(
    `  ${c.ok ? "pass" : "FAIL"}  ${c.name}${c.detail && !c.ok ? `\n          ${c.detail}` : ""}\n`,
  );
}

if (failures.length) fail(`${failures.length} guard check(s) failed — not safe to publish`);
process.stdout.write(`\n  ${checks.length} checks passed\n\n`);
