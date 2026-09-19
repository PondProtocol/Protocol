# Pond Protocol documentation site

Static site that aggregates the documentation from `protocol`, `pnd` and `rpnd`, and serves the
XLS-26 metadata file at `/.well-known/xrp-ledger.toml`.

The **website host** is `pond.greenhead.io` (Replit Autoscale, custom domain). As of 2026-09-16
the issuer's on-ledger `Domain` is that same host. Live flags belong on `/wallets/`, not in
`xrp-ledger.toml` comments. See [`docs/hosting-decision.md`](../docs/hosting-decision.md) for
the CORS evidence and the Replit Git Pull / Push / Sync and Republish clicks.

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
| `npm run serve` | Preview `dist/` locally, and the same process Replit Autoscale runs in production. |
| `npm run verify:live -- <domain>` | Fetch a **deployed** site and check the identity anchor's status, CORS header, content type and body. |

## Xaman (owner keys)

Official Xaman / Xumm **payload SignIn** lives in `serve.mjs` and is offered
from Trade's **Connect wallet** control (WalletConnect or Xaman). The frontend
never receives the API secret. There is no airdrop claim, no DEX trade, and no
seed field. The top bar is Start here · $PND · $rPND · Protocol, then docs
search, then a Trade button to `/trade/`. Start here is the seven-step
onboarding path (Begin through Ready to Use DEX). Clicking Start here opens
`/start/`.

Set these on the **Replit Autoscale** app (Secrets / env), then Publish. Do not
put them in the repo, in `site/dist`, or in browser JavaScript.

| Variable | Where | What |
| --- | --- | --- |
| `XUMM_API_KEY` | Autoscale env only | Xaman app API key |
| `XUMM_API_SECRET` | Autoscale env only | Xaman app API secret |
| `POND_PROFILE_STORE` | Autoscale env optional | Absolute path to the profile JSON file. Defaults to `site/data/profiles.json`. |

After official Xaman SignIn, `POST /api/session` assigns a handle and
writes it to that JSON file. `tadpole01` is reserved for the owner
classic address. Later accounts get sequential numbers with a leading 0:
`tadpole02`, `tadpole03`, … `tadpole010`. Account pages are **not
public**: they require that Xaman session and expire after 24 hours of
no activity. WalletConnect still connects for `/trade/` and does not
open a profile. The file stores handle, XRPL address, display name, bio,
Start Here progress, trade-disclaimer acceptance, and a small profile
icon — never a seed. The signed-in top bar is that icon only; hover
shows the display name or handle, never the classic address. Sign out
is on the profile page. The profile also reads public XRPL balances for
$PND, $rPND, $XRP, and $RLUSD, $PND / $rPND trust-line status, an honest
Start Here checklist, session method + 24h idle expiry, membership NFT
empty until a mint exists, and airdrop snapshot later as a hold amount
(not an APY). An optional public card at `/card/<handle>/` is handle +
avatar only. Autoscale disk can be ephemeral;
this process does not talk to `database.greenhead.io`.

