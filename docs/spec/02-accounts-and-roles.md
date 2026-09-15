# 02 — Accounts and roles

Skeleton. See [conventions](README.md#conventions) for the Documented / Open / TODO labels.

## 2.1 Roles

**Documented** (`rpnd/docs/issuance.md`, `rpnd/src/cli.ts`):

**Issuer (cold).** Holds issuing authority for both assets. Submits `AccountSet` to configure itself, `Payment` to issue $PND, `MPTokenIssuanceCreate` to bring $rPND into existence, and `Payment` to mint $rPND. Its seed is meant to stay offline in production. Read from `ISSUER_SEED`.

**Operational (hot).** Holds distributable inventory of both assets. Submits `TrustSet` for `PND` and `MPTokenAuthorize` for $rPND, and is the source account for routine distribution payments. Read from `OPERATIONAL_SEED`.

**Holder.** Any account that has opted in — `TrustSet` for $PND, `MPTokenAuthorize` for $rPND. The toolkit supports an optional `HOLDER_SEED` for exercising the holder path.

There is one issuer account for both assets. Nothing in the code or docs contemplates separate issuers per token.

## 2.2 Authority

**Documented:** authority is exactly what the XRP Ledger grants the issuing account, no more and no less. There is no contract, hook, or off-ledger permission layer. Concretely the issuer can issue $PND without an on-ledger cap, mint $rPND up to `MaximumAmount`, lock $rPND balances, change $rPND metadata, and change its own account settings. It cannot claw back $rPND, ever.

**Open:** whether any of that authority should be constrained by policy, and how such a constraint would be made credible to holders given the ledger will not enforce it — [OQ-06](../open-questions.md#oq-06), [OQ-08](../open-questions.md#oq-08), [OQ-18](../open-questions.md#oq-18).

## 2.3 Key custody

**Documented:** the cold/hot split itself, and the instruction to keep the cold seed offline in production. Faucet-generated seeds are written to a gitignored `var/` directory and `fund` refuses to run on mainnet.

**Open:** the actual custody mechanism — hardware wallet, XRPL multi-sign with a defined quorum, `SetRegularKey` rotation, or a third-party custodian — and the legal entity that controls it — [OQ-11](../open-questions.md#oq-11). Neither multi-sign nor regular-key support exists in the toolkit today, so either choice implies work in `rpnd`.

**Open:** key rotation and compromise-response procedure. Nothing is documented.

## 2.4 Account count and separation

**Open:** whether one operational account is the intended end state, or whether distribution, market making, and treasury should be separate accounts. Only one operational account exists today.
