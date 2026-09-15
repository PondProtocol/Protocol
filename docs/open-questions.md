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

**[OQ-21](#oq-21) — the supply scale relationship between the two tokens.** $PND has a policy target of 100,000,000,000 (100B). $rPND's config carries a `MaximumAmount` of 1,000,000,000 display units, which `rpnd/docs/rpnd-spec.md` labels a working default, not ratified economics, and which has never been issued on ledger. That is a 100:1 difference with no documented relationship between the two figures. This is an open design decision, not a committed conflict — but the $rPND `MaximumAmount` becomes permanent at `MPTokenIssuanceCreate`, so the tokenomics work in flight needs an answer before any create transaction.

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
| [OQ-22](#oq-22) | Does the same account issue $rPND? | [spec/02](spec/02-accounts-and-roles.md) |
| [OQ-23](#oq-23) | Is there a cold/hot split in the live deployment? | [spec/02](spec/02-accounts-and-roles.md) |
| [OQ-24](#oq-24) | Should on-ledger `issuer_name` read "Pond Protocol"? | [spec/05](spec/05-metadata-and-discovery.md) |

Decided: [OQ-02](#oq-02), [OQ-06](#oq-06), [OQ-16](#oq-16). Completed: [TD-06](#td-06), [TD-07](#td-07), [TD-08](#td-08).

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

Documented today: `transferRate: 0` for $PND and `transferFee: 0` for $rPND; tick size 5. `rpnd/docs/rpnd-spec.md` notes `TransferFee` is omitted from the create transaction entirely when zero, and that it stays changeable after create unless frozen with `tifMPTTransferFee` (not currently set). `pnd/docs/integration.md` tells integrators to read the rate from the ledger rather than trusting a document.

Undecided: whether zero is a permanent commitment. If it is, the $rPND side can be made permanent at create; the $PND side cannot be, so the two tokens can offer holders different degrees of assurance on the same policy. `pnd/docs/open-questions.md` item 8 tracks the IOU half.

## Ledger policy

### OQ-08

**Freeze and lock policy, and who may invoke it?**

Documented today: $rPND is created with `tfMPTCanLock`, so the issuer may lock the issuance or an individual holder's balance; clawback is permanently foreclosed via `tifMPTCanClawback`. For $PND no freeze flag is set by the toolkit, so `pnd/docs/token-spec.md` notes freezing remains technically available, and separately that `asfAllowTrustLineClawback` can only ever be set on an account that has never had a trust line — a door that closes on first use, not a decision that can wait.

Undecided: whether locking $rPND is ever intended to be used and under what authorization; whether $PND adopts individual freeze, global freeze, or permanent `asfNoFreeze`; and whether trust line clawback is enabled before the issuer's first trust line. `rpnd/docs/rpnd-spec.md` adds a related decision — whether `canLock` and other mutable flags should be frozen at create so holders get the same permanence they get on clawback. Tracked as items 4 and 5 in `pnd/docs/open-questions.md`.

### OQ-09

**Is holding permissionless, or authorization-gated?**

Documented today: $rPND sets `requireAuth: false`. `rpnd/docs/rpnd-spec.md` is careful that this does not mean holders need no action — every holder still submits `MPTokenAuthorize` — it means there is no second, issuer-side approval. $PND relies on Default Ripple with no authorized-trust-lines setting.

Undecided: whether permissionless holding is the intended end state on mainnet. Turning gating on later is a breaking change for existing holders.

### OQ-10

**Should $rPND metadata be frozen, and when?**

Documented today: the blob is 249 bytes against a 1024-byte cap, replaced wholesale by `MPTokenIssuanceSet`. `rpnd/docs/rpnd-spec.md` records that `tifMPTMetadata` would freeze it permanently and is not currently set, and notes that whether `ImmutableFlags` is honored on `MPTokenIssuanceSet` should be verified against the target rippled release rather than trusting the client library's types.

Undecided: whether to freeze metadata, and at what point — freezing before production URLs are final would lock in `example.com` placeholders permanently, so ordering matters against [TD-01](#td-01).

## Operations and launch

### OQ-11

**Legal issuing entity and key custody policy.**

Documented today: the $PND issuer account is the public address `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc`. `rpnd/docs/issuance.md` prescribes a cold/hot split and says the cold seed should stay offline, but names no custody mechanism, and the toolkit has no multi-sign or regular-key support.

Undecided: the legal entity that issues, and the concrete custody arrangement — hardware wallet, multi-sign with a defined quorum, `SetRegularKey` rotation, or a custodian. Either of the latter two implies implementation work in `rpnd`. Also undecided: key rotation and compromise response. See [OQ-23](#oq-23) for whether the split exists in the live deployment at all.

### OQ-12

**Canonical public domain and production asset URLs.**

Documented today: placeholders. `icon` is `example.com/rpnd-icon.png`, `uris[0].uri` is `https://example.com/rpnd`, the toml template has `replace-me@example.com`, and `ISSUER_DOMAIN` is empty. `rpnd/docs/tokens.md` says metadata should not be treated as public until the domain serves the file. Now that [OQ-02](#oq-02) is decided, the domain should be a Pond Protocol one.

Undecided: the domain itself. Tracked as items 9, 10, and 11 in `pnd/docs/open-questions.md`.

### OQ-13

**How do tokens reach holders?**

Documented today: the operational account holds inventory, and `send-pnd` / `send-rpnd` perform individual payments. That is the whole mechanism. `pnd/docs/open-questions.md` explicitly refuses to name a listing or liquidity venue until one is true.

Undecided: sale, airdrop, liquidity provision, faucet, or grants; plus vesting, lockups, and allocation. Nothing about allocation exists in any repo.

### OQ-14

**Liquidity: DEX, AMM, or neither?**

Documented today: $rPND is created without `tfMPTCanTrade`, which `rpnd/docs/rpnd-spec.md` identifies as the flag permitting DEX and AMM use. It remains changeable after create unless frozen. $PND's tick size of 5 is an order-book parameter, so the IOU is at least shaped for a book.

Undecided: whether the protocol intends order-book listings, an AMM pool, or no venue; and how price discovery works between the two assets given [OQ-03](#oq-03).

### OQ-15

**Mainnet launch criteria and sequencing.**

Documented today: mainnet has no faucet command and no deployment. `rpnd/docs/issuance.md` describes mainnet as a separate, reviewed operation requiring confirmed amendment support, replaced placeholders, and production seeds held outside the repo. `pnd/docs/token-spec.md` lists the mainnet issuance date as a TODO.

Undecided: what "reviewed" means concretely and who signs off; which token launches first; and whether Testnet is a prerequisite given $rPND cannot exist there.

## Governance and process

### OQ-17

**Drift control between the spec and the authoritative config.**

Decided, and consistent across repos: `rpnd/config/tokens.json` and `rpnd/src/issuance.ts` are authoritative on any mismatch, `rpnd/docs/rpnd-spec.md` is authoritative for $rPND, and `pnd` is the token-facing reference for $PND. This repo holds no machine-readable parameters and restates values for readers only.

Still open: how drift is *detected* rather than merely adjudicated. Three documents in three repos now restate the same config values by hand. `pnd` ships `scripts/check-docs.mjs`; this repo has no CI ([TD-10](#td-10)). Worth deciding whether a shared check reads `config/tokens.json` and verifies the prose, and where it lives.

A live example of exactly this drift: `rpnd`'s README states that both assets "come from the same issuing account" and `rpnd/docs/rpnd-spec.md` says the same, while the owner treats the $rPND issuer as undecided — see [OQ-22](#oq-22).

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

Undecided: whether the two figures should relate at all, and if so how. As they stand they differ by 100:1 with nothing documenting why. Because a $rPND `MaximumAmount` is permanent once `MPTokenIssuanceCreate` is validated — changing it requires destroying the issuance and creating a new one with a new `MPTokenIssuanceID` — this needs an answer before any create transaction, on any network intended to persist.

Not a parameter conflict today: the $rPND figures have never been issued on ledger and are explicitly labelled provisional. Treat this as one input to the $rPND tokenomics work in flight, which owns the answer. Related: [OQ-03](#oq-03), which is the same question in mechanism terms rather than numbers.

### OQ-22

**Does the same account issue $rPND?**

Documented today: `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc` is the $PND issuer. The toolkit signs every issuance transaction for both assets with the single wallet from `ISSUER_SEED`, and `rpnd`'s README and `docs/rpnd-spec.md` both state that the two assets come from the same issuing account. `pnd/docs/pnd-vs-rpnd.md` is more careful, listing "no guarantee the two are issued by the same account, beyond the operator choosing to do so" among the things the pairing field does not establish.

Undecided: whether the production $rPND issuance actually comes from that account or a separate one. Until it is settled, `rpnd`'s statement is a description of the tooling, not of a deployment decision — one of the two needs correcting, which makes this an instance of [OQ-17](#oq-17). A shared issuer couples the two assets' key risk and their `AccountSet` configuration; separate issuers decouple them but need a second custody arrangement.

Also worth noting for [OQ-24](#oq-24): the issuer address carries a vanity `rPND` prefix. Unlike metadata, an address cannot be rebranded — changing it means a new account and a new asset identity for $PND.

### OQ-23

**Is there a cold/hot split in the live deployment, and what is the operational address?**

Documented today: `rpnd/docs/issuance.md` prescribes the split — cold issuer for `AccountSet`, issuance, and create; hot operational account for the trust line, authorization, and inventory. The toolkit reads both from separate seeds. `pnd/docs/token-spec.md` and `pnd/docs/open-questions.md` list the operational address as unpublished.

Undecided: whether the deployment behind `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc` actually has a separate operational account, and if so its public address. Also whether one operational account is the intended end state or whether distribution, market making, and treasury should be separated.

### OQ-24

**Should the on-ledger `issuer_name` read "Pond Protocol"?**

Documented today: prose across all four repos now uses Pond Protocol branding, and `rpnd`'s LICENSE copyright has been aligned. The on-ledger metadata has **not** followed: `config/tokens.json` still has `product: "rPND"` and `issuerName: "rPND"`, so the XLS-89 `issuer_name` field would publish `rPND`. `rpnd/docs/rpnd-spec.md` flags this as an owner decision rather than a docs edit, "because it changes the encoded metadata blob and its byte count."

Undecided: what the field should say. This is not purely mechanical — `issuer_name` describes the *issuer*, while `name` and `ticker` describe the token, so "Pond Protocol" as issuer with `rPND` as token name is coherent and arguably more correct than either alone. Decide before the mainnet create, since changing it afterward costs an `MPTokenIssuanceSet` and is impossible if metadata is frozen ([OQ-10](#oq-10)). Mechanical follow-through is [TD-05](#td-05).

## Decided

### OQ-02

**"Pond Protocol" is the umbrella brand, and this repo is canonical.** Decided by the owner. The earlier "hosting only" stance in [rPND PR #1](https://github.com/PondProtocol/rPND/pull/1) — that the GitHub org must not appear in product branding — is **overridden**.

Follow-through: prose and license copyright across `rpnd`, `pnd`, and `.github` are aligned and merged, including `Copyright 2026 Pond Protocol contributors` in `rpnd/LICENSE` as of [rPND PR #2](https://github.com/PondProtocol/rPND/pull/2). What remains is on-ledger only — [OQ-24](#oq-24) for the decision, [TD-05](#td-05) for the edit.

### OQ-06

**$PND supply is policy-enforced with a target of 100,000,000,000 (100B).** Decided by the owner. This is an issuer policy target, not an on-ledger cap: the XRP Ledger stores no supply field for an IOU, so nothing enforces it mechanically. Circulating supply is measured as the issuer's outstanding obligations across trust lines, reported by the `gateway_balances` API call — the method `pnd/docs/token-spec.md` already documents.

Two consequences to carry into the spec: holders rely on issuer discipline rather than ledger enforcement for this figure ([spec/07](spec/07-security-considerations.md)), and `initialIssuance` in `rpnd`'s config is a Devnet rehearsal default that must never be quoted as a supply figure. The $rPND side of supply is **not** decided — see [OQ-21](#oq-21).

### OQ-16

**The `pnd` repo has a defined scope: the token-facing reference for $PND.** Resolved by [PND PR #1](https://github.com/PondProtocol/PND/pull/1), now merged, which added a README, `docs/token-spec.md`, `docs/trust-lines.md`, `docs/integration.md`, `docs/pnd-vs-rpnd.md`, its own open-questions register, SECURITY.md, and a docs check script. It defers to `rpnd`'s config on any mismatch, which is the division [OQ-17](#oq-17) records.

## TODOs

### TD-01

Replace the placeholder $rPND asset values in `rpnd/config/tokens.json` before any mainnet `MPTokenIssuanceCreate`: `icon` is `example.com/rpnd-icon.png` (also missing a URL scheme) and `uris[0].uri` is `https://example.com/rpnd`. These are published on ledger. Blocked by [OQ-12](#oq-12), and must precede any metadata freeze ([OQ-10](#oq-10)).

### TD-02

Publish issuer metadata: pick the domain, run `render-toml`, replace `replace-me@example.com` in the `[[PRINCIPALS]]` block, serve the file at `https://<domain>/.well-known/xrp-ledger.toml`, then re-run `configure-issuer --domain <host>` so the AccountRoot `Domain` matches. Blocked by [OQ-12](#oq-12). This is a security task as much as a polish one — see [spec/07](spec/07-security-considerations.md#75-impersonation).

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

### TD-11

Record which network or networks `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc` is established on. This repo and both token repos currently state that no mainnet issuance exists; if that account is a mainnet account, those statements need revisiting. `pnd/docs/open-questions.md` items 1 and 14 track the address and the issuance date from the $PND side.

## Completed TODOs

### TD-06

**Done.** The `pnd` repo now has full content. See [OQ-16](#oq-16).

### TD-07

**Done.** SECURITY.md exists in `.github`, scoped to every repository in the organization, and in `pnd`. This repo needs no separate policy; the remaining owner TODOs inside the org policy are noted in [OQ-19](#oq-19).

### TD-08

**Done.** The `.github` repo now serves a live [org profile](https://github.com/PondProtocol/.github/blob/main/profile/README.md), plus a root README, code of conduct, contributing guide, issue templates including one for token parameter changes, and a PR template. Merged in [.github PR #1](https://github.com/PondProtocol/.github/pull/1).

One thing to pass back to whoever owns that repo: its profile README describes `protocol` and `pnd` as "Scaffolding; README only so far," which the merged work in both repos has since overtaken.

## Related registers in other repos

This page is protocol-level. Per-repo placeholders live with their repos, and duplication would drift:

- **[`pnd/docs/open-questions.md`](https://github.com/PondProtocol/PND/blob/main/docs/open-questions.md)** — 16 items covering unpublished addresses, issuer policy flags, publication identity, and timeline. Overlaps: their 6 with [OQ-06](#oq-06), their 15 with [OQ-03](#oq-03) and [OQ-04](#oq-04), their 16 with [OQ-01](#oq-01), their 4 and 5 with [OQ-08](#oq-08). Their items 1, 2, and 6 are now partly answered by the issuer address and the 100B target recorded here.
- **[`rpnd/docs/rpnd-spec.md`](https://github.com/PondProtocol/rPND/blob/main/docs/rpnd-spec.md)** — owner TODOs inline against the parameters they affect: `issuerName`, the three permanent supply parameters, placeholder URLs, flag freezing, and the $PND relationship.
- **[`.github/SECURITY.md`](https://github.com/PondProtocol/.github/blob/main/SECURITY.md)** — org owner TODOs for the disclosure contact and response timelines.
