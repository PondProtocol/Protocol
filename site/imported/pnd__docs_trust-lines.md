---
source_repo: pnd
source_path: docs/trust-lines.md
title: Holding $PND
url: /pnd/holding/
section: $PND — issued currency
synced: 2026-09-15
---
# Holding $PND

$PND lives on trust lines. This is the holder-side view: how to opt in, what a limit means, and what happens when you want out.

The issuer is `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc`. That account is not funded on any network yet, so none of the transactions below can succeed today — this describes how holding $PND will work, not something you can do now. Holder addresses shown are placeholders.

## Opening a trust line

A holder opts in with a `TrustSet` naming the currency, the issuer, and a limit:

```json
{
  "TransactionType": "TrustSet",
  "Account": "rHOLDER_ADDRESS",
  "LimitAmount": {
    "currency": "PND",
    "issuer": "rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc",
    "value": "1000000"
  }
}
```

The limit is the maximum balance you are willing to accept from that issuer. Payments that would push your balance above it fail rather than partially settling, so set the limit at or above the largest balance you expect to hold. The operational account in the issuance toolkit uses a limit of `1000000000`; a normal holder has no reason to copy that number.

Until the trust line exists, no one can send you $PND. An issuer `Payment` to an account with no line fails with a path error (`tecPATH_DRY`), and one that would exceed your limit fails as an incomplete path (`tecPATH_PARTIAL`). This is the ledger working as intended: an IOU cannot be forced onto an unwilling account.

The issuer does not require holder authorization (`asfRequireAuth` is not set), so opening the line is enough. You do not need approval from Pond Protocol to hold $PND.

## Reserves

Each trust line is an object owned by your account, and each owned object raises your account's owner reserve — XRP that stays locked in your account while the object exists. Check the current reserve values in the [XRPL reserves documentation](https://xrpl.org/reserves.html) rather than assuming a figure, since they are set by validator vote and have changed over time.

You reclaim the reserve by deleting the trust line, which the ledger does automatically once the line is back in its default state: zero balance, zero limit, and no non-default flags.

## Sending and receiving

With `asfDefaultRipple` enabled on the issuer, holders can pay each other in $PND directly, and the balance ripples through the issuer. In practice:

- Sending to another holder who has a $PND trust line with room under their limit works as a plain `Payment` with a $PND amount.
- Sending to an account with no trust line does not work. Wallets that silently retry as an XRP payment or as a path payment through another asset are doing something different from what you asked; check the delivered amount.
- Returning $PND to the issuer redeems it. The obligation disappears from the issuer's balance sheet rather than moving to a treasury address, since the issuer cannot hold its own IOU.

If you set the `NoRipple` flag on your side of the line you block rippling through your account, which is a reasonable default for an end user but breaks intermediary or market-making behavior.

## Exchanges and custodians

An exchange holding $PND for customers typically keeps one trust line and separates customers by destination tag. Two consequences for holders:

- Withdrawing to an exchange without the tag it asked for can lose the deposit.
- The exchange's line, not yours, is what the ledger sees. Custodial $PND is a claim on the exchange, which is a claim on a claim.

The issuing account does not require destination tags (`tfRequireDestTag` is not set), so tags matter for third-party services rather than for the issuer.

## Verifying you hold the real thing

The ticker is not the asset. Before trusting a $PND balance:

1. Read the issuer address on the trust line, not the currency code.
2. Compare it character by character with `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc`. Vanity prefixes are cheap to generate, so an address that merely starts with `rPND` proves nothing.
3. Confirm the issuer account's `Domain` resolves to a host serving `/.well-known/xrp-ledger.toml` that lists the same address. The domain is not published yet (TODO), so this step cannot be completed today.

Anything that fails those checks is a different token that shares a ticker, whatever a wallet or listing page calls it. Since the issuer account is still unfunded, a mainnet trust line to that exact address would today be the only $PND line in existence — which is itself a reason to be suspicious of any $PND balance you are offered right now.

## Checking outstanding supply

The target supply is 100 billion $PND, and it is a policy commitment rather than a ledger rule. You can check what the issuer actually owes at any time with `gateway_balances` against the issuer, which reports its obligations. See [`token-spec.md`](token-spec.md) for the request, what the figure includes, and why the ledger cannot cap it.

## Freeze exposure

The issuer has not committed to a freeze policy (TODO). Since `asfNoFreeze` is not set, the issuer retains the technical ability to freeze individual trust lines or to apply a global freeze. Holders who need certainty on this point should treat it as unresolved until the policy is published here.
