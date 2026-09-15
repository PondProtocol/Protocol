---
source_repo: protocol
source_path: docs/spec/02-accounts-and-roles.md
source_ref: worktree
source_sha256: ff7c90b2cc7212c4ff0eca6d862d8246ab0cb94917946c3fa687db0d75f258be
title: 02 — Accounts and roles
url: /spec/accounts-and-roles/
section: Specification
synced: 2026-09-15
---
# 02 — Accounts and roles

Skeleton. See [conventions](README.md#conventions) for the Documented / Open / TODO labels.

## 2.1 Roles

**Documented** (`rpnd/docs/issuance.md`, `rpnd/src/cli.ts`):

**Issuer (cold).** Holds issuing authority. Submits `AccountSet` to configure itself, `Payment` to issue $PND, `MPTokenIssuanceCreate` to bring $rPND into existence, and `Payment` to mint $rPND. Its seed is meant to stay offline in production. Read from `ISSUER_SEED`. The $PND issuer is `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc`, funded on mainnet with **none of those transactions submitted yet** — see [architecture Live state](../architecture.md#live-state).

**Operational (hot).** Holds distributable inventory of both assets. Submits `TrustSet` for `PND` and `MPTokenAuthorize` for $rPND, and is the source account for routine distribution payments. Read from `OPERATIONAL_SEED`.

**Holder.** Any account that has opted in — `TrustSet` for $PND, `MPTokenAuthorize` for $rPND. The toolkit supports an optional `HOLDER_SEED` for exercising the holder path.

**Open:** whether one account issues both assets. The toolkit signs both with the single `ISSUER_SEED` wallet, and `rpnd`'s README and token spec both state the assets share an issuing account — but that describes the tooling, and the production $rPND issuer is an open decision — [OQ-22](../open-questions.md#oq-22).

**Open:** whether the live deployment separates a hot account at all, and its public address — [OQ-23](../open-questions.md#oq-23). Nothing on ledger reveals one yet: the issuer has no trust lines, so no counterparty account is visible from it.

## 2.2 Authority

**Documented:** authority is exactly what the XRP Ledger grants the issuing account, no more and no less. There is no contract, hook, or off-ledger permission layer. Concretely the issuer can issue $PND without an on-ledger cap — the 100B target is policy, not enforcement — mint $rPND up to `MaximumAmount` in circulation, lock $rPND balances, replace the $rPND metadata blob, and change its own account settings. It cannot claw back $rPND, ever.

Capability flags move in one direction only: `MPTokenIssuanceSet` can turn a flag on but never off. The issuer therefore has no ongoing discretion to *relinquish* an $rPND capability — it can only acquire more. Whatever is enabled at create, or enabled later, is permanent.

**Open:** whether any of that authority should be constrained by policy, and how such a constraint would be made credible to holders given the ledger will not enforce it — [OQ-06](../open-questions.md#oq-06), [OQ-08](../open-questions.md#oq-08), [OQ-18](../open-questions.md#oq-18).

## 2.3 Key custody

**Documented:** the cold/hot split itself, and the instruction to keep the cold seed offline in production. Faucet-generated seeds are written to a gitignored `var/` directory and `fund` refuses to run on mainnet. On ledger, the issuer has no `RegularKey` and its master key is enabled, so custody today rests entirely on the master seed.

**Open:** the actual custody mechanism — hardware wallet, XRPL multi-sign with a defined quorum, `SetRegularKey` rotation, or a third-party custodian — and the legal entity that controls it — [OQ-11](../open-questions.md#oq-11). Neither multi-sign nor regular-key support exists in the toolkit today, so either choice implies work in `rpnd`.

**Open:** key rotation and compromise-response procedure. Nothing is documented.

## 2.4 Account count and separation

**Open:** whether one operational account is the intended end state, or whether distribution, market making, and treasury should be separate accounts — [OQ-23](../open-questions.md#oq-23). The toolkit contemplates exactly one.