Create the app at [apps.xumm.dev](https://apps.xumm.dev). This repository does
**not** already have keys. Until both variables are set, `GET /health` reports
`xaman.connect: "unavailable"` and Trade's Xaman menu option is disabled and
short (*Xaman · keys unset*) instead of a page-wide banner. `/connect/` still
works if you have the URL; it is not in the top bar.

Useful routes after Publish:

```bash
curl -sS https://pond.greenhead.io/health
# POST /api/xaman/signin     → SignIn payload (QR + xumm.app/sign deep link)
# GET  /api/xaman/payload/:uuid
# POST /api/xaman/trustset   → optional TrustSet; $PND is not issued
# POST /api/xaman/ammcreate  → Testnet AMMCreate via official Xaman; submit:false
# GET  /api/card/:handle     → optional public card (handle + avatar only)
```

Stay on Autoscale. Replit Static cannot run these routes or `.well-known`.

## Why this is not a framework

The site is about 700 lines of Node in `scripts/` plus one hand-written stylesheet, and it has
**two direct dependencies** (`markdown-it`, `markdown-it-anchor`) totalling nine packages including
transitive ones. That is a deliberate trade, and these are the reasons:

**The output has to be host-neutral.** Plain HTML and CSS with no runtime JavaScript deploys
identically to Replit Autoscale (`serve.mjs`), Replit Static (fallback), Cloudflare Pages, GitHub
Pages, or anything else that serves a directory, so the hosting decision stays reversible instead
of being welded into a framework adapter. The chosen host is Replit Autoscale at
`pond.greenhead.io`.

**One path has to be byte-exact.** `/.well-known/xrp-ledger.toml` is served from the website host.
The issuer's on-ledger `Domain` field now points at that host. A dot-prefixed directory is
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
monospace. A small `public/nav.js` remembers whether the right-hand docs menu is open. If search
or versioned docs become necessary, port `content/` and `imported/` to Astro Starlight or
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

- **Replit does not run these checks.** It builds from a push (or from Publish). Require the
  `staleness` and `build` checks in branch protection on `main`, or a direct push can publish a
  stale snapshot.
- **Layer 2 needs a cross-repo token.** `pnd` and `rpnd` are private, and the default
  `GITHUB_TOKEN` cannot read them. The job fails loudly with setup instructions when
  `SIBLING_REPOS_TOKEN` is absent, rather than skipping — a freshness check that quietly does
  nothing is worse than none, because it reports success while the site publishes corrected-away
  text.

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
  content/              authored pages (index, verify, wallets, xrp-ledger.toml explainer)
  imported/             vendored copies of allowlisted repo docs. Generated; commit them.
  public/               copied verbatim into dist/
    .well-known/
      xrp-ledger.toml   the identity anchor. Exact path, do not move.
    _headers            Cloudflare Pages response headers. Replit ignores this; see `.replit`.
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

## Replit settings

The repo-root [`.replit`](../.replit) is the config Replit reads on import and on Publish.

**Git + Publish** — same buttons as the other Greenhead Replit apps (`greenhead.io` already serves
`/.well-known/xrp-ledger.toml` this way):

1. **Tools → Git** → **Pull** or **Sync** (turn auto-sync on if the other apps use it).
2. Top right **Publish** / Republish. Do **not** change Deployment type, build, or run in Adjust
   settings — those UI edits rewrite `.replit` locally and are what made Pull start a rebase.
3. After it goes live: `cd site && npm run verify:live -- pond.greenhead.io`.
4. **Do not blackhole** the issuer. `Domain` is already `pond.greenhead.io`. $rPND is not created.

**One-time catch-up** if this clone is still diverged from the earlier rebase: Git pane → **Abort
rebase** if a rebase is in progress → **Pull**. If Pull still says local and GitHub have diverged
because of Replit-only commits, Git pane menu → reset this branch to `origin/main` **once**. Then
Pull / Sync are the update path. Do not click Recover original configuration files.

`.replit` runs `git config pull.rebase false` on boot so later Pulls merge instead of rebasing.

**Run command** (editor preview; Autoscale publish uses the shorter `deployment.run`):

```bash
cd site && (test -d node_modules || npm ci) && npm run check && npm run serve
```

That is `npm ci && npm run check` followed by `site/scripts/serve.mjs`, which binds `0.0.0.0` and
honours `PORT`. `npm run check` is `build --strict` plus the publication guard — do not substitute
`npm run build`; that skips the guard.

**Publish as Autoscale** (not Static). Replit Static omits every dotfile: on 2026-09-16
`/.well-known/xrp-ledger.toml` and `/.nojekyll` 404'd while `/_headers` and `/robots.txt` 200'd.
`serve.mjs` is what actually serves the XLS-26 path. These values are already in `.replit`; paste
them only if Publishing was reset and this is the first Autoscale publish:

| Setting | Value |
| --- | --- |
| Deployment type | **Autoscale** (not Static) |
| Build command | `cd site && npm ci && npm run check` |
| Run command | `cd site && node scripts/serve.mjs` |
| Public directory | `site/dist` (used only if you stay on Static) |

The build also writes a non-dot twin at `site/dist/well-known/xrp-ledger.toml` and `.replit`
rewrites `/.well-known/xrp-ledger.toml` onto it, so a Static republish can still work. Prefer
Autoscale. CORS on Autoscale comes from `serve.mjs` (`Access-Control-Allow-Origin: *`,
`Content-Type: text/plain` on `.toml`). After republish:

```bash
cd site && npm run verify:live -- pond.greenhead.io
```

**Do not blackhole** the issuer. `Domain` is already `pond.greenhead.io`; $rPND does not exist yet.

Replit recovery mode ("Nix environment is broken") happens when `.replit` is present without
`replit.nix`. Both files are in the repo root. Do **not** click Recover original configuration
files. If Nix is stuck after a Pull, type `exit` in Shell or Command Palette → Restart compute.

### Import and custom domain (owner clicks)

Only for a new import. The live app `@GreenheadLabs/PondGreenheadio` already exists.

1. Open [replit.com/import](https://replit.com/import) → **GitHub** → connect the GitHub account →
   choose **PondProtocol/Protocol** → **Import**. Public-repo shortcut:
   `https://replit.com/github.com/PondProtocol/Protocol`. If the org does not appear, grant the
   Replit OAuth app access to PondProtocol at GitHub **Settings → Applications**.
2. Press **Run** once and confirm `/.well-known/xrp-ledger.toml` returns 200 locally.
3. **Publish** (top right, or **Replit Cloud → Publishing**). Adjust settings as in the table
   above **once**, then publish. Later updates are Git Pull / Sync then Publish. The Domains tab
   is available only after a successful deployment.
4. **Publishing → Domains → Connect your own domain** → enter `pond.greenhead.io`. Prefer the
   guided DNS setup; otherwise copy the `A` and `replit-verify=...` `TXT` records Replit shows
   into the `greenhead.io` DNS. Keep the TXT record permanently (certificate renewal). If that
   DNS is on Cloudflare, the `A` record must be **DNS only** (grey cloud), not proxied. Remove
   any extra `A` or `AAAA` on the same hostname.
5. Wait for **Verified**, then run `npm run verify:live -- pond.greenhead.io`.
6. **Do not blackhole.** Issuer `Domain` is already `pond.greenhead.io`. CORS was verified live.
   Do not treat Publish as a reason to disable the master key.

`pond.greenhead.io` previously served a Greenhead agent database, now at `database.greenhead.io`.
Pointing `pond` at this Replit app is intended, but confirm leftover Greenhead records are gone
before publishing DNS.

## Before going live

In order.

1. **Git pane → Pull / Sync, then Publish** on the existing Replit app. Stay on Autoscale.
   Static drops `.well-known/`.
2. **Confirm `site.domain`** in `content.config.json` is `pond.greenhead.io` (already set).
3. **Remaining TODOs in `public/.well-known/xrp-ledger.toml`:** a real square icon on a permanent
   host, and whether to include `[[PRINCIPALS]]`. The website host is filled in. Do not invent a
   contact or social link.
4. **After deploy, check the live headers:** `npm run verify:live -- pond.greenhead.io`. A
   missing CORS header is invisible in a browser and breaks every wallet that resolves metadata
   client-side.
5. **Do not blackhole.** Issuer `Domain` is `pond.greenhead.io`. Binding can only change while
   the issuer can still sign, and $rPND is not created yet.
6. **Leave `launchStatus` at `pre-launch`** until $PND has actually been issued. That flag
   controls the "$PND has not launched" warning, and it is the one edit on this site that
   could mislead a buyer. Live flags are on `/wallets/`.
