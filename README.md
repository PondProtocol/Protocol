# Pond Protocol

Pond Protocol is the protocol layer that ties together two XRP Ledger assets:

| Token | Ledger type | Identifier | Implementation |
| --- | --- | --- | --- |
| **$PND** | IOU (issued currency on trust lines) | currency code `PND` | [`rpnd`](https://github.com/PondProtocol/rPND) |
| **$rPND** | Multi-Purpose Token (MPT) | ticker `RPND`, plus the `MPTokenIssuanceID` assigned at create time | [`rpnd`](https://github.com/PondProtocol/rPND) |

This repository is the canonical home for the **specification, architecture, and design decisions**. It holds no issuance keys and submits no transactions; the operator tooling lives in the token repos listed below.

> **Status: pre-specification.** The two tokens exist as working, tested XRPL issuance code, and their on-ledger parameters are defined in [`rpnd/config/tokens.json`](https://github.com/PondProtocol/rPND/blob/main/config/tokens.json). The *protocol* that relates them is not yet specified. Everything in `docs/spec/` is a skeleton: it records what is already true on ledger and marks the rest as open. See **[docs/open-questions.md](docs/open-questions.md)** for the decisions that are still owner calls.

## The two-token model

Both tokens are issued from the same cold issuing account on the XRP Ledger, but they are **different kinds of on-ledger object and are not interchangeable on ledger**.

**$PND — IOU.** A classic XRPL issued currency with the standard 3-character code `PND`. Holders must submit a `TrustSet` to the issuer before they can receive it. Amounts are expressed as `{ currency, issuer, value }`, so the issuer's classic address is part of the asset's identity — a different issuer using the code `PND` is a different token. Configured defaults: Default Ripple on, Disallow XRP on, transfer rate 0, tick size 5, 6 display decimals.

**$rPND — MPT.** A Multi-Purpose Token with the XLS-89 ticker `RPND`. Holders must submit an `MPTokenAuthorize` before they can receive it. Amounts are expressed as `{ mpt_issuance_id, value }` in fractional units at an asset scale of 6. Configured defaults: transferable, lockable, transfer fee 0, and **clawback permanently disabled** — the create transaction sets `tifMPTCanClawback` in `ImmutableFlags`, so the issuer cannot enable clawback later.

**What links them today.** The $rPND XLS-89 metadata carries `additional_info.paired_iou_currency = "PND"`. That field is documentation for indexers and operators. As [`rpnd/docs/tokens.md`](https://github.com/PondProtocol/rPND/blob/main/docs/tokens.md) states plainly, *the ledger does not atomically bind the IOU and the MPT*. Any stronger relationship — a peg, a redemption or conversion path, a supply invariant across the two — is a protocol-level design decision that has **not been made or documented anywhere yet**. It is tracked as [OQ-03 and OQ-04](docs/open-questions.md).

## High-level architecture

```
                  ┌───────────────────────────────────────────────┐
   this repo ───▶  │  Specification layer  (protocol)              │
                  │  spec skeleton, architecture, open questions   │
                  └───────────────────────────────────────────────┘
                                       │ describes
                                       ▼
                  ┌───────────────────────────────────────────────┐
                  │  Asset layer                                  │
                  │   $PND   IOU, code PND, trust lines           │
                  │   $rPND  MPT, ticker RPND, MPTokenIssuanceID  │
                  │   link:  paired_iou_currency (metadata only)   │
                  └───────────────────────────────────────────────┘
                            │                          │
              ┌─────────────┘                          └──────────────┐
              ▼                                                       ▼
┌──────────────────────────────┐                  ┌──────────────────────────────┐
│  Issuance / operations       │                  │  Metadata & discovery        │
│  (rpnd toolkit)              │                  │  XLS-26 xrp-ledger.toml      │
│  cold issuer  → AccountSet,  │                  │    at /.well-known/, linked  │
│    Payment, MPTokenIssuance- │                  │    by issuer Domain          │
│    Create                    │                  │  XLS-89 MPTokenMetadata      │
│  hot operational → TrustSet, │                  │    hex blob on ledger,       │
│    MPTokenAuthorize, holds   │                  │    1024-byte cap             │
│    inventory                 │                  └──────────────────────────────┘
└──────────────────────────────┘
              │
              ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│  XRP Ledger.  $rPND requires the MPTokens amendment; the toolkit defaults to  │
│  Devnet and flags Testnet as not MPT-capable.                                 │
└───────────────────────────────────────────────────────────────────────────────┘
```

Two roles carry authority, following standard XRPL practice:

- **Issuer (cold)** — runs `AccountSet`, issues $PND, and creates $rPND. Its seed is meant to stay offline in production.
- **Operational (hot)** — opens the $PND trust line, authorizes $rPND, and holds inventory for distribution.

Not shown, because it does not exist yet: any layer that performs settlement, redemption, or conversion between the two assets, and any holder-facing distribution mechanism. See [docs/architecture.md](docs/architecture.md) for the longer version and [docs/open-questions.md](docs/open-questions.md) for what is undefined.

## Repo map

| Repo | Role | State |
| --- | --- | --- |
| [`protocol`](https://github.com/PondProtocol/Protocol) | This repo. Specification, architecture, design decisions, open questions. Normative source for the protocol. | Scaffolding |
| [`rpnd`](https://github.com/PondProtocol/rPND) | XRPL issuance toolkit for **both** tokens: `config/tokens.json`, XLS-26 / XLS-89 metadata, transaction builders, and an operator CLI (`fund`, `configure-issuer`, `issue-pnd`, `issue-rpnd`, `authorize-rpnd`, `send-pnd`, `send-rpnd`, `status`, `dry-run`). Self-described operator source of truth for token config. | Working, tested; Devnet-verified |
| [`pnd`](https://github.com/PondProtocol/PND) | Intended for $PND. Currently an empty stub. Its scope overlaps `rpnd`, which already ships $PND tooling — see [OQ-16](docs/open-questions.md). | Stub |
| [`.github`](https://github.com/PondProtocol/.github) | Org profile and shared GitHub configuration. | Stub |

Where this repo and a token repo disagree about on-ledger parameters, treat `rpnd/config/tokens.json` as authoritative until [OQ-17](docs/open-questions.md) is decided, and open an issue about the drift.

## Documentation

- [docs/architecture.md](docs/architecture.md) — layers, roles, transaction flow, trust boundaries
- [docs/spec/](docs/spec/README.md) — specification skeleton, one file per area
- [docs/open-questions.md](docs/open-questions.md) — every open design question and TODO, with IDs
- [docs/glossary.md](docs/glossary.md) — XRPL and Pond Protocol terms
- [CONTRIBUTING.md](CONTRIBUTING.md) — how to propose changes, and the rule against writing undecided design as settled fact

## Networks

$rPND depends on the MPTokens amendment. In `rpnd/config/tokens.json`, Devnet and mainnet are marked `supportsMpt: true` and Testnet is marked `supportsMpt: false`; the mainnet flag has not been verified against live amendment status ([TD-03](docs/open-questions.md)). Devnet is the default for all scripted issuance. Mainnet issuance is a separate, reviewed operation with no faucet command, and no mainnet deployment has happened.

## License

Apache-2.0. See [LICENSE](LICENSE).
