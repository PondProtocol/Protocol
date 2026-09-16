---
source_repo: pnd
source_path: docs/open-questions.md
source_ref: main
source_sha256: 2027bce551db99d883e1967b63b1b3732f8c572ad0f06052601bf51ccefbda76
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
| Shared issuer for $PND and $rPND (formerly item 11) | **Yes.** `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc` issues both. Confirmed by the owner; live state verified (funded 2.539034 XRP, `Flags` 0, `OwnerCount` 0, nothing configured or issued) | `README.md`, `docs/token-spec.md`, `docs/pnd-vs-rpnd.md`; `rpnd` spec |
| Cold/hot split — Treasury and Operations addresses (formerly item 1) | **Treasury** `rPNDcL2UrGtSoGwruWx6ocMQ6ey8uPZm2b` (holds the 90B escrow) and **Operations** `rPNDAwFzgXzsjvUbVWz1ErB28v9SkcR2in` (holds the 10B liquidity/distribution allocation, creates the AMM pool). Both addresses are decided; **neither account is funded yet** — `account_info` returns `actNotFound` for both on mainnet | `README.md`, `docs/token-spec.md` |
| `pnd.operationalTrustLimit` (formerly item 10) | `rpnd`'s `config/tokens.json` on `main` now sets it to `100000000000` — the full 100 billion — fixed in commit `0d99cd4`. The `1,000,000,000` figure this repo previously recorded was stale | `rpnd` config |

None of these answers is simply "done" in every dimension. The supply figure is settled, but *how it is enforced* is not. The issuer address and the shared-issuer question are settled, and the Treasury/Operations addresses are settled, but none of the three accounts is configured or funded on ledger yet — see [`token-spec.md`](token-spec.md#account-state-on-ledger) before assuming otherwise. Follow-on questions are items 5, 6, and 7 below — item 6 now also carries the blackholing/shared-issuer ordering constraint.

## Pending operator actions

Not unknowns — decisions already made that have not been applied on ledger. Listed because the documented behavior of $PND does not match the account's current state until they are.

- **The issuer `AccountSet` has not been submitted.** Every account flag reads false and `Domain`, `TransferRate`, and `TickSize` are absent. Most visibly, `asfDefaultRipple` is unset, so $PND could not move between holders even once issued. `rpnd`'s `configure-issuer` command exists to apply this.
- **No rehearsal account on testnet or devnet.** The address exists only on mainnet, so any test issuance uses different accounts.

Both are verifiable at any time with `account_info` on the issuer; see [`token-spec.md`](token-spec.md#account-state-on-ledger).

## On-ledger identifiers

Item 1 (operational address) is answered — see [Recently answered](#recently-answered). It resolved to two accounts, not one: Treasury and Operations.

| # | Unknown | Appears in |
| --- | --- | --- |
| 2 | Mainnet `MPTokenIssuanceID` for $rPND, once created | `docs/pnd-vs-rpnd.md` (referenced, not stated) |

## Issuer policy

| # | Unknown | Appears in |
| --- | --- | --- |
| 3 | Freeze policy: individual freeze, global freeze, or permanent `asfNoFreeze` | `docs/token-spec.md`, `docs/trust-lines.md` |
| 4 | Trust line clawback: whether the issuer sets `asfAllowTrustLineClawback`. **Time-sensitive, and confirmed still open** — the funded account reports `allowTrustLineClawback` false with `OwnerCount` 0 and an empty `account_lines`, and this flag can only be set before the first trust line exists | `docs/token-spec.md` |
| 5 | Whether the 100 billion cap is hard or soft, and what mechanism enforces it | `docs/token-spec.md` |
| 6 | Whether the issuer is blackholed after minting the full 100 billion, or stays live for controlled issuance from operational accounts. These pull in opposite directions: blackholing makes the cap permanent and independently verifiable but forfeits all future issuance and flag changes, while a live issuer keeps flexibility and leaves the cap as a promise backed by key custody. **Ordering constraint, now that the shared-issuer question (formerly item 11) is settled:** this account is also the $rPND issuer, and a blackholed account can never sign again, so $rPND's `MPTokenIssuanceCreate` must happen before any blackholing, or $rPND can never be created on this address. The current $rPND config cannot even be created on mainnet today regardless — see [`pnd-vs-rpnd.md`](pnd-vs-rpnd.md#one-issuing-account-or-two) | `docs/token-spec.md`, `docs/pnd-vs-rpnd.md` |
| 7 | What supply-verification procedure holders should treat as canonical. `gateway_balances` on the issuer is the mechanical answer, but which server, what cadence, and whether signed attestations accompany it are undecided | `docs/token-spec.md`, `docs/trust-lines.md`, `docs/integration.md` |
| 8 | What $PND represents: backing, redeemability, and the legal issuing entity | `README.md`, `docs/token-spec.md` |
| 9 | Whether `TransferRate` stays at 0 long term | `docs/integration.md` (integrators are told to read it from the ledger) |

## Cross-repo configuration

Items 10 (`operationalTrustLimit`) and 11 (shared issuer) are answered — see [Recently answered](#recently-answered).

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
