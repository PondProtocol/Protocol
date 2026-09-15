---
source_repo: protocol
source_path: docs/glossary.md
title: Glossary
url: /protocol/glossary/
section: Protocol
synced: 2026-09-15
---
# Glossary

Terms as they are used in this repo. XRPL definitions are summarized for orientation; the [XRPL documentation](https://xrpl.org/docs) is authoritative for them.

**$PND** — Pond Protocol's IOU: an XRPL issued currency with the 3-character code `PND`. See [spec/01](spec/01-tokens.md#11-pnd--iou).

**$rPND** — Pond Protocol's MPT: a Multi-Purpose Token with the XLS-89 ticker `RPND`. See [spec/01](spec/01-tokens.md#12-rpnd--mpt).

**Asset scale** — the MPT field defining how many fractional units make one whole token. $rPND uses 6, so one rPND is 1,000,000 units. Fixed for the life of an issuance.

**Clawback** — an issuer's ability to reclaim tokens from a holder. Permanently disabled for $rPND via `ImmutableFlags` / `tifMPTCanClawback`.

**Cold account** — the issuing account, holding issuance authority; its key is meant to stay offline. Also "issuer".

**Default Ripple** — an issuer account setting (`asfDefaultRipple`) that lets balances of its issued currency move between holders' trust lines. Enabled for the $PND issuer.

**`gateway_balances`** — the XRPL API call that reports an issuing account's outstanding obligations. Because the ledger stores no supply field for an IOU, this is how $PND circulating supply is measured against its 100B policy target.

**Hot account** — the operational account, holding distributable inventory and transacting routinely. Also "operational".

**IOU** — on the XRP Ledger, an issued currency held on a trust line. Used in that technical sense throughout this repo. Whether $PND is also a claim on something off ledger is undecided — [OQ-05](open-questions.md#oq-05).

**MPT (Multi-Purpose Token)** — a native XRPL token type that does not use trust lines, identified by an `MPTokenIssuanceID` and carrying its own on-ledger metadata. Requires the MPTokens amendment.

**`MPTokenAuthorize`** — the transaction a holder submits to opt into receiving a specific MPT.

**`MPTokenIssuanceCreate`** — the transaction that creates an MPT issuance, setting asset scale, maximum amount, flags, and metadata. The ledger returns the `MPTokenIssuanceID`.

**`MPTokenIssuanceID`** — the ledger-assigned identifier that *is* the MPT's identity, 192 bits / 48 hex characters, derived from the issuer account and the create transaction's sequence. The ticker is only a label.

**`MPTokenIssuanceSet`** — the transaction that updates an existing issuance: lock and unlock, the metadata blob, and capability flags. Flag changes are **one-way** — it can enable a flag but never disable one — so the issuer can only ever acquire capabilities, never give them up.

**`MaximumAmount`** — the MPT's ledger-enforced cap on **circulating** supply, in base units, not a cap on cumulative issuance: returning tokens to the issuer frees headroom to mint again. Permanent from create; raising it requires destroying the issuance and creating a new one with a new id.

**OQ-nn** — an open design question in [open-questions.md](open-questions.md). Undecided by definition.

**Pairing field** — `additional_info.paired_iou_currency` in the $rPND metadata, set to `PND`. Documentation for indexers only; the ledger binds nothing — [spec/04](spec/04-token-relationship.md).

**Pond Protocol** — the umbrella brand for both assets and for this organization, settled per [OQ-02](open-questions.md#oq-02). The on-ledger `issuer_name` still reads `rPND` — [OQ-24](open-questions.md#oq-24).

**TD-nn** — a TODO in [open-questions.md](open-questions.md): decided or mechanical, not yet done.

**Tick size** — the number of significant digits the XRPL uses for order-book pricing of an issuer's currency. Set to 5 for the $PND issuer.

**Transfer fee / transfer rate** — the issuer's cut on transfers between third parties: `TransferFee` for MPTs, `TransferRate` for IOUs. Both are 0 today — [OQ-07](open-questions.md#oq-07).

**Trust line** — the XRPL object recording a holder's balance of, and limit on, one issuer's currency. Required before receiving $PND.

**`TrustSet`** — the transaction a holder submits to create or adjust a trust line.

**XLS-26** — the `xrp-ledger.toml` convention for publishing issuer and token information at a domain, bound to an account by its `Domain` field. See [spec/05](spec/05-metadata-and-discovery.md#51-xls-26--off-ledger-xrp-ledgertoml).

**XLS-89** — the MPT metadata convention, stored hex-encoded on ledger in `MPTokenMetadata` with a 1024-byte cap. See [spec/05](spec/05-metadata-and-discovery.md#52-xls-89--on-ledger-mptokenmetadata).
