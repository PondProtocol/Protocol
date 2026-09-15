---
source_repo: protocol
source_path: docs/spec/07-security-considerations.md
title: 07 — Security considerations
url: /spec/security/
section: Specification
synced: 2026-09-15
---
# 07 — Security considerations

Skeleton. See [conventions](README.md#conventions) for the Documented / Open / TODO labels.

This section describes the risks that exist today. It does not offer mitigations that have not been decided.

## 7.1 Issuer key compromise

**Documented:** the cold/hot split is the only structural mitigation in place. The cold seed is meant to be offline; the toolkit reads seeds from environment variables, refuses to faucet-fund on mainnet, and writes dev-network seeds to a gitignored `var/` directory. The $PND issuer is `rPNDRmfNNrUZstkA23haCUkCp7qLEPnaYc`.

**Open:** custody mechanism, multi-sign or regular-key configuration, rotation policy, and compromise response — [OQ-11](../open-questions.md#oq-11). A compromised cold key means unbounded $PND issuance, $rPND minting up to `MaximumAmount`, locking of $rPND balances, and metadata rewrites. Clawback is the one thing an attacker could not do, because it is permanently foreclosed.

**Open:** whether one key controls both assets — [OQ-22](../open-questions.md#oq-22). A shared issuer means one compromise reaches both; separate issuers halve that blast radius and double the custody surface.

## 7.2 Supply risk

**Documented:** $rPND circulating supply cannot exceed `MaximumAmount`; the ledger rejects mints past it. Because the cap applies to circulation rather than cumulative issuance, returning tokens to the issuer frees headroom to mint again, so the cap bounds how much exists at once, not how much has ever been created. $PND has no on-ledger cap at all — its 100B target is issuer policy, and the operational trust limit constrains a single line, not total issuance. Circulating $PND is auditable after the fact through `gateway_balances`, which reports the issuer's obligations.

The asymmetry is worth stating plainly for holders: an $rPND holder's dilution risk is bounded by consensus, while a $PND holder's is bounded by issuer discipline and observable only by watching obligations — [OQ-06](../open-questions.md#oq-06).

**Open:** how the 100B target is published and monitored, and how the two tokens' supply figures relate — [OQ-21](../open-questions.md#oq-21).

## 7.3 Freeze and lock risk

**Documented:** $rPND is created with `tfMPTCanLock`, so the issuer can lock balances — and because capability flags are one-way, that authority is permanent for the life of the issuance. The issuer cannot later renounce it, which is the opposite of the clawback guarantee holders get on the same token. $PND has no freeze-related flags configured, so the ledger's default freeze capability remains available to the issuer.

**Open:** whether $rPND should be created with lock authority at all, given it cannot be revoked; the authorization required to invoke it; and whether $PND should adopt No Freeze — [OQ-08](../open-questions.md#oq-08).

## 7.4 Metadata trust

**Documented:** the on-ledger blob is mutable and replaced wholesale by `MPTokenIssuanceSet`; freezing it with `tifMPTMetadata` is available but not used. The off-ledger TOML is whatever the domain serves, and is only meaningfully bound to the issuer while the AccountRoot `Domain` matches the host.

Consequence: an attacker controlling DNS or hosting for the issuer domain can misrepresent the tokens to any XLS-26 consumer without touching the ledger. Nothing detects that today — [OQ-10](../open-questions.md#oq-10), [5.5](05-metadata-and-discovery.md#55-consistency-between-the-two-mechanisms).

## 7.5 Impersonation

**Documented:** $PND's identity is (code, issuer address), so anyone may issue a token with the code `PND` from their own account. For $rPND, the ticker `RPND` is metadata and is likewise not unique; only the `MPTokenIssuanceID` is. Publishing the issuer address through a verified domain is the primary defense, which makes [TD-02](../open-questions.md#td-02) a security task and not just a polish task.

## 7.6 Network dependency

**Documented:** $rPND requires the MPTokens amendment. Testnet is flagged as lacking it; mainnet is flagged as having it, unverified — [TD-03](../open-questions.md#td-03). Devnet is periodically reset by Ripple, and `rpnd/docs/issuance.md` warns against reusing dev keys on mainnet.

## 7.7 Disclosure

**Documented:** [`.github/SECURITY.md`](https://github.com/PondProtocol/.github/blob/main/SECURITY.md) is an org-wide policy covering every repository, including this one. It prescribes private reporting over public issues, states that the code is unaudited with no bug bounty, supports only `main`, and asks reporters never to include a seed or `.env` contents. `pnd` carries a repo-level policy as well.

**Open:** the org policy's own owner TODOs — enabling private vulnerability reporting, publishing a monitored security address, and committing to response timelines — and whether issuance procedures and key custody get an external review before mainnet — [OQ-19](../open-questions.md#oq-19).

## 7.8 Unquantified risk

**Open:** the relationship between the two assets is undefined ([OQ-03](../open-questions.md#oq-03)), so the risk a holder of one takes on with respect to the other cannot be described yet. This section stays incomplete until that decision lands.
