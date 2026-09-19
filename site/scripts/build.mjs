#!/usr/bin/env node
/**
 * Render the site into site/dist/.
 *
 * Reads site/content/ (authored pages) and site/imported/ (vendored repository documents) and
 * nothing else. There is no directory walk over the repositories and no network access, so the
 * published page set is exactly the allowlist in content.config.json.
 *
 *   node scripts/build.mjs            build
 *   node scripts/build.mjs --strict   also fail on unresolved internal links (used by CI)
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, posix, relative } from "node:path";
import MarkdownIt from "markdown-it";
import anchor from "markdown-it-anchor";
import {
  CONTENT_DIR,
  DIST_DIR,
  IMPORTED_DIR,
  PUBLIC_DIR,
  SITE_ROOT,
  WELL_KNOWN_PATH,
  WELL_KNOWN_VISIBLE_PATH,
  bodyHash,
  fail,
  loadConfig,
  parseFrontMatter,
  sourceRoots,
} from "./lib.mjs";

const strict = process.argv.includes("--strict");
const config = loadConfig();
const { site } = config;

const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

/* ---------------------------------------------------------- substitutions
 *
 * The website host lives in exactly one place - content.config.json - and is substituted into
 * authored pages. It is the website host (currently pond.greenhead.io), not the issuer's
 * on-ledger Domain field.
 */
const domainConfigured = Boolean(site.domain);
const displayDomain = site.domain || site.domainPlaceholder;

/**
 * Render the canonical link list.
 *
 * Unverified entries are rendered with a visible warning rather than quietly, because the whole
 * value of this list is that a reader can trust it. See content.config.json "canonicalLinks".
 */
function canonicalLinksHtml() {
  const links = config.canonicalLinks?.links ?? [];
  if (!links.length) return "";

  const rows = links
    .map((link) => {
      const verified = link.status === "verified";
      const badge = verified
        ? `<span class="status status-ok">verified${
            link.verifiedOn ? ` ${esc(link.verifiedOn)}` : ""
          }</span>`
        : `<span class="status status-warn">unverified</span>`;
      return `<li class="canon-item">
  <div class="canon-head"><span class="canon-label">${esc(link.label)}</span>${badge}</div>
  <p class="canon-purpose">${esc(link.purpose)}</p>
  <p class="canon-url"><a href="${esc(link.url)}" target="_blank" rel="noopener noreferrer nofollow"><code>${esc(
    link.url,
  )}</code></a></p>
  ${link.note ? `<p class="canon-note">${esc(link.note)}</p>` : ""}
</li>`;
    })
    .join("\n");

  const anyUnverified = links.some((l) => l.status !== "verified");
  const warning = anyUnverified
    ? `<p class="canon-warning"><strong>Some links below are unverified.</strong> $PND has not been
       issued, so pages that depend on the token existing cannot render yet, and one of these
       routes has already changed once. Check the issuer address on ledger rather than trusting a
       link alone.</p>`
    : "";

  return `<div class="canon">${warning}<ul class="canon-list">\n${rows}\n</ul></div>`;
}

if (!site.treasuryAddress) fail("site.treasuryAddress missing from content.config.json");
if (!site.operationsAddress) fail("site.operationsAddress missing from content.config.json");

const substitutions = {
  "{{issuerAddress}}": site.issuerAddress,
  "{{issuerAddressStatus}}": site.issuerAddressStatus,
  "{{treasuryAddress}}": site.treasuryAddress,
  "{{operationsAddress}}": site.operationsAddress,
  "{{domain}}": displayDomain,
  "{{title}}": site.title,
  "{{tagline}}": site.tagline,
  "{{canonicalLinks}}": canonicalLinksHtml(),
};

function substitute(text, origin) {
  const out = text.replace(/\{\{(\w+)\}\}/g, (match) => {
    if (match in substitutions) return substitutions[match];
    fail(`unknown placeholder ${match} in ${origin}`);
  });
  return out;
}

/* ------------------------------------------------------------------ page set */

const pages = [];

for (const page of config.pages) {
  if (!page.publish) continue;

  if (page.authored) {
    const file = join(CONTENT_DIR, page.authored);
    if (!existsSync(file)) fail(`authored page missing: content/${page.authored}`);
    const { body } = parseFrontMatter(readFileSync(file, "utf8"));
    const origin = `content/${page.authored}`;
    pages.push({ ...page, markdown: substitute(body, origin), origin });
    continue;
  }

  const name = `${page.repo}__${page.path.replace(/\//g, "_")}`;
  const file = join(IMPORTED_DIR, name);
  if (!existsSync(file)) {
    fail(
      `vendored copy missing for ${page.repo}/${page.path}\n` +
        `         Run "npm run sync" in site/ with the sibling repositories checked out.`,
    );
  }
  const { data, body } = parseFrontMatter(readFileSync(file, "utf8"));

  // Layer 1 of the staleness defence. Needs no access to the sibling repositories, so it runs
  // everywhere including on the deploy host, and catches a vendored snapshot edited by hand after
  // it was synced. Upstream drift is layer 2, in `sync --check`; see scripts/sync.mjs.
  if (!data.source_sha256) {
    fail(
      `vendored copy of ${page.repo}/${page.path} has no source_sha256.\n` +
        `         It predates the integrity check. Run "npm run sync" in site/ and commit.`,
    );
  }
  if (bodyHash(body) !== data.source_sha256) {
    fail(
      `vendored copy of ${page.repo}/${page.path} does not match its recorded source hash.\n` +
        `           recorded ${data.source_sha256.slice(0, 12)}\n` +
        `           actual   ${bodyHash(body).slice(0, 12)}\n\n` +
        `         Files in site/imported/ are generated. Edit the source document in the ${page.repo}\n` +
        `         repository and re-run "npm run sync" — never edit them here, or the site and the\n` +
        `         source repository will disagree about what is true.`,
    );
  }

  pages.push({
    ...page,
    markdown: body,
    origin: `${page.repo}/${page.path}`,
    synced: data.synced,
    sourceRef: data.source_ref,
  });
}

