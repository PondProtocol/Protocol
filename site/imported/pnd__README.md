---
source_repo: pnd
source_path: README.md
source_ref: main
source_sha256: 1b6852400e8f8013fcac88b3650b931381e1ce3b735d47e0b6b519ac1690603b
title: Overview
url: /pnd/overview/
section: $PND — issued currency
synced: 2026-09-16
---
# PND

**$PND** is the IOU token of Pond Protocol: a classic XRP Ledger issued currency that holders keep on a trust line to the Pond Protocol issuing account.

This repository is the token-facing reference for $PND — what the asset is, how it is identified on ledger, and what a wallet, exchange, indexer, or holder needs in order to integrate it correctly. The transaction tooling that actually issues the token lives in [`pondprotocol/rpnd`](https://github.com/pondprotocol/rpnd).

| | |
| --- | --- |
| Ledger type | Issued currency (IOU) on a trust line |
| Currency code | `PND` (standard 3-character code) |
| Issuer | `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc` — funded on mainnet, no configuration applied |
| Target supply | 100,000,000,000 $PND — an issuer policy target, not a ledger-enforced cap |
| Networks in use | XRPL Devnet for rehearsal; mainnet issuance is not live |
| Transfer fee | `TransferRate` 0 in the current issuer config |
| Display decimals | 6 (a metadata display hint, not a ledger limit) |
| Metadata | XLS-26 `xrp-ledger.toml` served from the issuer `Domain` — TODO: domain not published yet |

## What $PND is

On the XRP Ledger, an issued currency is a balance recorded on a trust line between two accounts. $PND is exactly that: the currency code `PND` issued by one specific Pond Protocol account. It is not a smart-contract token and it has no bytecode. Its identity is the pair (currency code, issuer address), so a `PND` balance issued by any other account is a different asset that happens to share a ticker.

Because an IOU is a claim on its issuer, three things matter more than the ticker: which account issues it, what that issuer promises to honor, and what flags the issuer set on itself. The issuing account is `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc`; what $PND represents is a policy question that has not been published; the flags are documented in [`docs/token-spec.md`](docs/token-spec.md).

That account now exists on mainnet and holds XRP, but it is otherwise untouched: no `AccountSet` has been applied, so every account flag reads false, there is no `Domain`, `TransferRate`, or `TickSize`, and no $PND has been issued. Funded is a long way from configured — in particular, `asfDefaultRipple` is not set, which means $PND could not circulate between holders even if it existed. On testnet and devnet the address does not exist at all.

Confirm the state yourself with `account_info` against the issuer rather than trusting this file; [`docs/token-spec.md`](docs/token-spec.md) gives the request and explains what each field means.

## Issuance and trust lines

The issuance model follows standard XRPL gateway practice:

1. The **issuer** sets its account flags once (`AccountSet`). It is the address that appears in every $PND amount: `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc`.
2. An **operational (hot) account** opens a trust line to the issuer, receives the initial issuance, and distributes from there. The published address above is the issuer; the operational address is a TODO, because the cold/hot split has not been made yet.
3. Any other **holder** must submit their own `TrustSet` for `PND` / issuer before they can receive the token. There is no way for the issuer to push $PND to an account that has not opened a trust line.
4. Issuance is a `Payment` from the issuer. New $PND exists the moment the issuer pays it out, and the outstanding amount is the sum of the issuer's negative trust line balances rather than a stored supply field.

[`docs/trust-lines.md`](docs/trust-lines.md) has the holder-side detail, including rippling, trust limits, and reserve implications. [`docs/integration.md`](docs/integration.md) covers the amount encoding and the mistakes that break integrations.

## Supply

The target supply of $PND is **100,000,000,000** (100 billion).

Read that as a commitment by the issuer, not as a property of the token. The XRP Ledger has no supply field for an issued currency and no way to cap one: an IOU exists because the issuer paid it out, so outstanding supply is simply the total the issuer currently owes across its trust lines. The ledger will let the issuer create the 100,000,000,001st $PND exactly as readily as the first.

What that means in practice:

- **Outstanding supply is observable.** `gateway_balances` on the issuer reports its obligations at a given ledger, so anyone can check the live figure against the 100 billion target without trusting a listing page. Today it reports no obligations at all, because nothing has been issued.
- **The cap is enforced by whatever the issuer does with its keys**, which is operational discipline. Some designs make it verifiable — minting the full supply once and then blackholing the issuer makes the number permanent and checkable — and others keep the issuer live for controlled issuance, which keeps flexibility and leaves the cap as a promise. Those are opposing choices and the owner has not made one; both, plus the exact enforcement mechanism, are open items in [`docs/open-questions.md`](docs/open-questions.md).

[`docs/token-spec.md`](docs/token-spec.md) covers how the figure interacts with precision, which matters above 1 billion.

## Relationship to $rPND

Pond Protocol has two distinct XRPL assets. They are related by intent and documentation, not by any ledger primitive:

| | $PND | $rPND |
| --- | --- | --- |
| Ledger type | IOU / issued currency | Multi-Purpose Token (MPT) |
| Identifier | currency code `PND` + issuer address | `MPTokenIssuanceID` (ticker `RPND`) |
| Holder opt-in | `TrustSet` | `MPTokenAuthorize` |
| Amount shape | `{ currency, issuer, value }` | `{ mpt_issuance_id, value }` |
| Supply limit | 100 billion policy target; no ledger cap exists | `MaximumAmount`, fixed by the ledger at creation |

The $rPND metadata records `paired_iou_currency: "PND"`, which is a hint for indexers and operators. The ledger does not enforce any peg, conversion, or atomic binding between the two, and no conversion mechanism is specified yet — see [`docs/pnd-vs-rpnd.md`](docs/pnd-vs-rpnd.md).

## Repositories

| Repo | Role |
| --- | --- |
| [`pnd`](https://github.com/pondprotocol/pnd) | This repo — $PND the IOU, for holders and integrators |
| [`rpnd`](https://github.com/pondprotocol/rpnd) | $rPND the MPT, plus the operator source of truth for on-ledger config and issuance tooling for both tokens |
| [`protocol`](https://github.com/pondprotocol/protocol) | Pond Protocol design and mechanics |

Where the two disagree about an on-ledger parameter, `rpnd`'s `config/tokens.json` wins; this repo describes it, it does not configure it. Token policy that is not an on-ledger field — the supply target, for instance — is recorded here instead, because it corresponds to no transaction field. Please open an issue when you spot a mismatch.

Useful reading in `rpnd`: [`docs/rpnd-spec.md`](https://github.com/pondprotocol/rpnd/blob/main/docs/rpnd-spec.md) for the normative $rPND spec, [`docs/mpt-vs-iou.md`](https://github.com/pondprotocol/rpnd/blob/main/docs/mpt-vs-iou.md) for why $rPND is an MPT while $PND stays an IOU, and [`docs/issuance.md`](https://github.com/pondprotocol/rpnd/blob/main/docs/issuance.md) for the operator procedure.

## Docs

- [`docs/token-spec.md`](docs/token-spec.md) — asset identity, issuer flags, supply, precision, and amount encoding
- [`docs/trust-lines.md`](docs/trust-lines.md) — how to hold, receive, and send $PND
- [`docs/integration.md`](docs/integration.md) — wallet, exchange, and indexer integration notes
- [`docs/pnd-vs-rpnd.md`](docs/pnd-vs-rpnd.md) — how the IOU and the MPT differ and where they overlap
- [`docs/open-questions.md`](docs/open-questions.md) — every unresolved value in this repo, in one list

## Status

$PND is pre-issuance. The issuer address and the 100 billion supply target are published, and the issuing account is funded on mainnet; no configuration has been applied to it, no $PND has been issued, and no launch date, listing, or audit exists. Nothing here has been audited. Values that are not yet decided appear as explicit `TODO` markers, all of them collected in [`docs/open-questions.md`](docs/open-questions.md).

Any $PND-branded token you find on mainnet today is unverified, including one issued by the address above: publishing an address in a README proves nothing on its own. The check becomes meaningful when the issuer's `Domain` is set and a matching `xrp-ledger.toml` is served from that host, which pairs the account with a domain that the operator demonstrably controls.

## Contributing

Documentation corrections and integration reports are welcome — see [`CONTRIBUTING.md`](CONTRIBUTING.md). For anything key-, issuer-, or impersonation-related, follow [`SECURITY.md`](SECURITY.md) instead of opening a public issue.

## License

Apache-2.0. See [`LICENSE`](LICENSE).
