# xrp-ledger.toml

This domain serves an [XLS-26](https://xls.xrpl.org/xls/XLS-0026-iou-token-metadata.html) token
metadata file at exactly one path:

> **`https://{{domain}}/.well-known/xrp-ledger.toml`**

`{{domain}}` is the **website host** — currently `pond.greenhead.io` on Replit. As of the
2026-09-16 snapshot the issuer's on-ledger `Domain` field is that same host, so the two-way
XLS-26 link is in place. Re-check `account_info` if this page might be stale. Live flags
(Default Ripple, No Freeze, clawback off) are stated on [Wallets](/wallets/), not in the TOML
file.

## Why the path is exact

XLS-26 fixes the location. It is `/.well-known/xrp-ledger.toml`, all lowercase, and there is no
alternative spelling and no fallback. A crawler that cannot fetch that exact URL over HTTPS records
the token as having no metadata at all.

The requirements, as specified:

| Requirement | Value |
| --- | --- |
| Path | `/.well-known/xrp-ledger.toml`, lowercase |
| Transport | HTTPS with a CA-signed certificate. Content over plain HTTP **should not** be trusted |
| `Access-Control-Allow-Origin` | `*` |
| `Content-Type` | `text/plain` (usual XLS-26 choice); `application/toml` is also accepted |
| Issuer `Domain` field | Must match the host **exactly**, stored as hex of the lowercase ASCII, with no scheme. **Set to `{{domain}}` on the 2026-09-16 snapshot.** |

The CORS header is the one most often missed, because a missing `Access-Control-Allow-Origin` is
invisible in a browser address bar and invisible to `curl` unless you look for it. What breaks is
every browser-based consumer — which is most wallets.

## How the identity claim works

Neither half proves anything alone:

- Anyone can host an `xrp-ledger.toml` claiming to own any account.
- Any account operator can set the `Domain` field to any string they like.

The claim comes from the two agreeing. Publishing the file requires control of this host. Setting
the `Domain` field requires the issuer's signing keys. When the file names the issuer *and* the
issuer names the host, the same entity controls both — and a squatter who has copied the ticker,
the name and the icon still cannot produce that link.

**Both halves exist on the 2026-09-16 snapshot:** the file names the issuer, and `Domain` is
`{{domain}}`. Wallets that wait on XRPL Meta may still show an empty $PND record until issuance.

`{{domain}}` is a name the owner holds, not a Cloudflare `pages.dev` hostname. The `Domain` bind
can only be changed while the issuer can still sign. After blackholing, whatever host is in
`Domain` is frozen forever. **Do not blackhole** before the $rPND MPT exists on this account.

This is the mechanism the [verify page](/verify/) asks you to check. Issuer flags belong on
[Wallets](/wallets/), not in this file.

## Who reads it

XRPL Meta crawls the ledger for issuing accounts with a `Domain` field set, fetches and parses the
TOML it finds, and serves the result through a public API. Consumers of that feed include Xaman,
the Xaman DEX, Crossmark, GemWallet and XRP Toolkit.

The practical consequence: one file and a matching on-ledger `Domain` propagate a token's
name, icon, description and links across those consumers, with no per-wallet application or
approval. XLS-26 exists precisely because the alternative was contacting every wallet and explorer
individually and repeating it for every change. **$PND still has not been issued**, so crawlers
can bind the host and still have no token supply to show.

### What it does not do

Publishing this file is **not** a general-purpose way to set how every XRPL product describes the
token. Some front-ends maintain their own metadata and do not read self-published XLS-26 at all.

That is verified rather than assumed. Tracing a project whose own published XLS-26 description is
known, on 2026-09-15, one major XRPL trading front-end displayed a completely different description
from the one the project publishes — so it is not reading the project's file. Publishing this TOML
should therefore be expected to populate wallet and explorer metadata, and should **not** be
expected to populate that front-end's description box.

Set expectations accordingly. The list above is what the file demonstrably reaches. Anything else is
a separate, per-product question, and in at least one significant case the answer is no.

To check what the ecosystem currently holds for $PND:

```bash
ISSUER={{issuerAddress}}
curl -sS "https://s1.xrplmeta.org/v2/token/PND:$ISSUER" \
  | python3 -m json.tool
```

## Verifying this domain serves it correctly

Fetching the file in a browser is not a sufficient check, because the two things most likely to be
wrong — the CORS header and the content type — do not affect what a browser displays. Check the
headers:

```bash
curl -sS -I -H 'Origin: https://xrplmeta.org' \
  https://{{domain}}/.well-known/xrp-ledger.toml
```

Expected in the response:

```
HTTP/2 200
content-type: text/plain
access-control-allow-origin: *
```

The repository that builds this site ships that check as a script, so it can be run against the
website host after a deploy. A pass means the file is being served correctly. It does not mean
$PND has been issued:

```bash
cd site && npm run verify:live -- {{domain}}
```

## Permanence

The website host is `{{domain}}`. On the 2026-09-16 snapshot the issuer `Domain` is already that
host. That bind can only be changed while the issuer can still sign:

- Control of `greenhead.io` is what makes this URL durable in a way `*.pages.dev` is not. Losing
  the Replit account, or pointing DNS somewhere else, is still something an `AccountSet` cannot
  repair once the issuer can no longer sign.
- **Do not blackhole** until the $rPND MPT exists on this issuer. A shared issuer makes that
  trade cost $rPND forever.

There is a mainnet token with the currency code `PND` in a frozen-wrong-host state
today: blackholed issuer, `Domain` pointing at a host that returns HTTP 404, metadata unrecoverable
forever. It is listed on the [verify page](/verify/). That is why this issuer must keep the
ability to sign until $rPND exists.
