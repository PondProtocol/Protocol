# Connect Wallet

Official connect on this host is **WalletConnect or Xaman** on
[Trade](/trade/). That is it. This page never asks for a seed, never imports
a wallet, and is not a claim.

<div class="callout callout-critical">
<p><strong>$PND has not been issued.</strong> Connecting a wallet does not
give you tokens, open a market, or start a purchase. If someone asks you to
connect to claim $PND, it is not this site.</p>
</div>

## The official path

1. Open **[Trade](/trade/)**.
2. Use **Connect wallet**.
3. Choose **WalletConnect** or **Xaman**.
4. Approve in *your* wallet app. Pond never sees your seed.

[/connect/](/connect/) is the Xaman SignIn page if you already have that URL.
It is kept working. It is not this Start here step, and it is not in the
top bar.

## What connecting means

Pond does not take custody of your account. Xaman SignIn is a `SignIn`
pseudo-transaction. It is never submitted to the XRP Ledger. This site can
show the r-address that signed. WalletConnect is the same idea: your wallet
stays in control.

After launch, your wallet still creates the trust line and signs locally.
See [Set Trust Lines](/start/trust-lines/).

## What this will never do

- Ask for a seed, mnemonic, or private key
- Run a claim flow
- Place a DEX or AMM trade
- Store your secret on {{domain}}

If connect is unavailable, the owner still needs Xaman app keys on the
Autoscale host. Trade will say so instead of pretending to work. That is
honest, not a broken buy button.

Next: [Set Trust Lines](/start/trust-lines/).
