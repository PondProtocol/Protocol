# Where to host the Pond Protocol site

**Status: decided.** The public docs site deploys to Replit at **`https://pond.greenhead.io`**.
That is the **website host**. The issuer's on-ledger `Domain` field is unset and stays unset until
CORS is verified on the live TOML path. Do not set `Domain` as part of attaching this host.

`pond.greenhead.io` is a subdomain of `greenhead.io`, a name the owner holds. Import / custom-domain
clicks are in [§7](#7-replit-settings-to-paste). A previous Cloudflare Pages plan at
`pondprotocol.pages.dev` is superseded.

Every header claim in this document was checked against a live host on **2026-09-15** by fetching
real responses. Every build claim was checked by running the build. Where I could not verify
something I say so and give the command that settles it. Third-party behaviour changes; re-check
before acting on anything here.

---

## 1. The recommendation

**Host the site on Replit, built from this repository, at `https://pond.greenhead.io`.** Publish
as **Autoscale** with build `cd site && npm ci && npm run check` and run
`cd site && node scripts/serve.mjs`. Do not publish as Static: Replit Static omits
`.well-known/` (verified 2026-09-16). The custom domain is already `pond.greenhead.io`.

The issuer's on-ledger `Domain` field stays **unset**. CORS on `/.well-known/xrp-ledger.toml` has
to be confirmed against the live host with `npm run verify:live -- pond.greenhead.io` before that
field would mean anything. This runbook does not include setting `Domain`.

`pond.greenhead.io` is a name the owner already holds. That is a better permanence story than
`*.pages.dev`, which Cloudflare controls. It is still not a reason to bind `Domain` today.

The CORS header is still the criterion that decides whether wallets can read the TOML. On Autoscale
it comes from `site/scripts/serve.mjs`. On a Static fallback it comes from
`[[deployment.responseHeaders]]` in [`.replit`](../.replit) after a rewrite onto a non-dot twin.
`site/public/_headers` is kept for a Cloudflare Pages fallback and is **not** what Replit reads.

### First, the framing

Cursor is the editor. It writes the site — it wrote the one in [`site/`](../site/) — but it does
not serve anything. Replit answers the HTTP request. Those are two independent choices; this
document is about the second one.

---

## 2. The criterion that actually decides this

XLS-26 requires the metadata file to be served over HTTPS with `Access-Control-Allow-Origin: *`.
That header is what lets a wallet running in a browser read the file. Without it, the fetch fails in
the browser's security layer — the file is present, the URL is right, `curl` looks fine, and the
wallets that resolve token metadata client-side get nothing.

It is the single most commonly assumed-and-wrong detail in this whole area, so I tested it rather
than recalling it.

### 2.1 GitHub Pages sends it. Always. Without configuration.

```
$ curl -sS -I -H 'Origin: https://example.com' https://pages.github.com/
HTTP/2 200
server: GitHub.com
content-type: text/html; charset=utf-8
access-control-allow-origin: *          <-- present

$ curl -sS -I -H 'Origin: https://example.com' https://pages.github.com/versions.json
HTTP/2 200
server: GitHub.com
content-type: application/json; charset=utf-8
access-control-allow-origin: *          <-- present on a static asset too
```

Present on HTML, present on a static JSON asset, and present even on 404 responses. There is no
setting for it because there is no way to configure headers on GitHub Pages at all. You get `*`
whether you want it or not.

### 2.2 Cloudflare Pages does **not** send it by default

This is the finding that inverts the naive expectation, so here is the evidence in both directions.

Cloudflare Pages sites with **no** `_headers` file send no CORS header:

```
$ curl -sS -I -H 'Origin: https://example.com' https://starlight.astro.build/
HTTP/2 200
content-type: text/html; charset=UTF-8
server: cloudflare
                                        <-- no access-control-allow-origin

$ curl -sS -I -H 'Origin: https://example.com' https://starlight.astro.build/pagefind/pagefind.js
HTTP/2 200
content-type: application/javascript; charset=UTF-8
server: cloudflare
                                        <-- still absent on a static asset
```

`hono.dev` and `astro.build` behave the same way. Meanwhile `developers.cloudflare.com`,
`vitepress.pages.dev` and `tauri.pages.dev` all **do** send `access-control-allow-origin: *`.

The difference is a file, and Cloudflare's own docs site proves it — its `public/_headers` is
public:

```
$ curl -sS https://raw.githubusercontent.com/cloudflare/cloudflare-docs/production/public/_headers
/*
	Access-Control-Allow-Origin: *
...
/.well-known/agent-skills/index.json
  Content-Type: application/json; charset=utf-8
/.well-known/mcp/server-card.json
  Content-Type: application/json; charset=utf-8
```

So on Cloudflare Pages the header is opt-in, and `site/public/_headers` in this repository is what
opts in.

### 2.3 The same evidence proves the two things I actually needed

That `_headers` file, plus its live responses, settles two separate questions at once:

**Cloudflare Pages serves dot-directories.** Cloudflare's own docs site publishes under
`.well-known/`, and the path resolves:

```
$ curl -sS -I -H 'Origin: https://example.com' \
    https://developers.cloudflare.com/.well-known/agent-skills/index.json
HTTP/2 200
content-type: application/json; charset=utf-8   <-- overridden by _headers
access-control-allow-origin: *
```

**`_headers` can set `Content-Type` on a path inside `.well-known/`.** That is exactly what this
project needs — XLS-26's usual choice is `text/plain` — and it is exactly what GitHub Pages cannot do.

### 2.4 A caveat that argues for verifying every deploy

On the same site, a *sibling* path returned 200 with **no** CORS header, twice, despite the `/*`
rule that should cover it:

```
$ curl -sS -I https://developers.cloudflare.com/.well-known/mcp/server-card.json
HTTP/2 200
content-type: application/json; charset=utf-8
server: cloudflare
                                        <-- no access-control-allow-origin
```

I did not establish the cause. Their file contains some malformed lines (rules written with a
trailing colon) and mixes tab and space indentation, and a plausible explanation is that a
malformed line affects how later rules are parsed. I am not going to assert that as fact.

The transferable lesson does not depend on the cause: **`_headers` can under-apply, and the deploy
still succeeds.** Header rules are not validated until you fetch a response. Never conclude from
reading the file that the header is being sent.

### 2.5 This goes wrong in production, on real XRPL issuers

Not hypothetical. Four live `xrp-ledger.toml` files, fetched today:

| Domain | Status | `Content-Type` | `Access-Control-Allow-Origin` |
| --- | --- | --- | --- |
| `ripple.com` | 200 | `application/toml` | `*` |
| `xrpl-labs.com` | 200 | `application/toml` | `*` |
| `xpmarket.com` | 200 | `text/toml` | **absent** |
| `gatehub.net` | 200 | `text/html` | **absent** |

Two get it right. Two do not, and both of those are real, active XRPL businesses. `xpmarket.com` is
the issuer whose account configuration this project's own token config was modelled on. Its TOML is
served, parseable, and unreadable from a browser.

That is the failure mode: silent, invisible in a browser, and shipped by people who know what they
are doing.

---

## 3. "Can we host everything on the `.github` repo, or do we need a second public repo?"

Short answer: **you need neither.** Put the site in `protocol` and deploy it with Cloudflare Pages,
which builds from a private repository. If you later decide you want GitHub Pages instead, then yes
— create one new dedicated public repository, and do not use `.github`.

### 3.1 Is it possible on `.github`?

Probably, but nobody does it and the URL is bad.

GitHub's docs describe exactly two kinds of Pages site, and impose no restriction based on
repository name:

| | User / organization site | Project site |
| --- | --- | --- |
| Source repository | must be named `<owner>.github.io` | any repository |
| Limit | one per account | one per repository |
| Default URL | `https://<owner>.github.io` | `https://<owner>.github.io/<repositoryname>` |

`.github` is an ordinary repository that GitHub also reads org-profile and community-health files
from, so by that table it should be able to host a project site — at
`https://pondprotocol.github.io/.github/`, a URL whose path segment is a dot-directory.

I could not confirm anyone actually does this. I checked the `.github` repository of ten
organisations (`github`, `microsoft`, `google`, `vercel`, `cloudflare`, `nodejs`, `actions`,
`angular`, `netlify`, `PondProtocol`) via the Pages REST API and **none has Pages enabled**. That is
weak evidence of impossibility but decent evidence that it is not a normal thing to do, and it
means the dot-prefixed URL path is untested territory.

It also does not matter much, because with a custom domain the repository name disappears from the
URL — see §3.3.

### 3.2 The reason not to, which is about blast radius

Possible and advisable are different questions. Three reasons to keep them apart, in order of how
much they should weigh:

**The `.github` repository has an org-wide job.** It supplies the organisation profile README and
the default community-health files — security policy, code of conduct, issue and PR templates —
that GitHub inherits into every repository that lacks its own. It is infrastructure for the whole
org.

**A docs site would put that infrastructure behind a build.** Enabling Pages there means every push
runs a deployment. A failing build, a bad workflow edit, or a branch-protection change made for the
site's benefit now sits in front of org-level files. The site breaking is an inconvenience; the
org's security policy and templates becoming collateral damage in a website deploy is a
self-inflicted problem with no upside.

**The change cadences are wrong for each other.** Community-health files change a few times a year.
A documentation site changes constantly — copy edits, new pages, restyling. Sharing one commit
history, one review queue and one set of CI triggers between those two things makes both worse: the
site's churn buries the rare, important governance change.

There is also a smaller point that matters for this project specifically. The whole purpose of
`/verify/` is that this domain is the trustworthy source of truth about the issuer address. A domain
served out of a repository whose main job is something else, whose Pages configuration is incidental
to its purpose, is a slightly worse custodian of that claim than one repository that exists to serve
it.

**Verdict: possible, not advisable. Do not put the website in `.github`.**

### 3.3 Custom domains, and whether one apex can serve two Pages sites

Verified from GitHub's docs today:

- Supported custom domain types are `www.example.com`, a custom subdomain like `docs.example.com`,
  and the apex `example.com`.
- **A custom domain set on the org site becomes the default for every project site in the account,
  at a subpath.** GitHub's own example: with `www.octocat.com` on the user site, a project site in
  repository `octo-project` is served at `www.octocat.com/octo-project`.
- That default can be overridden per repository by setting a custom domain on that repository.

So the answer to "can an org point one apex domain at more than one Pages site" is: **one Pages site
owns the domain root, and other project sites hang off subpaths of it.** Exactly one site can serve
`https://example.com/`, and that is the only site that can serve `https://example.com/.well-known/`.

That last clause is the operative one. Whichever repository owns the apex root is the repository
that must contain `.well-known/xrp-ledger.toml`. You cannot put the docs in one repository and the
identity file in another and have both appear at the apex.

Note also that setting a custom domain on a *project* repository serves it at that domain's root,
not at a subpath — which is why the `.github` URL ugliness from §3.1 is not the real objection.

### 3.4 The `.well-known` gotcha, verified with real builds

This is the one that silently produces a 404 at the path that anchors the token's identity, so I
ran it rather than reasoning about it.

**Jekyll drops it.** GitHub Pages runs Jekyll over branch-based deployments by default, and Jekyll
excludes dot-prefixed files and directories from its output. Real build, Jekyll 4.4.1:

```
$ tree                          # source
_config.yml
index.md
normal.txt
.well-known/xrp-ledger.toml

$ jekyll build                  # exit code 0, no warning, no error
$ find _site -mindepth 1
_site/index.html
_site/normal.txt                # .well-known is simply gone
```

Zero exit code. No warning. The file is not there.

**And the intuitive fix does not work.** Three `include:` forms, same build, same source tree:

| `_config.yml` | Result |
| --- | --- |
| `include: [".well-known"]` | **works** — `_site/.well-known/xrp-ledger.toml` present |
| `include: [".well-known/*"]` | **silently fails** — file still dropped |
| `include: [".well-known/xrp-ledger.toml"]` | **works** |

The glob form is the one most people would write first, and it is the one that does not work.

**The GitHub Actions path has the same defect, in a different place.**
`actions/upload-pages-artifact` defaults `include-hidden-files` to `false`, and when false it
archives with `tar --exclude=.[^/]*`. Reproduced locally with GNU tar 1.35:

```
$ tar --directory _site -cf a.tar --exclude=.git --exclude=.github --exclude='.[^/]*' .
$ tar -tf a.tar
./
./docs/
./docs/page.html
./index.html                    # .well-known excluded

$ tar --directory _site -cf b.tar --exclude=.git --exclude=.github .
$ tar -tf b.tar | grep well-known
./.well-known/
./.well-known/xrp-ledger.toml   # present with include-hidden-files: true
```

The workflow succeeds, the deploy reports success, and the file 404s in production.

**What it takes for the file to survive, then.** Any one of these is sufficient, and this repository
does all three:

1. **A non-Jekyll build.** `site/scripts/build.mjs` copies `public/` with `cpSync`, which copies
   dot-directories, and then **refuses to emit output at all** if the file is not at the expected
   path. `site/scripts/guard.mjs` asserts it again independently.
2. **`include-hidden-files: true`** on `actions/upload-pages-artifact`, set in the committed
   workflow with a comment explaining why it is mandatory.
3. **A `.nojekyll` file**, shipped in `site/public/` so it lands in the output. Insurance against
   somebody later switching to a branch-based deploy, where Jekyll would run again.

And regardless of all three, verify the deployed result:

```bash
cd site && npm run verify:live -- pond.greenhead.io
```

None of this is a problem on Cloudflare Pages, which serves the directory it is given — but the
mitigations cost nothing and they are what make the GitHub Pages fallback genuinely usable.

### 3.5 The private-repository plan requirement

Quoted verbatim from GitHub's docs, fetched 2026-09-15:

> GitHub Pages is available in public repositories with GitHub Free and GitHub Free for
> organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub
> Enterprise Cloud, and GitHub Enterprise Server.

All three code repositories — `protocol`, `pnd`, `rpnd` — are private. So:

- **GitHub Pages from any of them requires a paid plan** (Pro, Team, or Enterprise).
- **A public docs-only repository sidesteps it completely.** Pages on a public repository works on
  GitHub Free. This is why `.github`, being the org's only public repository, looked like a
  shortcut.
- **Cloudflare Pages sidesteps it differently and better**, by building from the private repository
  and publishing only the output. No plan change, no new repository, and the source stays private.

One more thing that matters for §6, verified from the same docs: **publishing a Pages site
*privately* requires GitHub Enterprise Cloud.** On Free, Pro or Team, a Pages site is visible to
anyone on the internet *regardless of whether its source repository is private*. A private repo does
not give you a private site. There is no half-way option on the plans you are likely to be on.

---

## 4. Cloudflare Pages, in detail

**What it gives you that matters here**

- **`_headers`, committed with the site.** Full control of `Access-Control-Allow-Origin` and
  `Content-Type` on the exact path, reviewable in a pull request. Verified working on
  `.well-known/` paths in §2.3.
- **DNS, TLS, and hosting in one account.** Fewer independently-lapsing dependencies in front of a
  file that must stay online indefinitely. If the domain is registered through Cloudflare, that is
  one vendor and one renewal instead of three.
- **Apex domains natively.** Cloudflare's CNAME flattening exists partly for this; their DNS docs
  state it is "what allows you to use a root custom domain with a Cloudflare Pages site." No
  hardcoded IP addresses to maintain.
- **Builds from a private repository**, so the site source can stay in `protocol`.

**Free plan limits**, from Cloudflare's published limits page (2026-09-15). The site is 30 files:

| Limit | Free plan |
| --- | --- |
| Builds | 500/month, 1 concurrent, 20-minute timeout |
| Files per site | 20,000 |
| Max file size | 25 MiB |
| Custom domains per project | 100 |
| `_headers` rules | 100 rules, 2,000 characters per line |

**The risks, stated plainly**

- **The CORS header depends on a file that can be deleted.** Covered in §1 and mitigated by
  `verify:live`, but it is the genuine downside versus GitHub Pages.
- **`_headers` can under-apply silently** (§2.4). Same mitigation.
- **It is a third-party account** that has to keep existing. So is GitHub. So is the registrar.
  Consolidating DNS and hosting into one of them reduces the count rather than raising it.

---

## 5. Replit is the chosen host

Replit has a first-class **Static Deployments** type. Per their docs, it hosts "your app's files,
such as HTML, CSS, and JavaScript, on a cloud server that uses caching," with "no backend server,"
billed on "only the data your site serves," and it explicitly lists documentation sites as an
ideal use.

It can set the header that matters. From Replit's static deployment configuration docs, in
`.replit` — this repository now commits the block with `*` on the TOML path, not the docs'
example value of `"origin"`:

```toml
[[deployment.responseHeaders]]
path = "/.well-known/xrp-ledger.toml"
name = "Access-Control-Allow-Origin"
value = "*"
```

`Content-Type` is not on their reserved-headers list, so it is set on the same path. **Do not
publish as Static.** Verified 2026-09-16: Replit Static omits every dotfile (`.well-known/` and
`.nojekyll` 404; `/_headers` 200). Autoscale with `serve.mjs` is the production type. A non-dot
twin plus rewrite is the Static fallback only.

The earlier objections (extra vendor, unverified pricing, static as a secondary product mode)
still exist. The owner overrode them: `pond.greenhead.io` is already a name they hold, the
Greenhead agent database that used to live there has moved to `database.greenhead.io`, and they
will import this GitHub repo rather than relocating source off GitHub. GitHub remains the source
of truth; Replit is the file host.

**Verdict: chosen.** Config is [`.replit`](../.replit). `verify:live` is the check. Issuer
`Domain` stays unset.

---

## 6. Public, private, or public with internal docs excluded

**This needs an owner decision, and it is a disclosure decision rather than a technical one.**

Three tiers of material exist, and they should not be treated the same way:

**Tier 1 — internal analysis. Must not be published.** Two strategy documents live in the private
agent store: `docs/firstledger-strategy.md` and `docs/rpnd-tokenomics.md`. They contain competitive
observations about a third-party platform and unratified economic analysis. **These are excluded
structurally, not by memory.** The build reads an explicit allowlist and cannot discover a document
that is not on it; the sync step rejects any path resolving outside the three declared repository
roots; and `site/scripts/guard.mjs` fails the build if any marker of that material appears anywhere
in the output. See [`site/README.md`](../site/README.md).

**Tier 2 — the repository documentation. Currently private, and publishing it is a real choice.**
All three code repositories are private today, so *none* of the content this site renders is public
right now. Deploying makes about 2,200 lines of documentation public at once. Most of it is exactly
what you want public — the token specification, trust-line mechanics, the integration guide, and
above all `/verify/`. Some is worth a deliberate look before it ships:

- The `open-questions.md` files enumerate undecided design, placeholder values, and unresolved
  custody and freeze-policy questions. Publishing them is honest and, in my view, a credibility
  asset for a pre-launch project — but it does tell readers precisely what is not settled. Currently
  **included**; two entries in `content.config.json` remove them.
- `rpnd/docs/issuance.md` and `rpnd/README.md` are operator runbooks. They hold no secrets, but they
  read as instructions for the people holding the issuer keys. Currently **excluded**, with the
  reason recorded.

**Tier 3 — pages written for the site.** `/`, `/verify/`, `/xrp-ledger-toml/`. Public by design.

### The recommendation, and the thing that constrains it

**A public site with internal material excluded — which is what is built — and the source repository
staying private.**

The constraint that removes most of the choice: the whole point of this domain is that
`/.well-known/xrp-ledger.toml` and `/verify/` are publicly readable. XLS-26 crawlers are anonymous.
An impersonation warning nobody can reach protects nobody. **The site cannot be private and still do
its job.**

So the meaningful question is not public-versus-private, it is *which documents* are on the public
site. That is what the allowlist makes reviewable: the current answer is 24 pages published and 12
documents excluded with a stated reason for each, and changing either is a one-line diff that shows
up in code review.

Worth restating from §3.5, because it closes off a tempting middle path: on GitHub Free, Pro or
Team, a Pages site is public even when its repository is private. Privately-published Pages requires
GitHub Enterprise Cloud. There is no cheap private-site option.

**Owner decision required:** confirm the tier-2 calls above — specifically whether the
`open-questions.md` files should be public — before the first deploy.

### 6.1 The issuer address: settled, and now consistent

**Status: resolved in favour of publishing.** The organisation's profile page previously stated that
*"no issuer address is published yet"* and that the address was *"deliberately withheld until the
account's funding status is confirmed"*, while `protocol/README.md`, `pnd/docs/token-spec.md` and
this site's `/verify/` page all published `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc` in full. That
disagreement is being closed by an open pull request on the `.github` repository which publishes the
address with the same pre-launch framing used here.

The two surfaces are now deliberately aligned rather than accidentally different, and the reasoning
is recorded below so the decision does not have to be re-argued. **Keep them aligned:** if either
surface changes its position on the address, the other has to change with it.

**Why publishing is right.** Four reasons, in order of weight:

1. **The org page's own stated condition has already been met.** It withholds the address "until the
   account's funding status is confirmed." That is now confirmed: the account is funded on mainnet
   with `Flags` of 0, verified and written up in the correction PRs open against both `protocol` and
   `pnd`. This is not a disagreement about principle — it is a gate that has been passed and a page
   that has not caught up.
2. **It is not secret, and cannot be.** The moment the account was funded it became public ledger
   data, visible on any explorer to anyone who looks. Withholding it from one page does not conceal
   it; it only means the project is not the one telling you what it is.
3. **The anti-impersonation mechanism does not work without it.** `/verify/` exists because two
   other mainnet accounts already issue `PND` and a third issues `Pnd`, one of them permanently
   broken. The single thing that distinguishes $PND is the issuer address. A page that warns about
   impostors without naming the real address is not a mitigation. The site's guard enforces the
   address's presence on `/verify/` for exactly this reason.
4. **Silence leaves a vacuum that someone else fills.** If the project has published no canonical
   address and a trader searches the ticker, whatever they find becomes the de facto answer. Naming
   it first is the cheapest defence available, and it costs nothing that is recoverable later.

**What keeps this safe** is the pre-launch framing, not the withholding. The address is published
alongside an explicit statement that the account is unconfigured, nothing has been issued, and
therefore *any* token currently trading under the code `PND` is not $PND. That is both true and more
protective than saying nothing — it converts the address from an invitation to buy into a tool for
refusing to.

**What the two surfaces must keep in common.** Both now publish the address, both state that the
account is unconfigured and has issued nothing, both give runnable queries against the real address,
and both say plainly that if the page and the ledger disagree the ledger wins. `/verify/` additionally
describes the `PND` code collisions — other accounts issuing the exact code `PND`, plus the variants
`Pnd`, `PNDN` and `PNDC` — as a **pattern**, without naming any other issuer's address.

That omission is deliberate and enforced. Some of those projects may be entirely legitimate, their
metrics change constantly, and naming them would be an accusation the site has no basis to make. The
publication guard fails the build if any classic XRPL address other than the canonical issuer appears
anywhere in the output, so it is a property of the build rather than an editorial habit.

**Remaining step for the owner:** once the site is live, link the org profile to
`https://pond.greenhead.io/verify/` so there is one canonical destination rather than two
partial ones. Do not point the issuer `Domain` at this host as part of that step.

**If the position is ever reversed,** it has to be reversed everywhere: `protocol/README.md`,
`pnd/docs/token-spec.md`, the org profile, and this site — and it costs `/verify/` its function,
because without the address there is nothing to distinguish $PND from the same-code tokens that
already exist. What must not happen is the surfaces drifting apart again by accident.

---

## 7. Replit settings to paste

These values match [`site/package.json`](../site/package.json) and [`.replit`](../.replit). Do not
guess. The GitHub repo root is **not** the site root — the static build lives in `site/` and
writes `site/dist`.

**Run command** (editor preview, and Autoscale fallback):

```bash
cd site && (test -d node_modules || npm ci) && npm run check && npm run serve
```

`npm run check` is `node scripts/build.mjs --strict && node scripts/guard.mjs`. Using
`npm run build` alone skips the publication guard.

| Publishing field | Paste this |
| --- | --- |
| **Deployment type** | **Autoscale** (not Static — Static omits `.well-known/`) |
| **Build command** | `cd site && npm ci && npm run check` |
| **Run command** | `cd site && node scripts/serve.mjs` |
| **Public directory** | `site/dist` (Static fallback only) |

Replit Static Deployments omit dotfiles. Verified 2026-09-16 on `pond.greenhead.io`:
`/.well-known/xrp-ledger.toml` and `/.nojekyll` returned the HTML 404 page, while `/_headers` and
`/robots.txt` from the same `public/` copy returned 200. Autoscale with `serve.mjs` serves the
real `/.well-known/` path. The build also writes `well-known/xrp-ledger.toml` (no leading dot)
and `.replit` rewrites the XLS-26 URL onto it if a Static publish is retried.

CORS on Autoscale comes from `serve.mjs`. After republish:

```bash
cd site && npm run verify:live -- pond.greenhead.io
```

That checks HTTPS status, `Access-Control-Allow-Origin`, `Content-Type`, and that the body has the
right stanzas and no leftover placeholders. A missing CORS header is invisible in a browser, so
looking at the page in a browser is not a substitute.

**Leave the issuer `Domain` field unset.** CORS has not been verified live. Do not set `Domain` as
part of this attach. Binding `Domain` can only be changed while the issuer can still sign.

Remaining TODOs in `site/public/.well-known/xrp-ledger.toml` after this host is filled in: a real
square icon on a permanent host, and whether to include `[[PRINCIPALS]]` (a disclosure decision —
do not invent a contact). `$rPND` has no stanza until it exists on ledger.

**Flip `launchStatus` to `live`** in `site/content.config.json` only once the issuer is configured
and $PND has actually been issued. That flag controls the sitewide "$PND has not launched" warning.
It is the one edit on the site that could mislead a buyer, so it goes last.

### Import and custom-domain clicks

1. Open [https://replit.com/import](https://replit.com/import) → **GitHub** → connect GitHub →
   choose **PondProtocol/Protocol** → **Import**. Public-repo shortcut:
   `https://replit.com/github.com/PondProtocol/Protocol`. If the org is missing from the picker,
   grant the Replit OAuth app access to PondProtocol
   ([GitHub application settings](https://github.com/settings/applications)).
2. Press **Run** once. Confirm `/.well-known/xrp-ledger.toml` returns 200 in the preview.
3. **Publish** (top right, or **Replit Cloud → Publishing**). **Adjust settings**: Deployment
   type **Autoscale**, build `cd site && npm ci && npm run check`, run
   `cd site && node scripts/serve.mjs`. Publish. The site is already imported; this is a
   republish after pulling `main`.
4. **Publishing → Domains → Connect your own domain** → enter `pond.greenhead.io`. Prefer guided
   DNS setup. Otherwise copy the `A` record and the `replit-verify=...` `TXT` record into
   `greenhead.io` DNS and **leave the TXT record in place** (certificate renewal depends on it).
   If that DNS is on Cloudflare, set the `A` record to **DNS only** (grey cloud), not proxied.
   Keep a single `A` on that hostname; remove `AAAA`.
5. Wait for **Verified** (minutes to 48 hours). Then run `verify:live`.
6. **Leave the issuer `Domain` field unset.**

`pond.greenhead.io` previously served a Greenhead agent database. That app is now at
`database.greenhead.io`. Attaching `pond` here is intended, but confirm leftover Greenhead records
are gone before changing DNS.

### What is still on the owner

1. **Pull `main` in the existing Replit app and republish as Autoscale** with the table above.
   Do not stay on Static. Leave `pond.greenhead.io` attached.
2. **Turn on branch protection on `main`** requiring the `staleness` and `build` checks. Replit
   builds from Publish / a push and does not run GitHub Actions, so a direct push can publish a
   stale snapshot of sibling-repo docs.
3. **Run `verify:live` against `pond.greenhead.io`** once DNS is Verified.
4. **Leave issuer `Domain` unset** until that live CORS check passes. Not a step for this deploy.
5. **Confirm the tier-2 calls** in §6 — specifically whether the `open-questions.md` files stay
   public — if that has not been settled.

---

## 8. What I could not verify, and how to settle it

| Claim | Status | How to check |
| --- | --- | --- |
| `Content-Type` GitHub Pages sends for a `.toml` file | **Unverified.** I could not find a live 200 response for a `.toml` on any `*.github.io` host; every candidate 404'd. GitHub Pages cannot be configured either way, so this is a real unknown on that host. | Deploy any `.toml` to a Pages site and `curl -I` it. XLS-26 says consumers should also accept `text/plain`, so a non-`application/toml` value is probably tolerable — but it is not something you can fix there. |
| Cloudflare Pages building a private repo on the free plan | **Strongly implied, not directly confirmed.** Cloudflare's limits page states you "can manage both public and private repositories" without impacting the Pages site, and lists no plan gate on repository visibility. | Connect this repository in the Cloudflare dashboard before committing to the approach. It fails immediately and harmlessly if not permitted. |
| Whether GitHub Pages can be enabled on a repository named `.github` | **Untested.** Nothing in the docs forbids it; none of ten organisations checked has it enabled. | Enable Pages on a throwaway org's `.github` repo. Not worth doing, since §3.2 recommends against it regardless. |
| Cause of the missing CORS header on one `developers.cloudflare.com` `.well-known` path | **Unexplained.** Reproduced twice. Malformed lines in their `_headers` are a plausible but unconfirmed cause. | Not worth chasing. The actionable conclusion — verify live responses, never infer from the file — holds either way. |
| Replit Static serving of `/.well-known/` | **Fails.** 2026-09-16: `/.well-known/xrp-ledger.toml` and `/.nojekyll` 404; `/_headers` 200. | Publish Autoscale with `serve.mjs`, then `cd site && npm run verify:live -- pond.greenhead.io` |
| That the FirstLedger route for $PND is `/token-v3/<issuer>/PND` | **Unverified**, and marked unverified on the site. The route has moved once already and the token does not exist yet. | Load it in a browser once $PND is issued, then set `status: "verified"` in `site/content.config.json`. |

---

## Appendix: verification log

All checks 2026-09-15.

| Check | Method | Result |
| --- | --- | --- |
| GitHub Pages CORS, HTML | `curl -I` on `pages.github.com/` | `access-control-allow-origin: *` |
| GitHub Pages CORS, static asset | `curl -I` on `pages.github.com/versions.json` | `access-control-allow-origin: *` |
| GitHub Pages CORS, 404 | `curl -I` on a nonexistent path | header still present |
| Cloudflare Pages default CORS | `curl -I` on `starlight.astro.build/` and `/pagefind/pagefind.js` | **absent** on both |
| Cloudflare Pages default CORS, more samples | `hono.dev`, `astro.build` | **absent** |
| Cloudflare Pages with `_headers` | `developers.cloudflare.com`, `vitepress.pages.dev`, `tauri.pages.dev` | `*` present |
| Mechanism confirmed | fetched `cloudflare-docs` `public/_headers` | first rule is `/*  Access-Control-Allow-Origin: *` |
| Cloudflare Pages serves dot-dirs | `curl -I` on `developers.cloudflare.com/.well-known/agent-skills/index.json` | 200, `*`, `Content-Type` overridden by `_headers` |
| `_headers` under-application | `curl -I` on `/.well-known/mcp/server-card.json`, twice | 200 but **no** CORS header |
| Live XRPL TOMLs | `curl -I` on 4 issuer domains | `ripple.com`, `xrpl-labs.com` correct; `xpmarket.com`, `gatehub.net` missing CORS |
| GitHub plan requirement | GitHub docs, "What is GitHub Pages?" | quoted verbatim in §3.5 |
| Pages site types and URLs | same page | two types; project sites at `<owner>.github.io/<repo>` |
| Private Pages publishing | GitHub docs, "Changing the visibility…" | requires GitHub Enterprise Cloud |
| Custom domain across repos | GitHub docs, "About custom domains…" | org-site domain becomes default for project sites at subpaths; overridable per repo |
| Apex DNS records | GitHub docs, then `dig pages.github.com` and `dig jekyllrb.com` | documented IPs `185.199.108–111.153` match live resolution |
| Cloudflare apex support | Cloudflare DNS docs, CNAME flattening | "what allows you to use a root custom domain with a Cloudflare Pages site" |
| Cloudflare Pages limits | Cloudflare limits page | 500 builds/mo, 20,000 files, 25 MiB, 100 `_headers` rules |
| Jekyll drops dot-dirs | real `jekyll build`, 4.4.1 | `.well-known` absent from `_site`, exit code 0, no warning |
| Jekyll `include:` forms | three real builds | bare dir works; `/*` glob **fails**; explicit file works |
| Pages artifact hidden files | read `actions/upload-pages-artifact` `action.yml` | `include-hidden-files` defaults `false`, applies `tar --exclude=.[^/]*` |
| That tar glob's effect | ran it, GNU tar 1.35 | `.well-known` excluded; present with the flag |
| Pages on `.github` in the wild | Pages REST API on 10 orgs' `.github` repos | none has Pages enabled |
| Replit static hosting | Replit docs, deployment types | Static tier: no backend, docs sites listed as ideal |
| Replit header config | Replit docs, static config | `[[deployment.responseHeaders]]` can set CORS; `Content-Type` not reserved |
| This site's build | `npm run check` in `site/` | 24 pages, `.well-known/xrp-ledger.toml` at the exact path, 31 guard checks pass |
| Local serving | `npm run serve`, then `curl -I` | 200, `text/plain`, `access-control-allow-origin: *` |
