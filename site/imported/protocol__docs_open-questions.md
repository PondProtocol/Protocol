---
source_repo: protocol
source_path: docs/open-questions.md
source_ref: worktree
source_sha256: 4059f422bcd3155ea076387dea94e3d8bdbd5b91ce675234fd3be11862eebb92
title: Open questions
url: /open-questions/
section: Project status
synced: 2026-09-16
---
# Open questions and TODOs

Items on this page are **undecided**, except where marked in [Decided](#decided). Nothing undecided should be treated as a plan or a hint at a plan — the point of the page is to keep undecided design out of the spec until an owner decides it.

Three kinds of item:

- **OQ-nn — open design questions.** Someone has to make a call. Most block a spec section.
- **TD-nn — TODOs.** The decision is made or mechanical; the work has not been done.
- **Decided.** Resolved items, kept with their original id because other documents link to them.

Each item records *what the repos document today* (with a citation, so the ground truth is checkable) and *what is missing*. Ids are stable and are never reused.

Citations below name files by path. All of them are on `main` in their repos:

| Path | Link |
| --- | --- |
| `rpnd/config/tokens.json` | [config/tokens.json](https://github.com/PondProtocol/rPND/blob/main/config/tokens.json) |
| `rpnd/docs/rpnd-spec.md` | [docs/rpnd-spec.md](https://github.com/PondProtocol/rPND/blob/main/docs/rpnd-spec.md) |
| `rpnd/docs/tokens.md`, `rpnd/docs/issuance.md` | [tokens.md](https://github.com/PondProtocol/rPND/blob/main/docs/tokens.md), [issuance.md](https://github.com/PondProtocol/rPND/blob/main/docs/issuance.md) |
| `pnd/docs/token-spec.md` | [docs/token-spec.md](https://github.com/PondProtocol/PND/blob/main/docs/token-spec.md) |
| `pnd/docs/pnd-vs-rpnd.md` | [docs/pnd-vs-rpnd.md](https://github.com/PondProtocol/PND/blob/main/docs/pnd-vs-rpnd.md) |
| `pnd/docs/open-questions.md` | [docs/open-questions.md](https://github.com/PondProtocol/PND/blob/main/docs/open-questions.md) |
| `pnd/docs/integration.md`, `pnd/scripts/check-docs.mjs` | [integration.md](https://github.com/PondProtocol/PND/blob/main/docs/integration.md), [check-docs.mjs](https://github.com/PondProtocol/PND/blob/main/scripts/check-docs.mjs) |
| `.github/SECURITY.md` | [SECURITY.md](https://github.com/PondProtocol/.github/blob/main/SECURITY.md) |

## Blocking now

**$PND launches first** ([OQ-15](#oq-15)), so the near-term blockers are the $PND ones: what the IOU represents ([OQ-05](#oq-05)), freeze and trust-line-clawback policy before the issuer's first trust line ([OQ-08](#oq-08)), custody ([OQ-11](#oq-11)), the domain and metadata publication ([OQ-12](#oq-12), [TD-02](#td-02)), and distribution ([OQ-13](#oq-13)).

**[OQ-21](#oq-21) — the supply scale relationship between the two tokens** is the one to answer before any $rPND create, though not before the $PND launch. $PND has a policy target of 100,000,000,000 (100B); $rPND's config carries a `MaximumAmount` of 1,000,000,000 display units, labelled a working default and never issued on ledger. That is a 100:1 difference with no documented relationship, and `MaximumAmount` becomes permanent at `MPTokenIssuanceCreate`.

## Index

| ID | Item | Blocks |
| --- | --- | --- |
| [OQ-01](#oq-01) | What is Pond Protocol, and where does its scope end? | [spec/README](spec/README.md), [architecture](architecture.md) |
| [OQ-03](#oq-03) | What is the economic relationship between $PND and $rPND? | [spec/04](spec/04-token-relationship.md) |
| [OQ-04](#oq-04) | Why two tokens? Which one is holder-facing? | [spec/04](spec/04-token-relationship.md) |
| [OQ-05](#oq-05) | Is $PND a claim on anything off ledger, and who is the obligor? | [spec/01](spec/01-tokens.md), [spec/04](spec/04-token-relationship.md) |
| [OQ-07](#oq-07) | Fee policy: are transfer rate 0 and transfer fee 0 permanent? | [spec/03](spec/03-issuance-and-supply.md) |
| [OQ-08](#oq-08) | Freeze and lock policy, and who may invoke it? | [spec/07](spec/07-security-considerations.md) |
| [OQ-09](#oq-09) | Is holding permissionless, or authorization-gated? | [spec/01](spec/01-tokens.md) |
| [OQ-10](#oq-10) | Should $rPND metadata be frozen, and when? | [spec/05](spec/05-metadata-and-discovery.md) |
| [OQ-11](#oq-11) | Legal issuing entity and key custody policy. | [spec/02](spec/02-accounts-and-roles.md), [spec/07](spec/07-security-considerations.md) |
| [OQ-12](#oq-12) | Canonical public domain and production asset URLs. | [spec/05](spec/05-metadata-and-discovery.md) |
| [OQ-13](#oq-13) | How do tokens reach holders? | [spec/03](spec/03-issuance-and-supply.md) |
| [OQ-14](#oq-14) | Liquidity: DEX, AMM, or neither? | [spec/04](spec/04-token-relationship.md) |
| [OQ-15](#oq-15) | Mainnet launch criteria and sequencing. | [spec/03](spec/03-issuance-and-supply.md) |
| [OQ-17](#oq-17) | Drift control between the spec and the authoritative config. | Repo map, [spec/06](spec/06-governance-and-change-control.md) |
| [OQ-18](#oq-18) | Governance, change control, and spec versioning. | [spec/06](spec/06-governance-and-change-control.md) |
| [OQ-19](#oq-19) | Pre-mainnet audit of issuance and custody. | [spec/07](spec/07-security-considerations.md) |
| [OQ-20](#oq-20) | Repo visibility and license choice for a spec repo. | This repo |
| [OQ-21](#oq-21) | **Supply scale relationship between $PND and $rPND.** | [spec/03](spec/03-issuance-and-supply.md), [spec/04](spec/04-token-relationship.md) |
| [OQ-24](#oq-24) | Should on-ledger `issuer_name` read "Pond Protocol"? | [spec/05](spec/05-metadata-and-discovery.md) |
| [OQ-25](#oq-25) | Bot-ops account: does it exist yet, and is Operations ever further subdivided? | [spec/02](spec/02-accounts-and-roles.md) |

Decided: [OQ-02](#oq-02), [OQ-06](#oq-06), [OQ-15](#oq-15) (sequencing), [OQ-16](#oq-16), [OQ-22](#oq-22) (shared issuer), [OQ-23](#oq-23) (Treasury/Operations split and addresses). Completed: [TD-06](#td-06), [TD-07](#td-07), [TD-08](#td-08), [TD-11](#td-11).

Every item that touches a configured value now distinguishes what the config intends from what is on ledger now. The verified snapshot and the queries to refresh it are in [architecture Live state](architecture.md#live-state); [TD-12](#td-12) tracks auditing the other repos for the same error.

## Identity and scope

### OQ-01

**What is Pond Protocol, and where does its scope end?**

Documented today: the brand and repo roles are settled ([OQ-02](#oq-02)), and both token repos now describe their own asset. What no repo describes is a protocol *mechanism* above the two tokens. `pnd/docs/open-questions.md` item 16 asks the same thing from the other side: whether this repo will specify $PND's role in protocol mechanics, and where that spec will live.

Undecided: whether Pond Protocol is (a) a naming umbrella over two independently issued tokens, (b) a token system with defined mechanics relating them, or (c) something larger including an application, settlement venue, or governance body. Most items below narrow once this is answered, so answer it first.

## Token model and economics

### OQ-03

**What is the economic relationship between $PND and $rPND?**

Documented today, and now consistently across three repos: the only link is `additional_info.paired_iou_currency = "PND"` in the $rPND metadata, which is a hint for indexers. `rpnd/docs/rpnd-spec.md` states that "the ledger enforces no ratio, no peg, and no atomic conversion between an IOU and an MPT" and that "a $PND balance confers no claim on $rPND or the reverse." `pnd/docs/pnd-vs-rpnd.md` says the same and adds that anything behaving as if $rPND is a wrapped or redeemable form of $PND "is asserting a mechanism that does not exist on ledger today."

Undecided: whether a conversion or redemption path will exist, in which direction, at what ratio, who operates it, and whether a supply invariant ties the two — or whether the answer is that no relationship exists and they are two independent assets from one operator. `rpnd/docs/rpnd-spec.md` carries the same question as an owner TODO. Closely related to [OQ-21](#oq-21), which is the same question expressed in supply figures.

### OQ-04

**Why two tokens, and which one is holder-facing?**

Documented today: both tokens are Pond Protocol assets, `pnd` is the token-facing reference for $PND, and `rpnd` is the reference for $rPND plus the issuance path for both. Repo ownership is settled; product roles are not.

Undecided: the division of labor. Is one intended for holders and the other for internal or institutional use? Is one a migration target with an eventual sunset? Do they coexist permanently? `pnd/docs/open-questions.md` item 15 tracks the same question.

### OQ-05

**Is $PND a claim on anything off ledger, and who is the obligor?**

Documented today: "IOU" is used strictly in the XRPL sense. `pnd/docs/token-spec.md` states that an IOU is a liability of its issuer, that what $PND represents and whether it is redeemable are not defined, that the legal issuing entity is a TODO, and that no peg or redemption right should be inferred. Asset class is `other`, not `rwa`.

Undecided: whether $PND additionally represents a redeemable claim, against whom, in what asset, and under what terms. Drives disclosure, reserve reporting, and legal review.

### OQ-07

**Fee policy: are transfer rate 0 and transfer fee 0 permanent?**

Documented today: `transferRate: 0` for $PND and `transferFee: 0` for $rPND; tick size 5. `rpnd/docs/rpnd-spec.md` notes `TransferFee` is omitted from the create transaction entirely when zero, and records `tifMPTTransferFee` as the flag that would freeze it (not set). `pnd/docs/integration.md` tells integrators to read the rate from the ledger rather than trusting a document — good practice regardless of what any document claims about mutability.

Undecided: whether zero is a permanent commitment. If it is, the $rPND side can be made permanent at create; the $PND side cannot be, so the two tokens can offer holders different degrees of assurance on the same policy. `pnd/docs/open-questions.md` item 8 tracks the IOU half.

## Ledger policy

### OQ-08

**Freeze and lock policy, and who may invoke it?**

Documented today: the config would create $rPND with `tfMPTCanLock`, letting the issuer lock the issuance or an individual holder's balance, and would foreclose clawback permanently via `tifMPTCanClawback`. Because MPT capability flags are one-way — `MPTokenIssuanceSet` can enable a flag but never disable one — **lock authority would be permanent from the moment the issuance is created**. The issuer could not give it up later, so this is not a policy that can be softened after the fact. For $PND the toolkit sets no freeze flag, and `pnd/docs/token-spec.md` notes freezing therefore remains available to the issuer.

On ledger now: the issuer's flags confirm none of this is set — no No Freeze, no Global Freeze, and no trust line clawback. Because `asfAllowTrustLineClawback` is only settable on an account that has never had a trust line, and this account has none, **the clawback option is still open and the first `TrustSet` closes it permanently**. That makes it a decision with a deadline attached to the very first $PND transaction, not a backlog item.

Undecided: whether to create $rPND with `tfMPTCanLock` at all, given it cannot be revoked; under what authorization locking would be used; whether $PND adopts individual freeze, global freeze, or permanent `asfNoFreeze`; and whether trust line clawback is set before that first trust line. Tracked as items 4 and 5 in `pnd/docs/open-questions.md`.

### OQ-09

**Is holding permissionless, or authorization-gated?**

Documented today: $rPND sets `requireAuth: false`. `rpnd/docs/rpnd-spec.md` is careful that this does not mean holders need no action — every holder still submits `MPTokenAuthorize` — it means there is no second, issuer-side approval. $PND relies on Default Ripple with no authorized-trust-lines setting.

Undecided: whether permissionless holding is the intended end state on mainnet. Note the asymmetry created by one-way flags: `tfMPTRequireAuth` can be switched on after create but never back off, so gating $rPND later is both a breaking change for existing holders and an irreversible one.

### OQ-10

**Should $rPND metadata be frozen, and when?**

Documented today: the blob is 249 bytes against a 1024-byte cap, replaced wholesale by `MPTokenIssuanceSet`. `rpnd/docs/rpnd-spec.md` records that `tifMPTMetadata` would freeze it permanently and is not currently set, and notes that whether `ImmutableFlags` is honored on `MPTokenIssuanceSet` should be verified against the target rippled release rather than trusting the client library's types.

Undecided: whether to freeze metadata, and at what point — freezing before production URLs are final would lock in `example.com` placeholders permanently, so ordering matters against [TD-01](#td-01).

## Operations and launch

### OQ-11

**Legal issuing entity and key custody policy.**

Documented today: the $PND issuer account is the public address `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc`. `rpnd/docs/issuance.md` prescribes a cold/hot split and says the cold seed should stay offline, but names no custody mechanism, and the toolkit has no multi-sign or regular-key support. On ledger the account has no `RegularKey` and its master key is enabled, so custody currently rests entirely on one master seed — which is also the state a mainnet-funded, unconfigured account is most exposed in, since nothing yet depends on the key being safe.

Undecided: the legal entity that issues, and the concrete custody arrangement — hardware wallet, multi-sign with a defined quorum, `SetRegularKey` rotation, or a custodian. Either of the latter two implies implementation work in `rpnd`. Also undecided: key rotation and compromise response. See [OQ-23](#oq-23) for whether the split exists in the live deployment at all.

### OQ-12

**Canonical public domain and production asset URLs.**

Documented today: the **website host** is `pondprotocol.pages.dev` (Cloudflare Pages, free). That
host is filled into `site/content.config.json` and `site/public/.well-known/xrp-ledger.toml`.
`[[TOKENS.URLS]]` website and verify links use `https://pondprotocol.pages.dev`. On ledger the
issuer has no `Domain` at all, and it stays unset until CORS is verified on the live TOML path.
`rpnd/docs/tokens.md` says metadata should not be treated as public until the domain serves the
file — the file will be served; the two-way bind will not exist while `Domain` is unset.

`$rPND` production URLs are still placeholders: `icon` is `example.com/rpnd-icon.png` and
`uris[0].uri` is `https://example.com/rpnd`. The TOML has no `[[PRINCIPALS]]` (a disclosure
decision) and no icon yet.

`pondprotocol.pages.dev` is a Cloudflare platform hostname, not a domain Pond Protocol registers.
Binding the on-ledger `Domain` to it later would accept a platform dependency that can only be
changed while the issuer can still sign.

Undecided: whether a registered domain later replaces `pages.dev` as the website host; whether
`Domain` is ever set, and to which host; the icon; `[[PRINCIPALS]]`. Tracked as items 9, 10, and 11
in `pnd/docs/open-questions.md`.

### OQ-13

**How do tokens reach holders?**

Documented today: the operational account holds inventory, and `send-pnd` / `send-rpnd` perform individual payments. That is the whole mechanism. `pnd/docs/open-questions.md` explicitly refuses to name a listing or liquidity venue until one is true.

Undecided: sale, airdrop, liquidity provision, faucet, or grants; plus vesting, lockups, and allocation. Nothing about allocation exists in any repo.

### OQ-14

**Liquidity: DEX, AMM, or neither?**

Documented today: the config leaves `tfMPTCanTrade` off, which `rpnd/docs/rpnd-spec.md` identifies as the flag permitting DEX and AMM use. Because flags are one-way, it could be enabled after create but never disabled again. The intended $PND tick size of 5 is an order-book parameter, so the IOU is at least shaped for a book — though it is not yet applied.

Undecided: whether the protocol intends order-book listings, an AMM pool, or no venue; and how price discovery works between the two assets given [OQ-03](#oq-03). Enabling trading is available later; withdrawing it is not.

### OQ-15

**Mainnet launch criteria.**

Decided: **$PND launches first.** $rPND design work follows, which means the $rPND parameter decisions ([OQ-21](#oq-21), [OQ-24](#oq-24), [TD-09](#td-09)) do not gate the first launch — but they do gate the $rPND create transaction whenever it happens.

Documented today: mainnet has no faucet command and no deployment. `rpnd/docs/issuance.md` describes mainnet as a separate, reviewed operation requiring confirmed amendment support, replaced placeholders, and production seeds held outside the repo. `pnd/docs/token-spec.md` lists the mainnet issuance date as a TODO.

Undecided: what "reviewed" means concretely and who signs off; the issuance date; and whether Testnet is a prerequisite for the $PND launch. Because $PND goes first, the launch-blocking items are the $PND ones — [OQ-05](#oq-05), [OQ-06](#oq-06), [OQ-08](#oq-08), [OQ-11](#oq-11), [OQ-12](#oq-12), [OQ-13](#oq-13), [TD-02](#td-02) — rather than anything MPT-specific.

## Governance and process

### OQ-17

**Drift control between the spec and the authoritative config.**

Decided, and consistent across repos: `rpnd/config/tokens.json` and `rpnd/src/issuance.ts` are authoritative on any mismatch, `rpnd/docs/rpnd-spec.md` is authoritative for $rPND, and `pnd` is the token-facing reference for $PND. This repo holds no machine-readable parameters and restates values for readers only.

Still open: how drift is *detected* rather than merely adjudicated. Three documents in three repos now restate the same config values by hand. `pnd` ships `scripts/check-docs.mjs`; this repo has no CI ([TD-10](#td-10)). Worth deciding whether a shared check reads `config/tokens.json` and verifies the prose, and where it lives.

A past example of exactly this drift, now resolved: `rpnd`'s README and `docs/rpnd-spec.md` stated that both assets "come from the same issuing account" while this page still recorded the $rPND issuer as undecided. The owner has since confirmed the shared issuer — see [OQ-22](#oq-22) — so the two now agree.

### OQ-18

**Governance, change control, and spec versioning.**

Documented today: `rpnd` treats any edit to `config/tokens.json` as a change to the token and documents a change-control table, `.github` ships a token parameter change issue template and a PR template, and `pnd` records that decisions resolved as commitments belong in the token spec rather than deleted from a list.

Undecided: who approves a token-parameter change and what quorum; whether the spec is versioned (XLS-style numbered versions or rolling `main`); whether to adopt an ADR or decision-log convention; what promotes a section from skeleton to normative and who declares it; and whether irreversible changes (`AssetScale`, `MaximumAmount`, any frozen flag) get a stricter path than reversible ones.

### OQ-19

**Pre-mainnet audit of issuance and custody.**

Documented today: `.github/SECURITY.md` is an org-wide policy that applies to every repository, states that the code has not been independently audited and that there is no bug bounty, and prescribes private reporting. It carries its own owner TODOs — enabling private vulnerability reporting, adding a monitored security address, and committing to response timelines. `pnd` ships a repo-level SECURITY.md too.

Undecided: whether an external review of issuance procedures and key custody happens before mainnet, and who performs it. The disclosure *channel* question is resolved by the org policy; only those owner TODOs inside it remain, and they belong to the org owner rather than this repo.

### OQ-20

**Repo visibility and license choice for a spec repo.**

Documented today: `protocol`, `pnd`, and `rpnd` are private; `.github` is public, and its profile README warns readers that any 404 means the repo is still private. All repos are Apache-2.0.

Undecided: when the repos go public, and whether Apache-2.0 is right for a document-only repo — a documentation license such as CC-BY is a common alternative. Note the org profile is already public and describes the tokens, so the org's public surface is ahead of its repos.

## Supply and accounts

### OQ-21

**What is the supply scale relationship between $PND and $rPND?**

Documented today:

- $PND target supply is **100,000,000,000 (100B)**, an issuer policy target rather than an on-ledger cap, with circulating supply measured as issuer obligations via `gateway_balances` — see [OQ-06](#oq-06).
- $rPND's config carries `maximumAmount` of `1000000000000000` base units = **1,000,000,000 display units** at `assetScale` 6. `rpnd/docs/rpnd-spec.md` labels the `assetScale`, `maximumAmount`, and `initialIssuance` values working defaults, "not ratified economics," and records that no issuance exists on mainnet. It carries an owner TODO to confirm all three before create.

The two caps are also different *kinds* of number. `MaximumAmount` bounds $rPND **circulating** supply rather than cumulative issuance: returning tokens to the issuer frees headroom to mint again, so the lifetime total minted can exceed it. The 100B $PND figure is a policy target with no ledger enforcement at all.

Undecided: whether the two figures should relate, and if so how. As they stand they differ by 100:1 with nothing documenting why. `MaximumAmount` is permanent once `MPTokenIssuanceCreate` is validated — changing it requires destroying the issuance and creating a new one with a different `MPTokenIssuanceID` — so it needs an answer before any create transaction on a network intended to persist.

Not a parameter conflict today, and not launch-blocking: the $rPND figures have never been issued and are explicitly provisional, and **$PND launches first** ([OQ-15](#oq-15)). Treat this as an input to the $rPND tokenomics work, which owns the answer. Related: [OQ-03](#oq-03), the same question in mechanism terms rather than numbers.

### OQ-24

**Should the on-ledger `issuer_name` read "Pond Protocol"?**

Documented today: prose across all four repos now uses Pond Protocol branding, and `rpnd`'s LICENSE copyright has been aligned. The on-ledger metadata has **not** followed: `config/tokens.json` still has `product: "rPND"` and `issuerName: "rPND"`, so the XLS-89 `issuer_name` field would publish `rPND`. `rpnd/docs/rpnd-spec.md` flags this as an owner decision rather than a docs edit, "because it changes the encoded metadata blob and its byte count."

Undecided: what the field should say. This is not purely mechanical — `issuer_name` describes the *issuer*, while `name` and `ticker` describe the token, so "Pond Protocol" as issuer with `rPND` as token name is coherent and arguably more correct than either alone. Decide before the mainnet create, since changing it afterward costs an `MPTokenIssuanceSet` and is impossible if metadata is frozen ([OQ-10](#oq-10)). Mechanical follow-through is [TD-05](#td-05).

### OQ-25

**Bot-ops account: does it exist yet, and is Operations ever further subdivided?**

Documented today: the owner has approved a bot custody split in which any bot automation signs from a dedicated, bounded account — not the Issuer, not Treasury, and not Operations. The recommended shape is a regular key (never a master seed) on a new account funded with 5–10 XRP and no $PND trust line. Operations (`rPNDAwFzgXzsjvUbVWz1ErB28v9SkcR2in`, per [OQ-23](#oq-23)) holds the 10B liquidity allocation and must never double as the bot's account — a compromised bot key there would put that allocation at risk, not just a small bounded float.

Undecided: whether the bot-ops account has been created and funded yet (as of this writing, no fourth address is published in any repo), and whether Operations is ever further subdivided — for example, a separate market-making account distinct from the account that holds the AMM LP position. Neither question blocks the $PND launch.

## Decided

### OQ-02

**"Pond Protocol" is the umbrella brand, and this repo is canonical.** Decided by the owner. The earlier "hosting only" stance in [rPND PR #1](https://github.com/PondProtocol/rPND/pull/1) — that the GitHub org must not appear in product branding — is **overridden**.

Follow-through: prose and license copyright across `rpnd`, `pnd`, and `.github` are aligned and merged, including `Copyright 2026 Pond Protocol contributors` in `rpnd/LICENSE` as of [rPND PR #2](https://github.com/PondProtocol/rPND/pull/2). What remains is on-ledger only — [OQ-24](#oq-24) for the decision, [TD-05](#td-05) for the edit.

### OQ-06

**$PND supply is policy-enforced with a target of 100,000,000,000 (100B).** Decided by the owner. This is an issuer policy target, not an on-ledger cap: the XRP Ledger stores no supply field for an IOU, so nothing enforces it mechanically. Circulating supply is measured as the issuer's outstanding obligations across trust lines, reported by the `gateway_balances` API call — the method `pnd/docs/token-spec.md` already documents.

Two consequences to carry into the spec: holders rely on issuer discipline rather than ledger enforcement for this figure ([spec/07](spec/07-security-considerations.md)), and `initialIssuance` in `rpnd`'s config is a Devnet rehearsal default that must never be quoted as a supply figure. On ledger, outstanding $PND is currently nil — the issuer reports no obligations and holds no trust lines. The $rPND side of supply is **not** decided — see [OQ-21](#oq-21).

### OQ-16

**The `pnd` repo has a defined scope: the token-facing reference for $PND.** Resolved by [PND PR #1](https://github.com/PondProtocol/PND/pull/1), now merged, which added a README, `docs/token-spec.md`, `docs/trust-lines.md`, `docs/integration.md`, `docs/pnd-vs-rpnd.md`, its own open-questions register, SECURITY.md, and a docs check script. It defers to `rpnd`'s config on any mismatch, which is the division [OQ-17](#oq-17) records.

### OQ-22

**Does the same account issue $rPND? Decided: yes.**

The owner has confirmed that `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc` — the $PND issuer — is also the $rPND issuer. Live state at the time of confirmation: funded with 2.539034 XRP, `Flags` `0`, `OwnerCount` `0`, `account_objects` empty, so no `MPTokenIssuance` exists from it yet and nothing about the decision depends on anything already being on ledger. `rpnd`'s README and `docs/rpnd-spec.md` already stated the two assets come from the same issuing account; that statement is now a deployment decision, not just a description of the tooling, closing the [OQ-17](#oq-17) instance this used to be.

**Consequence, decided along with it:** a shared issuer couples the two assets' account flags, `Domain`, and reserve exposure, exactly as flagged when this was open — see [spec/02](spec/02-accounts-and-roles.md). It also introduces a **blackholing ordering constraint**: a blackholed account can never sign again, so if $rPND is ever created, its `MPTokenIssuanceCreate` must happen before the issuer is ever blackholed. That ordering is moot in practice today because the current $rPND config sets `ImmutableFlags`, which requires the `DynamicMPT` amendment (not enabled on mainnet); the create returns `temDISABLED` as configured. Blackholing is therefore blocked until the config drops `ImmutableFlags` or `DynamicMPT` activates — independently of the ordering constraint, not instead of it. See `rpnd/docs/issuance.md#one-cold-account-or-two` and `pnd/docs/pnd-vs-rpnd.md#one-issuing-account-or-two` for the full reasoning.

Also worth noting for [OQ-24](#oq-24): the issuer address carries a vanity `rPND` prefix. Unlike metadata, an address cannot be rebranded — changing it means a new account and a new asset identity for $PND.

### OQ-23

**Is there a cold/hot split in the live deployment, and what are the account addresses? Decided: yes, and two addresses beyond the issuer are now named.**

The owner has confirmed a three-account topology: **Issuer** (`rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc`, shared per [OQ-22](#oq-22)), **Treasury** (`rPNDcL2UrGtSoGwruWx6ocMQ6ey8uPZm2b`, holding the 90B $PND vesting escrow), and **Operations** (`rPNDAwFzgXzsjvUbVWz1ErB28v9SkcR2in`, holding the 10B circulating/liquidity allocation, opening the trust line, authorizing $rPND, and creating the AMM pool). `rpnd/docs/issuance.md` prescribes the mechanics — cold issuer for `AccountSet`, issuance, and create; hot accounts for the trust line, authorization, and inventory — and now names both hot-side accounts instead of one.

**On ledger now, not merely configured:** neither Treasury nor Operations exists yet. `account_info` returns `actNotFound` for both on mainnet. Do not describe either as funded, configured, or holding a trust line until that changes.

This also answers the "distribution, market making, and treasury should be separated" question this item used to carry: treasury is separated from operations. What is not decided is whether Operations is ever further subdivided, and whether a bot gets its own account — tracked as the new [OQ-25](#oq-25), because a bot must never hold Operations' key.

## TODOs

### TD-01

Replace the placeholder $rPND asset values in `rpnd/config/tokens.json` before any mainnet `MPTokenIssuanceCreate`: `icon` is `example.com/rpnd-icon.png` (also missing a URL scheme) and `uris[0].uri` is `https://example.com/rpnd`. These are published on ledger. Blocked by [OQ-12](#oq-12), and must precede any metadata freeze ([OQ-10](#oq-10)).

### TD-02

Publish issuer metadata. The website host is `pondprotocol.pages.dev` and the TOML in
`site/public/.well-known/xrp-ledger.toml` already names it. Remaining: a real square icon on a
permanent host, whether to include `[[PRINCIPALS]]` (do not invent a contact), and confirming CORS
on the live path with `cd site && npm run verify:live -- pondprotocol.pages.dev`. The on-ledger
`Domain` field stays unset until that live check passes. `pages.dev` is a Cloudflare platform
hostname — binding `Domain` to it later accepts a platform dependency that can only be changed
while the issuer can still sign. See [spec/07](spec/07-security-considerations.md#75-impersonation).

### TD-03

Verify live amendment status before trusting `networks.mainnet.supportsMpt: true` in `config/tokens.json`. The `rpnd` README warns that mainnet MPT support must be confirmed while the config already asserts it; one of the two should change.

### TD-04

After a successful `MPTokenIssuanceCreate`, uncomment the $rPND `[[TOKENS]]` block in `config/xrp-ledger.toml.template` and fill `{{RPND_ISSUANCE_ID}}`, once explorers accept MPT rows.

### TD-05

Align the on-ledger naming with the brand decision once [OQ-24](#oq-24) is answered: `product` and `issuerName` in `rpnd/config/tokens.json`, which flow into the XLS-89 blob. Prose and license copyright are already done. Changing `issuerName` after issuance means an `MPTokenIssuanceSet` and a new byte count, and is impossible once metadata is frozen, so land it before the mainnet create.

### TD-09

Confirm the final `assetScale` (6), `maximumAmount` (1,000,000,000 display units), and `initialIssuance` before the mainnet create transaction. The first two are permanent; changing them afterward requires destroying the issuance and creating a new one with a different `MPTokenIssuanceID`. `rpnd/docs/rpnd-spec.md` carries the same TODO. Blocked by [OQ-21](#oq-21).

### TD-10

Decide whether this repo needs CI. It is documents only, so there is nothing to test, but a link checker and a drift check against `rpnd/config/tokens.json` would both earn their keep — see [OQ-17](#oq-17). `pnd/scripts/check-docs.mjs` is prior art.

### TD-12

Audit the remaining repos for config-intent-stated-as-on-ledger-fact. The error has now been found and fixed in `pnd` and here; `rpnd`'s own docs and the `.github` profile describe configured flags in the present tense too, and `rpnd/docs/rpnd-spec.md` lists the issuer account as "TODO — cold account address" when the address is known. The convention to adopt is in [CONTRIBUTING.md](../CONTRIBUTING.md#config-intent-is-not-on-ledger-fact).

## Completed TODOs

### TD-11

**Done.** The issuer account is established on **mainnet only**, and is `actNotFound` on Testnet and Devnet. It is funded and completely unconfigured: no `AccountSet`, no trust lines, no obligations, no MPT issuance. Recorded in [architecture Live state](architecture.md#live-state) along with the queries to re-check it, since every one of those facts changes as soon as a transaction lands. This answers `pnd/docs/open-questions.md` item 1 and sharpens item 14 — the account exists, but there is no issuance date because nothing has been issued.

### TD-06

**Done.** The `pnd` repo now has full content. See [OQ-16](#oq-16).

### TD-07

**Done.** SECURITY.md exists in `.github`, scoped to every repository in the organization, and in `pnd`. This repo needs no separate policy; the remaining owner TODOs inside the org policy are noted in [OQ-19](#oq-19).

### TD-08

**Done.** The `.github` repo now serves a live [org profile](https://github.com/PondProtocol/.github/blob/main/profile/README.md), plus a root README, code of conduct, contributing guide, issue templates including one for token parameter changes, and a PR template. Merged in [.github PR #1](https://github.com/PondProtocol/.github/pull/1).

One thing to pass back to whoever owns that repo: its profile README describes `protocol` and `pnd` as "Scaffolding; README only so far," which the merged work in both repos has since overtaken.

## Related registers in other repos

This page is protocol-level. Per-repo placeholders live with their repos, and duplication would drift:

- **[`pnd/docs/open-questions.md`](https://github.com/PondProtocol/PND/blob/main/docs/open-questions.md)** — 16 remaining numbered items covering issuer policy flags, publication identity, and timeline, plus a "Recently answered" table for closed ones. Overlaps: their 6 with [OQ-06](#oq-06) and now also with [OQ-22](#oq-22)'s blackholing ordering constraint, their 15 with [OQ-03](#oq-03) and [OQ-04](#oq-04), their 16 with [OQ-01](#oq-01), their 4 and 5 with [OQ-08](#oq-08). Their former items 1 (operational address) and 11 (shared issuer) are fully answered and recorded in their "Recently answered" table — matching [OQ-22](#oq-22) and [OQ-23](#oq-23) here.
- **[`rpnd/docs/rpnd-spec.md`](https://github.com/PondProtocol/rPND/blob/main/docs/rpnd-spec.md)** — owner TODOs inline against the parameters they affect: `issuerName`, the three permanent supply parameters, placeholder URLs, flag freezing, and the $PND relationship.
- **[`.github/SECURITY.md`](https://github.com/PondProtocol/.github/blob/main/SECURITY.md)** — org owner TODOs for the disclosure contact and response timelines.
