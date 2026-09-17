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

function navHtml(currentUrl) {
  let out = "";
  for (const group of config.nav) {
    const visible = group.pages.filter((p) => p.publish !== false);
    if (!visible.length) continue;
    const id = navGroupId(group.section);
    const open = " open";
    out += `<details class="nav-group" data-nav-group="${esc(id)}"${open}>`;
    out += `<summary class="nav-group-title">${esc(group.section)}</summary><ul>`;
    for (const p of visible) {
      const active = p.url === currentUrl ? ' class="active" aria-current="page"' : "";
      const flag = p.url === "/verify/" ? ' <span class="nav-badge">important</span>' : "";
      out += `<li><a href="${p.url}"${active}>${esc(p.title)}${flag}</a></li>`;
    }
    out += "</ul></details>";
  }
  return out;
}

function heroHtml() {
  const chip = isPreLaunch
    ? `<div class="hero-status" role="status">
      <span class="status-chip">Pre-launch · nothing issued yet</span>
      <span>Nothing issued. Nothing to buy.</span>
    </div>`
    : "";
  return `<section class="hero" aria-labelledby="hero-tagline">
  <img class="hero-art" src="/hero.png" width="1920" height="1080" alt="">
  <div class="hero-veil" aria-hidden="true"></div>
  <div class="hero-signal" aria-hidden="true"><span></span></div>
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
  <aside class="hero-readout" aria-label="Protocol snapshot">
    <div class="hero-readout-head"><span class="hero-readout-dot" aria-hidden="true"></span>Protocol snapshot</div>
    <div class="hero-readout-grid">
      <div><span>Network</span><strong>XRP Ledger</strong></div>
      <div><span>Asset</span><strong>$PND · IOU</strong></div>
      <div><span>Launch</span><strong>01 Oct 2026</strong></div>
    </div>
  </aside>
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

const banner = isPreLaunch
  ? `<div class="banner" role="status"><strong>$PND has not launched.</strong> Target
     1 October 2026. No $PND has been issued. Any token trading under the code
     <code>PND</code> today is <strong>not</strong> $PND. <a href="/verify/">How to verify &rarr;</a></div>`
  : "";

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
    try {
      if (localStorage.getItem("pond-docs-nav-collapsed") === "1") {
        root.classList.add("docs-collapsed");
      }
    } catch {
      /* private mode */
    }
  })();
</script>
<link rel="stylesheet" href="/styles.css">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/icon-512.png" type="image/png" sizes="512x512">
<link rel="apple-touch-icon" href="/icon-512.png">
</head>
<body class="${isHome ? "page-home" : page.url === "/trade/" ? "page-trade page-docs" : "page-docs"}">
<div id="site-view">
<a class="skip" href="#main">Skip to content</a>
<header class="topbar">
  <a class="brand" href="/"><img class="brand-mark" src="/icon-512.png" width="32" height="32" alt="">${esc(site.title)}</a>
  <nav class="topnav" aria-label="Primary">
    ${
      isPreLaunch
        ? `<span class="status-chip" title="No $PND on ledger yet">Pre-launch · nothing issued yet</span>`
        : ""
    }
    <a href="/verify/" class="cta">Verify the real $PND</a>
    <a href="/rpnd/">$rPND</a>
    <a href="/pnd/">$PND</a>
    <a href="/protocol/">Protocol</a>
    <a href="/trade/">Trade</a>
    <a href="/hold/">Hold</a>
    <a href="/wallets/">Wallets</a>
    <a href="/links/">Links</a>
    <button type="button" class="docs-open" data-docs-open aria-expanded="false" aria-controls="docs-nav">Docs
      <svg class="docs-open-icon" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M6 3.5 L11 8 L6 12.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
  </nav>
</header>
${banner}
${isHome ? heroHtml() : ""}
<div class="docs-backdrop" data-docs-backdrop></div>
<button type="button" class="docs-rail" data-docs-toggle aria-expanded="true" aria-controls="docs-nav" title="Collapse documentation menu">
  <svg class="docs-rail-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M6 3.5 L11 8 L6 12.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
  <span class="visually-hidden">Collapse documentation menu</span>
</button>
<div class="shell">
  <main id="main">
    ${isHome ? "" : tocHtml(html)}
    <article class="prose">${supplyRevision}${html}</article>
    ${provenance}
  </main>
  <aside class="sidebar" id="docs-nav" aria-label="Documentation">
    <p class="sidebar-label"><span class="sidebar-label-mark" aria-hidden="true"></span><span>Docs</span><span class="sidebar-label-meta">Index</span></p>
    <div class="sidebar-body" id="docs-nav-body">
      ${navHtml(page.url)}
    </div>
  </aside>
</div>
<footer class="footer">
  <div class="footer-inner">
    <p><strong>${esc(site.title)}</strong> &middot; documentation. Licensed Apache-2.0.</p>
    <p class="muted">Asset identity on the XRP Ledger is the pair (currency code, issuer address),
    never the code alone. A different issuer using the code <code>PND</code> is a different token.
    <a href="/verify/">Check the issuer address</a> before you trust anything calling itself $PND.</p>
  </div>
</footer>
</div>
<script src="/nav.js" defer></script>
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
