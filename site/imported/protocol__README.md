---
source_repo: protocol
source_path: README.md
source_ref: worktree
source_sha256: 90ee7247cc4ac6193f8928e4b24f51c35115ae9e58b0a7133cb4fe4dd8c185e6
title: Overview
url: /protocol/
section: Protocol
synced: 2026-09-15
---
# Pond Protocol

Pond Protocol is the protocol layer that ties together two XRP Ledger assets:

| Token | Ledger type | Identifier | Implementation |
| --- | --- | --- | --- |
| **$PND** | IOU (issued currency on trust lines) | currency code `PND` | [`rpnd`](https://github.com/PondProtocol/rPND) |
| **$rPND** | Multi-Purpose Token (MPT) | ticker `RPND`, plus the `MPTokenIssuanceID` assigned at create time | [`rpnd`](https://github.com/PondProtocol/rPND) |

Pond Protocol is the umbrella brand for both assets, and this repository is the canonical home for the **specification, architecture, and design decisions**. It holds no issuance keys, no machine-readable token parameters, and submits no transactions; the operator tooling lives in the token repos listed below.

> **Status: pre-issuance.** Neither token exists on ledger. The issuer account `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc` is funded on mainnet and completely unconfigured — no `AccountSet`, no trust lines, no obligations, no MPT issuance. What exists is working, tested issuance *tooling* plus the parameters it would submit, defined in [`rpnd/config/tokens.json`](https://github.com/PondProtocol/rPND/blob/main/config/tokens.json). Configured values are intent, not live properties: see **[Live state](docs/architecture.md#live-state)** for the verified snapshot and the queries to re-check it.
>
> The *protocol* that relates the two tokens is not yet specified. Everything in `docs/spec/` is a skeleton. See **[docs/open-questions.md](docs/open-questions.md)** for the decisions that are still owner calls.
>
> **Sequencing:** **$PND launches first**; $rPND design work follows. The near-term open questions are therefore the $PND ones — what the IOU represents, freeze policy, custody, the domain, and distribution.
>
> **Blocking the $rPND create, not the first launch:** $PND targets a supply of 100B while $rPND's provisional `MaximumAmount` is 1B in circulation — a 100:1 difference with no documented relationship. The $rPND figure is a working default that has never been issued, but it becomes permanent at create time. See [OQ-21](docs/open-questions.md#oq-21).

## The two-token model

The two assets are **different kinds of on-ledger object and are not interchangeable on ledger**.

**$PND — IOU.** A classic XRPL issued currency with the standard 3-character code `PND`, to be issued by `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc`. Holders must submit a `TrustSet` to the issuer before they can receive it. Amounts are expressed as `{ currency, issuer, value }`, so the issuer's classic address is part of the asset's identity — a different issuer using the code `PND` is a different token. Supply targets 100,000,000,000 as **issuer policy**, not as a ledger constraint: the XRP Ledger stores no supply field for an IOU, so circulating supply is measured as the issuer's outstanding obligations via `gateway_balances`. The issuer's intended settings — Default Ripple, Disallow XRP, transfer rate 0, tick size 5 — are **config intent and not yet applied**; see [Live state](docs/architecture.md#live-state).

**$rPND — MPT.** A Multi-Purpose Token with the XLS-89 ticker `RPND`, **not yet created**. Holders would opt in with `MPTokenAuthorize`, and amounts are expressed as `{ mpt_issuance_id, value }` in base units at an asset scale of 6. The create transaction would make it transferable and lockable with transfer fee 0 and **clawback permanently disabled** via `tifMPTCanClawback` in `ImmutableFlags`. Capability flags are one-way, so whatever is enabled at create is permanent and the unset flags can be added later but never withdrawn. `MaximumAmount` caps circulating supply rather than cumulative issuance, since burns free headroom to mint again. Its supply parameters are working defaults; [`rpnd/docs/rpnd-spec.md`](https://github.com/PondProtocol/rPND/blob/main/docs/rpnd-spec.md) calls them "not ratified economics."

The issuance toolkit signs transactions for both assets with one configured issuer wallet. Whether the production $rPND issuance comes from the same account as $PND, and whether the live deployment has a separate operational account, are still open — [OQ-22](docs/open-questions.md#oq-22) and [OQ-23](docs/open-questions.md#oq-23).

**What links them today.** The $rPND XLS-89 metadata carries `additional_info.paired_iou_currency = "PND"`. That field is documentation for indexers and operators. As [`rpnd/docs/tokens.md`](https://github.com/PondProtocol/rPND/blob/main/docs/tokens.md) states plainly, *the ledger does not atomically bind the IOU and the MPT*, and `rpnd/docs/rpnd-spec.md` adds that a $PND balance confers no claim on $rPND or the reverse. Any stronger relationship — a peg, a redemption or conversion path, a supply invariant across the two — is a protocol-level design decision that has **not been made or documented anywhere yet**. Tracked as [OQ-03](docs/open-questions.md#oq-03) and [OQ-04](docs/open-questions.md#oq-04) in mechanism terms, and [OQ-21](docs/open-questions.md#oq-21) in supply terms.

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

Two roles carry authority in the procedure the toolkit implements, following standard XRPL practice:

- **Issuer (cold)** — runs `AccountSet`, issues $PND, and creates $rPND. Its seed is meant to stay offline in production. For $PND this is `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc`.
- **Operational (hot)** — opens the $PND trust line, authorizes $rPND, and holds inventory for distribution. No public address for the live deployment ([OQ-23](docs/open-questions.md#oq-23)).

Not shown, because it does not exist yet: any layer that performs settlement, redemption, or conversion between the two assets, and any holder-facing distribution mechanism. See [docs/architecture.md](docs/architecture.md) for the longer version and [docs/open-questions.md](docs/open-questions.md) for what is undefined.

## Repo map

| Repo | Role | State |
| --- | --- | --- |
| [`protocol`](https://github.com/PondProtocol/Protocol) | This repo. Specification, architecture, design decisions, open questions. Intended normative source for the protocol layer. | Scaffolding |
| [`rpnd`](https://github.com/PondProtocol/rPND) | Reference for **$rPND** ([token spec](https://github.com/PondProtocol/rPND/blob/main/docs/rpnd-spec.md), [MPT vs IOU](https://github.com/PondProtocol/rPND/blob/main/docs/mpt-vs-iou.md)), and the issuance toolkit for **both** tokens: `config/tokens.json`, XLS-26 / XLS-89 metadata, transaction builders, and an operator CLI (`fund`, `configure-issuer`, `issue-pnd`, `issue-rpnd`, `authorize-rpnd`, `send-pnd`, `send-rpnd`, `status`, `dry-run`). Operator source of truth for on-ledger config. | Working, tested; Devnet-verified |
| [`pnd`](https://github.com/PondProtocol/PND) | Token-facing reference for **$PND**: [token spec](https://github.com/PondProtocol/PND/blob/main/docs/token-spec.md), [trust-line guide](https://github.com/PondProtocol/PND/blob/main/docs/trust-lines.md), [integration guide](https://github.com/PondProtocol/PND/blob/main/docs/integration.md), and a [$PND / $rPND comparison](https://github.com/PondProtocol/PND/blob/main/docs/pnd-vs-rpnd.md). | Documented |
| [`.github`](https://github.com/PondProtocol/.github) | Live [org profile](https://github.com/PondProtocol/.github/blob/main/profile/README.md), plus the org-wide [security policy](https://github.com/PondProtocol/.github/blob/main/SECURITY.md), code of conduct, and issue / PR templates including one for token parameter changes. | Documented |

**Authority.** `rpnd/config/tokens.json` and `rpnd/src/issuance.ts` are authoritative on any config mismatch, in this repo or any other. `pnd` is the token-facing reference for $PND, `rpnd/docs/rpnd-spec.md` for $rPND. This repo restates values for readers and defines none. If you find a discrepancy, the config is right — fix the document and see [OQ-17](docs/open-questions.md#oq-17), which is about detecting drift rather than adjudicating it.

## Documentation

- [docs/architecture.md](docs/architecture.md) — layers, roles, transaction flow, trust boundaries
- [docs/spec/](docs/spec/README.md) — specification skeleton, one file per area
- [docs/open-questions.md](docs/open-questions.md) — every open design question and TODO, with IDs
- [docs/glossary.md](docs/glossary.md) — XRPL and Pond Protocol terms
- [docs/hosting-decision.md](docs/hosting-decision.md) — where to host the documentation site and the `/.well-known/xrp-ledger.toml` identity anchor, with verified CORS evidence per host. Awaiting an owner decision
- [CONTRIBUTING.md](CONTRIBUTING.md) — how to propose changes, and the rule against writing undecided design as settled fact

## Documentation site

[`site/`](site/) builds a static documentation site that aggregates the docs from all three repos
and serves the XLS-26 `xrp-ledger.toml`. Nothing is deployed yet: the domain is undecided and the
host is an owner decision. See [site/README.md](site/README.md) to build it locally and
[docs/hosting-decision.md](docs/hosting-decision.md) for the recommendation.

## Networks

$rPND depends on the MPTokens amendment. In `rpnd/config/tokens.json`, Devnet and mainnet are marked `supportsMpt: true` and Testnet is marked `supportsMpt: false`; the mainnet flag has not been verified against live amendment status ([TD-03](docs/open-questions.md#td-03)). Devnet is the default for all scripted issuance.

The issuer account exists on **mainnet only** — it is `actNotFound` on both Testnet and Devnet, so nothing rehearsed on a test network shares its identity. Mainnet issuance is a separate, reviewed operation with no faucet command, and nothing has been issued there.

## License

Apache-2.0. See [LICENSE](LICENSE).