/* --------------------------------------------------- link map and rewriting */

// "repo:path" -> published url, for every page that actually reaches the site.
const linkMap = new Map();
for (const page of config.pages) {
  if (page.repo && page.publish) linkMap.set(`${page.repo}:${page.path}`, page.url);
}

// Repository names as they appear in GitHub URLs, lowercased.
const repoAliases = new Map([
  ["protocol", "protocol"],
  ["pnd", "pnd"],
  ["rpnd", "rpnd"],
]);

// Documents deliberately kept off the site. A link pointing at one of these is an expected
// outcome of the allowlist, not a mistake, so it is unlinked quietly. A link pointing at anything
// else is a genuine unknown and fails --strict.
const excludedSet = new Set(config.excluded.map((e) => `${e.repo}:${e.path}`));

const unlinkedByDesign = [];
const unknownTargets = [];
const externalRepoLinks = new Set();

function resolveInternal(page, href) {
  const [rawPath, hash = ""] = href.split("#");
  const fragment = hash ? `#${hash}` : "";
  if (!rawPath) return href; // pure in-page anchor

  const fromDir = posix.dirname(page.path ?? "");
  const target = posix.normalize(posix.join(fromDir === "." ? "" : fromDir, rawPath));
  const key = `${page.repo}:${target}`;

  const mapped = linkMap.get(key);
  if (mapped) return mapped + fragment;

  const record = { page: page.origin, href, resolvedTo: `${page.repo}/${target}` };
  (excludedSet.has(key) ? unlinkedByDesign : unknownTargets).push(record);
  return null;
}

function resolveGitHub(href) {
  const m = /^https:\/\/github\.com\/PondProtocol\/([^/]+)\/blob\/[^/]+\/(.+?)(#.*)?$/i.exec(href);
  if (!m) return null;
  const repo = repoAliases.get(m[1].toLowerCase());
  if (!repo) return null;
  const mapped = linkMap.get(`${repo}:${m[2]}`);
  if (mapped) return mapped + (m[3] ?? "");
  externalRepoLinks.add(`${repo}/${m[2]}`);
  return null;
}

/* ----------------------------------------------------------------- markdown */

const md = new MarkdownIt({ html: true, linkify: true, typographer: true }).use(anchor, {
  level: [2, 3],
  permalink: anchor.permalink.linkInsideHeader({
    symbol: "#",
    placement: "after",
    class: "heading-anchor",
    ariaHidden: false,
  }),
});

/**
 * Rewrite links during rendering.
 *
 * Relative links in a vendored document point at repository files. Ones whose target is published
 * become site links; ones whose target is not published are unlinked so the text survives but no
 * reader is sent to a page that does not exist. Nothing is silently dropped: every case lands in
 * `unresolved` and is printed in the build summary.
 */
function renderMarkdown(page) {
  const tokens = md.parse(page.markdown, {});
  const unlink = [];

  for (let i = 0; i < tokens.length; i++) {
    const children = tokens[i].type === "inline" ? tokens[i].children : null;
    if (!children) continue;

    for (let j = 0; j < children.length; j++) {
      const token = children[j];
      if (token.type !== "link_open") continue;
      const hrefIndex = token.attrIndex("href");
      if (hrefIndex < 0) continue;
      const href = token.attrs[hrefIndex][1];

      if (/^(https?:)?\/\//i.test(href)) {
        const mapped = page.repo ? resolveGitHub(href) : null;
        if (mapped) {
          token.attrs[hrefIndex][1] = mapped;
        } else if (/^https?:\/\//i.test(href) && !href.includes("github.com/PondProtocol")) {
          token.attrPush(["target", "_blank"]);
          token.attrPush(["rel", "noopener noreferrer"]);
        }
        continue;
      }
      if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("/")) continue;

      if (page.repo) {
        const mapped = resolveInternal(page, href);
        if (mapped) token.attrs[hrefIndex][1] = mapped;
        else unlink.push({ tokens: children, index: j });
      }
    }
  }

  // Unlink from the end so earlier indices stay valid.
  for (const { tokens: children, index } of unlink.reverse()) {
    let close = index + 1;
    while (close < children.length && children[close].type !== "link_close") close++;
    if (close < children.length) children[close].type = "text", (children[close].content = "");
    children[index].type = "text";
    children[index].content = "";
    children[index].attrs = null;
  }

  return md.renderer.render(tokens, md.options, {});
}

/* ------------------------------------------------------------------- layout */

const isPreLaunch = site.launchStatus !== "live";

