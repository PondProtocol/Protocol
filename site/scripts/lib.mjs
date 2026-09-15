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
