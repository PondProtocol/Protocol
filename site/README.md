# Pond Protocol documentation site

Static site that aggregates the documentation from `protocol`, `pnd` and `rpnd`, and serves the
XLS-26 metadata file at `/.well-known/xrp-ledger.toml`.

The **website host** is `pondprotocol.pages.dev` (Cloudflare Pages, free). The issuer's on-ledger
`Domain` field is unset and stays unset until CORS is verified on the live TOML path. See
[`docs/hosting-decision.md`](../docs/hosting-decision.md) for the CORS evidence, the Cloudflare
Pages settings to paste, and why `pages.dev` is a platform hostname rather than a domain you hold.

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
| `npm run sync -- --check` | Fail if any vendored copy no longer matches its source. Run by CI. |
| `npm run sync -- --print-refs` | Print `repo<TAB>dir<TAB>ref` for each source. Used by CI to fetch the declared refs. |
| `npm run build` | Render `content/` + `imported/` into `dist/`. No network, no sibling repos needed. |
| `npm run check` | `build --strict` plus the publication guard. This is what CI runs. |
| `npm run serve` | Preview `dist/` locally with the same headers `_headers` asks the host for. |
| `npm run verify:live -- <domain>` | Fetch a **deployed** site and check the identity anchor's status, CORS header, content type and body. |

## Why this is not a framework

The site is about 700 lines of Node in `scripts/` plus one hand-written stylesheet, and it has
**two direct dependencies** (`markdown-it`, `markdown-it-anchor`) totalling nine packages including
transitive ones. That is a deliberate trade, and these are the reasons:

**The output has to be host-neutral.** Plain HTML and CSS with no runtime JavaScript deploys
identically to Cloudflare Pages, GitHub Pages, or anything else that serves a directory, so the
hosting decision stays reversible instead of being welded into a framework adapter. The chosen host
is Cloudflare Pages at `pondprotocol.pages.dev`.

**One path has to be byte-exact.** `/.well-known/xrp-ledger.toml` is served from the website host.
The issuer's on-ledger `Domain` field does **not** point at it yet. A dot-prefixed directory is
exactly the thing static site generators quietly drop. Two real instances of that, both verified
rather than assumed:

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

## Keeping the vendored copies honest

Vendoring documentation into `imported/` buys a hermetic build and a reviewable publication diff.
It also creates a real hazard, and it has already bitten once: the first revision of this site
vendored `protocol/docs/spec/01-tokens.md` while a parallel pull request was correcting it, and
would have published *"Default Ripple | Enabled on the issuer"* to a public site. The live issuer
has `Flags` of 0. That statement tells readers holders can pay each other in $PND, which is false.

A silent snapshot of documentation that is being actively corrected generates defects, so staleness
is checked in two layers, split by what each one can actually see.

**Layer 1 — snapshot integrity. Runs in every build, including on the deploy host.** Every vendored
file records a `source_sha256` of the body it was synced from. `build.mjs` and `guard.mjs` both
recompute it and fail on mismatch. This needs no access to the sibling repositories, so it holds
everywhere, and it catches somebody editing a file in `imported/` by hand — which would silently
make the site and the source repository disagree about what is true.

**Layer 2 — freshness against upstream. Runs in CI and on a daily schedule.**
`npm run sync -- --check` recomputes each hash from the *source* at the ref declared in
`content.config.json` and fails on any difference. It needs all three repositories checked out, so
it lives in a dedicated `staleness` job in
[`.github/workflows/docs-site.yml`](../.github/workflows/docs-site.yml). The `deploy` job depends on
it. It also runs on a schedule, because a documentation change in `pnd` or `rpnd` cannot trigger a
workflow in this repository — without the schedule, a correction landing next door would go
unnoticed until somebody happened to touch `site/`.

### Why not just build from the repos directly?

It was the other option and it was rejected for one reason: **the deploy host clones exactly one
repository.** Making the render build fetch two additional *private* repositories would mean putting
a cross-repository token into the hosting provider, and it would make the published site depend on
three repositories being reachable at deploy time. For a site whose entire job is to keep
`/.well-known/xrp-ledger.toml` online, trading one dependency for three is the wrong direction.

So the split is deliberate: the deploy build stays hermetic, and freshness is enforced in CI, which
is where the defect actually enters — at merge time. Two consequences worth knowing:

