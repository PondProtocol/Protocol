---
source_repo: pnd
source_path: docs/integration.md
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

Keying on `"PND"` alone will merge unrelated tokens that reuse the ticker. This matters most in search, portfolio totals, and any allowlist. Read the issuer from configuration rather than hardcoding it in application code, and note that the account is not yet funded on any network, so there is nothing to index until issuance happens.

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

## Payments

- Recipients need a trust line with headroom under their limit. A send to an account without one fails as a path error rather than creating the line for them. Wallets should detect the missing line and prompt the user to open it.
- `TransferRate` is currently 0, so the sent amount equals the delivered amount. Do not hardcode that assumption: read `TransferRate` from the issuer's account data, because a future `AccountSet` can change it and integrations that assume zero will under-deliver.
- Partial payments (`tfPartialPayment`) can deliver less than `Amount`. Credit customers from `delivered_amount` only. This is the single most common way exchanges lose money on XRPL tokens.

## DEX and order books

The issuer sets `TickSize` to 5, so offers on $PND pairs are rounded to five significant digits of price. Order-entry interfaces should round quotes the same way, or users will see their price change on submission.

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
4. `TransferRate` read from the ledger rather than assumed.
5. Missing-trust-line handling shows a real message and an opt-in path.
6. Issuer address verified against this repository and against the issuer's `xrp-ledger.toml`.

If you integrate $PND and something in this document is wrong or incomplete, please open an issue — integration reports are the main way this file improves.
