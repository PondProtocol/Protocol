---
source_repo: protocol
source_path: docs/spec/01-tokens.md
source_ref: worktree
source_sha256: d507e51126359f9e244db6a5a4571617918da28011495d9a372ac1a7422e9976
title: 01 — Tokens
url: /spec/tokens/
section: Specification
synced: 2026-09-16
---
# 01 — Tokens

Skeleton. See [conventions](README.md#conventions) for the Documented / Open / TODO labels.

Pond Protocol involves two XRP Ledger assets. They are different object types and are not interchangeable on ledger.

**Neither exists on ledger yet.** The issuer account is funded on mainnet and carries no `AccountSet`, no trust lines, no obligations, and no MPT issuance. Config values below are what the operator intends to submit, not properties a holder can observe — see [architecture Live state](../architecture.md#live-state) for the verified snapshot and the queries to re-check it.

## 1.1 $PND — IOU

**Documented** (`rpnd/config/tokens.json`, `rpnd/src/issuance.ts`, `rpnd/docs/tokens.md`).

Asset identity, which does not depend on any transaction having been submitted:

| Property | Value |
| --- | --- |
| Kind | Issued currency (IOU) on trust lines |
| Currency code | `PND` (standard 3-character XRPL code) |
| Issuer | `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc` |
| Asset identity | The pair (code `PND`, issuer classic address). A different issuer using `PND` is a different token. |
| Amount form | `{ currency: "PND", issuer, value }` |
| Holder opt-in | `TrustSet` to the issuer, required before receiving |
| Display decimals | 6 — XLS-26 presentation metadata, not an account setting |
| Target supply | 100,000,000,000 by issuer policy; no ledger enforcement. Measured via `gateway_balances`. |

Issuer account settings, none of which has been applied:

| Setting | Config intends | On ledger now | Effect once applied |
| --- | --- | --- | --- |
| Default Ripple | enabled | **not set** | Lets $PND ripple between holders' lines. Until then, holder-to-holder $PND payments do not work by default |
| Disallow XRP | set | **not set** | Advisory only; not ledger-enforced |
| Require Destination Tag | off | not set | No change |
| `TransferRate` | 0 | absent | No observable change; absent already means no transfer fee |
| `TickSize` | 5 | absent | Rounds $PND order-book prices to 5 significant digits |
| `Domain` | unset (website host is `pondprotocol.pages.dev`) | absent | Would bind the issuer to the host serving `xrp-ledger.toml`. Stays unset until CORS is verified live. `pages.dev` is a Cloudflare platform hostname |
| No Freeze | not configured | not set | Freeze capability remains with the issuer — [OQ-08](../open-questions.md#oq-08) |
| Trust line clawback | not configured | not set, **and still settable** | Only settable while the account has never had a trust line. The first `TrustSet` closes it forever |

The default operational trust limit of `1000000000` is a config value for the operational account's own `TrustSet`, not an issuer setting.

**Open:** whether $PND represents a claim on anything off ledger, and against whom — [OQ-05](../open-questions.md#oq-05). Asset class is currently `other` rather than `rwa`, but that is a config default, not a decision.

**Open:** whether trust lines stay permissionless or become authorization-gated — [OQ-09](../open-questions.md#oq-09).

**Open:** whether the issuer should set No Freeze, permanently giving up the ability to freeze $PND lines, or retain default freeze capability — [OQ-08](../open-questions.md#oq-08).

## 1.2 $rPND — MPT

**No issuance exists.** `account_objects` on the issuer is empty, so there is no `MPTokenIssuance` and therefore no `MPTokenIssuanceID`. Every value below is what `MPTokenIssuanceCreate` would submit, not a property of a live asset.

**Documented** (same sources):

| Property | Config intends | Once created |
| --- | --- | --- |
| Kind | Multi-Purpose Token | — |
| Ticker (XLS-89) | `RPND` | Metadata; mutable with the blob |
| Display name | `rPND` | Metadata; mutable with the blob |
| Asset identity | — | `MPTokenIssuanceID` assigned by the ledger |
| Amount form | `{ mpt_issuance_id, value }` in base units | — |
| Asset scale | 6 (one whole rPND = 1,000,000 base units) | **Permanent** |
| Maximum amount | `1000000000000000` base units = 1,000,000,000 rPND **in circulation** | **Permanent** |
| Transfer fee | 0, so the field is omitted from the create | Changeable unless frozen |
| Create flags | `tfMPTCanTransfer`, `tfMPTCanLock` | **Permanent** — flags are one-way |
| Flags left off | `canTrade`, `canClawback`, `requireAuth` | Can be enabled later, never disabled again |
| Immutable flags | `tifMPTCanClawback` | Clawback permanently foreclosed |
| Holder opt-in | — | `MPTokenAuthorize`, required before receiving |

The ticker is metadata; the issuance id is identity. Consumers keying off `RPND` alone are matching a label, not an asset — and today they would be matching a label attached to nothing.

**Open:** the supply parameters above are labelled working defaults, not ratified economics, in [`rpnd/docs/rpnd-spec.md`](https://github.com/PondProtocol/rPND/blob/main/docs/rpnd-spec.md), and no issuance exists on ledger. They must be confirmed before create, because two of the three are permanent — [OQ-21](../open-questions.md#oq-21), [TD-09](../open-questions.md#td-09).

**Open:** whether `canTrade: false` is intended, given any trading venue plans — [OQ-14](../open-questions.md#oq-14).

**Open:** whether to create the issuance with lock authority at all, since one-way flags make it permanent, and what its intended use is — [OQ-08](../open-questions.md#oq-08).

**Open:** whether metadata should later be marked immutable — [OQ-10](../open-questions.md#oq-10).

## 1.3 Asymmetries to keep in mind

Documented consequences of the two object types, worth stating because they surprise people:

Once both exist, these asymmetries follow from the object types:

- $rPND has a hard on-ledger cap on circulating supply, enforced by the ledger. $PND's 100B target is policy only; the trust limit bounds one line, not total issuance.
- $rPND can never be clawed back. $PND has no freeze policy recorded either way.
- $rPND opt-in is one transaction with no limit. $PND opt-in carries a per-holder limit the holder chooses.
- $rPND amounts are integers in fractional units. $PND amounts are decimal strings.

## 1.4 Canonical parameter source

**Documented:** `rpnd/config/tokens.json` and `rpnd/src/issuance.ts` are authoritative on any mismatch across Pond Protocol's repos. [`pnd/docs/token-spec.md`](https://github.com/PondProtocol/PND/blob/main/docs/token-spec.md) is the token-facing reference for $PND and [`rpnd/docs/rpnd-spec.md`](https://github.com/PondProtocol/rPND/blob/main/docs/rpnd-spec.md) for $rPND. This section restates values for readers and is not a second source.

**Open:** how drift between the four hand-maintained restatements gets detected — [OQ-17](../open-questions.md#oq-17).