- **Cloudflare Pages does not run these checks.** It builds from a push. Require the `staleness` and
  `build` checks in branch protection on `main`, or a direct push can publish a stale snapshot.
- **Layer 2 clones `pnd` and `rpnd`.** Those repositories are public, so CI uses the default
  `GITHUB_TOKEN`. `SIBLING_REPOS_TOKEN` is optional — set it only if the siblings go private again
  or the default token is not enough. The job must not skip when the secret is absent.

### Pinned sources

`content.config.json` records a `ref` per repository, and `pinnedReason` is mandatory when that ref
is not `main` or `worktree`. A pin means this site renders documentation from an **unmerged branch**.
That is sometimes correct — it is correct right now, because `pnd/main` still carries the false
Default Ripple claim and vendoring from it would republish it — but it must never be quiet. So:

- Every build prints each pin and its reason.
- `guard.mjs` fails if a pin has no reason.
- Pages from a pinned source say so in the provenance line at the bottom: *"from unmerged branch
  `origin/cursor/...`"*.
- `sync -- --check` fails once the pinned branch changes, which is the reminder to unpin.

**Unpin `pnd` to `main` as soon as its correction PR merges.**

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

## Cloudflare Pages settings

Create a **Pages** project, not a Worker. In the dashboard: **Workers & Pages → Create → Pages →
Connect to Git**. If the form has a **Deploy command** field, you are in the Worker flow — cancel
and start again from Pages.

Paste these. The public URL is `https://pondprotocol.pages.dev` only if the **project name** is
exactly `pondprotocol`.

| Dashboard field | Paste this | Do not use |
| --- | --- | --- |
| Product | **Pages** (Connect to Git) | Worker / `npx wrangler deploy` |
| Project name | `pondprotocol` | `pond` — that URL is `pond.pages.dev` |
| Production branch | `main` | |
| Framework preset | None (leave blank) | |
| Root directory | `site` | `/` |
| Build command | `npm ci && npm run check` | empty / None |
| Build output directory | `dist` | |
| **Deploy command** | **empty** — do not fill this in | `npx wrangler deploy` |

`dist` is relative to the root directory, so the uploaded files are `site/dist`. Set
`NODE_VERSION=22` if the dashboard asks (matches
[`.github/workflows/docs-site.yml`](../.github/workflows/docs-site.yml)).

A project already named `pond` cannot be renamed onto `pondprotocol.pages.dev`. Cloudflare's
known issue: `*.pages.dev` subdomains cannot be changed. Delete `pond` and create a new Pages
project named `pondprotocol`.

`npm run check` is `build --strict` plus the publication guard — the same command CI runs. Do not
substitute `npm run build`; that skips the guard. This site is static HTML. There is no Worker
and no Wrangler config; `npx wrangler deploy` fails with "Could not detect a directory containing
static files" because it is the wrong product.

`site/public/_headers` is copied into the output and is what sets
`Access-Control-Allow-Origin: *` and `Content-Type: text/plain` on `/.well-known/xrp-ledger.toml`.
Cloudflare Pages does not send CORS by default. After the first production deploy:

```bash
cd site && npm run verify:live -- pondprotocol.pages.dev
```

## Before going live

In order.

1. **Create a Cloudflare Pages project** named `pondprotocol` with the settings above. If a Worker
   project named `pond` already exists, delete it — it cannot be renamed onto this URL.
2. **Confirm `site.domain`** in `content.config.json` is `pondprotocol.pages.dev` (already set).
3. **Remaining TODOs in `public/.well-known/xrp-ledger.toml`:** a real square icon on a permanent
   host, and whether to include `[[PRINCIPALS]]`. The website host is filled in. Do not invent a
   contact or social link.
4. **After deploy, check the live headers:** `npm run verify:live -- pondprotocol.pages.dev`. A
   missing CORS header is invisible in a browser and breaks every wallet that resolves metadata
   client-side.
5. **Leave the issuer `Domain` field unset.** CORS has not been verified live yet. This host is a
   Cloudflare platform hostname; binding `Domain` to it later accepts a platform dependency that
   can only be changed while the issuer can still sign.
6. **Leave `launchStatus` at `pre-launch`** until the issuer is configured and $PND has actually
   been issued. That flag controls the "$PND has not launched" warning, and it is the one edit on
   this site that could mislead a buyer.
