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
  WELL_KNOWN_PATH,
  fail,
  loadConfig,
  parseFrontMatter,
} from "./lib.mjs";

const strict = process.argv.includes("--strict");
const config = loadConfig();
const { site } = config;

/* ---------------------------------------------------------- substitutions
 *
 * The domain is not chosen yet, so it exists in exactly one place - content.config.json - and is
 * substituted into authored pages. Nothing hardcodes it, which is what makes swapping in the real
 * domain a one-line edit rather than a search-and-replace across the site.
 */
const domainConfigured = Boolean(site.domain);
const displayDomain = site.domain || site.domainPlaceholder;

const substitutions = {
  "{{issuerAddress}}": site.issuerAddress,
  "{{issuerAddressStatus}}": site.issuerAddressStatus,
  "{{domain}}": displayDomain,
  "{{title}}": site.title,
  "{{tagline}}": site.tagline,
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
  pages.push({ ...page, markdown: body, origin: `${page.repo}/${page.path}`, synced: data.synced });
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

const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const isPreLaunch = site.launchStatus !== "live";

function navHtml(currentUrl) {
  let out = "";
  for (const group of config.nav) {
    const visible = group.pages.filter((p) => p.publish !== false);
    if (!visible.length) continue;
    out += `<div class="nav-group"><p class="nav-group-title">${esc(group.section)}</p><ul>`;
    for (const p of visible) {
      const active = p.url === currentUrl ? ' class="active" aria-current="page"' : "";
      const flag = p.url === "/verify/" ? ' <span class="nav-badge">important</span>' : "";
      out += `<li><a href="${p.url}"${active}>${esc(p.title)}${flag}</a></li>`;
    }
    out += "</ul></div>";
  }
  return out;
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
  ? `<div class="banner" role="status"><strong>$PND has not launched.</strong> The issuer account is
     funded but not yet configured, and no $PND has been issued. Any token trading under the code
     <code>PND</code> today is <strong>not</strong> $PND. <a href="/verify/">How to verify &rarr;</a></div>`
  : "";

function layout(page, html) {
  const title = page.url === "/" ? site.title : `${page.title} — ${site.title}`;
  // Emitted only once a real domain exists. See content.config.json "$comment_domain".
  const canonical = domainConfigured
    ? `<link rel="canonical" href="${esc(`https://${site.domain}${page.url}`)}">
<meta property="og:url" content="${esc(`https://${site.domain}${page.url}`)}">`
    : `<!-- canonical omitted: site.domain is not set in content.config.json -->`;
  const provenance = page.repo
    ? `<p class="provenance">Source of truth: <code>${esc(page.repo)}/${esc(page.path)}</code>${
        page.synced ? ` &middot; synced ${esc(page.synced)}` : ""
      }. Edit it there, not here.</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(page.description ?? site.description)}">
${canonical}
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(page.description ?? site.description)}">
<meta property="og:type" content="website">
<link rel="stylesheet" href="/styles.css">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="topbar">
  <a class="brand" href="/"><span class="brand-mark" aria-hidden="true"></span>${esc(site.title)}</a>
  <nav class="topnav" aria-label="Primary">
    <a href="/verify/" class="cta">Verify the real $PND</a>
    <a href="/xrp-ledger-toml/">xrp-ledger.toml</a>
    <a href="/protocol/">Protocol</a>
  </nav>
</header>
${banner}
<div class="shell">
  <aside class="sidebar" aria-label="Documentation">${navHtml(page.url)}</aside>
  <main id="main">
    ${tocHtml(html)}
    <article class="prose">${html}</article>
    ${provenance}
  </main>
</div>
<footer class="footer">
  <p><strong>${esc(site.title)}</strong> &middot; documentation. Apache-2.0.</p>
  <p class="muted">Asset identity on the XRP Ledger is the pair (currency code, issuer address).
  A different issuer using the code <code>PND</code> is a different token.</p>
</footer>
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

// 404. GitHub Pages and Cloudflare Pages both serve /404.html for unmatched paths.
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
    `  launch status       ${site.launchStatus}\n`,
);

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
