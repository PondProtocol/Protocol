# xrp-ledger.toml

This domain serves an [XLS-26](https://xls.xrpl.org/xls/XLS-0026-iou-token-metadata.html) token
metadata file at exactly one path:

> **`https://{{domain}}/.well-known/xrp-ledger.toml`**

That file, plus the issuer account's `Domain` field pointing back at this domain, is the whole of
Pond Protocol's verifiable identity claim. Everything a wallet shows you about $PND — the name, the
icon, the description, the links — resolves through it.

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
| `Content-Type` | `application/toml`; consumers should also accept `text/plain` |
| Issuer `Domain` field | Must match this domain **exactly**, stored as hex of the lowercase ASCII |

The CORS header is the one most often missed, because a missing `Access-Control-Allow-Origin` is
invisible in a browser address bar and invisible to `curl` unless you look for it. What breaks is
every browser-based consumer — which is most wallets.

## How the identity claim works

Neither half proves anything alone:

- Anyone can host an `xrp-ledger.toml` claiming to own any account.
- Any account operator can set the `Domain` field to any string they like.

The claim comes from the two agreeing. Publishing the file requires control of this domain. Setting
the `Domain` field requires the issuer's signing keys. When the file names the issuer *and* the
issuer names the domain, the same entity controls both — and a squatter who has copied the ticker,
the name and the icon still cannot produce that link.

This is the mechanism the [verify page](/verify/) asks you to check.

## Who reads it

XRPL Meta crawls the ledger for issuing accounts with a `Domain` field set, fetches and parses the
TOML it finds, and serves the result through a public API. Consumers of that feed include Xaman,
the Xaman DEX, Crossmark, GemWallet and XRP Toolkit.

The practical consequence: one file and one `AccountSet` transaction propagate a token's name, icon,
description and links across those consumers, with no per-wallet application or approval. XLS-26
exists precisely because the alternative was contacting every wallet and explorer individually and
repeating it for every change.

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
curl -sS "https://s1.xrplmeta.org/v2/token/PND:{{issuerAddress}}" | python3 -m json.tool
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
content-type: application/toml
access-control-allow-origin: *
```

The repository that builds this site ships that check as a script, so it can be run against any
host before the issuer's `Domain` field is committed to it:

```bash
cd site && npm run verify:live -- {{domain}}
```

## Permanence

One note on why the domain matters more than the file. If the issuer account is ever blackholed —
a common trust signal on XRPL, and a one-way door — its `Domain` field becomes permanently
unchangeable. From that point on, losing the domain means the token's metadata breaks and can never
be repaired by anyone.

There is a mainnet token with the currency code `PND` in exactly that state today: blackholed
issuer, `Domain` pointing at a host that returns HTTP 404, metadata unrecoverable forever. It is
listed on the [verify page](/verify/). Treat this domain's renewal as a protocol-critical
dependency.
