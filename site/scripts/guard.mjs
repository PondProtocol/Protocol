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
  WELL_KNOWN_VISIBLE_PATH,
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

const wellKnownVisible = join(DIST_DIR, WELL_KNOWN_VISIBLE_PATH);
check(
  `/${WELL_KNOWN_VISIBLE_PATH} exists as the non-dot twin`,
  existsSync(wellKnownVisible) && statSync(wellKnownVisible).isFile(),
  existsSync(wellKnownVisible) ? "" : "missing from build output",
);
if (existsSync(wellKnown) && existsSync(wellKnownVisible)) {
  check(
    "non-dot well-known twin matches the XLS-26 file",
    readFileSync(wellKnown).equals(readFileSync(wellKnownVisible)),
  );
}

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

// 6. The identity anchor names the website host and does not claim a placeholder.
//
// Remaining TODOs (icon, PRINCIPALS) are still expected. Live Domain and flags belong on
// authored HTML (/wallets/), not in TOML comments. The TOML file must keep the comment that
// distinguishes website host from on-ledger Domain rather than claiming No Freeze there.
if (existsSync(wellKnown)) {
  const toml = readFileSync(wellKnown, "utf8");
  const hasPlaceholder = /REPLACE-WITH-YOUR-DOMAIN/.test(toml);
  const host = config.site.domain;
  check(
    "xrp-ledger.toml does not use a placeholder domain",
    !hasPlaceholder,
    "REPLACE-WITH-YOUR-DOMAIN is still in the file",
  );
  if (host) {
    check(
      "xrp-ledger.toml names the configured website host",
      toml.includes(host) && toml.includes(`https://${host}`),
      `expected ${host} and https://${host} in the TOML`,
    );
    check(
      "xrp-ledger.toml does not claim the on-ledger Domain is set",
      /on-ledger issuer Domain:\s+UNSET/i.test(toml),
      "the file must keep website host and on-ledger Domain distinct",
    );
  }
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
    check(
      "wallets page states no $PND has been issued",
      existsSync(join(DIST_DIR, "wallets", "index.html")) &&
        readFileSync(join(DIST_DIR, "wallets", "index.html"), "utf8").includes("has not been issued"),
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
  .filter((f) => !readFileSync(f, "utf8").includes('href="/verify/"'))
  .map((f) => relative(DIST_DIR, f));
check(
  "every page carries a verify link",
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

// 11b. Third-party issuer addresses must not appear anywhere in the output.
//
//      The verify page describes the PND-code collisions as a pattern on purpose. Some of those
//      projects may be entirely legitimate, their metrics change constantly, and naming them would
//      be an accusation this site has no basis to make. This check makes that a property of the
//      build rather than an editorial habit: any classic XRPL address that is not this project's
//      own published accounts (issuer plus knownAddresses) fails it.
const addressPattern = /\br[1-9A-HJ-NP-Za-km-z]{24,34}\b/g;
const allowedAddresses = new Set([
  config.site.issuerAddress,
  ...(config.site.knownAddresses ?? []),
]);
const foreignAddresses = new Map();
for (const file of textFiles) {
  for (const [match] of readFileSync(file, "utf8").matchAll(addressPattern)) {
    if (allowedAddresses.has(match)) continue;
    // The null address is what blackholing sets a regular key to. Naming it identifies no project.
    if (/^rrrrrrrrrrrrrrrrrrrr[A-Za-z0-9]*$/.test(match)) continue;
    if (!foreignAddresses.has(match)) foreignAddresses.set(match, relative(DIST_DIR, file));
  }
}
check(
  "no third-party issuer address appears in the output",
  foreignAddresses.size === 0,
  [...foreignAddresses].map(([a, f]) => `${a} in ${f}`).join(", "),
);

// 11c. Code blocks on authored pages must fit the content column without horizontal scrolling.
//
//      Found the hard way: the four verify-page queries ran to 106 characters against roughly 77
//      that fit, so `overflow-x: auto` did its job and hid the trailing comment explaining what each
//      query was for. Nothing looked broken, the information was just gone unless you thought to
//      scroll sideways inside a code block. Commands meant to be copy-pasted must be fully visible.
//
//      Scoped to authored pages on purpose. Vendored documents carry ASCII architecture diagrams
//      that legitimately need width and are not this site's to reformat; those are reported by the
//      build rather than failed here.
const CODE_WIDTH = 78;
const authoredUrls = new Set(config.pages.filter((p) => p.authored && p.publish).map((p) => p.url));
const overlong = [];
for (const url of authoredUrls) {
  const file = join(DIST_DIR, url === "/" ? "index.html" : `${url.replace(/^\/|\/$/g, "")}/index.html`);
  if (!existsSync(file)) continue;
  const html = readFileSync(file, "utf8");
  for (const [, block] of html.matchAll(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/g)) {
    for (const raw of block.split("\n")) {
      const line = raw
        .replace(/<[^>]+>/g, "")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&")
        .trimEnd();
      if (line.length > CODE_WIDTH) overlong.push(`${url} (${line.length} chars): ${line.slice(0, 50)}…`);
    }
  }
}
check(
  `authored code blocks fit ${CODE_WIDTH} columns`,
  overlong.length === 0,
  overlong.join(" | "),
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

// 14. Authored pages must match the live issuer snapshot, not the Flags-0 era.
//     Vendored spec docs can lag until those repos are synced; they are not this check.
//     Default Ripple and No Freeze are on as of 2026-09-16; $PND is still unissued.
const asText = (html) =>
  html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;|&#\d+;/gi, " ")
    .replace(/\s+/g, " ");

const walletsPage = join(DIST_DIR, "wallets", "index.html");
const walletsHtml = existsSync(walletsPage) ? readFileSync(walletsPage, "utf8") : "";
const walletsText = asText(walletsHtml);
check("wallets page was built", walletsHtml.length > 0);
check(
  "wallets page shows the issuer, Treasury, and Operations addresses",
  walletsHtml.includes(config.site.issuerAddress) &&
    walletsHtml.includes(config.site.treasuryAddress) &&
    walletsHtml.includes(config.site.operationsAddress),
);
check(
  "wallets page does not invent a bot-ops address",
  /no address/i.test(walletsText) && /not created/i.test(walletsText),
);
check(
  "wallets page states Default Ripple and No Freeze from live account_flags",
  /Default Ripple/i.test(walletsText) && /No Freeze/i.test(walletsText),
);
check(
  "wallets page does not publish a DEX trade URL",
  !/firstledger\.net\/token/i.test(walletsHtml) && !/xpmarket\.com\/dex/i.test(walletsHtml),
);
check(
  "wallets page names the 2026-10-01 launch date without claiming $PND is live",
  walletsHtml.includes("2026-10-01") && /has not been issued/i.test(walletsText),
);

const indexHtml = existsSync(index) ? readFileSync(index, "utf8") : "";
const indexText = asText(indexHtml);
check(
  "landing page uses the owner tagline as-is",
  indexHtml.includes("Where Liquidity Goes to Stay."),
);
check(
  "landing page does not paraphrase the tagline as a substitute headline",
  !/Where Liquidity Remains/i.test(indexText) && !/Liquidity Stays Here/i.test(indexText),
);

const vestingPage = join(DIST_DIR, "vesting", "index.html");
const vestingHtml = existsSync(vestingPage) ? readFileSync(vestingPage, "utf8") : "";
const vestingText = asText(vestingHtml);
check("supply-split page was built", vestingHtml.length > 0);
check(
  "supply-split page is the 10 / 10 / 80 snapshot path, not TokenEscrow",
  /10 billion public/i.test(vestingText) &&
    /10 billion team/i.test(vestingText) &&
    /80 billion/i.test(vestingText) &&
    /proportional to \$PND held/i.test(vestingText) &&
    vestingHtml.includes("2027-01-01") &&
    vestingHtml.includes("2027-08-01") &&
    /snapshot/i.test(vestingText) &&
    /treasury payments/i.test(vestingText) &&
    /not TokenEscrow/i.test(vestingText),
);
check(
  "supply-split page does not require trust-line locking",
  !/asfAllowTrustLineLocking/i.test(vestingHtml) &&
    !/SetFlag:\s*17/i.test(vestingHtml),
);
check(
  "authored pages do not lock ten 9B escrows as the public schedule",
  !/locked as ten/i.test(walletsText) &&
    !/ten 9 billion Treasury self-escrows is the public/i.test(vestingText),
);
check(
  "wallets page does not treat trust-line locking as required",
  !/later step \*if\* escrow/i.test(walletsText) &&
    !/asfAllowTrustLineLocking is required/i.test(walletsText),
);

const lockedNinetyHtml = [];
for (const file of textFiles.filter((f) => f.endsWith(".html"))) {
  const html = readFileSync(file, "utf8");
  const locked =
    /holds the 90\s*(?:B|billion).{0,40}escrow/i.test(html) ||
    /holding the 90\s*(?:B|billion).{0,40}escrow/i.test(html) ||
    /the 90B(?: \$PND)? vesting escrow/i.test(html);
  if (locked && !html.includes('data-supply-revision="1"')) {
    lockedNinetyHtml.push(relative(DIST_DIR, file));
  }
}
check(
  "pages that still name a 90B escrow are marked as being revised",
  lockedNinetyHtml.length === 0,
  lockedNinetyHtml.join(", "),
);

const holdPage = join(DIST_DIR, "hold", "index.html");
const holdHtml = existsSync(holdPage) ? readFileSync(holdPage, "utf8") : "";
check("hold page was built", holdHtml.length > 0);
check(
  "hold page forbids seeds, generic connect-wallet, and claim buttons",
  /no seed/i.test(asText(holdHtml)) &&
    /connect a wallet/i.test(asText(holdHtml)) &&
    /claim button/i.test(asText(holdHtml)),
);
check(
  "hold page points at official Xaman SignIn on Trade",
  holdHtml.includes("/trade/") && /Xaman SignIn/i.test(asText(holdHtml)),
);

const connectPage = join(DIST_DIR, "connect", "index.html");
const connectHtml = existsSync(connectPage) ? readFileSync(connectPage, "utf8") : "";
check("connect page was built", connectHtml.length > 0);
check(
  "connect page is Xaman SignIn, not a claim or seed import",
  /SignIn/i.test(asText(connectHtml)) &&
    /never asks for a seed/i.test(asText(connectHtml)) &&
    /not been issued/i.test(asText(connectHtml)) &&
    /not a claim/i.test(asText(connectHtml)),
);
check(
  "connect page stays honest when Xaman keys are missing",
  /app keys/i.test(asText(connectHtml)),
);
check(
  "every page still links to /connect/ (kept, not featured in the top bar)",
  files
    .filter((f) => f.endsWith("index.html") || f.endsWith("404.html"))
    .every((f) => readFileSync(f, "utf8").includes('href="/connect/"')),
);

const xamanJs = join(DIST_DIR, "xaman.js");
check("xaman.js is copied into the build", existsSync(xamanJs));

const headerHtml = indexHtml.match(/<header class="topbar">[\s\S]*?<\/header>/)?.[0] ?? "";
const brandHtml = headerHtml.match(/<a class="brand"[^>]*>[\s\S]*?<\/a>/)?.[0] ?? "";
const brandText = asText(brandHtml);
const duckMark = join(DIST_DIR, "greenhead-duck.png");
check(
  "top bar brand word is Pond",
  /^\s*Pond\s*$/.test(brandText),
);
check(
  "top bar credits Greenhead Labs with the duck mark and a return link",
  headerHtml.includes("Powered By Greenhead Labs") &&
    headerHtml.includes("/greenhead-duck.png") &&
    existsSync(duckMark) &&
    headerHtml.includes('href="https://greenhead.io"') &&
    headerHtml.includes("Return to Main Site"),
);
const topnavHtml = headerHtml.match(/<nav class="topnav"[\s\S]*?<\/nav>/)?.[0] ?? "";
const topnavSummaries = [...topnavHtml.matchAll(/<summary>([\s\S]*?)<\/summary>/g)].map((match) =>
  asText(match[1]).trim(),
);
const startHereMenu =
  topnavHtml.match(/<div class="topnav-start">[\s\S]*?<\/div>/)?.[0] ??
  topnavHtml.match(/<details class="topnav-menu" data-topnav-menu="start-here">[\s\S]*?<\/details>/)?.[0] ??
  "";
const startHereIndex =
  headerHtml.match(/<details class="nav-group" data-nav-group="start-here"[\s\S]*?<\/details>/)?.[0] ?? "";
const protocolMenu =
  topnavHtml.match(/<details class="topnav-menu" data-topnav-menu="protocol">[\s\S]*?<\/details>/)?.[0] ?? "";
const startHerePanel = startHereMenu.match(/<div class="topnav-panel">[\s\S]*?<\/div>/)?.[0] ?? "";
const startHereLabels = [...startHerePanel.matchAll(/<a href="[^"]+"[^>]*>([\s\S]*?)<\/a>/g)].map((match) =>
  asText(match[1]).replace(/\bimportant\b/i, "").trim(),
);
const startHereIndexLabels = [...startHereIndex.matchAll(/<a href="[^"]+"[^>]*>([\s\S]*?)<\/a>/g)].map((match) =>
  asText(match[1]).replace(/\bimportant\b/i, "").trim(),
);
const startHereOrder = [
  "Begin",
  "What is $PND",
  "What is $rPND",
  "Verify Issuer",
  "Connect Wallet",
  "Set Trust Lines",
  "Ready to Use DEX",
];
check(
  "top bar right cluster is Start here, $PND, $rPND, Protocol",
  /<a class="topnav-start-link" href="\/start\/">Start here<\/a>/.test(topnavHtml) &&
    topnavSummaries.filter((label) => label !== "Start here menu").join(" | ") === "$PND | $rPND | Protocol" &&
    headerHtml.includes("topbar-end") &&
    headerHtml.indexOf("brand-cluster") < headerHtml.indexOf("topbar-end") &&
    headerHtml.indexOf("topbar-end") < headerHtml.indexOf("topnav-start"),
);
check(
  "top bar does not use Trade, Pond, Meet Team, Verify, Hold, Wallets, or Xaman as top-level items",
  !topnavSummaries.includes("Trade") &&
    !topnavSummaries.includes("Pond") &&
    !topnavSummaries.includes("Meet Team") &&
    !topnavSummaries.includes("Verify the issuer") &&
    !topnavSummaries.includes("Hold safely") &&
    !topnavSummaries.includes("Wallets") &&
    !topnavSummaries.includes("Xaman") &&
    !topnavHtml.includes('href="/pond/"') &&
    !/>Xaman</i.test(topnavHtml),
);
check(
  "Start here, $PND, $rPND, and Protocol sit immediately before search on the right",
  headerHtml.includes("data-site-search") &&
    headerHtml.includes("topbar-end") &&
    headerHtml.indexOf("Return to Main Site") < headerHtml.indexOf('data-topnav-menu="start-here"') &&
    headerHtml.indexOf('data-topnav-menu="start-here"') < headerHtml.indexOf('data-topnav-menu="pnd"') &&
    headerHtml.indexOf('data-topnav-menu="pnd"') < headerHtml.indexOf('data-topnav-menu="rpnd"') &&
    headerHtml.indexOf('data-topnav-menu="rpnd"') < headerHtml.indexOf('data-topnav-menu="protocol"') &&
    headerHtml.indexOf('data-topnav-menu="protocol"') < headerHtml.indexOf("data-site-search") &&
    headerHtml.indexOf("</nav>") < headerHtml.indexOf("data-site-search"),
);
check(
  "green Trade button sits immediately after search as the far-right control",
  headerHtml.includes('class="topbar-trade"') &&
    headerHtml.includes('href="/trade/"') &&
    /<a class="topbar-trade" href="\/trade\/">Trade<\/a>/.test(headerHtml) &&
    headerHtml.indexOf("data-site-search") < headerHtml.indexOf("topbar-trade") &&
    headerHtml.indexOf("</form>") < headerHtml.indexOf("topbar-trade") &&
    !topnavSummaries.includes("Trade"),
);
check(
  "Start here dropdown is the seven-step onboarding path",
  startHereLabels.join(" | ") === startHereOrder.join(" | ") &&
    startHereMenu.includes('href="/start/"') &&
    startHereMenu.includes('href="/start/pnd/"') &&
    startHereMenu.includes('href="/start/rpnd/"') &&
    startHereMenu.includes('href="/verify/"') &&
    startHereMenu.includes('href="/start/wallet/"') &&
    startHereMenu.includes('href="/start/trust-lines/"') &&
    startHereMenu.includes('href="/start/dex/"') &&
    startHereMenu.includes('class="nav-badge"') &&
    /important/i.test(startHereMenu) &&
    !startHereMenu.includes("Pond Protocol") &&
    !startHereMenu.includes("Meet Team") &&
    !startHereMenu.includes("Hold safely") &&
    !startHereMenu.includes("Official links") &&
    !startHereMenu.includes("Trade $PND") &&
    !startHereMenu.includes("Connect Xaman") &&
    !startHereMenu.includes('href="/wallets/"') &&
    !startHereMenu.includes('href="/pond/"'),
);
check(
  "Start here control itself goes to /start/",
  topnavHtml.includes('class="topnav-start-link"') &&
    topnavHtml.includes('href="/start/"') &&
    /<a class="topnav-start-link" href="\/start\/">Start here<\/a>/.test(topnavHtml),
);
check(
  "Docs Index START HERE group matches the Start here dropdown",
  startHereIndexLabels.join(" | ") === startHereOrder.join(" | ") &&
    startHereIndex.includes('href="/start/trust-lines/"') &&
    startHereIndex.includes('class="nav-badge"'),
);
check(
  "Protocol dropdown matches the Docs Index Protocol group",
  protocolMenu.includes("Overview") &&
    protocolMenu.includes("Architecture") &&
    protocolMenu.includes("$PND and $rPND compared") &&
    protocolMenu.includes("Glossary") &&
    protocolMenu.includes("How wallets learn the name") &&
    protocolMenu.includes("xrp-ledger.toml") &&
    protocolMenu.includes("Status and conventions") &&
    protocolMenu.includes("01 — Tokens") &&
    protocolMenu.includes("07 — Security considerations"),
);
check(
  "Pond page is unpublished and leftover Pond links go to Start here",
  !existsSync(join(DIST_DIR, "pond", "index.html")) &&
    !headerHtml.includes('href="/pond/"') &&
    !indexHtml.includes('href="/pond/"') &&
    existsSync(join(DIST_DIR, "team", "index.html")) &&
    indexHtml.includes('href="/start/"'),
);
check(
  "docs index is the search panel, not a right-edge drawer",
  headerHtml.includes('id="docs-nav"') &&
    headerHtml.includes("data-site-search") &&
    headerHtml.indexOf("data-site-search") < headerHtml.indexOf('id="docs-nav"') &&
    headerHtml.indexOf('id="docs-nav"') < headerHtml.indexOf("</form>") &&
    headerHtml.includes("sidebar-label") &&
    /Docs\s+Index/.test(asText(headerHtml)) &&
    headerHtml.includes('class="nav-badge"') &&
    /important/i.test(headerHtml) &&
    !indexHtml.includes("docs-rail") &&
    !indexHtml.includes("data-docs-toggle") &&
    !indexHtml.includes("data-docs-open") &&
    !indexHtml.includes("site-search-pages") &&
    !headerHtml.includes('list="site-search-pages"'),
);
const navJsText = existsSync(join(DIST_DIR, "nav.js")) ? readFileSync(join(DIST_DIR, "nav.js"), "utf8") : "";
check(
  "search filters the grouped docs index in place",
  navJsText.includes("data-nav-group") &&
    navJsText.includes("filterIndex") &&
    navJsText.includes("Escape") &&
    !navJsText.includes("site-search-pages") &&
    !navJsText.includes("pond-docs-nav-collapsed") &&
    navJsText.includes("closeTopnavMenus"),
);
const heroActions = indexHtml.match(/class="hero-actions"[\s\S]*?<\/p>/)?.[0] ?? "";
check(
  "landing hero does not use a Connect Xaman CTA",
  heroActions.includes("/verify/") &&
    heroActions.includes("/hold/") &&
    !/Connect Xaman/i.test(heroActions),
);

const tradePage = join(DIST_DIR, "trade", "index.html");
const tradeHtml = existsSync(tradePage) ? readFileSync(tradePage, "utf8") : "";
const tradeJs = join(DIST_DIR, "trade.js");
const tradeJsText = existsSync(tradeJs) ? readFileSync(tradeJs, "utf8") : "";
check("trade page was built", tradeHtml.length > 0);
const xamanJsText = existsSync(xamanJs) ? readFileSync(xamanJs, "utf8") : "";
check(
  "trade header uses one Connect wallet control for WalletConnect and Xaman",
  tradeJsText.includes("data-connect-toggle") &&
    tradeJsText.includes("data-connect-menu") &&
    tradeJsText.includes("data-wallet-connect") &&
    tradeJsText.includes("data-xaman-compact") &&
    tradeJsText.includes("WalletConnect") &&
    !tradeJsText.includes("trade-xaman-dock"),
);
check(
  "trade does not render a page-wide Xaman unavailable banner",
  !tradeJsText.includes("Connect unavailable until Xaman app keys are set") &&
    !tradeJsText.includes("This is not a fake connect") &&
    !tradeHtml.includes("Connect unavailable until Xaman app keys are set"),
);
check(
  "trade disclaimer gates actions, links /legal/, and states WalletConnect or Xaman only",
  tradeJsText.includes("data-disclaimer-confirm") &&
    tradeJsText.includes('href="/start/"') &&
    tradeJsText.includes('href="/legal/"') &&
    /Read the disclaimer/i.test(tradeJsText) &&
    /WalletConnect or Xaman/i.test(tradeJsText) &&
    /never stores keys/i.test(tradeJsText) &&
    /never needs your seed/i.test(tradeJsText) &&
    /\$PND has not been issued/i.test(tradeJsText),
);
check(
  "xaman.js keeps an honest /connect/ unavailable card and a short disabled Trade option",
  xamanJsText.includes("Connect unavailable until Xaman app keys are set") &&
    xamanJsText.includes("This is not a fake connect") &&
    xamanJsText.includes("Xaman · keys unset") &&
    xamanJsText.includes("disabled title="),
);

const stylesCss = join(DIST_DIR, "styles.css");
const stylesText = existsSync(stylesCss) ? readFileSync(stylesCss, "utf8") : "";
check(
  "trade disclaimer actions are one primary and one secondary, not traffic-light colors",
  stylesText.includes(".trade-disclaimer-new") &&
    stylesText.includes(".trade-disclaimer-known") &&
    !stylesText.includes("linear-gradient(135deg, #fb7185") &&
    !stylesText.includes("linear-gradient(135deg, #4ade80") &&
    !stylesText.includes("linear-gradient(135deg, #6aa8e6"),
);
check(
  "mobile CSS does not hide the top-bar dropdowns",
  !/\.topnav a:not\(\.cta\)/.test(stylesText) &&
    !/\.topnav-menu\s*\{[^}]*display:\s*none/.test(stylesText),
);
check(
  "Trade button reuses the Verify CTA accent gradient",
  stylesText.includes(".topbar-trade") &&
    stylesText.includes("linear-gradient(135deg, var(--accent-bright), var(--accent))"),
);
check(
  "top-bar dropdown panels are absolutely positioned so they do not shift layout",
  stylesText.includes(".topnav-panel") &&
    /position:\s*absolute/.test(stylesText.slice(stylesText.indexOf(".topnav-panel"))),
);
check(
  "protocol snapshot ticker is full-bleed with no side gutters",
  !stylesText.includes("width: min(100%, 96rem)") &&
    !stylesText.includes("mask-image: linear-gradient(90deg, transparent") &&
    !stylesText.includes("html.has-nav-js:not(.docs-collapsed) .protocol-snapshot-inner") &&
    !stylesText.includes("html.has-nav-js:not(.docs-collapsed) .protocol-snapshot {"),
);
check(
  "opening docs nav does not shift page chrome or slide a right drawer",
  !stylesText.includes("html.has-nav-js:not(.docs-collapsed) .shell") &&
    !stylesText.includes("html.has-nav-js:not(.docs-collapsed) .topbar") &&
    !stylesText.includes("html.has-nav-js:not(.docs-collapsed) .hero-inner") &&
    !stylesText.includes(".docs-rail") &&
    !stylesText.includes("translateX(100%)") &&
    stylesText.includes(".site-search.is-open .sidebar"),
);
check(
  "brand lockup stays a single nowrap cluster on desktop",
  stylesText.includes(".brand-cluster") &&
    /flex-wrap:\s*nowrap/.test(stylesText) &&
    stylesText.includes("brand-rule") &&
    stylesText.includes("brand-word"),
);

const secretLeak = textFiles.filter((f) => {
  const text = readFileSync(f, "utf8");
  return /X-API-Secret\s*[:=]\s*['"]/i.test(text) || /XUMM_API_SECRET\s*=\s*['"][^'"]+/.test(text);
});
check(
  "built output does not embed a Xaman API secret",
  secretLeak.length === 0,
  secretLeak.map((f) => relative(DIST_DIR, f)).join(", "),
);

const linksPage = join(DIST_DIR, "links", "index.html");
const linksHtml = existsSync(linksPage) ? readFileSync(linksPage, "utf8") : "";
check(
  "official links name site, TOML, and Bithomp only as the list",
  linksHtml.includes("pond.greenhead.io") &&
    linksHtml.includes("xrp-ledger.toml") &&
    linksHtml.includes("bithomp.com/explorer"),
);
check(
  "official links page has no Telegram invite and no DEX trade path",
  !/t\.me\//i.test(linksHtml) &&
    !/telegram\.org/i.test(linksHtml) &&
    !/firstledger\.net\/token/i.test(linksHtml),
);

const twoPage = join(DIST_DIR, "pnd-and-rpnd", "index.html");
check(
  "$PND and $rPND page says $rPND is not launching 1 Oct",
  existsSync(twoPage) && /not launching on 1 October 2026/i.test(asText(readFileSync(twoPage, "utf8"))),
);

const discPage = join(DIST_DIR, "discovery", "index.html");
check(
  "discovery page exists and does not invent a DEX trade URL",
  existsSync(discPage) && !/firstledger\.net\/token/i.test(readFileSync(discPage, "utf8")),
);

const joinInputs = [];
for (const file of textFiles.filter((f) => f.endsWith(".html"))) {
  const html = readFileSync(file, "utf8");
  // The sitewide documentation search is the one intentional form field. Strip that known-safe
  // shell control before checking that authored pages do not introduce wallet or signing inputs.
  const htmlWithoutSiteSearch = html.replace(
    /<form\b[^>]*class="site-search"[^>]*>[\s\S]*?<\/form>/i,
    "",
  );
  if (
    /<input\b/i.test(htmlWithoutSiteSearch) ||
    /<textarea\b/i.test(htmlWithoutSiteSearch) ||
    /<form\b/i.test(htmlWithoutSiteSearch)
  ) {
    joinInputs.push(relative(DIST_DIR, file));
  }
}
check("no seed or wallet-connect fields in the HTML", joinInputs.length === 0, joinInputs.join(", "));

const dexHits = [];
for (const file of textFiles.filter((f) => f.endsWith(".html"))) {
  const html = readFileSync(file, "utf8");
  if (/firstledger\.net\/token/i.test(html) || /xpmarket\.com\/dex/i.test(html) || /xmagnetic\.org\/dex/i.test(html)) {
    dexHits.push(relative(DIST_DIR, file));
  }
}
check("no guessed DEX trade URLs in HTML", dexHits.length === 0, dexHits.join(", "));

const icon512 = join(DIST_DIR, "icon-512.png");
const tomlText = existsSync(wellKnown) ? readFileSync(wellKnown, "utf8") : "";
const tomlHasIcon = /^\s*icon\s*=/m.test(tomlText);
if (tomlHasIcon) {
  check(
    "TOML icon is only set when /icon-512.png is in the build",
    existsSync(icon512),
  );
}

check(
  "status chip is rendered while pre-launch",
  config.site.launchStatus === "live" || (existsSync(index) && readFileSync(index, "utf8").includes("nothing issued yet")),
);

const authoredStale = [];
for (const url of authoredUrls) {
  const file = join(DIST_DIR, url === "/" ? "index.html" : `${url.replace(/^\/|\/$/g, "")}/index.html`);
  if (!existsSync(file)) continue;
  const text = asText(readFileSync(file, "utf8"));
  if (/on-ledger Domain(?: field)? is unset/i.test(text) || /Domain stays unset/i.test(text)) {
    authoredStale.push(`${url} claims Domain is unset`);
  }
  if (/has no account settings, no Domain/i.test(text)) {
    authoredStale.push(`${url} claims the issuer has no account settings`);
  }
}
check(
  "authored pages do not claim Domain is unset",
  authoredStale.length === 0,
  authoredStale.join("; "),
);

const privacyJs = join(DIST_DIR, "privacy.js");
const privacyJsText = existsSync(privacyJs) ? readFileSync(privacyJs, "utf8") : "";
const legalPage = join(DIST_DIR, "legal", "index.html");
const legalHtml = existsSync(legalPage) ? readFileSync(legalPage, "utf8") : "";
const tradeHasDock = tradeHtml.includes('data-privacy-dock');
check("privacy.js is copied into the build", existsSync(privacyJs));
check(
  "privacy dock is sitewide, including Trade",
  indexHtml.includes('data-privacy-dock') &&
    indexHtml.includes("/privacy.js") &&
    tradeHasDock &&
    legalHtml.includes('data-privacy-dock'),
);
check(
  "privacy UI has the icon, Private Browsing card, and Privacy vault",
  indexHtml.includes("data-privacy-fab") &&
    indexHtml.includes("Private Browsing") &&
    indexHtml.includes("Privacy vault") &&
    indexHtml.includes("Privacy controls") &&
    indexHtml.includes("Got it"),
);
check(
  "privacy icon click opens the vault, not Private Browsing",
  /data-privacy-fab[\s\S]{0,180}setMode\("vault"\)/.test(privacyJsText) &&
    !/data-privacy-fab[\s\S]{0,180}setMode\("notice"\)/.test(privacyJsText),
);
check(
  "privacy Legal buttons go to Pond /legal/, not greenhead.io/legal",
  /href="\/legal\/"/g.test(indexHtml) &&
    !indexHtml.includes('href="https://greenhead.io/legal"') &&
    legalHtml.includes("pond.greenhead.io") &&
    /not the Greenhead Labs agent product/i.test(asText(legalHtml)),
);
check(
  "privacy UI does not invent a visitor counter or install analytics",
  !/Total Private Visitors/i.test(indexHtml) &&
    !indexHtml.includes("/api/privacy/private-visitors") &&
    !privacyJsText.includes("gtag") &&
    !privacyJsText.includes("plausible") &&
    /No analytics scripts are installed/i.test(indexHtml),
);
check(
  "privacy UI never asks for a seed",
  /never ask for seed phrases/i.test(asText(indexHtml)) &&
    !/<input\b[^>]*(seed|secret|mnemonic|password)/i.test(indexHtml),
);
check(
  "privacy copy is honest about session and Start Here cookies",
  /we use cookies for your login session and Start Here progress/i.test(asText(indexHtml)) &&
    /remember the XRPL address you signed in with/i.test(asText(indexHtml)) &&
    /Session and progress cookies on/i.test(indexHtml) &&
    !/Tracking cookies not used/i.test(indexHtml) &&
    !/There is no public account system/i.test(asText(indexHtml)) &&
    !/No Tracking Or Data Collection/i.test(indexHtml),
);
check(
  "legal page states session and progress cookies and never asks for seeds",
  /login session/i.test(asText(legalHtml)) &&
    /Start Here progress/i.test(asText(legalHtml)) &&
    /XRPL address you signed in with/i.test(asText(legalHtml)) &&
    /do not sell personal/i.test(asText(legalHtml)) &&
    /never ask for a seed/i.test(asText(legalHtml)) &&
    !/These public docs do not set advertising or tracking cookies/i.test(asText(legalHtml)),
);

const sessionJs = join(DIST_DIR, "session.js");
const sessionJsText = existsSync(sessionJs) ? readFileSync(sessionJs, "utf8") : "";
check("session.js is copied into the build", existsSync(sessionJs));
check(
  "Sign in menu stays hidden until opened",
  stylesText.includes(".session-menu[hidden]") &&
    /display:\s*none/.test(stylesText.slice(stylesText.indexOf(".session-menu[hidden]"))),
);
check(
  "top bar has a Sign in chip that reuses WalletConnect and Xaman",
  indexHtml.includes("data-session-chip") &&
    indexHtml.includes("/session.js") &&
    indexHtml.includes("data-session-wc") &&
    indexHtml.includes("data-xaman-compact") &&
    indexHtml.includes("XUMM_API_KEY") &&
    indexHtml.includes("XUMM_API_SECRET") &&
    sessionJsText.includes("/api/session") &&
    sessionJsText.includes("walletconnect") &&
    sessionJsText.includes("PondTrade?.connectWallet") &&
    indexHtml.includes("data-xaman-autostart") &&
    xamanJsText.includes("startSignIn") &&
    xamanJsText.includes("/api/xaman/signin"),
);
check(
  "Sign in menu auto-starts official Xaman QR without a second click",
  xamanJsText.includes("data-xaman-autostart") &&
    xamanJsText.includes("session-xaman-qr") &&
    sessionJsText.includes("startSignIn") &&
    /Official WalletConnect or Xaman/.test(indexHtml),
);
check(
  "serve.mjs can set a signed session cookie",
  existsSync(join(SITE_ROOT, "scripts", "session.mjs")) &&
    readFileSync(join(SITE_ROOT, "scripts", "session.mjs"), "utf8").includes("pond_session") &&
    readFileSync(join(SITE_ROOT, "scripts", "session.mjs"), "utf8").includes("HttpOnly") &&
    readFileSync(join(SITE_ROOT, "scripts", "session.mjs"), "utf8").includes("IDLE_MS") &&
    readFileSync(join(SITE_ROOT, "scripts", "serve.mjs"), "utf8").includes("handleSession"),
);

const profileJs = join(DIST_DIR, "profile.js");
const profileJsText = existsSync(profileJs) ? readFileSync(profileJs, "utf8") : "";
const profileHtml = existsSync(join(DIST_DIR, "profile", "index.html"))
  ? readFileSync(join(DIST_DIR, "profile", "index.html"), "utf8")
  : "";
const profilesSrc = existsSync(join(SITE_ROOT, "scripts", "profiles.mjs"))
  ? readFileSync(join(SITE_ROOT, "scripts", "profiles.mjs"), "utf8")
  : "";
check("profile.js is copied into the build", existsSync(profileJs));
const disclaimerJs = join(DIST_DIR, "disclaimer.js");
const disclaimerJsText = existsSync(disclaimerJs) ? readFileSync(disclaimerJs, "utf8") : "";
check("disclaimer.js is copied into the build", existsSync(disclaimerJs));
check(
  "signed-in profile can review the same trade disclaimer",
  profileJsText.includes("data-review-disclaimer") &&
    /Review disclaimer/.test(profileJsText) &&
    disclaimerJsText.includes("Pond is verification-first") &&
    disclaimerJsText.includes("disclaimerAccepted") &&
    !disclaimerJsText.includes("localStorage") &&
    profilesSrc.includes("disclaimerAccepted") &&
    sessionJsText.includes("disclaimerAccepted"),
);
check(
  "profile page is the account surface and not a Start here step",
  profileHtml.includes("data-pond-profile") &&
    profileHtml.includes("page-profile") &&
    !/Complete your Pond Protocol Profile/i.test(asText(profileHtml)) &&
    !/Account pages open after official/i.test(asText(profileHtml)) &&
    profileHtml.includes("/profile.js") &&
    !startHereLabels.includes("Profile") &&
    !startHereOrder.includes("Profile") &&
    startHereLabels.join(" | ") === startHereOrder.join(" | "),
);
check(
  "profile card is centered on the viewport",
  /body\.page-profile \.shell[\s\S]*?display:\s*flex[\s\S]*?justify-content:\s*center[\s\S]*?margin-inline:\s*auto/.test(
    stylesText,
  ) &&
    /body\.page-profile main[\s\S]*?margin-inline:\s*auto/.test(stylesText) &&
    /body\.page-profile \.profile-card[\s\S]*?margin-inline:\s*auto/.test(stylesText),
);
check(
  "landing hero is a solid color with Start Here below the fold",
  /--hero-solid:\s*#151b21/.test(stylesText) &&
    /min-height:\s*100svh/.test(stylesText) &&
    /min-height:\s*100dvh/.test(stylesText) &&
    !indexHtml.includes("hero-art") &&
    !indexHtml.includes("hero-signal") &&
    !indexHtml.includes('src="/hero.png"') &&
    indexHtml.includes("hero-kicker") &&
    indexHtml.includes('<p class="hero-kicker">Pond</p>') &&
    !indexHtml.includes('<p class="hero-kicker">Pond Protocol</p>') &&
    /<h1[^>]*hero-tagline[^>]*>Join the Flock at the<br>The Pond<\/h1>/.test(indexHtml) &&
    indexHtml.includes("Where Liquidity Goes to Stay.") &&
    /<link rel="stylesheet" href="\/styles\.[a-f0-9]{10}\.css">/.test(indexHtml) &&
    /\.hero-tagline[\s\S]*?font-size:\s*clamp\(2\.4rem,\s*5vw,\s*4rem\)/.test(stylesText) &&
    /\.hero \.hero-kicker[\s\S]*?font-size:\s*clamp\(8\.75rem/.test(stylesText) &&
    !/\.hero \.hero-kicker[\s\S]*?height:\s*1\.326rem/.test(stylesText) &&
    /<article class="prose">[\s\S]*Start here/i.test(indexHtml) &&
    indexHtml.indexOf('class="hero"') < indexHtml.indexOf('<article class="prose">'),
);
const heroTopoSvg = existsSync(join(DIST_DIR, "hero-topo.svg"))
  ? readFileSync(join(DIST_DIR, "hero-topo.svg"), "utf8")
  : "";
check(
  "landing hero is a Wyoming contour map without XRPL lettering",
  indexHtml.includes('class="hero-topo"') &&
    indexHtml.includes('src="/hero-topo.svg"') &&
    !indexHtml.includes("<textPath") &&
    !heroTopoSvg.includes("<textPath") &&
    !heroTopoSvg.includes("<text") &&
    !heroTopoSvg.includes("TransactionType") &&
    !heroTopoSvg.includes(config.site.issuerAddress) &&
    /Wyoming/.test(heroTopoSvg) &&
    /GMTED2010/.test(heroTopoSvg) &&
    (heroTopoSvg.match(/<path /g) || []).length >= 80 &&
    /#c9d6e0/.test(stylesText) &&
    /#c9d6e0/.test(heroTopoSvg) &&
    /hero-inner::before/.test(stylesText) &&
    !/pixers|shutterstock|istock/i.test(indexHtml + heroTopoSvg) &&
    !indexHtml.includes('src="/hero.png"') &&
    !tradeHtml.includes("hero-topo") &&
    !profileHtml.includes("hero-topo"),
);
check(
  "homepage first paint stays light",
  heroTopoSvg.length < 80000 &&
    !heroTopoSvg.includes("<textPath") &&
    !indexHtml.includes("/trade.js") &&
    !indexHtml.includes("/profile.js") &&
    !indexHtml.includes("/card.js") &&
    !indexHtml.includes("/disclaimer.js") &&
    indexHtml.includes("/nav.js") &&
    indexHtml.includes("/session.js") &&
    indexHtml.includes("/privacy.js") &&
    indexHtml.includes("/xaman.js") &&
    tradeHtml.includes("/trade.js") &&
    profileHtml.includes("/profile.js"),
);
check(
  "logged-in chip is a profile icon that links to /profile/<handle>/",
  indexHtml.includes("data-session-profile") &&
    indexHtml.includes("data-session-avatar") &&
    indexHtml.includes("/greenhead-duck.png") &&
    indexHtml.includes('href="/profile/"') &&
    sessionJsText.includes("/profile/") &&
    sessionJsText.includes("handle") &&
    sessionJsText.includes("data-session-avatar") &&
    !sessionJsText.includes("data-session-addr") &&
    !headerHtml.includes("data-session-signout") &&
    !headerHtml.includes("data-session-addr") &&
    !headerHtml.includes("Sign out") &&
    !headerHtml.includes("session-addr"),
);
check(
  "Sign out lives on the profile page, not the top bar",
  profileJsText.includes("data-profile-signout") &&
    /Sign out/.test(profileJsText) &&
    !sessionJsText.includes("data-session-signout") &&
    headerHtml.includes("topbar-trade") &&
    /<a class="topbar-trade" href="\/trade\/">Trade<\/a>/.test(headerHtml),
);
check(
  "tadpole handles are assigned on login and persisted in a JSON file store",
  profilesSrc.includes("tadpole01") &&
    profilesSrc.includes("tadpole010") &&
    profilesSrc.includes("r3E25CzRmwMRNmT15mD3s8tLP9fZHbmN7B") &&
    profilesSrc.includes("profiles.json") &&
    profilesSrc.includes("Never stores seeds") &&
    !profilesSrc.includes("database.greenhead.io") &&
    profilesSrc.includes("xaman_required") &&
    readFileSync(join(SITE_ROOT, "scripts", "session.mjs"), "utf8").includes("ensureProfile") &&
    readFileSync(join(SITE_ROOT, "scripts", "serve.mjs"), "utf8").includes("handleProfiles") &&
    readFileSync(join(SITE_ROOT, "scripts", "serve.mjs"), "utf8").includes("isProfilePage") &&
    readFileSync(join(SITE_ROOT, "scripts", "serve.mjs"), "utf8").includes("isCardPage"),
);
check(
  "profile forms never ask for a seed or password",
  /never asks for a seed/i.test(asText(profileHtml)) &&
    !/<input\b[^>]*(seed|secret|mnemonic|password)/i.test(profileHtml) &&
    !/<input\b[^>]*(seed|secret|mnemonic|password)/i.test(profileJsText) &&
    !profileJsText.includes('type="password"') &&
    profileJsText.includes("displayName") &&
    profileJsText.includes("bio") &&
    profileJsText.includes("icon") &&
    profilesSrc.includes("asIcon") &&
    profileJsText.includes("$PND") &&
    profileJsText.includes("$rPND") &&
    profileJsText.includes("$XRP") &&
    profileJsText.includes("$RLUSD") &&
    /not issued/i.test(profileJsText) &&
    existsSync(join(SITE_ROOT, "scripts", "balances.mjs")) &&
    readFileSync(join(SITE_ROOT, "scripts", "balances.mjs"), "utf8").includes("xrplcluster.com") &&
    !profileJsText.includes("rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De"),
);
const cardJs = join(DIST_DIR, "card.js");
const cardJsText = existsSync(cardJs) ? readFileSync(cardJs, "utf8") : "";
const cardHtml = existsSync(join(DIST_DIR, "card", "index.html"))
  ? readFileSync(join(DIST_DIR, "card", "index.html"), "utf8")
  : "";
const balancesSrc = existsSync(join(SITE_ROOT, "scripts", "balances.mjs"))
  ? readFileSync(join(SITE_ROOT, "scripts", "balances.mjs"), "utf8")
  : "";
check(
  "profile shows trust lines, Start Here checklist, session expiry, and honest later fields",
  profileJsText.includes("/start/trust-lines/") &&
    profileJsText.includes("data-trust") &&
    profileJsText.includes("Missing / not issued") &&
    profileJsText.includes("profile-checklist") &&
    profileJsText.includes("Done") &&
    profileJsText.includes("Open") &&
    profileJsText.includes("Signed in with") &&
    profileJsText.includes("24 hours") &&
    profileJsText.includes("data-privacy-controls") &&
    /Privacy Controls/.test(profileJsText) &&
    privacyJsText.includes("PondPrivacy") &&
    privacyJsText.includes("openVault") &&
    profileJsText.includes("Membership / seat NFT") &&
    profileJsText.includes("not minted") &&
    profileJsText.includes("not an APY") &&
    profileJsText.includes("Last sign-in") &&
    profileJsText.includes("Last disclaimer accept") &&
    profileJsText.includes("Last profile save") &&
    balancesSrc.includes("trustLines") &&
    balancesSrc.includes("membership") &&
    balancesSrc.includes("airdrop") &&
    !balancesSrc.includes("account_nfts"),
);
check(
  "nav icon hover uses display name or handle, never the classic address",
  indexHtml.includes("data-session-name") &&
    sessionJsText.includes("displayName") &&
    sessionJsText.includes("data-session-name") &&
    sessionJsText.includes("Your profile") &&
    !sessionJsText.includes("link.title = shortAddr") &&
    !sessionJsText.includes("aria-label`, current?.address"),
);
check(
  "optional public card is handle and avatar only",
  existsSync(cardJs) &&
    cardHtml.includes("data-pond-card") &&
    cardJsText.includes("/api/card/") &&
    cardJsText.includes("public-card-handle") &&
    !cardJsText.includes("shortAddr") &&
    !cardJsText.includes(".address") &&
    profilesSrc.includes("getPublicCard") &&
    profilesSrc.includes("/api/card/") &&
    profileJsText.includes("publicCard") &&
    /never the address/.test(profileJsText) &&
    !startHereLabels.includes("Public card") &&
    !startHereOrder.includes("Public card"),
);
check(
  "expired Xaman QR can be replaced without a full page reload",
  xamanJsText.includes("data-xaman-retry") &&
    /Get a new QR/.test(xamanJsText) &&
    xamanJsText.includes("force: true") &&
    xamanJsText.includes("options.force"),
);

const startJs = join(DIST_DIR, "start.js");
const startJsText = existsSync(startJs) ? readFileSync(startJs, "utf8") : "";
const startPage = join(DIST_DIR, "start", "index.html");
const startHtml = existsSync(startPage) ? readFileSync(startPage, "utf8") : "";
const startPndHtml = existsSync(join(DIST_DIR, "start", "pnd", "index.html"))
  ? readFileSync(join(DIST_DIR, "start", "pnd", "index.html"), "utf8")
  : "";
const startRpndHtml = existsSync(join(DIST_DIR, "start", "rpnd", "index.html"))
  ? readFileSync(join(DIST_DIR, "start", "rpnd", "index.html"), "utf8")
  : "";
const startWalletHtml = existsSync(join(DIST_DIR, "start", "wallet", "index.html"))
  ? readFileSync(join(DIST_DIR, "start", "wallet", "index.html"), "utf8")
  : "";
const startTrustHtml = existsSync(join(DIST_DIR, "start", "trust-lines", "index.html"))
  ? readFileSync(join(DIST_DIR, "start", "trust-lines", "index.html"), "utf8")
  : "";
const startDexHtml = existsSync(join(DIST_DIR, "start", "dex", "index.html"))
  ? readFileSync(join(DIST_DIR, "start", "dex", "index.html"), "utf8")
  : "";
check("Start here onboarding pages were built", startHtml.length > 0 && startPndHtml && startRpndHtml && startWalletHtml && startTrustHtml && startDexHtml);
check(
  "legacy Start here pages stay published",
  existsSync(join(DIST_DIR, "wallets", "index.html")) &&
    existsSync(join(DIST_DIR, "hold", "index.html")) &&
    existsSync(join(DIST_DIR, "team", "index.html")) &&
    existsSync(join(DIST_DIR, "links", "index.html")) &&
    existsSync(join(DIST_DIR, "connect", "index.html")) &&
    existsSync(join(DIST_DIR, "trade", "index.html")),
);
const startStepsGuard =
  startJsText.includes("begin") &&
  startJsText.includes("what-is-pnd") &&
  startJsText.includes("what-is-rpnd") &&
  startJsText.includes("verify-issuer") &&
  startJsText.includes("connect-wallet") &&
  startJsText.includes("set-trust-lines") &&
  startJsText.includes("ready-dex");
check(
  "/start/ tracks the seven steps in a cookie with localStorage backup",
  startHtml.includes("data-start-progress") &&
    startHtml.includes("/start.js") &&
    startJsText.includes("pond.start.progress") &&
    startJsText.includes("pond_progress") &&
    startJsText.includes("localStorage") &&
    startJsText.includes("accounts") &&
    startStepsGuard,
);
check(
  "trust-line and DEX steps say $PND is not issued and do not fake a live set/buy",
  /has not been issued/i.test(asText(startTrustHtml)) &&
    /no “set it now”/i.test(asText(startTrustHtml)) &&
    /has not been issued/i.test(asText(startDexHtml)) &&
    /not a live \$PND DEX/i.test(asText(startDexHtml)) &&
    startDexHtml.includes('href="/trade/"') &&
    !/buy now/i.test(asText(startDexHtml)) &&
    !/set it now/i.test(asText(startWalletHtml)),
);
const startWalletArticle = startWalletHtml.match(/<article class="prose">[\s\S]*?<\/article>/)?.[0] ?? "";
check(
  "Connect Wallet onboarding links to official WalletConnect or Xaman only",
  /WalletConnect or Xaman/i.test(asText(startWalletHtml)) &&
    startWalletHtml.includes("/trade/") &&
    /never asks for a seed/i.test(asText(startWalletHtml)) &&
    !startWalletArticle.includes("data-xaman-app"),
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
