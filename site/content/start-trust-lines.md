# Set Trust Lines

After launch, holding $PND means opening a trust line to **this issuer**, not
typing `PND` into a search box. You do that in a wallet **you** already
control. This page will not set a line for you.

<div class="callout callout-critical">
<p><strong>$PND has not been issued yet.</strong> Target
<strong>2026-10-01</strong>. There is no $PND to receive today. A trust line
now does not give you tokens. This page has no “set it now” action, because
issuance is not live.</p>
</div>

## What a trust line is

$PND is an issued currency (IOU). You opt in with a `TrustSet` that names:

1. Currency code `PND` (case-sensitive)
2. This issuer — not a look-alike vanity prefix
3. A limit — the maximum balance you are willing to accept

<p><code class="addr">{{issuerAddress}}</code></p>

Until that line exists, no one can send you $PND. That is the ledger working
as intended: an IOU cannot be forced onto an unwilling account.

Anyone can open a $PND line. Issuer approval is not required (`Require Auth`
is off on the [Wallets](/wallets/) snapshot).

## Honest steps — in your wallet

1. Finish [Verify Issuer](/verify/). Save the address above.
2. [Connect Wallet](/start/wallet/) through official WalletConnect or Xaman
   on [Trade](/trade/) if you want this site to know your r-address. You can
   also skip that and stay entirely in your wallet app.
3. In **your** wallet, create a trust line to that issuer for `PND`.
4. Read the issuer on the line character by character. `rPND…` as a prefix
   proves nothing.

**Optional, after connect:** Xaman on [Trade](/trade/) can open a TrustSet
you choose. Honest status: **nothing is issued**, so that line does not give
you tokens. Skip it if you only wanted to confirm the account.

A trust line is an object your account owns. It raises your owner reserve
(XRP locked while the object exists). Check current reserve values in the
[XRPL reserves documentation](https://xrpl.org/reserves.html) rather than
assuming a figure.

## What is already true on the issuer

From the 2026-09-16 [Wallets](/wallets/) snapshot: Default Ripple is **on**,
No Freeze is **on**, and **nothing is issued**. Once $PND exists, holders can
pay each other across trust lines. Confirm with `account_info` if this page
might be stale. If this page and the ledger disagree, **the ledger wins.**

## What this page will never do

- Set a trust line from the docs site
- Show a live “set it now” or claim button
- Ask for a seed
- Publish a DEX trade URL before $PND exists *and* a human has loaded the
  page

The longer safety page is [Hold safely](/hold/). Ledger mechanics:
[Holding $PND](/pnd/holding/).

Next: [Ready to Use DEX](/start/dex/).