function navGroupId(section) {
  return String(section)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function publishedPages(group) {
  return group.pages.filter((p) => p.publish !== false);
}

function navItemsHtml(pages, currentUrl) {
  let out = "";
  for (const p of pages) {
    const active = p.url === currentUrl ? ' class="active" aria-current="page"' : "";
    const flag = p.url === "/verify/" ? ' <span class="nav-badge">important</span>' : "";
    out += `<li><a href="${p.url}"${active}>${esc(p.title)}${flag}</a></li>`;
  }
  return out;
}

function navHtml(currentUrl) {
  let out = "";
  for (const group of config.nav) {
    const visible = publishedPages(group);
    if (!visible.length) continue;
    const id = navGroupId(group.section);
    const open = " open";
    out += `<details class="nav-group" data-nav-group="${esc(id)}"${open}>`;
    out += `<summary class="nav-group-title">${esc(group.section)}</summary><ul>`;
    out += navItemsHtml(visible, currentUrl);
    out += "</ul></details>";
  }
  return out;
}

const TOP_BAR_SECTIONS = ["Start here", "$PND", "$rPND", "Protocol"];

const START_STEPS = [
  { id: "begin", url: "/start/", title: "Begin", blurb: "The path. No buy button." },
  { id: "what-is-pnd", url: "/start/pnd/", title: "What is $PND", blurb: "IOU. Not issued. Issuer, not ticker." },
  { id: "what-is-rpnd", url: "/start/rpnd/", title: "What is $rPND", blurb: "Planned MPT. Not this launch." },
  { id: "verify-issuer", url: "/verify/", title: "Verify Issuer", blurb: "Check the address on ledger." },
  { id: "connect-wallet", url: "/start/wallet/", title: "Connect Wallet", blurb: "WalletConnect or Xaman only." },
  { id: "set-trust-lines", url: "/start/trust-lines/", title: "Set Trust Lines", blurb: "In your wallet. Nothing issued." },
  { id: "ready-dex", url: "/start/dex/", title: "Ready to Use DEX", blurb: "Then Trade — not a live DEX." },
];

function isStartFlow(url) {
  return START_STEPS.some((step) => step.url === url);
}

function startProgressHtml(currentUrl) {
  const compact = currentUrl !== "/start/";
  const items = START_STEPS.map((step, i) => {
    const n = String(i + 1).padStart(2, "0");
    const current = step.url === currentUrl ? " is-current" : "";
    return `<li class="start-progress-step${current}" data-start-step="${esc(step.id)}">
      <a href="${step.url}"><b>${n}</b><strong>${esc(step.title)}</strong><span>${esc(step.blurb)}</span></a>
    </li>`;
  }).join("");
  return `<nav class="start-progress${compact ? " is-compact" : ""}" data-start-progress aria-label="Start here progress">
    <div class="start-progress-head">
      <p class="start-eyebrow">Start here · 7 steps</p>
      <p class="start-progress-title">Complete every step before you buy.</p>
      <p class="start-progress-count"><strong data-start-progress-count>0 / 7</strong> saved in a cookie</p>
      <p class="start-progress-note">Progress is a cookie (localStorage backup). After Sign in, it is keyed to your XRPL address. No live buy button. $PND is not issued. Last step opens Trade — a preview, not a live DEX.</p>
    </div>
    <ol class="start-progress-list">${items}</ol>
  </nav>`;
}

function startNextHtml(currentUrl) {
  const index = START_STEPS.findIndex((step) => step.url === currentUrl);
  if (index < 0) return "";
  const prev = START_STEPS[index - 1];
  const next = START_STEPS[index + 1];
  const nextHref = next?.url ?? "/trade/";
  const nextLabel = next ? `Next · ${next.title}` : "Open Trade";
  return `<nav class="start-next" aria-label="Start here next step">
    ${prev ? `<a class="start-next-prev" href="${prev.url}">Back · ${esc(prev.title)}</a>` : `<span class="start-next-prev is-disabled">Begin</span>`}
    <a class="start-next-go" href="${nextHref}">${esc(nextLabel)} <span aria-hidden="true">↗</span></a>
  </nav>`;
}

function topnavHtml(currentUrl) {
  let out = `<nav class="topnav" aria-label="Primary">`;
  for (const section of TOP_BAR_SECTIONS) {
    const group = config.nav.find((g) => g.section === section);
    if (!group) continue;
    const visible = publishedPages(group);
    if (!visible.length) continue;
    const id = navGroupId(section);
    if (section === "Start here") {
      out += `<div class="topnav-start">`;
      out += `<a class="topnav-start-link" href="/start/">Start here</a>`;
      out += `<details class="topnav-menu" data-topnav-menu="${esc(id)}">`;
      out += `<summary aria-label="Open Start here menu"><span class="visually-hidden">Start here menu</span></summary>`;
      out += `<div class="topnav-panel"><ul>${navItemsHtml(visible, currentUrl)}</ul></div>`;
      out += `</details></div>`;
      continue;
    }
    out += `<details class="topnav-menu" data-topnav-menu="${esc(id)}">`;
    out += `<summary>${esc(section)}</summary>`;
    out += `<div class="topnav-panel"><ul>${navItemsHtml(visible, currentUrl)}</ul></div>`;
    out += `</details>`;
  }
  out += `</nav>`;
  return out;
}

function searchHtml(currentUrl) {
  return `<form class="site-search" data-site-search role="search">
  <label class="visually-hidden" for="site-search-input">Search Pond Protocol</label>
  <svg class="site-search-icon" viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"></circle><path d="m13 13 4 4"></path></svg>
  <input id="site-search-input" name="q" type="search" placeholder="Search docs" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-expanded="false" aria-controls="docs-nav" aria-haspopup="true">
  <kbd aria-hidden="true">⌘ K</kbd>
  <aside class="sidebar" id="docs-nav" hidden aria-label="Documentation">
    <p class="sidebar-label"><span class="sidebar-label-mark" aria-hidden="true"></span><span>Docs</span><span class="sidebar-label-meta">Index</span></p>
    <div class="sidebar-body" id="docs-nav-body">
      ${navHtml(currentUrl)}
      <p class="sidebar-empty" data-docs-empty hidden>No matching pages</p>
    </div>
  </aside>
</form>`;
}

function smoothClosed(pts) {
  const n = pts.length;
  let d = "";
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    if (i === 0) d += `M${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`;
    d += `C${c1x.toFixed(1)} ${c1y.toFixed(1)},${c2x.toFixed(1)} ${c2y.toFixed(1)},${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return `${d}Z`;
}

function smoothOpen(pts) {
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(1)} ${c1y.toFixed(1)},${c2x.toFixed(1)} ${c2y.toFixed(1)},${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

function closedContour(cx, cy, rx, ry, { lobes = 3, phase = 0, wobble = 0.14, n = 40 } = {}) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const w =
      1 +
      wobble * Math.sin(t * lobes + phase) +
      wobble * 0.48 * Math.cos(t * (lobes + 1) - phase * 1.25) +
      wobble * 0.2 * Math.sin(t * (lobes + 3) + phase * 0.55);
    pts.push([cx + Math.cos(t) * rx * w, cy + Math.sin(t) * ry * w]);
  }
  return smoothClosed(pts);
}

function ridgePath(y, amp, freq, x0, x1, phase) {
  const pts = [];
  for (let x = x0; x <= x1; x += 24) {
    const t = (x - x0) / Math.max(1, x1 - x0);
    const yy =
      y +
      amp * Math.sin(t * Math.PI * freq + phase) +
      amp * 0.38 * Math.cos(t * Math.PI * (freq + 1.35) - phase);
    pts.push([x, yy]);
  }
  return smoothOpen(pts);
}

function heroTopoSvg() {
  const issuer = site.issuerAddress;
  const treasury = site.treasuryAddress;
  const operations = site.operationsAddress;
  const lines = [
    `{"TransactionType":"Payment","Account":"${issuer}","Destination":"${treasury}","Amount":"0","Flags":0}`,
    `{"TransactionType":"AccountSet","Account":"${issuer}","Flags":0}`,
    `{"TransactionType":"TrustSet","Account":"${operations}","Flags":131072,"LimitAmount":{"currency":"PND","issuer":"${issuer}","value":"0"}}`,
    `Account ${issuer} Destination ${operations} Amount 0 Flags 0 TransactionType Payment`,
    `{"TransactionType":"Payment","Account":"${issuer}","Destination":"${operations}","Amount":"0","Flags":0}`,
  ];
  const paths = [];
  const hill = (cx, cy, r0, r1, step, lobes, phase0) => {
    for (let r = r0; r <= r1; r += step) {
      const t = (r - r0) / Math.max(1, r1 - r0);
      paths.push(
        closedContour(cx, cy, r, r * (0.62 + t * 0.12), {
          lobes,
          phase: phase0 + t * 0.7,
          wobble: 0.11 + t * 0.05,
          n: 42,
        }),
      );
    }
  };
  hill(1185, 355, 56, 430, 34, 3, 0.35);
  hill(1488, 730, 48, 210, 36, 4, 1.1);
  hill(620, 790, 42, 168, 36, 3, 2.2);
  for (let i = 0; i < 5; i++) {
    paths.push(ridgePath(118 + i * 148, 38 + (i % 3) * 10, 2.2 + i * 0.18, -40, 1680, i * 0.7));
  }
  const defs = paths
    .map((d, i) => `<path id="hero-topo-p${i}" d="${d}" fill="none"/>`)
    .join("");
  const texts = paths
    .map((_, i) => {
      const payload = esc(Array.from({ length: 10 }, () => lines[i % lines.length]).join("  ·  "));
      return `<text><textPath href="#hero-topo-p${i}" startOffset="${(i * 7) % 23}%">${payload}</textPath></text>`;
    })
    .join("");
  return `<div class="hero-topo" aria-hidden="true">
  <svg class="hero-topo-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" focusable="false"><defs>${defs}</defs>${texts}</svg>
</div>`;
}

function heroHtml() {
  const chip = isPreLaunch
    ? `<div class="hero-status" role="status">
      <span class="status-chip">Pre-launch · nothing issued yet</span>
      <span>Nothing issued. Nothing to buy.</span>
    </div>`
    : "";
  return `<section class="hero" aria-labelledby="hero-tagline">
  ${heroTopoSvg()}
  <div class="hero-inner">
    <p class="hero-kicker">Pond Protocol</p>
    <h1 id="hero-tagline" class="hero-tagline">${esc(site.tagline)}</h1>
    <p class="hero-lede"><strong>$PND has not launched.</strong> Target 1 October 2026.
    Identity is the pair <strong>(PND, issuer address)</strong>, never the ticker.
    $rPND is not launching that day.</p>
    ${chip}
    <div class="hero-id">
      <span class="hero-id-label">Canonical issuer</span>
      <code class="addr">${esc(site.issuerAddress)}</code>
    </div>
    <p class="hero-actions">
      <a class="button" href="/verify/">Verify the real $PND <span aria-hidden="true">↗</span></a>
      <a class="button button-quiet" href="/hold/">How to hold it safely <span aria-hidden="true">↗</span></a>
    </p>
  </div>
</section>`;
}

function protocolSnapshotHtml() {
  const snapshotContent = `<div class="protocol-snapshot-title"><span class="protocol-snapshot-dot" aria-hidden="true"></span><strong>Protocol snapshot</strong><span>Pre-launch</span></div>
    <div class="protocol-snapshot-group">
      <span class="protocol-snapshot-label">Network</span>
      <div class="protocol-snapshot-items">
        <span><i class="snapshot-status is-live" aria-hidden="true"></i>Live <strong>XRP</strong></span>
        <span><i class="snapshot-status is-testnet" aria-hidden="true"></i>Testnet <strong>XRP</strong></span>
      </div>
    </div>
    <div class="protocol-snapshot-group">
      <span class="protocol-snapshot-label">Assets</span>
      <div class="protocol-snapshot-items">
        <span><strong>$PND</strong><em>IOU · not issued</em></span>
        <span><strong>$rPND</strong><em>MPT · planned</em></span>
      </div>
    </div>
    <div class="protocol-snapshot-group protocol-snapshot-users">
      <span class="protocol-snapshot-label">Users</span>
      <div class="protocol-snapshot-items">
        <span><b>Volume</b><strong>Not live</strong></span>
        <span><b>Holders</b><strong>—</strong></span>
        <span><b>Traders</b><strong>—</strong></span>
        <span><b>Market cap</b><strong>—</strong></span>
        <span><b>Locked supply</b><strong>Not issued</strong></span>
        <span><b>Total supply</b><strong>100B planned</strong></span>
        <span><b>Open supply</b><strong>Not issued</strong></span>
      </div>
    </div>`;
  return `<section class="protocol-snapshot" aria-label="Protocol snapshot">
  <div class="protocol-snapshot-inner" tabindex="0" aria-label="Scrolling protocol snapshot; hover or focus to pause">
    <div class="protocol-snapshot-track">
      <div class="protocol-snapshot-set">${snapshotContent}</div>
      <div class="protocol-snapshot-set" aria-hidden="true">${snapshotContent}</div>
    </div>
  </div>
</section>`;
}

function tocHtml(html) {
  const headings = [...html.matchAll(/<h2 id="([^"]+)"[^>]*>(.*?)<\/h2>/gs)].map(([, id, inner]) => ({
    id,
    text: inner.replace(/<[^>]+>/g, "").trim(),
  }));
  if (headings.length < 3) return "";
  return (
    `<nav class="toc" aria-label="On this page"><p class="toc-title">On this page</p><ul>` +
    headings.map((h) => `<li><a href="#${h.id}">${esc(h.text)}</a></li>`).join("") +
    `</ul></nav>`
  );
}

// The compact pre-launch status remains in the menu bar. Keep the larger
// sitewide banner out of the page shell so focused pages have room to work.
const banner = "";

const iconShield = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>`;
const iconLock = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="16" r="1"/><rect x="3" y="10" width="18" height="12" rx="2"/><path d="M7 10V7a5 5 0 0 1 10 0v3"/></svg>`;
const iconVault = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/><path d="m7.9 7.9 2.7 2.7"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/><path d="m13.4 10.6 2.7-2.7"/><circle cx="7.5" cy="16.5" r=".5" fill="currentColor"/><path d="m7.9 16.1 2.7-2.7"/><circle cx="16.5" cy="16.5" r=".5" fill="currentColor"/><path d="m13.4 13.4 2.7 2.7"/><circle cx="12" cy="12" r="2"/></svg>`;
const iconX = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
const iconCheck = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`;
const iconBan = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>`;
const iconCookie = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/><path d="M8.5 8.5v.01"/><path d="M16 15.5v.01"/><path d="M12 12v.01"/><path d="M11 17v.01"/><path d="M7 14v.01"/></svg>`;
const iconScan = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="1"/><path d="M18.944 12.33a1 1 0 0 0 0-.66 7.5 7.5 0 0 0-13.888 0 1 1 0 0 0 0 .66 7.5 7.5 0 0 0 13.888 0"/></svg>`;

function sessionChipHtml() {
  return `<div class="session-chip" data-session-chip>
  <div class="session-guest" data-session-guest>
    <button type="button" class="session-toggle" data-session-toggle aria-haspopup="menu" aria-expanded="false" aria-controls="session-menu">Sign in</button>
    <div class="session-menu" id="session-menu" data-session-menu hidden>
      <p class="session-menu-kicker">Sign in</p>
      <p class="session-menu-copy">Official WalletConnect or Xaman. Pond never asks for a seed.</p>
      <div class="session-menu-block">
        <p class="session-menu-label">WalletConnect</p>
        <button type="button" class="session-wc" data-session-wc>Continue with WalletConnect</button>
        <p class="session-wc-error" data-session-wc-error hidden></p>
      </div>
      <div class="session-menu-block">
        <p class="session-menu-label">Xaman</p>
        <p class="session-menu-hint">Official SignIn. The QR appears when this menu opens.</p>
        <div data-xaman-app data-xaman-compact data-xaman-autostart data-return="/trade/"></div>
        <p class="session-xaman-note" data-session-xaman-note>Xaman is disabled until Autoscale has XUMM_API_KEY and XUMM_API_SECRET.</p>
      </div>
    </div>
  </div>
  <div class="session-authed" data-session-authed hidden>
    <a class="session-profile" data-session-profile href="/profile/" aria-label="Open your profile">
      <img class="session-avatar" data-session-avatar src="/greenhead-duck.png" width="30" height="30" alt="">
      <span class="session-profile-name" data-session-name></span>
    </a>
  </div>
  <xrpl-wallet-connector id="pond-session-connector" background-color="#111315" theme-mode="dark"></xrpl-wallet-connector>
</div>`;
}

function privacyDockHtml() {
  return `<div class="privacy-dock" data-privacy-dock data-privacy-mode="fab" data-testid="privacy-bottom-dock">
  <div class="privacy-dock-stack" data-privacy-stack>
    <button type="button" class="privacy-fab" data-privacy-fab aria-label="Open privacy vault" data-testid="button-cookie-settings">
      <span class="privacy-fab-mark" aria-hidden="true">
        <span class="privacy-fab-shield">${iconShield}</span>
        <span class="privacy-fab-lock">${iconLock}</span>
      </span>
      <span class="privacy-fab-tip">Privacy vault</span>
    </button>
    <div class="privacy-notice" data-privacy-notice hidden role="status" data-testid="privacy-first-visit-notice">
      <div class="privacy-notice-head">
        <p class="privacy-kicker privacy-kicker-notice">Private Browsing</p>
        <button type="button" class="privacy-icon-btn" data-privacy-close-notice aria-label="Close private browsing notice" data-testid="button-close-privacy-notice">${iconX}</button>
      </div>
      <p class="privacy-notice-copy">We use cookies to keep you signed in and to remember Start Here progress. We do not sell your data, run ads, or ask for seeds, keys, or passwords. This is the $PND / Pond Protocol site, not the Greenhead Labs agent product.</p>
      <div class="privacy-notice-actions">
        <a class="privacy-btn privacy-btn-mint" href="/legal/" data-privacy-legal data-testid="button-privacy-notice-legal">Legal</a>
        <button type="button" class="privacy-btn privacy-btn-ghost" data-privacy-open-vault data-testid="button-open-privacy-vault-from-notice">Privacy vault</button>
      </div>
    </div>
    <div class="privacy-vault" data-privacy-vault hidden role="dialog" aria-modal="true" aria-labelledby="privacy-vault-title" data-testid="cookie-settings-panel">
      <div class="privacy-vault-body">
        <div class="privacy-vault-head">
          <div>
            <div class="privacy-kicker privacy-kicker-vault">${iconVault}<span>Privacy controls</span></div>
            <h2 id="privacy-vault-title">Privacy vault</h2>
          </div>
          <button type="button" class="privacy-icon-btn" data-privacy-close-vault aria-label="Close cookie settings" data-testid="button-close-cookie-settings">${iconX}</button>
        </div>
        <p class="privacy-vault-lede">This is pond.greenhead.io, the Pond Protocol / $PND documentation site — not the Greenhead Labs agent product at greenhead.io. We use cookies for your login session and Start Here progress. After you sign in with WalletConnect or Xaman, we remember the XRPL address you signed in with. Analytics and advertising scripts are not installed. We do not sell or share personal information. We will never ask for seed phrases, private keys, or passwords in a message or pop-up. Connect is official XRPL WalletConnect or Xaman only; it is not a seed prompt.</p>
        <p class="privacy-gpc" data-privacy-gpc hidden data-testid="privacy-gpc-note">Your browser sent a Global Privacy Control or Do Not Track signal. Session and Start Here cookies still run so you stay logged in and keep progress. Analytics stay off.</p>
        <p class="privacy-session" data-privacy-session hidden></p>
        <div class="privacy-rows">
          <div class="privacy-row">
            <span>
              <span class="privacy-row-title">Cookies</span>
              <span class="privacy-row-copy">On for login session and Start Here progress. Not advertising cookies. Anonymous progress is kept until you sign in; then it is keyed to your XRPL address.</span>
            </span>
            <span class="privacy-on" aria-label="Session and progress cookies on">${iconCookie}On</span>
          </div>
          <div class="privacy-row">
            <span>
              <span class="privacy-row-title">Wallet login</span>
              <span class="privacy-row-copy">Identity is the XRPL address from official WalletConnect or Xaman SignIn. We remember that address in a session cookie. We will never ask for seed phrases, private keys, or passwords in a pop-up, email, or chat.</span>
            </span>
            <span class="privacy-on" aria-label="Wallet login uses cookies">${iconLock}On</span>
          </div>
          <div class="privacy-row">
            <span>
              <span class="privacy-row-title">Analytics</span>
              <span class="privacy-row-copy">No analytics scripts are installed. We do not sell or share a browsing profile. There is no Pond visitor counter on this site.</span>
            </span>
            <span class="privacy-off" aria-label="Analytics not installed">${iconBan}Off</span>
          </div>
        </div>
      </div>
      <div class="privacy-vault-actions">
        <a class="privacy-btn privacy-btn-ghost" href="/legal/" data-privacy-legal data-testid="button-vault-legal">Legal</a>
        <button type="button" class="privacy-btn privacy-btn-mint privacy-btn-got-it" data-privacy-got-it data-testid="button-save-cookie-settings">${iconCheck}Got it</button>
      </div>
    </div>
  </div>
</div>`;
}

function layout(page, html) {
  const isHome = page.url === "/";
  const title = isHome ? site.title : `${page.title} — ${site.title}`;
  // Emitted only once a real domain exists. See content.config.json "$comment_domain".
  const canonical = domainConfigured
    ? `<link rel="canonical" href="${esc(`https://${site.domain}${page.url}`)}">
<meta property="og:url" content="${esc(`https://${site.domain}${page.url}`)}">
<meta property="og:image" content="${esc(`https://${site.domain}/hero.png`)}">`
    : `<!-- canonical omitted: site.domain is not set in content.config.json -->`;
  // Naming the ref matters when it is not `main`: the page is then rendered from an unmerged
  // branch, and a reader deserves to know that rather than take it as settled.
  const pinned = page.sourceRef && page.sourceRef !== "main" && page.sourceRef !== "worktree";
  const provenance = page.repo
    ? `<p class="provenance">Source of truth: <code>${esc(page.repo)}/${esc(page.path)}</code>${
        page.synced ? ` &middot; synced ${esc(page.synced)}` : ""
      }${
        pinned ? ` &middot; from unmerged branch <code>${esc(page.sourceRef)}</code>` : ""
      }. Edit it there, not here.</p>`
    : "";
  // Sibling-repo token-spec still names a 90B Treasury escrow. That is not the
  // public schedule. Authored /vesting/ is the high-level split. Never invent
  // a claim UI from this notice.
  const lockedNinety =
    /holds the 90\s*(?:B|billion).{0,40}escrow/i.test(page.markdown || "") ||
    /holding the 90\s*(?:B|billion).{0,40}escrow/i.test(page.markdown || "") ||
    /the 90B(?: \$PND)? vesting escrow/i.test(page.markdown || "");
  const supplyRevision = page.repo && lockedNinety
    ? `<div class="callout callout-critical" data-supply-revision="1">
<p><strong>Supply split is not a 90 billion escrow.</strong> Do not treat ten
9 billion self-escrows as the public schedule. High-level split: 10 billion
public, 10 billion team, 80 billion to holders at 10 billion per month from
2027-01-01 through 2027-08-01, proportional to $PND held. Snapshot plus
treasury payments, not TokenEscrow, not a claim.
<a href="/vesting/">Supply split</a>.</p>
</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#0a0a0b">
<title>${esc(title)}</title>
<meta name="description" content="${esc(page.description ?? site.description)}">
${canonical}
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(page.description ?? site.description)}">
<meta property="og:type" content="website">
<script>
  (() => {
    const root = document.documentElement;
    window.addEventListener("unhandledrejection", (event) => {
      if (event.reason?.message === "Transition was skipped") {
        event.preventDefault();
      }
    });
    root.classList.add("has-nav-js");
  })();
</script>
<link rel="stylesheet" href="/styles.css">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/icon-512.png" type="image/png" sizes="512x512">
<link rel="apple-touch-icon" href="/icon-512.png">
</head>
<body class="${isHome ? "page-home" : page.url === "/trade/" ? "page-trade page-docs" : page.url === "/connect/" ? "page-connect page-docs" : page.url.startsWith("/profile/") ? "page-profile page-docs" : page.url === "/card/" ? "page-card page-docs" : isStartFlow(page.url) ? "page-start page-docs" : "page-docs"}">
<div id="site-view">
<a class="skip" href="#main">Skip to content</a>
<header class="topbar">
  <div class="brand-cluster">
    <a class="brand" href="/" aria-label="${esc(site.title)}"><img class="brand-mark" src="/icon-512.png" width="28" height="28" alt=""><span class="brand-word">Pond</span></a>
    <span class="brand-rule" aria-hidden="true"></span>
    <p class="powered-by">
      <span class="powered-by-label">Powered By Greenhead Labs</span>
      <img class="powered-by-mark" src="/greenhead-duck.png" width="18" height="18" alt="">
      <a class="powered-by-return" href="https://greenhead.io">Return to Main Site</a>
    </p>
  </div>
  <div class="topbar-end">
    ${topnavHtml(page.url)}
    ${searchHtml(page.url)}
    <a class="topbar-trade" href="/trade/">Trade</a>
    ${sessionChipHtml()}
  </div>
</header>
${banner}
${protocolSnapshotHtml()}
${isHome ? heroHtml() : ""}
<div class="shell">
  <main id="main">
    ${isHome ? "" : tocHtml(html)}
    ${isStartFlow(page.url) ? startProgressHtml(page.url) : ""}
    <article class="prose">${supplyRevision}${html}</article>
    ${isStartFlow(page.url) ? startNextHtml(page.url) : ""}
    ${provenance}
  </main>
</div>
<footer class="footer">
  <div class="footer-inner">
    <div class="footer-main">
      <div class="footer-brand">
        <a class="footer-logo" href="/" aria-label="${esc(site.title)} home"><img src="/icon-512.png" width="36" height="36" alt=""><span>${esc(site.title)}</span></a>
        <p class="footer-tagline">${esc(site.tagline)}</p>
        <a class="footer-back-to-top" href="#site-view">Back to top <span aria-hidden="true">⌃</span></a>
      </div>
      <nav class="footer-column" aria-label="Protocol links">
        <h2>Protocol</h2>
        <a href="/protocol/">Overview</a>
        <a href="/protocol/architecture/">Architecture</a>
        <a href="/protocol/two-tokens/">Two tokens</a>
        <a href="/discovery/">Discovery</a>
        <a href="/verify/">Verify the issuer</a>
      </nav>
      <nav class="footer-column" aria-label="Markets and assets">
        <h2>Markets &amp; assets</h2>
        <a href="/trade/">Trade terminal</a>
        <a href="/start/">Start here</a>
        <a href="/pnd/">$PND</a>
        <a href="/rpnd/">$rPND</a>
        <a href="/hold/">Holding safely</a>
      </nav>
      <nav class="footer-column footer-column-stacked" aria-label="Resources and company">
        <div>
          <h2>Resources</h2>
          <a href="/wallets/">Wallets</a>
          <a href="/connect/">Connect Xaman</a>
          <a href="/xrp-ledger-toml/">xrp-ledger.toml</a>
          <a href="/links/">Official links</a>
          <a href="/open-questions/">Open questions</a>
        </div>
        <div>
          <h2>Company</h2>
          <a href="/team/">Meet the team</a>
          <a href="/legal/">Legal &amp; privacy</a>
          <a href="/links/">Contact &amp; official links</a>
        </div>
      </nav>
    </div>
    <div class="footer-bottom">
      <div class="footer-social">
        <a class="footer-social-link" href="${esc(site.repoUrlBase)}" target="_blank" rel="noopener noreferrer" aria-label="Pond Protocol on GitHub">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5a9.5 9.5 0 0 0-3 18.51c.47.09.64-.2.64-.45v-1.68c-2.6.57-3.15-1.1-3.15-1.1-.43-1.09-1.05-1.38-1.05-1.38-.85-.58.06-.57.06-.57.94.07 1.44.97 1.44.97.84 1.43 2.21 1.02 2.75.78.09-.61.33-1.02.6-1.26-2.08-.24-4.27-1.04-4.27-4.65 0-1.03.37-1.87.97-2.53-.1-.24-.42-1.2.09-2.5 0 0 .79-.25 2.6.97A9 9 0 0 1 12 7.31c.8 0 1.61.11 2.36.33 1.8-1.22 2.59-.97 2.59-.97.51 1.3.19 2.26.1 2.5.6.66.96 1.5.96 2.53 0 3.62-2.2 4.4-4.29 4.64.34.3.64.87.64 1.76v2.61c0 .25.17.54.65.45A9.5 9.5 0 0 0 12 2.5Z"/></svg>
          <span>GitHub</span>
        </a>
        <a class="footer-social-link" href="/verify/" aria-label="Verify the Pond issuer">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 7 3v5.25c0 4.4-2.94 8.3-7 9.75-4.06-1.45-7-5.35-7-9.75V6l7-3Zm3.35 6.4-4.08 4.08-2.1-2.1-1.06 1.06 3.16 3.16 5.14-5.14-1.06-1.06Z"/></svg>
          <span>Verify</span>
        </a>
      </div>
      <div class="footer-legal">
        <div class="footer-legal-links">
          <a href="/protocol/">Protocol</a>
          <span aria-hidden="true">|</span>
          <a href="/links/">Official links</a>
          <span aria-hidden="true">|</span>
          <a href="/verify/">Issuer verification</a>
          <span aria-hidden="true">|</span>
          <a href="/protocol/security/">Security</a>
          <span aria-hidden="true">|</span>
          <a href="/legal/">Legal</a>
        </div>
        <p>© 2026 ${esc(site.title)}. Documentation licensed Apache-2.0.</p>
        <p class="footer-integrity">The issuer address is the source of truth for $PND identity. <a href="/verify/">Check it before you trust a balance or link.</a></p>
      </div>
    </div>
  </div>
</footer>
</div>
${privacyDockHtml()}
<script>window.POND={issuer:${JSON.stringify(site.issuerAddress)},domain:${JSON.stringify(site.domain)}};</script>
<script src="/nav.js" defer></script>
<script src="/session.js" defer></script>
<script src="/start.js" defer></script>
<script src="/profile.js" defer></script>
<script src="/card.js" defer></script>
<script src="/disclaimer.js" defer></script>
<script src="/privacy.js" defer></script>
<script src="/xaman.js" defer></script>
${page.url === "/trade/" ? '<script src="https://cdn.jsdelivr.net/npm/xrpl@4.6.0/build/xrpl-latest-min.js" integrity="sha384-CpYwnqlAsxiza8BZ+PUpX39uhZkCYfSBVvKjNVnA0imli67z0EGjXIw3qCPDvmcm" crossorigin="anonymous" defer></script><script src="https://cdn.jsdelivr.net/npm/xrpl-connect@1.0.0-rc.2/xrpl-connect.umd.js" integrity="sha384-ueuYZnZaUD40FEdvT0PcZwjAEFauarQj4LK/sVpWW4YtlFBJOJOoo81UtiIoxilM" crossorigin="anonymous" defer></script>' : ""}
<script src="/trade.js" defer></script>
</body>
</html>
`;
}

/* -------------------------------------------------------------------- write */

rmSync(DIST_DIR, { recursive: true, force: true });
mkdirSync(DIST_DIR, { recursive: true });

for (const page of pages) {
  const html = renderMarkdown(page);
  const dir = page.url === "/" ? DIST_DIR : join(DIST_DIR, page.url.replace(/^\/|\/$/g, ""));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), layout(page, html));
}

// 404. GitHub Pages, Cloudflare Pages, and Replit Static all serve /404.html for unmatched paths.
writeFileSync(
  join(DIST_DIR, "404.html"),
  layout(
    { url: "/404", title: "Not found", description: "Page not found." },
    `<h1>Not found</h1><p>That page does not exist. Start at the <a href="/">documentation index</a>,
     or go straight to <a href="/verify/">verifying the real $PND</a>.</p>`,
  ),
);

/* --------------------------------------------------------- static passthrough
 *
 * cpSync copies dot-directories. That is the whole reason this build does not shell out to a
 * generator with its own opinions about hidden files: /.well-known/xrp-ledger.toml has to land at
 * exactly that path, and the assertion below refuses to produce output where it did not.
 */
if (existsSync(PUBLIC_DIR)) cpSync(PUBLIC_DIR, DIST_DIR, { recursive: true, dereference: true });

const wellKnown = join(DIST_DIR, WELL_KNOWN_PATH);
if (!existsSync(wellKnown) || !statSync(wellKnown).isFile()) {
  fail(
    `build produced no ${WELL_KNOWN_PATH}.\n` +
      `         This file is the identity anchor for the $PND issuer. Refusing to emit a site\n` +
      `         without it, because the failure mode is a silent 404 on the one path that the\n` +
      `         issuer's on-ledger Domain field points at.`,
  );
}

