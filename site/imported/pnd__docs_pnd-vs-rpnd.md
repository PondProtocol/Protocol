---
source_repo: pnd
source_path: docs/pnd-vs-rpnd.md
source_ref: main
source_sha256: 2aba4c8b2a00a63495eb411ffe7af4270ebe8a89528e693e69f6a534e2c34dcf
title: $PND and $rPND compared
url: /protocol/two-tokens/
section: Protocol
synced: 2026-09-16
---
# $PND and $rPND

Pond Protocol has two XRP Ledger assets. They share a naming family and nothing else on ledger. This file exists so that nobody has to infer the relationship from the tickers.

This is the IOU side of the comparison. The `rpnd` repository documents the same split from the MPT side, and the two are meant to agree:

- [`rpnd/docs/rpnd-spec.md`](https://github.com/pondprotocol/rpnd/blob/main/docs/rpnd-spec.md) — the normative $rPND issuance spec, including [its own note on the relationship to $PND](https://github.com/pondprotocol/rpnd/blob/main/docs/rpnd-spec.md#relationship-to-pnd)
- [`rpnd/docs/mpt-vs-iou.md`](https://github.com/pondprotocol/rpnd/blob/main/docs/mpt-vs-iou.md) — why $rPND is an MPT and what that choice costs

## Side by side

| | $PND | $rPND |
| --- | --- | --- |
| Ledger type | Issued currency (IOU) | Multi-Purpose Token (MPT) |
| Identifier | currency code `PND` + issuer address | `MPTokenIssuanceID` from `MPTokenIssuanceCreate` |
| Ticker in metadata | `PND` | `RPND` (XLS-89) |
| Holder opt-in | `TrustSet` | `MPTokenAuthorize` |
| Amount shape | `{ currency, issuer, value }` | `{ mpt_issuance_id, value }` |
| Precision model | 15 significant decimal digits; `displayDecimals` 6 is a hint | fixed `AssetScale` of 6, set permanently at creation |
| Supply | no ledger field; 100 billion policy target, measured as obligations | `MaximumAmount` fixed permanently at creation |
| Metadata | XLS-26 file at the issuer's domain | XLS-89 JSON stored on ledger in `MPTokenMetadata` |
| Clawback | not enabled today; policy undecided (TODO) | permanently disabled at creation via `ImmutableFlags` |
| Freeze / lock | freeze policy undecided (TODO) | lockable (`tfMPTCanLock` set) |
| Amendment requirement | none; IOUs are core ledger functionality | requires the MPTokens amendment, so not available on every network |

The practical consequence of the last row: $PND can be issued anywhere, while $rPND only exists on MPT-capable networks. The issuance toolkit defaults to Devnet for that reason and marks Testnet as not MPT-capable.

## The supply magnitudes do not line up

$PND has a policy target of 100,000,000,000 tokens. $rPND's `MaximumAmount` is 1,000,000,000,000,000 base units at an `AssetScale` of 6, which is [1,000,000,000 display units](https://github.com/pondprotocol/rpnd/blob/main/docs/rpnd-spec.md#amounts-and-precision) — exactly 100 times smaller.

That is not a conflict, because the two are separate assets with no ledger relationship and neither number constrains the other. It is worth stating plainly for two reasons. First, `MaximumAmount` and `AssetScale` are immutable once `MPTokenIssuanceCreate` succeeds, so if a one-to-one relationship between the assets is ever intended, the $rPND ceiling has to be chosen before creation rather than adjusted after. Second, a reader who assumes the names imply a shared supply will get the ratio wrong by two orders of magnitude.

The two numbers also differ in kind, not just size. $rPND's ceiling is enforced by the ledger, which rejects mints beyond `MaximumAmount`; $PND's 100 billion is a policy commitment that no ledger rule enforces. `rpnd`'s [`mpt-vs-iou.md`](https://github.com/pondprotocol/rpnd/blob/main/docs/mpt-vs-iou.md) makes the same point from the other direction, listing the ledger-enforced cap as one of the reasons $rPND is an MPT. Both repositories should keep saying this; if either ever describes the $PND figure as a hard or on-chain cap, that is the error.

## What "paired" means

The $rPND metadata sets `additional_info.paired_iou_currency` to `PND`. That is a documentation field for indexers and operators. It is not a ledger primitive, and it creates:

- no peg between the two assets,
- no atomic conversion or redemption path,
- no shared supply accounting,
- no guarantee the two are issued by the same account, beyond the operator choosing to do so.

Anything that behaves as if $rPND is a wrapped or redeemable form of $PND is asserting a mechanism that does not exist on ledger today.

## One issuing account, or two?

**Settled: one.** The owner has confirmed that `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc` issues both $PND and $rPND. This was an open question in earlier revisions of this document and in `rpnd`'s spec; it is no longer open. Live state at the time of confirmation: the account is funded with 2.539034 XRP, `Flags` reads `0`, `OwnerCount` reads `0`, and nothing has been configured or issued from it — the decision is about which account will issue both tokens, not a statement about anything already on ledger.

Sharing one account couples the two assets exactly as previously flagged:

- **Account flags are shared.** `asfNoFreeze`, `asfAllowTrustLineClawback`, `asfRequireAuth`, and global freeze apply to the whole account, so a $PND policy choice also becomes $rPND's posture.
- **`Domain` is shared.** One `xrp-ledger.toml` covers both assets.
- **Reserve and key exposure are shared.** One compromised or unusable cold key affects both assets at once.

### The blackholing trap this creates

Because one account issues both, blackholing is not a decision that can be made about $PND in isolation anymore. A blackholed account can never sign again — no `AccountSet`, no `Payment`, and no `MPTokenIssuanceCreate`. So **if $rPND is ever going to exist, its `MPTokenIssuanceCreate` must be submitted before this issuer is ever blackholed.** Blackhole first, and $rPND can never be created on this address, full stop; there is no account recovery and no second attempt.

This compounds with a second, independent blocker. The $rPND config currently committed in `rpnd` (`config/tokens.json`) sets `ImmutableFlags` on the create transaction, to freeze `tfMPTCanClawback` permanently off. `ImmutableFlags` requires the **`DynamicMPT`** amendment. `DynamicMPT` is **not enabled on mainnet today** — `rpnd/docs/rpnd-spec.md` records that the exact create transaction this repo would submit returns `temDISABLED` on a network that mirrors mainnet's amendment set (Testnet), while the identical transaction with `ImmutableFlags` removed returns `tesSUCCESS`.

So, stated plainly: **blackholing this issuer is blocked on two independent grounds today.** It should not happen before $rPND has been created on it, if $rPND is ever going to exist — and separately, the $rPND config as currently written cannot even be created on mainnet, so there is nothing yet to sequence before the blackhole. Either of two things clears the second blocker: the $rPND config drops `ImmutableFlags` (accepting "no clawback" as unenforced policy until `DynamicMPT` activates, rather than a ledger-frozen guarantee), or `DynamicMPT` itself activates on mainnet. Do not treat "blackhole once `Domain` points somewhere permanent" — the recommendation for the FirstLedger trust signal — as sufficient on its own; check both that $rPND already exists on this address (if it is ever going to) and that one of the two `DynamicMPT`/`ImmutableFlags` conditions above has been cleared.

## Undecided

The economic relationship between the two assets is a TODO. Specifically: whether a conversion mechanism will exist, who would operate it, whether either asset is intended to track the other's value, which of the two is the primary user-facing token, and whether the 100× difference in supply magnitude is intentional. Until that is written down, treat them as two independent assets from one operator.

## Which repo decides what

Both assets are configured from `config/tokens.json` in [`pondprotocol/rpnd`](https://github.com/pondprotocol/rpnd), which also holds the issuance procedure. The division of authority, stated the same way in both repositories:

| Question | Decided by |
| --- | --- |
| On-ledger parameters and issuance procedure for either asset | `rpnd` — `config/tokens.json` and [`docs/issuance.md`](https://github.com/pondprotocol/rpnd/blob/main/docs/issuance.md) |
| Everything normative about $rPND | `rpnd` — [`docs/rpnd-spec.md`](https://github.com/pondprotocol/rpnd/blob/main/docs/rpnd-spec.md) |
| $PND's holder- and integrator-facing description | this repo |
| $PND token policy that is not an on-ledger parameter, such as the supply target | this repo |

That last row is the subtle one. The 100 billion target is not a field in any transaction, so it cannot live in `rpnd`'s config; it is recorded here as policy. Anything that *is* a transaction field — trust limits, transfer rate, tick size, flags — belongs to `rpnd`, and this repository only describes it.
