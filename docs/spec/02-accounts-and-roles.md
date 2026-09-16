# 02 — Accounts and roles

Skeleton. See [conventions](README.md#conventions) for the Documented / Open / TODO labels.

## 2.1 Roles

**Documented** (`rpnd/docs/issuance.md`, `rpnd/src/cli.ts`, owner confirmation):

**Issuer (cold).** Holds issuing authority. Submits `AccountSet` to configure itself, `Payment` to issue $PND, `MPTokenIssuanceCreate` to bring $rPND into existence, and `Payment` to mint $rPND. Its seed is meant to stay offline in production. Read from `ISSUER_SEED`. The issuer is `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc`, **issuing both $PND and $rPND** ([OQ-22](../open-questions.md#oq-22), decided). It is funded on mainnet with **none of those transactions submitted yet** — see [architecture Live state](../architecture.md#live-state).

**Treasury.** Named account for supply that is not the trading wallet. `rPNDcL2UrGtSoGwruWx6ocMQ6ey8uPZm2b` ([OQ-23](../open-questions.md#oq-23), decided). **Funded on mainnet** (~1 XRP as of the 2026-09-16 wallets snapshot); needs more XRP before launch lockups. Holds no bot-reachable key. How it will hold the 10 billion team slice and the 80 billion holder monthly is **not published as escrow** — [OQ-13](../open-questions.md#oq-13). Do not treat ten 9 billion Treasury self-escrows as the public schedule.

**Operations (hot).** Liquidity and day-to-day distribution. Submits `TrustSet` for `PND` and `MPTokenAuthorize` for $rPND, is the source account for routine distribution payments, and creates the AMM pool. `rPNDAwFzgXzsjvUbVWz1ErB28v9SkcR2in` ([OQ-23](../open-questions.md#oq-23), decided). **Not funded on ledger** — `account_info` returns `actNotFound` on mainnet. Read from `OPERATIONAL_SEED` in the toolkit. **Operations is not a bot account.** Which slice of the 10 billion public it holds is not locked; a bot must never hold a key on it.

**Bot-ops (recommended, not created).** Any bot or automation gets its own dedicated, bounded account — a regular key, never a master seed, on a new account funded with 5–10 XRP and no $PND trust line. Not the Issuer, not Treasury, and not Operations. No address is published yet; creating and funding it is an owner action, not a decision that is still open ([OQ-25](../open-questions.md#oq-25)).

**Holder.** Any account that has opted in — `TrustSet` for $PND, `MPTokenAuthorize` for $rPND. The toolkit supports an optional `HOLDER_SEED` for exercising the holder path.

**Decided, formerly open:** whether one account issues both assets — yes, per [OQ-22](../open-questions.md#oq-22). The toolkit's single-`ISSUER_SEED` design already matched this; it is now a deployment decision rather than only a description of the tooling.

**Decided, formerly open:** whether the live deployment separates a hot account, and its public address — yes, and it splits further than a single hot account: Treasury and Operations are two separate named addresses, per [OQ-23](../open-questions.md#oq-23). Treasury is funded (light on XRP). Operations is not visible on ledger yet. The issuer still has no trust lines, so no $PND counterparty is discoverable from it. Both addresses are published above and in the token repos.

**Open:** whether the bot-ops account exists yet, and whether Operations is ever further subdivided — [OQ-25](../open-questions.md#oq-25).

## 2.2 Authority

**Documented:** authority is exactly what the XRP Ledger grants the issuing account, no more and no less. There is no contract, hook, or off-ledger permission layer. Concretely the issuer can issue $PND without an on-ledger cap — the 100B target is policy, not enforcement — mint $rPND up to `MaximumAmount` in circulation, lock $rPND balances, replace the $rPND metadata blob, and change its own account settings. It cannot claw back $rPND, ever.

Capability flags move in one direction only: `MPTokenIssuanceSet` can turn a flag on but never off. The issuer therefore has no ongoing discretion to *relinquish* an $rPND capability — it can only acquire more. Whatever is enabled at create, or enabled later, is permanent.

**Open:** whether any of that authority should be constrained by policy, and how such a constraint would be made credible to holders given the ledger will not enforce it — [OQ-06](../open-questions.md#oq-06), [OQ-08](../open-questions.md#oq-08), [OQ-18](../open-questions.md#oq-18).

## 2.3 Key custody

**Documented:** the cold/hot split itself, and the instruction to keep the cold seed offline in production. Faucet-generated seeds are written to a gitignored `var/` directory and `fund` refuses to run on mainnet. On ledger, the issuer has no `RegularKey` and its master key is enabled, so custody today rests entirely on the master seed.

**Open:** the actual custody mechanism — hardware wallet, XRPL multi-sign with a defined quorum, `SetRegularKey` rotation, or a third-party custodian — and the legal entity that controls it — [OQ-11](../open-questions.md#oq-11). Neither multi-sign nor regular-key support exists in the toolkit today, so either choice implies work in `rpnd`.

**Decided, narrower than the full custody question:** any bot or automation signs from the dedicated bot-ops account in [2.1](#21-roles) using a regular key, never a master seed, and never a key on the Issuer, Treasury, or Operations. This does not answer the broader custody question above — hardware wallet vs. multi-sign vs. custodian for the Issuer itself is still [OQ-11](../open-questions.md#oq-11) — it only fixes where a bot's key may live.

**Open:** key rotation and compromise-response procedure. Nothing is documented.

## 2.4 Account count and separation

**Decided, formerly open:** treasury is separate from operations — [OQ-23](../open-questions.md#oq-23). The toolkit's config still contemplates exactly one hot account (`OPERATIONAL_SEED`); the deployment topology now has two, and the toolkit needs a second seed/address parameter (for Treasury) before it can drive both.

**Open:** whether Operations is ever further subdivided — for example, a separate market-making account distinct from the one holding the AMM LP position — and whether the bot-ops account in [2.1](#21-roles) has been created. Both are [OQ-25](../open-questions.md#oq-25).
