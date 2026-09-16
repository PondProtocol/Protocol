---
source_repo: pnd
source_path: docs/integration.md
source_ref: origin/cursor/pnd-issuer-funded-state-7b41
source_sha256: 32207e6b2c23b93ba729ee086368c0fedb87de95c242254f143199900fe5d1b4
title: Integration guide
url: /pnd/integration/
section: $PND — issued currency
synced: 2026-09-15
---
# Integrating $PND

Notes for wallets, exchanges, indexers, and anything else that displays or moves $PND. Nothing here is $PND-specific magic; it is standard XRPL issued-currency handling, written down so integrations do not have to guess.

## Identify the asset by two fields

An integration must key $PND on the pair (currency code, issuer address):

```json
{ "currency": "PND", "issuer": "rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc" }
```

Keying on `"PND"` alone will merge unrelated tokens that reuse the ticker. This matters most in search, portfolio totals, and any allowlist. Read the issuer from configuration rather than hardcoding it in application code. The account is funded on mainnet but has issued nothing, so there is nothing to index yet.

## Amount encoding

An issued-currency amount is an object with `currency`, `issuer`, and a decimal-string `value`. A bare string amount means drops of XRP, so a mis-serialized $PND amount does not fail loudly — it becomes an XRP payment. Validate the shape on the way in and out.

Keep `value` as a string end to end. Issued currencies hold 15 decimal digits of significant precision, which does not survive a JSON number, an IEEE-754 double, or a naive integer conversion. `displayDecimals` (6) is a rendering hint from XLS-26 metadata, not a rounding rule for what you store.

## Reading balances

| Question | Call |
| --- | --- |
| What $PND does this account hold? | `account_lines` on the holder, filtered by issuer |
| How much $PND is outstanding? | `gateway_balances` on the issuer; the total appears under obligations |
| Did this payment deliver $PND? | Read `delivered_amount` in the transaction metadata, not the requested `Amount` |

There is no supply field to read. `gateway_balances` obligations is the closest thing, and it is a snapshot of what the issuer owes at a given ledger.

If you display a supply figure, derive it from obligations and label it as such. The 100 billion target is issuer policy, not a ledger cap, so do not render it as a maximum the protocol enforces — and do not compute a percentage-of-cap number that implies the ledger would reject issuance beyond it. Balances above 1 billion also carry fewer than 6 exact decimals; see the precision table in [`token-spec.md`](token-spec.md) before formatting treasury-scale amounts.

## Read the issuer's configuration, do not assume it

The issuer account is funded on mainnet with **no `AccountSet` applied**: every account flag is false and `Domain`, `TransferRate`, and `TickSize` are all absent. The values in this repository describe what the operator intends to set, so an integration that hardcodes them will be wrong both now and after any later change. Read them from `account_info` and treat what you find as the truth.

The one that changes behavior most is rippling. `account_flags.defaultRipple` is false, and until the issuer enables it, **holders cannot pay each other in $PND** — only payments to and from the issuer work, because a holder-to-holder payment has to ripple through the issuer's trust lines. Wallets that assume any XRPL token moves peer to peer will show users a failure they cannot explain. Check the flag and, when it is false, say so in the interface rather than letting the transaction fail.

## Payments

- Recipients need a trust line with headroom under their limit. A send to an account without one fails as a path error rather than creating the line for them. Wallets should detect the missing line and prompt the user to open it.
- `TransferRate` is absent today, which is the ledger default of no fee, and `rpnd`'s config intends to set it to 0 explicitly. Do not hardcode either: read `TransferRate` from the issuer's account data, because a later `AccountSet` can change it and integrations that assume zero will under-deliver.
- Partial payments (`tfPartialPayment`) can deliver less than `Amount`. Credit customers from `delivered_amount` only. This is the single most common way exchanges lose money on XRPL tokens.

## DEX and order books

The issuer intends to set `TickSize` to 5, which would round offers on $PND pairs to five significant digits of price. The field is absent on ledger today, so the current behavior is the ledger default of full precision. Read `TickSize` from the issuer's account data and round order entry to match whatever is set, or users will see their price change on submission.

## Metadata and branding

$PND metadata is published through XLS-26: the issuer's `Domain` points at a host serving `/.well-known/xrp-ledger.toml`, and that file carries the `[[ACCOUNTS]]`, `[[CURRENCIES]]`, and `[[TOKENS]]` rows for the issuer and for `PND`. Treat the file as authoritative only when the account's `Domain` matches the host serving it.

Open items an integrator will ask for and that this repo cannot yet answer:

- Issuer domain and the live `xrp-ledger.toml`: TODO.
- Canonical logo or icon asset and its URL: TODO.
- Contact for listings and integration questions: TODO.

## $rPND is a separate asset

Do not display $PND and $rPND as one balance, and do not treat one as a wrapper the other converts into. $rPND is a Multi-Purpose Token with a different identifier (`MPTokenIssuanceID`), a different opt-in transaction (`MPTokenAuthorize`), and a different amount shape (`{ mpt_issuance_id, value }`). See [`pnd-vs-rpnd.md`](pnd-vs-rpnd.md).

## Pre-launch checklist

1. Asset identity stored as (currency, issuer) from config, not a hardcoded ticker.
2. Amounts parsed and stored as decimal strings.
3. Credit logic reads `delivered_amount`.
4. `TransferRate`, `TickSize`, and `defaultRipple` read from the ledger rather than assumed.
5. Missing-trust-line handling shows a real message and an opt-in path.
6. Holder-to-holder transfers gated on `defaultRipple` being enabled, with a clear message when it is not.
7. Issuer address verified against this repository and against the issuer's `xrp-ledger.toml`.

If you integrate $PND and something in this document is wrong or incomplete, please open an issue — integration reports are the main way this file improves.
