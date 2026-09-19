# Connect Xaman

Official Xaman SignIn only. This page never asks for a seed, never imports a
wallet, and is not a claim. $PND has not been issued. The same SignIn also
lives on [Trade](/trade/); this URL is kept working and is not in the top bar.

<div class="xaman-app" data-xaman-app data-issuer="{{issuerAddress}}"></div>

## What this does

1. **Connect** — Xaman signs a `SignIn` pseudo-transaction. It is never
   submitted to the XRP Ledger. This site then shows the r-address that
   signed and keeps it in a session cookie so you stay logged in.
2. **Verify the issuer** — same address as [Verify](/verify/):
   `{{issuerAddress}}`. Open it in Xaman or an explorer. Do not search `PND`.
3. **Optional TrustSet** — if you choose it, Xaman can open a trust line to
   that issuer. Honest status: **nothing is issued**, so this does not give
   you tokens. Skip it if you only wanted to confirm the account.

If connect is unavailable, the owner still needs Xaman app keys on the
Autoscale host. The button will say so instead of pretending to work.

## What this will never do

- Ask for a seed, mnemonic, or private key
- Run a claim flow
- Place a DEX or AMM trade
- Store your secret on pond.greenhead.io
