# Pond Protocol documentation site

Static site that aggregates the documentation from `protocol`, `pnd` and `rpnd`, and serves the
XLS-26 metadata file at `/.well-known/xrp-ledger.toml`.

**Nothing here is deployed yet.** The domain has not been chosen and the host has not been picked.
See [`docs/hosting-decision.md`](../docs/hosting-decision.md) for the recommendation, the verified
evidence behind it, and what the owner has to decide.

## Quick start

```bash
cd site
npm install
npm run sync      # vendor the allowlisted repo docs (needs the sibling repos checked out)
npm run build     # render into site/dist
npm run serve     # preview at http://localhost:8080
```

Then confirm the one path that matters:

```bash
curl -sS -I -H 'Origin: https://xrplmeta.org' \
  http://localhost:8080/.well-known/xrp-ledger.toml
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run sync` | Copy allowlisted documents from the sibling repos into `imported/`. Needs `../../pnd` and `../../rpnd`. |
| `npm run sync -- --check` | Fail if `imported/` has drifted from the source repos. |
| `npm run build` | Render `content/` + `imported/` into `dist/`. No network, no sibling repos needed. |
| `npm run check` | `build --strict` plus the publication guard. This is what CI runs. |
| `npm run serve` | Preview `dist/` locally with the same headers `_headers` asks the host for. |
| `npm run verify:live -- <domain>` | Fetch a **deployed** site and check the identity anchor's status, CORS header, content type and body. |

## Why this is not a framework

The site is about 700 lines of Node in `scripts/` plus one hand-written stylesheet, and it has
**two direct dependencies** (`markdown-it`, `markdown-it-anchor`) totalling nine packages including
transitive ones. That is a deliberate trade, and these are the reasons:

**The output has to be host-neutral.** The host is not decided. Plain HTML and CSS with no runtime
JavaScript deploys identically to Cloudflare Pages, GitHub Pages, or anything else that serves a
directory, so the hosting decision stays reversible instead of being welded into a framework
adapter.

**One path has to be byte-exact.** `/.well-known/xrp-ledger.toml` is where the issuer's on-ledger
`Domain` field points, and a dot-prefixed directory is exactly the thing static site generators
quietly drop. Two real instances of that, both verified rather than assumed:

- Jekyll 4.4.1 excludes dot-directories from its output with a zero exit code and no warning. A
  tree containing `.well-known/xrp-ledger.toml` produced a `_site` with no `.well-known` in it.
- `actions/upload-pages-artifact` defaults `include-hidden-files` to `false`, and when false it
  archives with `tar --exclude=.[^/]*`, which strips `.well-known/` from the artifact. The workflow
  reports success and the file 404s in production.

This build uses `cpSync`, which copies dot-directories, and then **refuses to emit output at all**
if the file is not at the expected path. `scripts/guard.mjs` asserts it again independently.

**Publication has to be reviewable.** Two documents in the project are internal analysis and must
not be published. Rather than relying on remembering that, the build cannot discover documents: it
reads an explicit allowlist and nothing else. See below.

**Low maintenance means few dependencies.** A documentation site for a token whose metadata must
stay online indefinitely should not need a dependency upgrade every quarter to keep building. Nine
packages and no framework is the version of "low maintenance" that survives being ignored for a
year.

The honest cost: no search, no versioned docs, no live reload, and syntax highlighting is plain
monospace. If any of those become necessary, port `content/` and `imported/` to Astro Starlight or
MkDocs Material — the markdown is standard and the `public/` directory carries over unchanged.

## How publication is controlled

`content.config.json` is the only thing that decides what reaches the public site. The build never
walks a directory looking for documents. It reads that file's `nav` array and nothing else.

Three consequences:

1. **Publishing a page is always a diff.** Adding something to the site means editing the
   allowlist, which shows up in code review.
2. **Documents outside the three repositories cannot be reached.** The `sources` map declares the
   filesystem roots the sync step may read, and any path resolving outside them is rejected.
   Internal analysis held elsewhere has no route onto the site.
3. **Removing a page unpublishes it.** `npm run sync` deletes vendored copies that no longer have
   an allowlist entry, so a removed page cannot linger as an orphan in `imported/`.

`scripts/guard.mjs` is an independent second check, aimed at the one thing the allowlist cannot
catch — somebody pasting internal material into an authored page in `content/`. It fails the build
if any forbidden marker appears anywhere in the output, if a page was built that is not
allowlisted, if an excluded document was vendored, if any navigable link points at a placeholder
domain, or if the pre-launch notices are missing while `launchStatus` is not `live`.

Documents deliberately kept off the site are listed under `excluded`, each with a reason. Links
pointing at them are unlinked automatically — the text survives, the anchor is removed, so no
reader is sent to a page that does not exist. Links pointing at anything that is in **neither**
list fail `--strict`, which forces an explicit decision rather than a silent omission.

## Layout

```
site/
  content.config.json   allowlist, navigation, site constants. The control surface.
  content/              authored pages (index, verify, xrp-ledger.toml explainer)
  imported/             vendored copies of allowlisted repo docs. Generated; commit them.
  public/               copied verbatim into dist/
    .well-known/
      xrp-ledger.toml   the identity anchor. Exact path, do not move.
    _headers            Cloudflare Pages response headers. Ignored by GitHub Pages.
    .nojekyll           insurance against a future branch-based Pages deploy
    styles.css
  scripts/
    lib.mjs             shared paths and front-matter handling
    sync.mjs            vendor allowlisted docs from the sibling repos
    build.mjs           render to dist/
    guard.mjs           publication guard, run against dist/
    serve.mjs           local preview
    verify-live.mjs     check a deployed host's headers
  dist/                 build output. Gitignored.
```

## Before going live

In order. Each step depends on the previous one.

1. **Choose the domain** and register it for as long as the registrar allows. It must be one you
   will hold indefinitely — see the note in `content.config.json`.
2. **Set `site.domain`** in `content.config.json`. That switches on canonical tags and replaces the
   placeholder everywhere it appears.
3. **Fill in `public/.well-known/xrp-ledger.toml`.** Every outstanding item is marked `TODO`:
   the domain, the icon URL, and the decision about `[[PRINCIPALS]]`.
4. **Deploy, then check the live headers:** `npm run verify:live -- <domain>`. Do not skip this.
   A missing CORS header is invisible in a browser and breaks every wallet that resolves metadata
   client-side.
5. **Only then** submit `AccountSet` with `Domain` set to that host, hex-encoded from the
   **lowercase** ASCII. Doing this before step 4 publishes a pointer to a file that is not being
   served correctly, and the ecosystem caches what it finds.
6. **Set `launchStatus` to `live`** once the issuer is configured and $PND has actually been
   issued — and not before. That flag controls the "$PND has not launched" warning, and it is the
   one edit on this site that could mislead a buyer.
