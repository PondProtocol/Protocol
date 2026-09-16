# How wallets learn the name

Wallets that speak XLS-26 do not scrape this docs site’s homepage. They look
up the issuer on ledger, read `Domain`, and fetch
`/.well-known/xrp-ledger.toml` from that host.

On the 2026-09-16 snapshot both halves agree:

1. Issuer `Domain` is `{{domain}}`.
2. `https://{{domain}}/.well-known/xrp-ledger.toml` names issuer
   `{{issuerAddress}}`.

That is how a name, description, and (when present) icon can show up in
Xaman, Crossmark, GemWallet, XRP Toolkit, and XRPL Meta. **$PND still has not
been issued**, so a crawler can bind the host and still have no token supply
to display. Empty before launch is expected.

## What that does not do

Publishing the TOML is **not** how every XRPL product fills an About box.

FirstLedger and XPMarket are trading front-ends over the same ledger. They
maintain their own metadata. They do **not** demonstrably read this
self-published file for tokens they did not launch. **Their About /
description fields may stay empty** after 1 October 2026. That is not a
failed listing, and it is not a reason to issue $PND through their create-token
or memepad flows.

Those products are also **not** official Pond URLs. Do not follow a guessed
`/token/…` path from a search bar. [Official links](/links/) is the list.
[Verify](/verify/) is how you check the issuer.

## Check the crawl (optional)

After issuance, this is the metadata API wallets read — not a DEX:

```
https://s1.xrplmeta.org/v2/token/PND:{{issuerAddress}}
```

Empty or absent before $PND exists is the correct result. It is not a buy
link.

The file itself: [xrp-ledger.toml](/xrp-ledger-toml/).
