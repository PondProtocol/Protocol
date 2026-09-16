# 02 — Accounts and roles

Skeleton. See [conventions](README.md#conventions) for the Documented / Open / TODO labels.

## 2.1 Roles

**Documented** (`rpnd/docs/issuance.md`, `rpnd/src/cli.ts`, owner confirmation):

**Issuer (cold).** Holds issuing authority. Submits `AccountSet` to configure itself, `Payment` to issue $PND, `MPTokenIssuanceCreate` to bring $rPND into existence, and `Payment` to mint $rPND. Its seed is meant to stay offline in production. Read from `ISSUER_SEED`. The issuer is `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc`, **issuing both $PND and $rPND** ([OQ-22](../open-questions.md#oq-22), decided). It is funded on mainnet with **none of those transactions submitted yet** — see [architecture Live state](../architecture.md#live-state).

**Treasury.** Holds the 90B $PND vesting escrow and signs the `EscrowCreate` transactions that lock it. `rPNDcL2UrGtSoGwruWx6ocMQ6ey8uPZm2b` ([OQ-23](../open-questions.md#oq-23), decided). **Not funded on ledger** — `account_info` returns `actNotFound` on mainnet. Holds no bot-reachable key of any kind; the escrow releases it eventually performs are permissionless, so nothing signs from Treasury except the owner's own `EscrowCreate` transactions.

**Operations (hot).** Holds the 10B circulating/liquidity inventory. Submits `TrustSet` for `PND` and `MPTokenAuthorize` for $rPND, is the source account for routine distribution payments, and creates the AMM pool. `rPNDAwFzgXzsjvUbVWz1ErB28v9SkcR2in` ([OQ-23](../open-questions.md#oq-23), decided). **Not funded on ledger** — `account_info` returns `actNotFound` on mainnet. Read from `OPERATIONAL_SEED` in the toolkit. **Operations is not a bot account.** It carries the 10B liquidity allocation; a bot must never hold a key on it.

**Bot-ops (recommended, not created).** Any bot or automation gets its own dedicated, bounded account — a regular key, never a master seed, on a new account funded with 5–10 XRP and no $PND trust line. Not the Issuer, not Treasury, and not Operations. No address is published yet; creating and funding it is an owner action, not a decision that is still open ([OQ-25](../open-questions.md#oq-25)).

**Holder.** Any account that has opted in — `TrustSet` for $PND, `MPTokenAuthorize` for $rPND. The toolkit supports an optional `HOLDER_SEED` for exercising the holder path.

**Decided, formerly open:** whether one account issues both assets — yes, per [OQ-22](../open-questions.md#oq-22). The toolkit's single-`ISSUER_SEED` design already matched this; it is now a deployment decision rather than only a description of the tooling.

**Decided, formerly open:** whether the live deployment separates a hot account, and its public address — yes, and it splits further than a single hot account: Treasury and Operations are two separate named addresses, per [OQ-23](../open-questions.md#oq-23). Neither is visible on ledger yet — the issuer still has no trust lines, so no counterparty account is discoverable from it — but both addresses are published above and in the token repos.

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