// Replit Static omits dot-directories from the published tree. Verified 2026-09-16 against
// pond.greenhead.io: /.well-known/xrp-ledger.toml and /.nojekyll 404, while /_headers and
// /robots.txt (non-dot files from the same public/ copy) return 200. Keep the RFC 8615 path
// for hosts that serve it, and a non-dot twin so a rewrite (and Autoscale) can still answer
// the XLS-26 URL.
const wellKnownVisible = join(DIST_DIR, WELL_KNOWN_VISIBLE_PATH);
mkdirSync(dirname(wellKnownVisible), { recursive: true });
writeFileSync(wellKnownVisible, readFileSync(wellKnown));

/* ------------------------------------------------------------------ summary */

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    entry.isDirectory() ? walk(full) : files.push(relative(DIST_DIR, full));
  }
})(DIST_DIR);

const excluded = config.excluded.length;
process.stdout.write(
  `\n  Pond Protocol docs site\n` +
    `  ${"-".repeat(58)}\n` +
    `  pages published     ${pages.length}\n` +
    `  documents excluded  ${excluded} (see content.config.json "excluded")\n` +
    `  files in dist/      ${files.length}\n` +
    `  well-known          ${WELL_KNOWN_PATH} present (${statSync(wellKnown).size} bytes)\n` +
    `  well-known twin     ${WELL_KNOWN_VISIBLE_PATH} present (${statSync(wellKnownVisible).size} bytes)\n` +
    `  launch status       ${site.launchStatus}\n`,
);

