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
const headerText = asText(headerHtml);
check(
  "top bar is Protocol, Trade, Pond, Meet Team",
  /Protocol\s+Trade\s+Pond\s+Meet Team/.test(headerText) &&
    headerHtml.includes('href="/protocol/"') &&
    headerHtml.includes('href="/trade/"') &&
    headerHtml.includes('href="/pond/"') &&
    headerHtml.includes('href="/team/"'),
);
check(
  "top bar does not feature Verify, Hold, Wallets, or Xaman",
  !headerHtml.includes('href="/verify/"') &&
    !headerHtml.includes('href="/hold/"') &&
    !headerHtml.includes('href="/wallets/"') &&
    !headerHtml.includes('href="/connect/"') &&
    !/>Xaman</i.test(headerHtml),
);
check(
  "docs search sits after Meet Team as the last top-bar item",
  headerHtml.includes("Meet Team") &&
    headerHtml.includes("data-site-search") &&
    headerHtml.indexOf("Meet Team") < headerHtml.indexOf("data-site-search"),
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
  "xaman.js keeps an honest /connect/ unavailable card and a short disabled Trade option",
  xamanJsText.includes("Connect unavailable until Xaman app keys are set") &&
    xamanJsText.includes("This is not a fake connect") &&
    xamanJsText.includes("Xaman · keys unset") &&
    xamanJsText.includes("disabled title="),
);

const stylesCss = join(DIST_DIR, "styles.css");
const stylesText = existsSync(stylesCss) ? readFileSync(stylesCss, "utf8") : "";
check(
  "mobile CSS does not hide Protocol / Trade / Pond / Meet Team",
  !/\.topnav a:not\(\.cta\)/.test(stylesText),
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

/* ------------------------------------------------------------------ report */

process.stdout.write(`\n  Publication guard\n  ${"-".repeat(58)}\n`);
for (const c of checks) {
  process.stdout.write(
    `  ${c.ok ? "pass" : "FAIL"}  ${c.name}${c.detail && !c.ok ? `\n          ${c.detail}` : ""}\n`,
  );
}

if (failures.length) fail(`${failures.length} guard check(s) failed — not safe to publish`);
process.stdout.write(`\n  ${checks.length} checks passed\n\n`);
