# Open questions and TODOs

Everything on this page is **undecided**. Nothing here should be treated as a plan, a hint at a plan, or settled fact — the point of the page is to keep undecided design out of the spec until an owner decides it.

Two kinds of item:

- **OQ-nn — open design questions.** Someone has to make a call. Most of them block a spec section.
- **TD-nn — TODOs.** The decision is already made or mechanical; the work just has not been done.

Each item records *what the repos document today* (with a citation, so the ground truth is checkable) and *what is missing*. When an item is resolved, write the answer into the relevant spec file, then replace the item here with a one-line pointer to where the answer now lives.

## Index

| ID | Item | Blocks |
| --- | --- | --- |
| [OQ-01](#oq-01) | What is Pond Protocol, and where does its scope end? | [spec/README](spec/README.md), [architecture](architecture.md) |
| [OQ-02](#oq-02) | Brand hierarchy: is "Pond Protocol" or "rPND" the umbrella name? | Metadata, LICENSE, org profile |
| [OQ-03](#oq-03) | What is the economic relationship between $PND and $rPND? | [spec/04](spec/04-token-relationship.md) |
| [OQ-04](#oq-04) | Why two tokens? Which one is holder-facing? | [spec/04](spec/04-token-relationship.md) |
| [OQ-05](#oq-05) | Is $PND a claim on anything off ledger, and who is the obligor? | [spec/01](spec/01-tokens.md), [spec/04](spec/04-token-relationship.md) |
| [OQ-06](#oq-06) | Supply policy: are the configured amounts final, and what caps $PND? | [spec/03](spec/03-issuance-and-supply.md) |
| [OQ-07](#oq-07) | Fee policy: are transfer rate 0 and transfer fee 0 permanent? | [spec/03](spec/03-issuance-and-supply.md) |
| [OQ-08](#oq-08) | Freeze and lock policy, and who may invoke it? | [spec/07](spec/07-security-considerations.md) |
| [OQ-09](#oq-09) | Is holding permissionless, or authorization-gated? | [spec/01](spec/01-tokens.md) |
| [OQ-10](#oq-10) | Should $rPND metadata be made immutable, and when? | [spec/05](spec/05-metadata-and-discovery.md) |
| [OQ-11](#oq-11) | Legal issuing entity and key custody policy. | [spec/02](spec/02-accounts-and-roles.md), [spec/07](spec/07-security-considerations.md) |
| [OQ-12](#oq-12) | Canonical public domain and production asset URLs. | [spec/05](spec/05-metadata-and-discovery.md) |
| [OQ-13](#oq-13) | How do tokens reach holders? | [spec/03](spec/03-issuance-and-supply.md) |
| [OQ-14](#oq-14) | Liquidity: DEX, AMM, or neither? | [spec/04](spec/04-token-relationship.md) |
| [OQ-15](#oq-15) | Mainnet launch criteria and sequencing. | [spec/03](spec/03-issuance-and-supply.md) |
| [OQ-16](#oq-16) | What lives in the `pnd` repo, given `rpnd` ships both tokens? | Repo map |
| [OQ-17](#oq-17) | Where does canonical token config live? | Repo map, [spec/01](spec/01-tokens.md) |
| [OQ-18](#oq-18) | Governance, change control, and spec versioning. | [spec/06](spec/06-governance-and-change-control.md) |
| [OQ-19](#oq-19) | Security disclosure process and audit plans. | [spec/07](spec/07-security-considerations.md) |
| [OQ-20](#oq-20) | Repo visibility and license choice for a spec repo. | This repo |

## Identity and scope

### OQ-01

**What is Pond Protocol, and where does its scope end?**

Documented today: nothing. The string "Pond" does not appear anywhere in the content of `rpnd`, `pnd`, or `.github`. The only definition in existence is the one-line framing used to create this repo: the protocol that ties together $PND and $rPND.

Undecided: whether Pond Protocol is (a) a naming umbrella over two independently issued tokens, (b) a token system with defined mechanics relating them, or (c) something larger that includes an application, settlement venue, or governance body. Everything else in this list narrows once this is answered, so answer it first.

### OQ-02

**Is "Pond Protocol" or "rPND" the umbrella name?**

Documented today: `rpnd` product files consistently say rPND — `product: "rPND"` in `config/tokens.json`, `issuerName: "rPND"` published into the XLS-89 blob, `"rPND issuer"` in the `xrp-ledger.toml` template, and `Copyright 2026 rPND contributors` in the LICENSE. More pointedly, [rPND PR #1](https://github.com/PondProtocol/rPND/pull/1) states that the GitHub organization is *hosting only*, and that product files, metadata, and license copyright "do not name the host org as issuer, parent, or related project" — with a note that the canonical repo should move to an rPND-owned org if public identity is meant to match the product.

Undecided: that earlier stance is in direct tension with treating `PondProtocol/protocol` as the canonical protocol repo and Pond Protocol as the thing that owns both tokens. Either the org is now the product identity (in which case rPND's metadata, license copyright, and that PR note need revisiting — see [TD-05](#td-05)) or rPND remains an independent product that Pond Protocol merely coordinates. This repo currently uses `Copyright 2026 Pond Protocol contributors`, which assumes the former; change it if that assumption is wrong.

## Token model and economics

### OQ-03

**What is the economic relationship between $PND and $rPND?**

Documented today: exactly one link, and it is explicitly non-binding. `rpnd/src/metadata.ts` writes `additional_info.paired_iou_currency = "PND"` into the $rPND metadata, and `rpnd/docs/tokens.md` says: "That is documentation for indexers and operators. The ledger does not atomically bind the IOU and the MPT."

Undecided, and unwritten anywhere: is there a fixed rate or peg between them? Is $rPND redeemable for $PND, or the reverse? Is conversion one-way, two-way, or absent? If conversion exists, who executes it and with what authority — an operator-run process, an on-ledger mechanism, or a manual desk? Is there a supply invariant across the pair (for example, $rPND outstanding must not exceed $PND outstanding)? Without an answer, [spec/04](spec/04-token-relationship.md) cannot say anything normative, and the "protocol" has no mechanics.

### OQ-04

**Why two tokens, and which one is holder-facing?**

Documented today: both tokens are issued from the same cold account and both have operational-account inventory. The naming convention (`r` prefix) resembles a wrapped or receipt token, but nothing in any repo states that intent.

Undecided: the division of labor. Is one intended for holders and the other for internal or institutional use? Is one a migration target for the other, with an eventual sunset? Do they coexist permanently? This changes which token gets the marketing surface, the liquidity, and the compliance attention.

### OQ-05

**Is $PND a claim on anything off ledger, and who is the obligor?**

Documented today: "IOU" is used strictly in the XRPL sense — an issued currency held on a trust line. `config/tokens.json` describes it as "PND issued currency (IOU) on the XRP Ledger" with `assetClass: "other"`, and `rpnd/docs/tokens.md` says the legal issuer entity is an operator decision.

Undecided: whether $PND additionally represents a redeemable claim on an off-ledger asset or obligation, and if so, against whom, in what asset, and under what terms. Note the asset class is currently `other`, not `rwa`, which suggests no real-world backing is claimed — but that is an inference from a default value, not a documented decision. This answer drives disclosure, reserve reporting, and legal review.

### OQ-06

**Supply policy: are the configured amounts final, and what caps $PND?**

Documented today, from `config/tokens.json`: $PND `initialIssuance` is `1000000` (1,000,000 PND) and the operational trust line limit is `1000000000`. $rPND `assetScale` is 6, `initialIssuance` is `1000000000000` fractional units (1,000,000 rPND) and `maximumAmount` is `1000000000000000` (1,000,000,000 rPND). `rpnd/docs/issuance.md` warns that `AssetScale` and `MaximumAmount` are fixed for the life of the issuance.

Undecided: whether these are launch parameters or scaffolding placeholders. The two initial issuances are both 1,000,000 whole units, which may be intentional symmetry or may be coincidence. Separately, $rPND has a hard on-ledger cap while $PND, as an IOU, has none — the trust limit caps one line, not total issuance. If $PND supply is meant to be bounded, the bound is a policy the protocol must state and an operator must respect, because the ledger will not enforce it.

### OQ-07

**Fee policy: are transfer rate 0 and transfer fee 0 permanent?**

Documented today: `transferRate: 0` for $PND and `transferFee: 0` for $rPND in `config/tokens.json`; tick size is 5.

Undecided: whether zero is a deliberate permanent commitment or just an unset default. If it is a commitment, the spec should say so, and the difference in mutability between the two tokens' fee fields needs to be checked against XRPL rules before anyone promises "fees can never be introduced."

## Ledger policy

### OQ-08

**Freeze and lock policy, and who may invoke it?**

Documented today: $rPND is created with `canLock: true`, so the issuer can lock balances. Clawback is permanently disabled through `ImmutableFlags` / `tifMPTCanClawback` — that one is settled and irreversible. For $PND, `config/tokens.json` sets no freeze-related flags at all; `buildIssuerAccountSet` only handles Default Ripple, Disallow XRP, Require Destination Tag, tick size, and transfer rate.

Undecided: whether locking $rPND is ever intended to be used, under what circumstances, and with what authorization; and whether $PND should adopt No Freeze (giving up freeze permanently) or retain the default freeze capability. Holders cannot assess counterparty risk without this, and the two tokens currently have asymmetric, unstated freeze semantics.

### OQ-09

**Is holding permissionless, or authorization-gated?**

Documented today: $rPND sets `requireAuth: false`, so any account may authorize itself and receive it. $PND relies on Default Ripple with no authorized-trust-lines setting, so any account may open a trust line.

Undecided: whether permissionless holding is the intended end state, including on mainnet, or whether allow-listing is expected later. Turning gating on after launch is a breaking change for existing holders, so it belongs in the spec before mainnet.

### OQ-10

**Should $rPND metadata be made immutable, and when?**

Documented today: `rpnd/docs/tokens.md` notes that metadata updates after issuance replace the whole blob unless metadata is later marked immutable, and that the blob is capped at 1024 bytes (enforced in `src/metadata.ts`).

Undecided: whether Pond Protocol wants a mutable metadata blob (operationally flexible, weaker guarantee to holders) or an immutable one (the reverse), and at what point in the launch sequence the switch happens if immutability is chosen.

## Operations and launch

### OQ-11

**Legal issuing entity and key custody policy.**

Documented today: `rpnd/docs/tokens.md` explicitly defers legal issuer entity and custody policy to the operator. `rpnd/docs/issuance.md` prescribes the cold/hot split and says the cold seed should stay offline in production, but names no custody mechanism.

Undecided: the legal entity that issues, and the concrete custody arrangement — hardware wallet, multi-sign with a defined quorum, regular XRPL key rotation via `SetRegularKey`, or a custodian. Note that no multi-sign or regular-key support exists in the toolkit today, so choosing either implies implementation work in `rpnd`.

### OQ-12

**Canonical public domain and production asset URLs.**

Documented today: placeholders throughout. `config/tokens.json` has `icon: "example.com/rpnd-icon.png"` and a `uris` entry pointing at `https://example.com/rpnd`; the toml template has `replace-me@example.com`; `ISSUER_DOMAIN` is empty in `.env.example`. `rpnd/docs/tokens.md` says the public website domain is an operator decision and that metadata should not be treated as public until the domain serves `/.well-known/xrp-ledger.toml`.

Undecided: the domain itself, and whether it is a Pond Protocol domain or an rPND one — which loops back to [OQ-02](#oq-02). Note the icon value is currently missing a scheme, which will need fixing regardless ([TD-01](#td-01)).

### OQ-13

**How do tokens reach holders?**

Documented today: the operational account "holds inventory for distribution" (`rpnd/docs/issuance.md`), and the CLI has `send-pnd` / `send-rpnd` for one-off payments. That is the entire distribution story.

Undecided: the actual mechanism — sale, airdrop, liquidity provision, faucet, grants — plus any vesting, lockups, or allocation schedule. Nothing about allocation exists in any repo, so nothing about it may be stated as fact.

### OQ-14

**Liquidity: DEX, AMM, or neither?**

Documented today: [rPND PR #1](https://github.com/PondProtocol/rPND/pull/1) lists DEX listings as out of scope. $rPND is created with `canTrade: false` in `config/tokens.json`.

Undecided: whether the protocol intends order-book listings, an XRPL AMM pool, or no venue at all; and what price discovery is meant to look like given [OQ-03](#oq-03). If trading is intended for $rPND, the `canTrade` flag setting needs review before the create transaction, since MPT flags set at create time are not all changeable afterward.

### OQ-15

**Mainnet launch criteria and sequencing.**

Documented today: `rpnd/docs/issuance.md` and the README describe mainnet as a separate, reviewed operation with no faucet command, requiring confirmed MPT amendment support, replaced placeholder values, and production seeds held outside the repo. Devnet is the default and has been exercised end to end.

Undecided: what "reviewed" means concretely (who signs off, against what checklist), which token launches first or whether they launch together, and whether Testnet is a prerequisite at all given it is flagged `supportsMpt: false`.

## Governance and process

### OQ-16

**What lives in the `pnd` repo, given `rpnd` ships both tokens?**

Documented today: `pnd` contains only a two-line README. `rpnd` calls itself "the operator source of truth for token config" and already implements $PND issuance end to end.

Undecided: whether `pnd` gets a real scope (a holder-facing app, an $PND-only operator split, something else), gets archived, or stays a placeholder. Leaving it empty invites a second, conflicting source of truth for $PND parameters.

### OQ-17

**Where does canonical token config live?**

Documented today: `rpnd/config/tokens.json` is the single machine-readable definition of both tokens' parameters, and `rpnd`'s README claims source-of-truth status for it.

Undecided: whether a spec repo that claims to be normative should also own those parameters. Options include leaving config in `rpnd` and having the spec cite it (what this repo does today), moving it here and having `rpnd` consume it, or duplicating with a drift check in CI. Duplication without automation will drift.

### OQ-18

**Governance, change control, and spec versioning.**

Documented today: nothing. No CODEOWNERS, no branch protection recorded, no versioning scheme, no decision log convention.

Undecided: who may approve a change to token parameters or to the spec; whether Pond Protocol publishes numbered spec versions (XLS-style) or just tracks `main`; whether an ADR or decision-log convention is wanted; and how the spec signals normative versus informative text. This repo's [CONTRIBUTING.md](../CONTRIBUTING.md) sets a provisional convention that can be replaced once decided.

### OQ-19

**Security disclosure process and audit plans.**

Documented today: nothing. No SECURITY.md in any repo, no disclosure contact, no audit reference.

Undecided: the disclosure channel and contact, response expectations, and whether an external review of issuance procedures and key custody happens before mainnet.

### OQ-20

**Repo visibility and license choice for a spec repo.**

Documented today: `protocol`, `pnd`, and `rpnd` are private; `.github` is public. `rpnd` is Apache-2.0, and this repo follows that convention.

Undecided: when (or whether) these repos go public, and whether Apache-2.0 is the right license for a document-only repo — a documentation license such as CC-BY is a common alternative, and mixing licenses across repos is worth a deliberate choice rather than inheritance.

## TODOs

### TD-01

Replace the placeholder $rPND asset values in `rpnd/config/tokens.json` before any mainnet `MPTokenIssuanceCreate`: `icon` is `example.com/rpnd-icon.png` (also missing a URL scheme) and `uris[0].uri` is `https://example.com/rpnd`. Blocked by [OQ-12](#oq-12).

### TD-02

Publish issuer metadata: pick the domain, run `render-toml`, replace `replace-me@example.com` in the `[[PRINCIPALS]]` block, serve the file at `https://<domain>/.well-known/xrp-ledger.toml`, then re-run `configure-issuer --domain <host>` so the AccountRoot `Domain` matches. Blocked by [OQ-12](#oq-12).

### TD-03

Verify live amendment status before trusting `networks.mainnet.supportsMpt: true` in `config/tokens.json`. The README warns that mainnet MPT support must be confirmed, while the config already asserts it — one of the two should change.

### TD-04

After a successful `MPTokenIssuanceCreate`, uncomment the $rPND `[[TOKENS]]` block in `config/xrp-ledger.toml.template` and fill `{{RPND_ISSUANCE_ID}}`, once explorers accept MPT rows. Already flagged in the template.

### TD-05

Align naming and copyright with whatever [OQ-02](#oq-02) decides: `product` and `issuerName` in `rpnd/config/tokens.json`, `Copyright 2026 rPND contributors` in `rpnd/LICENSE`, `Copyright 2026 Pond Protocol contributors` in this repo's LICENSE, and the "hosting only" paragraph in [rPND PR #1](https://github.com/PondProtocol/rPND/pull/1). Changing `issuerName` after issuance means rewriting the on-ledger metadata blob, so decide before mainnet create.

### TD-06

Give the `pnd` repo real content or archive it. Blocked by [OQ-16](#oq-16).

### TD-07

Add SECURITY.md with a real disclosure contact, here and in `rpnd`. Blocked by [OQ-19](#oq-19).

### TD-08

Fill in the org profile: `.github/README.md` is the single line `# .github`, and it is the only public repo in the org, so it is the first thing an outside reader sees.

### TD-09

Confirm the final `AssetScale` (6) and `MaximumAmount` (1,000,000,000 rPND) before the mainnet create transaction. `rpnd/docs/issuance.md` states both are fixed for the life of the issuance; there is no second chance. Blocked by [OQ-06](#oq-06).

### TD-10

Decide whether this repo needs CI. It is documents only today, so there is nothing to test, but a link checker or a drift check against `rpnd/config/tokens.json` would be worth adding if [OQ-17](#oq-17) keeps config in `rpnd`.
