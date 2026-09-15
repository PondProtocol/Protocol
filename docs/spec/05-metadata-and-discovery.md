# 05 — Metadata and discovery

Skeleton. See [conventions](README.md#conventions) for the Documented / Open / TODO labels.

Discovery uses two independent mechanisms: an off-ledger TOML file bound to the issuer by its `Domain` field, and an on-ledger metadata blob attached to the MPT issuance.

## 5.1 XLS-26 — off-ledger `xrp-ledger.toml`

**Documented** (`rpnd/config/xrp-ledger.toml.template`, `rpnd/docs/issuance.md`):

The file is served at `https://<ISSUER_DOMAIN>/.well-known/xrp-ledger.toml` and contains `[[PRINCIPALS]]`, `[[ACCOUNTS]]`, `[[CURRENCIES]]`, and `[[TOKENS]]` entries for the issuer and for `PND`. Placeholders `{{ISSUER_ADDRESS}}`, `{{ISSUER_DOMAIN}}`, `{{NETWORK}}`, and `{{RPND_ISSUANCE_ID}}` are filled by `render-toml`.

Binding procedure, in order: render the file, serve it at the domain, then run `configure-issuer --domain <host>` so the AccountRoot `Domain` matches the host serving the file. The template's own notice states that addresses in it are authoritative only once `Domain` matches. Explorers implementing XLS-26 scrape the result.

The $rPND `[[TOKENS]]` row is commented out in the template, pending a real issuance id and explorer support for MPT rows — [TD-04](../open-questions.md#td-04).

**TODO:** replace `replace-me@example.com` in `[[PRINCIPALS]]` — [TD-02](../open-questions.md#td-02).

## 5.2 XLS-89 — on-ledger `MPTokenMetadata`

**Documented** (`rpnd/src/metadata.ts`):

The blob is JSON, hex-encoded into the `MPTokenMetadata` field of `MPTokenIssuanceCreate`. Fields published: `ticker`, `name`, `desc`, `icon`, `asset_class`, `issuer_name`, `uris`, and `additional_info` (which includes `paired_iou_currency` and `token_kind`). The encoder enforces the 1024-byte XRPL cap and fails the build rather than truncating. `encode-metadata` prints the JSON, the hex, and the byte count; `status` decodes what is actually on ledger.

**Documented:** updating metadata after issuance replaces the entire blob, unless metadata has been marked immutable.

**Open:** whether to mark metadata immutable, and at what point in the launch sequence — [OQ-10](../open-questions.md#oq-10).

## 5.3 Placeholders blocking publication

**TODO:** `icon` is `example.com/rpnd-icon.png` (also missing a URL scheme) and `uris[0].uri` is `https://example.com/rpnd` — [TD-01](../open-questions.md#td-01).

**Open:** the canonical domain, and whether it is a Pond Protocol domain or an rPND one — [OQ-12](../open-questions.md#oq-12), [OQ-02](../open-questions.md#oq-02).

`rpnd/docs/tokens.md` is explicit that metadata should not be treated as public until the domain actually serves the file.

## 5.4 Naming inside metadata

**Documented:** `issuer_name` is published as `rPND`, and `product` in the config is `rPND`.

**Open:** whether published metadata should name Pond Protocol instead — [OQ-02](../open-questions.md#oq-02), [TD-05](../open-questions.md#td-05). Changing `issuer_name` after issuance means rewriting the on-ledger blob, so decide before the mainnet create transaction.

## 5.5 Consistency between the two mechanisms

**Open:** nothing checks that the TOML and the on-ledger blob agree, and nothing defines which wins if they diverge. A drift check would be a reasonable addition to `rpnd` CI — related to [TD-10](../open-questions.md#td-10).
