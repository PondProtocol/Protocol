#!/usr/bin/env node
/**
 * Vendor allowlisted repository documents into site/imported/.
 *
 * The render build never reads the sibling repositories, so a deploy is reproducible from this
 * repository alone and the set of documents that would go public is visible as a diff in the pull
 * request rather than resolved at deploy time.
 *
 * The cost of that choice is staleness, which is a real defect generator: documentation that is
 * being actively corrected in a parallel pull request will silently keep its old text here. Two
 * checks exist for it, and they are deliberately split by what they can see:
 *
 *   Layer 1, no sibling repositories needed, runs in EVERY build including on the deploy host.
 *     Each vendored file records a source_sha256. build.mjs and guard.mjs recompute it from the
 *     vendored body and fail on mismatch. Catches hand-editing a vendored snapshot.
 *
 *   Layer 2, needs the sibling repositories, runs in CI and on a schedule.
 *     `sync --check` recomputes the hash from the SOURCE at the declared ref and fails on
 *     mismatch. Catches upstream drift, which is the failure this comment exists for.
 *
 *   node scripts/sync.mjs           refresh the vendored copies
 *   node scripts/sync.mjs --check   fail if any vendored copy no longer matches its source
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  IMPORTED_DIR,
  SITE_ROOT,
  bodyHash,
  fail,
  importedFileName,
  loadConfig,
  parseFrontMatter,
  serializeFrontMatter,
  sourceRoots,
} from "./lib.mjs";

const checkOnly = process.argv.includes("--check");
const config = loadConfig();
const imported = config.pages.filter((p) => p.repo);
const roots = sourceRoots(config, SITE_ROOT);

/**
 * `--print-refs` emits one `repo<TAB>dir<TAB>ref` line per source.
 *
 * CI uses it to fetch exactly the refs this config declares. Without it the workflow would have to
 * hardcode branch names, which is the same duplication that lets a pin be forgotten.
 */
if (process.argv.includes("--print-refs")) {
  for (const [name, r] of Object.entries(roots)) {
    process.stdout.write(`${name}\t${r.dir}\t${r.ref}\n`);
  }
  process.exit(0);
}

/** Reject anything that resolves outside its declared source root. */
function assertInRoot(repo, path) {
  const root = roots[repo].dir;
  const full = resolve(root, path);
  if (!full.startsWith(root + "/")) {
    fail(`refusing to read "${path}" — it resolves outside the declared root for "${repo}"`);
  }
  return full;
}

/**
 * Read a source document at the ref declared in content.config.json.
 *
 * A git ref rather than the working tree is what makes a vendored copy reproducible: it records
 * the exact version that was vendored instead of depending on which branch happened to be checked
 * out when somebody ran sync.
 */
function readSource(repo, path) {
  const { dir, ref } = roots[repo];
  const full = assertInRoot(repo, path);

  if (ref === "worktree") {
    if (!existsSync(full)) fail(`allowlisted document is missing: ${repo}/${path}`);
    return readFileSync(full, "utf8");
  }
  try {
    return execFileSync("git", ["-C", dir, "show", `${ref}:${path}`], {
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch (error) {
    fail(
      `could not read ${repo}/${path} at ref "${ref}"\n` +
        `         ${String(error.message).split("\n")[0]}\n\n` +
        `         If the ref is a remote branch, fetch it first:\n` +
        `           git -C ${dir} fetch origin ${ref.replace(/^origin\//, "")}`,
    );
  }
}

const missingRoots = Object.entries(roots).filter(([, r]) => !existsSync(r.dir));
if (missingRoots.length) {
  fail(
    `source repositories not found:\n` +
      missingRoots.map(([n, r]) => `           ${n} -> ${r.dir}`).join("\n") +
      `\n\n         The sync step needs the sibling repositories checked out next to this one.` +
      `\n         A plain "npm run build" does not: it uses the vendored copies in site/imported/.`,
  );
}

if (!checkOnly) mkdirSync(IMPORTED_DIR, { recursive: true });

const written = new Set();
const drift = [];
const today = new Date().toISOString().slice(0, 10);

for (const page of imported) {
  const source = readSource(page.repo, page.path);
  const hash = bodyHash(source);
  const name = importedFileName(page.repo, page.path);
  written.add(name);
  const target = join(IMPORTED_DIR, name);

  if (existsSync(target)) {
    const { data, body } = parseFrontMatter(readFileSync(target, "utf8"));
    // The recorded hash is the comparison, not the byte-compare: it also detects a vendored file
    // that was hand-edited after being synced, which a source-to-vendored diff would blame on the
    // source.
    if (data.source_sha256 === hash && bodyHash(body) === hash) continue;

    if (checkOnly) {
      drift.push({
        doc: `${page.repo}/${page.path}`,
        reason:
          data.source_sha256 !== hash
            ? `source changed at ref "${roots[page.repo].ref}" (vendored ${String(
                data.source_sha256,
              ).slice(0, 12)}, source ${hash.slice(0, 12)})`
            : `vendored copy was edited by hand (recorded ${String(data.source_sha256).slice(
                0,
                12,
              )}, actual ${bodyHash(body).slice(0, 12)})`,
      });
      continue;
    }
  } else if (checkOnly) {
    drift.push({ doc: `${page.repo}/${page.path}`, reason: "no vendored copy exists" });
    continue;
  }

  writeFileSync(
    target,
    serializeFrontMatter({
      source_repo: page.repo,
      source_path: page.path,
      source_ref: roots[page.repo].ref,
      source_sha256: hash,
      title: page.title,
      url: page.url,
      section: page.section,
      synced: today,
    }) + source,
  );
  process.stdout.write(`  synced  ${page.repo}/${page.path}\n`);
}

// Vendored files with no remaining allowlist entry are removed, so dropping a page from the
// allowlist actually unpublishes it instead of leaving an orphan behind.
if (existsSync(IMPORTED_DIR)) {
  for (const name of readdirSync(IMPORTED_DIR)) {
    if (name.startsWith(".") || written.has(name)) continue;
    if (checkOnly) {
      drift.push({ doc: name, reason: "vendored but no longer allowlisted" });
      continue;
    }
    rmSync(join(IMPORTED_DIR, name));
    process.stdout.write(`  removed ${name} — no longer in the allowlist\n`);
  }
}

/* ------------------------------------------------------------------ report */

const pins = Object.entries(roots).filter(([, r]) => r.ref !== "main" && r.ref !== "worktree");
if (pins.length) {
  process.stdout.write(
    `\n  ${pins.length} source(s) pinned to an unmerged ref:\n` +
      pins.map(([n, r]) => `    ${n} -> ${r.ref}\n`).join(""),
  );
}

if (checkOnly && drift.length) {
  fail(
    `${drift.length} vendored copy/copies no longer match their source:\n\n` +
      drift.map((d) => `           ${d.doc}\n             ${d.reason}\n`).join("") +
      `\n         This site publishes these documents. A stale copy means the public site states\n` +
      `         something the source repository has already corrected.\n\n` +
      `         Fix: run "npm run sync" in site/ and commit the result.`,
  );
}

process.stdout.write(
  checkOnly
    ? `\n  ${imported.length} vendored copies match their sources\n\n`
    : `\n  ${imported.length} allowlisted documents vendored into site/imported/\n\n`,
);
