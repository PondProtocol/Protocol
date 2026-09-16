---
source_repo: pnd
source_path: docs/token-spec.md
source_ref: main
source_sha256: 5927a62aa418f2edeb48986c7077f4243b50c5dcc4a60948dfc06695ed691413
title: Token specification
url: /pnd/
section: $PND — issued currency
synced: 2026-09-16
---
# $PND token specification

$PND is an XRP Ledger issued currency (IOU). This file describes the asset as it is configured today. The on-ledger parameters are set by [`pondprotocol/rpnd`](https://github.com/pondprotocol/rpnd) from its `config/tokens.json`; that file is the operator source of truth, and this document tracks it.

## Asset identity

| Field | Value |
| --- | --- |
| Currency code | `PND` |
| Code form | standard 3-character (not the 160-bit hex form) |
| Issuer | `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc` |
| Issuer account ID | `F3D28C5718EC76EF8AD0666C77EC0E8954FCC85E` |
| Operational (hot) account | TODO — the cold/hot split has not been made, so no distribution address exists |
| Asset class (XLS-26) | `other` |
| Display decimals | 6 |

An IOU is identified by both its currency code and its issuer. `PND` from a different issuer is a different asset. Any integration that keys off the currency code alone will conflate them, so always compare the issuer address too.

The address above is a well-formed classic XRPL address: base58check decodes to a version byte of `0x00`, a 20-byte account ID, and a checksum that matches. That is a statement about the encoding only. A valid checksum says the address was not corrupted in transit; it says nothing about who holds the keys.

### Account state on ledger

The issuer account exists and is funded on **mainnet**. It is also completely unconfigured: no `AccountSet` has been applied, so every account flag is false and the token-defining fields are absent. On **testnet** and **devnet** the address does not exist at all (`account_info` returns `actNotFound`).

Check the current state yourself rather than trusting this paragraph, since the account will change as it is configured:

```bash
curl -sS -X POST https://xrplcluster.com \
  -H 'Content-Type: application/json' \
  -d '{"method":"account_info","params":[{"account":"rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc","ledger_index":"validated"}]}'
```

What to read in the response, and what each field means for $PND:

| Field | Meaning while unconfigured |
| --- | --- |
| `account_flags.defaultRipple` | `false` means holders cannot send $PND to each other, only to and from the issuer. Configuration must set `asfDefaultRipple` before $PND circulates |
| `account_flags.allowTrustLineClawback` | `false`, and `OwnerCount` is 0 with an empty `account_lines`, so the clawback decision is still open. It closes permanently at the first trust line |
| `account_flags.noFreeze` | `false`, so the issuer has not given up freezing. Freeze policy is undecided |
| `account_flags.requireAuthorization` | `false`, so holders will not need issuer approval to open a trust line |
| `Domain` | absent, so no XLS-26 metadata location is claimed and nothing about this account can be independently attributed to Pond Protocol |
| `TransferRate`, `TickSize` | absent, meaning ledger defaults rather than the intended values below |
| `Balance`, `OwnerCount` | the account is funded above the mainnet base reserve with no owned objects. Holders pay the owner reserve for trust lines they create, so the issuer's balance does not need to scale with holder count |

Funded is not the same as ready. At present the account can hold XRP and sign transactions; it has none of the settings that make $PND behave as documented, and no $PND exists.

## Issuer account configuration

An `AccountSet` from the issuer establishes the token's behavior. **That transaction has not been submitted**, so the values below describe intent — `rpnd`'s `config/tokens.json`, applied by its `configure-issuer` command — not the account's present state. Verify against `account_info` before relying on any row.

| Setting | Intended | On ledger now | Effect once applied |
| --- | --- | --- | --- |
| `asfDefaultRipple` | enabled | **not set** | Trust lines to the issuer allow rippling, so holders can pay each other in $PND. Until this is set, holder-to-holder payments fail |
| `TransferRate` | `0` | absent (ledger default, equivalent to no fee) | No transfer fee; sending 100 $PND delivers 100 $PND |
| `TickSize` | `5` | absent (ledger default, 15 digits) | Order book prices for $PND pairs are rounded to 5 significant digits, which keeps DEX offers from splitting into dust levels |
| `tfDisallowXRP` | enabled | not set | Advisory flag asking clients not to send XRP to the issuing account. It is not enforced by the ledger |
| `tfRequireDestTag` | not set | not set | The issuing account does not require destination tags |
| `Domain` | TODO | absent | Must be set to the host serving `/.well-known/xrp-ledger.toml` before the metadata is treated as authoritative |

Two policy flags are deliberately not covered here because they have not been decided:

- **Freeze.** Whether the issuer will use individual freeze, global freeze, or permanently give up freezing via `asfNoFreeze` is a TODO. `noFreeze` is false on ledger and the issuance toolkit sets no freeze flag, so freezing remains technically available to the issuer.
- **Trust line clawback.** `asfAllowTrustLineClawback` is not set by the toolkit and reads false on ledger. It can only be set on an account that has never had a trust line, and the issuer's `OwnerCount` is 0 with an empty `account_lines`, so the window is confirmed open — but it closes on its own the moment the first line is created, which makes it the most time-sensitive open item in this repository. This differs from $rPND, where clawback is disabled and frozen in the create transaction, so it is a permanent guarantee rather than a standing decision; see [`rpnd/docs/rpnd-spec.md`](https://github.com/pondprotocol/rpnd/blob/main/docs/rpnd-spec.md#immutable-flags).

Both flags materially affect what a holder is exposed to, so they should be resolved and documented before mainnet issuance.

## Amounts and precision

$PND amounts are objects, never strings (a bare string means drops of XRP):

```json
{
  "currency": "PND",
  "issuer": "rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc",
  "value": "125.5"
}
```

`value` is a decimal string. Issued currencies carry 15 decimal digits of significant precision with a wide exponent range, so $PND is not a fixed-point integer token and must not be parsed into a 64-bit integer or an IEEE-754 double. Use a decimal library and keep the string form when relaying values.

The `displayDecimals` value of 6 is a presentation hint published in XLS-26 metadata. It tells interfaces how many fractional digits to show; it does not truncate or round what the ledger stores.

### Precision at 100 billion scale

Because precision is counted in *significant* digits rather than decimal places, the fractional headroom of a single balance shrinks as the balance grows. With 15 significant digits:

| Balance magnitude | Integer digits | Decimal places available |
| --- | --- | --- |
| up to `999,999,999.999999` | 9 | 6 |
| 1,000,000,000 and up | 10 | 5 |
| 10,000,000,000 and up | 11 | 4 |
| 100,000,000,000 (full target supply) | 12 | 3 |

So the 6 display decimals are exact for any balance below 1 billion $PND, which covers ordinary holders with room to spare. A single balance approaching the full 100 billion supply — most plausibly a treasury or operational account right after issuance — can only carry 3 decimal places, and a value like `100000000000.000001` is not representable.

This is not a conflict between the supply target and the display hint, and it needs no change to either. It does mean two things for implementations: treasury-scale accounting should not assume six exact decimals, and the total supply is best treated as a whole number rather than one carrying dust. Note also that supply is a sum across many trust lines, each stored at its own magnitude, so the aggregate figure from `gateway_balances` is computed from individually rounded balances.

## Supply

**Target supply: 100,000,000,000 $PND (100 billion).** This is a policy commitment by the issuer. It is not, and cannot be, a ledger-enforced cap.

### Why there is no cap to enforce

The XRP Ledger stores no supply figure for an issued currency and offers no field that limits one. An IOU comes into existence when the issuer sends a `Payment` denominated in it, and it ceases to exist when it is paid back to the issuer. Outstanding supply is therefore derived, not declared: it is the sum of the negative balances on the issuer's trust lines — what the issuer owes.

`gateway_balances` on the issuer reports exactly that figure, as obligations at a specific ledger:

```bash
curl -sS -X POST https://xrplcluster.com \
  -H 'Content-Type: application/json' \
  -d '{"method":"gateway_balances","params":[{"account":"rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc","ledger_index":"validated"}]}'
```

Today this returns success with no obligations at all: the issuer exists but has issued nothing. Two things to keep in mind when reading it later: the result is a snapshot at one ledger rather than a running total, and it counts what the issuer owes rather than what is liquid or in circulation, so tokens sitting in an operational account are included.

Nothing in that mechanism stops the issuer from exceeding 100 billion. There is no transaction that would fail, no flag that would block it, and no amendment that changes this for IOUs. Anyone describing the 100 billion figure as a hard or on-chain cap is describing something the XRP Ledger does not provide.

The contrast with $rPND is instructive: an MPT has `MaximumAmount`, which the ledger enforces and which cannot be raised after creation. That difference is one of the stated reasons $rPND is an MPT — see [`rpnd/docs/mpt-vs-iou.md`](https://github.com/pondprotocol/rpnd/blob/main/docs/mpt-vs-iou.md).

### What actually enforces the target

Only issuer behavior, in one of two broad shapes:

| Approach | What it gives up | What it gives you |
| --- | --- | --- |
| Issue the full 100 billion once, then blackhole the issuer by setting a regular key to an unusable value and disabling the master key | All future issuance, all issuer-side flag changes, and any freeze or clawback ability | A cap that is permanent and independently verifiable, since no key can sign another issuance |
| Keep the issuer live and issue in controlled tranches from operational accounts | Verifiability — the cap remains a promise backed by key custody and process | Flexibility to stage issuance, respond to demand, and change issuer settings later |

These two are in direct tension, and the tension is the point: **a cap that is verifiable is a cap that cannot be adjusted, and an issuer that stays live cannot offer more than a promise.** Intermediate arrangements exist — multi-signing the issuer, publishing signed attestations, or committing to a review cadence — and they trade off along the same axis rather than escaping it.

The owner has not chosen. Until a choice is published here, treat 100 billion as a stated intention enforced by operational discipline, and treat `gateway_balances` as the way to check whether that intention is being kept.

### Related open items

Recorded in [`open-questions.md`](open-questions.md): whether the cap is hard or soft, the enforcement mechanism, whether the issuer is blackholed after minting the full supply or kept live for controlled issuance, and what verification procedure holders should treat as canonical.

### Do not quote the rehearsal numbers

The `initialIssuance` value in `rpnd`'s `config/tokens.json` is 1,000,000 — a Devnet rehearsal default, one hundred-thousandth of the target. It is not a supply figure and should never be quoted as one.

## Backing and redemption

An IOU is a liability of its issuer. What $PND represents, what if anything backs it, and whether it is redeemable are not defined in this repository. The legal issuing entity is also a TODO. Do not infer a peg or a redemption right from this document.

## Metadata publication

$PND discovery uses XLS-26: the issuer sets its `Domain`, and the matching host serves `/.well-known/xrp-ledger.toml` with `[[ACCOUNTS]]`, `[[CURRENCIES]]`, and `[[TOKENS]]` entries for the issuer and for `PND`. `rpnd` ships a template and a `render-toml` command that fills it in.

Until both halves exist — the `Domain` on the account and the file on the host — the metadata is unverified, because the pairing between the two is exactly what proves the domain and the account belong to the same operator.

## Networks

| Network | Status |
| --- | --- |
| Devnet | Used for rehearsal issuance with disposable accounts. Devnet is periodically reset. The published issuer address does not exist there |
| Testnet | Usable for IOU work. $rPND is not issued there because the MPT amendment is absent. The published issuer address does not exist there |
| Mainnet | The issuer account exists and is funded, but carries no configuration and has issued nothing. TODO — issuance date |

Devnet and Testnet keys must never be reused on mainnet.
