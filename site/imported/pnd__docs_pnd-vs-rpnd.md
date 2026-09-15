---
source_repo: pnd
source_path: docs/pnd-vs-rpnd.md
title: $PND and $rPND compared
url: /protocol/two-tokens/
section: Protocol
synced: 2026-09-15
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

`rpnd`'s tooling and docs assume a single cold account issues both assets, and its spec still records the issuer address as a TODO. This repository publishes `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc` as the $PND issuer on the owner's instruction, which said nothing about $rPND.

So the assumption is untested: whether that address is also the $rPND issuer needs the owner's confirmation, and it is worth settling before either issuance, because sharing one account couples the two assets' flags, `Domain`, and reserve exposure. Recorded as an open question here and in `rpnd`.

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
