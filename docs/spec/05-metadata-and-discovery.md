# 05 — Metadata and discovery

Skeleton. See [conventions](README.md#conventions) for the Documented / Open / TODO labels.

Discovery uses two independent mechanisms: an off-ledger TOML file bound to the issuer by its `Domain` field, and an on-ledger metadata blob attached to the MPT issuance.

**Neither is a completed identity bind.** The website host `pondprotocol.pages.dev` will serve the
XLS-26 file; the issuer has no `Domain`, so that file cannot be verified against the account. No
MPT issuance exists, so no XLS-89 blob is published. Everything below describes the intended
mechanism — see [architecture Live state](../architecture.md#live-state).

## 5.1 XLS-26 — off-ledger `xrp-ledger.toml`

**Documented** (`rpnd/config/xrp-ledger.toml.template`, `rpnd/docs/issuance.md`):

The file is served at `https://pondprotocol.pages.dev/.well-known/xrp-ledger.toml` (website host,
lowercase, no scheme in Domain-related fields). The `protocol` site copy lives at
`site/public/.well-known/xrp-ledger.toml`. The `rpnd` template still uses placeholders
`{{ISSUER_ADDRESS}}`, `{{ISSUER_DOMAIN}}`, `{{NETWORK}}`, and `{{RPND_ISSUANCE_ID}}` filled by
`render-toml`.

The website host is chosen. The on-ledger `Domain` stays unset until CORS is verified on the live
path. `pondprotocol.pages.dev` is a Cloudflare platform hostname; binding `Domain` to it later
accepts a platform dependency that can only be changed while the issuer can still sign. The
template's own notice states that addresses in it are authoritative only once `Domain` matches.

The $rPND `[[TOKENS]]` row is commented out in the template, pending a real issuance id and explorer support for MPT rows — [TD-04](../open-questions.md#td-04).

**TODO:** replace `replace-me@example.com` in `[[PRINCIPALS]]` — [TD-02](../open-questions.md#td-02).

## 5.2 XLS-89 — on-ledger `MPTokenMetadata`

**Documented** (`rpnd/src/metadata.ts`):

The blob is JSON, hex-encoded into the `MPTokenMetadata` field of `MPTokenIssuanceCreate`. Fields published: `ticker`, `name`, `desc`, `icon`, `asset_class`, `issuer_name`, `uris`, and `additional_info` (which includes `paired_iou_currency` and `token_kind`). It is currently **249 bytes** against the 1024-byte XRPL cap; the encoder fails the build rather than truncating. On ledger the XLS-89 short keys are written (`t`, `n`, `d`, `i`, `ac`, `in`, `us`, `ai`), not the long names. `encode-metadata` prints the JSON, the hex, and the byte count; `status` decodes what is actually on ledger.

**Documented:** `MPTokenIssuanceSet` replaces the entire blob. `tifMPTMetadata` would freeze it permanently and is not set today.

**Open:** whether to freeze metadata, and at what point in the launch sequence — [OQ-10](../open-questions.md#oq-10). Freezing before production URLs land would make the `example.com` placeholders permanent, so this is ordered after [TD-01](../open-questions.md#td-01).

## 5.3 Placeholders blocking publication

**TODO:** `icon` is `example.com/rpnd-icon.png` (also missing a URL scheme) and `uris[0].uri` is `https://example.com/rpnd` — [TD-01](../open-questions.md#td-01).

**Open:** the on-ledger `Domain` field, and whether a registered domain later replaces the
Cloudflare Pages hostname `pondprotocol.pages.dev` as the website host — [OQ-12](../open-questions.md#oq-12).
The website host is chosen; the AccountRoot `Domain` is unset.

`rpnd/docs/tokens.md` is explicit that metadata should not be treated as public until the domain actually serves the file.

## 5.4 Naming inside metadata

**Documented:** the brand decision is settled — Pond Protocol is the umbrella name ([OQ-02](../open-questions.md#oq-02)) — and prose plus license copyright across the repos have been aligned. The on-ledger metadata has not: `product` and `issuerName` in the config are both `rPND`, so the published `issuer_name` reads `rPND`.

**Open:** what the field should say. `issuer_name` describes the issuer while `name` and `ticker` describe the token, so "Pond Protocol" as issuer alongside `rPND` as token name is a coherent outcome rather than an oversight to correct mechanically — [OQ-24](../open-questions.md#oq-24), with the edit tracked as [TD-05](../open-questions.md#td-05). Decide before the mainnet create: afterward it costs an `MPTokenIssuanceSet` and a new byte count, and becomes impossible if metadata is frozen.

## 5.5 Consistency between the two mechanisms

**Open:** nothing checks that the TOML and the on-ledger blob agree, and nothing defines which wins if they diverge. A drift check would be a reasonable addition to `rpnd` CI — related to [TD-10](../open-questions.md#td-10).
