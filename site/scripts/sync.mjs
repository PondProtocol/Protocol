#!/usr/bin/env node
/**
 * Vendor allowlisted repository documents into site/imported/.
 *
 * The build never reads the sibling repositories. It reads site/content/ and site/imported/ only,
 * which means a build is reproducible from this repository alone and the set of documents that
 * would go public is visible as a diff in the pull request rather than resolved at deploy time.
 *
 *   node scripts/sync.mjs           refresh the vendored copies
 *   node scripts/sync.mjs --check   fail if the vendored copies are stale (used by CI)
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  IMPORTED_DIR,
  SITE_ROOT,
  fail,
  importedFileName,
  loadConfig,
  serializeFrontMatter,
} from "./lib.mjs";

const checkOnly = process.argv.includes("--check");
const config = loadConfig();
const imported = config.pages.filter((p) => p.repo);

const roots = {};
for (const [name, rel] of Object.entries(config.sources)) {
  if (name.startsWith("$")) continue;
  roots[name] = resolve(SITE_ROOT, rel);
}

/** Reject anything that resolves outside its declared source root. */
function resolveSource(repo, path) {
  const root = roots[repo];
  if (!root) fail(`unknown source repo "${repo}" — add it to content.config.json sources`);
  const full = resolve(root, path);
  if (!full.startsWith(root + "/")) {
    fail(`refusing to read "${path}" — it resolves outside the declared root for "${repo}"`);
  }
  return full;
}

const missingRoots = Object.entries(roots).filter(([, dir]) => !existsSync(dir));
if (missingRoots.length) {
  fail(
    `source repositories not found:\n` +
      missingRoots.map(([n, d]) => `           ${n} -> ${d}`).join("\n") +
      `\n\n         The sync step needs the sibling repositories checked out next to this one.` +
      `\n         A plain "npm run build" does not: it uses the vendored copies in site/imported/.`,
  );
}

if (!checkOnly) mkdirSync(IMPORTED_DIR, { recursive: true });

const written = new Set();
const stale = [];
const today = new Date().toISOString().slice(0, 10);

for (const page of imported) {
  const source = resolveSource(page.repo, page.path);
  if (!existsSync(source)) fail(`allowlisted document is missing: ${page.repo}/${page.path}`);

  const body = readFileSync(source, "utf8");
  const name = importedFileName(page.repo, page.path);
  written.add(name);

  const target = join(IMPORTED_DIR, name);
  const header = serializeFrontMatter({
    source_repo: page.repo,
    source_path: page.path,
    title: page.title,
    url: page.url,
    section: page.section,
    synced: today,
  });

  // Compare bodies only. A differing `synced:` date is not a staleness signal.
  if (existsSync(target)) {
    const previous = readFileSync(target, "utf8");
    const previousBody = previous.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
    if (previousBody === body) continue;
  }

  if (checkOnly) {
    stale.push(`${page.repo}/${page.path}`);
    continue;
  }
  writeFileSync(target, header + body);
  process.stdout.write(`  synced  ${page.repo}/${page.path}\n`);
}

// Vendored files with no remaining allowlist entry are removed, so dropping a page from the
// allowlist actually unpublishes it instead of leaving an orphan behind.
if (existsSync(IMPORTED_DIR)) {
  for (const name of readdirSync(IMPORTED_DIR)) {
    if (name.startsWith(".") || written.has(name)) continue;
    if (checkOnly) {
      stale.push(`${name} (no longer allowlisted)`);
      continue;
    }
    rmSync(join(IMPORTED_DIR, name));
    process.stdout.write(`  removed ${name} — no longer in the allowlist\n`);
  }
}

if (checkOnly && stale.length) {
  fail(
    `site/imported/ is out of date with the source repositories:\n` +
      stale.map((s) => `           ${s}`).join("\n") +
      `\n\n         Run "npm run sync" in site/ and commit the result.`,
  );
}

process.stdout.write(
  checkOnly
    ? `  vendored copies are up to date (${imported.length} documents)\n`
    : `\n  ${imported.length} allowlisted documents vendored into site/imported/\n`,
);
