---
source_repo: pnd
source_path: docs/open-questions.md
source_ref: main
source_sha256: 502a568657a2c42c55a60542a01a67d396896726fce5e19f6c063efc3472d0eb
title: Open questions — $PND
url: /open-questions/pnd/
section: Project status
synced: 2026-09-16
---
# Open questions

Every value in this repository that is not yet decided or not yet public, in one place. Each entry says where the placeholder appears so the edit is mechanical once the answer exists.

Nothing in this list has been filled in with a guess. If a number, address, or date is absent from the repo, it is because it is genuinely unknown, not because it was omitted for brevity.

## Recently answered

| Item | Value | Recorded in |
| --- | --- | --- |
| Issuing account for $PND | `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc` (checksum valid; funded on mainnet, no `AccountSet` applied, nothing issued; absent on testnet and devnet) | `README.md`, `docs/token-spec.md`, `docs/trust-lines.md`, `docs/integration.md`, `SECURITY.md` |
| Target supply | 100,000,000,000 $PND, as issuer policy rather than a ledger cap | `README.md`, `docs/token-spec.md` |

Neither answer is simply "done". The supply figure is settled, but *how it is enforced* is not, and the issuer address is settled while the cold/hot split and the shared-account assumption are not. Those follow-on questions are items 1, 5, 6, 7, 10, and 11 below.

## Pending operator actions

Not unknowns — decisions already made that have not been applied on ledger. Listed because the documented behavior of $PND does not match the account's current state until they are.

- **The issuer `AccountSet` has not been submitted.** Every account flag reads false and `Domain`, `TransferRate`, and `TickSize` are absent. Most visibly, `asfDefaultRipple` is unset, so $PND could not move between holders even once issued. `rpnd`'s `configure-issuer` command exists to apply this.
- **No rehearsal account on testnet or devnet.** The address exists only on mainnet, so any test issuance uses different accounts.

Both are verifiable at any time with `account_info` on the issuer; see [`token-spec.md`](token-spec.md#account-state-on-ledger).

## On-ledger identifiers

| # | Unknown | Appears in |
| --- | --- | --- |
| 1 | Operational (hot) distribution address. The cold/hot split has not been made, so the published address currently serves as issuer with no separate distributor | `README.md`, `docs/token-spec.md` |
| 2 | Mainnet `MPTokenIssuanceID` for $rPND, once created | `docs/pnd-vs-rpnd.md` (referenced, not stated) |

## Issuer policy

| # | Unknown | Appears in |
| --- | --- | --- |
| 3 | Freeze policy: individual freeze, global freeze, or permanent `asfNoFreeze` | `docs/token-spec.md`, `docs/trust-lines.md` |
| 4 | Trust line clawback: whether the issuer sets `asfAllowTrustLineClawback`. **Time-sensitive, and confirmed still open** — the funded account reports `allowTrustLineClawback` false with `OwnerCount` 0 and an empty `account_lines`, and this flag can only be set before the first trust line exists | `docs/token-spec.md` |
| 5 | Whether the 100 billion cap is hard or soft, and what mechanism enforces it | `docs/token-spec.md` |
| 6 | Whether the issuer is blackholed after minting the full 100 billion, or stays live for controlled issuance from operational accounts. These pull in opposite directions: blackholing makes the cap permanent and independently verifiable but forfeits all future issuance and flag changes, while a live issuer keeps flexibility and leaves the cap as a promise backed by key custody | `docs/token-spec.md` |
| 7 | What supply-verification procedure holders should treat as canonical. `gateway_balances` on the issuer is the mechanical answer, but which server, what cadence, and whether signed attestations accompany it are undecided | `docs/token-spec.md`, `docs/trust-lines.md`, `docs/integration.md` |
| 8 | What $PND represents: backing, redeemability, and the legal issuing entity | `README.md`, `docs/token-spec.md` |
| 9 | Whether `TransferRate` stays at 0 long term | `docs/integration.md` (integrators are told to read it from the ledger) |

## Cross-repo configuration

| # | Unknown | Appears in |
| --- | --- | --- |
| 10 | `pnd.operationalTrustLimit` in `rpnd`'s `config/tokens.json` is 1,000,000,000 — one hundredth of the 100 billion target, so a single operational account with that limit cannot take delivery of the full supply. Decide whether to raise the limit, distribute across multiple accounts, or leave it as a deliberate per-account ceiling. The change belongs in `rpnd`, not here | `rpnd` config; consequence noted in `docs/token-spec.md` |
| 11 | Whether `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc` is also the $rPND issuer. `rpnd`'s tooling assumes one cold account issues both assets and its [`docs/rpnd-spec.md`](https://github.com/pondprotocol/rpnd/blob/main/docs/rpnd-spec.md#identity) still records the issuer as a TODO. The owner published this address for $PND only. Sharing one account couples the two assets' flags, `Domain`, and reserve exposure, so confirm before either issuance — and fill in `rpnd`'s spec at the same time | `docs/pnd-vs-rpnd.md`; `rpnd` spec |

## Publication and identity

| # | Unknown | Appears in |
| --- | --- | --- |
| 12 | Issuer `Domain` and the host serving `/.well-known/xrp-ledger.toml`. Until this exists, the published issuer address cannot be independently confirmed | `README.md`, `docs/token-spec.md`, `docs/integration.md`, `SECURITY.md` |
| 13 | Canonical logo/icon asset and its public URL | `docs/integration.md` |
| 14 | Public website and community links | `README.md` |
| 15 | Security and disclosure contact | `SECURITY.md` |
| 16 | Listings and integration contact | `docs/integration.md` |

## Timeline and relationship to $rPND

| # | Unknown | Appears in |
| --- | --- | --- |
| 17 | Mainnet issuance date for $PND, and when the issuer account gets funded | `README.md`, `docs/token-spec.md` |
| 18 | Economic relationship between $PND and $rPND: conversion mechanism, operator, which is the primary user-facing token, and whether the 100× gap between the $PND target and $rPND's configured `MaximumAmount` is intentional. `rpnd` records the same question in [`docs/rpnd-spec.md`](https://github.com/pondprotocol/rpnd/blob/main/docs/rpnd-spec.md#relationship-to-pnd) | `docs/pnd-vs-rpnd.md` |
| 19 | Whether the `protocol` repo will specify $PND's role in protocol mechanics, and where that spec will live | `README.md` (relationship described only in general terms) |

## Deliberately absent

These are not TODOs. They are claims this repository will not make until they are true:

- No audit has been performed, so no audit status or report is referenced.
- No exchange listing or liquidity venue is named.
- No price, market cap, valuation, or yield figure appears anywhere.
- The 100 billion figure is never described as on-chain, hard-capped, or ledger-enforced, because for an XRPL IOU it cannot be.
- The `initialIssuance` value in `rpnd`'s config is a Devnet rehearsal default of 1,000,000 and is never presented as a supply figure.
- No claim is made that the published issuer address is controlled by any particular party. A valid checksum and a `rPND` prefix are not evidence of control.

## Closing an item

When a value becomes known: replace the `TODO` text in the files listed above, delete the row here, and note the change in the commit message. When an item is resolved as a deliberate decision rather than a value — for example choosing never to enable freeze — record the decision in `docs/token-spec.md` instead of simply removing the row, since holders care about the commitment.
