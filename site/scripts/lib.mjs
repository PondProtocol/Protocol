import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const SITE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const CONTENT_DIR = join(SITE_ROOT, "content");
export const IMPORTED_DIR = join(SITE_ROOT, "imported");
export const PUBLIC_DIR = join(SITE_ROOT, "public");
export const DIST_DIR = join(SITE_ROOT, "dist");

/** The one path that anchors the token's on-ledger identity. XLS-26 fixes it exactly. */
export const WELL_KNOWN_PATH = ".well-known/xrp-ledger.toml";

export function loadConfig() {
  const cfg = JSON.parse(readFileSync(join(SITE_ROOT, "content.config.json"), "utf8"));
  const pages = [];
  for (const group of cfg.nav) {
    for (const page of group.pages) {
      pages.push({ ...page, section: group.section, publish: page.publish !== false });
    }
  }
  return { ...cfg, pages };
}

/** Imported documents keep their vendored copy at a path derived from repo + source path. */
export function importedFileName(repo, path) {
  return `${repo}__${path.replace(/\//g, "_")}`;
}

/**
 * Hash of a document body, used to detect both upstream drift and hand-edited vendored copies.
 *
 * Line endings are normalised so a checkout with different autocrlf settings does not read as
 * drift, and trailing whitespace at end of file is ignored for the same reason.
 */
export function bodyHash(text) {
  return createHash("sha256").update(text.replace(/\r\n/g, "\n").replace(/\s*$/, "\n")).digest("hex");
}

/**
 * Resolve the `sources` map into { dir, ref, pinnedReason } per repository.
 *
 * Accepts the legacy shorthand of a bare path string so an older config keeps working, defaulting
 * such an entry to the working tree.
 */
export function sourceRoots(config, siteRoot) {
  const roots = {};
  for (const [name, value] of Object.entries(config.sources)) {
    if (name.startsWith("$")) continue;
    const entry = typeof value === "string" ? { path: value, ref: "worktree" } : value;
    roots[name] = {
      dir: resolve(siteRoot, entry.path),
      ref: entry.ref ?? "worktree",
      pinnedReason: entry.pinnedReason,
    };
  }
  return roots;
}

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/**
 * Minimal front-matter reader. Only flat `key: value` pairs are supported, which is all the
 * vendored provenance blocks use; anything richer would be a reason to reconsider this build.
 */
export function parseFrontMatter(text) {
  const match = FRONT_MATTER.exec(text);
  if (!match) return { data: {}, body: text };
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const at = line.indexOf(":");
    if (at === -1) continue;
    data[line.slice(0, at).trim()] = line
      .slice(at + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
  return { data, body: text.slice(match[0].length) };
}

export function serializeFrontMatter(data) {
  const body = Object.entries(data)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  return `---\n${body}\n---\n`;
}

export function fail(message) {
  process.stderr.write(`\n  ERROR  ${message}\n\n`);
  process.exit(1);
}
