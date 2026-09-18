---
name: XRPL wallet execution gate
description: Safety rule for connecting wallets and submitting XRPL DEX orders before Pond Protocol market launch.
---

Wallet connection and transaction preparation can be available before launch, but signing/submission must stay behind an explicit verified-market signal. Never infer market readiness from a connected wallet or an issuer account that merely exists.

**Why:** The published project can have a funded issuer while `$PND` is still unissued and no verified order book exists. Allowing an `OfferCreate` in that state could send real funds into an unvalidated market.

**How to apply:** Keep the non-custodial WalletConnect flow and XRPL transaction builder intact, validate the issuer, trust line, network, and live order book, and only then enable `signAndSubmit`.