// Pins are temporary by definition, so they are reported on every build rather than only when
// somebody thinks to look. A pin means the public site would render documentation from a branch
// that has not been reviewed and merged.
const roots = sourceRoots(config, SITE_ROOT);
const pins = Object.entries(roots).filter(([, r]) => r.ref !== "main" && r.ref !== "worktree");
if (pins.length) {
  process.stdout.write(
    `\n  ${pins.length} source repository/repositories pinned to an UNMERGED ref:\n` +
      pins
        .map(
          ([name, r]) =>
            `    ${name} -> ${r.ref}\n` +
            `      ${(r.pinnedReason ?? "NO REASON RECORDED").replace(/\s+/g, " ").slice(0, 300)}\n`,
        )
        .join(""),
  );
}

if (externalRepoLinks.size) {
  process.stdout.write(
    `\n  ${externalRepoLinks.size} link(s) point at repository files that are not published.\n` +
      `  They are left as GitHub URLs and will only resolve for readers who can see the repo:\n` +
      [...externalRepoLinks].map((l) => `    ${l}\n`).join(""),
  );
}

if (unlinkedByDesign.length) {
  const targets = [...new Set(unlinkedByDesign.map((u) => u.resolvedTo))];
  process.stdout.write(
    `\n  ${unlinkedByDesign.length} link(s) pointed at deliberately excluded documents and were\n` +
      `  unlinked (the link text is kept, the anchor is removed). This is the allowlist working:\n` +
      targets.map((t) => `    ${t}\n`).join(""),
  );
}

if (unknownTargets.length) {
  process.stdout.write(
    `\n  ${unknownTargets.length} link(s) pointed at files that are neither published nor listed\n` +
      `  as excluded, so it is not clear whether leaving them off the site is intended:\n` +
      unknownTargets.map((u) => `    ${u.page}: "${u.href}" -> ${u.resolvedTo}\n`).join(""),
  );
  if (strict) {
    fail(
      `--strict: ${unknownTargets.length} link target(s) are unaccounted for.\n` +
        `         Decide explicitly for each one: add it to "nav" to publish it, or add it to\n` +
        `         "excluded" with a reason. Silently unlinking a document nobody has looked at is\n` +
        `         how internal material ends up half-published.`,
    );
  }
}

process.stdout.write(`\n  built -> site/dist\n\n`);
